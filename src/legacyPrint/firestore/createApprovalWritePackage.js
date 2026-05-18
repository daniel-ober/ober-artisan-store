export function createApprovalWritePackage(approvalResult = {}) {

  if (!approvalResult.success) {

    return {

      success: false,

      reason: 'Approval result was not successful.',

      writes: []

    };

  }

  const {

    updatedDocument,

    auditLogEntry,

    rebuildQueueEntry,

    validationReport

  } = approvalResult;

  const writes = [

    {

      operation: 'set',

      collection: 'legacyPrintDrumReferences',

      documentId: updatedDocument.id,

      data: updatedDocument

    },

    {

      operation: 'set',

      collection: 'legacyPrintAdminAuditLog',

      documentId: auditLogEntry.id,

      data: auditLogEntry

    },

    {

      operation: 'set',

      collection: 'legacyPrintRebuildQueue',

      documentId: rebuildQueueEntry.id,

      data: rebuildQueueEntry

    }

  ];

  if (validationReport) {

    writes.push({

      operation: 'set',

      collection: 'legacyPrintValidationReports',

      documentId: validationReport.id,

      data: validationReport

    });

  }

  return {

    success: true,

    writes

  };

}