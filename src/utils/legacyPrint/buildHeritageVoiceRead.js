// src/utils/legacyPrint/buildHeritageVoiceRead.js

import { scoreSpiderProfile } from '../spider/scoreSpiderProfile.js';

import HERITAGE_REFERENCE_PROFILE from './heritageReferenceProfile.js';

import LEGACYPRINT_BENCHMARK_CATALOG from '../../data/legacyPrint/benchmarkCatalog.js';

import { BENCHMARK_DEFINITIONS } from '../../data/legacyPrint/benchmarkDefinitions.js';

import buildHeritageIdentityShapeRead from './buildHeritageIdentityShapeRead.js';

const AXES = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const HERITAGE_REFERENCE_SPEC = {

  width: 14,

  depth: 5.5,

  lugQuantity: 8,

  staveCount: 16,

  shellThicknessMm: 10,

  hoopType: 'Triple Flange',

  finish: 'Medium Torch',

  reRings: 'None',

};

const HERITAGE_FACTOR_WEIGHTS = {

  attack: {

    diameter: 0.16,

    depth: 0.12,

    shell: 0.42,

    scorch: 0.07,

    hoop: 0.23,

  },

  brightness: {

    diameter: 0.25,

    depth: 0.14,

    shell: 0.3,

    scorch: 0.13,

    hoop: 0.18,

  },

  projection: {

    diameter: 0.18,

    depth: 0.31,

    shell: 0.29,

    scorch: 0.05,

    hoop: 0.17,

  },

  sustain: {

    diameter: 0.13,

    depth: 0.35,

    shell: 0.27,

    scorch: 0.07,

    hoop: 0.18,

  },

  warmth: {

    diameter: 0.22,

    depth: 0.37,

    shell: 0.25,

    scorch: 0.1,

    hoop: 0.06,

  },

  sensitivity: {

    diameter: 0.11,

    depth: 0.16,

    shell: 0.34,

    scorch: 0.15,

    hoop: 0.24,

  },

  control: {

    diameter: 0.09,

    depth: 0.1,

    shell: 0.4,

    scorch: 0.16,

    hoop: 0.25,

  },

};

const AXIS_FACTOR_DIRECTIONS = {

  attack: {

    diameter: -1,

    depth: -0.85,

    shell: 1,

    scorch: 0.35,

    hoop: 1,

  },

  brightness: {

    diameter: -1,

    depth: -1.05,

    shell: 1,

    scorch: -1,

    hoop: 0.62,

  },

  projection: {

    diameter: 0.55,

    depth: 1,

    shell: 0.72,

    scorch: -0.2,

    hoop: 0.62,

  },

  sustain: {

    diameter: 0.42,

    depth: 1.12,

    shell: -0.85,

    scorch: -0.75,

    hoop: -1,

  },

  warmth: {

    diameter: 0.9,

    depth: 1.18,

    shell: -0.5,

    scorch: 0.42,

    hoop: -0.42,

  },

  sensitivity: {

    diameter: -0.35,

    depth: -0.52,

    shell: -0.65,

    scorch: -1,

    hoop: -1,

  },

  control: {

    diameter: 0.2,

    depth: -0.28,

    shell: 0.85,

    scorch: 1,

    hoop: 1,

  },

};

const FIRST_LISTEN_AXIS_DEFINITIONS = {

  attack: {

    label: 'Attack',

    general:

      'How quickly the drum responds when it is hit — from softer and rounder to quicker and more defined.',

  },

  brightness: {

    label: 'Brightness',

    general:

      'How much crisp top-end detail you hear — from darker and smoother to clearer and snappier.',

  },

  projection: {

    label: 'Projection',

    general:

      'How forward the drum feels in the room or mix — not just louder, but easier to notice and carry outward.',

  },

  sustain: {

    label: 'Sustain',

    general:

      'How long the sound keeps going after the hit — from short and tight to more open and ringing.',

  },

  warmth: {

    label: 'Warmth',

    general:

      'How full, woody, and body-rich the center of the sound feels — from lean and clean to deeper and rounder.',

  },

  sensitivity: {

    label: 'Sensitivity',

    general:

      'How easily the drum responds to lighter playing — especially soft notes, ghost notes, and small changes in touch.',

  },

  control: {

    label: 'Control',

    general:

      'How focused and organized the sound feels — less wide or ringy, more shaped and easy to place.',

  },

};

const clamp = (value, min = 1, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const clampUnit = (value) => clamp(value, -1, 1);

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function normalizeDepth(value) {

  const num = Number(value);

  if (!Number.isFinite(num)) return 5.5;

  return Number(num.toFixed(1));

}

function parseStaveOption(staveOption = '') {

  const raw = String(staveOption || '').trim();

  const staveMatch = raw.match(/^(\d+)/);

  const thicknessMatch = raw.match(/-\s*(\d+(?:\.\d+)?)mm/i);

  const hasReRings =

    raw.toLowerCase().includes('re-rings') || raw.includes('+ $150');

  const staveCount = staveMatch ? Number(staveMatch[1]) : null;

  const shellThicknessMm = thicknessMatch ? Number(thicknessMatch[1]) : null;

  return {

    staveCount,

    shellThicknessMm,

    hasReRings,

  };

}

function getShellThicknessBucket(mm) {

  const value = Number(mm);

  if (!Number.isFinite(value)) return 'medium';

  if (value <= 9) return 'thin';

  if (value <= 12) return 'medium';

  return 'thick';

}

function parseSizeId(sizeId = '') {

  const normalized = String(sizeId).replace(/_/g, '.').trim();

  const match = normalized.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);

  if (!match) {

    return { width: 14, depth: 5.5 };

  }

  return {

    width: Number(match[1]),

    depth: Number(match[2]),

  };

}

function includesText(value = '', needle = '') {

  return String(value || '')

    .toLowerCase()

    .includes(needle.toLowerCase());

}

function isBlackenedFinish(finish = '') {

  const value = String(finish || '').toLowerCase();

  return (

    value.includes('blackened') ||

    value.includes('black stain') ||

    value.includes('black stained') ||

    value.includes('blacked')

  );

}

function isLightFinish(finish = '') {

  return includesText(finish, 'light');

}

function isDieCastHoop(hoopType = '') {

  return includesText(hoopType, 'die');

}

function isTripleFlangeHoop(hoopType = '') {

  return includesText(hoopType, 'triple');

}

function hasStandardReRings(reRings = '') {

  const value = String(reRings || '')

    .toLowerCase()

    .trim();

  return value !== '' && value !== 'none' && value !== 'no';

}

function buildNeutralBenchmarkSpecFromCatalog({ familyId, typeId, sizeId }) {

  const familyDefinition =

    Object.values(BENCHMARK_DEFINITIONS).find(

      (family) => family.familyId === familyId

    ) || Object.values(BENCHMARK_DEFINITIONS)[0];

  const typeDefinition =

    Object.values(familyDefinition?.types || {}).find(

      (type) => type.typeId === typeId

    ) || Object.values(familyDefinition?.types || {})[0];

  const resolvedSizeId =

    sizeId ||

    typeDefinition?.defaultSizeId ||

    typeDefinition?.sizes?.[0]?.sizeId ||

    '14x5_5';

  const sizeDefinition =

    typeDefinition?.sizes?.find((size) => size.sizeId === resolvedSizeId) ||

    typeDefinition?.sizes?.[0] ||

    null;

  const parsedFallbackSize = parseSizeId(resolvedSizeId);

  const resolvedSpec = sizeDefinition?.spec || {};

  const width = Number(

    resolvedSpec.width ??

      sizeDefinition?.spec?.width ??

      parsedFallbackSize.width

  );

  const depth = Number(

    resolvedSpec.depth ??

      sizeDefinition?.spec?.depth ??

      parsedFallbackSize.depth

  );

  const shellThicknessMm = Number(

    resolvedSpec.shellThicknessMm ??

      resolvedSpec.thicknessMm ??

      resolvedSpec.shellThickness ??

      resolvedSpec.thickness ??

      10

  );

  return {

    scoringIntent: resolvedSpec.scoringIntent || 'shell_first',

    legacyPrintMode: resolvedSpec.legacyPrintMode || 'shell_first',

    benchmarkMode: resolvedSpec.benchmarkMode || 'heritage_shell_first',

    benchmarkFamilyId: familyDefinition?.familyId || familyId,

    benchmarkTypeId: typeDefinition?.typeId || typeId,

    benchmarkSizeId: sizeDefinition?.sizeId || resolvedSizeId,

    width,

    depth,

    lugQuantity: Number(resolvedSpec.lugQuantity ?? 8),

    staveCount:

      resolvedSpec.staveCount == null ? null : Number(resolvedSpec.staveCount),

    shellThicknessMm,

    thicknessMm: shellThicknessMm,

    shellThickness: shellThicknessMm,

    thickness: shellThicknessMm,

    shellThicknessBucket:

      resolvedSpec.shellThicknessBucket ||

      getShellThicknessBucket(shellThicknessMm),

    shellFamily: resolvedSpec.shellFamily || 'wood',

    construction: resolvedSpec.construction || 'stave',

    primarySpecies: resolvedSpec.primarySpecies || '',

    secondarySpecies: resolvedSpec.secondarySpecies || '',

    woodSpeciesLabel: resolvedSpec.woodSpeciesLabel || '',

    metalMaterial: resolvedSpec.metalMaterial || '',

    acrylicType: resolvedSpec.acrylicType || '',

    hoopType: resolvedSpec.hoopType || 'Triple Flange',

    hardwareType: resolvedSpec.hardwareType || 'Tube Lugs',

    hardwareFinish: resolvedSpec.hardwareFinish || 'Chrome',

    bearingEdge:

      resolvedSpec.bearingEdge || '45 Inner / Strong Outer Roundover',

    snareBedDepth: resolvedSpec.snareBedDepth || 'Standard',

    finish: resolvedSpec.finish || 'Medium Torch',

    drumhead: resolvedSpec.drumhead || 'Coated Single Ply',

    tension: resolvedSpec.tension || 'Medium',

    snareSideHead: resolvedSpec.snareSideHead || 'Standard 3mil',

    snareWireCount: Number(resolvedSpec.snareWireCount ?? 20),

    snareWireStyle: resolvedSpec.snareWireStyle || 'Standard',

    snareWireMaterial: resolvedSpec.snareWireMaterial || 'Steel',

    reRings: resolvedSpec.reRings || 'None',

  };

}

function getSelectedBenchmarkMeta({

  benchmarkFamilyId,

  benchmarkTypeId,

  benchmarkSizeId,

}) {

  const family =

    LEGACYPRINT_BENCHMARK_CATALOG.find(

      (item) => item.familyId === benchmarkFamilyId

    ) || LEGACYPRINT_BENCHMARK_CATALOG[0];

  const type =

    family?.benchmarkTypes?.find((item) => item.typeId === benchmarkTypeId) ||

    family?.benchmarkTypes?.[0] ||

    null;

  const resolvedSizeId =

    benchmarkSizeId ||

    type?.defaultSizeId ||

    type?.presetSizes?.[0] ||

    '14x5.5';

  const sizeOption =

    type?.presetSizeOptions?.find((item) => item.sizeId === resolvedSizeId) ||

    null;

  return {

    family,

    type,

    sizeId: resolvedSizeId,

    sizeOption,

  };

}

