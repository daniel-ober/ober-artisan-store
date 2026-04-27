import React, { useMemo, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Zap,
  Waves,
  Flame,
  Volume2,
  SunMedium,
  Feather,
  Crosshair,
} from 'lucide-react';

import './ArtisanDrums.css';

import VoiceProfileDisclaimer from './VoiceProfileDisclaimer';

const ASSET_BASE = `${process.env.PUBLIC_URL}/ober-artisan-showroom/color`;

const SHOP_BASE = `${process.env.PUBLIC_URL}/artisan-shop`;

export const DRUM_SERIES = [
  {
    id: 'heritage',

    name: 'HERITAGE',

    logo: '/resized-logos/heritage-white.png',

    previewImage: `${SHOP_BASE}/heritage-left.png`,

    quote: 'Rooted. Warm. Timeless.',

    shortLabel: 'Heritage',

    snapshotTitle: 'HERITAGE Series Snapshot',

    snapshotSummary:
      'A rooted, warm, seasoned response shaped around classic feel, woody center, grounded articulation, and a familiar voice that stays organic and controlled under the stick.',

    legacyPrintProfile: [
      {
        label: 'Attack',

        value: 56,

        note: 'Firm enough to speak clearly without becoming overly sharp.',
      },

      {
        label: 'Sustain',

        value: 47,

        note: 'Controlled and seasoned, with a shorter classic note shape.',
      },

      {
        label: 'Warmth',

        value: 51,

        note: 'Naturally rooted, woody, and warm through the center of the note.',
      },

      {
        label: 'Projection',

        value: 58,

        note: 'Focused shop-tested presence with a grounded center.',
      },

      {
        label: 'Brightness',

        value: 51,

        note: 'Balanced top end, kept smooth and traditional.',
      },

      {
        label: 'Sensitivity',

        value: 45,

        note: 'Responsive, but intentionally not hyper-modern or glassy.',
      },

      {
        label: 'Control',

        value: 58,

        note: 'The most composed of the three line snapshots.',
      },
    ],

    bullets: [
      'Builds starting at $850',

      'Northern Red Oak stave shell construction',

      'Grounded, warm, seasoned Ober voice',

      'Classic 45° inner edge with softened outer roundover',

      'Standard snare beds for familiar response',

      '12", 13", and 14" build sizes',

      '36 core Heritage voicing paths',

      'Vintage double-ended tube lug character',
    ],

    description:
      'HERITAGE carries the most grounded side of the Ober voice: seasoned, tactile, and deeply organic. Built around Northern Red Oak stave construction and shaped with a classic bearing-edge profile, it is made for players who want natural feel, warm body, and a drum that sounds played-in from the first stroke.',

    href: '/artisan-shop/heritage',

    cta: 'Explore Heritage',

    activeLayer: `${ASSET_BASE}/drums-only-heritage.png`,
  },

  {
    id: 'feuzon',

    name: 'FEUZØN',

    logo: '/resized-logos/feuzon-white.png',

    previewImage: `${SHOP_BASE}/feuzon-right.png`,

    quote: 'Fast. Focused. Alive.',

    shortLabel: 'Feuzøn',

    snapshotTitle: 'FEUZØN Series Snapshot',

    snapshotSummary:
      'A hybrid-shell response with broader range, stronger articulation, and a more modern spread while still carrying enough body to feel alive under the stick.',

    legacyPrintProfile: [
      {
        label: 'Attack',

        value: 71,

        note: 'More articulate front-end response than Heritage.',
      },

      {
        label: 'Sustain',

        value: 63,

        note: 'More dimensional bloom from the hybrid shell format.',
      },

      {
        label: 'Warmth',

        value: 63,

        note: 'Carries body and depth, but stays more balanced and articulate than Heritage.',
      },

      {
        label: 'Projection',

        value: 69,

        note: 'A broader, more forward response across the room.',
      },

      {
        label: 'Brightness',

        value: 62,

        note: 'A touch more lift and top-end shape.',
      },

      {
        label: 'Sensitivity',

        value: 64,

        note: 'Responsive and modern without losing shell character.',
      },

      {
        label: 'Control',

        value: 65,

        note: 'Balanced control with more tonal spread than Heritage.',
      },
    ],

    bullets: [
      'Builds starting at $950',

      'Steam-bent exterior with voiced stave interior',

      'Fast, articulate, modern Ober response',

      'Balanced Hybrid, Warm Hybrid, or Modern Precision edge options',

      '12", 13", 14", and 15" build sizes',

      'Hundreds of FEUZØN core voicing paths',

      'Die-cast or triple-flange hoop response',

      'Natural, stained, satin, or gloss finish systems',
    ],

    description:
      'FEUZØN is built for players who want the immediacy of a modern drum, with more depth, complexity, and character beneath the stick. By pairing a steam-bent outer shell with a voiced stave interior, FEUZØN creates a response that feels articulate up front, full through the body, and alive across a wide tuning range.',

    href: '/artisan-shop/feuzon',

    cta: 'Explore FEUZØN',

    activeLayer: `${ASSET_BASE}/drums-only-feuzon.png`,
  },

  {
    id: 'soundlegend',

    name: 'SOUNDLEGEND',

    logo: '/resized-logos/soundlegend-white.png',

    previewImage: `${SHOP_BASE}/soundlegend-left.png`,

    quote: 'Custom-built. Artist-led. One-on-one.',

    shortLabel: 'SoundLegend',

    snapshotTitle: 'SoundLegend Series Snapshot',

    snapshotSummary:
      'The most flexible Ober voice path, shaped around the player, story, sound goals, feel, visual direction, and one-of-one build intent.',

    legacyPrintProfile: [
      {
        label: 'Attack',

        value: 84,

        note: 'Can be shaped from soft and rounded to immediate and precise.',
      },

      {
        label: 'Sustain',

        value: 76,

        note: 'Mapped around the artist’s preferred note length and bloom.',
      },

      {
        label: 'Warmth',

        value: 84,

        note: 'Tailored by wood pairing, shell design, edges, and finish.',
      },

      {
        label: 'Projection',

        value: 92,

        note: 'Designed around the player’s room, genre, and presence needs.',
      },

      {
        label: 'Brightness',

        value: 82,

        note: 'Flexible top-end shaping based on player language.',
      },

      {
        label: 'Sensitivity',

        value: 90,

        note: 'Dialed around touch, ghost notes, recording, and live feel.',
      },

      {
        label: 'Control',

        value: 88,

        note: 'Custom-controlled around the full voicing plan.',
      },
    ],

    bullets: [
      'Builds starting at $1,850',

      'Direct collaboration with Dan Ober',

      'Private pre-build questionnaire and consultation',

      'Artist-shaped voicing and tonal direction',

      'Custom shell, edge, hardware, finish, and feel decisions',

      'High-resolution design mockups before final build direction',

      'Priority SoundLegend Portal access during active builds',

      'LegacyPrint™ voice mapping and build interpretation',

      'Legacy Vault artist page opportunity',

      'One-of-one visual storytelling and documentation',
    ],

    description:
      'Your sound is unique, and your snare should be too. The SoundLegend Series is a fully custom, handcrafted instrument built around your playing style, sonic goals, and artistic identity. In direct collaboration with Dan Ober, you will shape a snare that feels personal, inspiring, and unmistakably yours.',

    href: '/artisan-shop/soundlegend',

    cta: 'Begin Your SoundLegend Experience',

    activeLayer: `${ASSET_BASE}/drums-only-soundlegend.png`,
  },
];

