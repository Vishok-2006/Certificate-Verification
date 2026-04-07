const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCertificateFingerprint, hashCertificateFields } = require('../utils/certificateData');

test('buildCertificateFingerprint trims and orders certificate fields', () => {
  const fingerprint = buildCertificateFingerprint({
    certificateId: ' CERT-001 ',
    studentName: ' Ada Lovelace ',
    registerNumber: ' REG-42 ',
    course: ' Computer Science ',
  });

  assert.equal(fingerprint, 'CERT-001|Ada Lovelace|REG-42|Computer Science');
});

test('hashCertificateFields is deterministic for identical input', () => {
  const payload = {
    certificateId: 'CERT-001',
    studentName: 'Ada Lovelace',
    registerNumber: 'REG-42',
    course: 'Computer Science',
  };

  assert.equal(hashCertificateFields(payload), hashCertificateFields(payload));
});
