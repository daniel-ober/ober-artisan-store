// src/utils/aiToneEngine/snareResponseHeuristics.js

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

        : ['Snare response profile estimated from Ober heuristic assumptions.'],

  };

}

export function deriveSnareBedHeuristicProfile(input) {

  const value = normalizeString(input);

  if (!value) {

    return buildResult({

      id: 'standard-bed-default',

      label: 'Standard Snare Bed',

      profile: {

        attack: 5.1,

        sustain: 5.0,

        warmth: 5.0,

        projection: 5.0,

        brightness: 5.0,

        sensitivity: 5.2,

        control: 5.1,

      },

      confidence01: 0.58,

      reasons: [

        'No snare bed depth was provided, so a standard balanced snare-bed assumption was used.',

      ],

    });

  }

  if (value.includes('shallow')) {

    return buildResult({

      id: 'shallow-snare-bed',

      label: 'Shallow Snare Bed',

      profile: {

        attack: 5.4,

        sustain: 4.9,

        warmth: 4.9,

        projection: 5.1,

        brightness: 5.3,

        sensitivity: 4.8,

        control: 5.7,

      },

      confidence01: 0.7,

      reasons: [

        'Shallower beds are treated as slightly tighter and firmer in the Ober model.',

        'They usually support a crisper front edge and a more controlled snare feel, but can give up some low-dynamic eagerness.',

      ],

    });

  }

  if (value.includes('deep')) {

    return buildResult({

      id: 'deep-snare-bed',

      label: 'Deep Snare Bed',

      profile: {

        attack: 4.9,

        sustain: 5.1,

        warmth: 5.2,

        projection: 4.9,

        brightness: 4.9,

        sensitivity: 5.9,

        control: 4.8,

      },

      confidence01: 0.72,

      reasons: [

        'Deeper beds are treated as more eager and more sensitive under lighter touch.',

        'They usually support easier wire engagement and more expressive ghost-note behavior, but can feel less tightly contained.',

      ],

    });

  }

  return buildResult({

    id: 'standard-snare-bed',

    label: input || 'Standard Snare Bed',

    profile: {

      attack: 5.1,

      sustain: 5.0,

      warmth: 5.0,

      projection: 5.0,

      brightness: 5.0,

      sensitivity: 5.2,

      control: 5.1,

    },

    confidence01: 0.62,

    reasons: [

      'This snare bed was interpreted as a standard balanced snare-bed profile.',

    ],

  });

}

export function deriveSnareSideHeadHeuristicProfile(input) {

  const value = normalizeString(input);

  if (!value) {

    return buildResult({

      id: 'standard-snare-side-default',

      label: 'Standard Snare Side',

      profile: {

        attack: 5.1,

        sustain: 5.0,

        warmth: 4.9,

        projection: 5.0,

        brightness: 5.1,

        sensitivity: 5.2,

        control: 5.1,

      },

      confidence01: 0.6,

      reasons: [

        'No snare-side head was provided, so a standard 3mil-style balanced assumption was used.',

      ],

    });

  }

  if (

    value.includes('200') ||

    value.includes('2mil') ||

    value.includes('thin')

  ) {

    return buildResult({

      id: 'thin-snare-side',

      label: 'Thin Snare Side',

      profile: {

        attack: 5.3,

        sustain: 5.0,

        warmth: 4.7,

        projection: 5.0,

        brightness: 5.5,

        sensitivity: 5.9,

        control: 4.8,

      },

      confidence01: 0.76,

      reasons: [

        'Thinner snare-side heads are treated as quicker and more sensitive in the Ober model.',

        'They usually increase crispness and wire eagerness, while slightly reducing containment.',

      ],

    });

  }

  if (

    value.includes('500') ||

    value.includes('5mil') ||

    value.includes('thick')

  ) {

    return buildResult({

      id: 'thick-snare-side',

      label: 'Thick Snare Side',

      profile: {

        attack: 4.9,

        sustain: 5.1,

        warmth: 5.2,

        projection: 4.9,

        brightness: 4.7,

        sensitivity: 4.5,

        control: 5.8,

      },

      confidence01: 0.74,

      reasons: [

        'Thicker snare-side heads are treated as slightly drier and more contained.',

        'They can reduce low-dynamic eagerness while increasing perceived firmness and control.',

      ],

    });

  }

  return buildResult({

    id: 'standard-snare-side',

    label: input || 'Standard Snare Side',

    profile: {

      attack: 5.1,

      sustain: 5.0,

      warmth: 4.9,

      projection: 5.0,

      brightness: 5.1,

      sensitivity: 5.2,

      control: 5.1,

    },

    confidence01: 0.66,

    reasons: [

      'This snare-side head was interpreted as a standard balanced snare-side setup.',

    ],

  });

}

