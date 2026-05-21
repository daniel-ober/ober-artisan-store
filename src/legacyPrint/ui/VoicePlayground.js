// src/legacyPrint/ui/VoicePlayground.js

import React, { useMemo, useState } from 'react';

import { Zap, SunMedium, Volume2, Waves, Flame, Feather, Crosshair } from 'lucide-react';

import { useVoicePlayground } from './useVoicePlayground.js';

import { VoiceMorphPanel } from './VoiceMorphPanel.js';

import { morphVoice } from '../morph/morphVoice.js';

import VoiceConstellationMap from './VoiceConstellationMap.js';

import './VoicePlayground.css';

const WORKFLOW_MODES = [

  {

    key: 'reference',

    label: 'Reference',

    eyebrow: 'Compare known drums',

    title: 'Reference Match',

    description: 'Anchor the map to a reference voice and explore nearby matches.',

  },

  {

    key: 'shape',

    label: 'Shape',

    eyebrow: 'Sculpt by ear',

    title: 'Shape Your Voice',

    description: 'Adjust the voice characteristics to find matching drums.',

  },

  {

    key: 'build',

    label: 'Build',

    eyebrow: 'Choose physical traits',

    title: 'Build Your Voice',

    description: 'Start with drum construction choices and let the voice map respond.',

  },

];

const READ_MODES = [

  {

    key: 'firstListen',

    label: 'First Listen',

    kicker: 'First Tell',

    description:

      'The fastest audible impression: the traits a drummer is most likely to notice first when the drum speaks.',

  },

  {

    key: 'playerAnalysis',

    label: 'Player Analysis',

    kicker: 'Seven-Node Read',

    description:

      'A practical seven-node read of how the drum behaves under the stick across attack, brightness, projection, sustain, warmth, sensitivity, and control.',

  },

  {

    key: 'legacyprint',

    label: 'LegacyPrint Identity',

    kicker: 'Identity',

    description:

      'The one-of-one voice fingerprint: how this drum’s traits combine into a recognizable acoustic identity.',

  },

];

const VOICE_NODES = [

  {

    key: 'attack',

    label: 'Attack',

    shortLabel: 'Strike',

    Icon: Zap,

    color: '#ff7448',

    description: 'Initial stick contact, immediacy, and front-edge definition.',

  },

  {

    key: 'brightness',

    label: 'Brightness',

    shortLabel: 'Clarity',

    Icon: SunMedium,

    color: '#e7d98f',

    description: 'Upper harmonic clarity, shimmer, and perceived crispness.',

  },

  {

    key: 'projection',

    label: 'Projection',

    shortLabel: 'Carry',

    Icon: Volume2,

    color: '#ffb53a',

    description: 'How strongly the voice carries through the room or mix.',

  },

  {

    key: 'sustain',

    label: 'Sustain',

    shortLabel: 'Bloom',

    Icon: Waves,

    color: '#4d86ff',

    description: 'How long the note blooms after the initial strike.',

  },

  {

    key: 'warmth',

    label: 'Warmth',

    shortLabel: 'Body',

    Icon: Flame,

    color: '#c1682e',

    description: 'Low-mid body, roundness, and perceived fullness.',

  },

  {

    key: 'sensitivity',

    label: 'Sensitivity',

    shortLabel: 'Touch',

    Icon: Feather,

    color: '#68d9df',

    description: 'Response to light touch, ghost notes, and dynamic nuance.',

  },

  {

    key: 'control',

    label: 'Control',

    shortLabel: 'Focus',

    Icon: Crosshair,

    color: '#9e8bff',

    description: 'Focus, containment, dryness, and ease of placement.',

  },

];

