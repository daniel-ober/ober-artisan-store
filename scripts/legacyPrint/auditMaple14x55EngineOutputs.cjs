
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const { buildSnareVoicePacket, DEFAULT_SNARE_CALIBRATION_OVERLAY } = require('../../src/legacyPrint/engine/snare');

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

  return pathValue.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

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

  if (Array.isArray(value)) return value.map(clean).filter(Boolean).join(' / ') || null;

  if (typeof value === 'object') {

    return Object.entries(value)

      .filter(([, v]) => v !== undefined && v !== null && v !== '')

      .map(([k, v]) => `${k}:${clean(v)}`)

      .filter(Boolean)

      .join(' | ') || null;

  }

  const text = String(value).trim();

  if (!text || /^(unknown|not verified|notVerified|null|n\/a|na|tbd)$/i.test(text)) return null;

  return text;

};

const numberFrom = (value) => {

  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const match = String(value).replace(/[”"]/g, '').match(/-?\d+(\.\d+)?/);

  if (!match) return null;

  const n = Number(match[0]);

  return Number.isFinite(n) ? n : null;

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

      };

    }

  }

  return { diameter, depth };

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

  if (!/maple/i.test(primary) && !/maple/i.test(materials)) return false;

  if (hasMetalOrAcrylic(data) && !/maple/i.test(primary)) return false;

  return true;

};

const rawFieldSummary = (data) => ({

  thickness: clean(firstPresent(data, [

    'shellThicknessMm',

    'shellThicknessMM',

    'shellThickness',

    'shell.thicknessMm',

    'shell.thickness',

    'baseConfig.shellThicknessMm',

    'baseConfig.shellThickness',

  ])),

  edge: clean(firstPresent(data, [

    'bearingEdge',

    'bearingEdgeShape',

    'bearingEdgeDetail',

    'bearingEdgeProfile',

    'edgeProfile',

    'shell.bearingEdge',

    'shell.bearingEdgeShape',

    'shell.bearingEdgeDetail',

    'baseConfig.bearingEdge',

  ])),

  bed: clean(firstPresent(data, [

    'snareBed',

    'snareBedType',

    'snareBedProfile',

    'snareBedDepth',

    'snareBedDetail',

    'shell.snareBed',

    'shell.snareBedType',

    'shell.snareBedProfile',

    'baseConfig.snareBed',

  ])),

  construction: clean(firstPresent(data, [

    'shellConstruction',

    'construction',

    'shell.construction',

    'baseConfig.shellConstruction',

  ])),

  ply: clean(firstPresent(data, [

    'plyCount',

    'plyCountLayup',

    'plyLayup',

    'shell.plyCount',

    'shell.plyLayup',

    'baseConfig.plyCount',

    'baseConfig.plyLayup',

  ])),

  rings: clean(firstPresent(data, [

    'reinforcementRings',

    'reinforcementRing',

    'rerings',

    'reRings',

    'shell.reinforcementRings',

    'baseConfig.reinforcementRings',

  ])),

});

const profileKey = (profile = {}) =>

  NODE_KEYS.map((key) => `${key}:${Number(profile[key] ?? 0).toFixed(2)}`).join('|');

const spreadFor = (records) => {

  const valuesByNode = {};

  for (const key of NODE_KEYS) {

    const values = records.map((r) => Number(r.voiceProfile?.[key] ?? 0)).filter(Number.isFinite);

    valuesByNode[key] = {

      min: values.length ? Math.min(...values) : null,

      max: values.length ? Math.max(...values) : null,

      spread: values.length ? Number((Math.max(...values) - Math.min(...values)).toFixed(2)) : null,

    };

  }

  return valuesByNode;

};

const topDrivers = (packet) => {

  const strongest = packet.physicalDrivers?.strongest || [];

  return strongest.slice(0, 8).map((d) => ({

    node: d.node,

    source: d.source,

    delta: d.delta,

    direction: d.direction,

  }));

};

