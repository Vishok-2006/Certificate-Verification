const nodemailer = require('nodemailer');
const { env } = require('../config/env');

const getTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const sendCertificateIssuedEmail = async ({ to, certificateId, verifyUrl, recipientName }) => {
  if (!to) {
    return { delivered: false, reason: 'missing-recipient' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { delivered: false, reason: 'smtp-not-configured' };
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: `Your blockchain certificate ${certificateId} is ready`,
    text: `Hello ${recipientName}, your certificate has been issued. Verify it here: ${verifyUrl}`,
  });

  return { delivered: true };
};

module.exports = { sendCertificateIssuedEmail };
