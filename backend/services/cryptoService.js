const crypto = require('crypto');
const { env } = require('../config/env');

const sha256Hex = (value) => crypto.createHash('sha256').update(value).digest('hex');

const sha256Buffer = (buffer) => sha256Hex(buffer);

const buildMetadataDigest = (payload) => sha256Hex(JSON.stringify(payload));

const encryptValue = (value) => {
  if (!value) {
    return null;
  }

  if (!env.encryptionKey) {
    return value;
  }

  const key = crypto.createHash('sha256').update(env.encryptionKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${encrypted.toString('hex')}`;
};

const decryptValue = (value) => {
  if (!value) {
    return null;
  }

  if (!env.encryptionKey || !value.includes('.')) {
    return value;
  }

  const [ivHex, tagHex, encryptedHex] = value.split('.');
  const key = crypto.createHash('sha256').update(env.encryptionKey).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};

const generateCertificateId = () => `CERT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

module.exports = {
  buildMetadataDigest,
  decryptValue,
  encryptValue,
  generateCertificateId,
  sha256Buffer,
  sha256Hex,
};
