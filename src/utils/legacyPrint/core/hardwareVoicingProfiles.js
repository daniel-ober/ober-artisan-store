// src/utils/legacyPrint/core/hardwareVoicingProfiles.js

export const HOOP_VOICING_PROFILES = Object.freeze({

  'triple-flange': {

    hoopType: 'triple-flange',

    label: 'Triple Flange',

    profile: {

      attack: 5.05,

      brightness: 5.15,

      projection: 5.05,

      sustain: 5.35,

      warmth: 5.2,

      sensitivity: 5.35,

      control: 4.95,

    },

    read:

      'Triple Flange hoops preserve more openness, air, and touch response.',

  },

  'die-cast': {

    hoopType: 'die-cast',

    label: 'Die-Cast',

    profile: {

      attack: 5.55,

      brightness: 5.25,

      projection: 5.45,

      sustain: 4.9,

      warmth: 4.95,

      sensitivity: 4.95,

      control: 5.65,

    },

    read:

      'Die-Cast hoops tighten the rim response and move the drum toward focus, control, and attack definition.',

  },

  wood: {

    hoopType: 'wood',

    label: 'Wood Hoop',

    profile: {

      attack: 4.95,

      brightness: 4.8,

      projection: 5.1,

      sustain: 5.35,

      warmth: 5.6,

      sensitivity: 5.25,

      control: 5.05,

    },

    read:

      'Wood hoops generally soften the front edge and add body, roundness, and warmth.',

  },

});

export const LUG_VOICING_PROFILES = Object.freeze({

  low: {

    lugZone: 'low',

    label: 'Lower Lug Count',

    profile: {

      attack: 4.95,

      brightness: 4.95,

      projection: 4.95,

      sustain: 5.35,

      warmth: 5.25,

      sensitivity: 5.35,

      control: 4.85,

    },

  },

  reference: {

    lugZone: 'reference',

    label: 'Reference Lug Count',

    profile: {

      attack: 5,

      brightness: 5,

      projection: 5,

      sustain: 5,

      warmth: 5,

      sensitivity: 5,

      control: 5,

    },

  },

  high: {

    lugZone: 'high',

    label: 'Higher Lug Count',

    profile: {

      attack: 5.35,

      brightness: 5.15,

      projection: 5.25,

      sustain: 4.85,

      warmth: 4.95,

      sensitivity: 4.95,

      control: 5.4,

    },

  },

});

export function normalizeHoopType(value = '') {

  const text = String(value || '')

    .trim()

    .toLowerCase()

    .replace(/_/g, '-');

  if (text.includes('die')) return 'die-cast';

  if (text.includes('triple')) return 'triple-flange';

  if (text.includes('wood')) return 'wood';

  return 'triple-flange';

}

export function getHoopVoicingProfile(value = '') {

  return HOOP_VOICING_PROFILES[normalizeHoopType(value)];

}

export function getLugVoicingProfile(spec = {}) {

  const lugQuantity = Number(spec.lugQuantity);

  if (!Number.isFinite(lugQuantity)) return LUG_VOICING_PROFILES.reference;

  const diameter = Number(spec.width || spec.diameter || 14);

  const referenceLugs = diameter <= 12 ? 6 : diameter <= 13 ? 8 : 10;

  if (lugQuantity < referenceLugs) return LUG_VOICING_PROFILES.low;

  if (lugQuantity > referenceLugs) return LUG_VOICING_PROFILES.high;

  return LUG_VOICING_PROFILES.reference;

}

export default HOOP_VOICING_PROFILES;