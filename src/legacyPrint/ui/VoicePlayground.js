// src/legacyPrint/ui/VoicePlayground.js

import React, { useState, useMemo } from 'react';

import { useVoicePlayground } from './useVoicePlayground.js';

import { VoiceMorphPanel } from './VoiceMorphPanel.js';

import { VoiceBlob } from '../visual/VoiceBlob.js';

import { morphVoice } from '../morph/morphVoice.js';

import { useVoiceField } from '../voiceField/useVoiceField.js';

import { useAnimatedVoiceField } from '../voiceField/useAnimatedVoiceField.js';

import './VoicePlayground.css';

const VOICE_NODES = [

  { key: 'sustain', label: 'Sustain', icon: '≋', color: '#ff6d4a', x: 50, y: 9 },

  { key: 'warmth', label: 'Warmth', icon: '♨', color: '#ffd84a', x: 82, y: 28 },

  { key: 'control', label: 'Control', icon: '◉', color: '#ffb02e', x: 87, y: 62 },

  { key: 'attack', label: 'Attack', icon: 'ϟ', color: '#3f7bff', x: 62, y: 88 },

  { key: 'brightness', label: 'Brightness', icon: '☼', color: '#27d8ff', x: 32, y: 88 },

  { key: 'projection', label: 'Projection', icon: '⌖', color: '#4fffe2', x: 14, y: 61 },

  { key: 'sensitivity', label: 'Sensitivity', icon: '♧', color: '#b15cff', x: 18, y: 28 },

];

const MOCK_MATCHES = [

  {

    id: 'mock-1',

    companyName: 'Ober Artisan',

    modelName: 'Heritage 14x6 Torch',

    modelDetail: 'Stave maple/oak reference',

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

      sum +

      Math.abs(getVoiceValue(sourceVoice, node.key) - getVoiceValue(targetVoice, node.key))

    );

  }, 0);

  return clamp01(1 - totalDifference / VOICE_NODES.length);

};

const getMatchPercent = (result) =>

  Math.round(clamp01(result?.similarityScore ?? result?.matchScore ?? 0.5) * 100);

function VoiceNetwork({ voice, onNodeClick }) {

  const polygonPoints = VOICE_NODES.map((node) => `${node.x},${node.y}`).join(' ');

  const center = { x: 50, y: 52 };

    return (

    <div className="vp-network">

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="vp-network-svg">

        <defs>

          <filter id="legacyprintLineGlow" x="-60%" y="-60%" width="220%" height="220%">

            <feGaussianBlur stdDeviation="0.8" result="blur" />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

        </defs>

        <polygon

          points={polygonPoints}

          fill="rgba(100,140,255,0.035)"

          stroke="rgba(150,170,255,0.2)"

          strokeWidth="0.22"

        />

        {VOICE_NODES.map((fromNode, fromIndex) =>

          VOICE_NODES.slice(fromIndex + 1).map((toNode) => (

            <line

              key={`${fromNode.key}-${toNode.key}`}

              x1={fromNode.x}

              y1={fromNode.y}

              x2={toNode.x}

              y2={toNode.y}

              stroke="rgba(120,140,200,0.13)"

              strokeWidth="0.12"

            />

          ))

        )}

        {VOICE_NODES.map((node, index) => {

          const nextNode = VOICE_NODES[(index + 1) % VOICE_NODES.length];

          const value = getVoiceValue(voice, node.key);

          return (

            <line

              key={`${node.key}-outer`}

              x1={node.x}

              y1={node.y}

              x2={nextNode.x}

              y2={nextNode.y}

              stroke={node.color}

              strokeOpacity={0.48 + value * 0.5}

              strokeWidth={0.55 + value * 1.25}

              filter="url(#legacyprintLineGlow)"

            />

          );

        })}

        {VOICE_NODES.map((node) => {

          const value = getVoiceValue(voice, node.key);

          const innerX = center.x + (node.x - center.x) * value;

          const innerY = center.y + (node.y - center.y) * value;

          return (

            <line

              key={`${node.key}-active`}

              x1={center.x}

              y1={center.y}

              x2={innerX}

              y2={innerY}

              stroke={node.color}

              strokeOpacity={0.22 + value * 0.64}

              strokeWidth={0.35 + value * 0.82}

              filter="url(#legacyprintLineGlow)"

            />

          );

        })}

        <circle

          cx={center.x}

          cy={center.y}

          r="16"

          fill="rgba(190,80,255,0.065)"

          stroke="rgba(215,126,255,0.38)"

          strokeWidth="0.24"

          strokeDasharray="1.2 1"

        />

      </svg>

      <div className="vp-center-blob">

        <VoiceBlob voice={voice} size={240} />

      </div>

      {VOICE_NODES.map((node) => {

        const value = getVoiceValue(voice, node.key);

        return (

          <button

            key={node.key}

            type="button"

            className="vp-node-button"

            onClick={() => onNodeClick?.(node.key)}

            title={`${node.label}: ${value.toFixed(2)}`}

            style={{

              left: `${node.x}%`,

              top: `${node.y}%`,

              borderColor: node.color,

              color: node.color,

              boxShadow: `0 0 ${18 + value * 34}px ${node.color}, inset 0 0 22px ${node.color}33`,

              background: `radial-gradient(circle, rgba(255,255,255,0.18), ${node.color}28 44%, rgba(8,12,24,0.96) 72%)`,

            }}

          >

            <span className="vp-node-icon">{node.icon}</span>

            <span className="vp-node-label">{node.label}</span>

          </button>

        );

      })}

    </div>

  );

}

