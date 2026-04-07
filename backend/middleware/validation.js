const { createHttpError } = require('../utils/httpError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CERTIFICATE_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9-_]{3,63}$/;
const IDENTIFIER_REGEX = /^[A-Za-z0-9][A-Za-z0-9/_-]{2,63}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const assertStringLength = (value, fieldName, min, max) => {
  if (value.length < min || value.length > max) {
    throw createHttpError(400, `${fieldName} must be between ${min} and ${max} characters`);
  }
};

const validateCertificateId = (value) => {
  const certificateId = sanitizeString(value);
  if (!CERTIFICATE_ID_REGEX.test(certificateId)) {
    throw createHttpError(400, 'Certificate ID must be 4-64 characters and contain only letters, numbers, hyphens, or underscores');
  }

  return certificateId;
};

const validateIdentifier = (value, fieldName = 'Identifier') => {
  const identifier = sanitizeString(value);
  if (!IDENTIFIER_REGEX.test(identifier)) {
    throw createHttpError(400, `${fieldName} must be 3-64 characters and contain only letters, numbers, slashes, underscores, or hyphens`);
  }

  return identifier;
};

const validateRole = (value, fallback = 'verifier') => {
  const role = sanitizeString(value) || fallback;
  if (!['admin', 'issuer', 'verifier'].includes(role)) {
    throw createHttpError(400, 'Role must be admin, issuer, or verifier');
  }

  return role;
};

const validateRegisterPayload = (payload) => {
  const name = sanitizeString(payload.name);
  const email = sanitizeString(payload.email).toLowerCase();
  const password = sanitizeString(payload.password);
  const institutionName = sanitizeString(payload.institutionName);
  const walletAddress = sanitizeString(payload.walletAddress);
  const role = validateRole(payload.role, 'verifier');
  const adminRegistrationKey = sanitizeString(payload.adminRegistrationKey);

  assertStringLength(name, 'Name', 2, 80);
  assertStringLength(password, 'Password', 8, 128);
  if (!EMAIL_REGEX.test(email)) {
    throw createHttpError(400, 'A valid email address is required');
  }
  if (institutionName) {
    assertStringLength(institutionName, 'Institution name', 2, 120);
  }
  if (walletAddress && !WALLET_REGEX.test(walletAddress)) {
    throw createHttpError(400, 'Wallet address must be a valid EVM address');
  }

  return { name, email, password, institutionName, walletAddress, role, adminRegistrationKey };
};

const validateLoginPayload = (payload) => {
  const email = sanitizeString(payload.email).toLowerCase();
  const password = sanitizeString(payload.password);
  if (!EMAIL_REGEX.test(email)) {
    throw createHttpError(400, 'A valid email address is required');
  }
  assertStringLength(password, 'Password', 8, 128);
  return { email, password };
};

const validateIssueCertificatePayload = (payload) => {
  const certificateId = payload.certificateId ? validateCertificateId(payload.certificateId) : null;
  const recipientName = sanitizeString(payload.recipientName || payload.studentName);
  const recipientIdentifier = validateIdentifier(payload.recipientIdentifier || payload.registerNumber, 'Recipient identifier');
  const recipientEmail = sanitizeString(payload.recipientEmail).toLowerCase();
  const course = sanitizeString(payload.course);
  const institutionName = sanitizeString(payload.institutionName);
  const chain = sanitizeString(payload.chain) || 'sepolia';

  assertStringLength(recipientName, 'Recipient name', 2, 120);
  assertStringLength(course, 'Course', 2, 120);
  if (institutionName) {
    assertStringLength(institutionName, 'Institution name', 2, 120);
  }
  if (recipientEmail && !EMAIL_REGEX.test(recipientEmail)) {
    throw createHttpError(400, 'Recipient email must be valid');
  }
  if (!['sepolia', 'polygon-amoy'].includes(chain)) {
    throw createHttpError(400, 'Chain must be sepolia or polygon-amoy');
  }

  return {
    certificateId,
    recipientName,
    recipientIdentifier,
    recipientEmail: recipientEmail || null,
    course,
    institutionName: institutionName || null,
    chain,
  };
};

const validateBatchIssuePayload = (payload) => {
  if (!Array.isArray(payload.certificates) || payload.certificates.length === 0) {
    throw createHttpError(400, 'At least one certificate is required');
  }
  if (payload.certificates.length > 50) {
    throw createHttpError(400, 'Batch issuance is limited to 50 certificates');
  }

  return { certificates: payload.certificates.map((certificate) => validateIssueCertificatePayload(certificate)) };
};

const validateCertificateIdParam = (req, res, next) => {
  req.params.id = validateCertificateId(req.params.id);
  next();
};

const validateCreateUserPayload = (payload) => validateRegisterPayload(payload);

const validateRevokePayload = (payload) => ({
  reason: sanitizeString(payload.reason) || 'Revoked by administrator',
});

const withValidation = (validator, source = 'body') => (req, res, next) => {
  req[source] = validator(req[source]);
  next();
};

module.exports = {
  sanitizeString,
  validateBatchIssuePayload,
  validateCertificateId,
  validateCertificateIdParam,
  validateCreateUserPayload,
  validateIssueCertificatePayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateRevokePayload,
  withValidation,
};
