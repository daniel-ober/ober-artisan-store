
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const COLLECTION = 'snareReferenceDrums';

const OUT_DIR = path.resolve('tmp/legacyPrint-audits');

const NOW = new Date().toISOString().replace(/[:.]/g, '-');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const get = (obj, pathValue) => {

  if (!obj || !pathValue) return undefined;

  return pathValue.split('.').reduce((acc, key) => {

    if (acc == null) return undefined;

    return acc[key];

  }, obj);

};

const firstPresent = (obj, paths) => {

  for (const p of paths) {

    const value = get(obj, p);

    if (value !== undefined && value !== null && value !== '') return value;

  }

  return undefined;

};

const clean = (value) => {

  if (value === undefined || value === null || value === '') return null;

  if (Array.isArray(value)) {

    const parts = value.map(clean).filter(Boolean);

    return parts.length ? parts.join(' / ') : null;

  }

  if (typeof value === 'object') {

    const entries = Object.entries(value)

      .filter(([, v]) => v !== undefined && v !== null && v !== '')

      .map(([k, v]) => `${k}:${clean(v)}`)

      .filter((v) => !/unknown|notverified|not verified|null/i.test(v));

    return entries.length ? entries.join(' | ') : null;

  }

  const text = String(value).trim();

  if (!text || /^(unknown|not verified|notVerified|null|n\/a|na|tbd)$/i.test(text)) return null;

  return text;

};

