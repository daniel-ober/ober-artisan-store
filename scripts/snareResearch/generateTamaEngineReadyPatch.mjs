
import fs from 'fs';

const inputPath = 'data/snareResearchExports/tama-firestore-export.json';

const outputPath = 'data/snareResearchPatches/tama-engine-ready-score-pass-1.json';

const records = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const clamp = (value, min = 1, max = 10) =>

  Math.max(min, Math.min(max, Number(value.toFixed(2))));

const norm = (value) => String(value || '').trim().toLowerCase();

function firstKnown(...values) {

  for (const value of values) {

    if (value !== undefined && value !== null && String(value).trim() !== '') {

      return value;

    }

  }

  return 'unknown';

}

function numericFirst(...values) {

  for (const value of values) {

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const parsed = Number(String(value || '').replace(/[^\d.]/g, ''));

    if (Number.isFinite(parsed) && parsed > 0) return parsed;

  }

  return null;

}

function materialFamily(record) {

  const material = norm(

    firstKnown(

      record.shellMaterial1,

      record.shellMaterialPrimary,

      record.shellMaterial,

      record.materialPrimary,

      record.shell?.construction?.shellMaterialPrimary

    )

  );

  if (material.includes('bell brass')) return 'bellBrass';

  if (material.includes('brass')) return 'brass';

  if (material.includes('bronze')) return 'bronze';

  if (material.includes('copper')) return 'copper';

  if (material.includes('aluminum') || material.includes('aluminium')) return 'aluminum';

  if (material.includes('steel')) return 'steel';

  if (material.includes('acrylic')) return 'acrylic';

  if (material.includes('bubinga')) return 'bubinga';

  if (material.includes('birch')) return 'birch';

  if (material.includes('walnut')) return 'walnut';

  if (material.includes('mahogany')) return 'mahogany';

  if (material.includes('spruce')) return 'spruce';

  if (material.includes('cordia')) return 'cordia';

  if (material.includes('maple') && material.includes('poplar')) return 'maplePoplar';

  if (material.includes('maple')) return 'maple';

  if (material.includes('poplar')) return 'poplar';

  return 'unknown';

}

function constructionFamily(record) {

  const construction = norm(

    firstKnown(

      record.shellConstruction,

      record.shell?.construction?.shellConstruction

    )

  );

  if (construction.includes('solid')) return 'solid';

  if (construction.includes('stave')) return 'stave';

  if (construction.includes('ply')) return 'ply';

  if (construction.includes('metal')) return 'metal';

  if (construction.includes('acrylic')) return 'acrylic';

  return 'unknown';

}

function hoopFamily(record) {

  const hoop = norm(

    firstKnown(

      record.hoopType,

      record.batterHoop,

      record.stockHardware?.hoops?.batterHoopType,

      record.stockHardware?.hoops?.resonantHoopType

    )

  );

  if (hoop.includes('die')) return 'dieCast';

  if (hoop.includes('grooved')) return 'grooved';

  if (hoop.includes('triple')) return 'tripleFlanged';

  if (hoop.includes('mighty')) return 'tripleFlanged';

  if (hoop.includes('single')) return 'singleFlanged';

  return 'unknown';

}

function baseScores(record) {

  const material = materialFamily(record);

  const byMaterial = {

    bellBrass: { attack: 8.7, brightness: 8.1, projection: 9.2, sustain: 7.4, warmth: 6.3, sensitivity: 6.8, control: 6.6 },

    brass: { attack: 7.8, brightness: 7.5, projection: 8.1, sustain: 7.0, warmth: 6.8, sensitivity: 7.0, control: 6.5 },

    bronze: { attack: 7.2, brightness: 6.9, projection: 7.8, sustain: 7.4, warmth: 7.4, sensitivity: 6.8, control: 6.4 },

    copper: { attack: 6.8, brightness: 6.2, projection: 7.1, sustain: 7.5, warmth: 8.2, sensitivity: 6.7, control: 6.1 },

    aluminum: { attack: 7.4, brightness: 7.3, projection: 7.2, sustain: 6.2, warmth: 5.8, sensitivity: 7.9, control: 7.2 },

    steel: { attack: 8.0, brightness: 8.4, projection: 8.0, sustain: 6.5, warmth: 5.2, sensitivity: 7.0, control: 6.9 },

    acrylic: { attack: 7.4, brightness: 7.0, projection: 8.3, sustain: 7.2, warmth: 5.8, sensitivity: 6.4, control: 6.8 },

    bubinga: { attack: 7.0, brightness: 6.3, projection: 7.8, sustain: 6.8, warmth: 8.2, sensitivity: 6.6, control: 7.3 },

    birch: { attack: 7.4, brightness: 7.2, projection: 7.7, sustain: 6.2, warmth: 6.0, sensitivity: 6.9, control: 7.1 },

    walnut: { attack: 6.8, brightness: 6.0, projection: 7.1, sustain: 6.9, warmth: 8.0, sensitivity: 6.7, control: 7.0 },

    mahogany: { attack: 6.3, brightness: 5.6, projection: 6.6, sustain: 7.0, warmth: 8.4, sensitivity: 6.6, control: 6.8 },

    spruce: { attack: 6.5, brightness: 6.4, projection: 6.9, sustain: 7.4, warmth: 7.2, sensitivity: 7.8, control: 6.1 },

    cordia: { attack: 6.8, brightness: 6.4, projection: 7.2, sustain: 6.8, warmth: 7.2, sensitivity: 6.7, control: 6.8 },

    maplePoplar: { attack: 6.7, brightness: 6.4, projection: 6.8, sustain: 6.7, warmth: 7.0, sensitivity: 6.9, control: 6.6 },

    maple: { attack: 7.0, brightness: 6.8, projection: 7.2, sustain: 6.8, warmth: 7.1, sensitivity: 7.1, control: 6.8 },

    poplar: { attack: 6.2, brightness: 5.9, projection: 6.2, sustain: 6.3, warmth: 6.8, sensitivity: 6.4, control: 6.5 },

    unknown: { attack: 6.5, brightness: 6.5, projection: 6.5, sustain: 6.5, warmth: 6.5, sensitivity: 6.5, control: 6.5 }

  };

  return { ...byMaterial[material] };

}

