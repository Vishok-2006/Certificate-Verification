const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateBatchIssuePayload,
  validateCertificateId,
  validateIssueCertificatePayload,
  validateLoginPayload,
  validateRegisterPayload,
} = require('../middleware/validation');

test('validateRegisterPayload normalizes verifier registration input', () => {
  const payload = validateRegisterPayload({
    name: '  Jane Doe  ',
    email: ' JANE@example.com ',
    password: 'password123',
    institutionName: ' Northwind University ',
  });

  assert.deepEqual(payload, {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    institutionName: 'Northwind University',
    walletAddress: '',
    role: 'verifier',
    adminRegistrationKey: '',
  });
});

test('validateLoginPayload rejects invalid email addresses', () => {
  assert.throws(
    () => validateLoginPayload({ email: 'not-an-email', password: 'password123' }),
    /valid email address/
  );
});

test('validateCertificateId accepts safe identifiers', () => {
  assert.equal(validateCertificateId('CERT-2026-001'), 'CERT-2026-001');
});

test('validateIssueCertificatePayload rejects short course names', () => {
  assert.throws(
    () =>
      validateIssueCertificatePayload({
        certificateId: 'CERT-2026-001',
        recipientName: 'Ada Lovelace',
        recipientIdentifier: 'REG-1',
        course: 'A',
      }),
    /Course must be between 2 and 120 characters/
  );
});

test('validateBatchIssuePayload accepts bounded certificate batches', () => {
  const result = validateBatchIssuePayload({
    certificates: [
      {
        certificateId: 'CERT-2026-010',
        recipientName: 'Katherine Johnson',
        recipientIdentifier: 'REG-2026-010',
        course: 'Data Science',
      },
    ],
  });

  assert.equal(result.certificates.length, 1);
  assert.equal(result.certificates[0].certificateId, 'CERT-2026-010');
});
