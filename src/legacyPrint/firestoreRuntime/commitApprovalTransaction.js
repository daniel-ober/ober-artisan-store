import { runResearchPatchApprovalPipeline } from '../pipelines/runResearchPatchApprovalPipeline.js';

import { runSafeApprovalTransaction } from './safety/runSafeApprovalTransaction.js';

export async function commitApprovalTransaction({

  firestore,

  baseDocument,

  researchPatch,

  performedBy = 'system',

  reason = 'Approval commit',

  validatorVersion = '1.0.0',

  engineVersion = '0.1.0',

  calibrationProfileId = 'snare_default_v1'

}) {

  const pipelineResult = runResearchPatchApprovalPipeline({

    firestore,

    baseDocument,

    researchPatch,

    performedBy,

    reason,

    validatorVersion,

    engineVersion,

    calibrationProfileId

  });

  if (!pipelineResult.success) {

    return pipelineResult;

  }

  const safeResult = await runSafeApprovalTransaction({

    firestore,

    writePackage: pipelineResult.writePackage,

    existingDocument: baseDocument,

    incomingDocument: pipelineResult.updatedDocument,

    patchId: researchPatch?.id,

    engineVersion

  });

  return {

    success: safeResult.success,

    pipeline: pipelineResult,

    transaction: safeResult

  };

}