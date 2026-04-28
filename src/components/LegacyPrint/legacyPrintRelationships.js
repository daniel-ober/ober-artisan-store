
export const LEGACYPRINT_RELATIONSHIPS = [

  {

    id: 'attack_brightness',

    nodes: ['attack', 'brightness'],

    label: 'Snap / Definition',

    shortLabel: 'Snap with clarity',

    description:

      'How clearly the first hit speaks and how much crisp edge it carries.',

  },

  {

    id: 'attack_projection',

    nodes: ['attack', 'projection'],

    label: 'Punch / Forward Motion',

    shortLabel: 'Punch that moves',

    description:

      'How the initial strike pushes the drum forward into the room or mix.',

  },

  {

    id: 'attack_sustain',

    nodes: ['attack', 'sustain'],

    label: 'Immediate vs. Lingering',

    shortLabel: 'Strike into bloom',

    description:

      'How the front edge of the note connects to the length that follows.',

  },

  {

    id: 'attack_warmth',

    nodes: ['attack', 'warmth'],

    label: 'Crack With Body',

    shortLabel: 'Crack with body',

    description:

      'How the first hit balances with fullness underneath it.',

  },

  {

    id: 'attack_sensitivity',

    nodes: ['attack', 'sensitivity'],

    label: 'Touch Response',

    shortLabel: 'First touch response',

    description:

      'How quickly the drum speaks when the player uses lighter hands.',

  },

  {

    id: 'attack_control',

    nodes: ['attack', 'control'],

    label: 'Clean Articulation',

    shortLabel: 'Focused first hit',

    description:

      'How cleanly the drum speaks at the moment of impact.',

  },

  {

    id: 'brightness_projection',

    nodes: ['brightness', 'projection'],

    label: 'Cut / Presence',

    shortLabel: 'Cut that carries',

    description:

      'How well top-end clarity moves through a room or mix.',

  },

  {

    id: 'brightness_sustain',

    nodes: ['brightness', 'sustain'],

    label: 'Shimmer / Ring Character',

    shortLabel: 'Bright bloom',

    description:

      'How upper-register detail stays present as the note opens.',

  },

  {

    id: 'brightness_warmth',

    nodes: ['brightness', 'warmth'],

    label: 'Crispness vs. Body',

    shortLabel: 'Crisp but full',

    description:

      'How the top end balances against low-mid body and wood character.',

  },

  {

    id: 'brightness_sensitivity',

    nodes: ['brightness', 'sensitivity'],

    label: 'High-End Detail',

    shortLabel: 'Light-touch clarity',

    description:

      'How much top-end detail appears when the player plays softly.',

  },

  {

    id: 'brightness_control',

    nodes: ['brightness', 'control'],

    label: 'Answer Without Harshness',

    shortLabel: 'Cut without harshness',

    description:

      'How clear the top end feels while staying refined and musical.',

  },

  {

    id: 'projection_sustain',

    nodes: ['projection', 'sustain'],

    label: 'Carry / Openness',

    shortLabel: 'Carry after impact',

    description:

      'How far the drum travels and how long the note remains present.',

  },

  {

    id: 'projection_warmth',

    nodes: ['projection', 'warmth'],

    label: 'Power With Weight',

    shortLabel: 'Power with body',

    description:

      'How the drum carries authority without losing fullness underneath.',

  },

  {

    id: 'projection_sensitivity',

    nodes: ['projection', 'sensitivity'],

    label: 'Dynamic Range',

    shortLabel: 'Touch-to-volume range',

    description:

      'How easily touch turns into presence, volume, and room response.',

  },

  {

    id: 'projection_control',

    nodes: ['projection', 'control'],

    label: 'Power With Focus',

    shortLabel: 'Power with focus',

    description:

      'How strongly the drum carries without getting messy or unruly.',

  },

  {

    id: 'sustain_warmth',

    nodes: ['sustain', 'warmth'],

    label: 'Bloom / Body',

    shortLabel: 'Bloom with body',

    description:

      'How much fullness remains as the note opens after the strike.',

  },

  {

    id: 'sustain_sensitivity',

    nodes: ['sustain', 'sensitivity'],

    label: 'Responsive Resonance',

    shortLabel: 'Touch that blooms',

    description:

      'How lighter playing still produces air, life, and resonance.',

  },

  {

    id: 'sustain_control',

    nodes: ['sustain', 'control'],

    label: 'Open But Managed',

    shortLabel: 'Open but controlled',

    description:

      'How the drum breathes without becoming too ringy or uncontrolled.',

  },

  {

    id: 'warmth_sensitivity',

    nodes: ['warmth', 'sensitivity'],

    label: 'Touch Tone',

    shortLabel: 'Body under light hands',

    description:

      'How much tone and body appear without needing to hit hard.',

  },

  {

    id: 'warmth_control',

    nodes: ['warmth', 'control'],

    label: 'Roundness With Focus',

    shortLabel: 'Warmth without mud',

    description:

      'How full the drum feels while staying shaped and usable.',

  },

  {

    id: 'sensitivity_control',

    nodes: ['sensitivity', 'control'],

    label: 'Responsive Precision',

    shortLabel: 'Responsive but composed',

    description:

      'How easily the drum responds without becoming chaotic or hard to manage.',

  },

];

export const RELATIONSHIP_GROUPS = [

  {

    id: 'cycle',

    label: 'Play Cycle Links',

    relationshipIds: [

      'attack_brightness',

      'brightness_projection',

      'projection_sustain',

      'sustain_warmth',

      'warmth_sensitivity',

      'sensitivity_control',

      'attack_control',

    ],

  },

  {

    id: 'all',

    label: 'Full Web',

    relationshipIds: LEGACYPRINT_RELATIONSHIPS.map((relationship) => relationship.id),

  },

  {

    id: 'tradeoffs',

    label: 'Useful Tensions',

    relationshipIds: [

      'attack_warmth',

      'brightness_control',

      'projection_control',

      'sustain_control',

      'warmth_control',

      'brightness_warmth',

      'projection_warmth',

    ],

  },

];

export const getRelationshipById = (id) =>

  LEGACYPRINT_RELATIONSHIPS.find((relationship) => relationship.id === id);

