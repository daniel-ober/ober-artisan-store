
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const ROOT = process.cwd();

const PLAN_PATH = path.join(

  ROOT,

  'src/legacyPrint/reviewPlans/maple-14x65-first-controlled-write-plan.json'

);

const DRY_RUN_PATH = path.join(

  ROOT,

  'src/legacyPrint/reviewPlans/maple-14x65-first-controlled-write-dry-run.json'

);

const OUT_PATH = path.join(

  ROOT,

  'src/legacyPrint/reviewPlans/maple-14x65-first-controlled-write-confirmation.json'

);

const COLLECTION = 'snareReferenceDrums';

const EXPECTED_DOC_IDS = new Set([

  'candc-drums-usa_12th-and-vine_12th-and-vine-maple-poplar-maple-14x6-5_14x6-5_ply_maple_poplar_maple_6_los-angeles-bearin_2b0ac625',

  'ludwig_legacy-maple_legacy-maple-6-5x14_14x6-5_ply_maple-poplar_6_ludwig-usa-bearing-edge-not-specified_ludwig-snare-bed_dd2df442',

]);

if (process.env.CONFIRM_MAPLE_14X65_FIRST_CORE_ENRICHMENT_WRITE !== 'true') {

  console.error(

    'Refusing to write. Set CONFIRM_MAPLE_14X65_FIRST_CORE_ENRICHMENT_WRITE=true to apply this controlled patch.'

  );

  process.exit(1);

}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const selectorKey = selector =>

  `${selector?.companyName || ''}|||${selector?.modelName || ''}`;

const plan = readJson(PLAN_PATH);

const dryRun = readJson(DRY_RUN_PATH);

if (dryRun?.summary?.safeToWriteCount !== 2) {

  console.error('Refusing to write. dryRun.summary.safeToWriteCount is not 2.');

  console.error(JSON.stringify(dryRun?.summary || {}, null, 2));

  process.exit(1);

}

const planBySelector = new Map();

for (const record of plan.records || []) {

  const key = selectorKey(record.recordSelector);

  planBySelector.set(key, record);

}

const resolved = Array.isArray(dryRun.resolved) ? dryRun.resolved : [];

if (resolved.length !== 2) {

  console.error(`Refusing to write. Expected 2 resolved rows, found ${resolved.length}.`);

  process.exit(1);

}

const writeTargets = [];

for (const row of resolved) {

  if (row.status !== 'EXACT_SINGLE_MATCH_DRY_RUN_ONLY') {

    console.error(`Refusing to write. Bad row status: ${row.status}`);

    process.exit(1);

  }

  if (!Array.isArray(row.candidates) || row.candidates.length !== 1) {

    console.error(`Refusing to write. Expected exactly 1 candidate for ${row.selector?.modelName}.`);

    process.exit(1);

  }

  const candidate = row.candidates[0];

  if (!EXPECTED_DOC_IDS.has(candidate.id)) {

    console.error(`Refusing to write. Unexpected doc id: ${candidate.id}`);

    process.exit(1);

  }

  const plannedRecord = planBySelector.get(selectorKey(row.selector));

  if (!plannedRecord?.writeIntent) {

    console.error(`Refusing to write. Missing writeIntent in plan for ${row.selector?.companyName} — ${row.selector?.modelName}`);

    process.exit(1);

  }

  writeTargets.push({

    selector: row.selector,

    id: candidate.id,

    patch: plannedRecord.writeIntent,

    confidence: plannedRecord.confidence || {},

    sourceUrls: plannedRecord.sourceUrls || [],

    proposedDiff: candidate.proposedDiff || {},

  });

}

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const FieldValue = admin.firestore.FieldValue;

(async () => {

  const confirmation = {

    status: 'MAPLE_14X65_FIRST_CORE_ENRICHMENT_WRITE_CONFIRMATION',

    collectionName: COLLECTION,

    planPath: path.relative(ROOT, PLAN_PATH),

    dryRunPath: path.relative(ROOT, DRY_RUN_PATH),

    actualWriteCount: 0,

    skipped: [],

    written: [],

    createdAt: new Date().toISOString(),

  };

  for (const target of writeTargets) {

    const ref = db.collection(COLLECTION).doc(target.id);

    const snap = await ref.get();

    if (!snap.exists) {

      confirmation.skipped.push({

        id: target.id,

        reason: 'DOC_NOT_FOUND_AT_WRITE_TIME',

      });

      continue;

    }

    const before = snap.data() || {};

    const writePatch = {

      ...target.patch,

      coreFieldEnrichmentConfidence: target.confidence,

      coreFieldEnrichmentSourceUrls: target.sourceUrls,

      coreFieldEnrichmentAppliedAt: FieldValue.serverTimestamp(),

      updatedAt: FieldValue.serverTimestamp(),

    };

    await ref.set(writePatch, { merge: true });

    confirmation.actualWriteCount += 1;

    confirmation.written.push({

      id: target.id,

      selector: target.selector,

      writtenFields: Object.keys(writePatch)

        .filter(key => key !== 'coreFieldEnrichmentAppliedAt' && key !== 'updatedAt')

        .sort(),

      proposedDiff: target.proposedDiff,

      beforeCoreFields: {

        plyCount: before.plyCount ?? '',

        shellLayup: before.shellLayup ?? '',

        shellMaterial1: before.shellMaterial1 ?? '',

        shellMaterial2: before.shellMaterial2 ?? '',

        shellMaterial3: before.shellMaterial3 ?? '',

        reinforcementRings: before.reinforcementRings ?? '',

        bearingEdgeDetail: before.bearingEdgeDetail ?? '',

        shellTreatment: before.shellTreatment ?? '',

        hoopType: before.hoopType ?? '',

        lugCount: before.lugCount ?? '',

        throwOffModel: before.throwOffModel ?? '',

        stockHeadBrand: before.stockHeadBrand ?? '',

      },

    });

  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(confirmation, null, 2));

  console.log(JSON.stringify({

    status: confirmation.status,

    actualWriteCount: confirmation.actualWriteCount,

    skippedCount: confirmation.skipped.length,

    outPath: path.relative(ROOT, OUT_PATH),

  }, null, 2));

})();

