import { NODE_KEYS } from './nodeKeys.js';

import { STOCK_CONFIG_WEIGHTS, clampScore } from './scoringConstants.js';

import { resolveModifier } from './resolveModifier.js';

const MODIFIER_CATEGORY_BY_FIELD = {

  stockBatterHead: 'batterHeads',

  stockResoHead: 'resoHeads',

  stockSnareWires: 'snareWires',

  hoopType: 'hoops',

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

const buildResolvedModifierDriver = ({ field, value, weight }) => {

  const category = MODIFIER_CATEGORY_BY_FIELD[field];

  if (!category) return null;

  const resolved = resolveModifier(category, value);

  if (!resolved?.matched) {

    return {

      matched: false,

      field,

      value,

      category,

      resolvedId: resolved?.id || 'unknown_modifier',

      reason: 'no-registry-match',

      confidence: resolved?.confidence || {

        matchConfidence: 'unknown',

        deltaConfidence: 'unknown',

        physicalConfidence: 'unknown',

      },

    };

  }

  return {

    matched: true,

    field,

    value,

    category,

    resolvedId: resolved.id,

    label: resolved.label,

    weight,

    impact: resolved.nodeDeltas,

    confidence: resolved.confidence,

  };

};

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

        appliedDrivers.push({

          matched: true,

          field,

          value,

          category: 'hardwareFactor',

          resolvedId: 'hardware_lug_count_physical_factor',

          label: 'Lug count physical factor',

          weight,

          impact,

          confidence: {

            matchConfidence: 'high',

            deltaConfidence: 'medium',

            physicalConfidence: 'high',

          },

        });

      } else {

        unknownComponents.push({ field, value, reason: 'invalid-number' });

      }

      return;

    }

    const modifierDriver = buildResolvedModifierDriver({ field, value, weight });

    if (!modifierDriver?.matched) {

      unknownComponents.push(modifierDriver || {

        field,

        value,

        reason: 'no-supported-modifier-category',

      });

      return;

    }

    workingScores = applyImpact(workingScores, modifierDriver.impact, weight);

    appliedDrivers.push(modifierDriver);

  });

  return {

    scores: finalizeScores(workingScores),

    appliedDrivers,

    unknownComponents,

    scoringBasis: 'computed-stock-config-modifier-registry-v1',

  };

}