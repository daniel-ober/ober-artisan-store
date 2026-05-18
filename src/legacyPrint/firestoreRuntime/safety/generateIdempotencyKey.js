import crypto from 'crypto';

export function generateIdempotencyKey(input = {}) {

  const {

    documentId,

    actionType = 'approveResearchPatch',

    patchId,

    engineVersion = '0.1.0'

  } = input;

  const raw = `${documentId}:${actionType}:${patchId || 'no_patch'}:${engineVersion}`;

  return crypto.createHash('sha256').update(raw).digest('hex');

}