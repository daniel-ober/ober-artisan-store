// src/data/legacyPrint/voiceEngineTaxonomy.js

export const LEGACYPRINT_NODE_ORDER = [
  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',
];

export const LEGACYPRINT_NODES = {
  attack: {
    label: 'Attack',

    shortLabel: 'Attack',

    description:
      'How quickly the drum speaks at the front of the note. Higher attack means a faster, clearer, more immediate stick response.',
  },

  brightness: {
    label: 'Brightness',

    shortLabel: 'Bright',

    description:
      'How much upper-frequency clarity, crispness, and snap the drum produces.',
  },

  projection: {
    label: 'Projection',

    shortLabel: 'Throw',

    description:
      'How strongly the drum carries outward into a room, mix, or live setting.',
  },

  sustain: {
    label: 'Sustain',

    shortLabel: 'Bloom',

    description: 'How long the drum continues to speak after the initial hit.',
  },

  warmth: {
    label: 'Warmth',

    shortLabel: 'Warmth',

    description:
      'How full, woody, rounded, and body-rich the drum feels through the center of the note.',
  },

  sensitivity: {
    label: 'Sensitivity',

    shortLabel: 'Touch',

    description:
      'How easily the drum responds to lighter playing, ghost notes, and small dynamic changes.',
  },

  control: {
    label: 'Control',

    shortLabel: 'Control',

    description:
      'How focused, organized, and easy to place the drum feels. Higher control usually means less loose ring or spread.',
  },
};

export const DRUM_TYPES = {
  snare: {
    label: 'Snare Drum',

    supportedDiameterRangeIn: [10, 15],

    supportedDepthRangeIn: [3, 10],

    commonDiameterRangeIn: [12, 14],

    commonDepthRangeIn: [4.5, 8],

    primaryUse:
      'Main backbeat, side-snare colors, orchestral/snare response, studio and live articulation.',
  },

  rackTom: {
    label: 'Rack Tom',

    supportedDiameterRangeIn: [6, 15],

    supportedDepthRangeIn: [4, 13],

    commonDiameterRangeIn: [8, 13],

    commonDepthRangeIn: [6, 10],

    primaryUse:
      'Melodic tom voice with quicker response, pitch clarity, and controlled sustain.',
  },

  floorTom: {
    label: 'Floor Tom',

    supportedDiameterRangeIn: [13, 18],

    supportedDepthRangeIn: [10, 18],

    commonDiameterRangeIn: [14, 16],

    commonDepthRangeIn: [12, 16],

    primaryUse:
      'Lower tom voice with stronger body, longer bloom, and deeper room presence.',
  },

  bassDrum: {
    label: 'Bass Drum',

    supportedDiameterRangeIn: [16, 26],

    supportedDepthRangeIn: [10, 20],

    commonDiameterRangeIn: [18, 24],

    commonDepthRangeIn: [14, 18],

    primaryUse:
      'Low-frequency foundation, punch, bloom, air movement, and room weight.',
  },
};

