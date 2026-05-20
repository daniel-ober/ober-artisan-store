import React, { useMemo, useState } from 'react';

import {
  AudioWaveform,
  Flame,
  Feather,
  Volume2,
  Sun,
  Zap,
  Crosshair,
  Search,
  RotateCcw,
  Star,
  List,
  ChevronRight,
  Info,
} from 'lucide-react';

import './VoicePlayground.css';

const NODE_META = [
  {
    key: 'sustain',
    label: 'Sustain',
    value: 0.72,
    color: '#ff6a3d',
    Icon: AudioWaveform,
    x: 500,
    y: 72,
  },

  { key: 'warmth', label: 'Warmth', value: 0.65, color: '#ffd21f', Icon: Flame, x: 790, y: 205 },

  {
    key: 'control',
    label: 'Control',
    value: 0.58,
    color: '#ffd21f',
    Icon: Volume2,
    x: 850,
    y: 480,
  },

  { key: 'attack', label: 'Attack', value: 0.61, color: '#3f7dff', Icon: Zap, x: 615, y: 655 },

  {
    key: 'brightness',
    label: 'Brightness',
    value: 0.44,
    color: '#24dfff',
    Icon: Sun,
    x: 390,
    y: 655,
  },

  {
    key: 'projection',
    label: 'Projection',
    value: 0.67,
    color: '#2cf3df',
    Icon: Crosshair,
    x: 145,
    y: 480,
  },

  {
    key: 'sensitivity',
    label: 'Sensitivity',
    value: 0.48,
    color: '#c159ff',
    Icon: Feather,
    x: 205,
    y: 205,
  },
];

const BUILD_FIELDS = {
  drumType: ['Snare Drum', 'Rack Tom', 'Floor Tom', 'Kick Drum'],

  diameter: ['10"', '12"', '13"', '14"', '15"', '16"', '18"', '20"', '22"'],

  depth: ['4.5"', '5"', '5.5"', '6"', '6.5"', '7"', '8"'],

  construction: ['Stave', 'Ply', 'Steam-Bent', 'Segmented', 'FEUZØN Hybrid'],

  shellMaterial: ['Maple', 'Walnut', 'Oak', 'Cherry', 'Mahogany', 'Aluminum', 'Brass'],

  hoopType: ['Die-Cast', 'Triple Flange', 'Wood Hoop', 'Single Flange'],
};

const DEFAULT_BUILD = {
  drumType: 'Snare Drum',

  diameter: '14"',

  depth: '6"',

  construction: 'Stave',

  shellMaterial: 'Maple',

  hoopType: 'Die-Cast',
};

const REFERENCE_DATA = {
  Ober: {
    'Heritage Series': {
      'Heritage Maple Stave': ['14x6', '14x6.5'],

      'FEUZØN Hybrid': ['14x6', '14x7'],
    },
  },

  Ludwig: {
    'Legacy / Classic': {
      'Classic Maple Reference': ['14x5.5', '14x6.5'],

      'Black Beauty': ['14x5', '14x6.5'],
    },
  },

  Gretsch: {
    Brooklyn: {
      'Brooklyn Reference': ['14x5.5', '14x6.5'],
    },
  },
};

const DEFAULT_REFERENCE = {
  brand: 'Ober',

  line: 'Heritage Series',

  model: 'Heritage Maple Stave',

  size: '14x6',
};

const MATCHES = [
  { id: 1, name: 'Ober Artisan Classic', meta: 'Maple Series', score: 93, color: '#ff4438' },

  { id: 2, name: 'Ludwig Black Beauty', meta: '14x6.5 Brass', score: 89, color: '#a24cff' },

  { id: 3, name: 'Gretsch Brooklyn', meta: '14x6.5 Metal', score: 86, color: '#36b9ff' },

  { id: 4, name: 'Sonor SQ2', meta: '14x6.5 Maple', score: 82, color: '#72e184' },

  { id: 5, name: "DW Collector's", meta: '14x6.5 Maple', score: 79, color: '#ffd21f' },

  { id: 6, name: 'Yamaha Recording', meta: '14x6.5 Brass', score: 75, color: '#f5b51b' },

  { id: 7, name: 'Tama Starclassic', meta: '14x6.5 Maple', score: 72, color: '#d5db23' },

  { id: 8, name: 'Pearl Reference', meta: '14x6.5 Maple', score: 68, color: '#20d8ff' },

  { id: 9, name: 'SJC Custom', meta: '14x6.5 Maple', score: 64, color: '#5478ff' },

  { id: 10, name: 'Craviotto Solid Shell', meta: '14x6.5 Maple', score: 61, color: '#ba55ff' },
];