export function VoicePlayground({ firestore }) {

  const { query, setQuery, voice, updateVoice, results, loading, setAsAnchor } =

    useVoicePlayground(firestore);

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  const [morphAmount, setMorphAmount] = useState(0.5);

  const [activeNodeId, setActiveNodeId] = useState(null);

  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const rawResults = results.length ? results : MOCK_MATCHES;

  const activeVoice = useMemo(() => {

    if (!compareA || !compareB) return voice || {};

    return morphVoice(getResultVoice(compareA), getResultVoice(compareB), morphAmount);

  }, [compareA, compareB, morphAmount, voice]);

  const displayResults = useMemo(() => {

    return rawResults

      .map((result) => {

        const resultVoice = getResultVoice(result);

        const similarityScore = scoreVoiceSimilarity(activeVoice, resultVoice);

        return {

          ...result,

          similarityScore,

        };

      })

      .sort((a, b) => b.similarityScore - a.similarityScore);

  }, [rawResults, activeVoice]);

  const voiceField = useVoiceField(activeVoice, displayResults);

  const animatedVoiceField = useAnimatedVoiceField({

    nodes: voiceField,

    activeNodeId,

    hoveredNodeId,

    enabled: true,

  });

  const handleAudition = (result, fallbackIndex = 0) => {

    const id = getResultId(result, fallbackIndex);

    setActiveNodeId(id);

    setAsAnchor(result);

  };

  return (

    <div className="vp-shell">

      <div className="vp-header">

        <div className="vp-brand-mark">≋</div>

        <div className="vp-header-copy">

          <h2>Voice Playground</h2>

          <p>Explore • Shape • Discover</p>

        </div>

        <div className="vp-header-actions">

          <button type="button">Reset</button>

          <button type="button">Save Voice</button>

        </div>

      </div>

      <div className="vp-grid">

        <aside className="vp-panel vp-left-panel">

          <div className="vp-panel-header">

            <span>≋</span>

            <div>

              <h3>Shape Your Voice</h3>

              <p>Adjust the voice characteristics to find matching drums.</p>

            </div>

          </div>

          <input

            className="vp-search-input"

            value={query}

            onChange={(event) => setQuery(event.target.value)}

            placeholder="Search sound..."

          />

          <div className="vp-slider-stack">

            {VOICE_NODES.map((node) => {

              const value = getVoiceValue(voice, node.key);

              return (

                <label key={node.key} className="vp-slider-row">

                  <div className="vp-slider-meta">

                    <span className="vp-slider-icon" style={{ color: node.color }}>

                      {node.icon}

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

          <div className="vp-mini-blob-card">

            <h4>Voice Shape</h4>

            <VoiceBlob voice={activeVoice} size={210} />

            <p>This shape represents the tonal fingerprint of your voice.</p>

          </div>

          <button type="button" className="vp-primary-button">

            Find Similar Drums

          </button>

          <button type="button" className="vp-reset-button">

            Reset Filters

          </button>

        </aside>

        <main className="vp-stage">

          <div className="vp-field-motion-layer">

            {animatedVoiceField.map((node, index) => {

              const color = VOICE_NODES[index % VOICE_NODES.length].color;

              return (

                <button

                  key={node.drumId}

                  type="button"

                  className="vp-field-motion-node"

                  onClick={() => handleAudition(node.raw, index)}

                  onMouseEnter={() => setHoveredNodeId(node.drumId)}

                  onMouseLeave={() => setHoveredNodeId(null)}

                  title={`${node.companyName} — ${node.modelName}`}

                  style={{

                    left: `${node.x * 100}%`,

                    top: `${node.y * 100}%`,

                    width: node.size * node.motionScale,

                    height: node.size * node.motionScale,

                    opacity: node.motionOpacity,

                    borderColor: color,

                    boxShadow: `0 0 ${node.isHovered || node.isActive ? 26 : 14}px ${color}`,

                    background: node.isActive

                      ? color

                      : `radial-gradient(circle, rgba(255,255,255,0.75), ${color}88 45%, transparent 72%)`,

                  }}

                />

              );

            })}

          </div>

          <VoiceNetwork

            voice={activeVoice}

            onNodeClick={(key) =>

              updateVoice(key, Math.min(1, getVoiceValue(voice, key) + 0.08))

            }

          />

          <div className="vp-field-legend">

            <span>Low</span>

            <div>

              <p>Similarity</p>

              <div className="vp-legend-bar" />

            </div>

            <span>High</span>

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

              <p>{loading ? 'Reshaping sound space...' : 'Drums ranked by voice similarity'}</p>

            </div>

          </div>

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

                      boxShadow: `0 0 16px ${node.color}`,

                    }}

                  />

                  <div className="vp-result-body">

                    <strong>

                      {result.companyName || result.company || 'Unknown'} —{' '}

                      {result.modelName || result.model || 'Untitled Voice'}

                    </strong>

                    <span>{result.modelDetail || id}</span>

                    <div className="vp-result-actions">

                      <button type="button" onClick={() => handleAudition(result, index)}>

                        Audition

                      </button>

                      <button

                        type="button"

                        className={compareA === result ? 'active' : ''}

                        onClick={() => setCompareA(result)}

                      >

                        Set A

                      </button>

                      <button

                        type="button"

                        className={compareB === result ? 'active' : ''}

                        onClick={() => setCompareB(result)}

                      >

                        Set B

                      </button>

                    </div>

                  </div>

                  <div className="vp-match-score" style={{ color: node.color }}>

                    {percent}%

                    <span>match</span>

                  </div>

                </div>

              );

            })}

          </div>

        </aside>

      </div>

    </div>

  );

}