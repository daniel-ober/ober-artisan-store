// src/data/legacyPrint/bearingEdgeProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * LegacyPrint bearing edge profiles

 *

 * Bearing edges strongly affect:

 * - attack speed

 * - head contact

 * - sustain length

 * - warmth/body

 * - sensitivity

 * - control/focus

 *

 * General model:

 * - Sharper / more inward edges = quicker attack, brighter response, more sensitivity, sometimes more sustain.

 * - Rounder edges = warmer body, softer attack, more shell contact, shorter/rounder sustain.

 * - Wider contact patch = more shell involvement, warmth, and control, less crispness.

 */

export const BEARING_EDGE_PROFILES = {

  sharp45: {

    id: 'sharp45',

    label: 'Sharp 45°',

    userFacingLabel: 'Sharp 45° Edge',

    family: 'sharpModern',

    description:

      'A sharp 45° edge gives the head a fast, clean contact point with more attack, brightness, and sensitivity.',

    contactPatch: 0.18,

    sharpness: 0.92,

    shellContact: 0.18,

    headFreedom: 0.86,

    nodeBias: {

      attack: 0.09,

      brightness: 0.08,

      projection: 0.04,

      sustain: 0.04,

      warmth: -0.06,

      sensitivity: 0.08,

      control: -0.02,

    },

  },

  inner45SoftOuter: {

    id: 'inner45SoftOuter',

    label: '45° Inner / Soft Outer Roundover',

    userFacingLabel: '45° Inner / Soft Outer Roundover',

    family: 'balancedModernVintage',

    description:

      'A 45° inner edge with a softened outer roundover keeps clear attack while adding a little more shell body and warmth.',

    contactPatch: 0.34,

    sharpness: 0.72,

    shellContact: 0.38,

    headFreedom: 0.7,

    nodeBias: {

      attack: 0.04,

      brightness: 0.03,

      projection: 0.03,

      sustain: 0.01,

      warmth: 0.03,

      sensitivity: 0.04,

      control: 0.02,

    },

  },

  inner45StrongOuter: {

    id: 'inner45StrongOuter',

    label: '45° Inner / Strong Outer Roundover',

    userFacingLabel: '45° Inner / Strong Outer Roundover',

    family: 'oberReference',

    description:

      'A 45° inner edge with a stronger outer roundover is an Ober Heritage-style balance of stick clarity, wood body, and controlled openness.',

    contactPatch: 0.44,

    sharpness: 0.62,

    shellContact: 0.52,

    headFreedom: 0.62,

    nodeBias: {

      attack: 0.02,

      brightness: 0.01,

      projection: 0.03,

      sustain: -0.01,

      warmth: 0.05,

      sensitivity: 0.02,

      control: 0.04,

    },

  },

  double45: {

    id: 'double45',

    label: 'Double 45°',

    userFacingLabel: 'Double 45° Edge',

    family: 'modernOpen',

    description:

      'A double 45° edge keeps the head very free, creating a quick, open, articulate response with less built-in shell warmth.',

    contactPatch: 0.2,

    sharpness: 0.88,

    shellContact: 0.22,

    headFreedom: 0.88,

    nodeBias: {

      attack: 0.08,

      brightness: 0.07,

      projection: 0.04,

      sustain: 0.05,

      warmth: -0.05,

      sensitivity: 0.07,

      control: -0.03,

    },

  },

  roundoverSmall: {

    id: 'roundoverSmall',

    label: 'Small Roundover',

    userFacingLabel: 'Small Roundover',

    family: 'warmBalanced',

    description:

      'A small roundover gives the head more shell contact than a sharp edge while keeping enough clarity for modern playing.',

    contactPatch: 0.48,

    sharpness: 0.48,

    shellContact: 0.56,

    headFreedom: 0.54,

    nodeBias: {

      attack: -0.01,

      brightness: -0.02,

      projection: 0.01,

      sustain: -0.01,

      warmth: 0.06,

      sensitivity: 0.01,

      control: 0.04,

    },

  },

  roundoverMedium: {

    id: 'roundoverMedium',

    label: 'Medium Roundover',

    userFacingLabel: 'Medium Roundover',

    family: 'vintageWarm',

    description:

      'A medium roundover gives the drum more shell contact, warmer body, softer attack, and a rounder note shape.',

    contactPatch: 0.62,

    sharpness: 0.34,

    shellContact: 0.7,

    headFreedom: 0.42,

    nodeBias: {

      attack: -0.05,

      brightness: -0.05,

      projection: -0.01,

      sustain: -0.03,

      warmth: 0.09,

      sensitivity: -0.01,

      control: 0.05,

    },

  },

  fullRoundover: {

    id: 'fullRoundover',

    label: 'Full Roundover',

    userFacingLabel: 'Full Roundover',

    family: 'vintageDark',

    description:

      'A full roundover maximizes shell contact, giving the voice a darker, warmer, softer, more vintage response.',

    contactPatch: 0.82,

    sharpness: 0.18,

    shellContact: 0.88,

    headFreedom: 0.26,

    nodeBias: {

      attack: -0.09,

      brightness: -0.08,

      projection: -0.03,

      sustain: -0.05,

      warmth: 0.12,

      sensitivity: -0.03,

      control: 0.06,

    },

  },

  baseballBat: {

    id: 'baseballBat',

    label: 'Baseball Bat Roundover',

    userFacingLabel: 'Baseball Bat Roundover',

    family: 'deepVintage',

    description:

      'A baseball bat edge creates a wide contact patch with a thick, woody, vintage voice and a much softer front edge.',

    contactPatch: 0.92,

    sharpness: 0.1,

    shellContact: 0.94,

    headFreedom: 0.18,

    nodeBias: {

      attack: -0.12,

      brightness: -0.1,

      projection: -0.04,

      sustain: -0.06,

      warmth: 0.14,

      sensitivity: -0.04,

      control: 0.07,

    },

  },

  hybridModernVintage: {

    id: 'hybridModernVintage',

    label: 'Hybrid Modern / Vintage',

    userFacingLabel: 'Hybrid Modern / Vintage Edge',

    family: 'hybridBalanced',

    description:

      'A hybrid edge blends a defined head contact point with added shell contact, keeping the drum articulate but not overly sharp.',

    contactPatch: 0.42,

    sharpness: 0.58,

    shellContact: 0.52,

    headFreedom: 0.58,

    nodeBias: {

      attack: 0.02,

      brightness: 0.01,

      projection: 0.02,

      sustain: 0,

      warmth: 0.04,

      sensitivity: 0.03,

      control: 0.03,

    },

  },

  feuzonBalancedHybrid: {

    id: 'feuzonBalancedHybrid',

    label: 'FEUZØN Balanced Hybrid Edge',

    userFacingLabel: 'FEUZØN Balanced Hybrid Edge',

    family: 'oberFeuzon',

    description:

      'The FEUZØN balanced hybrid edge is designed to keep the hybrid shell articulate while preserving body from the voiced interior and steam-bent exterior.',

    contactPatch: 0.4,

    sharpness: 0.64,

    shellContact: 0.5,

    headFreedom: 0.64,

    nodeBias: {

      attack: 0.04,

      brightness: 0.02,

      projection: 0.04,

      sustain: 0.01,

      warmth: 0.03,

      sensitivity: 0.04,

      control: 0.04,

    },

  },

};

