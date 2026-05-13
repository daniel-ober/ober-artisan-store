// src/data/legacyPrint/drumheadProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * Drumhead taxonomy

 *

 * Goal:

 * - Front end can show simple, human categories.

 * - Engine can still map to real head behavior.

 * - Later we can add exact manufacturer/model recommendations.

 */

export const DRUMHEAD_SURFACE_TYPES = {

  clear: {

    label: 'Clear',

    description:

      'Clear heads usually sound brighter, more open, and more immediate than coated versions of a similar construction.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.08,

      projection: 0.03,

      sustain: 0.04,

      warmth: -0.04,

      sensitivity: 0.02,

      control: -0.03,

    },

  },

  coated: {

    label: 'Coated',

    description:

      'Coated heads usually soften the top edge, add warmth, and give the drum a slightly drier, more familiar studio feel.',

    nodeBias: {

      attack: -0.01,

      brightness: -0.05,

      projection: 0,

      sustain: -0.02,

      warmth: 0.06,

      sensitivity: 0.03,

      control: 0.03,

    },

  },

  fiberskyn: {

    label: 'Vintage / Calfskin-Style',

    description:

      'Vintage-style synthetic heads lean warmer, rounder, darker, and more controlled, with less sharp top-end attack.',

    nodeBias: {

      attack: -0.04,

      brightness: -0.09,

      projection: -0.02,

      sustain: -0.04,

      warmth: 0.09,

      sensitivity: 0.02,

      control: 0.05,

    },

  },

  mesh: {

    label: 'Mesh / Practice',

    description:

      'Mesh heads are mainly for quiet practice or triggering. They should not be treated as normal acoustic drumhead voices.',

    nodeBias: {

      attack: -0.08,

      brightness: -0.08,

      projection: -0.18,

      sustain: -0.18,

      warmth: -0.08,

      sensitivity: 0.04,

      control: 0.1,

    },

  },

};

export const DRUMHEAD_CONSTRUCTION_TYPES = {

  singlePlyThin: {

    label: 'Thin Single-Ply',

    userFacingLabel: 'Open / Sensitive',

    plyCount: 1,

    approximateMil: 7,

    description:

      'A thinner single-ply head responds easily, opens up quickly, and favors sensitivity, brightness, and sustain.',

    nodeBias: {

      attack: 0.03,

      brightness: 0.05,

      projection: -0.01,

      sustain: 0.08,

      warmth: -0.02,

      sensitivity: 0.09,

      control: -0.06,

    },

  },

  singlePlyStandard: {

    label: 'Standard Single-Ply',

    userFacingLabel: 'Balanced',

    plyCount: 1,

    approximateMil: 10,

    description:

      'A standard single-ply head is the balanced reference point: open enough to breathe, controlled enough to use broadly.',

    nodeBias: {

      attack: 0.02,

      brightness: 0.02,

      projection: 0.02,

      sustain: 0.03,

      warmth: 0,

      sensitivity: 0.04,

      control: -0.01,

    },

  },

  singlePlyControlled: {

    label: 'Controlled Single-Ply',

    userFacingLabel: 'Focused / Controlled',

    plyCount: 1,

    approximateMil: 10,

    description:

      'A controlled single-ply head keeps some single-ply response while adding damping, focus, and easier placement.',

    nodeBias: {

      attack: 0.03,

      brightness: -0.01,

      projection: 0.02,

      sustain: -0.06,

      warmth: 0.01,

      sensitivity: 0,

      control: 0.08,

    },

  },

  doublePlyStandard: {

    label: 'Standard Double-Ply',

    userFacingLabel: 'Thicker / Stronger',

    plyCount: 2,

    approximateMil: 14,

    description:

      'A standard double-ply head adds durability, lowers some openness, and gives the drum a stronger, more controlled hit.',

    nodeBias: {

      attack: 0.04,

      brightness: -0.02,

      projection: 0.05,

      sustain: -0.05,

      warmth: 0.03,

      sensitivity: -0.06,

      control: 0.07,

    },

  },

  doublePlyControlled: {

    label: 'Controlled Double-Ply',

    userFacingLabel: 'Dry / Punchy',

    plyCount: 2,

    approximateMil: 14,

    description:

      'A controlled double-ply head gives a shorter, punchier, more pre-shaped sound with less ring and less touch openness.',

    nodeBias: {

      attack: 0.05,

      brightness: -0.04,

      projection: 0.04,

      sustain: -0.1,

      warmth: 0.02,

      sensitivity: -0.09,

      control: 0.12,

    },

  },

  hydraulic: {

    label: 'Hydraulic / Oil-Filled',

    userFacingLabel: 'Very Controlled / Short',

    plyCount: 2,

    approximateMil: 14,

    description:

      'Hydraulic heads create a short, thick, very controlled tone with reduced sustain, reduced sensitivity, and a strong damped feel.',

    nodeBias: {

      attack: 0.01,

      brightness: -0.08,

      projection: -0.02,

      sustain: -0.16,

      warmth: 0.04,

      sensitivity: -0.12,

      control: 0.16,

    },

  },

};