function buildHeritageSpec({

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  hardwareColor,

  scorchDepth,

  benchmarkFamilyId,

  benchmarkTypeId,

  benchmarkSizeId,

}) {

  const parsed = parseStaveOption(staveOption);

  return {

    scoringIntent: 'heritage_weighted',

    legacyPrintMode: 'heritage_weighted',

    benchmarkMode: 'heritage_weighted',

    benchmarkFamilyId,

    benchmarkTypeId,

    benchmarkSizeId,

    shellFamily: 'wood',

    construction: 'stave',

    primarySpecies: 'oak',

    woodSpeciesLabel: 'Northern Red Oak',

    width: Number(size),

    depth: normalizeDepth(depth),

    lugQuantity: Number(lugs),

    staveCount: parsed.staveCount ?? 16,

    shellThicknessMm: parsed.shellThicknessMm ?? 10,

    thicknessMm: parsed.shellThicknessMm ?? 10,

    shellThickness: parsed.shellThicknessMm ?? 10,

    thickness: parsed.shellThicknessMm ?? 10,

    shellThicknessBucket: getShellThicknessBucket(

      parsed.shellThicknessMm ?? 10

    ),

    hoopType: hoopType || 'Triple Flange',

    hardwareType: 'Tube Lugs',

    hardwareFinish: hardwareColor || 'Chrome',

    bearingEdge: '45 Inner / Strong Outer Roundover',

    snareBedDepth: 'Standard',

    finish: scorchDepth || 'Medium Torch',

    reRings: parsed.hasReRings ? 'Standard' : 'None',

    drumhead: 'Coated Single Ply',

    tension: 'Medium',

    snareSideHead: 'Standard 3mil',

    snareWireCount: 20,

    snareWireStyle: 'Standard',

    snareWireMaterial: 'Steel',

  };

}

function getFinishVoicingProfile(finish = '') {

  if (isLightFinish(finish)) {

    return {

      finishLevel: 'light',

      tonalShift: -1,

      torchTuneDemand: -1,

      sectionVarianceRisk: -1,

      read: 'Light Torch keeps the shell slightly more open, touch-friendly, and lively.',

    };

  }

  if (isBlackenedFinish(finish)) {

    return {

      finishLevel: 'blackened',

      tonalShift: 1,

      torchTuneDemand: 1,

      sectionVarianceRisk: 1,

      read: 'Blackened Torch Tune pushes the shell slightly drier, darker, more controlled, and less touch-open.',

    };

  }

  return {

    finishLevel: 'medium',

    tonalShift: 0,

    torchTuneDemand: 0,

    sectionVarianceRisk: 0,

    read: 'Medium Torch acts as the Heritage reference center between openness and control.',

  };

}

function getDiameterFactor(spec = {}) {

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  return clampUnit((width - HERITAGE_REFERENCE_SPEC.width) / 2);

}

function getDepthFactor(spec = {}) {

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const depthDelta = depth - HERITAGE_REFERENCE_SPEC.depth;

  return clampUnit(depthDelta / 1.65);

}

function getShellStructureFactors(spec = {}) {

  const thickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const hasReRings = hasStandardReRings(spec.reRings);

  const thicknessDelta = Number.isFinite(thickness)

    ? thickness - HERITAGE_REFERENCE_SPEC.shellThicknessMm

    : 0;

  const continuousThicknessFactor = Math.tanh(thicknessDelta / 7.5);

  const thinShellFactor =

    thicknessDelta < 0 ? Math.tanh(Math.abs(thicknessDelta) / 5.25) : 0;

  const thickShellFactor =

    thicknessDelta > 0 ? Math.tanh(thicknessDelta / 8.5) : 0;

  const staveFactor = Math.tanh(

    (staveCount - HERITAGE_REFERENCE_SPEC.staveCount) / 7

  );

  const lugFactor = Math.tanh(

    (lugQuantity - HERITAGE_REFERENCE_SPEC.lugQuantity) / 2

  );

  const lowLugFactor =

    lugQuantity < HERITAGE_REFERENCE_SPEC.lugQuantity

      ? Math.tanh((HERITAGE_REFERENCE_SPEC.lugQuantity - lugQuantity) / 2)

      : 0;

  const highLugFactor =

    lugQuantity > HERITAGE_REFERENCE_SPEC.lugQuantity

      ? Math.tanh((lugQuantity - HERITAGE_REFERENCE_SPEC.lugQuantity) / 2)

      : 0;

  const lowStaveFactor =

    staveCount < HERITAGE_REFERENCE_SPEC.staveCount

      ? Math.tanh((HERITAGE_REFERENCE_SPEC.staveCount - staveCount) / 7)

      : 0;

  const highStaveFactor =

    staveCount > HERITAGE_REFERENCE_SPEC.staveCount

      ? Math.tanh((staveCount - HERITAGE_REFERENCE_SPEC.staveCount) / 7)

      : 0;

  const denseShell = clampUnit(

    thickShellFactor * 0.52 + highStaveFactor * 0.18 + highLugFactor * 0.3

  );

  const openShell = clampUnit(

    thinShellFactor * 0.52 + lowStaveFactor * 0.18 + lowLugFactor * 0.3

  );

  const reRingStability = hasReRings ? 1 : 0;

  const reRingOnThinShell =

    hasReRings && thickness <= 9 ? clampUnit(0.55 + thinShellFactor * 0.45) : 0;

  return {

    shell: clampUnit(

      continuousThicknessFactor * 0.72 + staveFactor * 0.12 + lugFactor * 0.16

    ),

    denseShell,

    openShell,

    reRingStability,

    reRingOnThinShell,

    thicknessFactor: continuousThicknessFactor,

    staveFactor,

    lugFactor,

    thinShellFactor,

    thickShellFactor,

    lowLugFactor,

    highLugFactor,

    lowStaveFactor,

    highStaveFactor,

  };

}

function getShellFactor(spec = {}) {

  return getShellStructureFactors(spec).shell;

}

function getShellWarmthModifier(spec = {}) {

  const thickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const hasReRings = hasStandardReRings(spec.reRings);

  let modifier = 0;

  if (thickness <= 8) {

    modifier += 0.26;

  }

  if (thickness >= 12) {

    modifier -= depth >= 6 ? 0.08 : 0.14;

  }

  if (thickness >= 15 && depth >= 6) {

    modifier += 0.08;

  }

  if (thickness >= 15 && depth >= 6.5) {

    modifier += 0.08;

  }

  if (hasReRings && thickness <= 8) {

    modifier += 0.12;

  }

  return clampUnit(modifier);

}

function getShellSustainModifier(spec = {}) {

  const thickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const hasReRings = hasStandardReRings(spec.reRings);

  let modifier = 0;

  if (thickness <= 8) {

    modifier += 0.18;

  }

  if (thickness >= 12) {

    modifier -= 0.2;

  }

  if (hasReRings) {

    modifier -= 0.1;

  }

  return clampUnit(modifier);

}

function getScorchFactor(spec = {}) {

  const finish = String(spec.finish || HERITAGE_REFERENCE_SPEC.finish);

  if (isLightFinish(finish)) return -1;

  if (isBlackenedFinish(finish)) return 1;

  return 0;

}

function getHoopFactor(spec = {}) {

  const hoopType = String(spec.hoopType || HERITAGE_REFERENCE_SPEC.hoopType);

  if (isDieCastHoop(hoopType)) return 1;

  if (isTripleFlangeHoop(hoopType)) return 0;

  return 0;

}

function getWeightedFactorDeltas(spec = {}) {

  return {

    diameter: getDiameterFactor(spec),

    depth: getDepthFactor(spec),

    shell: getShellFactor(spec),

    scorch: getScorchFactor(spec),

    hoop: getHoopFactor(spec),

  };

}

function getAxisFactorDeltas(spec = {}) {

  const baseFactors = getWeightedFactorDeltas(spec);

  const shellWarmthModifier = getShellWarmthModifier(spec);

  const shellSustainModifier = getShellSustainModifier(spec);

  const shellStructure = getShellStructureFactors(spec);

  return AXES.reduce((acc, axis) => {

    const directions = AXIS_FACTOR_DIRECTIONS[axis] || {};

    const weights = HERITAGE_FACTOR_WEIGHTS[axis] || {};

    const factorMovement =

      (baseFactors.diameter || 0) *

        (directions.diameter || 0) *

        (weights.diameter || 0) +

      (baseFactors.depth || 0) *

        (directions.depth || 0) *

        (weights.depth || 0) +

      (baseFactors.shell || 0) *

        (directions.shell || 0) *

        (weights.shell || 0) +

      (baseFactors.scorch || 0) *

        (directions.scorch || 0) *

        (weights.scorch || 0) +

      (baseFactors.hoop || 0) * (directions.hoop || 0) * (weights.hoop || 0);

    let correctedMovement = factorMovement;

    if (axis === 'attack') {

      correctedMovement += shellStructure.denseShell * 0.12;

      correctedMovement -= shellStructure.openShell * 0.1;

      correctedMovement += shellStructure.highLugFactor * 0.07;

      correctedMovement -= shellStructure.lowLugFactor * 0.08;

      correctedMovement += shellStructure.reRingStability * 0.025;

    }

    if (axis === 'brightness') {

      correctedMovement += shellStructure.denseShell * 0.08;

      correctedMovement -= shellStructure.openShell * 0.06;

      correctedMovement += shellStructure.highLugFactor * 0.035;

      correctedMovement -= shellStructure.lowLugFactor * 0.04;

    }

    if (axis === 'projection') {

      correctedMovement += shellStructure.denseShell * 0.1;

      correctedMovement -= shellStructure.openShell * 0.045;

      correctedMovement += shellStructure.highLugFactor * 0.055;

      correctedMovement += shellStructure.thickShellFactor * 0.055;

      correctedMovement += shellStructure.reRingStability * 0.035;

    }

    if (axis === 'sustain') {

      correctedMovement += shellWarmthModifier * 0.025;

      correctedMovement += shellSustainModifier * (weights.shell || 0) * 0.5;

      correctedMovement += shellStructure.openShell * 0.13;

      correctedMovement -= shellStructure.denseShell * 0.1;

      correctedMovement -= shellStructure.highLugFactor * 0.06;

      correctedMovement += shellStructure.lowLugFactor * 0.075;

      correctedMovement -= shellStructure.reRingStability * 0.07;

      correctedMovement += shellStructure.reRingOnThinShell * 0.035;

    }

    if (axis === 'warmth') {

      correctedMovement += shellWarmthModifier * (weights.shell || 0) * 0.55;

      correctedMovement += shellStructure.openShell * 0.15;

      correctedMovement -= shellStructure.denseShell * 0.08;

      correctedMovement += shellStructure.thinShellFactor * 0.055;

      correctedMovement -= shellStructure.thickShellFactor * 0.045;

      correctedMovement += shellStructure.lowLugFactor * 0.04;

      correctedMovement -= shellStructure.highLugFactor * 0.035;

      correctedMovement += shellStructure.reRingOnThinShell * 0.055;

    }

    if (axis === 'sensitivity') {

      correctedMovement += shellStructure.openShell * 0.12;

      correctedMovement -= shellStructure.denseShell * 0.105;

      correctedMovement += shellStructure.lowLugFactor * 0.055;

      correctedMovement -= shellStructure.highLugFactor * 0.065;

      correctedMovement -= shellStructure.reRingStability * 0.065;

      correctedMovement += shellStructure.reRingOnThinShell * 0.025;

    }

    if (axis === 'control') {

      correctedMovement += shellStructure.denseShell * 0.15;

      correctedMovement -= shellStructure.openShell * 0.12;

      correctedMovement += shellStructure.highLugFactor * 0.08;

      correctedMovement -= shellStructure.lowLugFactor * 0.085;

      correctedMovement += shellStructure.reRingStability * 0.12;

      correctedMovement += shellStructure.reRingOnThinShell * 0.025;

    }

    acc[axis] = round2(correctedMovement);

    return acc;

  }, {});

}

