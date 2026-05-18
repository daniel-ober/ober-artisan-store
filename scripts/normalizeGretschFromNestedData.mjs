
import admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const round1 = (n) => Math.round(n * 10) / 10;

const asLower = (v) => String(v || '').trim().toLowerCase();

const normalizeLugCount = (value) => {

  if (value === 810) return 10;

  if (typeof value === 'number' && value > 0 && value <= 20) return value;

  return null;

};

const materialScores = (material, construction, depth = 5.5) => {

  const m = asLower(material);

  const c = asLower(construction);

  let s = {

    attack: 6.8,

    brightness: 6.5,

    projection: 6.8,

    sustain: 6.2,

    warmth: 6.5,

    sensitivity: 6.7,

    control: 6.5

  };

  if (m.includes('maple') && m.includes('poplar')) {

    s = { attack: 6.7, brightness: 6.1, projection: 6.6, sustain: 6.4, warmth: 7.4, sensitivity: 6.7, control: 6.6 };

  } else if (m.includes('maple')) {

    s = { attack: 7.0, brightness: 6.7, projection: 7.0, sustain: 6.4, warmth: 7.0, sensitivity: 7.0, control: 6.7 };

  } else if (m.includes('brass') || m.includes('bell brass')) {

    s = { attack: 7.8, brightness: 7.4, projection: 8.3, sustain: 7.2, warmth: 6.8, sensitivity: 7.2, control: 6.3 };

  } else if (m.includes('steel')) {

    s = { attack: 7.9, brightness: 8.0, projection: 8.0, sustain: 6.6, warmth: 5.6, sensitivity: 7.0, control: 6.4 };

  } else if (m.includes('aluminum')) {

    s = { attack: 7.2, brightness: 6.8, projection: 7.0, sustain: 5.8, warmth: 6.3, sensitivity: 7.5, control: 7.1 };

  } else if (m.includes('copper')) {

    s = { attack: 7.0, brightness: 6.4, projection: 7.2, sustain: 6.8, warmth: 7.4, sensitivity: 7.2, control: 6.5 };

  }

  if (c.includes('metal')) {

    s.attack += 0.3;

    s.projection += 0.4;

    s.brightness += 0.2;

    s.warmth -= 0.2;

  }

  if (depth >= 6.5) {

    s.projection += 0.25;

    s.warmth += 0.2;

    s.sustain += 0.2;

    s.sensitivity -= 0.1;

  }

  if (depth >= 8) {

    s.projection += 0.35;

    s.warmth += 0.3;

    s.sustain += 0.25;

    s.sensitivity -= 0.25;

    s.control -= 0.1;

  }

  if (depth <= 5) {

    s.attack += 0.2;

    s.sensitivity += 0.15;

    s.sustain -= 0.15;

    s.warmth -= 0.1;

  }

  for (const key of Object.keys(s)) {

    s[key] = Math.max(1, Math.min(10, round1(s[key])));

  }

  return s;

};

const snap = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'Gretsch')

  .get();

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

  const combinedMaterial = [primary, secondary, tertiary].filter(Boolean).join(' ');

  const diameter = d.diameter ?? dimensions.diameterInches ?? null;

  const depth = d.depth ?? dimensions.depthInches ?? null;

  const scores = materialScores(combinedMaterial, shellConstruction, depth || 5.5);

  const hoopType =

    d.hoopType ||

    hoops.batterHoopType ||

    hoops.resonantHoopType ||

    'unknown';

  const bearingEdge =

    d.bearingEdge ||

    edges.batterSideProfile ||

    edges.snareSideProfile ||

    'unknown';

  const snareBedsPresent =

    typeof d.snareBeds === 'boolean'

      ? d.snareBeds

      : beds.present === true

        ? true

        : beds.present === false

          ? false

          : true;

  const patch = {

    drumType: d.drumType || 'Snare Drum',

    diameter,

    depth,

    shellConstruction,

    shellMaterial1: primary,

    shellMaterial2: secondary || 'unknown',

    shellMaterial3: tertiary || 'unknown',

    shellThicknessMm:

      d.shellThicknessMm ??

      construction.shellThicknessMm ??

      'unknown',

    bearingEdge,

    reinforcementRings:

      typeof d.reinforcementRings === 'boolean'

        ? d.reinforcementRings

        : Boolean(construction.reinforcementRings),

    reRingMaterial:

      d.reRingMaterial ||

      construction.reinforcementRingMaterial ||

      'unknown',

    reRingThicknessMm:

      d.reRingThicknessMm ??

      construction.reinforcementRingThicknessMm ??

      null,

    snareBeds: snareBedsPresent,

    snareBedType: d.snareBedType || beds.depthBucket || 'unknown',

    hoopType,

    lugCount: normalizeLugCount(d.lugCount ?? lugs.lugCount),

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

    scoringBasis:

      d.scoringBasis ||

      'Shell-first scoring generated from nested Gretsch shell/reference fields: dimensions, shell construction, shell materials, bearing edge family, reinforcement rings, snare bed availability, and hoop type. Brand prestige, rarity, resale value, collectibility, and artist association are excluded.',

    engineReadinessNotes:

      d.engineReadinessNotes ||

      'Gretsch record normalized from existing nested shell, stock hardware, and stock snare system data. Unknown values are preserved where source confirmation is not available.',

    needsResearch: d.needsResearch === true ? true : false,

    dataCleanupUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

    dataCleanupUpdatedBy: 'normalizeGretschFromNestedData'

  };

  Object.keys(patch).forEach((key) => {

    if (patch[key] === undefined) delete patch[key];

  });

  await doc.ref.update(patch);

  updated++;

}

console.log(`Done. Updated ${updated} Gretsch records.`);

