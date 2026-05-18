
import admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const snap = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'DW / PDP')

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

    stockSnareSystem: d.stockSnareSystem,

    diameter: d.diameter,

    depth: d.depth,

    shellConstruction: d.shellConstruction,

    shellMaterial1: d.shellMaterial1,

    shellThicknessMm: d.shellThicknessMm,

    bearingEdge: d.bearingEdge,

    hoopType: d.hoopType

  }, null, 2));

}

