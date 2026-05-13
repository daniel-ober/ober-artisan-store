// src/data/legacyPrint/tuningProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * LegacyPrint tuning profiles

 *

 * This keeps front-end tuning simple:

 * - loose

 * - medium

 * - tight

 *

 * But still gives the engine room to support:

 * - fundamental frequency windows

 * - nearest note windows

 * - batter / resonant relationship

 * - snare-side behavior

 */

export const TUNING_TARGETS = {

  loose: {

    label: 'Loose',

    userFacingLabel: 'Loose / Low',

    description:

      'Lower tuning usually gives more body, lower pitch, longer bloom, and a softer front edge.',

    nodeBias: {

      attack: -0.06,

      brightness: -0.08,

      projection: -0.03,

      sustain: 0.08,

      warmth: 0.1,

      sensitivity: -0.02,

      control: -0.05,

    },

  },

  medium: {

    label: 'Medium',

    userFacingLabel: 'Medium / Balanced',

    description:

      'Medium tuning is the broad reference range: balanced body, response, projection, and control.',

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

  tight: {

    label: 'Tight',

    userFacingLabel: 'Tight / High',

    description:

      'Higher tuning usually gives quicker response, more pitch clarity, more cut, and a more controlled note shape.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.1,

      projection: 0.04,

      sustain: -0.06,

      warmth: -0.08,

      sensitivity: 0.04,

      control: 0.06,

    },

  },

};

