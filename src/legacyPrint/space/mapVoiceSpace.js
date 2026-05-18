import { compareVoices } from '../intelligence/compareVoices.js';

/**

 * Converts a voice profile into 2D coordinates

 * This creates the "sound landscape"

 */

export function mapVoiceTo2D(voice) {

  if (!voice) {

    return { x: 0, y: 0 };

  }

  const {

    attack = 0.5,

    brightness = 0.5,

    sustain = 0.5,

    warmth = 0.5,

    control = 0.5,

  } = voice;

  /**

   * X-axis = brightness vs warmth

   * Y-axis = attack vs sustain

   */

  const x = (brightness - warmth) * 1.2;

  const y = (attack - sustain) * 1.2;

  return { x, y };

}