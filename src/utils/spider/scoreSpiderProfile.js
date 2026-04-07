// src/utils/spider/scoreSpiderProfile.js

import {
  DEFAULT_SPIDER_PROFILE,
  INTERNAL_SPIDER_AXES,
  normalizeSpiderProfile,
} from './axes';
import SPIDER_CONTRIBUTOR_WEIGHTS, {
  getWeightsForAxis,
} from './contributorWeights';
import buildSpecContributors from '../aiToneEngine/buildSpecContributors';

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

export function scoreSpiderProfile(specs = {}) {
  const contributorProfiles = buildSpecContributors(specs);

  const axisBreakdown = INTERNAL_SPIDER_AXES.reduce((acc, axis) => {
    const weights = getWeightsForAxis(axis);

    const contributions = weights.map((item) => {
      const sourceProfile =
        contributorProfiles[item.contributorKey] || DEFAULT_SPIDER_PROFILE;

      const sourceValue = Number(sourceProfile?.[axis] ?? 5);
      const weightedValue = sourceValue * item.weight;

      return {
        contributorKey: item.contributorKey,
        sourceValue: round2(sourceValue),
        weight: item.weight,
        weightedValue: round2(weightedValue),
        confidence: item.confidence,
        rationale: item.rationale,
        sourceType: item.sourceType,
      };
    });

    const totalWeight =
      contributions.reduce((sum, item) => sum + item.weight, 0) || 1;

    const rawScore =
      contributions.reduce((sum, item) => sum + item.weightedValue, 0) /
      totalWeight;

    acc[axis] = {
      score: round2(clamp(rawScore)),
      confidence01: averageConfidence(contributions),
      contributors: contributions.sort((a, b) => b.weight - a.weight),
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
      engineVersion: '1.1.0',
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