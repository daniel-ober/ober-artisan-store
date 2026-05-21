
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const ROOT = process.cwd();

const COLLECTION = 'snareReferenceDrums';

const PLAN_PATH = path.join(ROOT, 'src/legacyPrint/reviewPlans/tama-slp-studio-maple-lmp1465f-controlled-write-plan.json');

const OUT_PATH = path.join(ROOT, 'src/legacyPrint/reviewPlans/tama-slp-studio-maple-lmp1465f-controlled-write-dry-run.json');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const normalize = value =>

  String(value || '')

    .toLowerCase()

    .replace(/[™®©]/g, '')

    .replace(/["']/g, '')

    .replace(/\s+/g, ' ')

    .trim();

const pick = (obj, keys) => {

  for (const key of keys) {

    if (obj?.[key] !== undefined && obj?.[key] !== null && String(obj[key]).trim() !== '') {

      return obj[key];

    }

  }

  return '';

};

const summarizeCurrentCoreFields = data => ({

  companyName: pick(data, ['companyName', 'company']),

  modelName: pick(data, ['modelName', 'model', 'name']),

  plyCount: data.plyCount ?? '',

  shellLayup: data.shellLayup ?? '',

  shellMaterial1: data.shellMaterial1 ?? '',

  shellMaterial2: data.shellMaterial2 ?? '',

  shellMaterial3: data.shellMaterial3 ?? '',

  shellThicknessMm: data.shellThicknessMm ?? data.shellThickness ?? '',

  reinforcementRings: data.reinforcementRings ?? '',

  hoopType: data.hoopType ?? '',

  lugCount: data.lugCount ?? '',

  lugType: data.lugType ?? '',

  stockSnareWires: data.stockSnareWires ?? '',

  finishType: data.finishType ?? '',

  bearingEdgeDetail: data.bearingEdgeDetail ?? '',

  shellTreatment: data.shellTreatment ?? '',

  coreFieldEnrichmentStatus: data.coreFieldEnrichmentStatus ?? '',

  coreFieldEnrichmentBatch: data.coreFieldEnrichmentBatch ?? '',

  coreFieldEnrichmentNeedsReview: data.coreFieldEnrichmentNeedsReview ?? '',

});

const buildDiff = (before, patch) => {

  const diff = {};

  for (const key of Object.keys(patch).sort()) {

    const beforeValue = before?.[key] ?? null;

    const afterValue = patch[key];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {

      diff[key] = {

        before: beforeValue,

        after: afterValue,

      };

    }

  }

  return diff;

};

(async () => {

  const plan = readJson(PLAN_PATH);

  const targets = plan.records || [];

  if (targets.length !== 1) {

    throw new Error(`Expected exactly 1 controlled target. Found ${targets.length}.`);

  }

  const resolved = [];

  for (const target of targets) {

    const selector = target.recordSelector || {};

    const expectedDocId = target.expectedDocId;

    const patch = target.writeIntent || {};

    if (!expectedDocId) {

      throw new Error('Missing expectedDocId in controlled write plan.');

    }

    if (!Object.keys(patch).length) {

      throw new Error(`Missing writeIntent for ${selector.companyName} — ${selector.modelName}`);

    }

    if ('bearingEdgeDetail' in patch || 'shellTreatment' in patch) {

      throw new Error('Refusing dry run: patch includes excluded bearingEdgeDetail or shellTreatment.');

    }

    const doc = await db.collection(COLLECTION).doc(expectedDocId).get();

    if (!doc.exists) {

      resolved.push({

        selector,

        expectedDocId,

        matchCount: 0,

        status: 'EXPECTED_DOC_ID_NOT_FOUND_DO_NOT_WRITE',

        candidates: [],

        proposedPatch: patch,

      });

      continue;

    }

    const data = doc.data();

    const companyMatch = normalize(pick(data, ['companyName', 'company'])) === normalize(selector.companyName);

    const modelMatch = normalize(pick(data, ['modelName', 'model', 'name'])) === normalize(selector.modelName);

    const status =

      companyMatch && modelMatch

        ? 'EXPECTED_DOC_ID_MATCH_DRY_RUN_ONLY'

        : 'EXPECTED_DOC_ID_FOUND_SELECTOR_MISMATCH_DO_NOT_WRITE';

    resolved.push({

      selector,

      expectedDocId,

      matchCount: companyMatch && modelMatch ? 1 : 0,

      status,

      candidates: [

        {

          id: doc.id,

          selectorMatch: {

            companyMatch,

            modelMatch,

          },

          currentCoreFields: summarizeCurrentCoreFields(data),

          proposedDiff: buildDiff(data, patch),

        },

      ],

      proposedPatch: patch,

      confidence: target.confidence || {},

      sourceUrls: target.sourceUrls || [],

    });

  }

  const out = {

    status: 'TAMA_SLP_STUDIO_MAPLE_LMP1465F_CONTROLLED_WRITE_DRY_RUN_NO_WRITES',

    collectionName: COLLECTION,

    planPath: path.relative(ROOT, PLAN_PATH),

    generatedAt: new Date().toISOString(),

    summary: {

      targetCount: resolved.length,

      exactExpectedDocMatches: resolved.filter(row => row.status === 'EXPECTED_DOC_ID_MATCH_DRY_RUN_ONLY').length,

      noMatches: resolved.filter(row => row.matchCount === 0).length,

      safeToWriteCount: resolved.filter(row => row.status === 'EXPECTED_DOC_ID_MATCH_DRY_RUN_ONLY').length,

    },

    resolved,

    nextStep: 'Review proposed diff. Only after review, run a separate controlled apply script with explicit confirmation.',

  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  console.log(JSON.stringify(out.summary, null, 2));

  console.log('\nRESOLVED TARGETS');

  console.table(resolved.map(row => ({

    status: row.status,

    matches: row.matchCount,

    company: row.selector.companyName,

    model: row.selector.modelName,

    id: row.expectedDocId,

  })));

  console.log(`\nWrote ${path.relative(ROOT, OUT_PATH)}`);

})().catch(error => {

  console.error(error);

  process.exit(1);

});