function buildHeritageWeightedProfile(spec = {}) {

  const axisFactorDeltas = getAxisFactorDeltas(spec);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const hasReRings = hasStandardReRings(spec.reRings);

  const isDieCast = isDieCastHoop(spec.hoopType);

  const isBlackened = isBlackenedFinish(spec.finish);

  const isLight = isLightFinish(spec.finish);

  const isTripleFlange = isTripleFlangeHoop(spec.hoopType);

  const rawProfile = AXES.reduce((acc, axis) => {

    acc[axis] = 5 + axisFactorDeltas[axis] * 1.78;

    return acc;

  }, {});

  if (depth >= 6 && !isBlackened) {

    const earlyDepthAmount = clamp((depth - 6) / 1.5, 0, 1);

    rawProfile.warmth += 0.1 + earlyDepthAmount * 0.28;

    rawProfile.sustain += 0.08 + earlyDepthAmount * 0.26;

    rawProfile.projection += 0.06 + earlyDepthAmount * 0.2;

    rawProfile.brightness -= 0.04 + earlyDepthAmount * 0.14;

    rawProfile.attack -= 0.02 + earlyDepthAmount * 0.1;

  }

  if (depth >= 6.5 && depth < 7 && !isBlackened) {

    rawProfile.warmth += 0.22;

    rawProfile.sustain += 0.2;

    rawProfile.projection += 0.16;

    rawProfile.attack -= 0.12;

    rawProfile.brightness -= 0.1;

    rawProfile.sensitivity -= 0.04;

  }

  if (depth >= 6.5 && depth < 7 && isBlackened) {

    rawProfile.warmth += 0.1;

    rawProfile.projection += 0.1;

    rawProfile.control += 0.08;

    rawProfile.attack -= 0.05;

    rawProfile.brightness -= 0.05;

    rawProfile.sensitivity -= 0.05;

  }

  if (depth >= 7.5 && !isBlackened) {

    rawProfile.warmth += 0.12;

    rawProfile.sustain += 0.1;

    rawProfile.projection += 0.06;

    rawProfile.brightness -= 0.07;

    rawProfile.attack -= 0.04;

  }

  if (width >= 14 && depth > 7.5 && !isBlackened) {

    const maxDepthAmount = clamp((depth - 7.5) / 0.5, 0, 1);

    rawProfile.warmth += maxDepthAmount * 0.1;

    rawProfile.sustain += maxDepthAmount * 0.14;

    rawProfile.projection += maxDepthAmount * 0.05;

    rawProfile.attack -= maxDepthAmount * 0.06;

    rawProfile.brightness -= maxDepthAmount * 0.05;

    rawProfile.sensitivity -= maxDepthAmount * 0.03;

  }

  if (width >= 14 && depth > 7.5 && isBlackened) {

    const maxDepthAmount = clamp((depth - 7.5) / 0.5, 0, 1);

    rawProfile.warmth += maxDepthAmount * 0.04;

    rawProfile.sustain += maxDepthAmount * 0.06;

    rawProfile.projection += maxDepthAmount * 0.025;

    rawProfile.attack -= maxDepthAmount * 0.025;

    rawProfile.brightness -= maxDepthAmount * 0.02;

    rawProfile.sensitivity -= maxDepthAmount * 0.015;

    rawProfile.control += maxDepthAmount * 0.015;

  }

  if (depth >= 7.5 && width === 13 && isTripleFlange && !isBlackened) {

    const extraDeepAmount = clamp((depth - 7.5) / 0.5, 0, 1);

    rawProfile.warmth += 0.1 + extraDeepAmount * 0.08;

    rawProfile.sustain += 0.09 + extraDeepAmount * 0.08;

    rawProfile.projection += 0.05 + extraDeepAmount * 0.06;

    rawProfile.brightness -= 0.05 + extraDeepAmount * 0.04;

    rawProfile.attack -= extraDeepAmount * 0.03;

  }

  if (depth >= 7 && width <= 12 && !isBlackened) {

    rawProfile.attack += 0.03;

    rawProfile.projection += 0.04;

  }

  if (depth <= 5) {

    rawProfile.attack += 0.1;

    rawProfile.brightness += 0.08;

    rawProfile.warmth -= 0.08;

    rawProfile.sustain -= 0.06;

  }

  if (width <= 12) {

    rawProfile.attack += 0.08;

    rawProfile.brightness += 0.06;

    rawProfile.warmth -= 0.06;

  }

  if (width >= 14 && depth <= 5) {

    rawProfile.attack += 0.02;

    rawProfile.projection += 0.04;

    rawProfile.warmth += 0.03;

  }

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  const shellThicknessMm = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const isLowLug = lugQuantity < HERITAGE_REFERENCE_SPEC.lugQuantity;

  const isHighLug = lugQuantity > HERITAGE_REFERENCE_SPEC.lugQuantity;

  const isLowStave = staveCount < HERITAGE_REFERENCE_SPEC.staveCount;

  const isHighStave = staveCount > HERITAGE_REFERENCE_SPEC.staveCount;

  const isThinShell = shellThicknessMm <= 8;

  const isThickShell = shellThicknessMm >= 12;

  const isMediumTorch = !isLight && !isBlackened;

  const isReferenceShellRecipe =

    lugQuantity === 8 &&

    staveCount === 16 &&

    shellThicknessMm === 10 &&

    !hasReRings;

  const isOpenReferenceHoop = isTripleFlange;

  if (

    width === 13 &&

    depth === 6 &&

    isReferenceShellRecipe &&

    isOpenReferenceHoop &&

    isMediumTorch

  ) {

    rawProfile.attack += 0.12;

    rawProfile.brightness += 0.14;

    rawProfile.sustain += 0.07;

    rawProfile.control += 0.1;

    rawProfile.projection += 0.04;

  }

  if (

    width === 14 &&

    depth === 6 &&

    isReferenceShellRecipe &&

    isOpenReferenceHoop &&

    isMediumTorch

  ) {

    rawProfile.warmth += 0.14;

    rawProfile.sustain += 0.12;

    rawProfile.projection += 0.1;

    rawProfile.attack -= 0.04;

    rawProfile.brightness -= 0.04;

  }

  if (isHighLug) {

    rawProfile.control += 0.16;

    rawProfile.attack += 0.1;

    rawProfile.projection += 0.06;

    rawProfile.brightness += 0.04;

    rawProfile.sustain -= 0.08;

    rawProfile.sensitivity -= 0.04;

  }

  if (isLowLug) {

    rawProfile.control -= 0.16;

    rawProfile.attack -= 0.1;

    rawProfile.projection -= 0.04;

    rawProfile.brightness -= 0.04;

    rawProfile.sustain += 0.1;

    rawProfile.warmth += 0.07;

    rawProfile.sensitivity += 0.08;

  }

  if (isHighStave) {

    rawProfile.control += 0.08;

    rawProfile.attack += 0.06;

    rawProfile.projection += 0.05;

    rawProfile.sustain -= 0.05;

    rawProfile.sensitivity -= 0.035;

  }

  if (isLowStave) {

    rawProfile.warmth += 0.1;

    rawProfile.sustain += 0.08;

    rawProfile.sensitivity += 0.065;

    rawProfile.control -= 0.075;

    rawProfile.attack -= 0.045;

  }

  if (isThickShell) {

    rawProfile.attack += 0.09;

    rawProfile.projection += 0.09;

    rawProfile.control += 0.12;

    rawProfile.brightness += 0.035;

    rawProfile.sustain -= depth >= 6.5 ? 0.055 : 0.085;

    rawProfile.sensitivity -= 0.07;

    rawProfile.warmth -= depth >= 6.5 ? 0.015 : 0.04;

    if (width >= 14 && depth >= 6) {

      rawProfile.warmth += 0.12;

    }

    if (width >= 14 && depth >= 6.5) {

      rawProfile.warmth += 0.1;

      rawProfile.sustain += 0.04;

    }

    if (width >= 14 && depth >= 7) {

      rawProfile.warmth += 0.08;

      rawProfile.sustain += 0.05;

    }

  }

  if (isThinShell) {

    rawProfile.warmth += 0.12;

    rawProfile.sustain += 0.11;

    rawProfile.sensitivity += 0.09;

    rawProfile.control -= 0.1;

    rawProfile.attack -= 0.06;

    rawProfile.projection -= 0.035;

  }

  if (hasReRings) {

    rawProfile.control += 0.18;

    rawProfile.projection += 0.045;

    rawProfile.sustain -= 0.08;

    rawProfile.sensitivity -= 0.07;

  }

  if (hasReRings && isThinShell) {

    rawProfile.warmth += 0.08;

    rawProfile.sustain += 0.04;

    rawProfile.control += 0.04;

    rawProfile.attack += 0.025;

  }

  if (hasReRings && width <= 12) {

    rawProfile.projection += 0.06;

    rawProfile.warmth += 0.06;

  }

  const isTwelveSixLugReRing =

    width === 12 && lugQuantity === 6 && isThinShell && hasReRings;

  const isFourteenTenLugThick =

    width === 14 && lugQuantity === 10 && isHighStave && isThickShell;

  const isFourteenTenLugThinReRing =

    width === 14 &&

    lugQuantity === 10 &&

    isLowStave &&

    isThinShell &&

    hasReRings;

  if (isTwelveSixLugReRing) {

    rawProfile.warmth += 0.1;

    rawProfile.sustain += 0.08;

    rawProfile.sensitivity += 0.06;

    rawProfile.control -= 0.06;

    rawProfile.attack -= 0.04;

    rawProfile.brightness -= 0.035;

  }

  if (isFourteenTenLugThick) {

    rawProfile.attack += 0.08;

    rawProfile.projection += 0.09;

    rawProfile.control += 0.11;

    rawProfile.sustain -= depth >= 6.5 ? 0.035 : 0.065;

    rawProfile.sensitivity -= 0.055;

    rawProfile.warmth += depth >= 6 ? 0.08 : 0;

    if (depth >= 6.5) {

      rawProfile.warmth += 0.08;

    }

    if (depth >= 7) {

      rawProfile.warmth += 0.06;

    }

  }

  if (isFourteenTenLugThinReRing) {

    rawProfile.warmth += 0.12;

    rawProfile.sustain += 0.09;

    rawProfile.sensitivity += 0.055;

    rawProfile.control += 0.02;

    rawProfile.attack -= 0.025;

    rawProfile.projection -= 0.025;

  }

  if (isDieCast) {

    rawProfile.control += 0.14;

    rawProfile.attack += 0.08;

    rawProfile.sustain -= 0.08;

    rawProfile.sensitivity -= 0.06;

  }

  if (isBlackened) {

    rawProfile.control += 0.12;

    rawProfile.sustain -= 0.08;

    rawProfile.sensitivity -= 0.1;

    rawProfile.brightness -= 0.07;

    if (depth >= 7 && width <= 13) {

      rawProfile.sustain += 0.12;

      rawProfile.warmth += 0.08;

    }

  }

  if (isLight) {

    rawProfile.sensitivity += 0.1;

    rawProfile.sustain += 0.06;

    rawProfile.control -= 0.06;

    if (depth >= 7) {

      rawProfile.sustain += 0.05;

      rawProfile.sensitivity += 0.04;

    }

  }

  return AXES.reduce((acc, axis) => {

    acc[axis] = round2(clamp(rawProfile[axis], 1, 10));

    return acc;

  }, {});

}

function rebaseAgainstBenchmark(currentProfile = {}, benchmarkProfile = {}) {

  const AXIS_BASE_MULTIPLIERS = {

    attack: 0.85,

    sustain: 0.95,

    warmth: 0.9,

    projection: 0.88,

    brightness: 0.82,

    sensitivity: 0.82,

    control: 0.84,

  };

  const rebased = {};

  AXES.forEach((axis) => {

    const current = Number(currentProfile?.[axis] ?? 5);

    const benchmark = Number(benchmarkProfile?.[axis] ?? 5);

    const delta = current - benchmark;

    const axisBase = AXIS_BASE_MULTIPLIERS[axis] ?? 0.85;

    const directionalMultiplier = delta < 0 ? 0.72 : 0.9;

    const scaled = 5 + delta * axisBase * directionalMultiplier;

    rebased[axis] = round2(clamp(scaled, 1, 10));

  });

  return rebased;

}

function isDefaultHeritageBenchmark(input = {}) {

  return (

    input.benchmarkFamilyId === 'ober-custom' &&

    input.benchmarkTypeId === 'heritage-oak-reference' &&

    (input.benchmarkSizeId === '14x5_5' ||

      input.benchmarkSizeId === '14x5.5' ||

      !input.benchmarkSizeId)

  );

}

function axisDelta(profile = {}, axis) {

  return Number(profile?.[axis] ?? 5) - 5;

}

