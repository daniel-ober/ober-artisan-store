
import { useState, useMemo } from 'react';

import { searchVoiceDrumsFromFirestore } from '../api/searchVoiceDrumsFromFirestore.js';

import { compareVoices } from '../intelligence/compareVoices.js';

const discoveryPreviewPacket = require('../reviewPlans/snare-discovery-packet-api-preview-v01.json');

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

const REFERENCE_TO_PREVIEW_MATCH = {

  heritage: 'acrolite',

  'black-beauty': 'black-beauty',

  brooklyn: 'true-cast',

};

const normalizeReferenceSearchTerm = selectedReferenceId =>

  REFERENCE_TO_PREVIEW_MATCH[selectedReferenceId] || selectedReferenceId || 'acrolite';

const getPreviewExamplePacket = (previewPacket, selectedReferenceId) => {

  const examples = previewPacket?.examples || [];

  const searchTerm = normalizeReferenceSearchTerm(selectedReferenceId);

  const found =

    examples.find(example => {

      const packet = example.packet || example.result?.packet;

      const drum = packet?.target?.drum || {};

      const haystack = [

        example.key,

        example.snareReferenceId,

        drum.id,

        drum.company,

        drum.model,

        drum.size

      ]

        .filter(Boolean)

        .join(' ')

        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());

    }) || examples[0];

  return found?.packet || found?.result?.packet || null;

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

const buildLocalDiscoveryViewModel = selectedReferenceId => {

  const packet = getPreviewExamplePacket(discoveryPreviewPacket, selectedReferenceId);

  if (!packet) {

    return buildSnareDiscoveryViewModel({

      status: 'idle',

      packet: null,

      error: 'No local preview packet found.',

    });

  }

  return buildSnareDiscoveryViewModel({

    status: 'ready',

    snareReferenceId: packet.target?.drum?.id || null,

    packet,

    error: null,

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

  const [anchorDrum, setAnchorDrum] = useState(null);

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  const discoveryViewModel = useMemo(

    () => buildLocalDiscoveryViewModel(selectedReferenceId),

    [selectedReferenceId]

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

    loading,

    anchorDrum,

    setAsAnchor,

    compareA,

    setCompareA,

    compareB,

    setCompareB,

    compareMode,

  };

}

