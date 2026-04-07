// src/utils/recommendation/confidenceMath.js

function clamp(value, min = 0, max = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Converts 0..1 to integer 0..100
 */
export function toPercent(confidence01) {
  return Math.round(clamp(confidence01) * 100);
}

/**
 * Weighted average for signals shaped like:
 * [{ score: 0.8, weight: 2 }, ...]
 */
export function weightedAverage(signals = []) {
  if (!Array.isArray(signals) || signals.length === 0) return 0;

  let totalWeight = 0;
  let totalScore = 0;

  signals.forEach((signal) => {
    const score = clamp(signal?.score ?? 0);
    const weight = Math.max(0, Number(signal?.weight ?? 0));

    totalScore += score * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;
  return totalScore / totalWeight;
}

/**
 * Completeness reflects how much key information we actually know.
 *
 * knownCount / totalCount => 0..1
 */
export function completenessScore({
  knownCount = 0,
  totalCount = 0,
} = {}) {
  const known = Math.max(0, Number(knownCount));
  const total = Math.max(0, Number(totalCount));

  if (total === 0) return 0;
  return clamp(known / total);
}

/**
 * Penalize unresolved unknowns that materially affect the output.
 *
 * blockingUnknowns: number of important unanswered questions
 * soft cap: after a few blockers, confidence drops fast
 */
export function blockingPenalty(blockingUnknowns = 0) {
  const count = Math.max(0, Number(blockingUnknowns));
  const penalty = Math.min(0.45, count * 0.08);
  return penalty;
}

/**
 * Penalize disagreement across evidence sources.
 *
 * disagreementScore:
 * 0 = all aligned
 * 1 = strong conflict
 */
export function disagreementPenalty(disagreementScore = 0) {
  return clamp(disagreementScore) * 0.25;
}

/**
 * Reward stronger evidence provenance.
 *
 * Example inputs:
 * {
 *   manufacturer: 3,
 *   material_database: 2,
 *   ober_internal: 4,
 *   user_confirmed: 5
 * }
 */
export function sourceStrengthBonus(sourceCounts = {}) {
  const manufacturer = Math.max(0, Number(sourceCounts.manufacturer ?? 0));
  const materialDatabase = Math.max(0, Number(sourceCounts.material_database ?? 0));
  const userConfirmed = Math.max(0, Number(sourceCounts.user_confirmed ?? 0));
  const oberInternal = Math.max(0, Number(sourceCounts.ober_internal ?? 0));

  const raw =
    manufacturer * 0.035 +
    materialDatabase * 0.03 +
    userConfirmed * 0.04 +
    oberInternal * 0.02;

  return Math.min(0.18, raw);
}

/**
 * Main confidence model.
 *
 * Inputs:
 * - evidenceScore: how strong the supporting evidence is
 * - completeness: how complete the known inputs are
 * - sourceBonus: bonus from provenance
 * - blockingUnknowns: important unanswered questions
 * - disagreement: conflicting evidence
 */
export function computeConfidence01({
  evidenceScore = 0,
  completeness = 0,
  sourceBonus = 0,
  blockingUnknowns = 0,
  disagreement = 0,
} = {}) {
  const evidence = clamp(evidenceScore);
  const complete = clamp(completeness);
  const bonus = clamp(sourceBonus, 0, 0.25);

  const base = evidence * 0.55 + complete * 0.45;
  const penalties =
    blockingPenalty(blockingUnknowns) +
    disagreementPenalty(disagreement);

  return clamp(base + bonus - penalties);
}

/**
 * Convenience function for recommendation outputs.
 */
export function computeConfidence({
  signals = [],
  knownCount = 0,
  totalCount = 0,
  blockingUnknowns = 0,
  disagreement = 0,
  sourceCounts = {},
} = {}) {
  const evidenceScore = weightedAverage(signals);
  const completeness = completenessScore({ knownCount, totalCount });
  const sourceBonus = sourceStrengthBonus(sourceCounts);

  const confidence01 = computeConfidence01({
    evidenceScore,
    completeness,
    sourceBonus,
    blockingUnknowns,
    disagreement,
  });

  return {
    confidence01,
    confidencePercent: toPercent(confidence01),
    evidenceScore,
    completeness,
    sourceBonus,
    penalties: {
      blocking: blockingPenalty(blockingUnknowns),
      disagreement: disagreementPenalty(disagreement),
    },
  };
}

export function confidenceLabel(confidencePercent = 0) {
  const pct = Math.max(0, Math.min(100, Number(confidencePercent) || 0));

  if (pct >= 85) return 'Very High';
  if (pct >= 70) return 'High';
  if (pct >= 55) return 'Moderate';
  if (pct >= 35) return 'Low';
  return 'Very Low';
}