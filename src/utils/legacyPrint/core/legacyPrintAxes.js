// src/utils/legacyPrint/core/legacyPrintAxes.js

export const LEGACYPRINT_AXIS_KEYS = Object.freeze([

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

]);

export const LEGACYPRINT_AXIS_META = Object.freeze({

  attack: {

    key: 'attack',

    label: 'Attack',

    lowLabel: 'Rounded',

    highLabel: 'Immediate',

    subLabel: 'Quickness',

    description: 'How quickly the drum answers the stick.',

  },

  brightness: {

    key: 'brightness',

    label: 'Brightness',

    lowLabel: 'Dark',

    highLabel: 'Bright',

    subLabel: 'Top End',

    description: 'How much upper-edge clarity and crispness is present.',

  },

  projection: {

    key: 'projection',

    label: 'Projection',

    lowLabel: 'Close',

    highLabel: 'Forward',

    subLabel: 'Throw',

    description: 'How strongly the drum moves outward into the room.',

  },

  sustain: {

    key: 'sustain',

    label: 'Sustain',

    lowLabel: 'Short',

    highLabel: 'Open',

    subLabel: 'Length',

    description: 'How long the note remains after the initial hit.',

  },

  warmth: {

    key: 'warmth',

    label: 'Warmth',

    lowLabel: 'Lean',

    highLabel: 'Warm',

    subLabel: 'Body',

    description: 'How much low-mid weight and wood/body character is present.',

  },

  sensitivity: {

    key: 'sensitivity',

    label: 'Sensitivity',

    lowLabel: 'Forgiving',

    highLabel: 'Responsive',

    subLabel: 'Response',

    description: 'How easily the drum responds to lighter touch and nuance.',

  },

  control: {

    key: 'control',

    label: 'Control',

    lowLabel: 'Open',

    highLabel: 'Composed',

    subLabel: 'Focus',

    description: 'How organized, contained, and usable the note shape feels.',

  },

});

export const LEGACYPRINT_CENTER_SCORE = 5;

export function clampLegacyPrintScore(value, min = 1, max = 10) {

  const num = Number(value);

  if (!Number.isFinite(num)) return LEGACYPRINT_CENTER_SCORE;

  return Math.max(min, Math.min(max, num));

}

export function roundLegacyPrintScore(value) {

  return Math.round(Number(value || 0) * 100) / 100;

}

export function normalizeLegacyPrintProfile(profile = {}) {

  return LEGACYPRINT_AXIS_KEYS.reduce((acc, axis) => {

    acc[axis] = roundLegacyPrintScore(clampLegacyPrintScore(profile?.[axis]));

    return acc;

  }, {});

}

export function getLegacyPrintAxisDelta(profile = {}, axis) {

  return roundLegacyPrintScore(

    Number(profile?.[axis] ?? LEGACYPRINT_CENTER_SCORE) -

      LEGACYPRINT_CENTER_SCORE

  );

}

export function getLegacyPrintProfileMovement(profile = {}) {

  return roundLegacyPrintScore(

    LEGACYPRINT_AXIS_KEYS.reduce((sum, axis) => {

      return sum + Math.abs(getLegacyPrintAxisDelta(profile, axis));

    }, 0)

  );

}

export function getLegacyPrintProfileSpread(profile = {}) {

  const values = LEGACYPRINT_AXIS_KEYS.map((axis) =>

    Number(profile?.[axis] ?? LEGACYPRINT_CENTER_SCORE)

  );

  return roundLegacyPrintScore(Math.max(...values) - Math.min(...values));

}

export function getSortedLegacyPrintAxes(profile = {}) {

  return [...LEGACYPRINT_AXIS_KEYS].sort((a, b) => {

    return (

      Number(profile?.[b] ?? LEGACYPRINT_CENTER_SCORE) -

      Number(profile?.[a] ?? LEGACYPRINT_CENTER_SCORE)

    );

  });

}