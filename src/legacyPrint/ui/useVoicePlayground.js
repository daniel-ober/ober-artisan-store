
import { useEffect, useMemo, useState } from 'react';

import { loadSnareDiscoveryPacket } from '../api/loadSnareDiscoveryPacket.js';

import { loadPromotableSnareReferences } from '../api/loadPromotableSnareReferences.js';

import { searchVoiceDrumsFromFirestore } from '../api/searchVoiceDrumsFromFirestore.js';

import { compareVoices } from '../intelligence/compareVoices.js';

const {

  buildSnareDiscoveryViewModel

} = require('../services/snareDiscoveryViewModel.js');

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

const normalizeScore = value => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 0.5;

  return number > 1 ? number / 100 : number;

};

const discoveryMatchToVoiceResult = (match, section) => ({

  id: match.id,

  drumId: match.id,

  companyName: match.company,

  company: match.company,

  modelName: match.model,

  model: match.model,

  modelDetail: match.size,

  size: match.size,

  voice: match.raw?.voiceProfile || {},

  legacyPrintVoice: match.raw?.voiceProfile || {},

  similarityScore: normalizeScore(match.similarity),

  matchScore: normalizeScore(match.similarity),

  summary:

    match.summary?.text ||

    match.summary?.title ||

    match.why ||

    section?.description ||

    '',

  explanation: match.why || section?.description || '',

  discoverySectionKey: section?.key || null,

  discoverySectionLabel: section?.label || null,

  discoveryMatch: match,

});

const buildDiscoveryViewModelFromLoaderState = discoveryState => {

  if (!discoveryState?.packet) {

    return buildSnareDiscoveryViewModel({

      status: discoveryState?.status || 'idle',

      packet: null,

      error: discoveryState?.error || null,

    });

  }

  return buildSnareDiscoveryViewModel({

    status: discoveryState.status || 'ready',

    snareReferenceId:

      discoveryState.snareReferenceId ||

      discoveryState.packet?.target?.drum?.id ||

      null,

    packet: discoveryState.packet,

    metadata: discoveryState.metadata || null,

    error: discoveryState.error || null,

  });

};

const getDefaultDiscoveryResults = discoveryViewModel => {

  const defaultSectionKey = discoveryViewModel?.uiHints?.defaultSimilarSection;

  const preferredSection =

    discoveryViewModel?.recommendedSections?.find(

      section => section.key === defaultSectionKey && section.key !== 'voiceContrast' && section.matches?.length

    ) ||

    discoveryViewModel?.recommendedSections?.find(

      section => section.key !== 'voiceContrast' && section.matches?.length

    ) ||

    discoveryViewModel?.recommendedSections?.find(section => section.matches?.length);

  return (preferredSection?.matches || []).map(match =>

    discoveryMatchToVoiceResult(match, preferredSection)

  );

};

export function useVoicePlayground(firestore, selectedReferenceId = 'heritage') {

  const [query, setQuery] = useState('');

  const [voice, setVoice] = useState(DEFAULT_VOICE);

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [referenceLoading, setReferenceLoading] = useState(false);

  const [referenceOptions, setReferenceOptions] = useState([]);

  const [referenceError, setReferenceError] = useState(null);

  const [discoveryState, setDiscoveryState] = useState({

    status: 'idle',

    source: 'preview',

    snareReferenceId: null,

    packet: null,

    metadata: null,

    error: null,

  });

  const [anchorDrum, setAnchorDrum] = useState(null);

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  useEffect(() => {

    let cancelled = false;

    const loadReferences = async () => {

      setReferenceLoading(true);

      setReferenceError(null);

      try {

        const response = await loadPromotableSnareReferences({

          firestore,

          limit: 120,

        });

        if (!cancelled) {

          setReferenceOptions(response.references || []);

          setReferenceError(response.success ? null : response.message || 'Unable to load snare references.');

        }

      } catch (error) {

        if (!cancelled) {

          setReferenceOptions([]);

          setReferenceError(error?.message || 'Unable to load snare references.');

        }

      } finally {

        if (!cancelled) {

          setReferenceLoading(false);

        }

      }

    };

    loadReferences();

    return () => {

      cancelled = true;

    };

  }, [firestore]);

  useEffect(() => {

    let cancelled = false;

    const loadDiscovery = async () => {

      setDiscoveryLoading(true);

      const loadedState = await loadSnareDiscoveryPacket({

        firestore,

        selectedReferenceId,

        source: 'preview',

      });

      if (!cancelled) {

        setDiscoveryState(loadedState);

        setDiscoveryLoading(false);

      }

    };

    loadDiscovery();

    return () => {

      cancelled = true;

    };

  }, [firestore, selectedReferenceId]);

  const discoveryViewModel = useMemo(

    () => buildDiscoveryViewModelFromLoaderState(discoveryState),

    [discoveryState]

  );

  const discoveryResults = useMemo(

    () => getDefaultDiscoveryResults(discoveryViewModel),

    [discoveryViewModel]

  );

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

    discoveryResults,

    discoveryViewModel,

    discoveryState,

    discoveryLoading,

    referenceOptions,

    referenceLoading,

    referenceError,

    loading: loading || discoveryLoading,

    anchorDrum,

    setAsAnchor,

    compareA,

    setCompareA,

    compareB,

    setCompareB,

    compareMode,

  };

}

