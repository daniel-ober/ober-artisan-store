// src/data/legacyPrint/shellMaterialProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * Shell material profiles describe the acoustic tendency of the shell material itself.

 *

 * These are NOT final drum scores.

 *

 * Final LegacyPrint scoring should later combine:

 * - drum type

 * - diameter

 * - depth

 * - shell construction

 * - shell material

 * - shell thickness

 * - reinforcement

 * - bearing edge

 * - hoops

 * - heads

 * - tuning

 * - snare wires / hardware where relevant

 *

 * Scale:

 * nodeBias values are intentionally small.

 * They represent material tendency before size/construction/thickness/head/tuning interactions.

 */

export const SHELL_MATERIAL_FAMILIES = {

  wood: {

    label: 'Wood',

    description:

      'Organic shell materials with strong variation by species, density, hardness, grain structure, and construction method.',

  },

  metal: {

    label: 'Metal',

    description:

      'Highly reflective shell materials with strong projection, attack, brightness, and overtone behavior depending on alloy and thickness.',

  },

  acrylic: {

    label: 'Acrylic',

    description:

      'Synthetic transparent or opaque shells known for fast attack, brightness, projection, and a more modern response.',

  },

  composite: {

    label: 'Composite / Other',

    description:

      'Carbon, fiberglass, resin, ceramic, or experimental shell materials with non-traditional stiffness, projection, and control behavior.',

  },

};

