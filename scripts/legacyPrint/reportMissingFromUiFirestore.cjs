const fs = require('fs');

const { initializeApp, cert, getApps } = require('firebase-admin/app');

const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../../serviceAccountKey.json');

if (!getApps().length) {

  initializeApp({ credential: cert(serviceAccount) });

}

const db = getFirestore();

const OUT = 'src/legacyPrint/reviewPlans/missing-from-ui-firestore-report.json';

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();

const norm = v => clean(v).toLowerCase();

const first = (r, keys) => {

  for (const k of keys) {

    const v = r?.[k];

    if (v !== undefined && v !== null && String(v).trim() !== '') return v;

  }

  return '';

};

const num = v => {

  if (typeof v === 'number' && Number.isFinite(v)) return v;

  const m = String(v ?? '').match(/-?\d+(\.\d+)?/);

  return m ? Number(m[0]) : null;

};

const text = v => {

  if (!v) return '';

  if (typeof v === 'object') {

    return clean(v.description || v.profile || v.type || v.label || v.value || JSON.stringify(v));

  }

  return clean(v);

};

const company = r => clean(first(r, ['companyName', 'company', 'brand']));

const line = r => clean(first(r, ['lineSeries', 'line', 'series']));

const model = r => clean(first(r, ['modelName', 'model']));

const dia = r => num(first(r, ['diameter', 'diameterInches']));

const depth = r => num(first(r, ['depth', 'depthInches']));

const construction = r => clean(first(r, ['shellConstruction', 'construction']));

const mat1 = r => clean(first(r, ['shellMaterial1', 'shellMaterial', 'primaryShellMaterial']));

const mat2 = r => clean(first(r, ['shellMaterial2', 'secondaryShellMaterial']));

const thickness = r => num(first(r, ['shellThicknessMm', 'shellThicknessMM', 'shellThickness', 'thicknessMm', 'thickness']));

const edge = r => text(first(r, ['bearingEdge', 'bearingEdgeType', 'bearingEdgeProfile', 'bearingEdgeDetail', 'bearingEdgeDescription']));

const hoop = r => clean(first(r, ['hoopType', 'hoops', 'rimType']));

const lugs = r => clean(first(r, ['lugCount', 'lugs']));

const sourceConfidence = r => clean(first(r, ['sourceConfidence']));

const edgeMeaningful = r => {

  const e = norm(edge(r));

  return e && !/unknown|not specified|not verified|needs verification|placeholder|^n\/a$|^na$/.test(e);

};

const edgeFallback = r =>

  r?.engineAssumptions?.bearingEdgeFallbackApplied === true ||

  Boolean(r?.engineAssumptions?.bearingEdgeFallbackKey) ||

  r?.bearingEdgeFallbackApplied === true ||

  Boolean(r?.bearingEdgeFallbackKey);

const family = r => {

  const s = norm(`${mat1(r)} ${mat2(r)} ${construction(r)}`);

  if (/steel|brass|aluminum|copper|bronze|metal/.test(s)) return 'metal';

  if (/maple|birch|mahogany|poplar|lauan|kapur|kapoor|gum|walnut|ash|wood|ply|stave|solid|steam/.test(s)) return 'wood';

  if (/fiberglass|acrylic|phenolic/.test(s)) return 'composite';

  return 'unknown';

};

const missingReasons = r => [

  !company(r) && 'company',

  !model(r) && 'model',

  !dia(r) && 'diameter',

  !depth(r) && 'depth',

  !mat1(r) && 'shellMaterial',

  !construction(r) && 'shellConstruction',

  !thickness(r) && 'shellThickness',

  !(edgeMeaningful(r) || edgeFallback(r)) && 'bearingEdgeOrFallback',

].filter(Boolean);

(async () => {

  const snap = await db.collection('snareReferenceDrums').limit(3000).get();

  const missing = snap.docs

    .map(doc => ({ id: doc.id, ...doc.data() }))

    .map(r => {

      const reasons = missingReasons(r);

      return {

        company: company(r),

        line: line(r),

        model: model(r),

        size: `${dia(r) || ''}x${depth(r) || ''}`,

        family: family(r),

        construction: construction(r),

        material1: mat1(r),

        material2: mat2(r) && mat2(r) !== 'none' ? mat2(r) : '',

        thickness: thickness(r) ? `${thickness(r)}mm` : 'MISSING',

        bearingEdge: edgeMeaningful(r) ? edge(r) : edgeFallback(r) ? 'fallback' : 'MISSING',

        hoop: hoop(r),

        lugs: lugs(r),

        confidence: sourceConfidence(r),

        missing: reasons.join(', '),

        id: r.id,

      };

    })

    .filter(r => r.missing)

    .sort((a, b) =>

      String(a.company).localeCompare(String(b.company)) ||

      String(a.family).localeCompare(String(b.family)) ||

      String(a.line).localeCompare(String(b.line)) ||

      String(a.model).localeCompare(String(b.model)) ||

      String(a.size).localeCompare(String(b.size))

    );

  const summary = missing.reduce((acc, r) => {

    acc.totalMissing += 1;

    acc.byCompany[r.company || 'Unknown'] = (acc.byCompany[r.company || 'Unknown'] || 0) + 1;

    acc.byFamily[r.family || 'unknown'] = (acc.byFamily[r.family || 'unknown'] || 0) + 1;

    r.missing.split(', ').forEach(reason => {

      acc.byMissingReason[reason] = (acc.byMissingReason[reason] || 0) + 1;

    });

    return acc;

  }, {

    totalMissing: 0,

    byCompany: {},

    byFamily: {},

    byMissingReason: {},

  });

  fs.writeFileSync(OUT, JSON.stringify({

    generatedAt: new Date().toISOString(),

    uiRule: 'Missing from UI = not passing core fields + shell thickness + meaningful bearing edge or approved fallback',

    summary,

    records: missing,

  }, null, 2));

  console.log('\n=== DRUMS MISSING FROM UI ===\n');

  console.log(`Total missing from UI: ${summary.totalMissing}`);

  console.log('\nMissing reason counts:');

  console.table(summary.byMissingReason);

  console.log('\nMissing by company:');

  console.table(summary.byCompany);

  console.log('\nMissing by family:');

  console.table(summary.byFamily);

  console.log('\nOne missing drum per line:');

  console.table(missing);

  console.log(`\nSaved report: ${OUT}\n`);

})();