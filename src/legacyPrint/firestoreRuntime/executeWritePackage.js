export async function executeWritePackage({

  firestore,

  writePackage

}) {

  if (!writePackage?.success) {

    throw new Error('Invalid write package');

  }

  return await firestore.runTransaction(async (transaction) => {

    const results = [];

    for (const write of writePackage.writes) {

      const ref = firestore.collection(write.collection).doc(write.documentId);

      if (write.operation === 'set') {

        transaction.set(ref, write.data, { merge: true });

        results.push({ type: 'set', collection: write.collection, id: write.documentId });

      }

      if (write.operation === 'delete') {

        transaction.delete(ref);

        results.push({ type: 'delete', collection: write.collection, id: write.documentId });

      }

    }

    return {

      success: true,

      writtenCount: results.length,

      operations: results,

      committedAt: new Date().toISOString()

    };

  });

}