const BUILD_OPTIONS = [

  {

    key: 'shell',

    label: 'Shell',

    value: 'Stave Maple',

    note: 'Open, direct, responsive',

  },

  {

    key: 'depth',

    label: 'Depth',

    value: '14 × 6.5',

    note: 'Balanced body and articulation',

  },

  {

    key: 'edge',

    label: 'Bearing Edge',

    value: '45° / Roundover',

    note: 'Attack with softened warmth',

  },

  {

    key: 'hoops',

    label: 'Hoops',

    value: 'Die Cast',

    note: 'Focused control and punch',

  },

];

const REFERENCE_OPTIONS = [

  {

    key: 'ludwig-acrolite',

    snareReferenceId: 'ludwig_acrolite_acrolite-5x14_14x5_metal_aluminum_brushed-aluminum_triple-flanged-steel_lm404_f8e66e46',

    label: 'Ludwig Acrolite',

    detail: '14x5 Aluminum Reference',

    voice: {

      attack: 0.72,

      brightness: 0.66,

      projection: 0.84,

      sustain: 0.58,

      warmth: 0.74,

      sensitivity: 0.7,

      control: 0.72,

    },

  },

  {

    key: 'ludwig-black-beauty',

    snareReferenceId: 'ludwig_1977-ludwig_black-beauty-5x14_14x5_metal_brass_1-2_black-nickel-over-brass_triple-flanged_lb416-era_19292b4b',

    label: 'Ludwig Black Beauty',

    detail: '14x5 Brass Reference',

    voice: {

      attack: 0.78,

      brightness: 0.82,

      projection: 0.86,

      sustain: 0.62,

      warmth: 0.55,

      sensitivity: 0.74,

      control: 0.6,

    },

  },

  {

    key: 'dw-true-cast-bronze',

    snareReferenceId: 'dw-pdp_dw-mfg-true-cast_mfg-true-cast-bell-bronze-14x4_14x4_metal_bronze_35_machined-bronze_true-cast-hoops_8a293c51',

    label: 'DW True-Cast Bronze',

    detail: '14x4 Bell Bronze Reference',

    voice: {

      attack: 0.76,

      brightness: 0.72,

      projection: 0.78,

      sustain: 0.54,

      warmth: 0.5,

      sensitivity: 0.66,

      control: 0.68,

    },

  },

];

const MOCK_MATCHES = [

  {

    id: 'mock-1',

    companyName: 'Ober Artisan',

    modelName: 'Classic',

    modelDetail: 'Maple Series',

    voiceProfile: {

      attack: 0.72,

      brightness: 0.66,

      projection: 0.84,

      sustain: 0.58,

      warmth: 0.74,

      sensitivity: 0.7,

      control: 0.72,

    },

  },

  {

    id: 'mock-2',

    companyName: 'Ludwig',

    modelName: 'Black Beauty',

    modelDetail: '14x6.5 Brass',

    voiceProfile: {

      attack: 0.78,

      brightness: 0.82,

      projection: 0.86,

      sustain: 0.62,

      warmth: 0.55,

      sensitivity: 0.74,

      control: 0.6,

    },

  },

  {

    id: 'mock-3',

    companyName: 'Gretsch',

    modelName: 'Brooklyn',

    modelDetail: '14x6.5 Metal',

    voiceProfile: {

      attack: 0.76,

      brightness: 0.72,

      projection: 0.78,

      sustain: 0.54,

      warmth: 0.5,

      sensitivity: 0.66,

      control: 0.68,

    },

  },

  {

    id: 'mock-4',

    companyName: 'Sonor',

    modelName: 'SQ2',

    modelDetail: '14x6.5 Maple',

    voiceProfile: {

      attack: 0.6,

      brightness: 0.56,

      projection: 0.72,

      sustain: 0.72,

      warmth: 0.78,

      sensitivity: 0.64,

      control: 0.7,

    },

  },

  {

    id: 'mock-5',

    companyName: 'DW',

    modelName: "Collector's",

    modelDetail: '14x6.5 Maple',

    voiceProfile: {

      attack: 0.58,

      brightness: 0.52,

      projection: 0.68,

      sustain: 0.7,

      warmth: 0.82,

      sensitivity: 0.58,

      control: 0.62,

    },

  },

  {

    id: 'mock-6',

    companyName: 'Yamaha',

    modelName: 'Recording',

    modelDetail: '14x5.5 Brass',

    voiceProfile: {

      attack: 0.82,

      brightness: 0.8,

      projection: 0.76,

      sustain: 0.48,

      warmth: 0.46,

      sensitivity: 0.7,

      control: 0.74,

    },

  },

  {

    id: 'mock-7',

    companyName: 'Tama',

    modelName: 'Starclassic',

    modelDetail: '14x6.5 Maple',

    voiceProfile: {

      attack: 0.66,

      brightness: 0.62,

      projection: 0.7,

      sustain: 0.64,

      warmth: 0.7,

      sensitivity: 0.62,

      control: 0.66,

    },

  },

  {

    id: 'mock-8',

    companyName: 'Pearl',

    modelName: 'Reference',

    modelDetail: '14x6.5 Maple',

    voiceProfile: {

      attack: 0.7,

      brightness: 0.6,

      projection: 0.82,

      sustain: 0.6,

      warmth: 0.68,

      sensitivity: 0.56,

      control: 0.78,

    },

  },

];

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const getVoiceValue = (voice, key) => clamp01(voice?.[key], 0.5);

