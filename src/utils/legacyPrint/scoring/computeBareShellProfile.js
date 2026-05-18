// src/utils/legacyPrint/scoring/computeBareShellProfile.js

import { NODE_KEYS, createNeutralNodeProfile } from './nodeKeys';

import { SHELL_FIELD_WEIGHTS, SCORE_NEUTRAL, clampScore } from './scoringConstants';

import { PHYSICAL_PROPERTY_NODE_MAP } from './physicalPropertyNodeMap';

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

const applyImpact = (profile, impact, weight = 1) => {

  if (!impact) return profile;

  NODE_KEYS.forEach((node) => {

    if (typeof impact[node] === 'number') {

      profile[node] += impact[node] * weight;

    }

  });

  return profile;

};

const applyNumericShellDrivers = (profile, record) => {

  const thickness = Number(record.shellThicknessMm);

  const depth = Number(record.depth);

  const diameter = Number(record.diameter);

  if (Number.isFinite(thickness)) {

    if (thickness >= 8) {

      profile.attack += 0.35;

      profile.projection += 0.35;

      profile.control += 0.2;

      profile.sustain -= 0.15;

    } else if (thickness <= 5.5) {

      profile.sensitivity += 0.35;

      profile.sustain += 0.25;

      profile.control -= 0.1;

    }

  }

  if (Number.isFinite(depth)) {

    if (depth >= 6.5) {

      profile.warmth += 0.35;

      profile.projection += 0.25;

      profile.sustain += 0.2;

    } else if (depth <= 5) {

      profile.attack += 0.25;

      profile.sensitivity += 0.2;

      profile.warmth -= 0.15;

    }

  }

  if (Number.isFinite(diameter)) {

    if (diameter >= 14) {

      profile.warmth += 0.2;

      profile.projection += 0.15;

    } else if (diameter <= 13) {

      profile.attack += 0.2;

      profile.brightness += 0.2;

      profile.sensitivity += 0.15;

    }

  }

  return profile;

};

export function computeBareShellProfile(record = {}) {

  const profile = createNeutralNodeProfile(SCORE_NEUTRAL);

  const appliedDrivers = [];

  Object.entries(SHELL_FIELD_WEIGHTS).forEach(([field, weight]) => {

    const impact = findMappedImpact(field, record[field]);

    if (impact) {

      applyImpact(profile, impact, weight);

      appliedDrivers.push({

        field,

        value: record[field],

        weight,

        impact,

      });

    }

  });

  applyNumericShellDrivers(profile, record);

  const scores = NODE_KEYS.reduce((finalProfile, node) => {

    finalProfile[node] = clampScore(profile[node]);

    return finalProfile;

  }, {});

  return {

    scores,

    appliedDrivers,

    scoringBasis: 'computed-bare-shell-physical-fields-v1',

  };

}