function getShellThicknessRead(spec = {}) {

  const thickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  if (!Number.isFinite(thickness)) {

    return {

      zone: 'reference',

      label: 'Reference shell balance',

      summary:

        'the shell stays close to the Heritage reference thickness, keeping the voice balanced between body, response, and control',

    };

  }

  if (thickness <= 6) {

    return {

      zone: 'veryThin',

      label: 'Very thin shell bloom',

      summary:

        'the very thin shell leans more open, touch-sensitive, and resonant, with less built-in center and less immediate note control',

    };

  }

  if (thickness <= 8) {

    return {

      zone: 'thin',

      label: 'Thin shell warmth',

      summary:

        'the thinner shell adds warmer body, easier bloom, and a more responsive feel under lighter hands',

    };

  }

  if (thickness === 9) {

    return {

      zone: 'lightReference',

      label: 'Light reference shell',

      summary:

        'the shell sits just lighter than the Heritage reference, keeping a little extra openness without moving far from center',

    };

  }

  if (thickness === 10) {

    return {

      zone: 'reference',

      label: 'Reference shell balance',

      summary:

        'the 10mm shell is the Heritage reference center, balancing attack, body, bloom, sensitivity, and control',

    };

  }

  if (thickness === 11) {

    return {

      zone: 'firmReference',

      label: 'Firm reference shell',

      summary:

        'the shell sits just firmer than the Heritage reference, adding a touch more center and focus without becoming heavy',

    };

  }

  if (thickness <= 14) {

    return {

      zone: 'firm',

      label: 'Firm shell response',

      summary:

        'the firmer shell tightens the note shape, adds clearer attack, and shifts some bloom into control',

    };

  }

  if (thickness <= 18) {

    return {

      zone: 'focused',

      label: 'Focused shell crack',

      summary:

        'the thicker shell creates a more focused crack, stronger projection, and a held center with less loose shell bloom',

    };

  }

  return {

    zone: 'heavy',

    label: 'Heavy shell authority',

    summary:

      'the heavy shell emphasizes dense focus, forward attack, and controlled projection while trading away some openness and touch sensitivity',

  };

}

function pickPrimaryGenre(spec = {}, profile = {}) {

  if (spec.depth >= 7.5 && profile.warmth >= 5.45) {

    return 'Americana • Roots Rock • Cinematic Session';

  }

  if (spec.depth >= 7 && profile.warmth >= 5.35) {

    return 'Americana • Roots Rock • Singer-Songwriter';

  }

  if (profile.control >= 5.45 && profile.attack >= 5.35) {

    return 'Pop • Indie • Modern Roots';

  }

  if (spec.depth <= 5.5 && profile.attack >= 5.3) {

    return 'Jazz • Funk • Session';

  }

  if (spec.width <= 12 && profile.sensitivity >= 5.25) {

    return 'Funk • Jazz • Session';

  }

  return 'Roots • Soul • Session';

}

function pickSecondaryGenres(spec = {}, profile = {}) {

  if (spec.depth >= 7.5) {

    return ['Americana', 'Blues Rock', 'Cinematic Session'];

  }

  if (spec.depth >= 7) {

    return ['Americana', 'Blues Rock', 'Cinematic Session'];

  }

  if (profile.control >= 5.45 && profile.attack >= 5.35) {

    return ['Indie', 'Country', 'General Session'];

  }

  if (spec.width <= 12) {

    return ['Funk', 'Jazz', 'Percussion-forward Pop'];

  }

  if (profile.warmth >= 5.35) {

    return ['Soul', 'Folk', 'Singer-Songwriter'];

  }

  return ['Indie', 'Country', 'General Session'];

}

function pickRecordingMic(spec = {}, profile = {}) {

  if (profile.attack >= 5.35 && profile.control >= 5.35) {

    return 'Dynamic top mic with focused condenser support';

  }

  if (spec.depth >= 7 || profile.warmth >= 5.35 || profile.sustain >= 5.35) {

    return 'Warm condenser or ribbon-forward close pairing';

  }

  if (spec.width <= 12) {

    return 'Small-diaphragm condenser or articulate dynamic pairing';

  }

  return 'Balanced dynamic / condenser snare pairing';

}

function buildPlayingSituation(spec = {}, profile = {}) {

  const finish = String(spec.finish || '').toLowerCase();

  const hoop = String(spec.hoopType || '').toLowerCase();

  const isBlackened =

    finish.includes('blackened') ||

    finish.includes('black stain') ||

    finish.includes('black stained') ||

    finish.includes('blacked');

  const isLight = finish.includes('light');

  const isDieCast = hoop.includes('die');

  const isTripleFlange = hoop.includes('triple');

  const hasReRings = hasStandardReRings(spec.reRings);

  const shellThickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  const shellRead = getShellThicknessRead(spec);

  const isVeryThinShell = shellThickness <= 6;

  const isThinShell = shellThickness <= 8;

  const isReferenceShell = shellThickness >= 9 && shellThickness <= 11;

  const isFirmShell = shellThickness >= 12 && shellThickness <= 14;

  const isFocusedShell = shellThickness >= 15 && shellThickness <= 18;

  const isHeavyShell = shellThickness >= 19;

  const isLowLug = lugQuantity < HERITAGE_REFERENCE_SPEC.lugQuantity;

  const isHighLug = lugQuantity > HERITAGE_REFERENCE_SPEC.lugQuantity;

  const isLowStave = staveCount < HERITAGE_REFERENCE_SPEC.staveCount;

  const isHighStave = staveCount > HERITAGE_REFERENCE_SPEC.staveCount;

  const isVeryLowStave = staveCount <= 10;

  const isVeryHighStave = staveCount >= 24;

  const isThickHighLugShell =

    Number(spec.width) >= 14 &&

    Number(spec.lugQuantity) >= 10 &&

    Number(spec.shellThicknessMm) >= 12;

  const isCompactShell = Number(spec.width) <= 12 || Number(spec.depth) <= 5.5;

  const isDeepShell = Number(spec.depth) >= 7;

  const isVeryDeepShell = Number(spec.depth) >= 7.5;

  const attackDelta = axisDelta(profile, 'attack');

  const brightnessDelta = axisDelta(profile, 'brightness');

  const projectionDelta = axisDelta(profile, 'projection');

  const sustainDelta = axisDelta(profile, 'sustain');

  const warmthDelta = axisDelta(profile, 'warmth');

  const sensitivityDelta = axisDelta(profile, 'sensitivity');

  const controlDelta = axisDelta(profile, 'control');

  const strongestMovement = Math.max(

    Math.abs(attackDelta),

    Math.abs(brightnessDelta),

    Math.abs(projectionDelta),

    Math.abs(sustainDelta),

    Math.abs(warmthDelta),

    Math.abs(sensitivityDelta),

    Math.abs(controlDelta)

  );

  if (isThinShell && hasReRings && isLowLug) {

    return `A low-lug thin re-ring Heritage read: ${shellRead.summary}. Fewer tension points let the head and shell breathe more freely, while the re-rings keep the thinner shell supported enough to stay musical and usable.`;

  }

  if (isHighLug && isThinShell && hasReRings) {

    return 'A supported thin-shell Heritage read: the thinner shell adds warmer body, easier bloom, and a more responsive feel under lighter hands. The extra lug count adds some organization and note shape, but the thinner re-ring shell remains the dominant voice — warmer, more open, and more responsive than a thick high-lug build.';

  }

  if (isLowLug && isReferenceShell && isTripleFlange) {

    return 'A more open low-lug Heritage read: fewer tension points let the shell breathe more freely, rounding the attack and giving the note a broader bloom with less built-in control than the 8-lug reference.';

  }

  if (isLowLug) {

    return 'A more open low-lug Heritage read, where fewer tension points soften the front edge, loosen the note shape, and let more shell bloom come forward.';

  }

  if (isHighLug && isThickHighLugShell) {

    return 'A tighter high-lug thick-shell Heritage read, where the added tension points and firmer shell work together for stronger attack definition, projection, and controlled note shape.';

  }

  if (isHighLug && isReferenceShell && isTripleFlange) {

    return 'A tighter high-lug Heritage read: the extra tension points organize the head and shell response, giving the drum a quicker front edge, firmer note shape, and more controlled projection than the 8-lug reference.';

  }

  if (isHighLug) {

    return 'A tighter high-lug Heritage read, where the added tension points increase attack definition, projection, and control while trimming some loose bloom and touch openness.';

  }

  if (isVeryLowStave && isReferenceShell && isTripleFlange) {

    return 'A wider-stave Heritage read: the lower stave count leaves more individual wood character in each section, giving the shell a slightly rounder, warmer, more open response without moving far from the reference center.';

  }

  if (isLowStave && isReferenceShell && isTripleFlange) {

    return 'A slightly wider-stave Heritage read: fewer stave sections keep the shell a touch rounder and more wood-forward, with a little more bloom and less immediate structure than the 16-stave reference.';

  }

  if (isVeryHighStave && isReferenceShell && isTripleFlange) {

    return 'A more segmented high-stave Heritage read: the higher stave count adds subtle structure and definition, giving the shell a cleaner front edge and slightly tighter note shape while still staying close to the reference voice.';

  }

  if (isHighStave && isReferenceShell && isTripleFlange) {

    return 'A slightly tighter high-stave Heritage read: the added stave sections organize the shell response, adding a touch more attack definition, projection, and control than the 16-stave reference.';

  }

  if (isLowStave) {

    return 'A wider-stave Heritage read, where fewer shell sections keep more wood character and warmth in the response, with a rounder note shape and a little more bloom.';

  }

  if (isHighStave) {

    return 'A higher-stave Heritage read, where the added shell sections bring a little more structure, front-edge definition, and note organization.';

  }

  if (isVeryThinShell && hasReRings) {

    return `A very thin Heritage shell read with extra support from the re-rings: ${shellRead.summary}. The re-rings keep the voice from getting too loose, so the result is open and touch-friendly but still usable in the center.`;

  }

  if (isVeryThinShell) {

    return `A very thin Heritage shell read: ${shellRead.summary}. Expect a more breathing, expressive voice with softer attack focus and more shell movement under the stick.`;

  }

  if (isThinShell && hasReRings) {

    return `A thin re-ring Heritage read: ${shellRead.summary}. The re-rings add just enough structure to keep the bloom organized while preserving the livelier thin-shell response.`;

  }

  if (isThinShell && isLight) {

    return `A light, open Heritage read: ${shellRead.summary}. The lighter Torch Tune finish keeps the shell especially touch-friendly and lets the thinner body speak more freely.`;

  }

  if (isThinShell) {

    return `A thin-shell Heritage read: ${shellRead.summary}. It should feel more forgiving, warmer through the body, and a little less locked-in than the reference build.`;

  }

  if (isHeavyShell && isDieCast && isBlackened) {

    return `A heavy, highly focused Heritage read: ${shellRead.summary}. Die-Cast hoops and the Blackened Torch Tune finish push the drum toward maximum control, crack, and contained projection.`;

  }

  if (isHeavyShell) {

    return `A heavy-shell Heritage read: ${shellRead.summary}. The voice should feel dense, centered, and authoritative, with less airy bloom than the reference shell.`;

  }

  if (isFocusedShell && isDieCast) {

    return `A focused thick-shell Heritage read: ${shellRead.summary}. Die-Cast hoops add more rim discipline, making the note feel cleaner, firmer, and more controlled.`;

  }

  if (isFocusedShell) {

    return `A focused thick-shell Heritage read: ${shellRead.summary}. It keeps the Heritage wood character, but the note speaks with more crack, direction, and center.`;

  }

  if (isFirmShell && isBlackened) {

    return `A firm, Torch Tune-forward Heritage read: ${shellRead.summary}. The Blackened finish adds extra dryness and control, pulling the shell toward a more disciplined center.`;

  }

  if (isFirmShell) {

    return `A firm-shell Heritage read: ${shellRead.summary}. It should feel tighter and more articulate than the reference, with less loose bloom and a clearer front edge.`;

  }

  if (isReferenceShell && isLight && isDieCast) {

    return 'A focused-but-open Heritage read: the die-cast hoops tighten the rim response, while the lighter Torch Tune finish keeps more touch, air, and upper-shell liveliness in the voice.';

  }

  if (isReferenceShell && isBlackened && isDieCast && isThickHighLugShell) {

    return 'A beefy, high-projection Heritage read with a stronger crack, firmer die-cast focus, and a drier Torch Tuned shell response from the Blackened finish.';

  }

  if (isBlackened && isDieCast && isThickHighLugShell) {

    return 'A beefy, high-projection Heritage read with a stronger crack, firmer die-cast focus, and a drier Torch Tuned shell response from the Blackened finish.';

  }

  if (isBlackened && isCompactShell && isTripleFlange) {

    return 'A compact, Torch Tuned Heritage read: still lively from the smaller shell, but darker and more settled than the same build in a lighter finish.';

  }

  if (

    isBlackened &&

    (controlDelta >= 0.2 || sustainDelta <= -0.2 || sensitivityDelta <= -0.2)

  ) {

    return 'A more Torch Tune-forward Heritage read, where the heavier scorch treatment adds a firmer center, slightly tighter bloom, and a more settled shell response.';

  }

  if (isDieCast) {

    if (isDeepShell && projectionDelta >= 0.35) {

      return 'A deeper focused Heritage read with stronger room throw, firmer note shape, and a more controlled bloom than the open triple-flange version.';

    }

    return 'A more focused Heritage read with firmer note shape, cleaner front edge, and tighter overall behavior.';

  }

  if (isLight && sensitivityDelta >= 0.08) {

    if (hasReRings && sustainDelta >= 0.35 && brightnessDelta <= -0.08) {

      return 'A darker, more complex Heritage read with a drier top edge, longer sustain, and extra overtone character from the thin re-ring shell.';

    }

    return 'A more open Heritage read, where the lighter Torch Tune treatment preserves extra liveliness, touch response, and a slightly freer bloom through the shell.';

  }

  if (

    isVeryDeepShell &&

    isTripleFlange &&

    !isLight &&

    !isBlackened &&

    warmthDelta >= 0.3

  ) {

    return 'A deeper Heritage read with more shell body, longer bloom, and a broader room shape while the Triple Flange hoops keep the voice open enough to breathe.';

  }

  if (

    isVeryDeepShell &&

    isTripleFlange &&

    !isLight &&

    !isBlackened &&

    brightnessDelta <= -0.18

  ) {

    return 'A darker, deeper Heritage read with a drier top edge, grounded body, and enough classic Triple Flange openness to keep the shell alive.';

  }

  if (isDeepShell && (warmthDelta >= 0.25 || sustainDelta >= 0.25)) {

    return 'A fuller Heritage read with broader body, deeper bloom, and a more grounded voice in the room.';

  }

  if (isCompactShell && attackDelta >= 0.25 && warmthDelta <= -0.18) {

    return 'A compact Heritage read with more bite, quicker sustain, leaner body, and a dry, immediate front edge than the reference build.';

  }

  if (sensitivityDelta >= 0.3) {

    return 'A touch-friendly Heritage read that stays expressive under lighter hands while keeping its shell identity.';

  }

  if (

    hasReRings &&

    Number(spec.width) <= 12 &&

    Number(spec.depth) >= 6.5 &&

    warmthDelta >= 0.15

  ) {

    return 'A compact all-round Heritage read with extra studio warmth from the deeper small shell and a supported re-ring response.';

  }

  if (strongestMovement >= 0.3) {

    return 'A shifted Heritage read with a noticeable personality move away from the reference center while still keeping the line’s shell-first character.';

  }

  return 'A balanced Heritage read with natural openness, grounded body, and classic shell-first response.';

}

