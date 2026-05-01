// src/utils/legacyPrint/buildHeritageVoiceRead.js

import { scoreSpiderProfile } from '../spider/scoreSpiderProfile.js';

import HERITAGE_REFERENCE_PROFILE from './heritageReferenceProfile.js';

import LEGACYPRINT_BENCHMARK_CATALOG from '../../data/legacyPrint/benchmarkCatalog.js';

import { BENCHMARK_DEFINITIONS } from '../../data/legacyPrint/benchmarkDefinitions.js';

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
    diameter: 0.18,
    depth: 0.14,
    shell: 0.34,
    scorch: 0.08,
    hoop: 0.26,
  },
  brightness: {
    diameter: 0.28,
    depth: 0.16,
    shell: 0.24,
    scorch: 0.14,
    hoop: 0.18,
  },
  projection: {
    diameter: 0.2,
    depth: 0.34,
    shell: 0.22,
    scorch: 0.06,
    hoop: 0.18,
  },
  sustain: {
    diameter: 0.14,
    depth: 0.38,
    shell: 0.2,
    scorch: 0.08,
    hoop: 0.2,
  },
  warmth: {
    diameter: 0.24,
    depth: 0.4,
    shell: 0.18,
    scorch: 0.12,
    hoop: 0.06,
  },
  sensitivity: {
    diameter: 0.12,
    depth: 0.18,
    shell: 0.24,
    scorch: 0.16,
    hoop: 0.3,
  },
  control: {
    diameter: 0.1,
    depth: 0.12,
    shell: 0.28,
    scorch: 0.18,
    hoop: 0.32,
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
    resolvedSpec.width ?? sizeDefinition?.spec?.width ?? parsedFallbackSize.width
  );

  const depth = Number(
    resolvedSpec.depth ?? sizeDefinition?.spec?.depth ?? parsedFallbackSize.depth
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
    shellThicknessBucket: getShellThicknessBucket(parsed.shellThicknessMm ?? 10),
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

  /**

   * Locked update:

   * Depth was too conservative at /2.5, causing 6.0 / 6.5 / 7.0

   * to cluster around nearly the same read. /2.0 gives half-inch

   * depth changes more visible movement without turning 8.0 into a cartoon.

   */

  return clampUnit((depth - HERITAGE_REFERENCE_SPEC.depth) / 2);
}

function getShellFactor(spec = {}) {
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

  let factor = 0;

  factor += (thickness - HERITAGE_REFERENCE_SPEC.shellThicknessMm) / 4;

  factor += (staveCount - HERITAGE_REFERENCE_SPEC.staveCount) / 20;

  factor += (lugQuantity - HERITAGE_REFERENCE_SPEC.lugQuantity) / 28;

  if (hasReRings) {
    factor += 0.22;
  }

  return clampUnit(factor);
}

