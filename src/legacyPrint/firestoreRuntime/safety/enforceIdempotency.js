export async function enforceIdempotency({

  firestore,

  idempotencyKey,

  targetDocumentId

}) {

  const ref = firestore

    .collection('legacyPrintIdempotencyLog')

    .doc(idempotencyKey);

  const existing = await ref.get();

  if (existing.exists) {

    return {

      alreadyProcessed: true,

      idempotencyKey

    };

  }

  await ref.set({

    idempotencyKey,

    targetDocumentId,

    createdAt: new Date().toISOString()

  });

  return {

    alreadyProcessed: false,

    idempotencyKey

  };

}