function buildFeelRead(spec = {}, profile = {}) {

  const visualParts = [];

  const isBlackened = isBlackenedFinish(spec.finish);

  const isLight = isLightFinish(spec.finish);

  if (isBlackened) {

    visualParts.push('darker');

  } else if (isLight) {

    visualParts.push('cleaner');

  } else {

    visualParts.push('seasoned');

  }

  if (spec.hardwareFinish === 'Brass/Gold') {

    visualParts.push('richer');

  } else if (spec.hardwareFinish === 'Black Nickel') {

    visualParts.push('slightly more modern');

  } else {

    visualParts.push('classic');

  }

  let finishLean = 'with a balanced Torch Tune posture';

  if (isBlackened) {

    finishLean =

      'with a stronger Torch Tune imprint that favors firmer note control, slightly lower sensitivity, and a more unified shell response under heavier treatment';

  } else if (isLight) {

    finishLean =

      'with a lighter Torch Tune imprint that preserves more openness, touch response, and a slightly freer shell reaction';

  }

  const soundLean =

    profile.warmth >= 5.35

      ? 'while keeping the emphasis on body, weight, and shell character'

      : profile.attack >= 5.35

        ? 'while keeping the front edge firm and articulate'

        : profile.control >= 5.35

          ? 'while keeping the shell centered and composed'

          : 'while keeping the shell-first balance intact';

  return `A ${visualParts.join(', ')} Heritage presentation ${finishLean}, ${soundLean}.`;

}

function getDiameterVoiceFamily(spec = {}, profile = {}) {

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const attackDelta = axisDelta(profile, 'attack');

  const projectionDelta = axisDelta(profile, 'projection');

  const sustainDelta = axisDelta(profile, 'sustain');

  const warmthDelta = axisDelta(profile, 'warmth');

  const controlDelta = axisDelta(profile, 'control');

  const isCompactDiameter = width <= 12;

  const isAlternateDiameter = width === 13;

  const isFullDiameter = width >= 14;

  if (isCompactDiameter) {

    if (depth >= 7.5 && (warmthDelta >= 0.35 || sustainDelta >= 0.35)) {

      return 'compactDeepBody';

    }

    if (depth >= 6.5 && projectionDelta >= 0.25) {

      return 'compactPunch';

    }

    if (attackDelta >= 0.25) {

      return 'quickBright';

    }

    return 'compactBalanced';

  }

  if (isAlternateDiameter) {

    if (depth >= 7.5 && (warmthDelta >= 0.3 || sustainDelta >= 0.3)) {

      return 'alternateDeepBody';

    }

    if (depth >= 6.5 && projectionDelta >= 0.25) {

      return 'balancedCarry';

    }

    return 'balancedCenter';

  }

  if (isFullDiameter) {

    if (depth >= 7.5) {

      return controlDelta >= 0.35 ? 'bigControlledBody' : 'bigBloom';

    }

    if (depth >= 6.5) {

      return controlDelta >= 0.35 ? 'warmFocusedBody' : 'warmBody';

    }

  }

  return null;

}

function getDominantToneFamily(spec = {}, profile = {}) {

  const diameterFamily = getDiameterVoiceFamily(spec, profile);

  const attackDelta = axisDelta(profile, 'attack');

  const brightnessDelta = axisDelta(profile, 'brightness');

  const projectionDelta = axisDelta(profile, 'projection');

  const sustainDelta = axisDelta(profile, 'sustain');

  const warmthDelta = axisDelta(profile, 'warmth');

  const sensitivityDelta = axisDelta(profile, 'sensitivity');

  const controlDelta = axisDelta(profile, 'control');

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const shellThicknessMm = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const isBlackened = isBlackenedFinish(spec.finish);

  const isLight = isLightFinish(spec.finish);

  const isDieCast = isDieCastHoop(spec.hoopType);

  const hasReRings = hasStandardReRings(spec.reRings);

  const isCompact = width <= 12 || depth <= 5.25;

  const isDeep = depth >= 7;

  const isVeryDeep = depth >= 7.5;

  const isThin = shellThicknessMm <= 8;

  const isThick = shellThicknessMm >= 12;

  const isLowLug = lugQuantity < HERITAGE_REFERENCE_SPEC.lugQuantity;

  const isHighLug = lugQuantity > HERITAGE_REFERENCE_SPEC.lugQuantity;

  if (diameterFamily) {

    return diameterFamily;

  }

  if (isBlackened && controlDelta >= 0.25 && sustainDelta <= -0.2) {

    return 'dryControlled';

  }

  if (isDieCast && attackDelta >= 0.45 && controlDelta >= 0.35) {

    return 'focusedCrack';

  }

  if (isVeryDeep && warmthDelta >= 0.25 && sustainDelta >= 0.2) {

    return 'bigBloom';

  }

  if (isDeep && warmthDelta >= 0.2) {

    return 'warmBody';

  }

  if (isThin && hasReRings && sensitivityDelta >= 0.15) {

    return 'openResponsive';

  }

  if (isThin && isLowLug) {

    return 'softOpen';

  }

  if (isCompact && attackDelta >= 0.25 && brightnessDelta >= 0.25) {

    return 'quickBright';

  }

  if (isHighLug && controlDelta >= 0.25) {

    return 'tightDefined';

  }

  if (isLight && sensitivityDelta >= 0.15) {

    return 'livelyOpen';

  }

  if (isThick && projectionDelta >= 0.25) {

    return 'forwardFocused';

  }

  if (warmthDelta >= 0.25 && sustainDelta >= 0.15) {

    return 'warmBloom';

  }

  if (attackDelta >= 0.25 && brightnessDelta >= 0.2) {

    return 'crispAttack';

  }

  if (controlDelta >= 0.25) {

    return 'cleanControlled';

  }

  return 'balancedCenter';

}

function getHeritageFirstListenMeta(spec = {}) {

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const lugs = Number(spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity);

  const thickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  return {

    width,

    depth,

    lugs,

    thickness,

    isCompact: width <= 12,

    isMiddle: width === 13,

    isFullSize: width >= 14,

    isShallow: depth <= 5.5,

    isDeep: depth >= 7,

    isVeryDeep: depth >= 7.5,

    isMaximumDepth: depth >= 8,

    isThinShell: thickness <= 8,

    isVeryThinShell: thickness <= 7,

    isThickShell: thickness >= 12,

    isFocusedShell: thickness >= 15,

    isSixLug: lugs <= 6,

    isTenLug: lugs >= 10,

    isDieCast: isDieCastHoop(spec.hoopType),

    isTripleFlange: isTripleFlangeHoop(spec.hoopType),

    isBlackened: isBlackenedFinish(spec.finish),

    isLight: isLightFinish(spec.finish),

    hasReRings: hasStandardReRings(spec.reRings),

  };

}

