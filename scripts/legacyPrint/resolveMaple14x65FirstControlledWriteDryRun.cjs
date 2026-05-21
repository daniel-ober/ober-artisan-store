
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const COLLECTION = 'snareReferenceDrums';

const PLAN_PATH = path.resolve(

  'src/legacyPrint/reviewPlans/maple-14x65-first-controlled-write-plan.json'

);

const OUT_PATH = path.resolve(

  'src/legacyPrint/reviewPlans/maple-14x65-first-controlled-write-dry-run.json'

);

const normalize = value =>

  String(value || '')

    .trim()

    .toLowerCase()

    .replace(/[“”]/g, '"')

    .replace(/[‘’]/g, "'")

    .replace(/\s+/g, ' ');

const pick = (record, keys) => {

  for (const key of keys) {

    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {

      return record[key];

    }

  }

  return '';

};

const getRecordIdentity = record => ({

  companyName: pick(record, ['companyName', 'company', 'brand']),

  modelName: pick(record, ['modelName', 'model', 'name', 'title']),

  diameter: pick(record, ['diameter', 'diameterInches']),

  depth: pick(record, ['depth', 'depthInches']),

  shellMaterial1: pick(record, ['shellMaterial1', 'shellMaterial', 'material']),

  shellConstruction: pick(record, ['shellConstruction', 'construction']),

  shellThicknessMm: pick(record, ['shellThicknessMm', 'shellThickness', 'thicknessMm']),

});

const compactDiff = (before, patch) => {

  const diff = {};

  for (const [key, afterValue] of Object.entries(patch)) {

    const beforeValue = before[key] === undefined ? null : before[key];

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

  if (!admin.apps.length) admin.initializeApp();

  const db = admin.firestore();

  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));

  const records = Array.isArray(plan.records) ? plan.records : [];

  const snap = await db.collection(COLLECTION).get();

  const docs = snap.docs.map(doc => ({

    id: doc.id,

    data: doc.data(),

  }));

  const resolved = records.map(target => {

    const selector = target.recordSelector || {};

    const writeIntent = target.writeIntent || {};

    const selectorCompany = normalize(selector.companyName);

    const selectorModel = normalize(selector.modelName);

    const candidates = docs

      .filter(doc => {

        const identity = getRecordIdentity(doc.data);

        return (

          normalize(identity.companyName) === selectorCompany &&

          normalize(identity.modelName) === selectorModel

        );

      })

      .map(doc => {

        const identity = getRecordIdentity(doc.data);

        return {

          id: doc.id,

          identity,

          proposedDiff: compactDiff(doc.data, writeIntent),

          currentCoreFields: {

            plyCount: doc.data.plyCount || '',

            shellLayup: doc.data.shellLayup || '',

            shellMaterial1: doc.data.shellMaterial1 || '',

            shellMaterial2: doc.data.shellMaterial2 || '',

            shellMaterial3: doc.data.shellMaterial3 || '',

            reinforcementRings: doc.data.reinforcementRings || '',

            bearingEdgeDetail: doc.data.bearingEdgeDetail || '',

            hoopType: doc.data.hoopType || '',

            lugCount: doc.data.lugCount || '',

            throwOffModel: doc.data.throwOffModel || '',

            stockHeadBrand: doc.data.stockHeadBrand || '',

            coreFieldEnrichmentStatus: doc.data.coreFieldEnrichmentStatus || '',

            coreFieldEnrichmentBatch: doc.data.coreFieldEnrichmentBatch || '',

            coreFieldEnrichmentNeedsReview: doc.data.coreFieldEnrichmentNeedsReview ?? '',

          },

        };

      });

    const status =

      candidates.length === 1

        ? 'EXACT_SINGLE_MATCH_DRY_RUN_ONLY'

        : candidates.length === 0

          ? 'NO_MATCH_DO_NOT_WRITE'

          : 'MULTIPLE_MATCHES_DO_NOT_WRITE';

    return {

      status,

      matchCount: candidates.length,

      selector,

      writeIntent,

      confidence: target.confidence || {},

      sourceUrls: target.sourceUrls || [],

      candidates,

    };

  });

  const summary = {

    targetCount: records.length,

    exactSingleMatches: resolved.filter(row => row.status === 'EXACT_SINGLE_MATCH_DRY_RUN_ONLY').length,

    noMatches: resolved.filter(row => row.status === 'NO_MATCH_DO_NOT_WRITE').length,

    multipleMatches: resolved.filter(row => row.status === 'MULTIPLE_MATCHES_DO_NOT_WRITE').length,

    safeToWriteCount: resolved.filter(row => row.status === 'EXACT_SINGLE_MATCH_DRY_RUN_ONLY').length,

  };

  const out = {

    status: 'MAPLE_14X65_FIRST_CONTROLLED_WRITE_DRY_RUN_NO_WRITES',

    collectionName: COLLECTION,

    planPath: PLAN_PATH,

    summary,

    resolved,

    nextStep:

      summary.safeToWriteCount === records.length

        ? 'Review proposed diffs, then create an apply script with an explicit confirmation gate.'

        : 'Do not write. Fix selectors until each target has exactly one Firestore match.',

  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  console.log(JSON.stringify(summary, null, 2));

  console.log('\nRESOLVED TARGETS');

  console.table(resolved.map(row => ({

    status: row.status,

    matches: row.matchCount,

    selectorCompany: row.selector.companyName,

    selectorModel: row.selector.modelName,

    ids: row.candidates.map(candidate => candidate.id).join(', '),

  })));

  console.log(`\nWrote ${OUT_PATH}`);

})().catch(error => {

  console.error(error);

  process.exit(1);

});

