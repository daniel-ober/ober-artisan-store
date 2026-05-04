// src/utils/legacyPrint/core/buildGenericVoiceProfile.js

import scoreSpiderProfile from '../../spider/scoreSpiderProfile.js';

import normalizeDrumSpec from './normalizeDrumSpec.js';

import {

  LEGACYPRINT_AXIS_KEYS,

  clampLegacyPrintScore,

  normalizeLegacyPrintProfile,

  roundLegacyPrintScore,

} from './legacyPrintAxes.js';

import { getConstructionVoicingProfile } from './constructionVoicingProfiles.js';

import { getMaterialVoicingProfile } from './materialVoicingProfiles.js';

import {

  getHoopVoicingProfile,

  getLugVoicingProfile,

} from './hardwareVoicingProfiles.js';

const CORE_WEIGHTING = Object.freeze({

  existingSpiderEngine: 0.44,

  construction: 0.2,

  material: 0.2,

  hoop: 0.1,

  lugCount: 0.06,

});

function weightedAverage(entries = []) {

  const totalWeight =

    entries.reduce((sum, entry) => sum + Number(entry.weight || 0), 0) || 1;

  return (

    entries.reduce((sum, entry) => {

      return sum + Number(entry.value || 5) * Number(entry.weight || 0);

    }, 0) / totalWeight

  );

}

function applyDimensionShaping(profile = {}, spec = {}) {

  const shaped = { ...profile };

  const diameter = Number(spec.width || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  const thickness = Number(spec.shellThicknessMm);

  const depthFactor = Math.max(-1, Math.min(1, (depth - 5.5) / 2.5));

  const diameterFactor = Math.max(-1, Math.min(1, (diameter - 14) / 2));

  shaped.attack -= depthFactor * 0.22;

  shaped.brightness -= depthFactor * 0.18;

  shaped.warmth += depthFactor * 0.34;

  shaped.sustain += depthFactor * 0.32;

  shaped.projection += depthFactor * 0.18;

  shaped.sensitivity -= depthFactor * 0.08;

  shaped.attack -= diameterFactor * 0.12;

  shaped.brightness -= diameterFactor * 0.1;

  shaped.warmth += diameterFactor * 0.16;

  shaped.projection += diameterFactor * 0.12;

  if (Number.isFinite(thickness)) {

    const thicknessFactor = Math.max(-1, Math.min(1, (thickness - 8) / 8));

    shaped.attack += thicknessFactor * 0.2;

    shaped.projection += thicknessFactor * 0.22;

    shaped.control += thicknessFactor * 0.26;

    shaped.sustain -= thicknessFactor * 0.18;

    shaped.sensitivity -= thicknessFactor * 0.16;

    shaped.warmth -= thicknessFactor * 0.08;

  }

  return normalizeLegacyPrintProfile(shaped);

}

function buildAxisBreakdown({

  axis,

  spiderValue,

  constructionProfile,

  materialProfile,

  hoopProfile,

  lugProfile,

}) {

  const entries = [

    {

      source: 'existingSpiderEngine',

      value: spiderValue,

      weight: CORE_WEIGHTING.existingSpiderEngine,

    },

    {

      source: 'construction',

      value: constructionProfile?.profile?.[axis] ?? 5,

      weight: CORE_WEIGHTING.construction,

    },

    {

      source: 'material',

      value: materialProfile?.profile?.[axis] ?? 5,

      weight: CORE_WEIGHTING.material,

    },

    {

      source: 'hoop',

      value: hoopProfile?.profile?.[axis] ?? 5,

      weight: CORE_WEIGHTING.hoop,

    },

    {

      source: 'lugCount',

      value: lugProfile?.profile?.[axis] ?? 5,

      weight: CORE_WEIGHTING.lugCount,

    },

  ];

  return {

    axis,

    entries,

    score: roundLegacyPrintScore(clampLegacyPrintScore(weightedAverage(entries))),

  };

}

export function buildGenericVoiceProfile(inputSpec = {}) {

  const spec = normalizeDrumSpec(inputSpec);

  const spiderResult = scoreSpiderProfile(spec);

  const spiderProfile = normalizeLegacyPrintProfile(spiderResult?.profile || {});

  const constructionProfile = getConstructionVoicingProfile(spec.constructionType);

  const materialProfile = getMaterialVoicingProfile(spec);

  const hoopProfile = getHoopVoicingProfile(spec.hoopType);

  const lugProfile = getLugVoicingProfile(spec);

  const rawProfile = {};

  const axisBreakdown = {};

  LEGACYPRINT_AXIS_KEYS.forEach((axis) => {

    const breakdown = buildAxisBreakdown({

      axis,

      spiderValue: spiderProfile?.[axis] ?? 5,

      constructionProfile,

      materialProfile,

      hoopProfile,

      lugProfile,

    });

    rawProfile[axis] = breakdown.score;

    axisBreakdown[axis] = breakdown;

  });

  const profile = applyDimensionShaping(rawProfile, spec);

  return {

    spec,

    profile,

    confidence01: spiderResult?.confidence01 ?? 0.68,

    confidencePercent: spiderResult?.confidencePercent ?? 68,

    axisBreakdown,

    voicingSources: {

      constructionProfile,

      materialProfile,

      hoopProfile,

      lugProfile,

      spiderResult,

    },

    meta: {

      engineVersion: 'legacyprint-generic-core-v0.1',

      scoringMode: 'generic_weighted_heuristic',

      note:

        'Projected voice read based on shell recipe, dimensions, construction, hardware, and standard setup assumptions. Not lab-measured acoustic output.',

    },

  };

}

export default buildGenericVoiceProfile;