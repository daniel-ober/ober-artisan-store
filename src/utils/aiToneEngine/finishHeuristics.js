// src/utils/aiToneEngine/finishHeuristics.js

const DEFAULT_PROFILE = {

  attack: 5,

  sustain: 5,

  warmth: 5,

  projection: 5,

  brightness: 5,

  sensitivity: 5,

  control: 5,

};

const clamp = (value, min = 1, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round2 = (n) => Math.round(n * 100) / 100;

function normalizeString(value) {

  return String(value || '').trim().toLowerCase();

}

function buildResult({

  id = 'unknown',

  label = 'Unknown',

  profile = DEFAULT_PROFILE,

  confidence01 = 0.6,

  reasons = [],

}) {

  const safeConfidence = Math.max(

    0.35,

    Math.min(0.9, Number(confidence01) || 0.6)

  );

  return {

    id,

    label,

    profile: {

      attack: round2(clamp(profile.attack)),

      sustain: round2(clamp(profile.sustain)),

      warmth: round2(clamp(profile.warmth)),

      projection: round2(clamp(profile.projection)),

      brightness: round2(clamp(profile.brightness)),

      sensitivity: round2(clamp(profile.sensitivity)),

      control: round2(clamp(profile.control)),

    },

    confidence01: round2(safeConfidence),

    confidencePercent: Math.round(safeConfidence * 100),

    reasons:

      reasons.length > 0

        ? reasons

        : ['Finish profile estimated from Ober heuristic assumptions.'],

  };

}

export function deriveFinishHeuristicProfile(input) {

  const value = normalizeString(input);

  if (!value) {

    return buildResult({

      id: 'default',

      label: 'Default',

      profile: DEFAULT_PROFILE,

      confidence01: 0.42,

      reasons: [

        'No finish type was provided, so a neutral fallback finish profile was used.',

      ],

    });

  }

  // For Ober voicing, finish is intentionally treated as a lower-order tonal modifier.

  // It can nudge response, but should not overpower shell geometry, material, hoops, or depth.

  if (

    value.includes('raw') ||

    value.includes('unfinished') ||

    value.includes('natural oil') ||

    value.includes('oil finish') ||

    value.includes('hand-rubbed oil')

  ) {

    return buildResult({

      id: 'raw-oil-finish',

      label: 'Raw / Oil Finish',

      profile: {

        attack: 5.9,

        sustain: 5.8,

        warmth: 5.7,

        projection: 5.4,

        brightness: 4.9,

        sensitivity: 5.6,

        control: 4.9,

      },

      confidence01: 0.62,

      reasons: [

        'Thinner, less built-up finishes are treated as slightly more open and organic in the Ober model.',

        'They may preserve a bit more shell openness, but the tonal effect should stay modest relative to shell geometry and setup.',

      ],

    });

  }

  if (

    value.includes('wax') ||

    value.includes('satin oil') ||

    value.includes('matte oil')

  ) {

    return buildResult({

      id: 'wax-oil-finish',

      label: 'Wax / Satin Oil Finish',

      profile: {

        attack: 5.8,

        sustain: 5.7,

        warmth: 5.6,

        projection: 5.3,

        brightness: 4.9,

        sensitivity: 5.5,

        control: 5.0,

      },

      confidence01: 0.6,

      reasons: [

        'Wax and light oil finishes are treated as lightly open and natural-feeling rather than heavily shaping the tone.',

        'They may support a slightly softer, less film-built response without dominating the shell character.',

      ],

    });

  }

  if (

    value.includes('lacquer') ||

    value.includes('lacquered') ||

    value.includes('nitro')

  ) {

    return buildResult({

      id: 'lacquer-finish',

      label: 'Lacquer Finish',

      profile: {

        attack: 5.2,

        sustain: 5.1,

        warmth: 5.0,

        projection: 5.1,

        brightness: 5.1,

        sensitivity: 5.0,

        control: 5.2,

      },

      confidence01: 0.66,

      reasons: [

        'Lacquer is treated as a balanced middle-ground finish in Ober voicing logic.',

        'It may add a slightly more polished and defined shell presentation, but remains a secondary tonal input.',

      ],

    });

  }

  if (

    value.includes('gloss') ||

    value.includes('poly') ||

    value.includes('polyurethane') ||

    value.includes('high gloss')

  ) {

    return buildResult({

      id: 'gloss-poly-finish',

      label: 'Gloss / Poly Finish',

      profile: {

        attack: 5.4,

        sustain: 4.9,

        warmth: 4.8,

        projection: 5.2,

        brightness: 5.4,

        sensitivity: 4.8,

        control: 5.5,

      },

      confidence01: 0.65,

      reasons: [

        'Heavier gloss-style finishes are treated as slightly firmer and more contained than thinner finishes.',

        'They may support a subtly more polished front edge and slightly more control, but should never dominate the voice read.',

      ],

    });

  }

  if (value.includes('matte') || value.includes('satin')) {

    return buildResult({

      id: 'matte-satin-finish',

      label: 'Matte / Satin Finish',

      profile: {

        attack: 5.1,

        sustain: 5.2,

        warmth: 5.2,

        projection: 5.0,

        brightness: 4.9,

        sensitivity: 5.1,

        control: 5.1,

      },

      confidence01: 0.63,

      reasons: [

        'Matte and satin finishes are treated as close to neutral in the Ober model.',

        'They may gently preserve balance between openness and control without strongly pushing the drum in either direction.',

      ],

    });

  }

  if (

    value.includes('torch') ||

    value.includes('scorch') ||

    value.includes('light torch') ||

    value.includes('medium torch') ||

    value.includes('blackened')

  ) {

    if (value.includes('light')) {

      return buildResult({

        id: 'light-torch',

        label: 'Light Torch',

        profile: {

          attack: 5.2,

          sustain: 5.0,

          warmth: 5.0,

          projection: 5.0,

          brightness: 5.2,

          sensitivity: 5.0,

          control: 5.1,

        },

        confidence01: 0.52,

        reasons: [

          'Light torching is treated as a subtle tonal nudge rather than a major acoustic driver.',

          'In Ober language it may slightly sharpen the presentation, but remains far less influential than depth, thickness, hoops, or edge profile.',

        ],

      });

    }

    if (value.includes('medium')) {

      return buildResult({

        id: 'medium-torch',

        label: 'Medium Torch',

        profile: {

          attack: 5.0,

          sustain: 5.0,

          warmth: 5.2,

          projection: 5.0,

          brightness: 4.9,

          sensitivity: 5.0,

          control: 5.1,

        },

        confidence01: 0.52,

        reasons: [

          'Medium torching is treated as a modest tonal color shift in the Ober model.',

          'It may slightly deepen the read, but should remain a small modifier compared with the physical shell recipe.',

        ],

      });

    }

    if (value.includes('blackened')) {

      return buildResult({

        id: 'blackened',

        label: 'Blackened',

        profile: {

          attack: 4.9,

          sustain: 4.9,

          warmth: 5.4,

          projection: 5.0,

          brightness: 4.7,

          sensitivity: 4.9,

          control: 5.2,

        },

        confidence01: 0.5,

        reasons: [

          'Blackened torching is treated as the warmest and darkest finish-direction nudge inside the Heritage visual language.',

          'Its tonal influence should still stay subtle and secondary to the shell structure itself.',

        ],

      });

    }

  }

  return buildResult({

    id: 'default',

    label: input || 'Unknown',

    profile: DEFAULT_PROFILE,

    confidence01: 0.5,

    reasons: [

      `Finish type "${input}" does not yet have a dedicated heuristic profile, so a neutral fallback was used.`,

    ],

  });

}

export default deriveFinishHeuristicProfile;