const getResultVoice = (result) =>

  result?.voice || result?.legacyPrintVoice || result?.voiceProfile || {};

const getResultId = (result, index) =>

  result?.drumId || result?.id || `${result?.companyName || 'voice'}-${index}`;

const scoreVoiceSimilarity = (sourceVoice = {}, targetVoice = {}) => {

  const totalDifference = VOICE_NODES.reduce((sum, node) => {

    return (

      sum + Math.abs(getVoiceValue(sourceVoice, node.key) - getVoiceValue(targetVoice, node.key))

    );

  }, 0);

  return clamp01(1 - totalDifference / VOICE_NODES.length);

};

const getMatchPercent = (result) =>

  Math.round(clamp01(result?.similarityScore ?? result?.matchScore ?? 0.5) * 100);

const normalizeDiscoveryScore = value => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 0.5;

  return number > 1 ? number / 100 : number;

};

const discoveryMatchToResult = (match, section) => ({

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

  similarityScore: normalizeDiscoveryScore(match.similarity),

  matchScore: normalizeDiscoveryScore(match.similarity),

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

const buildModeVoice = (baseVoice, mode, selectedReference) => {

  const sourceVoice = selectedReference?.voice || baseVoice || {};

  if (mode === 'reference') {

    return sourceVoice;

  }

  if (mode === 'build') {

    return {

      attack: clamp01(getVoiceValue(baseVoice, 'attack') + 0.05),

      brightness: clamp01(getVoiceValue(baseVoice, 'brightness') - 0.02),

      projection: clamp01(getVoiceValue(baseVoice, 'projection') + 0.08),

      sustain: clamp01(getVoiceValue(baseVoice, 'sustain') + 0.04),

      warmth: clamp01(getVoiceValue(baseVoice, 'warmth') + 0.08),

      sensitivity: clamp01(getVoiceValue(baseVoice, 'sensitivity') + 0.03),

      control: clamp01(getVoiceValue(baseVoice, 'control') + 0.06),

    };

  }

  return baseVoice || {};

};

const getTopNodes = (voice, count = 3) =>

  [...VOICE_NODES]

    .map((node) => ({

      ...node,

      value: getVoiceValue(voice, node.key),

    }))

    .sort((a, b) => b.value - a.value)

    .slice(0, count);

function WorkflowRail({ workflowMode, setWorkflowMode }) {

  return (

    <div className="vp-workflow-rail" aria-label="Voice workflow mode">

      {WORKFLOW_MODES.map((item) => (

        <button

          key={item.key}

          type="button"

          className={workflowMode === item.key ? 'is-active' : ''}

          onClick={() => setWorkflowMode(item.key)}

        >

          <span>{item.eyebrow}</span>

          <strong>{item.label}</strong>

        </button>

      ))}

    </div>

  );

}

function BuildPanel() {

  return (

    <div className="vp-mode-content">

      <div className="vp-build-stack">

        {BUILD_OPTIONS.map((option) => (

          <button key={option.key} type="button" className="vp-build-card">

            <span>{option.label}</span>

            <strong>{option.value}</strong>

            <em>{option.note}</em>

          </button>

        ))}

      </div>

      <div className="vp-helper-card">

        <strong>Build Mode</strong>

        <p>

          This is still mock-only. Later, these choices should feed the universal voicing engine

          directly.

        </p>

      </div>

    </div>

  );

}

function ShapePanel({ voice, updateVoice }) {

  return (

    <div className="vp-mode-content">

      <div className="vp-slider-stack">

        {VOICE_NODES.map((node) => {

          const value = getVoiceValue(voice, node.key);

          return (

            <label key={node.key} className="vp-slider-row">

              <div className="vp-slider-meta">

                <span className="vp-slider-icon" style={{ color: node.color }}>

                  {node.Icon && <node.Icon size={14} strokeWidth={2.25} aria-hidden="true" />}

                </span>

                <span className="vp-slider-label">{node.label}</span>

                <span className="vp-slider-value">{value.toFixed(2)}</span>

              </div>

              <input

                type="range"

                min="0"

                max="1"

                step="0.01"

                value={value}

                onChange={(event) => updateVoice(node.key, parseFloat(event.target.value))}

                style={{ accentColor: node.color }}

              />

            </label>

          );

        })}

      </div>

    </div>

  );

}

function ReferencePanel({

  selectedReferenceId,

  setSelectedReferenceId,

  referenceOptions = REFERENCE_OPTIONS,

  referenceLoading = false,

  referenceError = null,

}) {

  const [brandFilter, setBrandFilter] = useState('all');

  const [modelFilter, setModelFilter] = useState('all');

  const brandOptions = useMemo(() => {

    return Array.from(

      new Set(

        referenceOptions

          .map((reference) => reference.companyName || reference.company || '')

          .filter(Boolean)

      )

    ).sort((a, b) => a.localeCompare(b));

  }, [referenceOptions]);

  const modelOptions = useMemo(() => {

    return referenceOptions

      .filter((reference) => {

        const company = reference.companyName || reference.company || '';

        return brandFilter === 'all' || company === brandFilter;

      })

      .slice()

      .sort((a, b) => {

        const aLabel = a.label || a.modelName || '';

        const bLabel = b.label || b.modelName || '';

        return aLabel.localeCompare(bLabel);

      });

  }, [referenceOptions, brandFilter]);

  const selectedReference =

    referenceOptions.find((reference) => reference.key === selectedReferenceId) ||

    referenceOptions.find((reference) => reference.snareReferenceId === selectedReferenceId) ||

    null;

  const resetReferenceFilters = () => {

    setBrandFilter('all');

    setModelFilter('all');

  };

  return (

    <div className="vp-mode-content">

      <select

        className="vp-search-input"

        value={brandFilter}

        onChange={(event) => {

          setBrandFilter(event.target.value);

          setModelFilter('all');

        }}

      >

        <option value="all">All brands</option>

        {brandOptions.map((brand) => (

          <option key={brand} value={brand}>

            {brand}

          </option>

        ))}

      </select>

      <select

        className="vp-search-input"

        value={modelFilter}

        onChange={(event) => {

          const nextValue = event.target.value;

          setModelFilter(nextValue);

          if (nextValue !== 'all') {

            setSelectedReferenceId(nextValue);

          }

        }}

      >

        <option value="all">Choose model</option>

        {modelOptions.map((reference) => (

          <option key={reference.key} value={reference.key}>

            {reference.label}

          </option>

        ))}

      </select>

      <div className="vp-helper-card">

        <strong>Reference Mode</strong>

        <p>

          {referenceLoading

            ? 'Loading passable LegacyPrint snare references...'

            : referenceError

              ? referenceError

              : `${modelOptions.length} model options available.`}

        </p>

        {selectedReference && (

          <p>

            Selected: {selectedReference.modelName || selectedReference.label} • {selectedReference.shellMaterial || 'Material unknown'} • {selectedReference.diameter && selectedReference.depth ? `${selectedReference.diameter}x${selectedReference.depth}` : 'Size unknown'}

          </p>

        )}

        <button type="button" className="vp-reset-button" onClick={resetReferenceFilters}>

          Reset Reference Filters

        </button>

      </div>

    </div>

  );

}


export function VoicePlayground({ firestore }) {

  const [workflowMode, setWorkflowMode] = useState('reference');

  const [readMode, setReadMode] = useState('firstListen');

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  const [morphAmount, setMorphAmount] = useState(0.5);

  const [selectedReferenceId, setSelectedReferenceId] = useState('ludwig-acrolite');

  const [selectedDiscoverySectionKey, setSelectedDiscoverySectionKey] = useState(null);

  const {

    query,

    setQuery,

    voice,

    updateVoice,

    results,

    discoveryResults,

    discoveryViewModel,

    referenceOptions,

    referenceLoading,

    referenceError,

    loading,

    setAsAnchor

  } = useVoicePlayground(

    firestore,

    selectedReferenceId

  );

  const visibleReferenceOptions =

    referenceOptions?.length ? referenceOptions : REFERENCE_OPTIONS;

  const selectedReference =

    visibleReferenceOptions.find((item) => item.key === selectedReferenceId) ||

    visibleReferenceOptions.find((item) => item.snareReferenceId === selectedReferenceId) ||

    visibleReferenceOptions[0] ||

    REFERENCE_OPTIONS[0];

  const selectedMode =

    WORKFLOW_MODES.find((item) => item.key === workflowMode) || WORKFLOW_MODES[0];

  const selectedReadMode =

    READ_MODES.find((item) => item.key === readMode) || READ_MODES[0];

  const discoverySections = useMemo(() => {

    return (discoveryViewModel?.recommendedSections || []).filter(

      section => section.matches?.length

    );

  }, [discoveryViewModel]);

  const selectedDiscoverySection = useMemo(() => {

    return (

      discoverySections.find(section => section.key === selectedDiscoverySectionKey) ||

      discoverySections.find(section => section.key === discoveryViewModel?.uiHints?.defaultSimilarSection) ||

      discoverySections[0] ||

      null

    );

  }, [discoverySections, discoveryViewModel, selectedDiscoverySectionKey]);

  const selectedDiscoveryResults = useMemo(() => {

    return (selectedDiscoverySection?.matches || []).map(match =>

      discoveryMatchToResult(match, selectedDiscoverySection)

    );

  }, [selectedDiscoverySection]);

  const rawResults = results.length

    ? results

    : selectedDiscoveryResults.length

      ? selectedDiscoveryResults

      : discoveryResults.length

        ? discoveryResults

        : MOCK_MATCHES;

  const modeVoice = useMemo(() => {

    return buildModeVoice(voice || {}, workflowMode, selectedReference);

  }, [voice, workflowMode, selectedReference]);

  const activeVoice = useMemo(() => {

    if (!compareA || !compareB) return modeVoice || {};

    return morphVoice(getResultVoice(compareA), getResultVoice(compareB), morphAmount);

  }, [compareA, compareB, morphAmount, modeVoice]);

  const compareVoice = useMemo(() => {

    if (readMode !== 'playerAnalysis') return null;

    if (compareA && compareB) {

      return getResultVoice(compareB);

    }

    return null;

  }, [readMode, compareA, compareB]);

  const displayResults = useMemo(() => {

    return rawResults

      .map((result) => {

        if (result.discoveryMatch) {

          return result;

        }

        const resultVoice = getResultVoice(result);

        const similarityScore = scoreVoiceSimilarity(activeVoice, resultVoice);

        return {

          ...result,

          similarityScore,

        };

      })

      .sort((a, b) => b.similarityScore - a.similarityScore);

  }, [rawResults, activeVoice]);

  const topNodes = useMemo(() => getTopNodes(activeVoice, 3), [activeVoice]);

  const firstListenKeys = useMemo(() => topNodes.map((node) => node.key), [topNodes]);

  const handleAudition = (result) => {

    setAsAnchor(result);

  };

  const handleReset = () => {

    setCompareA(null);

    setCompareB(null);

    setMorphAmount(0.5);

    setReadMode('firstListen');

    setWorkflowMode('reference');

    setSelectedReferenceId('ludwig-acrolite');

    setSelectedDiscoverySectionKey(null);

  };

  return (

    <div className={`vp-shell vp-mode-${workflowMode} vp-read-${readMode}`}>

      <div className="vp-header">

        <div className="vp-title-group">

          <div className="vp-brand-mark">≋</div>

          <div className="vp-header-copy">

            <h2>LegacyPrint™ Drum Voicing Engine</h2>

            <p>Select · Read · Compare · Discover</p>

          </div>

        </div>

        <div className="vp-header-actions">

          <button type="button" onClick={handleReset}>

            <span>↻</span>

            Reset

          </button>

          <button type="button">

            <span>☆</span>

            Save Voice

          </button>

        </div>

      </div>

      <div className="vp-grid">

        <aside className="vp-panel vp-left-panel">

          <WorkflowRail workflowMode={workflowMode} setWorkflowMode={setWorkflowMode} />

          <div className="vp-panel-header">

            <span>≋</span>

            <div>

              <small>{selectedMode.eyebrow}</small>

              <h3>{selectedMode.title}</h3>

              <p>{selectedMode.description}</p>

            </div>

          </div>

          <input

            className="vp-search-input"

            value={query}

            onChange={(event) => setQuery(event.target.value)}

            placeholder="Search sound..."

          />

          {workflowMode === 'build' && <BuildPanel />}

          {workflowMode === 'shape' && <ShapePanel voice={voice} updateVoice={updateVoice} />}

          {workflowMode === 'reference' && (

            <ReferencePanel

              selectedReferenceId={selectedReferenceId}

              setSelectedReferenceId={setSelectedReferenceId}

              referenceOptions={visibleReferenceOptions}

              referenceLoading={referenceLoading}

              referenceError={referenceError}

            />

          )}
        

          <button type="button" className="vp-primary-button">

            <span>⌕</span>

            Find Similar Drums

          </button>

          <button type="button" className="vp-reset-button" onClick={handleReset}>

            <span>↻</span>

            Reset Filters

          </button>

        </aside>

        <main className="vp-stage">

          <div className="vp-stage-topline">

            <span>{selectedMode.label} Mode</span>

            <strong>

              {workflowMode === 'reference'

                ? selectedReference.label

                : compareA && compareB

                  ? 'A/B Morph Active'

                  : 'Live Voice Map'}

            </strong>

          </div>

          <VoiceConstellationMap

            voice={activeVoice}

            compareVoice={compareVoice}

            readMode={readMode}

            firstListenKeys={firstListenKeys}

            onNodeClick={(key) => updateVoice(key, Math.min(1, getVoiceValue(voice, key) + 0.08))}

          />

          <div className="vp-readout-summary">

            <span>{selectedReadMode.kicker}</span>

            <strong>{selectedReadMode.label}</strong>

            <p>{selectedReadMode.description}</p>

          </div>

          <div className="vp-read-mode-dock" aria-label="Read view">

            {READ_MODES.map((item) => (

              <button

                key={item.key}

                type="button"

                className={readMode === item.key ? 'is-active' : ''}

                onClick={() => setReadMode(item.key)}

              >

                <span>{item.kicker}</span>

                <strong>{item.label}</strong>

              </button>

            ))}

          </div>

          {compareA && compareB && (

            <div className="vp-morph-panel">

              <div className="vp-morph-header">

                <div>

                  <p>A/B Morph</p>

                  <strong>

                    {compareA.companyName || 'A'} → {compareB.companyName || 'B'}

                  </strong>

                </div>

                <label>

                  <span>{Math.round(morphAmount * 100)}%</span>

                  <input

                    type="range"

                    min="0"

                    max="1"

                    step="0.01"

                    value={morphAmount}

                    onChange={(event) => setMorphAmount(parseFloat(event.target.value))}

                  />

                </label>

              </div>

              <VoiceMorphPanel drumA={compareA} drumB={compareB} />

            </div>

          )}

        </main>

        <aside className="vp-panel vp-right-panel">

          <div className="vp-panel-header">

            <span>⌬</span>

            <div>

              <h3>Similar Voice Matches</h3>

              <p>

                {loading

                  ? 'Reshaping sound space...'

                  : discoveryViewModel?.target?.title

                    ? `Previewing matches for ${discoveryViewModel.target.title}`

                    : 'Drums ranked by voice similarity'}

              </p>

            </div>

          </div>

          {discoverySections.length > 0 && (

            <>

              <div className="vp-discovery-section-tabs" aria-label="Discovery match sections">

                {discoverySections.map((section) => (

                  <button

                    key={section.key}

                    type="button"

                    className={selectedDiscoverySection?.key === section.key ? 'is-active' : ''}

                    onClick={() => setSelectedDiscoverySectionKey(section.key)}

                  >

                    <span>{section.label}</span>

                    <em>{section.matches.length}</em>

                  </button>

                ))}

              </div>

              {selectedDiscoverySection?.description && (

                <div className="vp-discovery-section-summary">

                  <strong>{selectedDiscoverySection.label}</strong>

                  <p>{selectedDiscoverySection.description}</p>

                </div>

              )}

            </>

          )}

          <div className="vp-result-list">

            {displayResults.map((result, index) => {

              const id = getResultId(result, index);

              const percent = getMatchPercent(result);

              const node = VOICE_NODES[index % VOICE_NODES.length];

              return (

                <div key={id} className="vp-result-card">

                  <div

                    className="vp-result-badge"

                    style={{

                      borderColor: node.color,

                      boxShadow: `0 0 14px ${node.color}`,

                    }}

                  />

                  <div className="vp-result-body">

                    <strong>

                      {result.companyName || result.company || 'Unknown'}{' '}

                      {result.modelName || result.model || 'Untitled Voice'}

                    </strong>

                    <span>{result.modelDetail || id}</span>

                    {result.explanation && (

                      <p className="vp-result-why">{result.explanation}</p>

                    )}

                    <div className="vp-result-actions">

                      <button type="button" onClick={() => handleAudition(result)}>

                        Audition

                      </button>

                      <button

                        type="button"

                        className={compareA === result ? 'active' : ''}

                        onClick={() => {

                          setCompareA(result);

                          setReadMode('playerAnalysis');

                        }}

                      >

                        Set A

                      </button>

                      <button

                        type="button"

                        className={compareB === result ? 'active' : ''}

                        onClick={() => {

                          setCompareB(result);

                          setReadMode('playerAnalysis');

                        }}

                      >

                        Set B

                      </button>

                    </div>

                  </div>

                  <div className="vp-match-score" style={{ color: node.color }}>

                    {percent}%<span>match</span>

                  </div>

                </div>

              );

            })}

          </div>

          <button type="button" className="vp-view-all-button">

            <span>☷</span>

            View All Results

            <span>›</span>

          </button>

        </aside>

      </div>

    </div>

  );

}

export default VoicePlayground;