export const SHELL_CONSTRUCTION_TYPES = {
  stave: {
    label: 'Stave',

    family: 'wood',

    description:
      'Vertical wood segments joined into a round shell. Often structurally strong, direct, projecting, and highly dependent on stave count, thickness, and species.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'segmented',

      glueMass: 'medium',

      structuralRigidity: 'mediumHigh',

      typicalReRings: false,
    },
  },

  ply: {
    label: 'Ply',

    family: 'wood',

    description:
      'Multiple thin wood plies laminated together. Common in modern drums, usually consistent, controlled, and repeatable.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'laminated',

      glueMass: 'high',

      structuralRigidity: 'medium',

      typicalReRings: false,
    },
  },

  steamBent: {
    label: 'Steam-Bent',

    family: 'wood',

    description:
      'A single bent plank formed into a round shell with one scarf joint and one primary glue seam. Often supported by re-rings. Usually open, resonant, and organic.',

    defaultReinforcement: 'reRings',

    physicalTraits: {
      shellContinuity: 'singleBentBoard',

      glueMass: 'low',

      structuralRigidity: 'mediumLow',

      typicalReRings: true,
    },
  },

  solidShell: {
    label: 'Solid Shell',

    family: 'wood',

    description:
      'A single solid section of wood carved or lathed into a shell. Rare, highly wood-forward, and heavily dependent on species, curing, wall thickness, and mass.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'singlePiece',

      glueMass: 'none',

      structuralRigidity: 'variable',

      typicalReRings: false,
    },
  },

  feuzonHybrid: {
    label: 'FEUZØN Hybrid',

    family: 'ober',

    description:
      'Ober Artisan construction using a voiced stave interior with a steam-bent exterior. Combines inner stave focus and projection with outer-shell continuity, warmth, and bloom.',

    defaultReinforcement: 'integratedHybrid',

    physicalTraits: {
      shellContinuity: 'hybridStaveSteamBent',

      glueMass: 'medium',

      structuralRigidity: 'mediumHigh',

      typicalReRings: false,
    },
  },

  metal: {
    label: 'Metal',

    family: 'metal',

    description:
      'Formed metal shell such as brass, steel, aluminum, copper, or bronze. Strong material fingerprint with fast response, projection, and overtone behavior depending on alloy and thickness.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'formedMetal',

      glueMass: 'none',

      structuralRigidity: 'high',

      typicalReRings: false,
    },
  },

  acrylic: {
    label: 'Acrylic',

    family: 'synthetic',

    description:
      'Synthetic shell known for strong projection, fast attack, glassy brightness, and visual/tone consistency. Thickness and seam design matter heavily.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'formedSynthetic',

      glueMass: 'low',

      structuralRigidity: 'high',

      typicalReRings: false,
    },
  },

  composite: {
    label: 'Composite / Other',

    family: 'composite',

    description:
      'Carbon fiber, fiberglass, resin, or other non-traditional shell systems. These require material-specific modeling rather than one broad assumption.',

    defaultReinforcement: 'none',

    physicalTraits: {
      shellContinuity: 'engineeredComposite',

      glueMass: 'variable',

      structuralRigidity: 'variable',

      typicalReRings: false,
    },
  },
};

export const REINFORCEMENT_TYPES = {
  none: {
    label: 'None',

    description:
      'No reinforcement rings. The shell edge and body are governed mainly by shell thickness, construction, material, and bearing edge.',
  },

  reRings: {
    label: 'Re-Rings',

    description:
      'Reinforcement rings at the top and bottom of the shell. Common on steam-bent and thinner shells. Adds edge stability, focus, and structural support while preserving some shell openness.',
  },

  integratedHybrid: {
    label: 'Integrated Hybrid Construction',

    description:
      'Used when the construction itself creates multiple structural zones, such as FEUZØN. This should be modeled as part of shell construction, not as a simple add-on ring.',
  },
};

export const SHELL_THICKNESS_RANGES_MM = {
  ultraThin: {
    label: 'Ultra Thin',

    rangeMm: [3, 5.9],

    description:
      'Very open, highly responsive, lower built-in control, often needs structural support depending on construction.',
  },

  veryThin: {
    label: 'Very Thin',

    rangeMm: [6, 7.9],

    description:
      'Open, warm, touch-sensitive, with more shell movement and bloom.',
  },

  thin: {
    label: 'Thin',

    rangeMm: [8, 9.9],

    description:
      'Responsive and balanced with more openness than a medium shell.',
  },

  medium: {
    label: 'Medium',

    rangeMm: [10, 11.9],

    description:
      'Balanced shell behavior between attack, body, sustain, sensitivity, and control.',
  },

  mediumThick: {
    label: 'Medium-Thick',

    rangeMm: [12, 13.9],

    description:
      'More focused, stronger attack, more projection, and less loose bloom.',
  },

  thick: {
    label: 'Thick',

    rangeMm: [14, 17.9],

    description:
      'Forward, focused, controlled, strong crack, reduced sensitivity, and reduced openness.',
  },

  veryThick: {
    label: 'Very Thick',

    rangeMm: [18, 24],

    description:
      'Highly controlled, dense, powerful, and less open. Often more specialized.',
  },
};

export const HOOP_TYPES = {
  tripleFlange: {
    label: 'Triple Flange',

    description:
      'Open, flexible, familiar hoop response with more sustain and air than heavier hoops.',
  },

  dieCast: {
    label: 'Die-Cast',

    description:
      'Heavier, more rigid hoop response with stronger focus, attack, control, and shorter bloom.',
  },

  woodHoop: {
    label: 'Wood Hoop',

    description:
      'Warmer rim character, softer edge, more woody attack, and a rounder playing feel.',
  },

  singleFlange: {
    label: 'Single Flange',

    description:
      'Vintage-style hoop response with openness, flexibility, and a less rigid rim feel.',
  },

  stickSaver: {
    label: 'Stick Saver / Inward Flange',

    description:
      'Rounded vintage-style response with a softer rim feel and slightly controlled openness.',
  },
};