function buildFirstListenNodeReads(nodes = [], spec = {}, profile = {}) {

  const meta = getHeritageFirstListenMeta(spec);

  const readsByNode = {

    attack: () => {

      if (meta.isCompact && meta.isShallow) {

        return 'The first thing you notice is the quicker side-snare snap — the note starts fast, tight, and immediate.';

      }

      if (meta.isDieCast || meta.isTenLug || meta.isFocusedShell) {

        return 'The front edge feels more defined and organized, so the stick attack arrives cleaner and more intentionally.';

      }

      return 'The note starts with a clear, familiar Heritage edge before the body and shell tone open behind it.';

    },

    brightness: () => {

      if (meta.isShallow || meta.isCompact) {

        return 'The top edge feels clearer right away, giving the drum a crisp, articulate first impression.';

      }

      if (meta.isBlackened) {

        return 'The brightness reads more as a dry upper edge than a shiny top end — crisp, but darker and more contained.';

      }

      return 'The upper edge gives the first hit a little more clarity and definition before the warmer shell body settles in.';

    },

    projection: () => {

      if (meta.isDeep || meta.isTenLug || meta.isThickShell) {

        return 'The drum feels like it pushes outward quickly, with the note carrying forward instead of staying tucked near the player.';

      }

      if (meta.isCompact) {

        return 'The smaller shell still throws forward clearly, giving the compact voice more presence than its size suggests.';

      }

      return 'The note carries into the room with enough forward presence to be noticed without losing the Heritage center.';

    },

    sustain: () => {

      if (meta.isVeryDeep && meta.isTripleFlange) {

        return 'The bloom hangs longer after the hit, so the shell’s depth becomes part of the first impression.';

      }

      if (meta.isThinShell || meta.hasReRings) {

        return 'The shell movement lingers a little more, giving the note a breathing, woody tail after the strike.';

      }

      return 'The note keeps speaking after the hit, adding a longer shell bloom rather than stopping short.';

    },

    warmth: () => {

      if (meta.isFullSize && meta.isDeep) {

        return 'The center of the sound feels bigger and more body-rich right away — a fuller main-snare voice with more low-mid weight.';

      }

      if (meta.isFullSize) {

        return 'The drum immediately reads with familiar 14-inch body: woody, grounded, and fuller through the center.';

      }

      if (meta.isMiddle) {

        return 'The body feels rounder than a compact side snare while still staying tighter than a full 14-inch main voice.';

      }

      return 'The warmth shows up as compact wood body — present, but tighter and less wide than the larger Heritage paths.';

    },

    sensitivity: () => {

      if (meta.isThinShell || meta.isSixLug || meta.isLight) {

        return 'The shell feels more touch-open, so lighter strokes and small dynamic changes come forward earlier.';

      }

      return 'The drum gives back more detail under the hands, especially in softer notes and lighter response.';

    },

    control: () => {

      if (meta.isDieCast && meta.isTenLug) {

        return 'The note shape feels locked in right away — tighter tension spread, firmer rim behavior, and less loose bloom.';

      }

      if (meta.isDieCast || meta.isBlackened || meta.isThickShell) {

        return 'The response feels more contained and easier to place, with the note holding together instead of spreading wide.';

      }

      return 'The drum keeps enough organization around the note to feel usable and centered, even when the shell stays open.';

    },

  };

  return nodes.map((nodeKey, index) => {

    const definition = FIRST_LISTEN_AXIS_DEFINITIONS[nodeKey];

    return {

      key: nodeKey,

      label: definition?.label || nodeKey,

      rank: index + 1,

      definition:

        definition?.general || 'A core part of the first impression.',

      read:

        readsByNode[nodeKey]?.() ||

        'This trait is one of the first things your ear is likely to catch in this configuration.',

      value: Number(profile?.[nodeKey] ?? 5),

    };

  });

}

function buildFirstListenSummary(nodes = []) {

  const hasWarmth = nodes.includes('warmth');

  const hasSustain = nodes.includes('sustain');

  const hasProjection = nodes.includes('projection');

  const hasAttack = nodes.includes('attack');

  const hasBrightness = nodes.includes('brightness');

  const hasSensitivity = nodes.includes('sensitivity');

  const hasControl = nodes.includes('control');

  if (hasControl && hasAttack && hasProjection) {

    return 'The drum is reading with a cleaner front edge, tighter note shape, and stronger forward push right away.';

  }

  if (hasWarmth && hasProjection && hasControl) {

    return 'The drum is reading with a fuller body, stronger room presence, and enough organization to keep the note shaped and usable.';

  }

  if (hasWarmth && hasSustain && hasProjection) {

    return 'The drum is reading with more body, longer bloom, and broader room shape while still keeping the Heritage voice grounded.';

  }

  if (hasAttack && hasBrightness && hasControl) {

    return 'The drum is reading as drier, quicker, and more controlled, with a clearer edge and a more contained response.';

  }

  if (hasAttack && hasBrightness) {

    return 'The drum is reading with a quicker front edge and clearer top-end response — immediate, articulate, and easy to notice right away.';

  }

  if (hasAttack && hasSensitivity) {

    return 'The drum is reading with a fast first response and a more touch-sensitive feel — quick under the stick without losing musical nuance.';

  }

  if (hasSensitivity && hasSustain && hasWarmth) {

    return 'The drum is reading as open, touch-sensitive, and woody, with more shell movement and a breathing response under the hands.';

  }

  const sortedNodeSignature = [...nodes].sort().join('|');

  if (sortedNodeSignature === 'attack|projection|warmth') {

    return 'The drum is reading with a warm center, a clear front edge, and enough forward push to feel present without losing its grounded Heritage body.';

  }

  if (sortedNodeSignature === 'attack|control|warmth') {

    return 'The drum is reading with a fuller center, cleaner stick definition, and a more organized note shape under the hands.';

  }

  return 'The drum is reading with a clear first impression across its main voice traits, giving the player a quick read on body, response, and note shape before the full analysis.';

}

function buildCanonicalHeritageFirstListen(spec = {}, profile = {}) {

  const family = getDominantToneFamily(spec, profile);

  const meta = getHeritageFirstListenMeta(spec);

  const titleByFamily = {

    bigBloom: meta.isMaximumDepth

      ? 'Maximum depth with extended bloom'

      : 'Big warmth with longer room bloom',

    warmBody: meta.isFullSize

      ? 'Deep warmth with open carry'

      : 'Warm alternate body with open carry',

    warmBloom: 'Warm shell tone with open bloom',

    quickBright: meta.isCompact

      ? 'Quick side-snare snap'

      : 'Quick main-snare body with open edge',

    crispAttack: 'Crisp front edge with clear response',

    dryControlled: 'Dry snap with dark control',

    focusedCrack: 'Focused power with clean shape',

    tightDefined: 'Precise throw with locked-in shape',

    openResponsive: 'Open touch with woody bloom',

    softOpen: 'Open touch with organic response',

    livelyOpen: 'Fast touch with open response',

    forwardFocused: 'Strong shell voice with open carry',

    cleanControlled: 'Settled center with clean control',

    balancedCenter: meta.isFullSize

      ? 'Classic Heritage center with open response'

      : meta.isMiddle

        ? 'Balanced alternate touch with open center'

        : 'Compact clear response',

    compactDeepBody: 'Compact depth with open bloom',

    compactPunch: meta.isDieCast

      ? 'Compact punch with clean control'

      : 'Compact body with open response',

    compactBalanced: 'Quick side-snare snap',

    alternateDeepBody: meta.isMaximumDepth

      ? 'Full alternate voice with extended bloom'

      : 'Deep alternate bloom with room presence',

    balancedCarry: 'Balanced body with open carry',

    bigControlledBody: meta.isMaximumDepth

      ? 'Maximum body with focused control'

      : 'Big body with focused room push',

    warmFocusedBody: 'Fuller body with focused room push',

  };

  const nodeByFamily = {

    bigBloom: meta.isDieCast

      ? ['warmth', 'control', 'projection']

      : ['warmth', 'sustain', 'projection'],

    warmBody: meta.isDieCast

      ? ['warmth', 'control', 'attack']

      : ['warmth', 'projection', 'sustain'],

    warmBloom: ['warmth', 'sustain', 'projection'],

    quickBright: meta.isDieCast

      ? ['attack', 'control', 'brightness']

      : ['attack', 'brightness', 'sensitivity'],

    crispAttack: ['attack', 'brightness', 'control'],

    dryControlled: ['attack', 'control', 'brightness'],

    focusedCrack: ['projection', 'control', 'attack'],

    tightDefined: ['control', 'projection', 'attack'],

    openResponsive: ['sensitivity', 'sustain', 'warmth'],

    softOpen: ['sensitivity', 'sustain', 'warmth'],

    livelyOpen: ['attack', 'sensitivity', 'brightness'],

    forwardFocused: ['projection', 'attack', 'warmth'],

    cleanControlled: ['warmth', 'control', 'attack'],

    balancedCenter: meta.isFullSize

      ? ['warmth', 'attack', 'sensitivity']

      : meta.isMiddle

        ? ['attack', 'warmth', 'sensitivity']

        : ['attack', 'brightness', 'sensitivity'],

    compactDeepBody: meta.isDieCast

      ? ['control', 'projection', 'attack']

      : ['projection', 'sustain', 'warmth'],

    compactPunch: meta.isDieCast

      ? ['control', 'projection', 'attack']

      : ['attack', 'projection', 'sensitivity'],

    compactBalanced: ['attack', 'brightness', 'sensitivity'],

    alternateDeepBody: meta.isDieCast

      ? ['warmth', 'projection', 'control']

      : ['warmth', 'sustain', 'projection'],

    balancedCarry: ['warmth', 'attack', 'projection'],

    bigControlledBody: ['warmth', 'projection', 'control'],

    warmFocusedBody: ['warmth', 'projection', 'control'],

  };

  let nodes = nodeByFamily[family] || nodeByFamily.balancedCenter;

  let title = titleByFamily[family] || titleByFamily.balancedCenter;

  if (meta.isCompact && meta.isShallow) {

    title = meta.isDieCast

      ? 'Compact snap with clean control'

      : 'Quick side-snare snap';

    nodes = meta.isDieCast

      ? ['attack', 'control', 'brightness']

      : ['attack', 'brightness', 'sensitivity'];

  }

  if (meta.isCompact && !meta.isShallow && !meta.isDeep) {

    title = 'Compact clear response';

    nodes = ['attack', 'brightness', 'sensitivity'];

  }

  if (meta.isCompact && meta.isDeep) {

    title = meta.isMaximumDepth

      ? 'Compact depth with extended bloom'

      : 'Compact depth with open bloom';

    nodes = ['warmth', 'sustain', 'projection'];

  }

    if (

    meta.isFullSize &&

    meta.depth === 6 &&

    !meta.isDieCast &&

    !meta.isBlackened &&

    !meta.isThinShell &&

    !meta.isThickShell

  ) {

    title = 'Classic Heritage body with open carry';

    nodes = ['warmth', 'attack', 'projection'];

  }

  if (meta.isDieCast && meta.isTenLug && meta.isThickShell) {

    title = meta.isBlackened

      ? 'Focused power with dark control'

      : 'Focused power with clean shape';

    nodes = ['control', 'attack', 'projection'];

  }

  if (

    meta.isBlackened &&

    meta.isDeep &&

    !meta.isVeryDeep &&

    !(meta.isDieCast && meta.isTenLug && meta.isThickShell)

  ) {

    title = 'Dark, deep controlled body';

    nodes = ['warmth', 'control', 'projection'];

  }

  if (meta.isBlackened && meta.isShallow) {

    title = 'Dry snap with dark control';

    nodes = ['attack', 'control', 'brightness'];

  }

  if (meta.isLight && meta.isThinShell) {

    title = 'Open touch with woody bloom';

    nodes = ['sensitivity', 'sustain', 'warmth'];

  }

  if (meta.hasReRings && meta.isThinShell) {

    title = 'Responsive shell with supported bloom';

    nodes = ['sensitivity', 'warmth', 'sustain'];

  }

  if (meta.isFullSize && meta.isVeryThinShell) {

    title = 'Open, breathing Heritage body';

    nodes = ['warmth', 'sustain', 'sensitivity'];

  }

  const visualProfile = profile;

  return {

    title,

    nodes,

    summary: buildFirstListenSummary(nodes, spec, profile),

    nodeReads: buildFirstListenNodeReads(nodes, spec, profile),

    visualProfile,

    ruleFamily: family,

  };

}

function buildFirstTellTitle(spec = {}, profile = {}) {

  const family = getDominantToneFamily(spec, profile);

  const titleByFamily = {

    bigBloom: 'Big, warm, and open',

    warmBody: 'Warm, full, and rounded',

    warmBloom: 'Warm, open, and blooming',

    quickBright: 'Quick, bright, and crisp',

    crispAttack: 'Crisp, clear, and immediate',

    dryControlled: 'Dry, focused, and controlled',

    focusedCrack: 'Strong, clear, and punchy',

    tightDefined: 'Tight, clean, and defined',

    openResponsive: 'Open, warm, and responsive',

    softOpen: 'Soft, round, and open',

    livelyOpen: 'Lively, open, and expressive',

    forwardFocused: 'Forward, firm, and focused',

    cleanControlled: 'Clean, balanced, and controlled',

    balancedCenter: 'Balanced, warm, and clear',

    compactDeepBody: 'Compact depth with stronger body',

    compactPunch: 'Compact punch with focused carry',

    compactBalanced: 'Compact, clear, and balanced',

    alternateDeepBody: 'Balanced depth with added body',

    balancedCarry: 'Balanced voice with focused carry',

    bigControlledBody: 'Big body with focused room push',

    warmFocusedBody: 'Deep warmth with clear presence',

  };

  return titleByFamily[family] || titleByFamily.balancedCenter;

}

