import { translateVoiceIntent } from '../intelligence/voiceTranslator.js';

import { findClosestVoices } from '../intelligence/voiceFinder.js';

import { filterCandidatesByIndex } from '../indexing/filterCandidates.js';

/**

 * Natural Language Drum Search API

 * End-to-end: language → index filter → ranking

 */

export async function searchVoiceDrums({

  query,

  candidates = [],

  limit = 10,

}) {

  if (!query) {

    return {

      success: false,

      message: 'Missing search query',

      results: [],

    };

  }

  // STEP 1 — translate language → voice profile

  const translation = translateVoiceIntent(query);

  const targetVoice = translation.voice;

  // STEP 2 — INDEX FILTER (PHASE 15 ACTIVATED)

  const filteredCandidates = filterCandidatesByIndex(

    candidates,

    targetVoice

  );

  // STEP 3 — find closest matches

  const results = findClosestVoices({

    targetVoice,

    candidates: filteredCandidates,

    limit,

  });

  // STEP 4 — enrich results

  const enriched = results.results.map((r) => ({

    ...r,

    intent: translation.intent,

    targetVoice,

    explanation: buildExplanation(r, targetVoice),

  }));

  return {

    success: true,

    query,

    targetVoice,

    count: enriched.length,

    results: enriched,

  };

}

/**

 * Human-readable explanation layer

 */

function buildExplanation(result, targetVoice) {

  const deltas = result.deltas;

  const highlights = Object.entries(deltas)

    .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))

    .slice(0, 3)

    .map(([node, val]) => {

      if (val.delta > 0) {

        return `${node} is higher than target (+${val.delta})`;

      } else {

        return `${node} is lower than target (${val.delta})`;

      }

    });

  return highlights.join(', ');

}