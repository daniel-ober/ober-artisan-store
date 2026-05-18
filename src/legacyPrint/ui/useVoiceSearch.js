import { useState, useEffect } from 'react';

import { searchVoiceDrumsFromFirestore } from '../api/searchVoiceDrumsFromFirestore.js';

/**

 * Live Voice Search Hook

 * Powers real-time drum search UI

 */

export function useVoiceSearch(firestore, initialQuery = '') {

  const [query, setQuery] = useState(initialQuery);

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [targetVoice, setTargetVoice] = useState(null);

  useEffect(() => {

    if (!query || query.length < 2) {

      setResults([]);

      return;

    }

    let active = true;

    const runSearch = async () => {

      setLoading(true);

      const res = await searchVoiceDrumsFromFirestore({

        firestore,

        query,

        limit: 10,

      });

      if (!active) return;

      setResults(res.results || []);

      setTargetVoice(res.targetVoice || null);

      setLoading(false);

    };

    const debounce = setTimeout(runSearch, 250);

    return () => {

      active = false;

      clearTimeout(debounce);

    };

  }, [query, firestore]);

  return {

    query,

    setQuery,

    results,

    loading,

    targetVoice,

  };

}