function scoreRecord(record) {

  const scores = baseScores(record);

  const diameter = numericFirst(record.diameter, record.shell?.dimensions?.diameterInches);

  const depth = numericFirst(record.depth, record.shell?.dimensions?.depthInches);

  const thickness = numericFirst(record.shellThicknessMm, record.shellThickness, record.shell?.construction?.shellThicknessMm);

  const construction = constructionFamily(record);

  const hoop = hoopFamily(record);

  if (diameter && diameter < 14) {

    scores.attack += 0.35;

    scores.brightness += 0.35;

    scores.sustain -= 0.25;

    scores.warmth -= 0.25;

    scores.projection -= 0.15;

    scores.sensitivity += 0.2;

  }

  if (depth) {

    if (depth <= 5) {

      scores.attack += 0.35;

      scores.brightness += 0.25;

      scores.sustain -= 0.35;

      scores.warmth -= 0.2;

      scores.sensitivity += 0.25;

      scores.control += 0.15;

    } else if (depth >= 6.5 && depth < 8) {

      scores.projection += 0.35;

      scores.sustain += 0.3;

      scores.warmth += 0.25;

      scores.attack -= 0.1;

      scores.sensitivity -= 0.1;

    } else if (depth >= 8) {

      scores.projection += 0.6;

      scores.sustain += 0.55;

      scores.warmth += 0.45;

      scores.attack -= 0.2;

      scores.sensitivity -= 0.25;

    }

  }

  if (thickness) {

    if (thickness >= 10) {

      scores.attack += 0.35;

      scores.projection += 0.45;

      scores.sustain -= 0.25;

      scores.control += 0.25;

      scores.sensitivity -= 0.2;

    } else if (thickness <= 5) {

      scores.sustain += 0.25;

      scores.sensitivity += 0.3;

      scores.warmth += 0.15;

      scores.projection -= 0.15;

    }

  }

  if (construction === 'solid' || construction === 'stave') {

    scores.projection += 0.35;

    scores.warmth += 0.25;

    scores.sustain += 0.2;

    scores.sensitivity += 0.15;

  }

  if (hoop === 'dieCast') {

    scores.attack += 0.35;

    scores.projection += 0.25;

    scores.control += 0.45;

    scores.sustain -= 0.3;

  } else if (hoop === 'grooved') {

    scores.attack += 0.25;

    scores.projection += 0.25;

    scores.control += 0.2;

  } else if (hoop === 'tripleFlanged') {

    scores.sustain += 0.2;

    scores.sensitivity += 0.1;

    scores.control -= 0.1;

  }

  return Object.fromEntries(

    Object.entries(scores).map(([key, value]) => [key, clamp(value)])

  );

}

const patch = {};

for (const record of records) {

  const scores = scoreRecord(record);

  const shellMaterial1 = firstKnown(

    record.shellMaterial1,

    record.shellMaterialPrimary,

    record.shellMaterial,

    record.materialPrimary,

    record.shell?.construction?.shellMaterialPrimary

  );

  const bearingEdge = firstKnown(

    record.bearingEdge,

    record.bearingEdgeShape,

    record.shell?.bearingEdges?.batterSideProfile

  );

  patch[record.id] = {

    shellMaterial1,

    bearingEdge,

    needsResearch: Boolean(record.needsResearch),

    ...scores,

    scoreSource: 'generated-shell-first-heuristic-v1',

    scoringBasis: firstKnown(record.scoringBasis, record.summary?.shortDescription),

    engineReadinessUpdatedBy: 'generateTamaEngineReadyPatch',

    engineReadinessNotes:

      'Ober 7-node scores generated from existing shell-first physical fields: material, construction, dimensions, thickness, hoops, bearing edge availability, and known stock configuration. Brand prestige, price, rarity, and artist association are excluded.'

  };

}

fs.writeFileSync(outputPath, JSON.stringify(patch, null, 2));

console.log(`Wrote ${Object.keys(patch).length} Tama score patches`);

console.log(outputPath);

