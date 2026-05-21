
const fs = require('fs');

const admin = require('firebase-admin');

const APPROVAL_VALUE = 'YAMAHA_ABSOLUTE_HYBRID_MAPLE_EXACT_STOCK_HEADS_1';

const APPROVAL_ENV = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE;

const planFile = 'src/legacyPrint/reviewPlans/yamaha-absolute-hybrid-maple-exact-stock-head-write-plan.json';

const confirmationFile = 'src/legacyPrint/reviewPlans/yamaha-absolute-hybrid-maple-exact-stock-head-write-confirmation.json';

const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));

if (!plan?.records?.length) {

  throw new Error(`No records found in write plan: ${planFile}`);

}

const isApproved = APPROVAL_ENV === APPROVAL_VALUE;

if (!isApproved) {

  const dryRun = {

    status: 'YAMAHA_ABSOLUTE_HYBRID_MAPLE_EXACT_STOCK_HEADS_DRY_RUN_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    planFile,

    approvalRequiredEnv: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${APPROVAL_VALUE}`,

    providedApprovalEnv: APPROVAL_ENV || '',

    plannedWriteCount: plan.records.length,

    firestoreWrites: 0,

    records: plan.records.map(record => ({

      id: record.id,

      label: record.label,

      update: record.update

    }))

  };

  fs.writeFileSync(confirmationFile, JSON.stringify(dryRun, null, 2));

  console.log(JSON.stringify(dryRun, null, 2));

  process.exit(0);

}

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

async function main() {

  const writes = [];

  for (const record of plan.records) {

    const ref = db.collection(plan.collectionName || 'snareReferenceDrums').doc(record.id);

    const update = {

      ...record.update,

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      legacyPrintReviewUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

      legacyPrintReviewUpdateType: 'exactSourceBackedStockHeads',

      legacyPrintReviewSourcePlan: planFile

    };

    await ref.set(update, { merge: true });

    writes.push({

      id: record.id,

      label: record.label,

      updateKeys: Object.keys(update).filter(key => key !== 'updatedAt' && key !== 'legacyPrintReviewUpdatedAt'),

      stockBatterHead: record.update.stockBatterHead,

      stockResoHead: record.update.stockResoHead

    });

  }

  const confirmation = {

    status: 'YAMAHA_ABSOLUTE_HYBRID_MAPLE_EXACT_STOCK_HEADS_WRITE_COMPLETE',

    generatedAt: new Date().toISOString(),

    planFile,

    collectionName: plan.collectionName || 'snareReferenceDrums',

    approvalEnv: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${APPROVAL_VALUE}`,

    actualWriteCount: writes.length,

    firestoreWrites: writes.length,

    records: writes

  };

  fs.writeFileSync(confirmationFile, JSON.stringify(confirmation, null, 2));

  console.log(JSON.stringify(confirmation, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

