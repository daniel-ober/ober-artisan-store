export function createAuditLogEntry({

  actionType,

  targetCollection,

  targetDocumentId,

  previousDocument,

  updatedDocument,

  performedBy,

  reason

}) {

  return {

    id: `audit_${Date.now()}`,

    actionType,

    targetCollection,

    targetDocumentId,

    performedBy,

    reason,

    previousDocument,

    updatedDocument,

    createdAt: new Date().toISOString()

  };

}