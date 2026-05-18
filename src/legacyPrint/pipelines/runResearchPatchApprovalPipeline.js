import { approveResearchPatch } from '../workflows/approveResearchPatch.js';

import { createValidationReport } from '../reports/createValidationReport.js';

import { createApprovalWritePackage } from '../firestore/createApprovalWritePackage.js';

export function runResearchPatchApprovalPipeline({

  baseDocument,

  researchPatch,

  performedBy = 'system',

  reason = 'Approved research patch',

  validatorVersion = '1.0.0',

  engineVersion = '0.1.0',

  calibrationProfileId = 'snare_default_v1'

}) {

  const approvalResult = approveResearchPatch({

    baseDocument,

    researchPatch,

    performedBy,

    reason,

    engineVersion,

    calibrationProfileId

  });

  if (!approvalResult.success) {

    return {

      success: false,

      stage: approvalResult.stage,

      validation: approvalResult.validation,

      writePackage: {

        success: false,

        writes: []

      }

    };

  }

  const validationReport = createValidationReport({

    drumReferenceId: approvalResult.updatedDocument.id,

    validatorVersion,

    validationResult: approvalResult.validation

  });

  const writePackage = createApprovalWritePackage({

    ...approvalResult,

    validationReport

  });

  return {

    success: true,

    updatedDocument: approvalResult.updatedDocument,

    validation: approvalResult.validation,

    validationReport,

    auditLogEntry: approvalResult.auditLogEntry,

    rebuildQueueEntry: approvalResult.rebuildQueueEntry,

    writePackage

  };

}