const MODES = {
  build: {
    title: 'Build Your Voice',

    subtitle: 'Adjust mock build inputs for the selected drum configuration.',
  },

  shape: {
    title: 'Shape Your Voice',

    subtitle: 'Adjust the voice characteristics to find matching drums.',
  },

  reference: {
    title: 'Reference Database',

    subtitle: 'Select a mock reference drum and preview confidence labels.',
  },
};

const BLOB_POINTS = [
  [474, 318],

  [510, 275],

  [550, 302],

  [580, 355],

  [620, 392],

  [592, 452],

  [540, 485],

  [485, 470],

  [438, 502],

  [388, 466],

  [375, 405],

  [410, 355],
];

function getReferenceOptions(selection) {
  const lines = Object.keys(REFERENCE_DATA[selection.brand] || {});

  const models = Object.keys(REFERENCE_DATA[selection.brand]?.[selection.line] || {});

  const sizes = REFERENCE_DATA[selection.brand]?.[selection.line]?.[selection.model] || [];

  return { lines, models, sizes };
}

function lerpPoint(node, value) {
  const cx = 500;

  const cy = 382;

  return {
    x: cx + (node.x - cx) * value,

    y: cy + (node.y - cy) * value,
  };
}

function VoicePlayground() {
  const [mode, setMode] = useState('shape');

  const [build, setBuild] = useState(DEFAULT_BUILD);

  const [reference, setReference] = useState(DEFAULT_REFERENCE);

  const [nodes, setNodes] = useState(
    NODE_META.reduce((acc, node) => ({ ...acc, [node.key]: node.value }), {})
  );

  const resolvedNodes = useMemo(
    () => NODE_META.map((node) => ({ ...node, value: Number(nodes[node.key]) })),

    [nodes]
  );

  const referenceOptions = getReferenceOptions(reference);

  const profilePoints = resolvedNodes

    .map((node) => {
      const point = lerpPoint(node, node.value);

      return `${point.x},${point.y}`;
    })

    .join(' ');

  const innerProfilePoints = resolvedNodes

    .map((node) => {
      const point = lerpPoint(node, Math.max(0.22, node.value - 0.18));

      return `${point.x},${point.y}`;
    })

    .join(' ');

  const blobPoints = BLOB_POINTS.map((point) => point.join(',')).join(' ');

  const voiceResult = useMemo(
    () => ({
      source: 'mock-local-ui-state',

      status: 'preview-only',

      selectedBuildConfig: {
        ...build,

        displayLabel: `${build.diameter} x ${build.depth} ${build.shellMaterial} ${build.construction}`,
      },

      selectedReferenceDrum: {
        ...reference,

        displayLabel: `${reference.brand} / ${reference.line} / ${reference.model} / ${reference.size}`,

        confidenceLabel: 'Reference Confidence: Mock Placeholder',
      },

      nodeOutput: resolvedNodes.reduce(
        (acc, node) => ({
          ...acc,

          [node.key]: {
            key: node.key,

            label: node.label,

            value: node.value,

            displayValue: node.value.toFixed(2),

            color: node.color,
          },
        }),

        {}
      ),

      fingerprint: {
        type: 'mock-organic-blob',

        confidenceLabel: 'Fingerprint Confidence: Mock Shape',

        points: BLOB_POINTS,
      },

      similarVoiceMatches: MATCHES,

      notices: ['Ober Verified Standard', 'Default Modifier Notice', 'Mock-only preview state'],
    }),

    [build, reference, resolvedNodes]
  );

  const resetAll = () => {
    setMode('shape');

    setBuild(DEFAULT_BUILD);

    setReference(DEFAULT_REFERENCE);

    setNodes(NODE_META.reduce((acc, node) => ({ ...acc, [node.key]: node.value }), {}));
  };

  const updateReferenceBrand = (brand) => {
    const line = Object.keys(REFERENCE_DATA[brand])[0];

    const model = Object.keys(REFERENCE_DATA[brand][line])[0];

    const size = REFERENCE_DATA[brand][line][model][0];

    setReference({ brand, line, model, size });
  };

  const updateReferenceLine = (line) => {
    const model = Object.keys(REFERENCE_DATA[reference.brand][line])[0];

    const size = REFERENCE_DATA[reference.brand][line][model][0];

    setReference((current) => ({ ...current, line, model, size }));
  };

  const updateReferenceModel = (model) => {
    const size = REFERENCE_DATA[reference.brand][reference.line][model][0];

    setReference((current) => ({ ...current, model, size }));
  };

  return (
    <main className="lp-playground">
      <header className="lp-topbar">
        <div className="lp-brand-lockup">
          <div className="lp-brand-icon">
            <AudioWaveform size={30} />
          </div>

          <div>
            <h1>Voice Playground</h1>

            <p>
              Explore <span>•</span> Shape <span>•</span> Discover
            </p>
          </div>
        </div>

        <nav className="lp-mode-switch" aria-label="Voice Playground mode">
          {Object.keys(MODES).map((modeKey) => (
            <button
              key={modeKey}
              type="button"
              className={mode === modeKey ? 'is-active' : ''}
              onClick={() => setMode(modeKey)}
            >
              {modeKey}
            </button>
          ))}
        </nav>

        <div className="lp-top-actions">
          <button type="button" onClick={resetAll}>
            <RotateCcw size={18} />
            Reset
          </button>

          <button type="button">
            <Star size={18} />
            Save Voice
          </button>
        </div>
      </header>

      <section className="lp-layout">
        <aside className="lp-card lp-controls-card">
          <div className="lp-section-heading">
            <AudioWaveform size={23} />

            <div>
              <h2>{MODES[mode].title}</h2>

              <p>{MODES[mode].subtitle}</p>
            </div>
          </div>

          {mode === 'build' && (
            <div className="lp-form-stack">
              {Object.entries(BUILD_FIELDS).map(([field, options]) => (
                <label key={field}>
                  {field.replace(/([A-Z])/g, ' $1')}

                  <select
                    value={build[field]}
                    onChange={(event) =>
                      setBuild((current) => ({ ...current, [field]: event.target.value }))
                    }
                  >
                    {options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          {mode === 'shape' && (
            <div className="lp-slider-stack">
              {resolvedNodes.map((node) => {
                const Icon = node.Icon;

                return (
                  <label
                    key={node.key}
                    className="lp-slider-row"
                    style={{
                      '--node-color': node.color,

                      '--slider-fill': `${node.value * 100}%`,
                    }}
                  >
                    <span className="lp-slider-title">
                      <span>
                        <Icon size={22} />

                        {node.label}
                      </span>

                      <em>{node.value.toFixed(2)}</em>
                    </span>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={node.value}
                      onChange={(event) =>
                        setNodes((current) => ({
                          ...current,

                          [node.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
          )}

          {mode === 'reference' && (
            <div className="lp-form-stack">
              <label>
                Brand
                <select
                  value={reference.brand}
                  onChange={(event) => updateReferenceBrand(event.target.value)}
                >
                  {Object.keys(REFERENCE_DATA).map((brand) => (
                    <option key={brand}>{brand}</option>
                  ))}
                </select>
              </label>

              <label>
                Line / Series
                <select
                  value={reference.line}
                  onChange={(event) => updateReferenceLine(event.target.value)}
                >
                  {referenceOptions.lines.map((line) => (
                    <option key={line}>{line}</option>
                  ))}
                </select>
              </label>

              <label>
                Model
                <select
                  value={reference.model}
                  onChange={(event) => updateReferenceModel(event.target.value)}
                >
                  {referenceOptions.models.map((model) => (
                    <option key={model}>{model}</option>
                  ))}
                </select>
              </label>

              <label>
                Size
                <select
                  value={reference.size}
                  onChange={(event) =>
                    setReference((current) => ({ ...current, size: event.target.value }))
                  }
                >
                  {referenceOptions.sizes.map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
              </label>

              <div className="lp-reference-note">
                <strong>Ober Verified Standard</strong>

                <p>{voiceResult.selectedReferenceDrum.confidenceLabel}</p>
              </div>
            </div>
          )}

          <div className="lp-voice-shape-card">
            <div className="lp-shape-title">
              <h3>Voice Shape</h3>

              <Info size={15} />
            </div>

            <svg viewBox="0 0 1000 760" className="lp-mini-blob">
              <polygon points={blobPoints} />
            </svg>

            <p>This shape represents the tonal fingerprint of your voice.</p>
          </div>

          <button type="button" className="lp-find-button">
            <Search size={20} />
            Find Similar Drums
          </button>

          <button type="button" className="lp-reset-filters" onClick={resetAll}>
            <RotateCcw size={17} />
            Reset Filters
          </button>
        </aside>

        <section className="lp-graph-stage">
          <svg className="lp-main-graph" viewBox="0 0 1000 760" role="img">
            <defs>
              <filter id="lpBigGlow">
                <feGaussianBlur stdDeviation="5" result="blur" />

                <feMerge>
                  <feMergeNode in="blur" />

                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="lpCenterBlobGradient" cx="48%" cy="38%" r="65%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />

                <stop offset="34%" stopColor="rgba(225,88,255,0.75)" />

                <stop offset="100%" stopColor="rgba(160,55,255,0.12)" />
              </radialGradient>
            </defs>

            <circle cx="500" cy="382" r="122" className="lp-center-ring" />

            <circle cx="500" cy="382" r="158" className="lp-center-ring dashed" />

            {[160, 240, 320, 400].map((radius) => (
              <circle key={radius} cx="500" cy="382" r={radius} className="lp-web-ring" />
            ))}

            {resolvedNodes.map((node) => (
              <line
                key={`axis-${node.key}`}
                x1="500"
                y1="382"
                x2={node.x}
                y2={node.y}
                className="lp-axis-line"
                style={{ '--node-color': node.color }}
              />
            ))}

            {resolvedNodes.map((node, index) =>
              resolvedNodes.slice(index + 1).map((target) => {
                const start = lerpPoint(node, 0.92);

                const end = lerpPoint(target, 0.92);

                return (
                  <line
                    key={`${node.key}-${target.key}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    className="lp-thread-line"
                    style={{ '--node-color': node.color }}
                  />
                );
              })
            )}

            {resolvedNodes.map((node) => {
              const dotA = lerpPoint(node, 0.45);

              const dotB = lerpPoint(node, 0.68);

              return (
                <g key={`dots-${node.key}`}>
                  <circle
                    cx={dotA.x}
                    cy={dotA.y}
                    r="4"
                    className="lp-thread-dot"
                    style={{ '--node-color': node.color }}
                  />

                  <circle
                    cx={dotB.x}
                    cy={dotB.y}
                    r="3"
                    className="lp-thread-dot pale"
                    style={{ '--node-color': node.color }}
                  />
                </g>
              );
            })}

            <polygon points={innerProfilePoints} className="lp-inner-profile" />

            <polygon points={profilePoints} className="lp-profile-line" />

            <polygon points={blobPoints} className="lp-center-blob" filter="url(#lpBigGlow)" />

            {resolvedNodes.map((node, index) => {
              const next = resolvedNodes[(index + 1) % resolvedNodes.length];

              return (
                <line
                  key={`outer-${node.key}`}
                  x1={node.x}
                  y1={node.y}
                  x2={next.x}
                  y2={next.y}
                  className="lp-outer-node-line"
                  style={{ '--node-color': node.color }}
                />
              );
            })}

            {resolvedNodes.map((node) => {
              const Icon = node.Icon;

              const isLeft = node.x < 430;

              const isRight = node.x > 570;

              const labelX = isLeft ? node.x - 88 : isRight ? node.x + 88 : node.x;

              const labelY = node.y + (node.key === 'sustain' ? -70 : node.y > 600 ? 78 : -54);

              return (
                <g key={node.key} className="lp-node-group">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="48"
                    className="lp-node-halo"
                    style={{ '--node-color': node.color }}
                  />

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="33"
                    className="lp-node-core"
                    style={{ '--node-color': node.color }}
                  />

                  <foreignObject x={node.x - 16} y={node.y - 16} width="32" height="32">
                    <div className="lp-node-icon" style={{ color: node.color }}>
                      <Icon size={30} strokeWidth={2.2} />
                    </div>
                  </foreignObject>

                  <text x={labelX} y={labelY} className="lp-node-text" style={{ fill: node.color }}>
                    {node.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="lp-similarity-key">
            <span>Similarity</span>

            <div />

            <p>
              <em>Low</em>

              <em>High</em>
            </p>
          </div>
        </section>

        <aside className="lp-card lp-matches-card">
          <div className="lp-section-heading">
            <AudioWaveform size={23} />

            <div>
              <h2>Similar Voice Matches</h2>

              <p>Drums ranked by voice similarity</p>
            </div>
          </div>

          <div className="lp-match-list">
            {voiceResult.similarVoiceMatches.map((match) => (
              <article
                key={match.id}
                className="lp-match-row"
                style={{ '--match-color': match.color }}
              >
                <div className="lp-match-hex" />

                <div className="lp-match-main">
                  <h3>{match.name}</h3>

                  <p>{match.meta}</p>
                </div>

                <div className="lp-match-score">
                  <strong>{match.score}%</strong>

                  <span>Match</span>
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="lp-view-results">
            <List size={18} />
            View All Results
            <ChevronRight size={18} />
          </button>
        </aside>
      </section>
    </main>
  );
}

export default VoicePlayground;
