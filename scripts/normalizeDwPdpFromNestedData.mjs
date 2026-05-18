
import admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const round1 = (n) => Math.round(n * 10) / 10;

const asLower = (v) => String(v || '').trim().toLowerCase();

const boolFromUnknown = (v, fallback = false) => {

  if (typeof v === 'boolean') return v;

  if (String(v).toLowerCase() === 'true') return true;

  if (String(v).toLowerCase() === 'false') return false;

  return fallback;

};

const scoreByMaterial = (material, construction, depth = 5.5) => {

  const m = asLower(material);

  const c = asLower(construction);

  let s = { attack: 6.8, brightness: 6.5, projection: 6.8, sustain: 6.2, warmth: 6.5, sensitivity: 6.8, control: 6.5 };

  if (m.includes('maple') && m.includes('mahogany')) s = { attack: 6.7, brightness: 6.2, projection: 6.9, sustain: 6.8, warmth: 7.7, sensitivity: 6.9, control: 6.5 };

  else if (m.includes('maple') && m.includes('walnut')) s = { attack: 6.9, brightness: 6.4, projection: 7.1, sustain: 6.9, warmth: 7.4, sensitivity: 6.9, control: 6.6 };

  else if (m.includes('maple')) s = { attack: 7.0, brightness: 6.7, projection: 7.0, sustain: 6.4, warmth: 7.0, sensitivity: 7.0, control: 6.7 };

  else if (m.includes('birch')) s = { attack: 7.4, brightness: 7.2, projection: 7.5, sustain: 6.1, warmth: 6.1, sensitivity: 7.0, control: 6.8 };

  else if (m.includes('cherry')) s = { attack: 6.8, brightness: 6.4, projection: 7.0, sustain: 6.7, warmth: 7.2, sensitivity: 6.9, control: 6.6 };

  else if (m.includes('oak')) s = { attack: 7.5, brightness: 7.0, projection: 8.0, sustain: 6.6, warmth: 6.6, sensitivity: 6.8, control: 6.5 };

  else if (m.includes('steel')) s = { attack: 7.9, brightness: 8.0, projection: 8.0, sustain: 6.5, warmth: 5.6, sensitivity: 7.0, control: 6.4 };

  else if (m.includes('brass')) s = { attack: 7.7, brightness: 7.3, projection: 8.1, sustain: 7.0, warmth: 6.9, sensitivity: 7.1, control: 6.3 };

  else if (m.includes('aluminum')) s = { attack: 7.2, brightness: 6.7, projection: 7.0, sustain: 5.8, warmth: 6.2, sensitivity: 7.6, control: 7.2 };

  else if (m.includes('bronze')) s = { attack: 7.5, brightness: 7.0, projection: 8.0, sustain: 7.2, warmth: 7.2, sensitivity: 7.2, control: 6.4 };

  if (c.includes('metal')) {

    s.attack += 0.25; s.projection += 0.35; s.brightness += 0.2; s.warmth -= 0.15;

  }

  if (depth >= 6.5) {

    s.projection += 0.25; s.warmth += 0.2; s.sustain += 0.2; s.sensitivity -= 0.1;

  }

  if (depth <= 5) {

    s.attack += 0.2; s.sensitivity += 0.15; s.sustain -= 0.15; s.warmth -= 0.1;

  }

  for (const key of Object.keys(s)) s[key] = Math.max(1, Math.min(10, round1(s[key])));

  return s;

};

const snap = await db.collection('snareReferenceDrums').where('companyName', '==', 'DW / PDP').get();

let updated = 0;

