// src/data/legacyPrint/hoopHardwareProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * LegacyPrint hoop + hardware profiles

 *

 * Hoops and hardware do not define the whole drum voice by themselves.

 * They shape how the shell/head system behaves:

 * - rim stiffness

 * - note containment

 * - attack definition

 * - sustain openness

 * - tuning stability

 * - response under the hands

 */

export const HOOP_PROFILES = {

  tripleFlange: {

    id: 'tripleFlange',

    label: 'Triple Flange',

    category: 'openSteel',

    userFacingLabel: 'Triple Flange / Open Response',

    description:

      'Triple flange hoops usually preserve more openness, air, and natural shell/head movement.',

    stiffness: 0.42,

    mass: 0.38,

    openness: 0.78,

    control: 0.42,

    nodeBias: {

      attack: 0,

      brightness: 0.03,

      projection: 0,

      sustain: 0.07,

      warmth: 0.02,

      sensitivity: 0.04,

      control: -0.04,

    },

  },

  dieCast: {

    id: 'dieCast',

    label: 'Die-Cast',

    category: 'rigidCast',

    userFacingLabel: 'Die-Cast / Focused Response',

    description:

      'Die-cast hoops add mass and rigidity, tightening the note shape and increasing focus.',

    stiffness: 0.86,

    mass: 0.82,

    openness: 0.34,

    control: 0.86,

    nodeBias: {

      attack: 0.08,

      brightness: 0.03,

      projection: 0.05,

      sustain: -0.08,

      warmth: -0.02,

      sensitivity: -0.05,

      control: 0.12,

    },

  },

  singleFlangeClips: {

    id: 'singleFlangeClips',

    label: 'Single Flange with Clips',

    category: 'vintageOpen',

    userFacingLabel: 'Single Flange / Vintage Open',

    description:

      'Single flange hoops with clips tend to feel more open, woody, and vintage, with less built-in control.',

    stiffness: 0.28,

    mass: 0.28,

    openness: 0.9,

    control: 0.26,

    nodeBias: {

      attack: -0.04,

      brightness: 0.01,

      projection: -0.02,

      sustain: 0.1,

      warmth: 0.05,

      sensitivity: 0.05,

      control: -0.08,

    },

  },

  woodHoop: {

    id: 'woodHoop',

    label: 'Wood Hoop',

    category: 'woodWarmth',

    userFacingLabel: 'Wood Hoop / Warm Rim',

    description:

      'Wood hoops soften the front edge and add rim warmth, often reducing metallic brightness.',

    stiffness: 0.46,

    mass: 0.58,

    openness: 0.62,

    control: 0.48,

    nodeBias: {

      attack: -0.04,

      brightness: -0.08,

      projection: -0.02,

      sustain: 0.03,

      warmth: 0.1,

      sensitivity: 0.02,

      control: 0.02,

    },

  },

  sHoop: {

    id: 'sHoop',

    label: 'S-Hoop / Safe Hoop',

    category: 'controlledFlange',

    userFacingLabel: 'S-Hoop / Controlled Open',

    description:

      'S-style hoops sit between open triple flange and die-cast behavior, adding focus without fully locking the drum down.',

    stiffness: 0.62,

    mass: 0.58,

    openness: 0.58,

    control: 0.62,

    nodeBias: {

      attack: 0.04,

      brightness: 0.02,

      projection: 0.03,

      sustain: -0.03,

      warmth: 0,

      sensitivity: -0.01,

      control: 0.06,

    },

  },

};

export const LUG_PROFILES = {

  tubeLug: {

    id: 'tubeLug',

    label: 'Tube Lugs',

    userFacingLabel: 'Tube Lugs / Classic Low-Mass',

    description:

      'Tube lugs are relatively low mass and tend to preserve shell movement while keeping a classic snare look.',

    mass: 0.38,

    shellContact: 0.32,

    tuningStability: 0.68,

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0.03,

      warmth: 0.02,

      sensitivity: 0.02,

      control: 0,

    },

  },

  modernBridgeLug: {

    id: 'modernBridgeLug',

    label: 'Modern Bridge Lugs',

    userFacingLabel: 'Modern Bridge Lugs / Balanced',

    description:

      'Modern bridge lugs add a little more hardware presence and tuning stability while still leaving the shell fairly open.',

    mass: 0.52,

    shellContact: 0.46,

    tuningStability: 0.76,

    nodeBias: {

      attack: 0.02,

      brightness: 0.01,

      projection: 0.02,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0.03,

    },

  },

  highMassLug: {

    id: 'highMassLug',

    label: 'High-Mass Lugs',

    userFacingLabel: 'High-Mass Lugs / Controlled',

    description:

      'Higher-mass lugs can increase stability and focus, but may reduce some shell openness.',

    mass: 0.78,

    shellContact: 0.72,

    tuningStability: 0.86,

    nodeBias: {

      attack: 0.04,

      brightness: 0.01,

      projection: 0.03,

      sustain: -0.04,

      warmth: -0.02,

      sensitivity: -0.03,

      control: 0.07,

    },

  },

  minimalLug: {

    id: 'minimalLug',

    label: 'Minimal / Low-Mass Lugs',

    userFacingLabel: 'Minimal Lugs / Open Shell',

    description:

      'Minimal lugs reduce shell contact and hardware mass, usually preserving more shell movement and touch response.',

    mass: 0.22,

    shellContact: 0.2,

    tuningStability: 0.56,

    nodeBias: {

      attack: -0.02,

      brightness: 0,

      projection: -0.01,

      sustain: 0.05,

      warmth: 0.04,

      sensitivity: 0.04,

      control: -0.04,

    },

  },

};