export const SNARE_SIDE_HEAD_TYPES = {

  thin2mil: {

    label: 'Thin Snare-Side',

    approximateMil: 2,

    description:

      'A thin snare-side head increases sensitivity and snare response, especially at softer dynamics.',

    nodeBias: {

      attack: 0.02,

      brightness: 0.04,

      projection: 0,

      sustain: 0.02,

      warmth: -0.02,

      sensitivity: 0.09,

      control: -0.03,

    },

  },

  standard3mil: {

    label: 'Standard Snare-Side',

    approximateMil: 3,

    description:

      'A standard 3mil snare-side head is the reference point for most snare drums.',

    nodeBias: {

      attack: 0.01,

      brightness: 0.02,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0.04,

      control: 0,

    },

  },

  thick5mil: {

    label: 'Thick Snare-Side',

    approximateMil: 5,

    description:

      'A thicker snare-side head adds durability and control but usually reduces fine sensitivity and crisp snare response.',

    nodeBias: {

      attack: -0.01,

      brightness: -0.03,

      projection: 0.02,

      sustain: -0.02,

      warmth: 0.02,

      sensitivity: -0.07,

      control: 0.07,

    },

  },

};

export const DRUMHEAD_MODEL_CATALOG = {

  remoAmbassadorCoated: {

    brand: 'Remo',

    model: 'Coated Ambassador',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyStandard',

    commonUse: ['snareBatter', 'tomBatter'],

    userFacingCategory: 'Coated Balanced',

  },

  remoAmbassadorClear: {

    brand: 'Remo',

    model: 'Clear Ambassador',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyStandard',

    commonUse: ['tomBatter', 'tomResonant'],

    userFacingCategory: 'Clear Balanced',

  },

  remoEmperorCoated: {

    brand: 'Remo',

    model: 'Coated Emperor',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyStandard',

    commonUse: ['snareBatter', 'tomBatter'],

    userFacingCategory: 'Coated Thick',

  },

  remoEmperorClear: {

    brand: 'Remo',

    model: 'Clear Emperor',

    surfaceKey: 'clear',

    constructionKey: 'doublePlyStandard',

    commonUse: ['tomBatter'],

    userFacingCategory: 'Clear Thick',

  },

  remoControlledSoundCoated: {

    brand: 'Remo',

    model: 'Controlled Sound Coated Reverse Dot',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyControlled',

    commonUse: ['snareBatter'],

    userFacingCategory: 'Coated Focused',

  },

  remoPowerstroke3Clear: {

    brand: 'Remo',

    model: 'Powerstroke 3 Clear',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyControlled',

    commonUse: ['bassBatter', 'bassResonant', 'tomBatter'],

    userFacingCategory: 'Clear Controlled',

  },

  remoFiberskynAmbassador: {

    brand: 'Remo',

    model: 'Fiberskyn Ambassador',

    surfaceKey: 'fiberskyn',

    constructionKey: 'singlePlyStandard',

    commonUse: ['snareBatter', 'tomBatter', 'bassResonant'],

    userFacingCategory: 'Vintage Warm',

  },

  evansG1Coated: {

    brand: 'Evans',

    model: 'G1 Coated',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyStandard',

    commonUse: ['snareBatter', 'tomBatter'],

    userFacingCategory: 'Coated Balanced',

  },

  evansG1Clear: {

    brand: 'Evans',

    model: 'G1 Clear',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyStandard',

    commonUse: ['tomBatter', 'tomResonant'],

    userFacingCategory: 'Clear Balanced',

  },

  evansG2Coated: {

    brand: 'Evans',

    model: 'G2 Coated',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyStandard',

    commonUse: ['snareBatter', 'tomBatter'],

    userFacingCategory: 'Coated Thick',

  },

  evansG2Clear: {

    brand: 'Evans',

    model: 'G2 Clear',

    surfaceKey: 'clear',

    constructionKey: 'doublePlyStandard',

    commonUse: ['tomBatter'],

    userFacingCategory: 'Clear Thick',

  },

  evansHdDry: {

    brand: 'Evans',

    model: 'HD Dry',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyControlled',

    commonUse: ['snareBatter'],

    userFacingCategory: 'Coated Dry',

  },

  evansHydraulicClear: {

    brand: 'Evans',

    model: 'Hydraulic Clear',

    surfaceKey: 'clear',

    constructionKey: 'hydraulic',

    commonUse: ['tomBatter'],

    userFacingCategory: 'Clear Hydraulic',

  },

  aquarianTextureCoated: {

    brand: 'Aquarian',

    model: 'Texture Coated',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyStandard',

    commonUse: ['snareBatter', 'tomBatter'],

    userFacingCategory: 'Coated Balanced',

  },

  aquarianResponse2Clear: {

    brand: 'Aquarian',

    model: 'Response 2 Clear',

    surfaceKey: 'clear',

    constructionKey: 'doublePlyStandard',

    commonUse: ['tomBatter'],

    userFacingCategory: 'Clear Thick',

  },

  aquarianHiEnergy: {

    brand: 'Aquarian',

    model: 'Hi-Energy',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyControlled',

    commonUse: ['snareBatter'],

    userFacingCategory: 'Coated Dry',

  },

  remoAmbassadorSnareSide: {

    brand: 'Remo',

    model: 'Ambassador Snare Side',

    surfaceKey: 'clear',

    constructionKey: 'standard3mil',

    snareSideKey: 'standard3mil',

    commonUse: ['snareResonant'],

    userFacingCategory: 'Standard Snare-Side',

  },

  evansHazy300: {

    brand: 'Evans',

    model: 'Hazy 300',

    surfaceKey: 'clear',

    constructionKey: 'standard3mil',

    snareSideKey: 'standard3mil',

    commonUse: ['snareResonant'],

    userFacingCategory: 'Standard Snare-Side',

  },

  aquarianClassicClearSnareSide: {

    brand: 'Aquarian',

    model: 'Classic Clear Snare Side',

    surfaceKey: 'clear',

    constructionKey: 'standard3mil',

    snareSideKey: 'standard3mil',

    commonUse: ['snareResonant'],

    userFacingCategory: 'Standard Snare-Side',

  },

};

