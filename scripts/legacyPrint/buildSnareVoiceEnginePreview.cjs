
const fs = require('fs');

const admin = require('firebase-admin');

const { scoreSnareVoice } = require('../../src/legacyPrint/engine/snare/scoreSnareVoice');

const CONTRIBUTION_JSON = 'src/legacyPrint/reviewPlans/snare-physical-contribution-map.json';

const TAXONOMY_JSON = 'src/legacyPrint/reviewPlans/snare-taxonomy-preview.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-voice-engine-preview.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-voice-engine-preview.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const contributionMap = JSON.parse(fs.readFileSync(CONTRIBUTION_JSON, 'utf8'));

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control'

];

const hasText = value => {

  if (value === null || value === undefined) return false;

  const text = String(value).trim();

  if (!text) return false;

  return !['unknown', 'n/a', 'na', 'not verified', 'notverified', 'tbd', 'null', 'undefined'].includes(text.toLowerCase());

};

const normalize = value => {

  if (value === null || value === undefined) return '';

  return String(value)

    .trim()

    .toLowerCase()

    .replace(/[“”]/g, '"')

    .replace(/[’]/g, "'")

    .replace(/\s+/g, ' ');

};

const first = (row, keys) => {

  for (const key of keys) {

    if (hasText(row[key]) || typeof row[key] === 'number') return row[key];

  }

  return undefined;

};

const asNumber = value => {

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {

    const n = Number(value.replace(/[^0-9.]/g, ''));

    return Number.isFinite(n) ? n : null;

  }

  return null;

};

const groupMaterial = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownMaterial';

  if (v.includes('bell brass')) return 'bellBrass';

  if (v.includes('chrome over brass')) return 'brass';

  if (v.includes('brass')) return 'brass';

  if (v.includes('stainless steel')) return 'stainlessSteel';

  if (v.includes('steel')) return 'steel';

  if (v.includes('aluminum') || v.includes('aluminium')) return 'aluminum';

  if (v.includes('bronze')) return 'bronze';

  if (v.includes('copper')) return 'copper';

  if (v.includes('titanium')) return 'titanium';

  if (v.includes('maple') && v.includes('poplar')) return 'maplePoplar';

  if (v.includes('maple') && v.includes('walnut')) return 'mapleWalnut';

  if (v.includes('mahogany') && v.includes('poplar')) return 'mahoganyPoplar';

  if (v.includes('maple')) return 'maple';

  if (v.includes('birch')) return 'birch';

  if (v.includes('beech')) return 'beech';

  if (v.includes('mahogany')) return 'mahogany';

  if (v.includes('walnut')) return 'walnut';

  if (v.includes('oak')) return 'oak';

  if (v.includes('cherry')) return 'cherry';

  if (v.includes('bubinga')) return 'bubinga';

  if (v.includes('poplar')) return 'poplar';

  if (v.includes('gum')) return 'gum';

  if (v.includes('jarrah')) return 'jarrah';

  if (v.includes('marri')) return 'marri';

  if (v.includes('wandoo')) return 'wandoo';

  if (v.includes('ash')) return 'ash';

  if (v.includes('purpleheart')) return 'purpleheart';

  if (v.includes('rosewood')) return 'rosewood';

  if (v.includes('cordia')) return 'cordia';

  if (v.includes('spruce')) return 'spruce';

  if (v.includes('zelkova')) return 'zelkova';

  if (v.includes('acrylic')) return 'acrylic';

  if (v === 'wood') return 'genericWood';

  return 'otherMaterial';

};

const groupConstruction = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownConstruction';

  if (v.includes('cast metal')) return 'castMetal';

  if (v.includes('seamless metal')) return 'seamlessMetal';

  if (v.includes('beaded metal')) return 'beadedMetal';

  if (v.includes('metal')) return 'metal';

  if (v.includes('ply with reinforcement')) return 'plyWithReinforcementRings';

  if (v.includes('ply / resonator')) return 'plyResonator';

  if (v.includes('ply')) return 'ply';

  if (v.includes('steam bent')) return 'steamBent';

  if (v.includes('solid')) return 'solidShell';

  if (v.includes('block')) return 'block';

  if (v.includes('stave')) return 'stave';

  if (v.includes('acrylic')) return 'acrylic';

  if (v.includes('composite')) return 'composite';

  if (v.includes('hybrid')) return 'hybrid';

  return 'otherConstruction';

};

