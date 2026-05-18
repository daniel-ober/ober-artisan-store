import { useState, useMemo } from 'react';

import { searchVoiceDrumsFromFirestore } from '../api/searchVoiceDrumsFromFirestore.js';

import { compareVoices } from '../intelligence/compareVoices.js';

/**

 * Drum Voice Playground Engine

 * Turns search into an interactive sound-shaping system

 */

const DEFAULT_VOICE = {

  attack: 0.5,

  brightness: 0.5,

  projection: 0.5,

  sustain: 0.5,

  warmth: 0.5,

  sensitivity: 0.5,

  control: 0.5,

};

export function useVoicePlayground(firestore) {

  const [query, setQuery] = useState('');

  const [voice, setVoice] = useState(DEFAULT_VOICE);

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [anchorDrum, setAnchorDrum] = useState(null);

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  /**

   * LIVE SEARCH TRIGGER

   */

  const runSearch = async (customVoice = voice) => {

    setLoading(true);

    const res = await searchVoiceDrumsFromFirestore({

      firestore,

      query: query || 'all',

      limit: 12,

    });

    let enriched = res.results || [];

    // STEP — voice bias re-ranking

    enriched = enriched.map((r) => {

      const comparison = compareVoices(customVoice, r.deltas || r.voice || {});

      return {

        ...r,

        similarityScore: comparison.similarityScore,

        deltas: comparison.deltas,

      };

    });

    enriched.sort((a, b) => b.similarityScore - a.similarityScore);

    setResults(enriched);

    setLoading(false);

  };

  /**

   * SLIDER UPDATE → instant re-rank

   */

  const updateVoice = (key, value) => {

    const updated = {

      ...voice,

      [key]: value,

    };

    setVoice(updated);

    runSearch(updated);

  };

  /**

   * SET ANCHOR DRUM (audition mode)

   */

  const setAsAnchor = (drum) => {

    setAnchorDrum(drum);

    setVoice(drum.voice || drum.legacyPrintVoice || DEFAULT_VOICE);

  };

  /**

   * COMPARE MODE

   */

  const compareMode = useMemo(() => {

    if (!compareA || !compareB) return null;

    return compareVoices(

      compareA.voice || {},

      compareB.voice || {}

    );

  }, [compareA, compareB]);

  return {

    query,

    setQuery,

    voice,

    updateVoice,

    results,

    loading,

    anchorDrum,

    setAsAnchor,

    compareA,

    setCompareA,

    compareB,

    setCompareB,

    compareMode,

    runSearch,

  };

}