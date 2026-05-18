import { compareVoices } from '../intelligence/compareVoices.js';

/**

 * Morph between two drum voices

 * t = 0 → A

 * t = 1 → B

 */

export function morphVoice(voiceA, voiceB, t = 0.5) {

  const keys = [

    'attack',

    'brightness',

    'projection',

    'sustain',

    'warmth',

    'sensitivity',

    'control',

  ];

  const result = {};

  keys.forEach((key) => {

    const a = voiceA?.[key] ?? 0.5;

    const b = voiceB?.[key] ?? 0.5;

    result[key] = a + (b - a) * t;

  });

  return result;

}