export const LUG_COUNT_PROFILES = {

  low: {

    id: 'low',

    label: 'Lower Lug Count',

    description:

      'Fewer lugs give the head more room to breathe, often softening attack and opening sustain.',

    nodeBias: {

      attack: -0.06,

      brightness: -0.03,

      projection: -0.02,

      sustain: 0.07,

      warmth: 0.05,

      sensitivity: 0.05,

      control: -0.08,

    },

  },

  standard: {

    id: 'standard',

    label: 'Standard Lug Count',

    description:

      'A standard lug count keeps the drum close to its expected tuning and response behavior.',

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0,

    },

  },

  high: {

    id: 'high',

    label: 'Higher Lug Count',

    description:

      'More lugs distribute tension more evenly, often increasing attack definition, control, and tuning precision.',

    nodeBias: {

      attack: 0.07,

      brightness: 0.03,

      projection: 0.04,

      sustain: -0.06,

      warmth: -0.02,

      sensitivity: -0.03,

      control: 0.09,

    },

  },

};

export const HARDWARE_FINISH_PROFILES = {

  chrome: {

    id: 'chrome',

    label: 'Chrome',

    userFacingLabel: 'Chrome',

    description:

      'Chrome is treated as visually neutral in the voicing engine unless the exact hardware mass changes.',

    visualTone: 'classic',

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0,

    },

  },

  blackNickel: {

    id: 'blackNickel',

    label: 'Black Nickel',

    userFacingLabel: 'Black Nickel',

    description:

      'Black nickel is primarily a visual finish. Any sonic difference is treated as negligible unless hardware mass changes.',

    visualTone: 'modern-dark',

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0,

    },

  },

  brassGold: {

    id: 'brassGold',

    label: 'Brass / Gold',

    userFacingLabel: 'Brass / Gold',

    description:

      'Brass or gold hardware finish is primarily visual unless the actual hardware material or mass changes.',

    visualTone: 'warm-premium',

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0,

    },

  },

  rawBrass: {

    id: 'rawBrass',

    label: 'Raw Brass Hardware',

    userFacingLabel: 'Raw Brass Hardware',

    description:

      'Raw brass hardware may add a small amount of mass depending on the part, but finish color itself is not treated as a major tone factor.',

    visualTone: 'aged-warm',

    nodeBias: {

      attack: 0,

      brightness: -0.01,

      projection: 0,

      sustain: -0.01,

      warmth: 0.01,

      sensitivity: 0,

      control: 0.01,

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

function sumNodeBias(...biasObjects) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(

      biasObjects.reduce((sum, bias) => {

        return sum + Number(bias?.[nodeKey] || 0);

      }, 0)

    );

    return acc;

  }, {});

}

export function getHoopProfileKey(value = 'tripleFlange') {

  const normalized = normalizeText(value);

  if (normalized.includes('die')) return 'dieCast';

  if (normalized.includes('single')) return 'singleFlangeClips';

  if (normalized.includes('wood')) return 'woodHoop';

  if (normalized.includes('s-hoop') || normalized.includes('safe')) {

    return 'sHoop';

  }

  return 'tripleFlange';

}

export function getLugProfileKey(value = 'tubeLug') {

  const normalized = normalizeText(value);

  if (normalized.includes('tube')) return 'tubeLug';

  if (normalized.includes('bridge')) return 'modernBridgeLug';

  if (

    normalized.includes('high mass') ||

    normalized.includes('high-mass') ||

    normalized.includes('heavy')

  ) {

    return 'highMassLug';

  }

  if (

    normalized.includes('minimal') ||

    normalized.includes('low mass') ||

    normalized.includes('low-mass')

  ) {

    return 'minimalLug';

  }

  return 'tubeLug';

}

