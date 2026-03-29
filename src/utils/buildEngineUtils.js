import {
  TARGET_AXES,
  ARTISAN_DEFAULTS,
  OPTION_LIBRARY,
  WOOD_LIBRARY,
  INPUT_TO_TARGET_MAP,
  BUILD_RULES,
  emptyTargetProfile,
  cloneTargetProfile,
  getConstructionById,
  getDiameterById,
  getDepthById,
  getThicknessZoneById,
  getHoopTypeById,
  getLugConfigById,
  getBearingEdgeById,
  getSnareBedById,
  getHeadFamilyById,
  getWoodById,
} from '../data/buildEngineData';

// ============================================================
// Small numeric helpers
// ============================================================

function clamp(value, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ============================================================
// Profile math helpers
// ============================================================

export function makeEmptyAxisProfile() {
  return emptyTargetProfile();
}

export function addAxisProfiles(...profiles) {
  const result = emptyTargetProfile();

  profiles.forEach((profile) => {
    TARGET_AXES.forEach((axis) => {
      result[axis] += safeNumber(profile?.[axis], 0);
    });
  });

  return result;
}

export function scaleAxisProfile(profile = {}, scalar = 1) {
  const result = emptyTargetProfile();

  TARGET_AXES.forEach((axis) => {
    result[axis] = safeNumber(profile?.[axis], 0) * scalar;
  });

  return result;
}

export function averageAxisProfiles(profiles = []) {
  if (!profiles.length) return emptyTargetProfile();

  const summed = addAxisProfiles(...profiles);
  const result = emptyTargetProfile();

  TARGET_AXES.forEach((axis) => {
    result[axis] = summed[axis] / profiles.length;
  });

  return result;
}

export function normalizeAxisProfile(profile = {}) {
  const result = emptyTargetProfile();

  TARGET_AXES.forEach((axis) => {
    result[axis] = clamp(roundTo(safeNumber(profile?.[axis], 0), 2), 0, 10);
  });

  return result;
}

export function profileDelta(target = {}, predicted = {}) {
  const result = emptyTargetProfile();

  TARGET_AXES.forEach((axis) => {
    result[axis] = roundTo(
      safeNumber(predicted?.[axis], 0) - safeNumber(target?.[axis], 0),
      2
    );
  });

  return result;
}

export function profileDistance(target = {}, predicted = {}) {
  let total = 0;

  TARGET_AXES.forEach((axis) => {
    const diff =
      safeNumber(target?.[axis], 0) - safeNumber(predicted?.[axis], 0);
    total += diff * diff;
  });

  return Math.sqrt(total);
}

// ============================================================
// Intake -> target profile shaping
// ============================================================

export function buildDesiredTargetProfile(intake = {}) {
  const result = emptyTargetProfile();

  const desiredTuningRange = intake?.tonalGoals?.desiredTuningRange || 'notSure';
  const tuningMap = INPUT_TO_TARGET_MAP?.desiredTuningRange?.[desiredTuningRange];

  if (tuningMap) {
    TARGET_AXES.forEach((axis) => {
      result[axis] += safeNumber(tuningMap[axis], 0) * 10;
    });
  }

  return normalizeAxisProfile(result);
}

// ============================================================
// Candidate profile generation
// ============================================================

export function buildShellRecipeProfile(shellRecipe = []) {
  if (!Array.isArray(shellRecipe) || !shellRecipe.length) {
    return emptyTargetProfile();
  }

  const weighted = emptyTargetProfile();
  let totalWeight = 0;

  shellRecipe.forEach((part) => {
    const wood = getWoodById(part?.woodId);
    const weight = safeNumber(part?.percentage, 0);

    if (!wood?.profile || weight <= 0) return;

    TARGET_AXES.forEach((axis) => {
      weighted[axis] += safeNumber(wood.profile?.[axis], 0) * weight;
    });

    totalWeight += weight;
  });

  if (totalWeight <= 0) return emptyTargetProfile();

  const normalized = emptyTargetProfile();

  TARGET_AXES.forEach((axis) => {
    normalized[axis] = weighted[axis] / totalWeight;
  });

  return normalizeAxisProfile(normalized);
}

export function buildCandidateProfile(candidate = {}) {
  const parts = [];

  const construction = getConstructionById(candidate?.constructionType);
  if (construction?.profile) parts.push(construction.profile);

  const diameter = getDiameterById(candidate?.diameter);
  if (diameter?.profile) parts.push(diameter.profile);

  const depth = getDepthById(candidate?.depth);
  if (depth?.profile) parts.push(depth.profile);

  const thickness = getThicknessZoneById(candidate?.shellThicknessZone);
  if (thickness?.profile) parts.push(thickness.profile);

  const hoopType = getHoopTypeById(candidate?.hoopType);
  if (hoopType?.profile) parts.push(hoopType.profile);

  const lugConfig = getLugConfigById(candidate?.lugConfig);
  if (lugConfig?.profile) parts.push(lugConfig.profile);

  const topEdge = getBearingEdgeById(candidate?.bearingEdges?.top);
  if (topEdge?.profile) parts.push(topEdge.profile);

  const bottomEdge = getBearingEdgeById(candidate?.bearingEdges?.bottom);
  if (bottomEdge?.profile) parts.push(bottomEdge.profile);

  const snareBed = getSnareBedById(candidate?.snareBedDepth);
  if (snareBed?.profile) parts.push(snareBed.profile);

  const batterHead = getHeadFamilyById(candidate?.heads?.batter);
  if (batterHead?.profile) parts.push(batterHead.profile);

  const snareSide = getHeadFamilyById(candidate?.heads?.snareSide);
  if (snareSide?.profile) parts.push(snareSide.profile);

  const shellRecipeProfile = buildShellRecipeProfile(candidate?.shellRecipe);
  parts.push(shellRecipeProfile);

  return normalizeAxisProfile(averageAxisProfiles(parts));
}

// ============================================================
// Basic default candidate
// ============================================================

export function makeDefaultCandidate() {
  return {
    constructionType: ARTISAN_DEFAULTS.primaryConstruction,
    shellRecipe: [
      {
        woodId: 'maple',
        role: 'primary',
        percentage: 100,
      },
    ],
    diameter: ARTISAN_DEFAULTS.defaultDiameter,
    depth: ARTISAN_DEFAULTS.defaultDepth,
    shellThicknessZone: ARTISAN_DEFAULTS.defaultThicknessZone,
    reinforcementRings: false,
    lugConfig: ARTISAN_DEFAULTS.defaultLugConfig,
    lugStyle: 'vintageTubeLugs',
    hoopType: ARTISAN_DEFAULTS.defaultHoopType,
    hardwareFinish: ARTISAN_DEFAULTS.defaultHardwareFinish,
    finishSystem: {
      exteriorStyle: 'naturalWoodForward',
      sheen: ARTISAN_DEFAULTS.defaultFinishSheen,
      veneerFigurePreference: 'straightGrain',
      accentColorDirection: null,
      accentStyle: 'none',
    },
    bearingEdges: {
      top: ARTISAN_DEFAULTS.defaultTopBearingEdge,
      bottom: ARTISAN_DEFAULTS.defaultBottomBearingEdge,
    },
    snareBedDepth: ARTISAN_DEFAULTS.defaultSnareBedDepth,
    heads: {
      batter: ARTISAN_DEFAULTS.defaultBatterHeadFamily,
      snareSide: ARTISAN_DEFAULTS.defaultSnareSideHeadFamily,
    },
    tuningIntent: 'versatile',
  };
}

// ============================================================
// Rule evaluation
// ============================================================

export function evaluateBuildRules(intake = {}) {
  const outputs = {
    preferredConstruction: null,
    preferredDiameter: null,
    boostDiameters: [],
    boostDepths: [],
    avoidByDefault: [],
  };

  (BUILD_RULES?.recommendationRules || []).forEach((rule) => {
    try {
      const passes = rule.when?.(intake);

      if (!passes) return;

      const result = rule.result || {};

      if (result.preferredConstruction) {
        outputs.preferredConstruction = result.preferredConstruction;
      }

      if (result.preferredDiameter) {
        outputs.preferredDiameter = result.preferredDiameter;
      }

      if (Array.isArray(result.boostDiameters)) {
        outputs.boostDiameters.push(...result.boostDiameters);
      }

      if (Array.isArray(result.boostDepths)) {
        outputs.boostDepths.push(...result.boostDepths);
      }

      if (Array.isArray(result.avoidByDefault)) {
        outputs.avoidByDefault.push(...result.avoidByDefault);
      }
    } catch (error) {
      console.error(`Rule evaluation failed for ${rule.id}:`, error);
    }
  });

  outputs.boostDiameters = [...new Set(outputs.boostDiameters)];
  outputs.boostDepths = [...new Set(outputs.boostDepths)];
  outputs.avoidByDefault = [...new Set(outputs.avoidByDefault)];

  return outputs;
}

// ============================================================
// Very first recommendation pass
// ============================================================

export function buildRecommendedCandidate(intake = {}) {
  const candidate = makeDefaultCandidate();
  const rules = evaluateBuildRules(intake);

  if (rules.preferredConstruction) {
    candidate.constructionType = rules.preferredConstruction;
  }

  if (rules.preferredDiameter) {
    candidate.diameter = rules.preferredDiameter;
  }

  if (rules.boostDiameters.includes('13')) {
    candidate.diameter = '13';
  }

  if (rules.boostDiameters.includes('12')) {
    candidate.diameter = '12';
  }

  if (rules.boostDepths.includes('6.5')) {
    candidate.depth = '6.5';
  }

  if (rules.boostDepths.includes('7.0')) {
    candidate.depth = '7.0';
  }

  return candidate;
}

export function buildEngineRecommendation(intake = {}) {
  const desired = buildDesiredTargetProfile(intake);
  const candidate = buildRecommendedCandidate(intake);
  const predicted = buildCandidateProfile(candidate);
  const delta = profileDelta(desired, predicted);
  const distance = profileDistance(desired, predicted);

  const confidence = clamp(roundTo(100 - distance * 8, 0), 0, 100);

  return {
    buildSummary: {
      recommendedBuildName: 'Ober Artisan Suggested Build',
      confidence,
      buildIntent:
        'A first-pass recommendation shaped by intake priorities and Ober Artisan defaults.',
      whyThisBuild: [
        'Starts from the Ober Artisan house baseline.',
        'Applies simple rules based on tuning range and response priorities.',
        'Builds a predicted sonic profile for visual comparison.',
      ],
      cautionFlags: [],
      hardConstraintNotes: [],
    },

    recommendedSpecs: candidate,

    targetProfile: {
      desired,
      predicted,
      delta,
    },

    intakeInterpretation: {
      artistNeedSummary: '',
      whatTheyAreReallyAskingFor: [],
      likelyTradeoffsToAccept: [],
      likelyTradeoffsToAvoid: [],
      builderInterpretation: '',
    },

    storySignals: {
      identityLine: '',
      emotionalTarget: [],
      sonicTargetLine: '',
      visualTargetLine: '',
      feelTargetLine: '',
    },
  };
}