// src/data/legacyPrint/reinforcementProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * Reinforcement profiles describe how added shell support changes drum behavior.

 *

 * For now, keep this simple and clear:

 * - none

 * - reRings

 * - integratedHybridSupport

 *

 * Avoid vague categories like “partial reinforcement” until we have a real use case.

 */

export const REINFORCEMENT_PROFILES = {

  none: {

    label: 'None',

    aliases: ['none', 'no', 'no reinforcement', 'unreinforced'],

    description:

      'No added reinforcement. The shell voice is driven mainly by material, construction, thickness, size, edge, heads, hoops, and tuning.',

    bestFor:

      'Open shell response, natural resonance, and a more direct read of the shell material itself.',

    acousticBehavior:

      'Keeps the shell freer to move. Usually preserves openness, sustain, sensitivity, and natural body, but may offer less built-in control depending on thickness and construction.',

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0.03,

      warmth: 0.02,

      sensitivity: 0.03,

      control: -0.02,

    },

  },

  reRings: {

    label: 'Re-Rings',

    aliases: [

      're-rings',

      'rerings',

      're rings',

      'reinforcement rings',

      'reinforcing rings',

      'standard re-rings',

      'standard rerings',

    ],

    description:

      'Reinforcement rings are added near the bearing-edge areas to stabilize the shell and support the roundness of thinner or more flexible shell designs.',

    bestFor:

      'Thin wood shells, steam-bent shells, vintage-style builds, and shells that need added edge-area support without making the whole shell thick.',

    acousticBehavior:

      'Adds structure and edge-area stability. Usually increases control and usable focus while preserving some warmth and shell movement, especially on thinner shells.',

    nodeBias: {

      attack: 0.02,

      brightness: -0.01,

      projection: 0.03,

      sustain: -0.03,

      warmth: 0.03,

      sensitivity: -0.02,

      control: 0.07,

    },

  },

  integratedHybridSupport: {

    label: 'Integrated Hybrid Support',

    aliases: [

      'integrated hybrid support',

      'hybrid support',

      'feuzon support',

      'feuzon hybrid support',

      'stave core support',

      'steam bent exterior support',

    ],

    description:

      'A construction-based support system where the shell structure itself creates reinforcement through layered or hybrid behavior rather than separate re-rings.',

    bestFor:

      'Hybrid shells such as Ober FEUZØN construction, where a voiced stave interior and steam-bent exterior work together as one shell system.',

    acousticBehavior:

      'Adds stability, projection, and organized response while allowing the shell to retain some of the warmth and complexity of its separate construction layers.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.01,

      projection: 0.07,

      sustain: -0.01,

      warmth: 0.03,

      sensitivity: -0.01,

      control: 0.06,

    },

  },

};

export const REINFORCEMENT_CONSTRUCTION_RULES = {

  stave: {

    allowedReinforcements: ['none', 'reRings'],

    defaultReinforcement: 'none',

    notes:

      'Most stave shells do not require re-rings, but thinner stave builds may use them for added support and control.',

  },

  ply: {

    allowedReinforcements: ['none', 'reRings'],

    defaultReinforcement: 'none',

    notes:

      'Ply shells are already structurally stable because of cross-laminated layers. Re-rings usually create a more vintage/stabilized response.',

  },

  steamBent: {

    allowedReinforcements: ['reRings', 'none'],

    defaultReinforcement: 'reRings',

    notes:

      'Steam-bent shells commonly use re-rings because the shell is usually a thin single-ply bent wood form.',

  },

  solid: {

    allowedReinforcements: ['none'],

    defaultReinforcement: 'none',

    notes:

      'Solid carved shells are usually treated as self-supporting. Their reinforcement behavior should come from thickness, density, and carving geometry rather than separate rings.',

  },

  feuzonHybrid: {

    allowedReinforcements: ['integratedHybridSupport', 'none'],

    defaultReinforcement: 'integratedHybridSupport',

    notes:

      'Ober FEUZØN should not be treated like normal re-ring support. Its stave core and steam-bent exterior create a hybrid support system.',

  },

  metal: {

    allowedReinforcements: ['none'],

    defaultReinforcement: 'none',

    notes:

      'Metal shells usually use beads, bends, flanges, or forming geometry for stiffness rather than wood-style re-rings.',

  },

  acrylic: {

    allowedReinforcements: ['none'],

    defaultReinforcement: 'none',

    notes:

      'Acrylic shells are usually scored through material stiffness, thickness, edges, hoops, heads, and tuning rather than separate reinforcement rings.',

  },

  composite: {

    allowedReinforcements: ['none', 'integratedHybridSupport'],

    defaultReinforcement: 'none',

    notes:

      'Composite support depends on the material system. Integrated support may apply when the composite layup itself creates reinforcement zones.',

  },

};

