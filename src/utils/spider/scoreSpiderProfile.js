// src/utils/spider/scoreSpiderProfile.js

import {

  DEFAULT_SPIDER_PROFILE,

  INTERNAL_SPIDER_AXES,

  normalizeSpiderProfile,

} from './axes.js';

import SPIDER_CONTRIBUTOR_WEIGHTS, {

  getWeightsForAxis,

} from './contributorWeights.js';

import buildSpecContributors from '../aiToneEngine/buildSpecContributors.js';

/**

 * Purpose:

 * Turn selected drum specs into an Ober tonal character estimate.

 *

 * This is:

 * - explainable

 * - weighted

 * - confidence-aware

 *

 * It is NOT:

 * - an objective measured acoustic prediction

 */

const clamp = (value, min = 1, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round2 = (n) => Math.round(n * 100) / 100;

function average(values = [], fallback = 5) {

  const nums = values.filter((v) => Number.isFinite(Number(v))).map(Number);

  if (!nums.length) return fallback;

  return nums.reduce((sum, v) => sum + v, 0) / nums.length;

}

function averageConfidence(entries = []) {

  const nums = entries

    .map((entry) => Number(entry?.confidence))

    .filter((n) => Number.isFinite(n));

  return nums.length ? round2(average(nums, 0.6)) : 0.6;

}

const SHELL_FIRST_REDUCED_KEYS = new Set([

  'headTension',

  'headType',

  'snareResponse',

  'snareWireStyle',

  'snareSideHead',

  'snareWireCount',

  'snareWireMaterial',

  'snareBedDepth',

]);

const SHELL_FIRST_BOOSTED_KEYS = new Set([

  'shellConstruction',

  'shellMaterial',

  'woodSpecies',

  'depth',

  'diameter',

  'shellThickness',

  'hoopType',

  'hardwareType',

  'reRings',

  'bearingEdge',

  'lugQuantity',

  'staveCount',

]);

const DYNAMIC_AXIS_WEIGHTS = Object.freeze({

  attack: {

    lugQuantity: 0.08,

    staveCount: 0.08,

  },

  sustain: {

    lugQuantity: 0.07,

    staveCount: 0.08,

  },

  warmth: {

    lugQuantity: 0.05,

    staveCount: 0.08,

  },

  projection: {

    lugQuantity: 0.08,

    staveCount: 0.08,

  },

  brightness: {

    lugQuantity: 0.04,

    staveCount: 0.05,

  },

  sensitivity: {

    lugQuantity: 0.08,

    staveCount: 0.08,

  },

  control: {

    lugQuantity: 0.08,

    staveCount: 0.08,

  },

});

function isShellFirstBenchmarkMode(specs = {}) {

  return (

    specs?.scoringIntent === 'shell_first' ||

    specs?.legacyPrintMode === 'shell_first' ||

    specs?.benchmarkMode === 'heritage_shell_first'

  );

}

function getWeightMultiplier({

  contributorKey,

  sourceValue,

  specs = {},

}) {

  let multiplier = 1;

  const shellFirst = isShellFirstBenchmarkMode(specs);

  if (shellFirst) {

    if (SHELL_FIRST_REDUCED_KEYS.has(contributorKey)) {

      multiplier *= 0.08;

    }

    if (contributorKey === 'finishType') {

      multiplier *= 0.2;

    }

    if (SHELL_FIRST_BOOSTED_KEYS.has(contributorKey)) {

      multiplier *= 1.05;

    }

  }

  const neutralDistance = Math.abs(Number(sourceValue || 5) - 5);

  if (neutralDistance <= 0.12) {

    multiplier *= 0.92;

  } else if (neutralDistance >= 1.25) {

    multiplier *= shellFirst ? 1.01 : 1.05;

  }

  return multiplier;

}

function buildDynamicContributions(axis, contributorProfiles = {}, specs = {}) {

  // These are already represented in the weighted contributor model.

  // Adding them again here causes Heritage benchmark mode to overreact,

  // especially on lug-count and stave-count changes.

  return [];

}

function applyContrastExpansion(rawScore, contributions = [], specs = {}) {

  const shellFirst = isShellFirstBenchmarkMode(specs);

  const totalWeight =

    contributions.reduce((sum, item) => sum + Number(item.effectiveWeight || 0), 0) ||

    1;

  const weightedNeutralDistance =

    contributions.reduce((sum, item) => {

      const distance = Math.abs(Number(item.sourceValue || 5) - 5);

      return sum + distance * Number(item.effectiveWeight || 0);

    }, 0) / totalWeight;

  const weightedSpread =

    contributions.reduce((sum, item) => {

      const diff = Number(item.sourceValue || 5) - Number(rawScore || 5);

      return sum + diff * diff * Number(item.effectiveWeight || 0);

    }, 0) / totalWeight;

  const spread = Math.sqrt(weightedSpread);

  let multiplier;

  if (shellFirst) {

    // Heritage benchmark mode should stay calm and centered.

    multiplier = 1 + weightedNeutralDistance * 0.08 + spread * 0.04;

    multiplier = clamp(multiplier, 1, 1.16);

  } else {

    multiplier = 1 + weightedNeutralDistance * 0.18 + spread * 0.08;

    multiplier = clamp(multiplier, 1, 1.45);

  }

  return round2(clamp(5 + (rawScore - 5) * multiplier));

}

export function scoreSpiderProfile(specs = {}) {

  const contributorProfiles = buildSpecContributors(specs);

  const axisBreakdown = INTERNAL_SPIDER_AXES.reduce((acc, axis) => {

    const weights = getWeightsForAxis(axis);

    const staticContributions = weights.map((item) => {

      const sourceProfile =

        contributorProfiles[item.contributorKey] || DEFAULT_SPIDER_PROFILE;

      const sourceValue = Number(sourceProfile?.[axis] ?? 5);

      const multiplier = getWeightMultiplier({

        contributorKey: item.contributorKey,

        sourceValue,

        specs,

      });

      const effectiveWeight = item.weight * multiplier;

      const weightedValue = sourceValue * effectiveWeight;

      return {

        contributorKey: item.contributorKey,

        sourceValue: round2(sourceValue),

        weight: item.weight,

        effectiveWeight: round2(effectiveWeight),

        weightedValue: round2(weightedValue),

        confidence: item.confidence,

        rationale: item.rationale,

        sourceType: item.sourceType,

      };

    });

    const dynamicContributions = buildDynamicContributions(

      axis,

      contributorProfiles,

      specs

    ).map((item) => {

      const multiplier = getWeightMultiplier({

        contributorKey: item.contributorKey,

        sourceValue: item.sourceValue,

        specs,

      });

      const effectiveWeight = item.weight * multiplier;

      const weightedValue = Number(item.sourceValue) * effectiveWeight;

      return {

        ...item,

        effectiveWeight: round2(effectiveWeight),

        weightedValue: round2(weightedValue),

      };

    });

    const contributions = [...staticContributions, ...dynamicContributions];

    const totalWeight =

      contributions.reduce(

        (sum, item) => sum + Number(item.effectiveWeight || 0),

        0

      ) || 1;

    const baseRawScore =

      contributions.reduce(

        (sum, item) => sum + Number(item.weightedValue || 0),

        0

      ) / totalWeight;

    const expandedScore = applyContrastExpansion(

      baseRawScore,

      contributions,

      specs

    );

    acc[axis] = {

      score: round2(clamp(expandedScore)),

      rawScore: round2(clamp(baseRawScore)),

      confidence01: averageConfidence(contributions),

      contributors: contributions.sort(

        (a, b) => (b.effectiveWeight || 0) - (a.effectiveWeight || 0)

      ),

    };

    return acc;

  }, {});

  const profile = INTERNAL_SPIDER_AXES.reduce((acc, axis) => {

    acc[axis] = axisBreakdown[axis].score;

    return acc;

  }, {});

  const normalizedProfile = normalizeSpiderProfile(profile);

  const overallConfidence01 = average(

    INTERNAL_SPIDER_AXES.map((axis) => axisBreakdown[axis]?.confidence01 ?? 0.6),

    0.6

  );

  return {

    profile: normalizedProfile,

    confidence01: round2(overallConfidence01),

    confidencePercent: Math.round(overallConfidence01 * 100),

    axisBreakdown,

    meta: {

      contributorCount: SPIDER_CONTRIBUTOR_WEIGHTS.length,

      engineVersion: '1.2.0',

      note: 'Ober tonal character estimate — heuristic, not lab-measured acoustic output.',

    },

  };

}

export function explainSpiderAxis(result, axis) {

  const entry = result?.axisBreakdown?.[axis];

  if (!entry) return null;

  const topContributors = entry.contributors.slice(0, 3);

  return {

    axis,

    score: entry.score,

    rawScore: entry.rawScore,

    confidence01: entry.confidence01,

    confidencePercent: Math.round(entry.confidence01 * 100),

    summary: `Top influences for ${axis} are ${topContributors

      .map((item) => item.contributorKey)

      .join(', ')}.`,

    topContributors,

  };

}

export function explainSpiderProfile(result) {

  if (!result?.axisBreakdown) return [];

  return INTERNAL_SPIDER_AXES.map((axis) => explainSpiderAxis(result, axis));

}

export default scoreSpiderProfile;