const fs = require('fs');
const QRCode = require('qrcode');
const { Op, fn, col, literal } = require('sequelize');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const { env } = require('../config/env');
const { createHttpError } = require('../utils/httpError');
const { fetchCertificateByIdOnChain, getExplorerBaseUrl, issueCertificateOnChain, revokeCertificateOnChain, verifyCertificateOnChain } = require('./blockchainService');
const { safeRemoveFile, toAbsoluteUploadPath } = require('./uploadService');
const { buildMetadataDigest, decryptValue, encryptValue, generateCertificateId, sha256Buffer } = require('./cryptoService');
const { uploadFileToIpfs } = require('./ipfsService');
const { sendCertificateIssuedEmail } = require('./mailService');
const { logAuditEvent } = require('./auditLogService');

const buildVerifyUrl = (certificateId) => `${env.publicVerifyBaseUrl.replace(/\/$/, '')}/${certificateId}`;

const parseFraudFlags = (value) => {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return [];
  }
};

const buildFraudAssessment = ({ fileBytes, metadataDigest }) => {
  const flags = [];
  if (fileBytes && fileBytes < 25 * 1024) {
    flags.push('very-small-file');
  }
  if (metadataDigest.startsWith('0000')) {
    flags.push('digest-pattern-review');
  }

  return {
    score: Math.min(flags.length * 18, 100),
    flags,
  };
};

const buildCertificateHash = ({ filePath, metadataDigest }) => {
  if (filePath) {
    const fileBuffer = fs.readFileSync(toAbsoluteUploadPath(filePath));
    return `0x${sha256Buffer(fileBuffer)}`;
  }

  return `0x${metadataDigest}`;
};

const sanitizeCertificate = (certificate) => {
  const json = certificate.toJSON ? certificate.toJSON() : certificate;
  return {
    ...json,
    recipientEmail: decryptValue(json.recipientEmailEncrypted),
    metadata: json.metadataJson ? JSON.parse(json.metadataJson) : null,
    fraudFlags: parseFraudFlags(json.fraudFlags),
    explorerBaseUrl: getExplorerBaseUrl(json.chain),
  };
};

const buildMetadataPayload = ({ certificateId, recipientName, recipientIdentifier, recipientEmail, course, institutionName, issuerName, chain, fileMimeType, ipfsCid }) => ({
  certificateId,
  recipientName,
  recipientIdentifier,
  recipientEmail: recipientEmail || null,
  course,
  institutionName,
  issuerName,
  chain,
  fileMimeType: fileMimeType || null,
  ipfsCid: ipfsCid || null,
  issuedAt: new Date().toISOString(),
});

const issueCertificate = async ({ actor, ipAddress, file, ...payload }) => {
  const certificateId = payload.certificateId || generateCertificateId();
  const existingCertificate = await Certificate.findOne({
    where: {
      [Op.or]: [{ certificateId }, payload.certificateHash ? { certificateHash: payload.certificateHash } : null].filter(Boolean),
    },
  });
  if (existingCertificate) {
    if (payload.fileUrl) {
      safeRemoveFile(payload.fileUrl);
    }
    throw createHttpError(400, 'Duplicate certificate detected');
  }

  let ipfs = { cid: null, url: null };
  if (payload.fileUrl && file) {
    ipfs = await uploadFileToIpfs({
      filePath: toAbsoluteUploadPath(payload.fileUrl),
      fileName: file.originalname,
      contentType: file.mimetype,
    });
  }

  const metadata = buildMetadataPayload({
    certificateId,
    recipientName: payload.recipientName,
    recipientIdentifier: payload.recipientIdentifier,
    recipientEmail: payload.recipientEmail,
    course: payload.course,
    institutionName: payload.institutionName || actor.institutionName || 'CertiBlock Issuer',
    issuerName: actor.name,
    chain: payload.chain,
    fileMimeType: file?.mimetype,
    ipfsCid: ipfs.cid,
  });
  const metadataDigest = buildMetadataDigest(metadata);
  const certificateHash = buildCertificateHash({ filePath: payload.fileUrl, metadataDigest });
  const duplicateHash = await Certificate.findOne({ where: { certificateHash } });
  if (duplicateHash) {
    if (payload.fileUrl) {
      safeRemoveFile(payload.fileUrl);
    }
    throw createHttpError(400, 'This certificate fingerprint has already been issued');
  }

  const fraud = buildFraudAssessment({ fileBytes: file?.size, metadataDigest });
  const certificate = await Certificate.create({
    certificateId,
    recipientName: payload.recipientName,
    recipientIdentifier: payload.recipientIdentifier,
    recipientEmailEncrypted: encryptValue(payload.recipientEmail),
    course: payload.course,
    institutionName: metadata.institutionName,
    issuerName: actor.name,
    certificateHash,
    metadataDigest,
    metadataJson: JSON.stringify(metadata),
    ipfsCid: ipfs.cid,
    ipfsUrl: ipfs.url,
    fileUrl: payload.fileUrl,
    fileMimeType: file?.mimetype || null,
    chain: payload.chain,
    status: 'draft',
    issuedByUserId: actor.id,
    fraudScore: fraud.score,
    fraudFlags: JSON.stringify(fraud.flags),
  });

  try {
    const chainReceipt = await issueCertificateOnChain({
      chain: payload.chain,
      certificateHash,
      certificateId,
      metadataURI: ipfs.url || buildVerifyUrl(certificateId),
      metadataDigest,
    });
    const qrCode = await QRCode.toDataURL(buildVerifyUrl(certificateId));

    await certificate.update({
      status: 'issued',
      qrCode,
      txHash: chainReceipt.hash,
      contractAddress: chainReceipt.contractAddress,
      lastError: null,
    });

    await sendCertificateIssuedEmail({
      to: payload.recipientEmail,
      certificateId,
      verifyUrl: buildVerifyUrl(certificateId),
      recipientName: payload.recipientName,
    });

    await logAuditEvent({
      action: 'CERTIFICATE_ISSUED',
      entityType: 'certificate',
      entityId: certificateId,
      userId: actor.id,
      ipAddress,
      metadata: { chain: payload.chain, txHash: chainReceipt.hash },
    });

    return sanitizeCertificate(await certificate.reload());
  } catch (error) {
    await certificate.update({ status: 'failed', lastError: error.message });
    throw error;
  }
};

