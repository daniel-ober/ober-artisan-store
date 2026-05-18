import { NODE_KEYS } from './nodeKeys.js';

import { MODIFIED_CONFIG_WEIGHTS, clampScore } from './scoringConstants.js';

import { resolveModifier } from './resolveModifier.js';

const MODIFIER_CATEGORY_BY_FIELD = {

  batterHead: 'batterHeads',

  resoHead: 'resoHeads',

  snareWires: 'snareWires',

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

export function computeModifiedConfigProfile(record = {}, stockConfig = {}, modifiedConfig = null) {

  let workingScores = { ...(stockConfig?.scores || {}) };

  const appliedDrivers = [];

  const unknownComponents = [];

  if (!modifiedConfig) {

    return {

      scores: finalizeScores(workingScores),

      appliedDrivers,

      unknownComponents,

      scoringBasis: 'no-modified-config-provided',

    };

  }

  Object.entries(MODIFIED_CONFIG_WEIGHTS).forEach(([field, weight]) => {

    const value = modifiedConfig[field];

    if (value == null || value === '') {

      unknownComponents.push({ field, reason: 'missing-value' });

      return;

    }

    const modifierDriver = buildResolvedModifierDriver({ field, value, weight });

    if (!modifierDriver?.matched) {

      unknownComponents.push(

        modifierDriver || {

          field,

          value,

          reason: 'no-supported-modifier-category',

        }

      );

      return;

    }

    workingScores = applyImpact(workingScores, modifierDriver.impact, weight);

    appliedDrivers.push(modifierDriver);

  });

  return {

    scores: finalizeScores(workingScores),

    appliedDrivers,

    unknownComponents,

    scoringBasis: 'computed-modified-config-modifier-registry-v1',

  };

}