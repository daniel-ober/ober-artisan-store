import { mapVoiceTo2D } from './mapVoiceSpace.js';

/**

 * Turns drum dataset into a spatial sound map

 */

export function buildVoiceLandscape(drumList = []) {

  return drumList.map((drum) => {

    const voice = drum.voice || drum.legacyPrintVoice || {};

    const pos = mapVoiceTo2D(voice);

    return {

      id: drum.id,

      name: drum.modelName,

      company: drum.companyName,

      x: pos.x,

      y: pos.y,

      voice,

    };

  });

}