for (const doc of snap.docs) {

  const d = doc.data();

  const shell = d.shell || {};

  const construction = shell.construction || {};

  const dimensions = shell.dimensions || {};

  const edges = shell.bearingEdges || {};

  const beds = shell.snareBeds || {};

  const hoops = d.stockHardware?.hoops || {};

  const lugs = d.stockHardware?.lugs || {};

  const shellConstruction = d.shellConstruction || construction.shellConstruction || 'unknown';

  const primary = d.shellMaterial1 || construction.shellMaterialPrimary || 'unknown';

  const secondary = d.shellMaterial2 || construction.shellMaterialSecondary || 'unknown';

  const tertiary = d.shellMaterial3 || construction.shellMaterialTertiary || 'unknown';

  const diameter = d.diameter ?? dimensions.diameterInches ?? null;

  const depth = d.depth ?? dimensions.depthInches ?? null;

  const scores = scoreByMaterial([primary, secondary, tertiary].join(' '), shellConstruction, depth || 5.5);

  const patch = {

    drumType: d.drumType || 'Snare Drum',

    diameter,

    depth,

    shellConstruction,

    shellMaterial1: primary,

    shellMaterial2: secondary || 'unknown',

    shellMaterial3: tertiary || 'unknown',

    shellThicknessMm: d.shellThicknessMm ?? construction.shellThicknessMm ?? 'unknown',

    bearingEdge: d.bearingEdge || edges.batterSideProfile || edges.snareSideProfile || 'unknown',

    reinforcementRings: typeof d.reinforcementRings === 'boolean' ? d.reinforcementRings : boolFromUnknown(construction.reinforcementRings, false),

    reRingMaterial: d.reRingMaterial || construction.reinforcementRingMaterial || 'unknown',

    reRingThicknessMm: d.reRingThicknessMm ?? construction.reinforcementRingThicknessMm ?? null,

    snareBeds: typeof d.snareBeds === 'boolean' ? d.snareBeds : beds.present === false ? false : true,

    snareBedType: d.snareBedType || beds.depthBucket || 'unknown',

    hoopType: d.hoopType || hoops.batterHoopType || hoops.resonantHoopType || 'unknown',

    lugCount: d.lugCount ?? lugs.lugCount ?? null,

    lugType: d.lugType || lugs.lugType || 'unknown',

    hardwareFinish: d.hardwareFinish || lugs.hardwareFinish || hoops.hoopFinish || 'unknown',

    attack: d.attack ?? scores.attack,

    brightness: d.brightness ?? scores.brightness,

    projection: d.projection ?? scores.projection,

    sustain: d.sustain ?? scores.sustain,

    warmth: d.warmth ?? scores.warmth,

    sensitivity: d.sensitivity ?? scores.sensitivity,

    control: d.control ?? scores.control,

    overallAttack: d.overallAttack ?? scores.attack,

    overallBrightness: d.overallBrightness ?? scores.brightness,

    overallProjection: d.overallProjection ?? scores.projection,

    overallSustain: d.overallSustain ?? scores.sustain,

    overallWarmth: d.overallWarmth ?? scores.warmth,

    overallSensitivity: d.overallSensitivity ?? scores.sensitivity,

    overallControl: d.overallControl ?? scores.control,

    shellScoreAttack: d.shellScoreAttack ?? scores.attack,

    shellScoreBrightness: d.shellScoreBrightness ?? scores.brightness,

    shellScoreProjection: d.shellScoreProjection ?? scores.projection,

    shellScoreSustain: d.shellScoreSustain ?? scores.sustain,

    shellScoreWarmth: d.shellScoreWarmth ?? scores.warmth,

    shellScoreSensitivity: d.shellScoreSensitivity ?? scores.sensitivity,

    shellScoreControl: d.shellScoreControl ?? scores.control,

    sourceConfidence: asLower(d.sourceConfidence) || 'medium',

    voiceScoreConfidence: asLower(d.voiceScoreConfidence) || 'medium',

    scoreSource: d.scoreSource || 'generated-shell-first-heuristic-v1',

    scoringBasis: d.scoringBasis || 'Shell-first scoring generated from nested DW/PDP shell/reference fields. Brand prestige, rarity, resale value, collectibility, and artist association are excluded.',

    engineReadinessNotes: d.engineReadinessNotes || 'DW/PDP record normalized from existing nested shell, stock hardware, and stock snare system data. Unknown values are preserved where source confirmation is not available.',

    needsResearch: d.needsResearch === true ? true : false,

    dataCleanupUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

    dataCleanupUpdatedBy: 'normalizeDwPdpFromNestedData'

  };

  Object.keys(patch).forEach((key) => {

    if (patch[key] === undefined) delete patch[key];

  });

  await doc.ref.update(patch);

  updated++;

}

console.log(`Done. Updated ${updated} DW / PDP records.`);

