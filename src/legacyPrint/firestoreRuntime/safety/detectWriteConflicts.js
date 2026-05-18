export function detectWriteConflicts({

  existingDocument,

  incomingDocument

}) {

  if (!existingDocument) {

    return { hasConflict: false, reason: null };

  }

  const existingUpdated = existingDocument.updatedAt || null;

  const incomingUpdated = incomingDocument.updatedAt || null;

  // Basic optimistic locking rule

  if (existingUpdated && incomingUpdated && existingUpdated !== incomingUpdated) {

    return {

      hasConflict: true,

      reason: 'updatedAt mismatch (possible concurrent modification)'

    };

  }

  return { hasConflict: false, reason: null };

}