export const BATTER_RESO_RELATIONSHIPS = {

  balanced: {

    label: 'Balanced',

    description:

      'Batter and resonant heads are tuned close enough together to keep the drum centered and predictable.',

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

  resoHigher: {

    label: 'Resonant Higher',

    description:

      'A higher resonant head can increase response, lift pitch clarity, and tighten the note shape.',

    nodeBias: {

      attack: 0.03,

      brightness: 0.04,

      projection: 0.02,

      sustain: -0.02,

      warmth: -0.03,

      sensitivity: 0.05,

      control: 0.04,

    },

  },

  resoLower: {

    label: 'Resonant Lower',

    description:

      'A lower resonant head can make the drum feel deeper, broader, and more open, but less immediately controlled.',

    nodeBias: {

      attack: -0.03,

      brightness: -0.03,

      projection: -0.01,

      sustain: 0.05,

      warmth: 0.05,

      sensitivity: -0.02,

      control: -0.04,

    },

  },

  wideSpread: {

    label: 'Wide Batter / Reso Spread',

    description:

      'A wider tuning spread creates more character and pitch movement, but can reduce center and predictability.',

    nodeBias: {

      attack: 0.01,

      brightness: 0.02,

      projection: 0,

      sustain: 0.04,

      warmth: 0.02,

      sensitivity: 0.01,

      control: -0.06,

    },

  },

};

export const DRUM_TYPE_TUNING_WINDOWS = {

  snare: {

    label: 'Snare Drum',

    defaultTarget: 'medium',

    suggestedFundamentalHz: {

      loose: {

        min: 120,

        max: 165,

      },

      medium: {

        min: 165,

        max: 220,

      },

      tight: {

        min: 220,

        max: 330,

      },

    },

  },

  rackTom: {

    label: 'Rack Tom',

    defaultTarget: 'medium',

    suggestedFundamentalHz: {

      loose: {

        min: 90,

        max: 130,

      },

      medium: {

        min: 130,

        max: 180,

      },

      tight: {

        min: 180,

        max: 240,

      },

    },

  },

  floorTom: {

    label: 'Floor Tom',

    defaultTarget: 'medium',

    suggestedFundamentalHz: {

      loose: {

        min: 55,

        max: 85,

      },

      medium: {

        min: 85,

        max: 125,

      },

      tight: {

        min: 125,

        max: 170,

      },

    },

  },

  bassDrum: {

    label: 'Bass Drum',

    defaultTarget: 'medium',

    suggestedFundamentalHz: {

      loose: {

        min: 35,

        max: 50,

      },

      medium: {

        min: 50,

        max: 70,

      },

      tight: {

        min: 70,

        max: 95,

      },

    },

  },

};

export const SNARE_TUNING_SIZE_WINDOWS = {

  '12': {

    loose: {

      min: 155,

      max: 195,

      nearestNoteWindow: 'D#3–G3',

    },

    medium: {

      min: 195,

      max: 255,

      nearestNoteWindow: 'G3–B3',

    },

    tight: {

      min: 255,

      max: 340,

      nearestNoteWindow: 'C4–F4',

    },

  },

  '13': {

    loose: {

      min: 135,

      max: 175,

      nearestNoteWindow: 'C#3–F3',

    },

    medium: {

      min: 175,

      max: 235,

      nearestNoteWindow: 'F3–A#3',

    },

    tight: {

      min: 235,

      max: 315,

      nearestNoteWindow: 'A#3–D#4',

    },

  },

  '14': {

    loose: {

      min: 103,

      max: 139,

      nearestNoteWindow: 'G#2–C#3',

    },

    medium: {

      min: 139,

      max: 210,

      nearestNoteWindow: 'C#3–G#3',

    },

    tight: {

      min: 210,

      max: 300,

      nearestNoteWindow: 'G#3–D4',

    },

  },

};

export const TOM_TUNING_SIZE_WINDOWS = {

  '6': {

    loose: {

      min: 165,

      max: 210,

      nearestNoteWindow: 'E3–G#3',

    },

    medium: {

      min: 210,

      max: 270,

      nearestNoteWindow: 'G#3–C#4',

    },

    tight: {

      min: 270,

      max: 340,

      nearestNoteWindow: 'C#4–F4',

    },

  },

  '8': {

    loose: {

      min: 130,

      max: 165,

      nearestNoteWindow: 'C3–E3',

    },

    medium: {

      min: 165,

      max: 220,

      nearestNoteWindow: 'E3–A3',

    },

    tight: {

      min: 220,

      max: 285,

      nearestNoteWindow: 'A3–C#4',

    },

  },

  '10': {

    loose: {

      min: 105,

      max: 140,

      nearestNoteWindow: 'G#2–C#3',

    },

    medium: {

      min: 140,

      max: 190,

      nearestNoteWindow: 'C#3–F#3',

    },

    tight: {

      min: 190,

      max: 245,

      nearestNoteWindow: 'F#3–B3',

    },

  },

  '12': {

    loose: {

      min: 85,

      max: 115,

      nearestNoteWindow: 'F2–A#2',

    },

    medium: {

      min: 115,

      max: 160,

      nearestNoteWindow: 'A#2–D#3',

    },

    tight: {

      min: 160,

      max: 210,

      nearestNoteWindow: 'D#3–G#3',

    },

  },

  '13': {

    loose: {

      min: 75,

      max: 105,

      nearestNoteWindow: 'D#2–G#2',

    },

    medium: {

      min: 105,

      max: 145,

      nearestNoteWindow: 'G#2–D3',

    },

    tight: {

      min: 145,

      max: 190,

      nearestNoteWindow: 'D3–F#3',

    },

  },

  '14': {

    loose: {

      min: 65,

      max: 90,

      nearestNoteWindow: 'C2–F#2',

    },

    medium: {

      min: 90,

      max: 125,

      nearestNoteWindow: 'F#2–B2',

    },

    tight: {

      min: 125,

      max: 165,

      nearestNoteWindow: 'B2–E3',

    },

  },

  '16': {

    loose: {

      min: 50,

      max: 70,

      nearestNoteWindow: 'G#1–C#2',

    },

    medium: {

      min: 70,

      max: 100,

      nearestNoteWindow: 'C#2–G2',

    },

    tight: {

      min: 100,

      max: 135,

      nearestNoteWindow: 'G2–C3',

    },

  },

  '18': {

    loose: {

      min: 42,

      max: 60,

      nearestNoteWindow: 'F1–A#1',

    },

    medium: {

      min: 60,

      max: 85,

      nearestNoteWindow: 'A#1–F2',

    },

    tight: {

      min: 85,

      max: 115,

      nearestNoteWindow: 'F2–A#2',

    },

  },

};

export const BASS_DRUM_TUNING_SIZE_WINDOWS = {

  '18': {

    loose: {

      min: 42,

      max: 55,

      nearestNoteWindow: 'F1–A1',

    },

    medium: {

      min: 55,

      max: 75,

      nearestNoteWindow: 'A1–D#2',

    },

    tight: {

      min: 75,

      max: 95,

      nearestNoteWindow: 'D#2–G2',

    },

  },

  '20': {

    loose: {

      min: 36,

      max: 50,

      nearestNoteWindow: 'D2–G1',

    },

    medium: {

      min: 50,

      max: 68,

      nearestNoteWindow: 'G1–C#2',

    },

    tight: {

      min: 68,

      max: 88,

      nearestNoteWindow: 'C#2–F2',

    },

  },

  '22': {

    loose: {

      min: 32,

      max: 45,

      nearestNoteWindow: 'C1–F#1',

    },

    medium: {

      min: 45,

      max: 62,

      nearestNoteWindow: 'F#1–B1',

    },

    tight: {

      min: 62,

      max: 82,

      nearestNoteWindow: 'B1–E2',

    },

  },

  '24': {

    loose: {

      min: 28,

      max: 40,

      nearestNoteWindow: 'A0–D#1',

    },

    medium: {

      min: 40,

      max: 56,

      nearestNoteWindow: 'D#1–A1',

    },

    tight: {

      min: 56,

      max: 75,

      nearestNoteWindow: 'A1–D#2',

    },

  },

};

const normalizeText = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase();

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

function sumNodeBias(...biasObjects) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = biasObjects.reduce((sum, bias) => {

      return sum + Number(bias?.[nodeKey] || 0);

    }, 0);

    return acc;

  }, {});

}

