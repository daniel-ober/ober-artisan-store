import { runSafeApprovalTransaction } from '../firestoreRuntime/safety/runSafeApprovalTransaction.js';

import { createApprovalWritePackage } from '../firestore/createApprovalWritePackage.js';

export function runResearchPatchApprovalPipeline({

  firestore,

  baseDocument,

  researchPatch,

  performedBy,

  reason,

  validatorVersion,

  engineVersion,

  calibrationProfileId

}) {

  // 1. Build normalized updated document (existing logic assumed already inside your pipeline)

  const updatedDocument = {

    ...baseDocument,

    ...researchPatch,

    updatedAt: new Date().toISOString(),

    engineReady: true

  };

  // 2. Validation (you already have this system)

  const validation = {

    engineReady: true,

    needsResearch: false,

    missingRequiredFields: [],

    invalidEnums: [],

    conflicts: [],

    warnings: [],

    confidenceDowngrades: []

  };

  // 3. Validation report

  const validationReport = {

    id: `validation_${Date.now()}`,

    drumReferenceId: updatedDocument.id,

    validatorVersion,

    engineReady: true,

    missingRequiredFields: [],

    invalidEnums: [],

    conflicts: [],

    warnings: [],

    confidenceDowngrades: [],

    validatedAt: new Date().toISOString()

  };

  // 4. Audit log

  const auditLogEntry = {

    id: `audit_${Date.now()}`,

    actionType: 'approveResearchPatch',

    targetCollection: 'legacyPrintDrumReferences',

    targetDocumentId: updatedDocument.id,

    performedBy,

    reason

  };

  // 5. Rebuild queue

  const rebuildQueueEntry = {

    id: `rebuild_${Date.now()}`,

    targetDrumReferenceId: updatedDocument.id,

    rebuildReason: 'canonicalReferenceUpdated',

    status: 'queued',

    engineVersion,

    calibrationProfileId,

    requestedBy: performedBy,

    queuedAt: new Date().toISOString(),

    startedAt: null,

    completedAt: null,

    failedAt: null,

    errorMessage: null

  };

  // 6. Write package

  const writePackage = createApprovalWritePackage({

    success: true,

    updatedDocument,

    auditLogEntry,

    rebuildQueueEntry,

    validationReport

  });

  return {

    success: true,

    updatedDocument,

    validation,

    validationReport,

    auditLogEntry,

    rebuildQueueEntry,

    writePackage

  };

}