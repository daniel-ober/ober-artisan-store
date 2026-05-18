import { generateIdempotencyKey } from './generateIdempotencyKey.js';

import { detectWriteConflicts } from './detectWriteConflicts.js';

import { enforceIdempotency } from './enforceIdempotency.js';

import { executeWritePackage } from '../executeWritePackage.js';

import { retryQueueHandler } from './retryQueueHandler.js';

export async function runSafeApprovalTransaction({

  firestore,

  writePackage,

  existingDocument,

  incomingDocument,

  patchId,

  engineVersion

}) {

  const idempotencyKey = generateIdempotencyKey({

    documentId: incomingDocument?.id,

    patchId,

    engineVersion

  });

  // STEP 1 — idempotency check

  const idem = await enforceIdempotency({

    firestore,

    idempotencyKey,

    targetDocumentId: incomingDocument?.id

  });

  if (idem.alreadyProcessed) {

    return {

      success: true,

      skipped: true,

      reason: 'duplicate_idempotent_request',

      idempotencyKey

    };

  }

  // STEP 2 — conflict detection

  const conflictCheck = detectWriteConflicts({

    existingDocument,

    incomingDocument

  });

  if (conflictCheck.hasConflict) {

    await retryQueueHandler({

      firestore,

      failedWritePackage: writePackage,

      reason: conflictCheck.reason

    });

    return {

      success: false,

      conflict: true,

      reason: conflictCheck.reason,

      idempotencyKey

    };

  }

  // STEP 3 — transactional commit

  try {

    const result = await executeWritePackage({

      firestore,

      writePackage

    });

    return {

      success: true,

      committed: true,

      idempotencyKey,

      result

    };

  } catch (err) {

    await retryQueueHandler({

      firestore,

      failedWritePackage: writePackage,

      reason: err.message

    });

    return {

      success: false,

      committed: false,

      error: err.message,

      idempotencyKey

    };

  }

}