
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const approval = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE;

const requiredApproval = 'ludwig-head-only-exact-8';

if (approval !== requiredApproval) {

  throw new Error(`Missing approval. Expected LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${requiredApproval}`);

}

const patchPlanPath = 'src/legacyPrint/reviewPlans/ludwig-head-only-exact-head-patch-plan.json';

const reviewDir = 'src/legacyPrint/reviewPlans';

const patchPlan = JSON.parse(fs.readFileSync(patchPlanPath, 'utf8'));

const patches = patchPlan.patches || [];

if (patches.length !== 8) {

  throw new Error(`Expected exactly 8 Ludwig patches, found ${patches.length}`);

}

if (!admin.apps.length) {

  admin.initializeApp({

    credential: admin.credential.applicationDefault()

  });

}

(async () => {

  const db = admin.firestore();

  const batch = db.batch();

  const writeLog = [];

  for (const patch of patches) {

    const ref = db.collection('snareReferenceDrums').doc(patch.id);

    const updates = {

      stockBatterHead: patch.updates.stockBatterHead,

      stockBatterHeadConfidence: patch.updates.stockBatterHeadConfidence,

      stockResoHead: patch.updates.stockResoHead,

      stockResoHeadConfidence: patch.updates.stockResoHeadConfidence,

      stockHeadFallbackApplied: true,

      stockHeadFallbackKey: patch.updates.stockHeadFallbackKey,

      stockHeadFallbackReason: patch.updates.stockHeadFallbackReason,

      stockHeadNeedsVerification: true,

      stockHeadSourceConfirmed: false,

      stockReadinessTier: patch.updates.stockReadinessTier,

      legacyPrintStockReadinessUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

      legacyPrintStockReadinessUpdateSource:

        patch.updates.legacyPrintStockReadinessUpdateSource,

      legacyPrintStockReadinessUpdateType:

        patch.updates.legacyPrintStockReadinessUpdateType

    };

    batch.set(ref, updates, { merge: true });

    writeLog.push({

      id: patch.id,

      companyName: patch.companyName,

      lineSeries: patch.lineSeries,

      modelName: patch.modelName,

      stockBatterHead: updates.stockBatterHead,

      stockResoHead: updates.stockResoHead,

      stockReadinessTier: updates.stockReadinessTier,

      updateType: updates.legacyPrintStockReadinessUpdateType

    });

  }

  await batch.commit();

  const outFile = path.join(

    reviewDir,

    'ludwig-head-only-exact-head-write-confirmation.json'

  );

  const output = {

    status: 'LUDWIG_HEAD_ONLY_EXACT_HEAD_WRITE_CONFIRMATION',

    generatedAt: new Date().toISOString(),

    sourcePatchPlanFile: patchPlanPath,

    collectionName: 'snareReferenceDrums',

    firestoreWritesPerformed: true,

    approval,

    summary: {

      intendedWriteCount: patches.length,

      actualWriteCount: writeLog.length,

      batchCount: 1,

      updateType: 'LUDWIG_HEAD_ONLY_EXACT_SOURCE_BACKED_FALLBACK_PATCH'

    },

    writeLog

  };

  fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

  console.log(JSON.stringify({

    outFile,

    status: output.status,

    intendedWriteCount: output.summary.intendedWriteCount,

    actualWriteCount: output.summary.actualWriteCount,

    updateType: output.summary.updateType

  }, null, 2));

})().catch((error) => {

  console.error(error);

  process.exit(1);

});