const normalizeText = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase();

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

function emptyNodeBias() {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = 0;

    return acc;

  }, {});

}

export function getBearingEdgeKey(value = 'inner45StrongOuter') {

  const normalized = normalizeText(value);

  if (!normalized) return 'inner45StrongOuter';

  if (normalized.includes('feuz')) return 'feuzonBalancedHybrid';

  if (

    normalized.includes('45') &&

    normalized.includes('strong') &&

    normalized.includes('outer')

  ) {

    return 'inner45StrongOuter';

  }

  if (

    normalized.includes('45') &&

    normalized.includes('soft') &&

    normalized.includes('outer')

  ) {

    return 'inner45SoftOuter';

  }

  if (normalized.includes('double') && normalized.includes('45')) {

    return 'double45';

  }

  if (normalized.includes('sharp') && normalized.includes('45')) {

    return 'sharp45';

  }

  if (normalized.includes('baseball')) return 'baseballBat';

  if (normalized.includes('full') && normalized.includes('round')) {

    return 'fullRoundover';

  }

  if (normalized.includes('medium') && normalized.includes('round')) {

    return 'roundoverMedium';

  }

  if (normalized.includes('small') && normalized.includes('round')) {

    return 'roundoverSmall';

  }

  if (normalized.includes('round')) return 'roundoverMedium';

  if (normalized.includes('hybrid')) return 'hybridModernVintage';

  if (normalized.includes('45')) return 'sharp45';

  return 'inner45StrongOuter';

}

export function buildBearingEdgeRead({

  bearingEdge = '45 Inner / Strong Outer Roundover',

  isOberBuild = false,

} = {}) {

  const bearingEdgeKey = getBearingEdgeKey(bearingEdge);

  const profile =

    BEARING_EDGE_PROFILES[bearingEdgeKey] ||

    BEARING_EDGE_PROFILES.inner45StrongOuter;

  return {

    bearingEdgeKey,

    profile,

    isOberBuild: Boolean(isOberBuild),

    contactPatch: round2(profile.contactPatch),

    sharpness: round2(profile.sharpness),

    shellContact: round2(profile.shellContact),

    headFreedom: round2(profile.headFreedom),

    nodeBias: profile.nodeBias || emptyNodeBias(),

    summary: `${profile.userFacingLabel}. ${profile.description}`,

  };

}

export function buildNeutralBearingEdgeRead() {

  return {

    bearingEdgeKey: 'neutral',

    profile: null,

    isOberBuild: false,

    contactPatch: 0,

    sharpness: 0,

    shellContact: 0,

    headFreedom: 0,

    nodeBias: emptyNodeBias(),

    summary:

      'Neutral bearing edge reference: no bearing-edge shift applied.',

  };

}

export default BEARING_EDGE_PROFILES;