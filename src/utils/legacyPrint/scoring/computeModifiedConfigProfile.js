
import { NODE_KEYS } from './nodeKeys.js';

import { MODIFIED_CONFIG_WEIGHTS, clampScore } from './scoringConstants.js';

import { PHYSICAL_PROPERTY_NODE_MAP } from './physicalPropertyNodeMap.js';

const normalize = (value) =>

  String(value || '')

    .trim()

    .toLowerCase()

    .replace(/\s+/g, '-');

const MODIFIED_FIELD_TO_MAP_FIELD = {

  hoopType: 'hoopType',

  batterHead: 'stockBatterHead',

  resoHead: 'stockResoHead',

  snareWires: 'stockSnareWires',

};

const findMappedImpact = (field, value) => {

  const mappedField = MODIFIED_FIELD_TO_MAP_FIELD[field] || field;

  const fieldMap = PHYSICAL_PROPERTY_NODE_MAP[mappedField];

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

    scoringBasis: 'computed-modified-config-physical-fields-v1',

  };

}