export function getTuningTargetKey(value = 'medium') {

  const normalized = normalizeText(value);

  if (

    normalized.includes('loose') ||

    normalized.includes('low') ||

    normalized.includes('fat') ||

    normalized.includes('deep')

  ) {

    return 'loose';

  }

  if (

    normalized.includes('tight') ||

    normalized.includes('high') ||

    normalized.includes('cranked') ||

    normalized.includes('piccolo')

  ) {

    return 'tight';

  }

  return 'medium';

}

export function getBatterResoRelationshipKey(value = 'balanced') {

  const normalized = normalizeText(value);

  if (

    normalized.includes('reso higher') ||

    normalized.includes('resonant higher') ||

    normalized.includes('bottom higher')

  ) {

    return 'resoHigher';

  }

  if (

    normalized.includes('reso lower') ||

    normalized.includes('resonant lower') ||

    normalized.includes('bottom lower')

  ) {

    return 'resoLower';

  }

  if (

    normalized.includes('wide') ||

    normalized.includes('spread') ||

    normalized.includes('interval')

  ) {

    return 'wideSpread';

  }

  return 'balanced';

}

function getRoundedSizeKey(width) {

  const value = Number(width);

  if (!Number.isFinite(value)) return null;

  return String(Math.round(value));

}

export function getTuningWindow({

  drumType = 'snare',

  width = 14,

  tuningTarget = 'medium',

} = {}) {

  const targetKey = getTuningTargetKey(tuningTarget);

  const sizeKey = getRoundedSizeKey(width);

  if (drumType === 'snare') {

    return (

      SNARE_TUNING_SIZE_WINDOWS[sizeKey]?.[targetKey] ||

      SNARE_TUNING_SIZE_WINDOWS['14'][targetKey]

    );

  }

  if (drumType === 'rackTom' || drumType === 'floorTom') {

    return (

      TOM_TUNING_SIZE_WINDOWS[sizeKey]?.[targetKey] ||

      DRUM_TYPE_TUNING_WINDOWS[drumType]?.suggestedFundamentalHz?.[targetKey]

    );

  }

  if (drumType === 'bassDrum') {

    return (

      BASS_DRUM_TUNING_SIZE_WINDOWS[sizeKey]?.[targetKey] ||

      DRUM_TYPE_TUNING_WINDOWS.bassDrum.suggestedFundamentalHz[targetKey]

    );

  }

  return DRUM_TYPE_TUNING_WINDOWS.snare.suggestedFundamentalHz[targetKey];

}