export const USER_FACING_DRUMHEAD_CATEGORIES = {

  clearThin: {

    label: 'Clear Thin / Open',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyThin',

    description:

      'Bright, open, sensitive, and resonant. Good when you want the shell to speak freely.',

  },

  clearBalanced: {

    label: 'Clear Balanced',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyStandard',

    description:

      'Clear, open, and balanced. A strong all-around choice for toms and resonant heads.',

  },

  clearThick: {

    label: 'Clear Thick',

    surfaceKey: 'clear',

    constructionKey: 'doublePlyStandard',

    description:

      'Stronger, punchier, and more durable than a standard single-ply clear head.',

  },

  clearControlled: {

    label: 'Clear Controlled',

    surfaceKey: 'clear',

    constructionKey: 'singlePlyControlled',

    description:

      'Clear attack with added damping and shorter sustain.',

  },

  clearHydraulic: {

    label: 'Clear Hydraulic',

    surfaceKey: 'clear',

    constructionKey: 'hydraulic',

    description:

      'Very short, thick, controlled, and damped. Best when you want minimal ring.',

  },

  coatedBalanced: {

    label: 'Coated Balanced',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyStandard',

    description:

      'Warm, familiar, responsive, and versatile. A common snare batter reference.',

  },

  coatedThick: {

    label: 'Coated Thick',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyStandard',

    description:

      'Warmer, stronger, and more controlled than a standard coated single-ply.',

  },

  coatedFocused: {

    label: 'Coated Focused',

    surfaceKey: 'coated',

    constructionKey: 'singlePlyControlled',

    description:

      'Keeps coated-head warmth while adding more focus, attack shape, and control.',

  },

  coatedDry: {

    label: 'Coated Dry',

    surfaceKey: 'coated',

    constructionKey: 'doublePlyControlled',

    description:

      'Shorter, drier, punchier, and easier to place in a mix.',

  },

  vintageWarm: {

    label: 'Vintage Warm',

    surfaceKey: 'fiberskyn',

    constructionKey: 'singlePlyStandard',

    description:

      'Rounder, warmer, darker, and more vintage-leaning.',

  },

};

