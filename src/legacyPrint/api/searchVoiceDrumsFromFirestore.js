import { searchVoiceDrums } from './searchVoiceDrums.js';

/**

 * Firestore-powered Voice Search

 * Production entry point

 */

export async function searchVoiceDrumsFromFirestore({

  firestore,

  query,

  limit = 10,

}) {

  if (!firestore) {

    return {

      success: false,

      message: 'Missing firestore instance',

      results: [],

    };

  }

  if (!query) {

    return {

      success: false,

      message: 'Missing query',

      results: [],

    };

  }

  // STEP 1 — fetch ALL voice profiles

  const snapshot = await firestore

    .collection('legacyPrintVoiceProfiles')

    .get();

  if (snapshot.empty) {

    return {

      success: false,

      message: 'No voice profiles found',

      results: [],

    };

  }

  // STEP 2 — normalize candidates (NOW INDEX-AWARE)

  const candidates = snapshot.docs.map((doc) => {

    const data = doc.data();

    return {

      id: doc.id,

      voice: data.voice || {},

      // NEW: optional precomputed index

      voiceIndex: data.voiceIndex || null,

      modelName: data.modelName,

      companyName: data.companyName,

    };

  });

  // STEP 3 — run core search engine

  const result = await searchVoiceDrums({

    query,

    candidates,

    limit,

  });

  // STEP 4 — return enriched response

  return {

    ...result,

    source: 'firestore',

    totalCandidates: candidates.length,

  };

}