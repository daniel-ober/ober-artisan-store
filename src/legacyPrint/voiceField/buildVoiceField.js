import { compareVoices } from '../intelligence/compareVoices.js';

/**

 * Converts all drums into a spatial "sound field"

 */

export function buildVoiceField({ targetVoice, candidates = [] }) {

  if (!targetVoice || !candidates.length) {

    return [];

  }

  return candidates.map((drum) => {

    const voice = drum.voice || drum.legacyPrintVoice || {};

    const comparison = compareVoices(targetVoice, voice);

    // 🧭 convert similarity → spatial radius

    const distance = comparison.totalDistance;

    const similarity = comparison.similarityScore;

    // normalize into 0–1 space radius

    const radius = Math.min(1, distance);

    return {

      drumId: drum.id,

      companyName: drum.companyName,

      modelName: drum.modelName,

      voice,

      // CORE FIELD VALUES

      similarity,

      distance,

      // 🌌 POSITION IN SOUND FIELD

      x: voice.attack ?? 0,

      y: voice.brightness ?? 0,

      z: voice.warmth ?? 0,

      // 🧲 GRAVITY STRENGTH (how strongly it pulls selection)

      gravity: similarity,

      // visual scaling hint

      size: 6 + similarity * 18,

      raw: drum,

    };

  });

}