const normalizeText = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase();

function sumNodeBias(...biasObjects) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = biasObjects.reduce((sum, bias) => {

      return sum + Number(bias?.[nodeKey] || 0);

    }, 0);

    return acc;

  }, {});

}

export function getDrumheadModelKey(value = '') {

  const normalized = normalizeText(value);

  if (!normalized) return null;

  const exactMatch = Object.entries(DRUMHEAD_MODEL_CATALOG).find(

    ([key, model]) => {

      const fullName = `${model.brand} ${model.model}`;

      return (

        normalizeText(key) === normalized ||

        normalizeText(model.model) === normalized ||

        normalizeText(fullName) === normalized

      );

    }

  );

  return exactMatch?.[0] || null;

}

export function getUserFacingDrumheadCategoryKey(value = '') {

  const normalized = normalizeText(value);

  if (!normalized) return null;

  const exactMatch = Object.entries(USER_FACING_DRUMHEAD_CATEGORIES).find(

    ([key, category]) => {

      return (

        normalizeText(key) === normalized ||

        normalizeText(category.label) === normalized

      );

    }

  );

  if (exactMatch) return exactMatch[0];

  if (normalized.includes('hydraulic') || normalized.includes('oil')) {

    return 'clearHydraulic';

  }

  if (normalized.includes('vintage') || normalized.includes('fiberskyn')) {

    return 'vintageWarm';

  }

  if (normalized.includes('dry')) {

    return normalized.includes('clear') ? 'clearControlled' : 'coatedDry';

  }

  if (normalized.includes('controlled') || normalized.includes('focus')) {

    return normalized.includes('clear') ? 'clearControlled' : 'coatedFocused';

  }

  if (normalized.includes('thick') || normalized.includes('2 ply')) {

    return normalized.includes('clear') ? 'clearThick' : 'coatedThick';

  }

  if (normalized.includes('thin')) {

    return 'clearThin';

  }

  if (normalized.includes('clear')) {

    return 'clearBalanced';

  }

  if (normalized.includes('coated')) {

    return 'coatedBalanced';

  }

  return null;

}

