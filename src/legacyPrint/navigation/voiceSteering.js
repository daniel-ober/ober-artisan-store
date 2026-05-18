import { mapVoiceTo2D } from '../space/mapVoiceSpace.js';

/**

 * Convert intent into movement in voice space

 */

export function steerVoice(currentVoice, direction = {}) {

  const voice = { ...currentVoice };

  const {

    brightness = 0,

    warmth = 0,

    attack = 0,

    sustain = 0,

  } = direction;

  return {

    ...voice,

    brightness: clamp(voice.brightness + brightness),

    warmth: clamp(voice.warmth + warmth),

    attack: clamp(voice.attack + attack),

    sustain: clamp(voice.sustain + sustain),

  };

}

function clamp(v) {

  return Math.max(0, Math.min(1, v));

}