export const DRUMHEAD_USER_FAMILIES = {
  clearThin: {
    label: 'Clear / Thin',

    description:
      'Open, bright, sensitive, and resonant. Good for clarity, sustain, and articulation.',
  },

  clearStandard: {
    label: 'Clear / Standard',

    description:
      'Balanced clear-head response with attack, brightness, and natural sustain.',
  },

  clearThick: {
    label: 'Clear / Thick',

    description:
      'More durable, focused, punchy, and controlled than thinner clear heads.',
  },

  clearControlled: {
    label: 'Clear / Controlled',

    description:
      'Clear head with added control features such as rings, dots, or dampening.',
  },

  clearHydraulic: {
    label: 'Clear / Hydraulic',

    description: 'Shorter, deeper, more controlled, and heavily damped.',
  },

  coatedStandard: {
    label: 'Coated / Standard',

    description:
      'Balanced, warm, familiar response with controlled brightness and strong versatility.',
  },

  coatedThick: {
    label: 'Coated / Thick',

    description:
      'More focused, durable, controlled, and punchy with reduced openness.',
  },

  coatedVintage: {
    label: 'Coated / Vintage',

    description:
      'Warmer, rounder, slightly softer attack, often with a more classic feel.',
  },

  coatedControlled: {
    label: 'Coated / Controlled',

    description:
      'Built-in dampening or control ring for shorter sustain and easier placement.',
  },

  meshSpecialty: {
    label: 'Mesh / Specialty',

    description:
      'Mesh, calfskin-style, hybrid synthetic, extreme dampening, or other specialty heads.',
  },
};

export const SNARE_SIDE_HEAD_FAMILIES = {
  thin2Mil: {
    label: 'Thin Snare Side / 2mil',

    description:
      'Very sensitive and articulate, especially at lower dynamics. Less durable and less controlled.',
  },

  standard3Mil: {
    label: 'Standard Snare Side / 3mil',

    description:
      'The common balanced snare-side response for sensitivity, control, and versatility.',
  },

  thick5Mil: {
    label: 'Thick Snare Side / 5mil',

    description:
      'More controlled, durable, and focused with less extreme sensitivity.',
  },
};

export const TUNING_TARGETS = {
  loose: {
    label: 'Loose',

    description:
      'Lower tension, deeper pitch, more movement, more bloom, softer rebound.',
  },

  medium: {
    label: 'Medium',

    description:
      'Balanced tuning range with practical response, body, and control.',
  },

  tight: {
    label: 'Tight',

    description:
      'Higher tension, quicker response, more articulation, shorter bloom, and more pitch clarity.',
  },
};

export const OBER_PRODUCT_LINES = {
  heritage: {
    label: 'HERITAGE',

    constructionType: 'stave',

    primaryMaterialFamily: 'oak',

    description:
      'Ober Artisan stave-built oak voice focused on grounded warmth, shell-first response, and classic handcrafted character.',
  },

  feuzon: {
    label: 'FEUZØN',

    constructionType: 'feuzonHybrid',

    primaryMaterialFamily: 'hybrid',

    description:
      'Ober Artisan hybrid shell voice using a voiced stave interior and steam-bent exterior for focused projection, bloom, and complex shell behavior.',
  },

  soundlegend: {
    label: 'SOUNDLEGEND',

    constructionType: 'variable',

    primaryMaterialFamily: 'custom',

    description:
      'Ober Artisan fully custom voice system with broad shell construction, material, size, thickness, finish, and player-specific configuration options.',
  },
};

export function getShellThicknessRangeKey(thicknessMm) {
  const value = Number(thicknessMm);

  if (!Number.isFinite(value)) return null;

  const match = Object.entries(SHELL_THICKNESS_RANGES_MM).find(
    ([, range]) => value >= range.rangeMm[0] && value <= range.rangeMm[1]
  );

  return match?.[0] || null;
}

export default {
  LEGACYPRINT_NODE_ORDER,

  LEGACYPRINT_NODES,

  DRUM_TYPES,

  SHELL_CONSTRUCTION_TYPES,

  REINFORCEMENT_TYPES,

  SHELL_THICKNESS_RANGES_MM,

  HOOP_TYPES,

  DRUMHEAD_USER_FAMILIES,

  SNARE_SIDE_HEAD_FAMILIES,

  TUNING_TARGETS,

  OBER_PRODUCT_LINES,

  getShellThicknessRangeKey,
};