const normalizeText = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase();

export function getReinforcementKey(value, constructionKey = 'stave') {

  const normalized = normalizeText(value);

  if (!normalized) {

    return (

      REINFORCEMENT_CONSTRUCTION_RULES[constructionKey]?.defaultReinforcement ||

      'none'

    );

  }

  const exactMatch = Object.entries(REINFORCEMENT_PROFILES).find(

    ([key, profile]) => {

      return (

        normalizeText(key) === normalized ||

        profile.aliases.some((alias) => normalizeText(alias) === normalized)

      );

    }

  );

  if (exactMatch) return exactMatch[0];

  if (

    normalized.includes('re-ring') ||

    normalized.includes('rering') ||

    normalized.includes('re ring') ||

    normalized.includes('reinforcement ring') ||

    normalized.includes('reinforcing ring')

  ) {

    return 'reRings';

  }

  if (

    normalized.includes('feuzon') ||

    normalized.includes('hybrid') ||

    normalized.includes('stave core') ||

    normalized.includes('steam bent exterior')

  ) {

    return 'integratedHybridSupport';

  }

  if (

    normalized === 'none' ||

    normalized === 'no' ||

    normalized.includes('unreinforced')

  ) {

    return 'none';

  }

  return (

    REINFORCEMENT_CONSTRUCTION_RULES[constructionKey]?.defaultReinforcement ||

    'none'

  );

}

export function getReinforcementProfile(value, constructionKey = 'stave') {

  const key = getReinforcementKey(value, constructionKey);

  return REINFORCEMENT_PROFILES[key] || REINFORCEMENT_PROFILES.none;

}

export function getAllowedReinforcementsForConstruction(

  constructionKey = 'stave'

) {

  const rule =

    REINFORCEMENT_CONSTRUCTION_RULES[constructionKey] ||

    REINFORCEMENT_CONSTRUCTION_RULES.stave;

  return rule.allowedReinforcements.map((key) => ({

    key,

    ...REINFORCEMENT_PROFILES[key],

  }));

}

export function normalizeReinforcementNodeBias(value, constructionKey = 'stave') {

  const profile = getReinforcementProfile(value, constructionKey);

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(profile?.nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

export function buildReinforcementRead({

  reinforcement,

  constructionKey = 'stave',

  shellThicknessMm = null,

} = {}) {

  const reinforcementKey = getReinforcementKey(

    reinforcement,

    constructionKey

  );

  const profile =

    REINFORCEMENT_PROFILES[reinforcementKey] || REINFORCEMENT_PROFILES.none;

  const constructionRule =

    REINFORCEMENT_CONSTRUCTION_RULES[constructionKey] ||

    REINFORCEMENT_CONSTRUCTION_RULES.stave;

  const allowed = constructionRule.allowedReinforcements.includes(

    reinforcementKey

  );

  const thickness = Number(shellThicknessMm);

  const isThinShell = Number.isFinite(thickness) && thickness <= 8;

  const isThickShell = Number.isFinite(thickness) && thickness >= 13;

  let interactionNote = profile.acousticBehavior;

  if (reinforcementKey === 'reRings' && isThinShell) {

    interactionNote =

      'On a thinner shell, re-rings add support and note organization without fully removing the shell’s warmth, bloom, and touch response.';

  }

  if (reinforcementKey === 'reRings' && isThickShell) {

    interactionNote =

      'On a thicker shell, re-rings can push the drum further toward control and focus, but may reduce openness if over-applied.';

  }

  if (

    reinforcementKey === 'integratedHybridSupport' &&

    constructionKey === 'feuzonHybrid'

  ) {

    interactionNote =

      'In FEUZØN construction, the voiced stave core and steam-bent exterior should be scored together as one hybrid support system: stable, projecting, complex, and controlled without behaving like ordinary re-rings.';

  }

  return {

    key: reinforcementKey,

    label: profile.label,

    constructionKey,

    allowed,

    allowedReinforcements: constructionRule.allowedReinforcements,

    description: profile.description,

    bestFor: profile.bestFor,

    acousticBehavior: profile.acousticBehavior,

    interactionNote,

    constructionNotes: constructionRule.notes,

    nodeBias: normalizeReinforcementNodeBias(

      reinforcementKey,

      constructionKey

    ),

  };

}

export default REINFORCEMENT_PROFILES;