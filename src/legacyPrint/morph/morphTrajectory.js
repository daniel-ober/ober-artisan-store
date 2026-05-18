import { morphVoice } from './morphVoice.js';

/**

 * Generates a full morph path between two voices

 * returns array of intermediate states

 */

export function buildMorphTrajectory(voiceA, voiceB, steps = 20) {

  const path = [];

  for (let i = 0; i <= steps; i++) {

    const t = i / steps;

    path.push({

      t,

      voice: morphVoice(voiceA, voiceB, t),

    });

  }

  return path;

}