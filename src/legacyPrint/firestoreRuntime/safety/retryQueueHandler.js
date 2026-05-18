export async function retryQueueHandler({

  firestore,

  failedWritePackage,

  reason = 'unknown_failure'

}) {

  const retryEntry = {

    id: `retry_${Date.now()}`,

    type: 'approvalWriteRetry',

    reason,

    status: 'queued',

    createdAt: new Date().toISOString(),

    payload: failedWritePackage

  };

  await firestore

    .collection('legacyPrintRetryQueue')

    .doc(retryEntry.id)

    .set(retryEntry, { merge: true });

  return {

    success: true,

    retryQueued: true,

    retryId: retryEntry.id

  };

}