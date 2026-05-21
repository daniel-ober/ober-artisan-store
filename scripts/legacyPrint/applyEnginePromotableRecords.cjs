
const fs = require('fs');

const admin = require('firebase-admin');

const APPROVAL = 'PROMOTE_HEADS_DO_NOT_BLOCK_350';

const auditFile = 'src/legacyPrint/reviewPlans/legacyprint-promotion-audit-heads-do-not-block.json';

const confirmationFile = 'src/legacyPrint/reviewPlans/engine-promotable-records-write-confirmation.json';

const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

const records = audit.promotableRecords || [];

const approved = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE === APPROVAL;

const updateFor = r => ({

  legacyPrintEnginePromotable: true,

  legacyPrintEngineReadinessTier: r.classification,

  legacyPrintEnginePromotionStatus: 'promoted',

  legacyPrintEnginePromotionRule: 'stockHeadsDoNotBlockShellPromotion',

  legacyPrintEnginePromotionSourceAudit: auditFile,

  legacyPrintDefaultHeadAssumptionsApplied: !r.stockBatterHead || !r.stockResoHead,

  legacyPrintEngineAssumptions: {

    stockHeadsBlockPromotion: false,

    defaultBatterHeadIfMissing: 'Remo Coated Ambassador-style single-ply coated batter',

    defaultResoHeadIfMissing: 'Remo clear/hazy Ambassador-style snare-side resonant head',

    promotionReason: r.classification,

    missingAtPromotion: r.missing || []

  }

});

if (!records.length) throw new Error('No promotable records found.');

if (!approved) {

  const dryRun = {

    status: 'ENGINE_PROMOTABLE_RECORDS_DRY_RUN_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    approvalRequiredEnv: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${APPROVAL}`,

    plannedWriteCount: records.length,

    firestoreWrites: 0,

    byClass: audit.summary?.byClass || {},

    sample: records.slice(0, 15).map(r => ({

      id: r.id,

      company: r.company,

      model: r.model,

      classification: r.classification,

      update: updateFor(r)

    }))

  };

  fs.writeFileSync(confirmationFile, JSON.stringify(dryRun, null, 2));

  console.log(JSON.stringify(dryRun, null, 2));

  process.exit(0);

}

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

async function main() {

  const writes = [];

  for (const r of records) {

    await db.collection('snareReferenceDrums').doc(r.id).set({

      ...updateFor(r),

      legacyPrintEnginePromotedAt: admin.firestore.FieldValue.serverTimestamp(),

      updatedAt: admin.firestore.FieldValue.serverTimestamp()

    }, { merge: true });

    writes.push({

      id: r.id,

      company: r.company,

      model: r.model,

      classification: r.classification

    });

  }

  const confirmation = {

    status: 'ENGINE_PROMOTABLE_RECORDS_WRITE_COMPLETE',

    generatedAt: new Date().toISOString(),

    approvalEnv: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${APPROVAL}`,

    actualWriteCount: writes.length,

    firestoreWrites: writes.length,

    sourceAudit: auditFile,

    records: writes

  };

  fs.writeFileSync(confirmationFile, JSON.stringify(confirmation, null, 2));

  console.log(JSON.stringify(confirmation, null, 2));

}

main().catch(err => {

  console.error(err);

  process.exit(1);

});

