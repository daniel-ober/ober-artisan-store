// src/utils/legacyPrint/core/constructionVoicingProfiles.js

export const CONSTRUCTION_VOICING_PROFILES = Object.freeze({

  stave: {

    constructionType: 'stave',

    label: 'Stave',

    profile: {

      attack: 5.45,

      brightness: 5.15,

      projection: 5.45,

      sustain: 5.05,

      warmth: 5.55,

      sensitivity: 5.05,

      control: 5.45,

    },

    read:

      'Stave construction tends to feel direct, shell-forward, and structured, with strong body and a clear note center.',

  },

  'hybrid-stave-steambent': {

    constructionType: 'hybrid-stave-steambent',

    label: 'Hybrid Stave / Steam-Bent',

    profile: {

      attack: 5.75,

      brightness: 5.35,

      projection: 5.8,

      sustain: 5.45,

      warmth: 5.45,

      sensitivity: 5.45,

      control: 5.55,

    },

    read:

      'Hybrid stave / steam-bent construction blends structure with added openness, giving the voice more modern articulation and bloom.',

  },

  hybrid: {

    constructionType: 'hybrid',

    label: 'Hybrid',

    profile: {

      attack: 5.7,

      brightness: 5.35,

      projection: 5.75,

      sustain: 5.4,

      warmth: 5.45,

      sensitivity: 5.4,

      control: 5.55,

    },

    read:

      'Hybrid construction generally balances structure, response, and openness with a more modern voice posture.',

  },

  ply: {

    constructionType: 'ply',

    label: 'Ply',

    profile: {

      attack: 5.35,

      brightness: 5.35,

      projection: 5.35,

      sustain: 5.15,

      warmth: 5.2,

      sensitivity: 5.25,

      control: 5.35,

    },

    read:

      'Ply construction gives a familiar, balanced, professional reference point with controlled consistency.',

  },

  'steam-bent': {

    constructionType: 'steam-bent',

    label: 'Steam-Bent',

    profile: {

      attack: 5.1,

      brightness: 5.05,

      projection: 5.25,

      sustain: 5.75,

      warmth: 5.6,

      sensitivity: 5.65,

      control: 4.95,

    },

    read:

      'Steam-bent construction generally feels more continuous, open, and resonant, with more bloom and touch response.',

  },

  'steam bent': {

    constructionType: 'steam-bent',

    label: 'Steam-Bent',

    profile: {

      attack: 5.1,

      brightness: 5.05,

      projection: 5.25,

      sustain: 5.75,

      warmth: 5.6,

      sensitivity: 5.65,

      control: 4.95,

    },

    read:

      'Steam-bent construction generally feels more continuous, open, and resonant, with more bloom and touch response.',

  },

  'solid-shell': {

    constructionType: 'solid-shell',

    label: 'Solid Shell',

    profile: {

      attack: 5.45,

      brightness: 5.25,

      projection: 5.55,

      sustain: 5.35,

      warmth: 5.55,

      sensitivity: 5.35,

      control: 5.35,

    },

    read:

      'Solid shell construction usually reads direct, woody, and authoritative, with strong shell identity.',

  },

  'solid shell': {

    constructionType: 'solid-shell',

    label: 'Solid Shell',

    profile: {

      attack: 5.45,

      brightness: 5.25,

      projection: 5.55,

      sustain: 5.35,

      warmth: 5.55,

      sensitivity: 5.35,

      control: 5.35,

    },

    read:

      'Solid shell construction usually reads direct, woody, and authoritative, with strong shell identity.',

  },

  rolled: {

    constructionType: 'rolled-metal',

    label: 'Rolled Metal',

    profile: {

      attack: 5.85,

      brightness: 5.85,

      projection: 5.9,

      sustain: 5.25,

      warmth: 4.85,

      sensitivity: 5.35,

      control: 5.45,

    },

    read:

      'Rolled metal construction tends to increase cut, projection, and top-end presence.',

  },

  'rolled-metal': {

    constructionType: 'rolled-metal',

    label: 'Rolled Metal',

    profile: {

      attack: 5.85,

      brightness: 5.85,

      projection: 5.9,

      sustain: 5.25,

      warmth: 4.85,

      sensitivity: 5.35,

      control: 5.45,

    },

    read:

      'Rolled metal construction tends to increase cut, projection, and top-end presence.',

  },

  seamless: {

    constructionType: 'seamless',

    label: 'Seamless',

    profile: {

      attack: 5.55,

      brightness: 5.55,

      projection: 5.7,

      sustain: 5.6,

      warmth: 4.95,

      sensitivity: 5.35,

      control: 5.15,

    },

    read:

      'Seamless shells usually feel continuous and immediate, with strong projection and a more modern response.',

  },

  acrylic: {

    constructionType: 'seamless-acrylic',

    label: 'Seamless Acrylic',

    profile: {

      attack: 5.7,

      brightness: 5.75,

      projection: 5.9,

      sustain: 5.6,

      warmth: 4.85,

      sensitivity: 5.25,

      control: 5.2,

    },

    read:

      'Acrylic shells generally read modern, clear, projecting, and visually immediate, with less traditional wood warmth.',

  },

  'seamless-acrylic': {

    constructionType: 'seamless-acrylic',

    label: 'Seamless Acrylic',

    profile: {

      attack: 5.7,

      brightness: 5.75,

      projection: 5.9,

      sustain: 5.6,

      warmth: 4.85,

      sensitivity: 5.25,

      control: 5.2,

    },

    read:

      'Acrylic shells generally read modern, clear, projecting, and visually immediate, with less traditional wood warmth.',

  },

});

export function normalizeConstructionType(value = '') {

  const text = String(value || '')

    .trim()

    .toLowerCase()

    .replace(/_/g, '-');

  if (!text) return 'ply';

  if (text.includes('hybrid')) return 'hybrid-stave-steambent';

  if (text.includes('steam')) return 'steam-bent';

  if (text.includes('solid')) return 'solid-shell';

  if (text.includes('stave')) return 'stave';

  if (text.includes('ply')) return 'ply';

  if (text.includes('rolled')) return 'rolled-metal';

  if (text.includes('metal')) return 'rolled-metal';

  if (text.includes('acrylic')) return 'seamless-acrylic';

  if (text.includes('seamless')) return 'seamless';

  return text;

}

export function getConstructionVoicingProfile(value = '') {

  const normalized = normalizeConstructionType(value);

  return (

    CONSTRUCTION_VOICING_PROFILES[normalized] ||

    CONSTRUCTION_VOICING_PROFILES[value] ||

    CONSTRUCTION_VOICING_PROFILES.ply

  );

}

export default CONSTRUCTION_VOICING_PROFILES;