const main = async () => {

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const snap = await db.collection(COLLECTION).get();

  const rawRecords = [];

  snap.forEach((doc) => rawRecords.push({ id: doc.id, ...doc.data() }));

  const candidates = rawRecords

    .filter((record) => {

      const size = sizeFromRecord(record);

      const drumType = clean(firstPresent(record, ['drumType', 'type', 'instrumentType'])) || '';

      const isSnare = !drumType || /snare/i.test(drumType) || /snare/i.test(JSON.stringify(record).slice(0, 600));

      return (

        isSnare &&

        Math.abs((size.diameter ?? 0) - 14) < 0.01 &&

        Math.abs((size.depth ?? 0) - 5.5) < 0.01 &&

        isMaplePrimaryCandidate(record)

      );

    })

    .map((record) => {

      const packet = buildSnareVoicePacket(record, {

        overlay: DEFAULT_SNARE_CALIBRATION_OVERLAY,

        applyOverlay: true,

        includeBaseScore: true,

        includeRawRecord: false,

        mode: 'maple14x55Audit',

      });

      return {

        id: record.id,

        label: `${record.companyName || record.company || 'Unknown'} — ${record.lineSeries || record.series || ''} ${record.modelName || record.model || record.name || 'Unknown Model'}`.replace(/\s+/g, ' ').trim(),

        rawFields: rawFieldSummary(record),

        confidence: packet.confidence,

        voiceProfile: packet.voiceProfile,

        baseVoiceProfile: packet.baseScore?.voiceProfile || {},

        topNodes: packet.topNodes,

        firstListenNodes: packet.readouts?.firstListen?.nodes || [],

        playerAnalysisNodes: packet.readouts?.playerAnalysis?.nodes || [],

        summaryTitle: packet.summary?.title,

        fallbackAssumptions: packet.fallbackAssumptions || {},

        baseFallbackAssumptions: packet.baseScore?.fallbackAssumptions || {},

        topDrivers: topDrivers(packet),

        profileKey: profileKey(packet.voiceProfile),

      };

    })

    .sort((a, b) => a.label.localeCompare(b.label));

  const profileGroupsMap = new Map();

  for (const record of candidates) {

    if (!profileGroupsMap.has(record.profileKey)) profileGroupsMap.set(record.profileKey, []);

    profileGroupsMap.get(record.profileKey).push(record);

  }

  const duplicateProfileGroups = [...profileGroupsMap.entries()]

    .map(([key, items]) => ({ key, count: items.length, items }))

    .filter((g) => g.count > 1)

    .sort((a, b) => b.count - a.count);

  const report = {

    status: 'MAPLE_14X5_5_ENGINE_OUTPUT_AUDIT_READ_ONLY',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    collectionName: COLLECTION,

    summary: {

      totalRecordsScanned: rawRecords.length,

      maple14x55Candidates: candidates.length,

      uniqueComputedProfiles: profileGroupsMap.size,

      duplicateComputedProfileGroups: duplicateProfileGroups.length,

      largestDuplicateComputedProfileGroup: duplicateProfileGroups[0]?.count || 0,

      voiceSpreadByNode: spreadFor(candidates),

    },

    duplicateComputedProfileGroups: duplicateProfileGroups.map((g) => ({

      key: g.key,

      count: g.count,

      labels: g.items.map((r) => r.label),

      examples: g.items.slice(0, 8),

    })),

    records: candidates,

  };

  const jsonPath = path.join(OUT_DIR, `maple-14x55-engine-output-audit-${NOW}.json`);

  const mdPath = path.join(OUT_DIR, `maple-14x55-engine-output-audit-${NOW}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [

    '# Maple 14x5.5 Engine Output Audit',

    '',

    `Generated: ${report.generatedAt}`,

    '',

    'Read-only audit. Firestore writes: **0**.',

    '',

    '## Summary',

    '',

    `- Total records scanned: ${report.summary.totalRecordsScanned}`,

    `- Maple 14x5.5 candidates: ${report.summary.maple14x55Candidates}`,

    `- Unique computed profiles: ${report.summary.uniqueComputedProfiles}`,

    `- Duplicate computed profile groups: ${report.summary.duplicateComputedProfileGroups}`,

    `- Largest duplicate computed profile group: ${report.summary.largestDuplicateComputedProfileGroup}`,

    '',

    '## Voice Spread By Node',

    '',

    ...NODE_KEYS.map((key) => `- ${key}: ${JSON.stringify(report.summary.voiceSpreadByNode[key])}`),

    '',

    '## Largest Duplicate Computed Profile Groups',

    '',

    ...report.duplicateComputedProfileGroups.slice(0, 12).flatMap((g) => [

      `### ${g.count} records`,

      '',

      `Profile: \`${g.key}\``,

      '',

      ...g.labels.slice(0, 20).map((label) => `- ${label}`),

      '',

    ]),

    '## First 40 Records',

    '',

    ...report.records.slice(0, 40).map((r) => `- ${r.label} — ${JSON.stringify(r.voiceProfile)} — firstListen: ${(r.firstListenNodes || []).map((n) => `${n.node || n.key}:${n.value}`).join(', ')}`),

    '',

  ].join('\n');

  fs.writeFileSync(mdPath, md);

  console.log(JSON.stringify({

    status: report.status,

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