const COMPARE_ROWS = [
  {
    label: 'Build philosophy',

    helper: 'Where each line tends to live emotionally and musically.',

    heritage: 'Rooted, classic, timeless',

    feuzon: 'Experimental, hybrid, modern',

    soundlegend: 'Fully tailored to artist and story',
  },

  {
    label: 'Construction approach',

    helper: 'The structural path each line is built around.',

    heritage: 'Traditional stave shell',

    feuzon: 'Stave + steam-bent hybrid',

    soundlegend: 'Chosen per artist goals',
  },

  {
    label: 'Who it is for',

    helper: 'The kind of player each line naturally serves.',

    heritage: 'Players wanting legacy warmth',

    feuzon: 'Players wanting expanded range',

    soundlegend: 'Players wanting a one-of-one build',
  },

  {
    label: 'Voicing behavior',

    helper: 'How the line tends to lean tonally when shaped well.',

    heritage: 'Grounded, warm, seasoned',

    feuzon: 'Broader, sharper, more expansive',

    soundlegend: 'Most flexible and artist-shaped',
  },

  {
    label: 'LegacyPrint™ usage',

    helper: 'How discovery and tonal mapping are used in the process.',

    heritage: 'Used to preserve the line’s core voice',

    feuzon: 'Used to compare tonal range and spread',

    soundlegend: 'Used most deeply during planning and voicing',
  },
];