export function deriveSnareWireCountHeuristicProfile(input) {

  const count = Number(input);

  if (!Number.isFinite(count)) {

    return buildResult({

      id: 'standard-wire-count-default',

      label: 'Standard Wire Count',

      profile: {

        attack: 5.0,

        sustain: 5.0,

        warmth: 5.0,

        projection: 5.0,

        brightness: 5.0,

        sensitivity: 5.2,

        control: 5.1,

      },

      confidence01: 0.56,

      reasons: [

        'No snare wire count was provided, so a standard balanced wire-count assumption was used.',

      ],

    });

  }

  if (count <= 12) {

    return buildResult({

      id: 'low-wire-count',

      label: `${count}-Strand`,

      profile: {

        attack: 5.4,

        sustain: 4.9,

        warmth: 4.9,

        projection: 5.1,

        brightness: 5.3,

        sensitivity: 4.8,

        control: 5.8,

      },

      confidence01: 0.7,

      reasons: [

        'Lower strand counts are treated as drier, crisper, and more contained.',

        'They usually feel more deliberate and less saturated, with less low-level wire wash.',

      ],

    });

  }

  if (count <= 16) {

    return buildResult({

      id: 'medium-low-wire-count',

      label: `${count}-Strand`,

      profile: {

        attack: 5.2,

        sustain: 5.0,

        warmth: 5.0,

        projection: 5.0,

        brightness: 5.1,

        sensitivity: 5.0,

        control: 5.4,

      },

      confidence01: 0.72,

      reasons: [

        'Medium-low strand counts are treated as a slightly tighter and cleaner snare-system choice.',

      ],

    });

  }

  if (count <= 20) {

    return buildResult({

      id: 'standard-wire-count',

      label: `${count}-Strand`,

      profile: {

        attack: 5.0,

        sustain: 5.0,

        warmth: 5.0,

        projection: 5.0,

        brightness: 5.0,

        sensitivity: 5.2,

        control: 5.1,

      },

      confidence01: 0.76,

      reasons: [

        '20-strand style wire counts are treated as a practical balanced baseline in the Ober model.',

      ],

    });

  }

  if (count <= 24) {

    return buildResult({

      id: 'medium-high-wire-count',

      label: `${count}-Strand`,

      profile: {

        attack: 4.8,

        sustain: 5.1,

        warmth: 5.1,

        projection: 4.9,

        brightness: 4.9,

        sensitivity: 5.5,

        control: 4.9,

      },

      confidence01: 0.72,

      reasons: [

        'Higher strand counts are treated as more eager and more saturated in response.',

        'They usually increase sensitivity while giving up a little dryness and separation.',

      ],

    });

  }

  return buildResult({

    id: 'high-wire-count',

    label: `${count}-Strand`,

    profile: {

      attack: 4.7,

      sustain: 5.1,

      warmth: 5.2,

      projection: 4.8,

      brightness: 4.8,

      sensitivity: 5.9,

      control: 4.6,

    },

    confidence01: 0.7,

    reasons: [

      'Very high strand counts are treated as more saturated and highly reactive.',

      'They usually favor sensitivity and wire presence over dry control.',

    ],

  });

}

export function deriveSnareWireStyleHeuristicProfile(input) {

  const value = normalizeString(input);

  if (!value) {

    return buildResult({

      id: 'standard-wire-style-default',

      label: 'Standard Wire Style',

      profile: {

        attack: 5.0,

        sustain: 5.0,

        warmth: 5.0,

        projection: 5.0,

        brightness: 5.0,

        sensitivity: 5.1,

        control: 5.1,

      },

      confidence01: 0.54,

      reasons: [

        'No snare wire style was provided, so a standard balanced wire-style assumption was used.',

      ],

    });

  }

  if (

    value.includes('dry') ||

    value.includes('controlled') ||

    value.includes('crisp')

  ) {

    return buildResult({

      id: 'dry-wire-style',

      label: 'Dry / Controlled Wire Style',

      profile: {

        attack: 5.5,

        sustain: 4.8,

        warmth: 4.9,

        projection: 5.1,

        brightness: 5.2,

        sensitivity: 4.9,

        control: 5.9,

      },

      confidence01: 0.72,

      reasons: [

        'Dry or controlled wire styles are treated as cleaner and more contained.',

        'They usually support a tidier snare envelope with stronger discipline and less wash.',

      ],

    });

  }

  if (

    value.includes('open') ||

    value.includes('wide') ||

    value.includes('sensitive') ||

    value.includes('saturated')

  ) {

    return buildResult({

      id: 'open-wire-style',

      label: 'Open / Sensitive Wire Style',

      profile: {

        attack: 4.8,

        sustain: 5.2,

        warmth: 5.2,

        projection: 4.9,

        brightness: 4.9,

        sensitivity: 5.8,

        control: 4.7,

      },

      confidence01: 0.72,

      reasons: [

        'More open or sensitive wire styles are treated as more reactive and more saturated.',

        'They usually increase low-dynamic snare presence while reducing containment.',

      ],

    });

  }

  return buildResult({

    id: 'standard-wire-style',

    label: input || 'Standard Wire Style',

    profile: {

      attack: 5.0,

      sustain: 5.0,

      warmth: 5.0,

      projection: 5.0,

      brightness: 5.0,

      sensitivity: 5.1,

      control: 5.1,

    },

    confidence01: 0.62,

    reasons: [

      'This wire style was interpreted as a standard balanced snare-wire behavior.',

    ],

  });

}