export function getHardwareFinishKey(value = 'chrome') {

  const normalized = normalizeText(value);

  if (normalized.includes('black')) return 'blackNickel';

  if (normalized.includes('brass') || normalized.includes('gold')) {

    return 'brassGold';

  }

  if (normalized.includes('raw')) return 'rawBrass';

  return 'chrome';

}

export function getLugCountProfileKey({

  drumType = 'snare',

  width = 14,

  lugQuantity = 8,

} = {}) {

  const lugs = Number(lugQuantity);

  const diameter = Number(width);

  if (!Number.isFinite(lugs)) return 'standard';

  if (drumType === 'snare') {

    if (diameter <= 12) {

      if (lugs <= 6) return 'low';

      if (lugs >= 8) return 'high';

      return 'standard';

    }

    if (diameter === 13) {

      if (lugs <= 6) return 'low';

      if (lugs >= 10) return 'high';

      return 'standard';

    }

    if (lugs <= 6) return 'low';

    if (lugs >= 10) return 'high';

    return 'standard';

  }

  if (drumType === 'rackTom') {

    if (lugs <= 5) return 'low';

    if (lugs >= 7) return 'high';

    return 'standard';

  }

  if (drumType === 'floorTom') {

    if (lugs <= 6) return 'low';

    if (lugs >= 8) return 'high';

    return 'standard';

  }

  if (drumType === 'bassDrum') {

    if (lugs <= 8) return 'low';

    if (lugs >= 12) return 'high';

    return 'standard';

  }

  return 'standard';

}

export function buildHoopHardwareRead({

  drumType = 'snare',

  width = 14,

  hoopType = 'Triple Flange',

  lugType = 'Tube Lugs',

  lugQuantity = 8,

  hardwareFinish = 'Chrome',

} = {}) {

  const hoopKey = getHoopProfileKey(hoopType);

  const lugKey = getLugProfileKey(lugType);

  const lugCountKey = getLugCountProfileKey({

    drumType,

    width,

    lugQuantity,

  });

  const finishKey = getHardwareFinishKey(hardwareFinish);

  const hoopProfile = HOOP_PROFILES[hoopKey] || HOOP_PROFILES.tripleFlange;

  const lugProfile = LUG_PROFILES[lugKey] || LUG_PROFILES.tubeLug;

  const lugCountProfile =

    LUG_COUNT_PROFILES[lugCountKey] || LUG_COUNT_PROFILES.standard;

  const finishProfile =

    HARDWARE_FINISH_PROFILES[finishKey] || HARDWARE_FINISH_PROFILES.chrome;

  const nodeBias = sumNodeBias(

    hoopProfile.nodeBias,

    lugProfile.nodeBias,

    lugCountProfile.nodeBias,

    finishProfile.nodeBias

  );

  const hardwareMass = round2(

    Number(hoopProfile.mass || 0) * 0.45 +

      Number(lugProfile.mass || 0) * 0.35 +

      (lugCountKey === 'high' ? 0.16 : lugCountKey === 'low' ? -0.12 : 0)

  );

  const controlPotential = round2(

    Number(hoopProfile.control || 0) * 0.52 +

      Number(lugProfile.tuningStability || 0) * 0.28 +

      (lugCountKey === 'high' ? 0.16 : lugCountKey === 'low' ? -0.12 : 0)

  );

  const opennessPotential = round2(

    Number(hoopProfile.openness || 0) * 0.62 +

      (lugKey === 'minimalLug' ? 0.12 : lugKey === 'highMassLug' ? -0.1 : 0) +

      (lugCountKey === 'low' ? 0.1 : lugCountKey === 'high' ? -0.08 : 0)

  );

  return {

    drumType,

    width: Number(width),

    hoopKey,

    hoop: hoopProfile,

    lugKey,

    lug: lugProfile,

    lugCountKey,

    lugCount: lugCountProfile,

    finishKey,

    finish: finishProfile,

    hardwareMass,

    controlPotential,

    opennessPotential,

    nodeBias,

    summary: `${hoopProfile.userFacingLabel}. ${hoopProfile.description} ${lugCountProfile.description}`,

  };

}

export function buildNeutralHoopHardwareRead() {

  return {

    hoopKey: 'tripleFlange',

    hoop: HOOP_PROFILES.tripleFlange,

    lugKey: 'tubeLug',

    lug: LUG_PROFILES.tubeLug,

    lugCountKey: 'standard',

    lugCount: LUG_COUNT_PROFILES.standard,

    finishKey: 'chrome',

    finish: HARDWARE_FINISH_PROFILES.chrome,

    hardwareMass: 0,

    controlPotential: 0,

    opennessPotential: 0,

    nodeBias: emptyNodeBias(),

    summary:

      'Neutral hardware reference: triple flange hoops, tube lugs, standard lug count, and chrome finish.',

  };

}

export default HOOP_PROFILES;