import { mapVoiceTo2D } from '../space/mapVoiceSpace.js';

import { morphVoice } from '../morph/morphVoice.js';

/**

 * Voice Navigation Engine

 * Turns sound space into a navigable system

 */

export function findNearestVoice(targetPoint, drums = []) {

  let closest = null;

  let minDist = Infinity;

  drums.forEach((d) => {

    const voice = d.voice || d.legacyPrintVoice || {};

    const pos = mapVoiceTo2D(voice);

    const dx = pos.x - targetPoint.x;

    const dy = pos.y - targetPoint.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {

      minDist = dist;

      closest = {

        drum: d,

        distance: dist,

        position: pos,

      };

    }

  });

  return closest;

}