export function getDrumheadProfile(value = 'coatedBalanced') {

  const modelKey = getDrumheadModelKey(value);

  if (modelKey) {

    const model = DRUMHEAD_MODEL_CATALOG[modelKey];

    if (model.snareSideKey) {

      const snareSide = SNARE_SIDE_HEAD_TYPES[model.snareSideKey];

      return {

        key: modelKey,

        sourceType: 'model',

        ...model,

        surfaceProfile: DRUMHEAD_SURFACE_TYPES[model.surfaceKey] || null,

        constructionProfile: snareSide || null,

        nodeBias: sumNodeBias(

          DRUMHEAD_SURFACE_TYPES[model.surfaceKey]?.nodeBias,

          snareSide?.nodeBias

        ),

      };

    }

    const surfaceProfile = DRUMHEAD_SURFACE_TYPES[model.surfaceKey];

    const constructionProfile =

      DRUMHEAD_CONSTRUCTION_TYPES[model.constructionKey];

    return {

      key: modelKey,

      sourceType: 'model',

      ...model,

      surfaceProfile,

      constructionProfile,

      nodeBias: sumNodeBias(

        surfaceProfile?.nodeBias,

        constructionProfile?.nodeBias

      ),

    };

  }

  const categoryKey =

    getUserFacingDrumheadCategoryKey(value) || 'coatedBalanced';

  const category = USER_FACING_DRUMHEAD_CATEGORIES[categoryKey];

  const surfaceProfile = DRUMHEAD_SURFACE_TYPES[category.surfaceKey];

  const constructionProfile =

    DRUMHEAD_CONSTRUCTION_TYPES[category.constructionKey];

  return {

    key: categoryKey,

    sourceType: 'category',

    ...category,

    surfaceProfile,

    constructionProfile,

    nodeBias: sumNodeBias(

      surfaceProfile?.nodeBias,

      constructionProfile?.nodeBias

    ),

  };

}

export function getSnareSideHeadProfile(value = 'standard3mil') {

  const normalized = normalizeText(value);

  if (

    normalized.includes('2mil') ||

    normalized.includes('2 mil') ||

    normalized.includes('thin')

  ) {

    return {

      key: 'thin2mil',

      ...SNARE_SIDE_HEAD_TYPES.thin2mil,

      nodeBias: normalizeDrumheadNodeBias(SNARE_SIDE_HEAD_TYPES.thin2mil),

    };

  }

  if (

    normalized.includes('5mil') ||

    normalized.includes('5 mil') ||

    normalized.includes('thick')

  ) {

    return {

      key: 'thick5mil',

      ...SNARE_SIDE_HEAD_TYPES.thick5mil,

      nodeBias: normalizeDrumheadNodeBias(SNARE_SIDE_HEAD_TYPES.thick5mil),

    };

  }

  return {

    key: 'standard3mil',

    ...SNARE_SIDE_HEAD_TYPES.standard3mil,

    nodeBias: normalizeDrumheadNodeBias(SNARE_SIDE_HEAD_TYPES.standard3mil),

  };

}

export function normalizeDrumheadNodeBias(profile = {}) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(profile?.nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

export function buildDrumheadRead({

  batterHead = 'coatedBalanced',

  resonantHead = null,

  snareSideHead = 'standard3mil',

  drumType = 'snare',

} = {}) {

  const batterProfile = getDrumheadProfile(batterHead);

  const resonantProfile = resonantHead ? getDrumheadProfile(resonantHead) : null;

  const snareSideProfile =

    drumType === 'snare' ? getSnareSideHeadProfile(snareSideHead) : null;

  const nodeBias = sumNodeBias(

    batterProfile?.nodeBias,

    resonantProfile?.nodeBias,

    snareSideProfile?.nodeBias

  );

  return {

    drumType,

    batter: batterProfile,

    resonant: resonantProfile,

    snareSide: snareSideProfile,

    nodeBias,

    summary:

      drumType === 'snare'

        ? `Batter head: ${batterProfile.label || batterProfile.model}. Snare-side: ${

            snareSideProfile.label

          }.`

        : `Batter head: ${batterProfile.label || batterProfile.model}${

            resonantProfile

              ? `. Resonant head: ${resonantProfile.label || resonantProfile.model}.`

              : '.'

          }`,

  };

}

export default DRUMHEAD_MODEL_CATALOG;