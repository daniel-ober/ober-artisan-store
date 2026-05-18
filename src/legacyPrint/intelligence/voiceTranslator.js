/**

 * Voice Translator Engine

 * Converts human language → 7-node voice profile

 */

const KEYWORD_MAP = {

  warm: { warmth: 0.3 },

  warmth: { warmth: 0.35 },

  dark: { brightness: -0.3, warmth: 0.2 },

  bright: { brightness: 0.4 },

  crisp: { attack: 0.35, brightness: 0.25 },

  dry: { sustain: -0.4, control: 0.25 },

  controlled: { control: 0.4 },

  loose: { control: -0.3 },

  punchy: { attack: 0.4, projection: 0.3 },

  vintage: { warmth: 0.25, sustain: 0.2, brightness: -0.15 },

  modern: { attack: 0.2, brightness: 0.15, control: 0.15 },

  open: { sustain: 0.35 },

  tight: { control: 0.3, sustain: -0.25 },

  sensitive: { sensitivity: 0.4 },

  aggressive: { attack: 0.35, projection: 0.3 },

};

const DEFAULT = {

  attack: 0.5,

  brightness: 0.5,

  projection: 0.5,

  sustain: 0.5,

  warmth: 0.5,

  sensitivity: 0.5,

  control: 0.5,

};

export function translateVoiceIntent(text = '') {

  const words = text.toLowerCase().split(/\s+/);

  let result = { ...DEFAULT };

  for (const word of words) {

    const match = KEYWORD_MAP[word];

    if (!match) continue;

    for (const [key, value] of Object.entries(match)) {

      result[key] = clamp(result[key] + value);

    }

  }

  return {

    intent: text,

    voice: normalize(result),

  };

}

/**

 * keeps values in range 0–1

 */

function clamp(val) {

  return Math.max(0, Math.min(1, val));

}

/**

 * re-centers slightly toward 0.5 for stability

 */

function normalize(obj) {

  const out = {};

  for (const key of Object.keys(obj)) {

    out[key] = round(obj[key]);

  }

  return out;

}

function round(n) {

  return Math.round(n * 1000) / 1000;

}