const groupBearingEdge = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownBearingEdge';

  if (v.includes('[object object]')) return 'objectBearingEdgeNeedsFlattening';

  if (v.includes('rolled collar')) return 'rolledCollar';

  if (v.includes('rolled') || v.includes('flanged') || v.includes('folded') || v.includes('formed metal')) return 'rolledOrFormedMetal';

  if (v.includes('machined') && v.includes('metal')) return 'machinedMetal';

  if (v.includes('cast metal')) return 'machinedCastMetal';

  if (v.includes('30-degree') || v.includes('30°')) return 'rounder30Degree';

  if (v.includes('45-degree') || v.includes('45°') || v.includes('45 degree')) return 'sharper45Degree';

  if (v.includes('rounded') || v.includes('round-over') || v.includes('baseball-bat')) return 'roundedVintage';

  if (v.includes('soniclear')) return 'mapexSonicClear';

  if (v.includes('starclassic')) return 'tamaStarclassicEdge';

  if (v.includes('canopus')) return 'canopusPrecisionEdge';

  if (v.includes('ludwig')) return 'ludwigFamilyEdge';

  if (v.includes('tama')) return 'tamaWoodEdge';

  if (v.includes('yamaha')) return 'yamahaFamilyEdge';

  if (v.includes('customer-selected')) return 'customerSelectedEdge';

  if (v.includes('acrylic')) return 'acrylicEdge';

  return 'otherBearingEdge';

};

const groupHoop = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownHoop';

  if (v.includes('die-cast') || v.includes('die cast') || v.includes('diecast') || v.includes('mastercast') || v.includes('true-cast')) return 'dieCast';

  if (v.includes('s-hoop') || v.includes('sonic saver') || v.includes('sound arc')) return 'inwardFlangedControlHoop';

  if (v.includes('302')) return 'gretsch302';

  if (v.includes('triple') || v.includes('mighty hoop') || v.includes('power hoop') || v.includes('superhoop') || v.includes('true hoop')) return 'tripleFlanged';

  if (v.includes('double-flanged')) return 'doubleFlanged';

  if (v.includes('wood')) return 'woodHoop';

  if (v.includes('nickel-over-brass')) return 'brassHoop';

  if (v.includes('aluminum hoop')) return 'aluminumHoop';

  if (v.includes('grooved')) return 'tamaGroovedHoop';

  if (v.includes('stick saver') || v.includes('stick chopper')) return 'vintageFlangedHoop';

  if (v.includes('configurable')) return 'configurableHoop';

  return 'otherHoop';

};

const emptyScore = () => Object.fromEntries(NODE_KEYS.map(key => [key, 5]));

const clamp = value => Math.max(1, Math.min(10, Number(value.toFixed(2))));

const applyContribution = (score, contribution, weight) => {

  if (!contribution) return;

  for (const key of NODE_KEYS) {

    score[key] += (contribution[key] || 0) * weight;

  }

};

const diameterContribution = diameter => {

  const d = asNumber(diameter);

  if (!d) return {};

  return {

    attack: d <= 13 ? 0.25 : 0,

    brightness: d <= 13 ? 0.2 : 0,

    projection: d >= 14 ? 0.25 : -0.05,

    sustain: d >= 14 ? 0.15 : -0.05,

    warmth: d >= 14 ? 0.25 : -0.1,

    sensitivity: d <= 13 ? 0.25 : 0,

    control: d <= 13 ? 0.15 : 0

  };

};

const depthContribution = depth => {

  const d = asNumber(depth);

  if (!d) return {};

  return {

    attack: d <= 5 ? 0.3 : d >= 7 ? -0.1 : 0,

    brightness: d <= 5 ? 0.2 : d >= 7 ? -0.1 : 0,

    projection: d >= 6.5 ? 0.65 : d <= 4 ? -0.2 : 0.2,

    sustain: d >= 6.5 ? 0.65 : d <= 4 ? -0.2 : 0.1,

    warmth: d >= 6.5 ? 0.75 : d <= 4 ? -0.15 : 0.15,

    sensitivity: d <= 5 ? 0.25 : d >= 7 ? -0.1 : 0.05,

    control: d <= 5 ? 0.2 : d >= 7 ? -0.05 : 0

  };

};

const thicknessContribution = thickness => {

  const t = asNumber(thickness);

  if (!t) return {};

  if (t < 2) {

    return {

      attack: 0.15,

      brightness: 0.2,

      projection: 0.1,

      sustain: 0.45,

      warmth: 0.2,

      sensitivity: 0.65,

      control: -0.1

    };

  }

  if (t < 5) {

    return {

      attack: 0.3,

      brightness: 0.25,

      projection: 0.3,

      sustain: 0.35,

      warmth: 0.25,

      sensitivity: 0.45,

      control: 0.15

    };

  }

  if (t < 8) {

    return {

      attack: 0.45,

      brightness: 0.25,

      projection: 0.55,

      sustain: 0.25,

      warmth: 0.35,

      sensitivity: 0.2,

      control: 0.35

    };

  }

  if (t < 12) {

    return {

      attack: 0.65,

      brightness: 0.25,

      projection: 0.85,

      sustain: 0.1,

      warmth: 0.25,

      sensitivity: -0.05,

      control: 0.65

    };

  }

  return {

    attack: 0.8,

    brightness: 0.2,

    projection: 1.0,

    sustain: -0.05,

    warmth: 0.25,

    sensitivity: -0.2,

    control: 0.85

  };

};

const lugContribution = lugCount => {

  const l = asNumber(lugCount);

  if (!l) return {};

  return {

    attack: l >= 10 ? 0.15 : 0,

    brightness: 0,

    projection: l >= 10 ? 0.15 : 0,

    sustain: l >= 10 ? -0.05 : 0.05,

    warmth: 0,

    sensitivity: l >= 10 ? 0.1 : 0,

    control: l >= 10 ? 0.25 : 0.05

  };

};

