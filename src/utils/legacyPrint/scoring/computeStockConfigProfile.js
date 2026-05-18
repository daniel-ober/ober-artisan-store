
import { NODE_KEYS } from './nodeKeys.js';

import { STOCK_CONFIG_WEIGHTS, clampScore } from './scoringConstants.js';

import { PHYSICAL_PROPERTY_NODE_MAP } from './physicalPropertyNodeMap.js';

const normalize = (value) =>

  String(value || '')

    .trim()

    .toLowerCase()

    .replace(/\s+/g, '-');

const findMappedImpact = (field, value) => {

  const fieldMap = PHYSICAL_PROPERTY_NODE_MAP[field];

  if (!fieldMap || value == null) return null;

  const normalized = normalize(value);

  return Object.entries(fieldMap).find(([key]) => normalized.includes(key))?.[1] || null;

};

const applyImpact = (scores, impact, weight = 1) => {

  const nextScores = { ...scores };

  NODE_KEYS.forEach((node) => {

    if (typeof impact?.[node] === 'number') {

      nextScores[node] = (nextScores[node] || 5) + impact[node] * weight;

    }

  });

  return nextScores;

};

const finalizeScores = (scores) =>

  NODE_KEYS.reduce((finalScores, node) => {

    finalScores[node] = clampScore(scores[node] || 5);

    return finalScores;

  }, {});

export function computeStockConfigProfile(record = {}, bareShell = {}) {

  let workingScores = { ...(bareShell?.scores || {}) };

  const appliedDrivers = [];

  const unknownComponents = [];

  Object.entries(STOCK_CONFIG_WEIGHTS).forEach(([field, weight]) => {

    const value = record[field];

    if (value == null || value === '') {

      unknownComponents.push({ field, reason: 'missing-value' });

      return;

    }

    if (field === 'lugCount') {

      const lugCount = Number(value);

      if (Number.isFinite(lugCount)) {

        const impact =

          lugCount >= 10

            ? { control: 0.25, sensitivity: 0.1 }

            : lugCount <= 6

              ? { sustain: 0.2, control: -0.15 }

              : { sensitivity: 0.1 };

        workingScores = applyImpact(workingScores, impact, weight);

        appliedDrivers.push({ field, value, weight, impact });

      } else {

        unknownComponents.push({ field, value, reason: 'invalid-number' });

      }

      return;

    }

    const impact = findMappedImpact(field, value);

    if (!impact) {

      unknownComponents.push({ field, value, reason: 'no-mapped-impact' });

      return;

    }

    workingScores = applyImpact(workingScores, impact, weight);

    appliedDrivers.push({ field, value, weight, impact });

  });

  return {

    scores: finalizeScores(workingScores),

    appliedDrivers,

    unknownComponents,

    scoringBasis: 'computed-stock-config-physical-fields-v1',

  };

}

