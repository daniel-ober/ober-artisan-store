
const fs = require('fs');

const admin = require('firebase-admin');

const APPROVAL = 'PROMOTE_REMAINING_HEADS_WIRES_DO_NOT_BLOCK_16';

const auditFile = 'src/legacyPrint/reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.json';

const confirmationFile = 'src/legacyPrint/reviewPlans/remaining-engine-promotable-write-confirmation.json';

const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

const records = audit.additionalPromotableRecords || [];

const approved = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE === APPROVAL;

const updateFor = r => ({

  legacyPrintEnginePromotable: true,

  legacyPrintEngineReadinessTier: r.classification,

  legacyPrintEnginePromotionStatus: 'promoted',

  legacyPrintEnginePromotionRule: 'stockHeadsAndSnareWiresDoNotBlockShellPromotion',

  legacyPrintEnginePromotionSourceAudit: auditFile,

  legacyPrintDefaultHeadAssumptionsApplied: true,

  legacyPrintEngineAssumptions: {

    stockHeadsBlockPromotion: false,

    stockSnareWiresBlockPromotion: false,

    productionStatusBlocksPromotion: false,

    defaultBatterHeadIfMissing: 'Remo Coated Ambassador-style single-ply coated batter',

    defaultResoHeadIfMissing: 'Remo clear/hazy Ambassador-style snare-side resonant head',

    defaultSnareWireBehaviorIfMissing: 'engineDefaultSnareWireAssumption',

    promotionReason: r.classification,

    nonBlockingMissingAtPromotion: r.nonBlockingMissing || []

  }

});

if (!records.length) throw new Error('No additional promotable records found.');

if (!approved) {

  const dryRun = {

    status: 'REMAINING_ENGINE_PROMOTABLE_RECORDS_DRY_RUN_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    approvalRequiredEnv: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=${APPROVAL}`,

    plannedWriteCount: records.length,

    firestoreWrites: 0,

    sample: records.slice(0, 20).map(r => ({

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

    status: 'REMAINING_ENGINE_PROMOTABLE_RECORDS_WRITE_COMPLETE',

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