const issueCertificatesBatch = async ({ certificates, actor, ipAddress }) => {
  const results = [];
  for (const certificate of certificates) {
    try {
      const record = await issueCertificate({ ...certificate, actor, ipAddress, file: null, fileUrl: null });
      results.push({ certificateId: record.certificateId, status: 'issued', txHash: record.txHash });
    } catch (error) {
      results.push({ certificateId: certificate.certificateId || 'auto-generated', status: 'failed', error: error.message });
    }
  }

  return {
    total: results.length,
    issued: results.filter((item) => item.status === 'issued').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results,
  };
};

const listIssuedCertificates = async ({ actor, query }) => {
  const where = {};
  if (actor.role === 'issuer') {
    where.issuedByUserId = actor.id;
  }
  if (query) {
    where[Op.or] = [
      { certificateId: { [Op.iLike]: `%${query}%` } },
      { recipientName: { [Op.iLike]: `%${query}%` } },
      { recipientIdentifier: { [Op.iLike]: `%${query}%` } },
      { course: { [Op.iLike]: `%${query}%` } },
    ];
  }

  const certificates = await Certificate.findAll({ where, order: [['createdAt', 'DESC']] });
  return certificates.map(sanitizeCertificate);
};

const validateCertificateAgainstBlockchain = async (certificate) => {
  const onChain = await verifyCertificateOnChain({ chain: certificate.chain, certificateHash: certificate.certificateHash });
  if (!onChain.exists) {
    return { valid: false, status: 'invalid', message: 'Certificate was not found on-chain' };
  }
  if (onChain.revoked || certificate.status === 'revoked') {
    return { valid: false, status: 'revoked', message: 'Certificate has been revoked', blockchain: onChain };
  }
  if (onChain.metadataDigest !== certificate.metadataDigest) {
    return { valid: false, status: 'invalid', message: 'Certificate metadata does not match blockchain proof', blockchain: onChain };
  }

  await certificate.increment('verificationCount');
  await certificate.update({ lastVerifiedAt: new Date() });

  return {
    valid: true,
    status: 'valid',
    certificate: sanitizeCertificate(await certificate.reload()),
    blockchain: {
      ...onChain,
      explorerUrl: certificate.txHash ? `${getExplorerBaseUrl(certificate.chain)}/tx/${certificate.txHash}` : null,
      issuedAt: onChain.issuedAt ? new Date(onChain.issuedAt * 1000).toISOString() : null,
      revokedAt: onChain.revokedAt ? new Date(onChain.revokedAt * 1000).toISOString() : null,
    },
  };
};

