
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const ROOT = process.cwd();

const COLLECTION = 'snareReferenceDrums';

const SCRIPT_NAME = 'scripts/legacyPrint/applyTamaSlpStudioMapleControlledWrite.cjs';

const PLAN_PATH = path.join(ROOT, 'src/legacyPrint/reviewPlans/tama-slp-studio-maple-lmp1465f-controlled-write-plan.json');

const DRY_RUN_PATH = path.join(ROOT, 'src/legacyPrint/reviewPlans/tama-slp-studio-maple-lmp1465f-controlled-write-dry-run.json');

const OUT_PATH = path.join(ROOT, 'src/legacyPrint/reviewPlans/tama-slp-studio-maple-lmp1465f-controlled-write-confirmation.json');

const EXPECTED_DOC_ID =

  'tama_s-l-p_s-l-p-studio-maple-lmp1465f-14x6-5_14x6-5_ply_maple_lacquer_wood-hoops_lmp1465f_6cb7788e';

const REQUIRED_ENV = 'CONFIRM_TAMA_SLP_STUDIO_MAPLE_LMP1465F_WRITE';

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function fail(message) {

  console.error(`Refusing to write. ${message}`);

  process.exit(1);

}

function normalize(value) {

  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

}

function buildDiff(before, afterPatch) {

  const diff = {};

  for (const [key, after] of Object.entries(afterPatch)) {

    const beforeValue = before[key] === undefined || before[key] === '' ? null : before[key];

    if (JSON.stringify(beforeValue) !== JSON.stringify(after)) {

      diff[key] = {

        before: beforeValue,

        after,

      };

    }

  }

  return diff;

}

(async () => {

  if (process.env[REQUIRED_ENV] !== 'true') {

    fail(`Missing ${REQUIRED_ENV}=true`);

  }

  const plan = readJson(PLAN_PATH);

  const dryRun = readJson(DRY_RUN_PATH);

  if (dryRun?.summary?.targetCount !== 1) fail('dryRun.summary.targetCount must be 1.');

  if (dryRun?.summary?.exactExpectedDocMatches !== 1) fail('dryRun.summary.exactExpectedDocMatches must be 1.');

  if (dryRun?.summary?.safeToWriteCount !== 1) fail('dryRun.summary.safeToWriteCount must be 1.');

  const resolved = dryRun.resolved || [];

  if (resolved.length !== 1) fail(`Expected 1 resolved row, got ${resolved.length}.`);

  const row = resolved[0];

  const candidate = row.candidates?.[0];

  if (!candidate) fail('Missing dry-run candidate.');

  if (candidate.id !== EXPECTED_DOC_ID) fail(`Unexpected doc ID: ${candidate.id}`);

  if (row.status !== 'EXPECTED_DOC_ID_MATCH_DRY_RUN_ONLY') fail(`Unexpected dry-run status: ${row.status}`);

  if (row.matchCount !== 1) fail(`Expected matchCount 1, got ${row.matchCount}.`);

  const planRecord = (plan.records || []).find(record => {

    return (

      normalize(record?.recordSelector?.companyName) === normalize(row?.selector?.companyName) &&

      normalize(record?.recordSelector?.modelName) === normalize(row?.selector?.modelName)

    );

  });

  if (!planRecord) fail('Could not match dry-run row to controlled write plan record.');

  const writeIntent = planRecord.writeIntent || planRecord.patch || {};

  if (!Object.keys(writeIntent).length) fail('Missing writeIntent/patch from plan.');

  if ('bearingEdgeDetail' in writeIntent) fail('Blocked: writeIntent includes bearingEdgeDetail.');

  if ('shellTreatment' in writeIntent) fail('Blocked: writeIntent includes shellTreatment.');

  if ('finishTreatment' in writeIntent) fail('Blocked: writeIntent includes finishTreatment.');

  if (!admin.apps.length) admin.initializeApp();

  const db = admin.firestore();

  const FieldValue = admin.firestore.FieldValue;

  const docRef = db.collection(COLLECTION).doc(EXPECTED_DOC_ID);

  const beforeSnap = await docRef.get();

  if (!beforeSnap.exists) fail(`Document does not exist: ${EXPECTED_DOC_ID}`);

  const before = beforeSnap.data();

  const patch = {

    ...writeIntent,

    coreFieldEnrichmentAppliedByScript: SCRIPT_NAME,

    coreFieldEnrichmentAppliedAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

  };

  await docRef.set(patch, { merge: true });

  const afterSnap = await docRef.get();

  const after = afterSnap.data();

  const confirmation = {

    status: 'TAMA_SLP_STUDIO_MAPLE_LMP1465F_CONTROLLED_WRITE_CONFIRMATION',

    collectionName: COLLECTION,

    appliedAt: new Date().toISOString(),

    script: SCRIPT_NAME,

    expectedDocId: EXPECTED_DOC_ID,

    actualWriteCount: 1,

    skipped: [],

    selector: row.selector,

    appliedFields: Object.keys(writeIntent).sort(),

    proposedDiffBeforeWrite: buildDiff(before, writeIntent),

    afterCoreFields: {

      companyName: after.companyName,

      modelName: after.modelName,

      plyCount: after.plyCount,

      shellLayup: after.shellLayup,

      shellMaterial1: after.shellMaterial1,

      shellMaterial2: after.shellMaterial2,

      shellMaterial3: after.shellMaterial3,

      shellThicknessMm: after.shellThicknessMm,

      reinforcementRings: after.reinforcementRings,

      hoopType: after.hoopType,

      stockSnareWires: after.stockSnareWires,

      finishType: after.finishType,

      bearingEdgeDetail: after.bearingEdgeDetail ?? '',

      shellTreatment: after.shellTreatment ?? '',

      coreFieldEnrichmentStatus: after.coreFieldEnrichmentStatus,

      coreFieldEnrichmentBatch: after.coreFieldEnrichmentBatch,

      coreFieldEnrichmentNeedsReview: after.coreFieldEnrichmentNeedsReview,

      coreFieldEnrichmentConfidence: after.coreFieldEnrichmentConfidence,

      coreFieldEnrichmentSourceUrls: after.coreFieldEnrichmentSourceUrls,

    },

    nextStep:

      'Rerun the scoped Maple 14x6.5 post-enrichment comparison and confirm the Tama S.L.P. Studio Maple record now exposes shell layup, corrected shell materials, Sound Focus Rings, wood hoops, finish, and stock wires without writing bearing edge detail.',

  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(confirmation, null, 2));

  console.log(JSON.stringify({

    status: confirmation.status,

    actualWriteCount: confirmation.actualWriteCount,

    outPath: path.relative(ROOT, OUT_PATH),

  }, null, 2));

})();

