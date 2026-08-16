const { AuditLog } = require('../models');

async function recordAudit({ actorId, action, entityType, entityId, metadata = {} }) {
  if (!actorId || !entityId) return null;

  return AuditLog.create({
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  });
}

module.exports = { recordAudit };
