
import admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const snap = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'SONOR')

  .limit(5)

  .get();

for (const doc of snap.docs) {

  const d = doc.data();

  console.log(JSON.stringify({

    id: doc.id,

    companyName: d.companyName,

    lineSeries: d.lineSeries,

    modelName: d.modelName,

    shell: d.shell,

    stockHardware: d.stockHardware,

    stockSnareSystem: d.stockSnareSystem

  }, null, 2));

}