export const SHELL_MATERIAL_PROFILES = {

  // ---------------------------------------------------------------------------

  // WOODS

  // ---------------------------------------------------------------------------

  oak: {

    family: 'wood',

    label: 'Oak',

    aliases: ['red oak', 'white oak', 'northern red oak'],

    densityClass: 'medium-high',

    hardnessClass: 'hard',

    generalCharacter:

      'Strong, woody, articulate, and grounded with good projection and a balanced mix of warmth and attack.',

    nodeBias: {

      attack: 0.05,

      brightness: 0.03,

      projection: 0.07,

      sustain: 0.01,

      warmth: 0.06,

      sensitivity: 0.01,

      control: 0.03,

    },

    notes:

      'Oak is a strong Ober reference material because it can feel warm and organic without becoming overly soft or muted.',

  },

  maple: {

    family: 'wood',

    label: 'Maple',

    aliases: ['hard maple', 'rock maple', 'sugar maple'],

    densityClass: 'medium',

    hardnessClass: 'medium-hard',

    generalCharacter:

      'Balanced, warm, familiar, and full-bodied with a smooth attack and broad tuning range.',

    nodeBias: {

      attack: 0.02,

      brightness: 0.01,

      projection: 0.03,

      sustain: 0.04,

      warmth: 0.07,

      sensitivity: 0.03,

      control: 0.01,

    },

    notes:

      'Maple should usually read as the broad modern wood-shell center: warm, balanced, and versatile.',

  },

  birch: {

    family: 'wood',

    label: 'Birch',

    aliases: ['scandinavian birch', 'baltic birch'],

    densityClass: 'medium',

    hardnessClass: 'medium',

    generalCharacter:

      'Focused, punchy, clear, and slightly brighter with strong attack and controlled low-end behavior.',

    nodeBias: {

      attack: 0.07,

      brightness: 0.06,

      projection: 0.06,

      sustain: -0.02,

      warmth: -0.02,

      sensitivity: 0,

      control: 0.05,

    },

    notes:

      'Birch should lean toward studio focus, clarity, and quicker note shape.',

  },

  mahogany: {

    family: 'wood',

    label: 'Mahogany',

    aliases: ['african mahogany', 'honduran mahogany', 'khaya'],

    densityClass: 'medium-low',

    hardnessClass: 'medium-soft',

    generalCharacter:

      'Warm, dark, round, and low-mid rich with softer attack and a more vintage body.',

    nodeBias: {

      attack: -0.04,

      brightness: -0.07,

      projection: -0.01,

      sustain: 0.04,

      warmth: 0.11,

      sensitivity: 0.03,

      control: -0.02,

    },

    notes:

      'Mahogany should push the read toward darker warmth, body, and a softer front edge.',

  },

  walnut: {

    family: 'wood',

    label: 'Walnut',

    aliases: ['black walnut', 'american walnut'],

    densityClass: 'medium',

    hardnessClass: 'medium',

    generalCharacter:

      'Dark, controlled, warm, and articulate with a refined attack and less shiny top-end.',

    nodeBias: {

      attack: 0.02,

      brightness: -0.04,

      projection: 0.02,

      sustain: 0.01,

      warmth: 0.08,

      sensitivity: 0.02,

      control: 0.06,

    },

    notes:

      'Walnut should feel darker and more controlled than maple, but not as soft or low-mid heavy as mahogany.',

  },

  cherry: {

    family: 'wood',

    label: 'Cherry',

    aliases: ['american cherry', 'black cherry'],

    densityClass: 'medium',

    hardnessClass: 'medium',

    generalCharacter:

      'Warm, smooth, slightly dry, and articulate with a balanced midrange and controlled bloom.',

    nodeBias: {

      attack: 0.02,

      brightness: -0.01,

      projection: 0.02,

      sustain: 0.01,

      warmth: 0.06,

      sensitivity: 0.03,

      control: 0.04,

    },

    notes:

      'Cherry should sit between maple and walnut: warm and smooth with a little extra dryness/control.',

  },

  beech: {

    family: 'wood',

    label: 'Beech',

    aliases: ['european beech'],

    densityClass: 'medium-high',

    hardnessClass: 'medium-hard',

    generalCharacter:

      'Strong, punchy, warm, and focused with good projection and a firm midrange voice.',

    nodeBias: {

      attack: 0.05,

      brightness: 0.02,

      projection: 0.06,

      sustain: 0.01,

      warmth: 0.05,

      sensitivity: 0,

      control: 0.05,

    },

    notes:

      'Beech should read as firm and punchy while keeping more warmth than birch.',

  },

  ash: {

    family: 'wood',

    label: 'Ash',

    aliases: ['white ash', 'swamp ash'],

    densityClass: 'medium',

    hardnessClass: 'medium-hard',

    generalCharacter:

      'Open, bright, lively, and resonant with a clear top edge and strong shell character.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.06,

      projection: 0.04,

      sustain: 0.05,

      warmth: 0.02,

      sensitivity: 0.04,

      control: -0.02,

    },

    notes:

      'Ash should feel more open and lively, with good clarity and a less controlled shell response.',

  },

  poplar: {

    family: 'wood',

    label: 'Poplar',

    aliases: ['yellow poplar'],

    densityClass: 'low-medium',

    hardnessClass: 'soft-medium',

    generalCharacter:

      'Soft, warm, dry, and rounded with less projection and a more vintage, controlled voice.',

    nodeBias: {

      attack: -0.03,

      brightness: -0.05,

      projection: -0.04,

      sustain: -0.01,

      warmth: 0.06,

      sensitivity: 0.02,

      control: 0.03,

    },

    notes:

      'Poplar should usually reduce sharpness and projection while adding a softer vintage warmth.',

  },

  bubinga: {

    family: 'wood',

    label: 'Bubinga',

    aliases: ['african rosewood'],

    densityClass: 'high',

    hardnessClass: 'very-hard',

    generalCharacter:

      'Dense, powerful, low-mid rich, focused, and projecting with strong attack and deep body.',

    nodeBias: {

      attack: 0.07,

      brightness: 0.02,

      projection: 0.1,

      sustain: 0.02,

      warmth: 0.08,

      sensitivity: -0.03,

      control: 0.06,

    },

    notes:

      'Bubinga should feel powerful and dense: big body, strong throw, and a focused note center.',

  },

  padauk: {

    family: 'wood',

    label: 'Padauk',

    aliases: ['african padauk'],

    densityClass: 'high',

    hardnessClass: 'hard',

    generalCharacter:

      'Bright, articulate, lively, and projecting with a clear attack and colorful upper-mid voice.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.08,

      projection: 0.07,

      sustain: 0.03,

      warmth: 0.01,

      sensitivity: 0.02,

      control: 0.01,

    },

    notes:

      'Padauk should push brightness and attack without becoming as metallic or controlled as metal shells.',

  },

  purpleheart: {

    family: 'wood',

    label: 'Purpleheart',

    aliases: ['purple heart'],

    densityClass: 'very-high',

    hardnessClass: 'very-hard',

    generalCharacter:

      'Very dense, loud, bright, focused, and cutting with strong projection and firm control.',

    nodeBias: {

      attack: 0.09,

      brightness: 0.08,

      projection: 0.11,

      sustain: 0,

      warmth: -0.01,

      sensitivity: -0.04,

      control: 0.08,

    },

    notes:

      'Purpleheart should read as dense, cutting, and powerful with reduced touch softness.',

  },

  wenge: {

    family: 'wood',

    label: 'Wenge',

    aliases: [],

    densityClass: 'high',

    hardnessClass: 'hard',

    generalCharacter:

      'Dark, dry, articulate, and focused with strong low-mid character and a controlled top end.',

    nodeBias: {

      attack: 0.05,

      brightness: -0.03,

      projection: 0.06,

      sustain: -0.02,

      warmth: 0.08,

      sensitivity: -0.01,

      control: 0.08,

    },

    notes:

      'Wenge should feel dark but not soft — more controlled, dry, and defined.',

  },

  sapele: {

    family: 'wood',

    label: 'Sapele',

    aliases: [],

    densityClass: 'medium-high',

    hardnessClass: 'medium-hard',

    generalCharacter:

      'Warm, balanced, slightly bright, and articulate with good projection and midrange clarity.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.03,

      projection: 0.05,

      sustain: 0.02,

      warmth: 0.05,

      sensitivity: 0.02,

      control: 0.03,

    },

    notes:

      'Sapele can sit near mahogany/maple territory but with a little more articulation and brightness.',

  },

  jatoba: {

    family: 'wood',

    label: 'Jatoba',

    aliases: ['brazilian cherry'],

    densityClass: 'very-high',

    hardnessClass: 'very-hard',

    generalCharacter:

      'Hard, dense, loud, bright, and focused with strong attack and projection.',

    nodeBias: {

      attack: 0.09,

      brightness: 0.07,

      projection: 0.1,

      sustain: 0,

      warmth: 0.01,

      sensitivity: -0.04,

      control: 0.07,

    },

    notes:

      'Jatoba should behave like a dense, high-energy hardwood: strong front edge, projection, and control.',

  },

  koa: {

    family: 'wood',

    label: 'Koa',

    aliases: ['hawaiian koa'],

    densityClass: 'medium',

    hardnessClass: 'medium-hard',

    generalCharacter:

      'Warm, clear, complex, and slightly bright with a musical midrange and responsive feel.',

    nodeBias: {

      attack: 0.03,

      brightness: 0.03,

      projection: 0.03,

      sustain: 0.04,

      warmth: 0.06,

      sensitivity: 0.04,

      control: 0.01,

    },

    notes:

      'Koa should read as musical and complex: warm but clear, with good sensitivity.',

  },

  cedar: {

    family: 'wood',

    label: 'Cedar',

    aliases: ['western red cedar'],

    densityClass: 'low',

    hardnessClass: 'soft',

    generalCharacter:

      'Soft, warm, open, and responsive with less attack density and less projection.',

    nodeBias: {

      attack: -0.06,

      brightness: -0.03,

      projection: -0.05,

      sustain: 0.05,

      warmth: 0.08,

      sensitivity: 0.07,

      control: -0.04,

    },

    notes:

      'Cedar should feel soft, responsive, and warm, but less forceful and less controlled.',

  },

  spruce: {

    family: 'wood',

    label: 'Spruce',

    aliases: ['sitka spruce', 'engelmann spruce'],

    densityClass: 'low',

    hardnessClass: 'soft',

    generalCharacter:

      'Light, open, responsive, and resonant with quick sensitivity and less dense attack.',

    nodeBias: {

      attack: -0.02,

      brightness: 0.02,

      projection: -0.02,

      sustain: 0.07,

      warmth: 0.04,

      sensitivity: 0.08,

      control: -0.05,

    },

    notes:

      'Spruce should emphasize resonance and sensitivity more than force or control.',

  },

  zebrawood: {

    family: 'wood',

    label: 'Zebrawood',

    aliases: ['zebrano'],

    densityClass: 'medium-high',

    hardnessClass: 'hard',

    generalCharacter:

      'Bright, punchy, lively, and visually bold with good projection and upper-mid presence.',

    nodeBias: {

      attack: 0.06,

      brightness: 0.06,

      projection: 0.06,

      sustain: 0.02,

      warmth: 0.02,

      sensitivity: 0.01,

      control: 0.02,

    },

    notes:

      'Zebrawood should sit on the brighter, punchier side of exotic hardwoods.',

  },

  rosewood: {

    family: 'wood',

    label: 'Rosewood',

    aliases: ['indian rosewood', 'east indian rosewood'],

    densityClass: 'high',

    hardnessClass: 'hard',

    generalCharacter:

      'Rich, complex, warm, sustaining, and articulate with strong harmonic content.',

    nodeBias: {

      attack: 0.04,

      brightness: 0.03,

      projection: 0.06,

      sustain: 0.07,

      warmth: 0.09,

      sensitivity: 0.03,

      control: 0.02,

    },

    notes:

      'Rosewood should feel complex and rich, with strong body and sustain rather than a dry controlled voice.',

  },

  ebony: {

    family: 'wood',

    label: 'Ebony',

    aliases: ['gaboon ebony', 'macassar ebony'],

    densityClass: 'very-high',

    hardnessClass: 'very-hard',

    generalCharacter:

      'Extremely dense, bright, articulate, focused, and projecting with a sharp attack.',

    nodeBias: {

      attack: 0.1,

      brightness: 0.09,

      projection: 0.1,

      sustain: -0.01,

      warmth: -0.02,

      sensitivity: -0.05,

      control: 0.09,

    },

    notes:

      'Ebony should read as very dense and articulate, with less warmth and less touch softness.',

  },

  // ---------------------------------------------------------------------------

  // METALS

  // ---------------------------------------------------------------------------

  brass: {

    family: 'metal',

    label: 'Brass',

    aliases: ['yellow brass'],

    densityClass: 'metal-medium',

    hardnessClass: 'metal-medium',

    generalCharacter:

      'Bright, warm, ringing, powerful, and classic with strong projection and musical overtones.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.09,

      projection: 0.1,

      sustain: 0.07,

      warmth: 0.04,

      sensitivity: 0.02,

      control: -0.02,

    },

    notes:

      'Brass should be bright and projecting while still retaining more warmth than steel.',

  },

  steel: {

    family: 'metal',

    label: 'Steel',

    aliases: ['chrome over steel', 'stainless steel'],

    densityClass: 'metal-medium',

    hardnessClass: 'metal-hard',

    generalCharacter:

      'Bright, cutting, crisp, loud, and controlled with strong attack and high projection.',

    nodeBias: {

      attack: 0.1,

      brightness: 0.11,

      projection: 0.11,

      sustain: 0.03,

      warmth: -0.05,

      sensitivity: 0,

      control: 0.04,

    },

    notes:

      'Steel should read as crisp, bright, cutting, and less warm than brass or bronze.',

  },

  aluminum: {

    family: 'metal',

    label: 'Aluminum',

    aliases: ['seamless aluminum'],

    densityClass: 'metal-light',

    hardnessClass: 'metal-soft-medium',

    generalCharacter:

      'Dry, crisp, articulate, controlled, and slightly darker than steel with a quick response.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.04,

      projection: 0.05,

      sustain: -0.04,

      warmth: 0.01,

      sensitivity: 0.03,

      control: 0.09,

    },

    notes:

      'Aluminum should emphasize dry articulation and control rather than long metallic ring.',

  },

  copper: {

    family: 'metal',

    label: 'Copper',

    aliases: [],

    densityClass: 'metal-medium-heavy',

    hardnessClass: 'metal-soft',

    generalCharacter:

      'Dark, warm, complex, and rich with softer attack and strong body.',

    nodeBias: {

      attack: 0.03,

      brightness: -0.03,

      projection: 0.05,

      sustain: 0.05,

      warmth: 0.09,

      sensitivity: 0.03,

      control: 0.01,

    },

    notes:

      'Copper should be one of the warmer, darker metal-shell references.',

  },

  bronze: {

    family: 'metal',

    label: 'Bronze',

    aliases: ['bell bronze', 'cast bronze'],

    densityClass: 'metal-heavy',

    hardnessClass: 'metal-hard',

    generalCharacter:

      'Powerful, complex, warm, bright, and sustaining with huge projection and dense overtones.',

    nodeBias: {

      attack: 0.09,

      brightness: 0.07,

      projection: 0.12,

      sustain: 0.08,

      warmth: 0.06,

      sensitivity: -0.02,

      control: 0.02,

    },

    notes:

      'Bronze should read as powerful and complex, with both warmth and projection.',

  },

  titanium: {

    family: 'metal',

    label: 'Titanium',

    aliases: [],

    densityClass: 'metal-light-medium',

    hardnessClass: 'metal-hard',

    generalCharacter:

      'Dry, articulate, strong, and modern with focused projection and controlled sustain.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.05,

      projection: 0.08,

      sustain: -0.02,

      warmth: -0.01,

      sensitivity: 0.01,

      control: 0.08,

    },

    notes:

      'Titanium should sit between aluminum dryness and steel strength: modern, focused, and articulate.',

  },

  // ---------------------------------------------------------------------------

  // ACRYLIC / SYNTHETIC / COMPOSITE

  // ---------------------------------------------------------------------------

  acrylic: {

    family: 'acrylic',

    label: 'Acrylic',

    aliases: ['clear acrylic', 'colored acrylic'],

    densityClass: 'synthetic-medium',

    hardnessClass: 'synthetic-hard',

    generalCharacter:

      'Fast, bright, punchy, loud, and modern with strong attack and projection.',

    nodeBias: {

      attack: 0.09,

      brightness: 0.08,

      projection: 0.09,

      sustain: 0.02,

      warmth: -0.04,

      sensitivity: -0.01,

      control: 0.03,

    },

    notes:

      'Acrylic should feel immediate, bright, and projecting, usually less woody and less warm than wood shells.',

  },

  carbonFiber: {

    family: 'composite',

    label: 'Carbon Fiber',

    aliases: ['carbon', 'carbon composite'],

    densityClass: 'composite-light-stiff',

    hardnessClass: 'very-stiff',

    generalCharacter:

      'Extremely focused, fast, projecting, and controlled with a modern, non-wood response.',

    nodeBias: {

      attack: 0.1,

      brightness: 0.07,

      projection: 0.11,

      sustain: -0.03,

      warmth: -0.07,

      sensitivity: -0.02,

      control: 0.11,

    },

    notes:

      'Carbon fiber should read as stiff, fast, and controlled, with less organic warmth.',

  },

  fiberglass: {

    family: 'composite',

    label: 'Fiberglass',

    aliases: ['glass fiber'],

    densityClass: 'composite-medium',

    hardnessClass: 'stiff',

    generalCharacter:

      'Bright, projecting, punchy, and controlled with a slightly synthetic edge.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.07,

      projection: 0.09,

      sustain: 0,

      warmth: -0.05,

      sensitivity: -0.02,

      control: 0.07,

    },

    notes:

      'Fiberglass should sit near acrylic/carbon territory but slightly less extreme than carbon fiber.',

  },

  resinComposite: {

    family: 'composite',

    label: 'Resin Composite',

    aliases: ['resin', 'epoxy composite'],

    densityClass: 'composite-variable',

    hardnessClass: 'variable',

    generalCharacter:

      'Controlled, focused, and modern with tone depending heavily on the filler material and shell thickness.',

    nodeBias: {

      attack: 0.06,

      brightness: 0.04,

      projection: 0.06,

      sustain: -0.02,

      warmth: -0.02,

      sensitivity: -0.02,

      control: 0.08,

    },

    notes:

      'Resin composite should remain flexible in the engine because its exact behavior depends heavily on construction.',

  },

};

