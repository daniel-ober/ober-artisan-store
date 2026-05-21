
const fs = require('fs');

const { initializeApp, cert, getApps } = require('firebase-admin/app');

const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../../serviceAccountKey.json');

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const OUT = 'src/legacyPrint/reviewPlans/pearl-firestore-sound-impact-mini-audit.json';

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();

const norm = v => clean(v).toLowerCase();

const num = v => {

  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  const m = String(v ?? '').match(/-?\d+(\.\d+)?/);

  return m ? Number(m[0]) : null;

};

const first = (r, keys) => {

  for (const k of keys) {

    const v = r?.[k];

    if (v !== undefined && v !== null && String(v).trim() !== '') return v;

  }

  return '';

};

const text = v => {

  if (!v) return '';

  if (typeof v === 'object') return clean(v.description || v.profile || v.type || v.label || v.value || JSON.stringify(v));

  return clean(v);

};

const field = {

  company: r => clean(first(r, ['companyName', 'company', 'brand'])),

  line: r => clean(first(r, ['lineSeries', 'line', 'series'])),

  model: r => clean(first(r, ['modelName', 'model'])),

  dia: r => num(first(r, ['diameter', 'diameterInches'])),

  depth: r => num(first(r, ['depth', 'depthInches'])),

  construction: r => clean(first(r, ['shellConstruction', 'construction'])),

  material1: r => clean(first(r, ['shellMaterial1', 'shellMaterial', 'primaryShellMaterial'])),

  material2: r => clean(first(r, ['shellMaterial2', 'secondaryShellMaterial'])),

  material3: r => clean(first(r, ['shellMaterial3', 'tertiaryShellMaterial'])),

  ply: r => clean(first(r, ['plyCount', 'plyCountLayup', 'plyLayup'])),

  thickness: r => num(first(r, ['shellThicknessMm', 'shellThicknessMM', 'shellThickness', 'thicknessMm', 'thickness'])),

  edge: r => text(first(r, ['bearingEdge', 'bearingEdgeType', 'bearingEdgeProfile', 'bearingEdgeDetail', 'bearingEdgeDescription'])),

  snareBed: r => clean(first(r, ['snareBedType', 'snareBed'])),

  hoop: r => clean(first(r, ['hoopType', 'hoops', 'rimType'])),

  lugs: r => clean(first(r, ['lugCount', 'lugs'])),

  lugType: r => clean(first(r, ['lugType'])),

  throwOff: r => clean(first(r, ['snareThrowMakeModel', 'throwOff', 'throwOffModel'])),

  wires: r => clean(first(r, ['stockSnareWires', 'snareWires'])),

  batter: r => clean(first(r, ['stockBatterHead', 'batterHead'])),

  reso: r => clean(first(r, ['stockResoHead', 'resoHead'])),

  sourceUrl: r => clean(first(r, ['sourceUrl', 'primarySourceUrl', 'sourceURL'])),

  sourceConfidence: r => clean(first(r, ['sourceConfidence'])),

};

const edgeMeaningful = r => {

  const e = norm(field.edge(r));

  return e && !/unknown|not specified|not verified|needs verification|placeholder|^n\/a$|^na$/.test(e);

};

const edgeFallback = r =>

  r?.engineAssumptions?.bearingEdgeFallbackApplied === true ||

  Boolean(r?.engineAssumptions?.bearingEdgeFallbackKey) ||

  r?.bearingEdgeFallbackApplied === true ||

  Boolean(r?.bearingEdgeFallbackKey);

const family = r => {

  const s = norm(`${field.material1(r)} ${field.material2(r)} ${field.material3(r)} ${field.construction(r)}`);

  if (/steel|brass|aluminum|copper|bronze|metal/.test(s)) return 'metal';

  if (/maple|birch|mahogany|poplar|lauan|kapur|kapoor|gum|wood|ply|stave|solid|steam/.test(s)) return 'wood';

  if (/fiberglass|acrylic|phenolic/.test(s)) return 'composite';

  return 'unknown';

};

const status = r => {

  const core = field.company(r) && field.model(r) && field.dia(r) && field.depth(r) && field.material1(r) && field.construction(r);

  const thick = Boolean(field.thickness(r));

  const edge = edgeMeaningful(r) || edgeFallback(r);

  if (core && thick && edge) return 'SHELL_USABLE';

  if (core && thick && !edge) return 'MISSING_BEARING_EDGE';

  if (core && !thick && edge) return 'MISSING_SHELL_THICKNESS';

  if (core && !thick && !edge) return 'MISSING_THICKNESS_AND_EDGE';

  return 'MISSING_CORE_FIELDS';

};

(async () => {

  const snap = await db.collection('snareReferenceDrums').where('companyName', '==', 'Pearl').get();

  const records = snap.docs.map(doc => {

    const r = { id: doc.id, ...doc.data() };

    return {

      id: r.id,

      lineSeries: field.line(r),

      modelName: field.model(r),

      size: `${field.dia(r) || 'unknown'}x${field.depth(r) || 'unknown'}`,

      materialFamily: family(r),

      shellConstruction: field.construction(r),

      shellMaterial1: field.material1(r),

      shellMaterial2: field.material2(r),

      shellMaterial3: field.material3(r),

      plyCountLayup: field.ply(r),

      shellThicknessMm: field.thickness(r),

      bearingEdge: field.edge(r),

      hasMeaningfulBearingEdge: edgeMeaningful(r),

      approvedBearingEdgeFallback: edgeFallback(r),

      bearingEdgeFallbackKey: r?.engineAssumptions?.bearingEdgeFallbackKey || r?.bearingEdgeFallbackKey || '',

      snareBedType: field.snareBed(r),

      hoopType: field.hoop(r),

      lugCount: field.lugs(r),

      lugType: field.lugType(r),

      throwOff: field.throwOff(r),

      snareWires: field.wires(r),

      stockBatterHead: field.batter(r),

      stockResoHead: field.reso(r),

      sourceConfidence: field.sourceConfidence(r),

      sourceUrl: field.sourceUrl(r),

      readinessStatus: status(r),

    };

  });

  const summary = records.reduce((a, r) => {

    a.total++;

    a.byReadiness[r.readinessStatus] = (a.byReadiness[r.readinessStatus] || 0) + 1;

    a.byMaterialFamily[r.materialFamily] = (a.byMaterialFamily[r.materialFamily] || 0) + 1;

    if (r.readinessStatus === 'SHELL_USABLE') a.shellUsable++;

    if (r.materialFamily === 'wood') a.woodTotal++;

    if (r.materialFamily === 'wood' && r.readinessStatus === 'SHELL_USABLE') a.woodShellUsable++;

    return a;

  }, { total: 0, shellUsable: 0, woodTotal: 0, woodShellUsable: 0, byReadiness: {}, byMaterialFamily: {} });

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), summary, records }, null, 2));

  console.log(JSON.stringify({ outFile: OUT, summary }, null, 2));

})();