function buildPlayerReadTitle(spec = {}, profile = {}) {

  const family = getDominantToneFamily(spec, profile);

  const titleByFamily = {

    bigBloom: 'Full body with a longer bloom',

    warmBody: 'Rounded body with a grounded center',

    warmBloom: 'Warm shell tone with open sustain',

    quickBright: 'Fast attack with clean stick definition',

    crispAttack: 'Clear front edge with quick response',

    dryControlled: 'Controlled crack with a shorter note',

    focusedCrack: 'Focused punch with strong rim control',

    tightDefined: 'Tighter response with organized rebound',

    openResponsive: 'Open shell response under lighter hands',

    softOpen: 'Rounder attack with easier shell movement',

    livelyOpen: 'Responsive touch with extra air',

    forwardFocused: 'Forward projection with firm note shape',

    cleanControlled: 'Composed response with usable focus',

    balancedCenter: 'Classic Heritage balance under the hands',

    compactDeepBody: 'Compact shell depth with fuller punch',

    compactPunch: 'Compact punch with clean control',

    compactBalanced: 'Compact balance with clear response',

    alternateDeepBody: 'Balanced alternate voice with added body',

    balancedCarry: 'Balanced carry with a controlled center',

    bigControlledBody: 'Large body with controlled room push',

    warmFocusedBody: 'Warm body with focused presence',

  };

  return titleByFamily[family] || titleByFamily.balancedCenter;

}

function getIdentityFinishWord(spec = {}) {

  const finish = String(spec.finish || '');

  if (isBlackenedFinish(finish)) return 'Blackened';

  if (isLightFinish(finish)) return 'Light-Torch';

  return 'Torch';

}

function getIdentityHardwareWord(spec = {}) {

  const hardwareFinish = String(spec.hardwareFinish || 'Chrome');

  if (hardwareFinish === 'Black Nickel') return 'Shadowed';

  if (hardwareFinish === 'Brass/Gold') return 'Gilded';

  return 'Chrome';

}

function getIdentityShellWord(spec = {}) {

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const shellThicknessMm = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  const hasReRings = hasStandardReRings(spec.reRings);

  if (width <= 12 && depth >= 7.5) return 'Deep-Compact';

  if (width <= 12) return 'Compact';

  if (width >= 14 && depth >= 7.5) return 'Deepwater';

  if (depth >= 7.5) return 'Deep';

  if (shellThicknessMm <= 8 && hasReRings) return 'Re-Ring';

  if (shellThicknessMm <= 8) return 'Open-Shell';

  if (shellThicknessMm >= 12 && lugQuantity >= 10) return 'High-Tension';

  if (shellThicknessMm >= 12) return 'Firm-Shell';

  if (staveCount <= 12) return 'Wide-Stave';

  if (staveCount >= 20) return 'Fine-Stave';

  return 'Heritage';

}

function getIdentityVoiceWord(spec = {}, profile = {}) {

  const family = getDominantToneFamily(spec, profile);

  const wordByFamily = {

    bigBloom: 'Bloom',

    warmBody: 'Body',

    warmBloom: 'Bloom',

    quickBright: 'Spark',

    crispAttack: 'Edge',

    dryControlled: 'Ember',

    focusedCrack: 'Crack',

    tightDefined: 'Focus',

    openResponsive: 'Breath',

    softOpen: 'Drift',

    livelyOpen: 'Air',

    forwardFocused: 'Throw',

    cleanControlled: 'Center',

    balancedCenter: 'Voice',

  };

  return wordByFamily[family] || wordByFamily.balancedCenter;

}

function getIdentityHoopWord(spec = {}) {

  if (isDieCastHoop(spec.hoopType)) return 'Locked Frame';

  return 'Open Frame';

}

function getIdentityDepthWord(spec = {}) {

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  if (depth <= 5) return 'Short Voice';

  if (depth <= 5.5) return 'Main Voice';

  if (depth <= 6.5) return 'Full Voice';

  if (depth <= 7.5) return 'Deep Voice';

  return 'Long Voice';

}

function getIdentityStructureWord(spec = {}) {

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  const shellThicknessMm = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  const hasReRings = hasStandardReRings(spec.reRings);

  if (hasReRings && shellThicknessMm <= 8) {

    return `${lugQuantity}-Lug Re-Ring`;

  }

  if (shellThicknessMm >= 12) {

    return `${lugQuantity}-Lug Firm Shell`;

  }

  if (staveCount >= 20) {

    return `${lugQuantity}-Lug Fine Stave`;

  }

  if (staveCount <= 12) {

    return `${lugQuantity}-Lug Wide Stave`;

  }

  return `${lugQuantity}-Lug Reference Stave`;

}

function getIdentitySizeWord(spec = {}) {

  const width = Number(spec.width || HERITAGE_REFERENCE_SPEC.width);

  const depth = Number(spec.depth || HERITAGE_REFERENCE_SPEC.depth);

  const cleanWidth = Number.isFinite(width)

    ? width

    : HERITAGE_REFERENCE_SPEC.width;

  const cleanDepth = Number.isFinite(depth)

    ? depth

    : HERITAGE_REFERENCE_SPEC.depth;

  return `${cleanWidth}x${cleanDepth}`;

}

function buildIdentityShapeTitle(spec = {}, profile = {}) {

  const finishWord = getIdentityFinishWord(spec);

  const hardwareWord = getIdentityHardwareWord(spec);

  const shellWord = getIdentityShellWord(spec);

  const voiceWord = getIdentityVoiceWord(spec, profile);

  const sizeWord = getIdentitySizeWord(spec);

  const depthWord = getIdentityDepthWord(spec);

  const structureWord = getIdentityStructureWord(spec);

  const hoopWord = getIdentityHoopWord(spec);

  const coreParts =

    hardwareWord === 'Chrome'

      ? [finishWord, shellWord, voiceWord]

      : [hardwareWord, finishWord, shellWord, voiceWord];

  const coreTitle = coreParts.filter(Boolean).join(' ');

  return `${coreTitle} — ${sizeWord}, ${depthWord}, ${structureWord}, ${hoopWord}`;

}

function pushUnique(parts, phrase) {

  if (!phrase) return;

  if (!parts.includes(phrase)) {

    parts.push(phrase);

  }

}

function capitalizeFirst(value = '') {

  const text = String(value || '').trim();

  if (!text) return '';

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

}

function joinHighlightedParts(parts = []) {

  const cleanParts = parts

    .map((part) => String(part || '').trim())

    .filter(Boolean)

    .slice(0, 5);

  if (!cleanParts.length) {

    return 'The build stays close to the benchmark Heritage center, with a balanced shell-first voice.';

  }

  const [first, ...rest] = cleanParts;

  if (!rest.length) {

    return `${capitalizeFirst(first)}.`;

  }

  return `${capitalizeFirst(first)}; ${rest.join('; ')}.`;

}

function buildHighlightedCharacteristics(spec = {}, profile = {}) {

  const finish = String(spec.finish || '').toLowerCase();

  const hoop = String(spec.hoopType || '').toLowerCase();

  const isBlackened =

    finish.includes('blackened') ||

    finish.includes('black stain') ||

    finish.includes('black stained') ||

    finish.includes('blacked');

  const isLight = finish.includes('light');

  const isDieCast = hoop.includes('die');

  const isTripleFlange = hoop.includes('triple');

  const hasReRings = hasStandardReRings(spec.reRings);

  const isThinShell = Number(spec.shellThicknessMm || 10) <= 8;

  const isThickHighLugShell =

    Number(spec.width) >= 14 &&

    Number(spec.lugQuantity) >= 10 &&

    Number(spec.shellThicknessMm || 10) >= 12;

  const isVeryDeepTripleMedium =

    Number(spec.depth) >= 7.5 && isTripleFlange && !isLight && !isBlackened;

  const attackDelta = axisDelta(profile, 'attack');

  const brightnessDelta = axisDelta(profile, 'brightness');

  const projectionDelta = axisDelta(profile, 'projection');

  const sustainDelta = axisDelta(profile, 'sustain');

  const warmthDelta = axisDelta(profile, 'warmth');

  const sensitivityDelta = axisDelta(profile, 'sensitivity');

  const controlDelta = axisDelta(profile, 'control');

  const strongestMovement = Math.max(

    Math.abs(attackDelta),

    Math.abs(brightnessDelta),

    Math.abs(projectionDelta),

    Math.abs(sustainDelta),

    Math.abs(warmthDelta),

    Math.abs(sensitivityDelta),

    Math.abs(controlDelta)

  );

  const parts = [];

  const shellThickness = Number(

    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm

  );

  if (Number.isFinite(shellThickness)) {

    if (shellThickness <= 6) {

      pushUnique(

        parts,

        'a very thin shell voice with more open bloom, softer control, and heightened touch response'

      );

    } else if (shellThickness <= 8) {

      pushUnique(

        parts,

        'a thinner shell voice with warmer body, longer shell movement, and a more forgiving response'

      );

    } else if (shellThickness === 9) {

      pushUnique(

        parts,

        'a slightly lighter-than-reference shell that keeps extra openness without leaving the Heritage center'

      );

    } else if (shellThickness === 10) {

      pushUnique(

        parts,

        'the 10mm Heritage reference shell keeps the build balanced between attack, body, bloom, and control'

      );

    } else if (shellThickness === 11) {

      pushUnique(

        parts,

        'a slightly firmer-than-reference shell with a touch more center and note focus'

      );

    } else if (shellThickness <= 14) {

      pushUnique(

        parts,

        'a firmer shell response with tighter note shape, clearer attack, and more controlled bloom'

      );

    } else if (shellThickness <= 18) {

      pushUnique(

        parts,

        'a focused thick-shell voice with stronger crack, forward projection, and less loose sustain'

      );

    } else {

      pushUnique(

        parts,

        'a heavy shell voice with dense focus, strong attack authority, and a more controlled projection window'

      );

    }

  }

  const lugQuantity = Number(

    spec.lugQuantity || HERITAGE_REFERENCE_SPEC.lugQuantity

  );

  if (Number.isFinite(lugQuantity)) {

    if (lugQuantity < HERITAGE_REFERENCE_SPEC.lugQuantity) {

      pushUnique(

        parts,

        'the lower lug count gives the head and shell more room to breathe, rounding the attack and opening the note bloom'

      );

    } else if (lugQuantity > HERITAGE_REFERENCE_SPEC.lugQuantity) {

      pushUnique(

        parts,

        'the higher lug count adds tension points that tighten the response, sharpen the front edge, and organize the note shape'

      );

    }

  }

  const staveCount = Number(

    spec.staveCount || HERITAGE_REFERENCE_SPEC.staveCount

  );

  if (Number.isFinite(staveCount)) {

    if (staveCount <= 10) {

      pushUnique(

        parts,

        'the lower stave count leaves the shell feeling more segmented and open, with a rounder body and slightly softer focus'

      );

    } else if (staveCount <= 12) {

      pushUnique(

        parts,

        'the slightly lower stave count keeps more shell warmth and bloom while staying close to the Heritage center'

      );

    } else if (staveCount === 16) {

      pushUnique(

        parts,

        'the 16-stave layout is the Heritage reference structure, balancing shell openness, focus, and body'

      );

    } else if (staveCount <= 20) {

      pushUnique(

        parts,

        'the higher stave count adds a little more shell continuity, tightening the note shape and improving focus'

      );

    } else {

      pushUnique(

        parts,

        'the very high stave count makes the shell feel smoother and more continuous, adding focus and a cleaner note shape'

      );

    }

  }

  if (strongestMovement < 0.1) {

    pushUnique(

      parts,

      'a balanced all-round Heritage voice with warm body, crisp attack, even projection, and usable control'

    );

  } else if (warmthDelta >= 0.28) {

    pushUnique(

      parts,

      'warmer and more body-forward than the benchmark Heritage build'

    );

  } else if (warmthDelta <= -0.28) {

    pushUnique(

      parts,

      'leaner and more controlled through the center than the benchmark Heritage build'

    );

  } else if (strongestMovement >= 0.28) {

    pushUnique(

      parts,

      'noticeably shifted away from the benchmark Heritage center'

    );

  } else {

    pushUnique(parts, 'close to the benchmark Heritage warmth posture');

  }

  if (attackDelta >= 0.28) {

    pushUnique(parts, 'a quicker, drier bite with a more defined front edge');

  } else if (attackDelta <= -0.28) {

    pushUnique(parts, 'a rounder and less immediate note start');

  }

  if (sustainDelta >= 0.28) {

    pushUnique(parts, 'a longer, broader note bloom');

  } else if (sustainDelta <= -0.28) {

    pushUnique(parts, 'a shorter, tighter note shape');

  }

  if (projectionDelta >= 0.28) {

    pushUnique(parts, 'stronger outward throw');

  } else if (projectionDelta <= -0.25) {

    pushUnique(parts, 'a more intimate room presence');

  }

  if (isLight && isDieCast) {

    pushUnique(

      parts,

      'Light Torch keeps more touch and liveliness while the die-cast hoops add rim focus'

    );

  } else if (isBlackened && isDieCast && isThickHighLugShell) {

    pushUnique(

      parts,

      'the 10-lug 12mm shell adds beef and crack while Die-Cast hoops push projection'

    );

  } else if (isBlackened) {

    if (controlDelta >= 0.22) {

      pushUnique(

        parts,

        'the Blackened finish pushes the read toward stronger control and a more disciplined shell response'

      );

    } else if (controlDelta >= 0.1 || sustainDelta <= -0.1) {

      pushUnique(

        parts,

        'the Blackened finish adds a more contained center and slightly firmer shell behavior'

      );

    }

    if (sensitivityDelta <= -0.25) {

      pushUnique(

        parts,

        'touch sensitivity is traded for a more locked-in note center'

      );

    }

  } else if (isLight) {

    if (sensitivityDelta >= 0.08 || controlDelta <= -0.1) {

      pushUnique(

        parts,

        'the lighter Torch Tune finish preserves more touch response and a freer shell reaction'

      );

    }

  } else if (strongestMovement < 0.28) {

    pushUnique(

      parts,

      'the Medium Torch benchmark keeps the line centered between openness and control'

    );

  }

  if (hasReRings && Number(spec.width) <= 12) {

    pushUnique(

      parts,

      'the deeper 12-inch re-ring shell keeps studio warmth and balance'

    );

  } else if (isLight && hasReRings && isThinShell && Number(spec.width) >= 14) {

    pushUnique(

      parts,

      'the thin re-ring shell adds darker complex overtones and longer sustain'

    );

  }

  if (isVeryDeepTripleMedium) {

    pushUnique(

      parts,

      'the deeper shell adds broader body and bloom while Triple Flange hoops preserve openness'

    );

  }

  if (isDieCast) {

    pushUnique(parts, 'Die-Cast hoops add focus and containment');

  } else {

    pushUnique(

      parts,

      'Triple Flange hoops preserve more of the line’s native openness'

    );

  }

  return joinHighlightedParts(parts);

}