export function getShellMaterialProfile(materialKey = 'maple') {

  return SHELL_MATERIAL_PROFILES[materialKey] || SHELL_MATERIAL_PROFILES.maple;

}

export function normalizeShellMaterialNodeBias(materialKey = 'maple') {

  const profile = getShellMaterialProfile(materialKey);

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(profile?.nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

export function buildShellMaterialRead(materialKey = 'maple') {

  const profile = getShellMaterialProfile(materialKey);

  return {

    materialKey,

    family: profile.family,

    familyLabel: SHELL_MATERIAL_FAMILIES[profile.family]?.label || profile.family,

    label: profile.label,

    aliases: profile.aliases || [],

    densityClass: profile.densityClass,

    hardnessClass: profile.hardnessClass,

    generalCharacter: profile.generalCharacter,

    notes: profile.notes,

    nodeBias: normalizeShellMaterialNodeBias(materialKey),

  };

}

export function findShellMaterialKey(value = '') {

  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) return null;

  if (SHELL_MATERIAL_PROFILES[normalized]) {

    return normalized;

  }

  const match = Object.entries(SHELL_MATERIAL_PROFILES).find(

    ([key, profile]) => {

      const label = String(profile.label || '').toLowerCase();

      const aliases = Array.isArray(profile.aliases) ? profile.aliases : [];

      return (

        key.toLowerCase() === normalized ||

        label === normalized ||

        aliases.some((alias) => String(alias || '').toLowerCase() === normalized)

      );

    }

  );

  return match?.[0] || null;

}

export default SHELL_MATERIAL_PROFILES;