function getShellWarmthModifier(spec = {}) {
  const thickness = Number(
    spec.shellThicknessMm || HERITAGE_REFERENCE_SPEC.shellThicknessMm
  );

  const hasReRings = hasStandardReRings(spec.reRings);

  let modifier = 0;

  if (thickness <= 8) {
    modifier += 0.24;
  }

  if (thickness >= 12) {
    modifier -= 0.2;
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

    if (axis === 'warmth') {
      correctedMovement += shellWarmthModifier * (weights.shell || 0) * 0.55;
    }

    if (axis === 'sustain') {
      correctedMovement += shellSustainModifier * (weights.shell || 0) * 0.5;
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
    /**

     * Locked update:

     * 1.55 was too subtle after we made the relationship system more visual.

     * 1.78 gives the voice map enough separation between depths.

     */

    acc[axis] = 5 + axisFactorDeltas[axis] * 1.78;

    return acc;
  }, {});

  /**

   * Depth guardrails:

   * These make deeper shells read more like deeper drums in plain drummer terms:

   * more body, more bloom, more room presence, slightly less top-edge brightness.

   */

  if (depth >= 6.5 && !isBlackened) {
    const deepAmount = clamp((depth - 6.5) / 1.5, 0, 1);

    rawProfile.warmth += 0.08 + deepAmount * 0.18;

    rawProfile.sustain += 0.07 + deepAmount * 0.16;

    rawProfile.projection += 0.04 + deepAmount * 0.1;

    rawProfile.brightness -= 0.04 + deepAmount * 0.1;
  }

  if (depth >= 7.5 && !isBlackened) {
    rawProfile.warmth += 0.12;

    rawProfile.sustain += 0.1;

    rawProfile.projection += 0.06;

    rawProfile.brightness -= 0.07;

    rawProfile.attack -= 0.04;
  }

  if (depth >= 7.5 && width === 13 && isTripleFlange && !isBlackened) {

    /**

     * 13-inch deep Heritage family:

     * 7.5 already reads as deep and blooming.

     * 8.0 needs a small additional step so it does not collapse into the same read.

     */

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

  if (hasReRings) {
    rawProfile.control += 0.16;

    rawProfile.sensitivity -= 0.08;
  }

  if (hasReRings && width <= 12) {
    rawProfile.projection += 0.06;

    rawProfile.warmth += 0.05;
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

  if (isLight && isDieCast) {
    return 'A focused-but-open Heritage read: the die-cast hoops tighten the rim response, while the lighter Torch Tune finish keeps more touch, air, and upper-shell liveliness in the voice.';
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
    pushUnique(parts, 'noticeably shifted away from the benchmark Heritage center');
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
      pushUnique(parts, 'touch sensitivity is traded for a more locked-in note center');
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
    pushUnique(parts, 'the deeper 12-inch re-ring shell keeps studio warmth and balance');
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
    pushUnique(parts, 'Triple Flange hoops preserve more of the line’s native openness');
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

    : rebaseAgainstBenchmark(currentWeightedProfile, benchmarkResult?.profile || {});

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

  const sourceBuildThreadNodes = buildThreadNodes(3);

  const sourceBuildThreadScore = buildThreadScore(3);

  const shapedThreadTitle = buildFeelRead(currentSpec, shapedProfile);

  const shapedThreadNodes = buildThreadNodes(3);

  const shapedThreadScore = buildThreadScore(3);

  const complexThreadTitle = buildPlayingSituation(currentSpec, shapedProfile);

  const complexThreadNodes = buildThreadNodes(4);

  const complexThreadScore = buildThreadScore(4);

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
    sourceBuildTitle: sourceBuildRead,
    sourceBuildNodes: sourceBuildThreadNodes,
    sourceBuildScore: sourceBuildThreadScore,
    simpleThreadTitle: sourceBuildRead,
    simpleThreadNodes: sourceBuildThreadNodes,
    simpleThreadScore: sourceBuildThreadScore,
    shapedThreadTitle,
    shapedThreadNodes,
    shapedThreadScore,
    complexThreadTitle,
    complexThreadNodes,
    complexThreadScore,
    meta: {
      engineVersion: 'heritage-v2.1-depth-separated-weighted-factor-model',
      scoringMode: isDefaultHeritageBenchmark(input)

        ? 'heritage_weighted_reference_relative'

        : 'heritage_weighted_selected_benchmark_relative',
      benchmarkCenter: 5,
      selectedBenchmarkType: benchmarkMeta.type?.typeId || null,
      finishVoicing,
      scoringBreakdown: buildScoringBreakdown(currentSpec, shapedProfile),
      note: 'Heritage LegacyPrint scoring uses the locked weighted tone-factor model. Diameter, depth, shell thickness/lug-stave pairing, scorch depth, and hoop type shape the seven Voice Nodes. Hardware color is retained for visual/spec display but ignored for tone scoring. v2.1 increases depth separation so deeper shells produce clearer warmth, sustain, and bloom movement.',
    },
  };
}

export default buildHeritageVoiceRead;