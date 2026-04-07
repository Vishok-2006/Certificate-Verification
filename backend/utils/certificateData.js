const crypto = require('crypto');

const buildCertificateFingerprint = ({ certificateId, studentName, registerNumber, course }) => {
  return [certificateId, studentName, registerNumber, course]
    .map((value) => String(value || '').trim())
    .join('|');
};

const hashBuffer = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const hashCertificateFields = (payload) => hashBuffer(Buffer.from(buildCertificateFingerprint(payload), 'utf8'));

module.exports = {
  buildCertificateFingerprint,
  hashBuffer,
  hashCertificateFields,
};