const topNodes = score =>

  Object.entries(score)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([key, value]) => ({ key, value }));

const SECONDARY_CORE_DRIVER_PREFIXES = [

  'shellLayup:',

  'reinforcementRings:',

  'plyCount:',

  'finishTreatment:'

];

const secondaryCoreDrivers = scored =>

  (scored.drivers?.strongestSources || [])

    .filter(item => SECONDARY_CORE_DRIVER_PREFIXES.some(prefix => item.source.startsWith(prefix)))

    .map(item => ({

      source: item.source,

      totalMovement: item.totalMovement

    }));

const scoreRecord = row => {

  const scored = scoreSnareVoice(row);

  const diameter = first(row, ['diameter', 'diameterInches']);

  const depth = first(row, ['depth', 'depthInches']);

  return {

    id: row.id,

    company: first(row, ['companyName', 'company', 'brand']) || 'Unknown',

    model: first(row, ['modelName', 'model', 'name']) || 'Unknown model',

    lineSeries: first(row, ['lineSeries', 'series', 'line']) || '',

    size: `${diameter || '?'}x${depth || '?'}`,

    shellMaterialRaw: scored.raw?.shellMaterial || '',

    shellConstructionRaw: scored.raw?.shellConstruction || '',

    shellLayupRaw: scored.raw?.shellLayup || '',

    reinforcementRingsRaw: scored.raw?.reinforcementRings || '',

    finishTreatmentRaw: scored.raw?.finishTreatment || '',

    plyCountRaw: scored.raw?.plyCount || '',

    bearingEdgeRaw: scored.raw?.bearingEdge || '',

    hoopRaw: scored.raw?.hoopType || '',

    shellThicknessMm: scored.numeric?.shellThicknessMm || '',

    lugCount: scored.numeric?.lugCount || '',

    families: scored.families,

    secondaryCoreDrivers: secondaryCoreDrivers(scored),

    voiceProfile: scored.voiceProfile,

    topNodes: topNodes(scored.voiceProfile),

    readinessTier: row.legacyPrintEngineReadinessTier || ''

  };

};


async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const records = [];

  snap.forEach(doc => {

    records.push(scoreRecord({ id: doc.id, ...doc.data() }));

  });

  records.sort((a, b) =>

    a.company.localeCompare(b.company) ||

    a.model.localeCompare(b.model) ||

    a.size.localeCompare(b.size)

  );

  const familyCounts = {};

  const topNodeCounts = {};

  for (const record of records) {

    for (const [familyType, family] of Object.entries(record.families)) {

      const key = `${familyType}:${family}`;

      familyCounts[key] = (familyCounts[key] || 0) + 1;

    }

    for (const top of record.topNodes) {

      topNodeCounts[top.key] = (topNodeCounts[top.key] || 0) + 1;

    }

  }

  const packet = {

    status: 'SNARE_VOICE_ENGINE_PREVIEW_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    promotedRecordsScored: records.length,

    doctrine: contributionMap.doctrine,

    componentWeights: contributionMap.componentWeights,

    topNodeCounts: Object.fromEntries(Object.entries(topNodeCounts).sort((a, b) => b[1] - a[1])),

    familyCounts: Object.fromEntries(Object.entries(familyCounts).sort((a, b) => b[1] - a[1])),

    records

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const row = r => `| ${r.company} | ${r.model} | ${r.size} | ${r.families.shellMaterial} | ${r.families.shellConstruction} | ${r.families.shellLayup || ''} | ${r.families.reinforcementRings || ''} | ${r.families.plyCount || ''} | ${r.families.finishTreatment || ''} | ${r.secondaryCoreDrivers.map(d => `${d.source} (${d.totalMovement})`).join(', ')} | ${r.voiceProfile.attack} | ${r.voiceProfile.brightness} | ${r.voiceProfile.projection} | ${r.voiceProfile.sustain} | ${r.voiceProfile.warmth} | ${r.voiceProfile.sensitivity} | ${r.voiceProfile.control} | ${r.topNodes.map(n => n.key).join(', ')} |`;

  const md = [

    '# LegacyPrint Snare Voice Engine Preview',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Promoted records scored: ${packet.promotedRecordsScored}`,

    '- Firestore writes: 0',

    '- Stock heads and snare wires are not scoring blockers in this preview.',

    '- Brand is not used as a primary scoring driver.',

    '',

    '## Top Node Frequency',

    '',

    '| Node | Top-3 Appearances |',

    '|---|---:|',

    ...Object.entries(packet.topNodeCounts).map(([node, count]) => `| ${node} | ${count} |`),

    '',

    '## First 80 Scored Records',

    '',

    '| Company | Model | Size | Material Family | Construction Family | Shell Layup | Rings | Ply Count | Finish/Treatment | Secondary Core Drivers | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control | Top Nodes |',

    '|---|---|---:|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|',

    ...records.slice(0, 80).map(row)

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    promotedRecordsScored: records.length,

    topNodeCounts: packet.topNodeCounts

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