const AXIS_COLOR_BY_KEY = {
  attack: '#ff7448',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  projection: '#ffb53a',

  brightness: '#e7d98f',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const SERIES_RANGE_COLORS = {
  heritage: '#53371E',

  feuzon: '#2B3365',

  soundlegend: '#398FA3',
};

const LEGACYPRINT_AXIS_META = {
  Attack: {
    key: 'attack',

    low: 'Rounded',

    high: 'Immediate',

    sublabel: 'Quickness',

    icon: 'attack',

    meaning:
      'How quickly the drum speaks at the start of the note. Rounded attack feels softer and woodier; immediate attack feels quicker, sharper, and more defined.',

    rangeBar:
      'On a range bar, Attack shows where the drum tends to sit between a softer rounded front edge and a quicker, more immediate crack.',

    spiderChart:
      'On a spider chart, a longer Attack point means the drum speaks faster and more clearly at the first touch.',

    drummerRead:
      'Rounded feels woodier and softer. Immediate feels quicker, cleaner, and more articulate.',
  },

  Sustain: {
    key: 'sustain',

    low: 'Short',

    high: 'Open',

    sublabel: 'Length',

    icon: 'sustain',

    meaning:
      'How long the note carries after the initial hit. Shorter sustain feels controlled and dry; more open sustain adds bloom, air, and room presence.',

    rangeBar:
      'On a range bar, Sustain shows whether the drum leans drier and tighter or lets the note breathe longer after the hit.',

    spiderChart:
      'On a spider chart, a longer Sustain point means more bloom, more ring, and more air around the note.',

    drummerRead:
      'Short feels tighter and drier. Open feels roomier, bloomier, and more alive after the stroke.',
  },

  Warmth: {
    key: 'warmth',

    low: 'Lean',

    high: 'Warm',

    sublabel: 'Body',

    icon: 'warmth',

    meaning:
      'How much body, depth, and low-mid character the drum carries. Leaner voices feel cleaner and tighter; warmer voices feel fuller, rounder, and more organic.',

    rangeBar:
      'On a range bar, Warmth shows how much low-mid body and wood character is expected in the voice.',

    spiderChart:
      'On a spider chart, a longer Warmth point means the drum should feel fuller, rounder, and more centered in the body.',

    drummerRead:
      'Lean feels cleaner and tighter. Warm feels fuller, woodier, and more rounded through the center.',
  },

  Projection: {
    key: 'projection',

    low: 'Close',

    high: 'Forward',

    sublabel: 'Throw',

    icon: 'projection',

    meaning:
      'How strongly the drum carries into the room or mix. A closer voice feels intimate and controlled; a forward voice pushes more presence and authority.',

    rangeBar:
      'On a range bar, Projection shows whether the drum sits close to the kit or steps forward into the room.',

    spiderChart:
      'On a spider chart, a longer Projection point means the drum should carry farther and feel more present in a mix.',

    drummerRead:
      'Close feels contained and intimate. Forward feels stronger, more present, and more commanding.',
  },

  Brightness: {
    key: 'brightness',

    low: 'Dark',

    high: 'Bright',

    sublabel: 'Top End',

    icon: 'brightness',

    meaning:
      'How much upper-register edge and clarity the drum has. Darker voices feel smoother and woodier; brighter voices feel more open, crisp, and cutting.',

    rangeBar:
      'On a range bar, Brightness shows how much top-end edge, clarity, and cut the drum has.',

    spiderChart:
      'On a spider chart, a longer Brightness point means more upper-register clarity and bite.',

    drummerRead:
      'Dark feels smoother and woodier. Bright feels clearer, crisper, and more cutting.',
  },

  Sensitivity: {
    key: 'sensitivity',

    low: 'Forgiving',

    high: 'Responsive',

    sublabel: 'Response',

    icon: 'sensitivity',

    meaning:
      'How easily the drum reacts to lighter playing. A forgiving response feels stable and controlled; a responsive drum reveals more ghost notes, touch, and nuance.',

    rangeBar:
      'On a range bar, Sensitivity shows how readily the drum responds to soft strokes, ghost notes, and small changes in touch.',

    spiderChart:
      'On a spider chart, a longer Sensitivity point means the drum reveals more subtle playing detail.',

    drummerRead:
      'Forgiving feels stable and controlled. Responsive feels more detailed, touchy, and alive under lighter hands.',
  },

  Control: {
    key: 'control',

    low: 'Open',

    high: 'Composed',

    sublabel: 'Focus',

    icon: 'control',

    meaning:
      'How organized the overall note feels. More open drums have extra movement and spread; more composed drums keep the note focused and easier to manage.',

    rangeBar:
      'On a range bar, Control shows whether the note has more movement and spread or stays focused and organized.',

    spiderChart:
      'On a spider chart, a longer Control point means the drum should feel more composed, focused, and easy to place.',

    drummerRead:
      'Open feels more lively and loose. Composed feels focused, tidy, and easier to control.',
  },
};

const LEGACYPRINT_RANGE_BY_SERIES = {
  heritage: {
    Attack: [40, 66],

    Sustain: [30, 58],

    Warmth: [56, 82],

    Projection: [42, 68],

    Brightness: [32, 60],

    Sensitivity: [34, 62],

    Control: [50, 78],
  },

  feuzon: {
    Attack: [56, 84],

    Sustain: [46, 76],

    Warmth: [44, 72],

    Projection: [56, 86],

    Brightness: [48, 78],

    Sensitivity: [52, 82],

    Control: [48, 76],
  },

  soundlegend: {
    Attack: [34, 94],

    Sustain: [28, 88],

    Warmth: [38, 96],

    Projection: [40, 96],

    Brightness: [30, 90],

    Sensitivity: [38, 96],

    Control: [36, 92],
  },
};

const VOICE_NODE_GUIDE = Object.entries(LEGACYPRINT_AXIS_META).map(
  ([label, meta]) => ({
    label,

    ...meta,
  })
);

const GUIDE_NODE_POSITIONS = {
  attack: { x: 50, y: 10.5 },

  sustain: { x: 80.9, y: 25.4 },

  warmth: { x: 88.5, y: 58.8 },

  projection: { x: 67.2, y: 85.8 },

  brightness: { x: 32.8, y: 85.8 },

  sensitivity: { x: 11.5, y: 58.8 },

  control: { x: 19.1, y: 25.4 },
};

const getSeriesById = (id) =>
  DRUM_SERIES.find((series) => series.id === id) || DRUM_SERIES[0];

const MetricIcon = ({ type, color = '#d6b277', size = 16 }) => {
  const iconProps = {
    size,

    strokeWidth: 2.15,

    color,

    'aria-hidden': true,
  };

  switch (type) {
    case 'attack':
      return <Zap {...iconProps} />;

    case 'sustain':
      return <Waves {...iconProps} />;

    case 'warmth':
      return <Flame {...iconProps} />;

    case 'projection':
      return <Volume2 {...iconProps} />;

    case 'brightness':
      return <SunMedium {...iconProps} />;

    case 'sensitivity':
      return <Feather {...iconProps} />;

    case 'control':
      return <Crosshair {...iconProps} />;

    default:
      return <Zap {...iconProps} />;
  }
};

const VoiceNodeGuideModal = ({ onClose }) => {
  const [activeNodeKey, setActiveNodeKey] = useState(null);

  const [activeInfoPanel, setActiveInfoPanel] = useState('overview');

  const activeNode =
    VOICE_NODE_GUIDE.find((node) => node.key === activeNodeKey) || null;

  const polygonSegments = VOICE_NODE_GUIDE.map((node, index) => {
    const nextNode = VOICE_NODE_GUIDE[(index + 1) % VOICE_NODE_GUIDE.length];

    return {
      from: node,

      to: nextNode,

      fromPosition: GUIDE_NODE_POSITIONS[node.key],

      toPosition: GUIDE_NODE_POSITIONS[nextNode.key],

      gradientId: `oadVoiceSegmentGradient-${node.key}-${nextNode.key}`,
    };
  });

  const handleNodeClick = (nodeKey) => {
    setActiveNodeKey(nodeKey);

    setActiveInfoPanel('overview');
  };

  const activeInfoContent = activeNode
    ? {
        overview: {
          label: 'Overview',

          text: activeNode.meaning,
        },

        read: {
          label: 'How to read it',

          text: 'Whether you are looking at a range bar, spider chart, or comparison graph, the idea is the same: the farther the shape pushes toward the outside, the more strongly that trait is showing up in the drum’s voice.',
        },

        translation: {
          label: 'Drummer translation',

          text: activeNode.drummerRead,
        },
      }
    : null;

  return (
    <div
      className="oad-node-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="oad-node-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oad-node-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="oad-node-modal-head">
          <div className="oad-node-modal-title-block">
            <span className="oad-node-modal-kicker">
              LegacyPrint™ sound guide
            </span>

            <h3 id="oad-node-modal-title">Voice Map Reference</h3>
          </div>

          <button
            type="button"
            className="oad-node-modal-close"
            onClick={onClose}
            aria-label="Close voice node guide"
          >
            ×
          </button>
        </div>

        <div className="oad-node-modal-body">
          <div className="oad-voice-engine">
            <div className="oad-voice-engine-orbit" aria-hidden="true">
              <svg
                className="oad-voice-polygon-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  {polygonSegments.map((segment) => (
                    <linearGradient
                      key={segment.gradientId}
                      id={segment.gradientId}
                      gradientUnits="userSpaceOnUse"
                      x1={segment.fromPosition.x}
                      y1={segment.fromPosition.y}
                      x2={segment.toPosition.x}
                      y2={segment.toPosition.y}
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          AXIS_COLOR_BY_KEY[segment.from.key] || '#d6b277'
                        }
                      />

                      <stop
                        offset="50%"
                        stopColor={
                          AXIS_COLOR_BY_KEY[segment.from.key] &&
                          AXIS_COLOR_BY_KEY[segment.to.key]
                            ? `color-mix(in srgb, ${
                                AXIS_COLOR_BY_KEY[segment.from.key]
                              } 50%, ${AXIS_COLOR_BY_KEY[segment.to.key]} 50%)`
                            : '#d6b277'
                        }
                      />

                      <stop
                        offset="100%"
                        stopColor={
                          AXIS_COLOR_BY_KEY[segment.to.key] || '#d6b277'
                        }
                      />
                    </linearGradient>
                  ))}

                  <filter id="oadVoicePolygonGlow">
                    <feGaussianBlur stdDeviation="1.4" result="blur" />

                    <feMerge>
                      <feMergeNode in="blur" />

                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {polygonSegments.map((segment) => (
                  <line
                    key={`${segment.gradientId}-glow`}
                    className="oad-voice-polygon-segment oad-voice-polygon-segment-glow"
                    x1={segment.fromPosition.x}
                    y1={segment.fromPosition.y}
                    x2={segment.toPosition.x}
                    y2={segment.toPosition.y}
                    stroke={`url(#${segment.gradientId})`}
                  />
                ))}

                {polygonSegments.map((segment) => (
                  <line
                    key={`${segment.gradientId}-main`}
                    className="oad-voice-polygon-segment oad-voice-polygon-segment-main"
                    x1={segment.fromPosition.x}
                    y1={segment.fromPosition.y}
                    x2={segment.toPosition.x}
                    y2={segment.toPosition.y}
                    stroke={`url(#${segment.gradientId})`}
                    filter="url(#oadVoicePolygonGlow)"
                  />
                ))}

                {polygonSegments.map((segment) => (
                  <line
                    key={`${segment.gradientId}-core`}
                    className="oad-voice-polygon-segment oad-voice-polygon-segment-core"
                    x1={segment.fromPosition.x}
                    y1={segment.fromPosition.y}
                    x2={segment.toPosition.x}
                    y2={segment.toPosition.y}
                    stroke={`url(#${segment.gradientId})`}
                  />
                ))}
              </svg>
            </div>

            <div className="oad-node-button-layer">
              {VOICE_NODE_GUIDE.map((node) => {
                const axisColor = AXIS_COLOR_BY_KEY[node.key] || '#d6b277';

                const position = GUIDE_NODE_POSITIONS[node.key];

                return (
                  <button
                    key={node.key}
                    type="button"
                    className={`oad-guide-node-button oad-guide-node-${node.key} ${
                      activeNodeKey === node.key ? 'is-active' : ''
                    }`}
                    style={{
                      '--oad-axis-color': axisColor,

                      '--node-x': `${position.x}%`,

                      '--node-y': `${position.y}%`,
                    }}
                    onClick={() => handleNodeClick(node.key)}
                    aria-label={`Read ${node.label}`}
                  >
                    <span className="oad-guide-node-icon">
                      <MetricIcon
                        type={node.icon}
                        color={axisColor}
                        size={18}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <section
              className={`oad-engine-center ${
                activeNode ? 'is-showing-node' : ''
              }`}
              style={{
                '--oad-axis-color': activeNode
                  ? AXIS_COLOR_BY_KEY[activeNode.key]
                  : '#d6b277',
              }}
            >
              {!activeNode && (
                <div className="oad-engine-intro">
                  <span className="oad-engine-intro-kicker">
                    LegacyPrint™ voice engine
                  </span>

                  <h4>Tap a sound node.</h4>

                  <p>
                    Each node represents one part of how a drum speaks, feels,
                    responds, and carries.
                  </p>

                  <p>
                    Tap an icon around the polygon to learn how to read that
                    trait across range bars, spider charts, and build notes.
                  </p>

                  <div className="oad-engine-mini-map" aria-hidden="true">
                    {VOICE_NODE_GUIDE.map((node) => {
                      const axisColor =
                        AXIS_COLOR_BY_KEY[node.key] || '#d6b277';

                      return (
                        <span
                          key={node.key}
                          style={{ '--oad-axis-color': axisColor }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {activeNode && (
                <div className="oad-engine-node-detail">
                  <div className="oad-engine-node-title">
                    <span className="oad-engine-node-title-icon">
                      <MetricIcon
                        type={activeNode.icon}
                        color={AXIS_COLOR_BY_KEY[activeNode.key]}
                        size={24}
                      />
                    </span>

                    <h4>{activeNode.label}</h4>
                  </div>

                  <span className="oad-engine-node-range">
                    {activeNode.low} / {activeNode.high}
                  </span>

                  <div className="oad-engine-info-card">
                    {activeInfoPanel === 'overview' && (
                      <>
                        <span>Overview</span>

                        <p>{activeNode.meaning}</p>
                      </>
                    )}

                    {activeInfoPanel === 'read' && (
                      <>
                        <span>How to read it</span>

                        <p>
                          Whether you are looking at a range bar, spider chart,
                          or comparison graph, the idea is the same: the farther
                          the shape pushes toward the outside, the more strongly
                          that trait is showing up in the drum’s voice.
                        </p>
                      </>
                    )}

                    {activeInfoPanel === 'translation' && (
                      <>
                        <span>Drummer translation</span>

                        <p>{activeNode.drummerRead}</p>
                      </>
                    )}
                  </div>

                  <div className="oad-engine-node-controls">
                    <div
                      className="oad-engine-dot-nav"
                      aria-label="Voice node detail selector"
                    >
                      <button
                        type="button"
                        className={`oad-engine-dot ${activeInfoPanel === 'overview' ? 'is-active' : ''}`}
                        onClick={() => setActiveInfoPanel('overview')}
                        aria-label="Overview"
                      />

                      <button
                        type="button"
                        className={`oad-engine-dot ${activeInfoPanel === 'read' ? 'is-active' : ''}`}
                        onClick={() => setActiveInfoPanel('read')}
                        aria-label="How to read it"
                      />

                      <button
                        type="button"
                        className={`oad-engine-dot ${activeInfoPanel === 'translation' ? 'is-active' : ''}`}
                        onClick={() => setActiveInfoPanel('translation')}
                        aria-label="Drummer translation"
                      />
                    </div>

                    <button
                      type="button"
                      className="oad-engine-back-button"
                      onClick={() => setActiveNodeKey(null)}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToneBars = ({ profile, seriesId }) => {
  const seriesColor = SERIES_RANGE_COLORS[seriesId] || '#398FA3';

  const [activeTouchNode, setActiveTouchNode] = useState(null);

  const handleTouchToggle = (label) => {
    setActiveTouchNode((current) => (current === label ? null : label));
  };

  return (
    <div
      className={`oad-tone-bars oad-tone-bars-${seriesId}`}
      aria-label="Ober LegacyPrint series voice range"
      style={{ '--oad-series-range-color': seriesColor }}
    >
      <div className="oad-tone-row-stack">
        {profile.map((item) => {
          const axisMeta = LEGACYPRINT_AXIS_META[item.label];

          const axisKey = axisMeta?.key || item.label.toLowerCase();

          const axisColor = AXIS_COLOR_BY_KEY[axisKey] || '#d6b277';

          const seriesRange = LEGACYPRINT_RANGE_BY_SERIES[seriesId]?.[
            item.label
          ] || [Math.max(item.value - 10, 0), Math.min(item.value + 10, 100)];

          const [rangeStart, rangeEnd] = seriesRange;

          const rangeWidth = Math.max(rangeEnd - rangeStart, 6);

          const isTouchOpen = activeTouchNode === item.label;

          return (
            <button
              key={item.label}
              type="button"
              className={`oad-tone-row oad-tone-row-${axisKey} ${
                isTouchOpen ? 'is-touch-open' : ''
              }`}
              style={{
                '--oad-axis-color': axisColor,

                '--range-start': rangeStart,

                '--range-width': rangeWidth,
              }}
              onClick={() => handleTouchToggle(item.label)}
              aria-expanded={isTouchOpen}
            >
              <div className="oad-tone-meta">
                <div className="oad-tone-title-group">
                  <span className="oad-tone-icon" aria-hidden="true">
                    <MetricIcon type={axisMeta?.icon} color={axisColor} />
                  </span>

                  <div className="oad-tone-title-copy">
                    <span className="oad-tone-label">{item.label}</span>

                    <span className="oad-tone-sublabel">
                      {axisMeta?.sublabel}
                    </span>
                  </div>
                </div>

                <span className="oad-tone-range-label">
                  {axisMeta?.low} → {axisMeta?.high}
                </span>
              </div>

              <div
                className="oad-tone-track"
                aria-label={`${item.label}: ${axisMeta?.low} to ${axisMeta?.high}`}
              >
                <div className="oad-tone-track-glow" aria-hidden="true" />

                <span className="oad-tone-scale-label oad-tone-scale-label-left">
                  {axisMeta?.low}
                </span>

                <span className="oad-tone-scale-label oad-tone-scale-label-right">
                  {axisMeta?.high}
                </span>

                <div
                  className="oad-tone-range-fill"
                  style={{
                    left: `${rangeStart}%`,

                    width: `${rangeWidth}%`,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="oad-tone-tooltip" role="tooltip">
                <strong>{item.label}</strong>

                <span>{item.note}</span>
              </div>

              <div className="oad-tone-touch-note" aria-hidden={!isTouchOpen}>
                <strong>{item.label}</strong>

                <span>{item.note}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SeriesFeature = ({ series, onNavigate, onCompare }) => {
  const [showVoiceNodeGuide, setShowVoiceNodeGuide] = useState(false);

  return (
    <>
      <div className={`oad-feature oad-feature-${series.id}`}>
        <div className="oad-feature-left">
          <div className="oad-feature-main">
            <div className="oad-feature-copy-grid">
              <div className="oad-feature-copy-block">
                <p className="oad-feature-quote">{series.quote}</p>

                <p className="oad-feature-copy">{series.description}</p>
              </div>
            </div>
          </div>

          <div className="oad-feature-highlights">
            <span className="oad-side-kicker">
              {series.id === 'soundlegend'
                ? 'What’s included'
                : 'Key build highlights'}
            </span>

            <ul className="oad-feature-highlight-list">
              {series.bullets.map((bullet) => (
                <li key={bullet} className="oad-feature-highlight-item">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="oad-feature-actions">
            <button
              type="button"
              className="oad-primary-btn"
              onClick={() => onNavigate(series.href)}
            >
              {series.cta}
            </button>

            <button type="button" className="oad-text-link" onClick={onCompare}>
              Compare the lines
            </button>
          </div>
        </div>

        <div className="oad-feature-side">
          <div className="oad-snapshot-head">
            <span className="oad-side-kicker">LegacyPrint™ read</span>

            <h3>{series.snapshotTitle}</h3>

            <p className="oad-side-copy">{series.snapshotSummary}</p>
          </div>

          <ToneBars profile={series.legacyPrintProfile} seriesId={series.id} />

          <div className="oad-legacyprint-footer-read">
            <p className="oad-legacyprint-powered">
              Powered by the Ober LegacyPrint™ Voicing Engine
            </p>

            <button
              type="button"
              className="oad-tone-guide-button oad-tone-guide-button-footer"
              onClick={() => setShowVoiceNodeGuide(true)}
            >
              How to read the voice nodes
            </button>
          </div>

          <VoiceProfileDisclaimer />
        </div>
      </div>

      {showVoiceNodeGuide && (
        <VoiceNodeGuideModal onClose={() => setShowVoiceNodeGuide(false)} />
      )}
    </>
  );
};

const LegacyPrintView = ({ onShowSoundLegend, onCompare }) => (
  <div className="oad-legacy">
    <div className="oad-legacy-head">
      <span className="oad-side-kicker">Ober LegacyPrint™ Voicing Engine</span>

      <h2>Listening made more measurable.</h2>

      <p>
        LegacyPrint™ helps translate broad tonal language into clearer voicing
        direction. It does not replace ears, judgment, or craftsmanship — it
        gives the conversation more shape.
      </p>
    </div>

    <div className="oad-legacy-columns">
      <article className="oad-legacy-column">
        <h3>HERITAGE</h3>

        <p>
          Used to preserve the line’s warm, grounded tonal identity and keep
          builds aligned to the classic Ober voice.
        </p>
      </article>

      <article className="oad-legacy-column">
        <h3>FEUZØN</h3>

        <p>
          Used to compare broader sound areas, helping map where the hybrid
          architecture can push projection, complexity, and articulation.
        </p>
      </article>

      <article className="oad-legacy-column">
        <h3>SOUNDLEGEND</h3>

        <p>
          Used most deeply during discovery, planning, and voicing — where the
          tonal direction becomes more personal, more intentional, and more
          artist-shaped.
        </p>
      </article>
    </div>

    <div className="oad-feature-actions oad-feature-actions-legacy">
      <button
        type="button"
        className="oad-primary-btn"
        onClick={onShowSoundLegend}
      >
        See SoundLegend
      </button>

      <button type="button" className="oad-secondary-btn" onClick={onCompare}>
        Compare the lines
      </button>
    </div>
  </div>
);

const CompareView = ({ onClose }) => (
  <div
    className="oad-compare-modal-backdrop"
    role="presentation"
    onMouseDown={onClose}
  >
    <div
      className="oad-compare-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oad-compare-modal-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="oad-compare-modal-head">
        <div className="oad-compare-head">
          <span className="oad-side-kicker">Compare</span>

          <h2 id="oad-compare-modal-title">How the lines differ</h2>

          <p>
            This is less about ranking and more about character. Each line
            carries a different center of gravity — in feel, response,
            philosophy, and how far the build process can stretch.
          </p>
        </div>

        <button
          type="button"
          className="oad-compare-modal-close"
          onClick={onClose}
          aria-label="Close comparison"
        >
          ×
        </button>
      </div>

      <div className="oad-compare">
        <div className="oad-compare-desktop">
          <div className="oad-compare-series-header">
            <div className="oad-compare-series-header-spacer" />

            {DRUM_SERIES.map((series) => (
              <div key={series.id} className="oad-compare-series-header-cell">
                <img
                  src={series.logo}
                  alt={series.name}
                  className="oad-compare-series-logo"
                />
              </div>
            ))}
          </div>

          <div className="oad-compare-stack">
            {COMPARE_ROWS.map((row) => (
              <div key={row.label} className="oad-compare-row-card">
                <div className="oad-compare-topic">
                  <span className="oad-compare-topic-title">{row.label}</span>

                  <p>{row.helper}</p>
                </div>

                <div className="oad-compare-series-grid">
                  <article className="oad-compare-series-card">
                    <p>{row.heritage}</p>
                  </article>

                  <article className="oad-compare-series-card">
                    <p>{row.feuzon}</p>
                  </article>

                  <article className="oad-compare-series-card">
                    <p>{row.soundlegend}</p>
                  </article>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="oad-compare-mobile">
          {COMPARE_ROWS.map((row) => (
            <div key={row.label} className="oad-compare-mobile-card">
              <div className="oad-compare-mobile-topic">
                <span className="oad-compare-topic-title">{row.label}</span>

                <p>{row.helper}</p>
              </div>

              <div className="oad-compare-mobile-series-list">
                {DRUM_SERIES.map((series) => (
                  <div
                    key={series.id}
                    className="oad-compare-mobile-series-item"
                  >
                    <img
                      src={series.logo}
                      alt={series.name}
                      className="oad-compare-mobile-logo"
                    />

                    <p>{row[series.id]}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const StageImage = ({
  primaryTab,

  activeSeries,

  collectionBaseImage,

  brightAllImage,

  onActivateSeries,

  onCommitSeries,
}) => {
  const isCollection = primaryTab === 'collection';

  return (
    <div className="oad-stage-interactive">
      <div className="oad-stage-wrap">
        <div className="oad-stage-figure">
          <img
            src={isCollection ? collectionBaseImage : brightAllImage}
            alt=""
            className="oad-stage-image oad-stage-image-base"
            draggable="false"
          />

          {isCollection && (
            <img
              src={activeSeries.activeLayer}
              alt=""
              className={`oad-stage-image oad-stage-image-active is-visible oad-active-${activeSeries.id}`}
              draggable="false"
            />
          )}

          {isCollection && (
            <>
              <div
                className="oad-zone-hitwrap"
                aria-label="Select a drum series"
              >
                {DRUM_SERIES.map((series) => (
                  <button
                    key={series.id}
                    type="button"
                    className={`oad-zone-hit oad-zone-hit-${series.id}`}
                    aria-label={`Show ${series.name}`}
                    onMouseEnter={() => onActivateSeries(series.id)}
                    onFocus={() => onActivateSeries(series.id)}
                    onClick={() => onCommitSeries(series.id)}
                  />
                ))}
              </div>

              <div className="oad-stage-logo-row" aria-label="Series selection">
                {[
                  getSeriesById('heritage'),

                  getSeriesById('soundlegend'),

                  getSeriesById('feuzon'),
                ].map((series) => (
                  <button
                    key={series.id}
                    type="button"
                    className={`oad-stage-logo-button oad-stage-logo-button-${series.id} ${
                      activeSeries.id === series.id ? 'is-active' : ''
                    }`}
                    onMouseEnter={() => onActivateSeries(series.id)}
                    onFocus={() => onActivateSeries(series.id)}
                    onClick={() => onCommitSeries(series.id)}
                    aria-label={`Show ${series.name}`}
                  >
                    <img
                      src={series.logo}
                      alt={series.name}
                      className="oad-stage-logo-image"
                      draggable="false"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ArtisanDrums = () => {
  const navigate = useNavigate();

  const [primaryTab, setPrimaryTab] = useState('collection');

  const [activeSeriesId, setActiveSeriesId] = useState('soundlegend');

  const [showCompareModal, setShowCompareModal] = useState(false);

  const activeSeries = useMemo(
    () => getSeriesById(activeSeriesId),

    [activeSeriesId]
  );

  const backgroundOnly = `${ASSET_BASE}/background-only.png`;

  const collectionBaseImage = `${ASSET_BASE}/drums-only-faded.png`;

  const brightAllImage = `${ASSET_BASE}/drums-only-bright.png`;

  const handleNavigate = useCallback(
    (href) => {
      navigate(href);
    },

    [navigate]
  );

  const handleSeriesPreview = useCallback((seriesId) => {
    setActiveSeriesId(seriesId);
  }, []);

  const handleSeriesCommit = useCallback((seriesId) => {
    setPrimaryTab('collection');

    setActiveSeriesId(seriesId);
  }, []);

  return (
    <section className="oad-collection" aria-label="Our Collection">
      <div
        className="oad-collection-bg"
        aria-hidden="true"
        style={{ backgroundImage: `url("${backgroundOnly}")` }}
      />

      <div className="oad-collection-vignette" aria-hidden="true" />

      <div className="oad-collection-shell">
        <header className="oad-collection-header">
          <span className="oad-kicker">Our Collection</span>

          <h1 className="oad-title">
            Three lines.
            <br />
            One philosophy.
          </h1>

          <p className="oad-lead">
            Explore how HERITAGE, FEUZØN, and SOUNDLEGEND each express a
            different side of the Ober Artisan voice — from rooted warmth, to
            hybrid range, to fully tailored custom storytelling.
          </p>
        </header>

        <StageImage
          primaryTab={primaryTab}
          activeSeries={activeSeries}
          collectionBaseImage={collectionBaseImage}
          brightAllImage={brightAllImage}
          onActivateSeries={handleSeriesPreview}
          onCommitSeries={handleSeriesCommit}
        />

        <div
          className={`oad-panel ${
            primaryTab !== 'collection' ? 'oad-panel-static' : ''
          }`}
        >
          {primaryTab === 'collection' && (
            <SeriesFeature
              series={activeSeries}
              onNavigate={handleNavigate}
              onCompare={() => setShowCompareModal(true)}
            />
          )}

          {primaryTab === 'legacyprint' && (
            <LegacyPrintView
              onShowSoundLegend={() => {
                setActiveSeriesId('soundlegend');

                setPrimaryTab('collection');
              }}
              onCompare={() => setShowCompareModal(true)}
            />
          )}
        </div>
      </div>

      {showCompareModal && (
        <CompareView onClose={() => setShowCompareModal(false)} />
      )}
    </section>
  );
};

export default ArtisanDrums;