const verifyCertificateById = async ({ certificateId, ipAddress }) => {
  const certificate = await Certificate.findOne({ where: { certificateId } });
  if (!certificate) {
    const onChain = await fetchCertificateByIdOnChain({ chain: env.defaultChain, certificateId }).catch(() => null);
    if (!onChain?.exists) {
      throw createHttpError(404, 'Certificate not found');
    }
    throw createHttpError(404, 'Certificate metadata is missing from the off-chain index');
  }

  const verification = await validateCertificateAgainstBlockchain(certificate);
  await logAuditEvent({
    action: 'CERTIFICATE_VERIFIED',
    entityType: 'certificate',
    entityId: certificateId,
    ipAddress,
    metadata: { mode: 'certificate-id', valid: verification.valid },
  });
  return verification;
};

const verifyCertificateByFile = async ({ filePath, ipAddress }) => {
  const fileBuffer = fs.readFileSync(toAbsoluteUploadPath(filePath));
  const uploadedHash = `0x${sha256Buffer(fileBuffer)}`;
  const certificate = await Certificate.findOne({ where: { certificateHash: uploadedHash } });
  if (!certificate) {
    throw createHttpError(404, 'No matching certificate found for this document');
  }

  const verification = await validateCertificateAgainstBlockchain(certificate);
  await logAuditEvent({
    action: 'CERTIFICATE_VERIFIED',
    entityType: 'certificate',
    entityId: certificate.certificateId,
    ipAddress,
    metadata: { mode: 'file-upload', valid: verification.valid },
  });
  return verification;
};

const revokeCertificate = async ({ certificateId, actor, reason, ipAddress }) => {
  const certificate = await Certificate.findOne({ where: { certificateId } });
  if (!certificate) {
    throw createHttpError(404, 'Certificate not found');
  }
  if (certificate.status === 'revoked') {
    throw createHttpError(400, 'Certificate has already been revoked');
  }

  const chainReceipt = await revokeCertificateOnChain({ chain: certificate.chain, certificateHash: certificate.certificateHash, reason });
  await certificate.update({
    status: 'revoked',
    revokedAt: new Date(),
    revokedReason: reason,
    revokedByUserId: actor.id,
    txHash: chainReceipt.hash,
  });
  await logAuditEvent({
    action: 'CERTIFICATE_REVOKED',
    entityType: 'certificate',
    entityId: certificateId,
    userId: actor.id,
    ipAddress,
    metadata: { reason },
  });

  return sanitizeCertificate(await certificate.reload());
};

const getCertificateStats = async ({ actor }) => {
  const scope = actor.role === 'issuer' ? { issuedByUserId: actor.id } : {};

  const [
    totalIssued,
    totalRevoked,
    verificationAggregate,
    recentCertificates,
    chainBreakdown,
    monthlyIssuance,
    userCounts,
    auditEvents,
  ] = await Promise.all([
    Certificate.count({ where: { ...scope, status: 'issued' } }),
    Certificate.count({ where: { ...scope, status: 'revoked' } }),
    Certificate.findOne({ attributes: [[fn('COALESCE', fn('SUM', col('verificationCount')), 0), 'totalVerifications']], where: scope, raw: true }),
    Certificate.findAll({ where: scope, order: [['createdAt', 'DESC']], limit: 8 }),
    Certificate.findAll({ attributes: ['chain', [fn('COUNT', col('id')), 'count']], where: scope, group: ['chain'], raw: true }),
    Certificate.findAll({ attributes: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'month'], [fn('COUNT', col('id')), 'count']], where: scope, group: [literal('month')], order: [[literal('month'), 'ASC']], limit: 6, raw: true }).catch(() => []),
    actor.role === 'admin'
      ? require('../models/User').findAll({ attributes: ['role', [fn('COUNT', col('id')), 'count']], group: ['role'], raw: true })
      : Promise.resolve([]),
    AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
  ]);

  return {
    totalIssued,
    totalRevoked,
    totalVerifications: Number(verificationAggregate?.totalVerifications || 0),
    activeUsers: userCounts.reduce((acc, item) => ({ ...acc, [item.role]: Number(item.count) }), {}),
    recentCertificates: recentCertificates.map(sanitizeCertificate),
    chainBreakdown: chainBreakdown.map((item) => ({ chain: item.chain, count: Number(item.count) })),
    monthlyIssuance: monthlyIssuance.map((item) => ({ month: item.month, count: Number(item.count) })),
    auditTrail: auditEvents.map((item) => item.toJSON()),
  };
};

const getVerificationReport = async (certificateId) => {
  const verification = await verifyCertificateById({ certificateId });
  return {
    generatedAt: new Date().toISOString(),
    result: verification,
  };
};

module.exports = {
  buildCertificateHash,
  getCertificateStats,
  getVerificationReport,
  issueCertificate,
  issueCertificatesBatch,
  listIssuedCertificates,
  revokeCertificate,
  verifyCertificateByFile,
  verifyCertificateById,
};