export function getFrequencyPositionInWindow(frequencyHz, window = {}) {

  const frequency = Number(frequencyHz);

  const min = Number(window.min);

  const max = Number(window.max);

  if (

    !Number.isFinite(frequency) ||

    !Number.isFinite(min) ||

    !Number.isFinite(max) ||

    max <= min

  ) {

    return null;

  }

  return Math.max(0, Math.min(1, (frequency - min) / (max - min)));

}

export function buildFrequencyNodeBias({

  frequencyHz = null,

  window = null,

} = {}) {

  const position = getFrequencyPositionInWindow(frequencyHz, window);

  if (position == null) {

    return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

      acc[nodeKey] = 0;

      return acc;

    }, {});

  }

  const centered = position - 0.5;

  return {

    attack: round2(centered * 0.08),

    brightness: round2(centered * 0.1),

    projection: round2(centered * 0.04),

    sustain: round2(centered * -0.05),

    warmth: round2(centered * -0.08),

    sensitivity: round2(Math.abs(centered) <= 0.18 ? 0.02 : -0.02),

    control: round2(Math.abs(centered) <= 0.22 ? 0.03 : -0.02),

  };

}

export function buildTuningRead({

  drumType = 'snare',

  width = 14,

  tuningTarget = 'medium',

  batterResoRelationship = 'balanced',

  fundamentalHz = null,

} = {}) {

  const targetKey = getTuningTargetKey(tuningTarget);

  const relationshipKey = getBatterResoRelationshipKey(batterResoRelationship);

  const targetProfile = TUNING_TARGETS[targetKey];

  const relationshipProfile = BATTER_RESO_RELATIONSHIPS[relationshipKey];

  const tuningWindow = getTuningWindow({

    drumType,

    width,

    tuningTarget: targetKey,

  });

  const frequencyBias = buildFrequencyNodeBias({

    frequencyHz: fundamentalHz,

    window: tuningWindow,

  });

  const nodeBias = sumNodeBias(

    targetProfile?.nodeBias,

    relationshipProfile?.nodeBias,

    frequencyBias

  );

  const frequencyText =

    Number.isFinite(Number(fundamentalHz)) && tuningWindow

      ? ` Current Range ${tuningWindow.min}–${tuningWindow.max} Hz${

          tuningWindow.nearestNoteWindow

            ? ` ${tuningWindow.nearestNoteWindow}`

            : ''

        }.`

      : tuningWindow

        ? ` Suggested Range ${tuningWindow.min}–${tuningWindow.max} Hz${

            tuningWindow.nearestNoteWindow

              ? ` ${tuningWindow.nearestNoteWindow}`

              : ''

          }.`

        : '';

  return {

    drumType,

    width: Number(width),

    targetKey,

    target: targetProfile,

    relationshipKey,

    relationship: relationshipProfile,

    fundamentalHz: Number.isFinite(Number(fundamentalHz))

      ? Number(fundamentalHz)

      : null,

    tuningWindow,

    nodeBias,

    summary: `${targetProfile.userFacingLabel} tuning. ${targetProfile.description}${frequencyText}`,

  };

}

export default TUNING_TARGETS;