function buildSourceBuildRead(spec = {}) {

  const finishLabel = spec.finish || 'Medium Torch';

  const reRingRead = spec.reRings === 'Standard' ? ' • Re-Rings' : '';

  return `${spec.width}" x ${spec.depth}" • ${spec.lugQuantity} lugs • ${spec.staveCount} staves • ${spec.shellThicknessMm}mm shell • Northern Red Oak • ${spec.hoopType} • ${spec.hardwareFinish} • ${finishLabel} • 45° inner / strong outer roundover • Standard snare bed${reRingRead}`;

}

function buildScoringBreakdown(spec = {}, profile = {}) {

  return {

    weights: HERITAGE_FACTOR_WEIGHTS,

    factorDeltas: getWeightedFactorDeltas(spec),

    axisFactorDeltas: getAxisFactorDeltas(spec),

    shellStructureFactors: getShellStructureFactors(spec),

    toneFactorsUsed: [

      'diameter',

      'depth',

      'shell thickness / lug-stave pairing',

      'scorch depth',

      'hoop type',

    ],

    ignoredForTone: ['hardware color'],

    profile,

  };

}

export function buildHeritageVoiceRead(input = {}) {

  const currentSpec = buildHeritageSpec(input);

  const parseShellThicknessMmFromInput = () => {

    const directCandidates = [

      input.shellThicknessMm,

      input.thicknessMm,

      input.shellThickness,

      input.thickness,

    ];

    for (const candidate of directCandidates) {

      const match = String(candidate ?? '').match(/(\d+(?:\.\d+)?)\s*mm?/i);

      if (match) {

        const parsed = Number(match[1]);

        if (Number.isFinite(parsed)) return parsed;

      }

      const numeric = Number(candidate);

      if (Number.isFinite(numeric) && numeric > 0) return numeric;

    }

    const staveOptionMatch = String(input.staveOption ?? '').match(

      /(\d+(?:\.\d+)?)\s*mm/i

    );

    if (staveOptionMatch) {

      const parsed = Number(staveOptionMatch[1]);

      if (Number.isFinite(parsed)) return parsed;

    }

    return null;

  };

  const parsedShellThicknessMm = parseShellThicknessMmFromInput();

  if (Number.isFinite(parsedShellThicknessMm)) {

    currentSpec.shellThicknessMm = parsedShellThicknessMm;

    currentSpec.thicknessMm = parsedShellThicknessMm;

    currentSpec.shellThickness = parsedShellThicknessMm;

    currentSpec.thickness = parsedShellThicknessMm;

    if (parsedShellThicknessMm <= 8) {

      currentSpec.shellThicknessBucket = 'thin';

    } else if (parsedShellThicknessMm >= 13) {

      currentSpec.shellThicknessBucket = 'thick';

    } else {

      currentSpec.shellThicknessBucket = 'medium';

    }

  }

  const finishVoicing = getFinishVoicingProfile(currentSpec.finish);

  const benchmarkSpec = buildNeutralBenchmarkSpecFromCatalog({

    familyId: input.benchmarkFamilyId,

    typeId: input.benchmarkTypeId,

    sizeId: input.benchmarkSizeId,

  });

  const benchmarkMeta = getSelectedBenchmarkMeta({

    benchmarkFamilyId: input.benchmarkFamilyId,

    benchmarkTypeId: input.benchmarkTypeId,

    benchmarkSizeId: input.benchmarkSizeId,

  });

  const currentWeightedProfile = buildHeritageWeightedProfile(currentSpec);

  const benchmarkResult = scoreSpiderProfile(benchmarkSpec);

  const shapedProfile = isDefaultHeritageBenchmark(input)

    ? currentWeightedProfile

    : rebaseAgainstBenchmark(

        currentWeightedProfile,

        benchmarkResult?.profile || {}

      );

  const firstListen = buildCanonicalHeritageFirstListen(

    currentSpec,

    shapedProfile

  );

  const threadAxisOrder = [

    'attack',

    'brightness',

    'projection',

    'sustain',

    'warmth',

    'sensitivity',

    'control',

  ];

  const threadAxisEntries = threadAxisOrder

    .map((axis) => {

      const value = Number(shapedProfile?.[axis]);

      const deltaFromCenter = Number.isFinite(value) ? value - 5 : 0;

      return {

        axis,

        value,

        deltaFromCenter,

        weight: Math.abs(deltaFromCenter),

      };

    })

    .filter((entry) => Number.isFinite(entry.value))

    .sort((a, b) => b.weight - a.weight);

  const buildThreadNodes = (limit = 3) =>

    threadAxisEntries.slice(0, limit).map((entry) => entry.axis);

  const buildThreadScore = (limit = 3) => {

    const selected = threadAxisEntries.slice(0, limit);

    const rawScore = selected.reduce((sum, entry) => sum + entry.weight, 0);

    return Number(Math.min(10, Math.max(1, rawScore * 1.65)).toFixed(2));

  };

  const sourceBuildRead = buildSourceBuildRead(currentSpec);

  const sourceBuildThreadNodes = firstListen.nodes;

  const sourceBuildThreadScore = buildThreadScore(3);

  const firstTellTitle = firstListen.title || buildFirstTellTitle(currentSpec, shapedProfile);

  const playerReadTitle = buildPlayerReadTitle(currentSpec, shapedProfile);

  const identityShapeTitle = buildIdentityShapeTitle(

    currentSpec,

    shapedProfile

  );

  const shapedThreadNodes = buildThreadNodes(3);

  const shapedThreadScore = buildThreadScore(3);

  const complexThreadNodes = buildThreadNodes(4);

  const complexThreadScore = buildThreadScore(4);

  const identityShapeRead = buildHeritageIdentityShapeRead({

    baseTitle: identityShapeTitle,

    canonicalNodes: complexThreadNodes,

    hardwareColor: currentSpec.hardwareFinish,

    scorchDepth: currentSpec.finish,

    hoopType: currentSpec.hoopType,

    size: currentSpec.width,

    depth: currentSpec.depth,

    lugs: currentSpec.lugQuantity,

    staveOption: input.staveOption,

    spec: currentSpec,

    profile: shapedProfile,

  });

  return {

    lineId: HERITAGE_REFERENCE_PROFILE.lineId,

    lineLabel: HERITAGE_REFERENCE_PROFILE.lineLabel,

    benchmark: {

      ...HERITAGE_REFERENCE_PROFILE.benchmarkMeaning,

      familyId: benchmarkMeta.family?.familyId || null,

      familyLabel: benchmarkMeta.family?.familyLabel || null,

      typeId: benchmarkMeta.type?.typeId || null,

      typeLabel: benchmarkMeta.type?.typeLabel || null,

      sizeId: benchmarkMeta.sizeId || null,

      sizeLabel:

        benchmarkMeta.sizeOption?.label || benchmarkMeta.sizeId || null,

      referenceSpec: benchmarkSpec,

      referenceRawProfile: isDefaultHeritageBenchmark(input)

        ? buildHeritageWeightedProfile(HERITAGE_REFERENCE_SPEC)

        : benchmarkResult?.profile || null,

    },

    currentSpec,

    profile: shapedProfile,

    firstListen,

    highlightedCharacteristics: buildHighlightedCharacteristics(

      currentSpec,

      shapedProfile

    ),

    primaryGenre: pickPrimaryGenre(currentSpec, shapedProfile),

    secondaryGenres: pickSecondaryGenres(currentSpec, shapedProfile),

    recordingMic: pickRecordingMic(currentSpec, shapedProfile),

    playingSituation: buildPlayingSituation(currentSpec, shapedProfile),

    feelRead: buildFeelRead(currentSpec, shapedProfile),

    sourceBuildRead,

    sourceBuildTitle: firstTellTitle,

    sourceBuildNodes: sourceBuildThreadNodes,

    sourceBuildScore: sourceBuildThreadScore,

    simpleThreadTitle: firstTellTitle,

    simpleThreadNodes: sourceBuildThreadNodes,

    simpleThreadScore: sourceBuildThreadScore,

    shapedThreadTitle: playerReadTitle,

    shapedThreadNodes,

    shapedThreadScore,

    complexThreadTitle: identityShapeRead.title,

    complexThreadNodes,

    complexThreadScore,

    complexThreadSummary: identityShapeRead.summary,

    meta: {

      engineVersion: 'heritage-v2.2-first-listen-copy-model',

      scoringMode: isDefaultHeritageBenchmark(input)

        ? 'heritage_weighted_reference_relative'

        : 'heritage_weighted_selected_benchmark_relative',

      benchmarkCenter: 5,

      selectedBenchmarkType: benchmarkMeta.type?.typeId || null,

      finishVoicing,

      scoringBreakdown: buildScoringBreakdown(currentSpec, shapedProfile),

note: 'Heritage LegacyPrint scoring uses the locked weighted tone-factor model. Diameter and depth establish the main shell behavior, while this update adds a First Listen readout object for title, node order, and node-specific copy without changing the underlying tone scoring. Hoop type and scorch depth remain active tone factors. Hardware color is retained for visual/spec display but ignored for tone scoring.',
    },

  };

}

export default buildHeritageVoiceRead;