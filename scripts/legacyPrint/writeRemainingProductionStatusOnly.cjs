
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const approval = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE;

const requiredApproval = 'remaining-production-status-only-1';

if (approval !== requiredApproval) {

  throw new Error(`Missing approval. Expected LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${requiredApproval}`);

}

const patchPlanPath =

  'src/legacyPrint/reviewPlans/remaining-production-status-only-patch-plan.json';

const reviewDir = 'src/legacyPrint/reviewPlans';

const patchPlan = JSON.parse(fs.readFileSync(patchPlanPath, 'utf8'));

const patches = patchPlan.patches || [];

if (patches.length !== 1) {

  throw new Error(`Expected exactly 1 patch, found ${patches.length}`);

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

      productionStatus: 'YES',

      productionStatusConfidence: 'Fallback / Current source-page reviewed',

      productionStatusFallbackApplied: true,

      productionStatusFallbackKey: 'MAPEX_EQUINOX_CURRENT_SOURCE_LISTING',

      productionStatusFallbackReason:

        'Mapex Equinox is listed on current Mapex BP Design Lab snare product pages; production status was the only remaining stock-readiness blocker.',

      productionStatusNeedsVerification: true,

      legacyPrintStockReadinessUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

      legacyPrintStockReadinessUpdateSource:

        'remaining-production-status-only-patch-plan.json',

      legacyPrintStockReadinessUpdateType:

        'REMAINING_PRODUCTION_STATUS_ONLY_PATCH'

    };

    batch.set(ref, updates, { merge: true });

    writeLog.push({

      id: patch.id,

      companyName: patch.companyName,

      lineSeries: patch.lineSeries,

      modelName: patch.modelName,

      productionStatus: updates.productionStatus,

      updateType: updates.legacyPrintStockReadinessUpdateType

    });

  }

  await batch.commit();

  const outFile = path.join(

    reviewDir,

    'remaining-production-status-only-write-confirmation.json'

  );

  const output = {

    status: 'REMAINING_PRODUCTION_STATUS_ONLY_WRITE_CONFIRMATION',

    generatedAt: new Date().toISOString(),

    sourcePatchPlanFile: patchPlanPath,

    collectionName: 'snareReferenceDrums',

    firestoreWritesPerformed: true,

    approval,

    summary: {

      intendedWriteCount: patches.length,

      actualWriteCount: writeLog.length,

      batchCount: 1,

      updateType: 'REMAINING_PRODUCTION_STATUS_ONLY_PATCH'

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

