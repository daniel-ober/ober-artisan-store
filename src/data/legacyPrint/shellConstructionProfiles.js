// src/data/legacyPrint/shellConstructionProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * Shell construction is one of the biggest parts of the engine.

 *

 * Scale:

 * - Values are centered around 0.

 * - Positive = raises that LegacyPrint node.

 * - Negative = lowers that LegacyPrint node.

 *

 * Important:

 * Construction should shape HOW the material behaves.

 * Material says "what the shell is made of."

 * Construction says "how that material is allowed to speak."

 */

export const SHELL_CONSTRUCTION_PROFILES = {

  stave: {

    label: 'Stave',

    category: 'wood',

    description:

      'Vertical wood blocks joined into a shell. Strong shell identity, clear projection, firm attack, and direct wood character.',

    acousticRole:

      'Stave construction usually emphasizes shell voice, projection, attack definition, and focused body compared with many thinner ply shells.',

    nodeBias: {

      attack: 0.1,

      brightness: 0.02,

      projection: 0.12,

      sustain: 0.02,

      warmth: 0.08,

      sensitivity: 0.02,

      control: 0.06,

    },

    interactionHints: {

      thickness:

        'Thicker stave shells gain attack, projection, and control, while thinner stave shells gain bloom, warmth, and touch response.',

      material:

        'Dense hardwoods can make stave shells more focused and projecting; softer woods can make them warmer and rounder.',

      reinforcement:

        'Re-rings are uncommon in standard stave builds but can support very thin or experimental shells.',

    },

  },

  ply: {

    label: 'Ply',

    category: 'wood',

    description:

      'Multiple thin wood plies laminated together. Familiar, balanced, stable, and predictable with a controlled modern drum response.',

    acousticRole:

      'Ply construction tends to smooth out individual wood character and produce a balanced, consistent response.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.04,

      projection: 0.04,

      sustain: 0.02,

      warmth: 0,

      sensitivity: 0.02,

      control: 0.08,

    },

    interactionHints: {

      thickness:

        'Thin ply shells open up warmth and sustain; thicker ply shells increase control, attack, and projection.',

      material:

        'Material still matters, but ply construction usually moderates the extreme traits of a single wood species.',

      reinforcement:

        'Re-rings on thin ply shells can add support and control while preserving some openness.',

    },

  },

  steamBent: {

    label: 'Steam-Bent',

    category: 'wood',

    description:

      'A single bent board formed into a shell, usually with one scarf joint and often supported by re-rings.',

    acousticRole:

      'Steam-bent shells often feel very shell-forward, open, sensitive, woody, and resonant, with fewer glue layers than ply construction.',

    nodeBias: {

      attack: 0.02,

      brightness: 0.02,

      projection: 0.08,

      sustain: 0.12,

      warmth: 0.12,

      sensitivity: 0.1,

      control: -0.04,

    },

    interactionHints: {

      thickness:

        'Thinner steam-bent shells can become very open and sensitive; re-rings help keep the note organized.',

      material:

        'The wood species comes through strongly because the shell is closer to a continuous single board.',

      reinforcement:

        'Re-rings are a major part of many steam-bent voices and should be treated as a normal support option here.',

    },

  },

  solid: {

    label: 'Solid',

    category: 'wood',

    description:

      'A shell carved or lathed from a single solid piece of wood rather than bent or built from sections.',

    acousticRole:

      'Solid shells can be extremely direct, organic, and wood-forward, with strong identity but high dependency on exact wood, thickness, and build method.',

    nodeBias: {

      attack: 0.06,

      brightness: -0.02,

      projection: 0.1,

      sustain: 0.08,

      warmth: 0.16,

      sensitivity: 0.04,

      control: 0.02,

    },

    interactionHints: {

      thickness:

        'Solid shells need exact thickness modeling because small changes can strongly alter body, sustain, and control.',

      material:

        'Material is highly exposed in solid shell construction and should carry more weight than in ply construction.',

      reinforcement:

        'Reinforcement is less standardized and should be modeled only when explicitly part of the build.',

    },

  },

  feuzonHybrid: {

    label: 'FEUZØN Hybrid',

    category: 'ober',

    description:

      'Ober Artisan construction using a voiced stave interior core with a steam-bent exterior shell layer.',

    acousticRole:

      'FEUZØN combines the direct, structured voice of a stave interior with the wrap, smoothness, and resonance of a steam-bent exterior.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.02,

      projection: 0.14,

      sustain: 0.08,

      warmth: 0.12,

      sensitivity: 0.06,

      control: 0.08,

    },

    interactionHints: {

      thickness:

        'The inner stave core sets much of the attack, projection, and center. The outer steam-bent layer adds body, resonance, and surface continuity.',

      material:

        'Both core wood and exterior wood should be modeled separately, then blended through FEUZØN-specific weighting.',

      reinforcement:

        'This is not normal re-ring logic. The hybrid structure itself is the support system.',

    },

    hybridModel: {

      coreWeight: 0.62,

      exteriorWeight: 0.38,

      coreRole:

        'Primary voice source for attack, projection, center, shell identity, and structural response.',

      exteriorRole:

        'Secondary voice source for warmth, sustain, smoothing, surface response, and visual/tactile character.',

    },

  },

  genericHybrid: {

    label: 'Hybrid',

    category: 'mixed',

    description:

      'A mixed construction shell using more than one structural approach or material system.',

    acousticRole:

      'Hybrid shells must be modeled by their actual layers. Generic hybrid is only a fallback when the exact construction is unknown.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.02,

      projection: 0.08,

      sustain: 0.04,

      warmth: 0.06,

      sensitivity: 0.02,

      control: 0.06,

    },

    interactionHints: {

      thickness:

        'Hybrid thickness should be separated by layer whenever possible instead of treated as one total number.',

      material:

        'Each material layer should contribute based on its position and role.',

      reinforcement:

        'Support behavior depends on the construction system and should not be guessed.',

    },

  },

  metalShell: {

    label: 'Metal Shell',

    category: 'metal',

    description:

      'A formed metal drum shell such as brass, steel, aluminum, copper, or bronze.',

    acousticRole:

      'Metal shells usually increase projection, brightness, sensitivity, and overtone complexity, but behavior changes heavily by metal type.',

    nodeBias: {

      attack: 0.1,

      brightness: 0.14,

      projection: 0.16,

      sustain: 0.08,

      warmth: -0.02,

      sensitivity: 0.06,

      control: -0.02,

    },

    interactionHints: {

      thickness:

        'Metal shell gauge matters. Thicker metal generally increases control and focus; thinner metal can feel more lively and open.',

      material:

        'The metal type is critical: aluminum, brass, steel, copper, and bronze should not read the same.',

      reinforcement:

        'Beads, flanges, and shell forming details may act like reinforcement and should eventually be modeled.',

    },

  },

  acrylicShell: {

    label: 'Acrylic Shell',

    category: 'synthetic',

    description:

      'A synthetic acrylic shell with a hard, consistent, visually transparent or colored body.',

    acousticRole:

      'Acrylic shells tend to feel fast, bright, punchy, projecting, and consistent, with less woody warmth.',

    nodeBias: {

      attack: 0.14,

      brightness: 0.14,

      projection: 0.16,

      sustain: 0.02,

      warmth: -0.1,

      sensitivity: -0.02,

      control: 0.06,

    },

    interactionHints: {

      thickness:

        'Acrylic thickness should be range-based because exact wall thickness varies by manufacturer and shell type.',

      material:

        'Acrylic material behavior is more consistent than wood but still affected by shell thickness, bearing edges, and hoops.',

      reinforcement:

        'Reinforcement is usually not treated like wood re-rings.',

    },

  },

  compositeOther: {

    label: 'Composite / Other',

    category: 'composite',

    description:

      'Carbon, fiberglass, resin, or other engineered shell systems.',

    acousticRole:

      'Composite shells need exact system modeling. Generic composite should only be used as a conservative fallback.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.06,

      projection: 0.1,

      sustain: -0.02,

      warmth: -0.04,

      sensitivity: 0,

      control: 0.12,

    },

    interactionHints: {

      thickness:

        'Composite thickness alone does not tell the full story because layup, resin, fiber direction, and stiffness matter.',

      material:

        'The exact composite system should eventually have its own profile.',

      reinforcement:

        'Reinforcement is usually structural to the composite design, not an added drum-building feature.',

    },

  },

};

export function getShellConstructionProfile(constructionKey) {

  return SHELL_CONSTRUCTION_PROFILES[constructionKey] || null;

}

export function normalizeConstructionNodeBias(constructionKey) {

  const profile = getShellConstructionProfile(constructionKey);

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(profile?.nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

export default SHELL_CONSTRUCTION_PROFILES;