export function deriveSnareWireMaterialHeuristicProfile(input) {

  const value = normalizeString(input);

  if (!value) {

    return buildResult({

      id: 'steel-wire-default',

      label: 'Steel Wire',

      profile: {

        attack: 5.1,

        sustain: 5.0,

        warmth: 4.9,

        projection: 5.0,

        brightness: 5.1,

        sensitivity: 5.1,

        control: 5.1,

      },

      confidence01: 0.58,

      reasons: [

        'No snare wire material was provided, so a standard steel-wire assumption was used.',

      ],

    });

  }

  if (value.includes('brass')) {

    return buildResult({

      id: 'brass-wire',

      label: 'Brass Wire',

      profile: {

        attack: 4.9,

        sustain: 5.1,

        warmth: 5.4,

        projection: 4.9,

        brightness: 4.7,

        sensitivity: 5.3,

        control: 4.9,

      },

      confidence01: 0.68,

      reasons: [

        'Brass wires are treated as slightly warmer and less top-forward than steel in the Ober model.',

      ],

    });

  }

  return buildResult({

    id: 'steel-wire',

    label: input || 'Steel Wire',

    profile: {

      attack: 5.1,

      sustain: 5.0,

      warmth: 4.9,

      projection: 5.0,

      brightness: 5.1,

      sensitivity: 5.1,

      control: 5.1,

    },

    confidence01: 0.66,

    reasons: [

      'Steel wires are treated as the balanced baseline with slightly more crispness and edge than warmer alternatives.',

    ],

  });

}

function averageProfiles(profiles = []) {

  const valid = profiles.filter(Boolean);

  if (!valid.length) return DEFAULT_PROFILE;

  const axes = Object.keys(DEFAULT_PROFILE);

  return axes.reduce((acc, axis) => {

    const avg =

      valid.reduce((sum, profile) => sum + Number(profile?.[axis] ?? 5), 0) /

      valid.length;

    acc[axis] = round2(avg);

    return acc;

  }, {});

}

export function deriveSnareResponseHeuristicProfile({

  snareBedDepth,

  snareSideHead,

  snareWireCount,

  snareWireStyle,

  snareWireMaterial,

} = {}) {

  const parts = [

    deriveSnareBedHeuristicProfile(snareBedDepth),

    deriveSnareSideHeadHeuristicProfile(snareSideHead),

    deriveSnareWireCountHeuristicProfile(snareWireCount),

    deriveSnareWireStyleHeuristicProfile(snareWireStyle),

    deriveSnareWireMaterialHeuristicProfile(snareWireMaterial),

  ];

  const profile = averageProfiles(parts.map((part) => part.profile));

  const confidence01 = round2(

    parts.reduce((sum, part) => sum + Number(part.confidence01 || 0.6), 0) /

      parts.length

  );

  return {

    id: 'composite-snare-response',

    label: 'Composite Snare Response',

    profile,

    confidence01,

    confidencePercent: Math.round(confidence01 * 100),

    reasons: [

      'This composite snare-response profile is a weighted Ober heuristic built from the snare bed, snare-side head, wire count, wire style, and wire material.',

      'It is meant to describe snare-system behavior at a high level, not predict exact acoustic output.',

    ],

    components: {

      snareBedDepth: parts[0],

      snareSideHead: parts[1],

      snareWireCount: parts[2],

      snareWireStyle: parts[3],

      snareWireMaterial: parts[4],

    },

  };

}

export default deriveSnareResponseHeuristicProfile;