import { compareVoices } from './compareVoices.js';

/**

 * Voice Finder Engine

 * Turns a target voice profile into ranked drum matches

 */

export function findClosestVoices({

  targetVoice,

  candidates = [],

  limit = 10,

}) {

  if (!targetVoice || !candidates.length) {

    return {

      success: false,

      message: 'Missing targetVoice or candidates',

      results: [],

    };

  }

  const scored = candidates.map((drum) => {

    const voice = drum?.voice || drum?.legacyPrintVoice || {};

    const comparison = compareVoices(targetVoice, voice);

    return {

      drumId: drum.id,

      modelName: drum.modelName,

      companyName: drum.companyName,

      similarityScore: comparison.similarityScore,

      totalDistance: comparison.totalDistance,

      deltas: comparison.deltas,

      summary: comparison.summary,

    };

  });

  const sorted = scored

    .sort((a, b) => b.similarityScore - a.similarityScore)

    .slice(0, limit);

  return {

    success: true,

    count: sorted.length,

    results: sorted,

  };

}