const normalizeKey = (value) => {

  const text = clean(value);

  if (!text) return 'UNKNOWN';

  return text

    .toLowerCase()

    .replace(/[“”"]/g, '')

    .replace(/\s+/g, ' ')

    .trim();

};

const numberFrom = (value) => {

  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const text = String(value).replace(/[”"]/g, '').trim();

  const match = text.match(/-?\d+(\.\d+)?/);

  if (!match) return null;

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : null;

};

const sizeFromRecord = (data) => {

  const diameter = numberFrom(firstPresent(data, [

    'diameter',

    'diameterInches',

    'diameterIn',

    'size.diameter',

    'size.diameterInches',

    'dimensions.diameter',

    'dimensions.diameterInches',

    'shell.diameter',

    'baseConfig.diameter',

  ]));

  const depth = numberFrom(firstPresent(data, [

    'depth',

    'depthInches',

    'depthIn',

    'size.depth',

    'size.depthInches',

    'dimensions.depth',

    'dimensions.depthInches',

    'shell.depth',

    'baseConfig.depth',

  ]));

  const sizeText = clean(firstPresent(data, [

    'size',

    'sizeText',

    'drumSize',

    'dimensions',

    'modelSize',

  ]));

  if ((diameter == null || depth == null) && sizeText) {

    const match = sizeText.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);

    if (match) {

      return {

        diameter: diameter ?? Number(match[1]),

        depth: depth ?? Number(match[2]),

        source: 'sizeText',

      };

    }

  }

  return { diameter, depth, source: 'fields' };

};

const includesWord = (value, word) => {

  if (!value) return false;

  return String(value).toLowerCase().includes(word.toLowerCase());

};

const materialTextFor = (data) => clean(firstPresent(data, [

  'shellMaterial',

  'shellMaterial1',

  'shellMaterials',

  'materials',

  'shell.material',

  'shell.materials',

  'shell.primaryMaterial',

  'coreShell.shellMaterial',

  'baseConfig.shellMaterial',

  'baseConfig.shellMaterials',

])) || '';

const primaryMaterialFor = (data) => clean(firstPresent(data, [

  'shellMaterial1',

  'primaryShellMaterial',

  'shell.primaryMaterial',

  'shellMaterial',

  'coreShell.primaryMaterial',

  'baseConfig.shellMaterial1',

  'baseConfig.primaryShellMaterial',

])) || '';

const hasMetalOrAcrylic = (data) => {

  const text = JSON.stringify({

    shellConstruction: firstPresent(data, ['shellConstruction', 'construction', 'shell.construction', 'baseConfig.shellConstruction']),

    shellMaterial: materialTextFor(data),

  }).toLowerCase();

  return /(steel|brass|bronze|copper|aluminum|aluminium|titanium|acrylic)/i.test(text);

};

const isMaplePrimaryCandidate = (data) => {

  const primary = primaryMaterialFor(data);

  const materials = materialTextFor(data);

  if (!includesWord(primary, 'maple') && !includesWord(materials, 'maple')) return false;

  // Keep maple/poplar/mahogany/other wood ply blends, but exclude metal/acrylic hybrids

  // unless the explicitly primary material is maple.

  if (hasMetalOrAcrylic(data) && !includesWord(primary, 'maple')) return false;

  return true;

};

const fieldProfileFor = (id, data) => {

  const thicknessRaw = firstPresent(data, [

    'shellThicknessMm',

    'shellThicknessMM',

    'shellThickness',

    'shell.thicknessMm',

    'shell.thicknessMM',

    'shell.thickness',

    'coreShell.shellThicknessMm',

    'baseConfig.shellThicknessMm',

    'baseConfig.shellThickness',

  ]);

  const edgeRaw = firstPresent(data, [

    'bearingEdge',

    'bearingEdgeShape',

    'bearingEdgeDetail',

    'bearingEdgeProfile',

    'edgeProfile',

    'shell.bearingEdge',

    'shell.bearingEdgeShape',

    'shell.bearingEdgeDetail',

    'coreShell.bearingEdge',

    'baseConfig.bearingEdge',

  ]);

  const edgeConfidence = clean(firstPresent(data, [

    'bearingEdgeConfidence',

    'sourceConfidence.bearingEdge',

    'confidence.bearingEdge',

    'shell.bearingEdgeConfidence',

    'engineAssumptions.bearingEdgeNeedsVerification',

  ]));

  const snareBedRaw = firstPresent(data, [

    'snareBed',

    'snareBedType',

    'snareBedProfile',

    'snareBedDepth',

    'snareBedDetail',

    'shell.snareBed',

    'shell.snareBedType',

    'shell.snareBedProfile',

    'coreShell.snareBed',

    'baseConfig.snareBed',

  ]);

  const constructionRaw = firstPresent(data, [

    'shellConstruction',

    'construction',

    'shell.construction',

    'coreShell.shellConstruction',

    'baseConfig.shellConstruction',

  ]);

  const plyRaw = firstPresent(data, [

    'plyCount',

    'plyCountLayup',

    'plyLayup',

    'shell.plyCount',

    'shell.plyLayup',

    'baseConfig.plyCount',

    'baseConfig.plyLayup',

  ]);

  const ringsRaw = firstPresent(data, [

    'reinforcementRings',

    'reinforcementRing',

    'rerings',

    'reRings',

    'shell.reinforcementRings',

    'baseConfig.reinforcementRings',

  ]);

  const voiceProfile = NODE_KEYS.reduce((acc, key) => {

    const value = firstPresent(data, [

      `voiceProfile.${key}`,

      `legacyPrintVoice.${key}`,

      `voice.${key}`,

      `engineVoice.${key}`,

    ]);

    if (value !== undefined && value !== null) acc[key] = Number(value);

    return acc;

  }, {});

  return {

    id,

    companyName: clean(firstPresent(data, ['companyName', 'company', 'brand'])) || 'Unknown Company',

    lineSeries: clean(firstPresent(data, ['lineSeries', 'line', 'series'])),

    modelName: clean(firstPresent(data, ['modelName', 'model', 'name'])) || 'Unknown Model',

    modelNumber: clean(firstPresent(data, ['modelNumber', 'modelNum', 'sku'])),

    diameter: sizeFromRecord(data).diameter,

    depth: sizeFromRecord(data).depth,

    shellMaterial: materialTextFor(data) || null,

    primaryMaterial: primaryMaterialFor(data) || null,

    shellConstruction: clean(constructionRaw),

    shellConstructionKey: normalizeKey(constructionRaw),

    shellThicknessMm: numberFrom(thicknessRaw),

    shellThicknessRaw: clean(thicknessRaw),

    shellThicknessKey: numberFrom(thicknessRaw) == null ? 'UNKNOWN' : `${numberFrom(thicknessRaw).toFixed(2)}mm`,

    bearingEdge: clean(edgeRaw),

    bearingEdgeKey: normalizeKey(edgeRaw),

    bearingEdgeConfidence: edgeConfidence,

    snareBed: clean(snareBedRaw),

    snareBedKey: normalizeKey(snareBedRaw),

    plyCountLayup: clean(plyRaw),

    plyCountLayupKey: normalizeKey(plyRaw),

    reinforcementRings: clean(ringsRaw),

    reinforcementRingsKey: normalizeKey(ringsRaw),

    sourceUrl: clean(firstPresent(data, ['sourceUrl', 'primarySourceUrl', 'sources.primary.url', 'primarySource.url'])),

    sourceConfidence: clean(firstPresent(data, ['sourceConfidence', 'primarySourceConfidence', 'sources.primary.confidence'])),

    voiceProfile,

  };

};

const groupBy = (records, keyFn) => {

  const map = new Map();

  for (const record of records) {

    const key = keyFn(record);

    if (!map.has(key)) map.set(key, []);

    map.get(key).push(record);

  }

  return [...map.entries()]

    .map(([key, items]) => ({ key, count: items.length, items }))

    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

};

const compactRecord = (r) => ({

  id: r.id,

  label: `${r.companyName} — ${r.lineSeries ? `${r.lineSeries} ` : ''}${r.modelName}${r.modelNumber ? ` (${r.modelNumber})` : ''}`,

  shellThicknessMm: r.shellThicknessMm,

  shellThicknessRaw: r.shellThicknessRaw,

  bearingEdge: r.bearingEdge,

  bearingEdgeConfidence: r.bearingEdgeConfidence,

  snareBed: r.snareBed,

  shellConstruction: r.shellConstruction,

  plyCountLayup: r.plyCountLayup,

  reinforcementRings: r.reinforcementRings,

  shellMaterial: r.shellMaterial,

  sourceUrl: r.sourceUrl,

  sourceConfidence: r.sourceConfidence,

  voiceProfile: r.voiceProfile,

});

const main = async () => {

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const snap = await db.collection(COLLECTION).get();

  const all = snap.docs.map((doc) => ({

    id: doc.id,

    data: doc.data(),

  }));

  const candidates = all

    .map(({ id, data }) => ({ id, data, size: sizeFromRecord(data) }))

    .filter(({ data, size }) => {

      const drumType = clean(firstPresent(data, ['drumType', 'type', 'instrumentType'])) || '';

      const isSnare = !drumType || /snare/i.test(drumType) || /snare/i.test(JSON.stringify(data).slice(0, 600));

      return (

        isSnare &&

        Math.abs((size.diameter ?? 0) - 14) < 0.01 &&

        Math.abs((size.depth ?? 0) - 5.5) < 0.01 &&

        isMaplePrimaryCandidate(data)

      );

    })

    .map(({ id, data }) => fieldProfileFor(id, data))

    .sort((a, b) => `${a.companyName} ${a.modelName}`.localeCompare(`${b.companyName} ${b.modelName}`));

  const exactThicknessEdgeBed = groupBy(

    candidates.filter((r) => r.shellThicknessKey !== 'UNKNOWN' && r.bearingEdgeKey !== 'UNKNOWN' && r.snareBedKey !== 'UNKNOWN'),

    (r) => `${r.shellThicknessKey} | ${r.bearingEdgeKey} | ${r.snareBedKey}`

  ).filter((g) => g.count > 1);

  const sameThicknessEdgeUnknownBed = groupBy(

    candidates.filter((r) => r.shellThicknessKey !== 'UNKNOWN' && r.bearingEdgeKey !== 'UNKNOWN' && r.snareBedKey === 'UNKNOWN'),

    (r) => `${r.shellThicknessKey} | ${r.bearingEdgeKey} | SNARE_BED_UNKNOWN`

  ).filter((g) => g.count > 1);

  const sameConstructionEdgeUnknownThickness = groupBy(

    candidates.filter((r) => r.shellThicknessKey === 'UNKNOWN' && r.bearingEdgeKey !== 'UNKNOWN' && r.shellConstructionKey !== 'UNKNOWN'),

    (r) => `${r.shellConstructionKey} | ${r.bearingEdgeKey} | THICKNESS_UNKNOWN`

  ).filter((g) => g.count > 1);

  const notDifferentiationReady = candidates.filter((r) => {

    const missing = [

      r.shellThicknessKey === 'UNKNOWN',

      r.bearingEdgeKey === 'UNKNOWN',

      r.snareBedKey === 'UNKNOWN',

      r.plyCountLayupKey === 'UNKNOWN',

    ].filter(Boolean).length;

    return missing >= 2;

  });

  const uniqueEnough = candidates.filter((r) => (

    r.shellThicknessKey !== 'UNKNOWN' &&

    r.bearingEdgeKey !== 'UNKNOWN' &&

    r.snareBedKey !== 'UNKNOWN' &&

    r.plyCountLayupKey !== 'UNKNOWN'

  ));

  const thicknessGroups = groupBy(candidates, (r) => r.shellThicknessKey);

  const bearingEdgeGroups = groupBy(candidates, (r) => r.bearingEdgeKey);

  const snareBedGroups = groupBy(candidates, (r) => r.snareBedKey);

  const report = {

    generatedAt: new Date().toISOString(),

    collectionName: COLLECTION,

    auditType: 'MAPLE_14X5_5_SNARE_DIFFERENTIATION_READINESS_AUDIT_READ_ONLY',

    firestoreWrites: 0,

    summary: {

      totalRecordsScanned: all.length,

      maple14x55Candidates: candidates.length,

      exactThicknessEdgeBedDuplicateGroups: exactThicknessEdgeBed.length,

      sameThicknessEdgeUnknownBedGroups: sameThicknessEdgeUnknownBed.length,

      sameConstructionEdgeUnknownThicknessGroups: sameConstructionEdgeUnknownThickness.length,

      corePassButNotDifferentiationReadyCount: notDifferentiationReady.length,

      uniqueEnoughToScoreDifferentlyCount: uniqueEnough.length,

      differentiationReadinessDefinition:

        'Core-shell pass means enough physical data exists to generate a defensible read. Differentiation-ready means enough specific physical data exists to separate this drum from similar maple 14x5.5 snares.',

    },

    groups: {

      exactSameThicknessBearingEdgeSnareBed: exactThicknessEdgeBed.map((g) => ({

        key: g.key,

        count: g.count,

        items: g.items.map(compactRecord),

      })),

      sameThicknessSameBearingEdgeUnknownSnareBed: sameThicknessEdgeUnknownBed.map((g) => ({

        key: g.key,

        count: g.count,

        items: g.items.map(compactRecord),

      })),

      sameConstructionSameBearingEdgeUnknownThickness: sameConstructionEdgeUnknownThickness.map((g) => ({

        key: g.key,

        count: g.count,

        items: g.items.map(compactRecord),

      })),

    },

    distribution: {

      shellThickness: thicknessGroups.map((g) => ({ key: g.key, count: g.count, labels: g.items.map((r) => compactRecord(r).label) })),

      bearingEdge: bearingEdgeGroups.map((g) => ({ key: g.key, count: g.count, labels: g.items.map((r) => compactRecord(r).label) })),

      snareBed: snareBedGroups.map((g) => ({ key: g.key, count: g.count, labels: g.items.map((r) => compactRecord(r).label) })),

    },

    records: candidates.map(compactRecord),

    notDifferentiationReadyToDistinguish: notDifferentiationReady.map(compactRecord),

    uniqueEnoughToScoreDifferently: uniqueEnough.map(compactRecord),

  };

  const jsonPath = path.join(OUT_DIR, `maple-14x55-snare-similarity-audit-${NOW}.json`);

  const mdPath = path.join(OUT_DIR, `maple-14x55-snare-similarity-audit-${NOW}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [

    '# Maple 14x5.5 Snare Similarity Audit',

    '',

    `Generated: ${report.generatedAt}`,

    '',

    'Read-only audit. Firestore writes: **0**.',

    '',

    '## Summary',

    '',

    `- Total records scanned: ${report.summary.totalRecordsScanned}`,

    `- Maple 14x5.5 candidates: ${report.summary.maple14x55Candidates}`,

    `- Exact duplicate groups — thickness + bearing edge + snare bed: ${report.summary.exactThicknessEdgeBedDuplicateGroups}`,

    `- Same thickness + same bearing edge + unknown snare bed groups: ${report.summary.sameThicknessEdgeUnknownBedGroups}`,

    `- Same construction + same bearing edge + unknown thickness groups: ${report.summary.sameConstructionEdgeUnknownThicknessGroups}`,

    `- Too generic to distinguish: ${report.summary.corePassButNotDifferentiationReadyCount}`,

    `- Unique enough to score differently: ${report.summary.uniqueEnoughToScoreDifferentlyCount}`,

    '',

    '## Exact Same Thickness + Bearing Edge + Snare Bed',

    '',

    ...report.groups.exactSameThicknessBearingEdgeSnareBed.flatMap((g) => [

      `### ${g.key} (${g.count})`,

      '',

      ...g.items.map((r) => `- ${r.label} — thickness: ${r.shellThicknessRaw || r.shellThicknessMm || 'unknown'}; edge: ${r.bearingEdge || 'unknown'}; bed: ${r.snareBed || 'unknown'}; ply: ${r.plyCountLayup || 'unknown'}; rings: ${r.reinforcementRings || 'unknown'}`),

      '',

    ]),

    '## Same Thickness + Same Bearing Edge + Unknown Snare Bed',

    '',

    ...report.groups.sameThicknessSameBearingEdgeUnknownSnareBed.flatMap((g) => [

      `### ${g.key} (${g.count})`,

      '',

      ...g.items.map((r) => `- ${r.label} — thickness: ${r.shellThicknessRaw || r.shellThicknessMm || 'unknown'}; edge: ${r.bearingEdge || 'unknown'}; ply: ${r.plyCountLayup || 'unknown'}; rings: ${r.reinforcementRings || 'unknown'}`),

      '',

    ]),

    '## Same Construction + Same Bearing Edge + Unknown Thickness',

    '',

    ...report.groups.sameConstructionSameBearingEdgeUnknownThickness.flatMap((g) => [

      `### ${g.key} (${g.count})`,

      '',

      ...g.items.map((r) => `- ${r.label} — construction: ${r.shellConstruction || 'unknown'}; edge: ${r.bearingEdge || 'unknown'}; bed: ${r.snareBed || 'unknown'}; ply: ${r.plyCountLayup || 'unknown'}; rings: ${r.reinforcementRings || 'unknown'}`),

      '',

    ]),

    '## Records Core-Pass But Not Differentiation-Ready',

    '',

    ...report.notDifferentiationReadyToDistinguish.map((r) => `- ${r.label} — thickness: ${r.shellThicknessRaw || 'unknown'}; edge: ${r.bearingEdge || 'unknown'}; bed: ${r.snareBed || 'unknown'}; ply: ${r.plyCountLayup || 'unknown'}; rings: ${r.reinforcementRings || 'unknown'}`),

    '',

    '## Records Unique Enough To Score Differently',

    '',

    ...report.uniqueEnoughToScoreDifferently.map((r) => `- ${r.label} — thickness: ${r.shellThicknessRaw || r.shellThicknessMm}; edge: ${r.bearingEdge}; bed: ${r.snareBed}; ply: ${r.plyCountLayup}; rings: ${r.reinforcementRings || 'unknown'}`),

    '',

  ].join('\n');

  fs.writeFileSync(mdPath, md);

  console.log(JSON.stringify({

    status: report.auditType,

    firestoreWrites: 0,

    jsonPath,

    mdPath,

    summary: report.summary,

  }, null, 2));

};

main().catch((err) => {

  console.error(err);

  process.exit(1);

});

