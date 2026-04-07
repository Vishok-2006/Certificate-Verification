const AuditLog = require('../models/AuditLog');

const logAuditEvent = async ({ action, entityType, entityId, userId, ipAddress, metadata }) => {
  return AuditLog.create({
    action,
    entityType,
    entityId: entityId ? String(entityId) : null,
    userId: userId || null,
    ipAddress: ipAddress || null,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
  });
};

module.exports = { logAuditEvent };
