const express = require('express');
const { auth, adminOnly, issuerOrAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { certificateUpload, safeRemoveFile, toPublicFilePath } = require('../services/uploadService');
const { buildRateLimiter } = require('../middleware/security');
const { env } = require('../config/env');
const { getCertificateStats, getVerificationReport, issueCertificate, issueCertificatesBatch, listIssuedCertificates, revokeCertificate, verifyCertificateByFile, verifyCertificateById } = require('../services/certificateService');
const { validateBatchIssuePayload, validateCertificateIdParam, validateIssueCertificatePayload, validateRevokePayload, withValidation } = require('../middleware/validation');

const router = express.Router();
const verificationLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: env.verificationRateLimitMax,
  keyPrefix: 'verify',
});

router.post(
  '/issue',
  auth,
  issuerOrAdmin,
  certificateUpload.single('file'),
  withValidation(validateIssueCertificatePayload),
  asyncHandler(async (req, res) => {
    const certificate = await issueCertificate({
      ...req.body,
      file: req.file,
      fileUrl: toPublicFilePath(req.file),
      actor: req.user,
      ipAddress: req.ip,
    });
    res.status(201).json(certificate);
  })
);

router.post(
  '/batch-issue',
  auth,
  issuerOrAdmin,
  withValidation(validateBatchIssuePayload),
  asyncHandler(async (req, res) => {
    const result = await issueCertificatesBatch({ certificates: req.body.certificates, actor: req.user, ipAddress: req.ip });
    res.status(result.failed ? 207 : 201).json(result);
  })
);

router.get(
  '/',
  auth,
  issuerOrAdmin,
  asyncHandler(async (req, res) => {
    const certificates = await listIssuedCertificates({ actor: req.user, query: req.query.q || '' });
    res.json(certificates);
  })
);

router.get(
  '/stats',
  auth,
  asyncHandler(async (req, res) => {
    const stats = await getCertificateStats({ actor: req.user });
    res.json(stats);
  })
);

router.get(
  '/verify/:id',
  verificationLimiter,
  validateCertificateIdParam,
  asyncHandler(async (req, res) => {
    res.json(await verifyCertificateById({ certificateId: req.params.id, ipAddress: req.ip }));
  })
);

router.post(
  '/verify-file',
  verificationLimiter,
  certificateUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      res.json(await verifyCertificateByFile({ filePath: toPublicFilePath(req.file), ipAddress: req.ip }));
    } finally {
      safeRemoveFile(toPublicFilePath(req.file));
    }
  })
);

router.get(
  '/:id/report',
  validateCertificateIdParam,
  asyncHandler(async (req, res) => {
    res.json(await getVerificationReport(req.params.id));
  })
);

router.post(
  '/:id/revoke',
  auth,
  adminOnly,
  validateCertificateIdParam,
  withValidation(validateRevokePayload),
  asyncHandler(async (req, res) => {
    res.json(await revokeCertificate({ certificateId: req.params.id, actor: req.user, reason: req.body.reason, ipAddress: req.ip }));
  })
);

module.exports = router;
