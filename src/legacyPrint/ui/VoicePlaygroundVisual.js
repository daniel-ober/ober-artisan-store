
import React, { useMemo } from 'react';

import {

  Zap,

  SunMedium,

  Volume2,

  Waves,

  Flame,

  Feather,

  Crosshair,

} from 'lucide-react';

import './VoicePlaygroundVisual.css';

const NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const NODE_META = {

  attack: {

    label: 'Attack',

    shortLabel: 'Strike',

    Icon: Zap,

    color: '#ff7048',

    low: 'Soft onset',

    high: 'Fast strike',

  },

  brightness: {

    label: 'Brightness',

    shortLabel: 'Shine',

    Icon: SunMedium,

    color: '#f0dc73',

    low: 'Muted color',

    high: 'Open sheen',

  },

  projection: {

    label: 'Projection',

    shortLabel: 'Carry',

    Icon: Volume2,

    color: '#ffb23e',

    low: 'Close voice',

    high: 'Room push',

  },

  sustain: {

    label: 'Sustain',

    shortLabel: 'Bloom',

    Icon: Waves,

    color: '#4e84ff',

    low: 'Quick stop',

    high: 'Long bloom',

  },

  warmth: {

    label: 'Warmth',

    shortLabel: 'Body',

    Icon: Flame,

    color: '#c86b32',

    low: 'Lean tone',

    high: 'Round body',

  },

  sensitivity: {

    label: 'Sensitivity',

    shortLabel: 'Touch',

    Icon: Feather,

    color: '#64d9dc',

    low: 'Firm feel',

    high: 'Soft response',

  },

  control: {

    label: 'Control',

    shortLabel: 'Frame',

    Icon: Crosshair,

    color: '#a18bff',

    low: 'Loose edge',

    high: 'Focused frame',

  },

};

const DEFAULT_VOICE = {

  attack: 0.5,

  brightness: 0.5,

  projection: 0.5,

  sustain: 0.5,

  warmth: 0.5,

  sensitivity: 0.5,

  control: 0.5,

};

const READ_COPY = {

  firstListen: {

    kicker: 'First Tell',

    title: 'First Listen',

    subtitle: 'Most immediate traits',

  },

  playerAnalysis: {

    kicker: 'Seven-Node Read',

    title: 'Player Analysis',

    subtitle: 'Full profile balance',

  },

  legacyprint: {

    kicker: 'Identity',

    title: 'LegacyPrint Identity',

    subtitle: 'Living acoustic body',

  },

};

const CENTER = { x: 240, y: 210 };

const MIN_R = 52;

const MAX_R = 142;

const ICON_R = 182;

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1];

const AXIS = {

  attack: -90,

  brightness: -35,

  projection: 8,

  sustain: 62,

  warmth: 118,

  sensitivity: 172,

  control: -148,

};

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const normalizeVoice = (voice = {}) =>

  NODE_ORDER.reduce((acc, key) => {

    acc[key] = clamp01(voice?.[key] ?? DEFAULT_VOICE[key], DEFAULT_VOICE[key]);

    return acc;

  }, {});

const polarPoint = (angleDeg, radius) => {

  const angle = (angleDeg * Math.PI) / 180;

  return {

    x: CENTER.x + Math.cos(angle) * radius,

    y: CENTER.y + Math.sin(angle) * radius,

  };

};

const valuePoint = (key, value) => {

  const radius = MIN_R + clamp01(value) * (MAX_R - MIN_R);

  return polarPoint(AXIS[key], radius);

};

const iconPoint = (key) => polarPoint(AXIS[key], ICON_R);

const buildPolygonPath = (voice, keys = NODE_ORDER) => {

  const points = keys.map((key) => valuePoint(key, voice[key]));

  if (!points.length) return '';

  return points

    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)

    .join(' ') + ' Z';

};

const buildOpenPath = (voice, keys = NODE_ORDER) => {

  const points = keys.map((key) => valuePoint(key, voice[key]));

  if (!points.length) return '';

  return points

    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)

    .join(' ');

};

const getTopNodes = (voice, count = 3) =>

  NODE_ORDER.map((key) => ({

    key,

    value: voice[key],

    movement: Math.abs(voice[key] - 0.5),

  }))

    .sort((a, b) => {

      if (b.movement !== a.movement) return b.movement - a.movement;

      return b.value - a.value;

    })

    .slice(0, count)

    .map((item) => item.key);

const buildBlobPath = (voice) => {

  const pointCount = 64;

  const attack = voice.attack;

  const brightness = voice.brightness;

  const projection = voice.projection;

  const sustain = voice.sustain;

  const warmth = voice.warmth;

  const sensitivity = voice.sensitivity;

  const control = voice.control;

  const roughness = 1 - sensitivity;

  const looseness = 1 - control;

  const base = 48 + warmth * 34 + projection * 18;

  const squash = 0.62 + warmth * 0.09 + sustain * 0.12;

  const points = Array.from({ length: pointCount }, (_, index) => {

    const t = index / pointCount;

    const angle = t * Math.PI * 2 - Math.PI / 2;

    const top = Math.max(0, Math.sin(-angle));

    const right = Math.max(0, Math.cos(angle));

    const bottom = Math.max(0, Math.sin(angle));

    const left = Math.max(0, -Math.cos(angle));

    const attackSpike = top > 0.55 ? attack * top * top * 54 : 0;

    const brightnessRipple = Math.sin(angle * 13) * brightness * 8;

    const projectionPush = right * projection * 38;

    const sustainTail = right * bottom * sustain * 70;

    const warmthBody = bottom * warmth * 30;

    const sensitivitySoftener = Math.sin(angle * 5 + sensitivity * 2) * sensitivity * 5;

    const controlContain = -control * Math.abs(Math.sin(angle * 3)) * 10;

    const looseEdge = Math.sin(angle * 17 + 0.7) * looseness * 13;

    const roughEdge = Math.cos(angle * 23 + 1.8) * roughness * 9;

    const radius =

      base +

      attackSpike +

      brightnessRipple +

      projectionPush +

      sustainTail +

      warmthBody +

      sensitivitySoftener +

      controlContain +

      looseEdge +

      roughEdge -

      left * control * 8;

    return {

      x: CENTER.x + Math.cos(angle) * radius,

      y: CENTER.y + Math.sin(angle) * radius * squash,

    };

  });

  const first = points[0];

  let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let index = 0; index < points.length; index += 1) {

    const current = points[index];

    const next = points[(index + 1) % points.length];

    path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${(

      (current.x + next.x) /

      2

    ).toFixed(2)} ${((current.y + next.y) / 2).toFixed(2)}`;

  }

  return `${path} Z`;

};

const getNodeOpacity = (value, active = true) => {

  const v = clamp01(value);

  if (!active) return 0.22;

  return 0.18 + v * 0.82;

};

function Grid() {

  return (

    <g className="vpv-grid" aria-hidden="true">

      {GRID_LEVELS.map((level) => (

        <path

          key={level}

          d={buildPolygonPath(

            NODE_ORDER.reduce((acc, key) => {

              acc[key] = level;

              return acc;

            }, {})

          )}

          className="vpv-grid-ring"

        />

      ))}

      {NODE_ORDER.map((key) => {

        const end = polarPoint(AXIS[key], MAX_R + 14);

        return (

          <line

            key={key}

            x1={CENTER.x}

            y1={CENTER.y}

            x2={end.x}

            y2={end.y}

            className="vpv-grid-spoke"

          />

        );

      })}

    </g>

  );

}

function NodeIcons({ voice, activeKeys, onNodeClick }) {

  return (

    <g className="vpv-node-icons">

      {NODE_ORDER.map((key) => {

        const meta = NODE_META[key];

        const Icon = meta.Icon;

        const point = iconPoint(key);

        const isActive = activeKeys.includes(key);

        const value = voice[key];

        return (

          <foreignObject

            key={key}

            x={point.x - 19}

            y={point.y - 19}

            width="38"

            height="38"

            className="vpv-node-icon-wrap"

          >

            <button

              xmlns="http://www.w3.org/1999/xhtml"

              type="button"

              className={`vpv-node-icon ${isActive ? 'is-active' : ''}`}

              style={{

                '--node-color': meta.color,

                '--node-opacity': getNodeOpacity(value, isActive),

              }}

              title={`${meta.label}: ${Math.round(value * 10)}/10`}

              onClick={() => onNodeClick?.(key)}

            >

              <Icon size={21} strokeWidth={1.9} />

            </button>

          </foreignObject>

        );

      })}

    </g>

  );

}

function ReadHeader({ copy }) {

  return (

    <div className="vpv-read-header">

      <span>{copy.kicker}</span>

      <strong>{copy.title}</strong>

      <em>{copy.subtitle}</em>

    </div>

  );

}

function PlayerShape({ voice }) {

  const polygonPath = buildPolygonPath(voice);

  const openPath = buildOpenPath(voice);

  return (

    <g className="vpv-player-shape">

      <path d={polygonPath} className="vpv-player-fill" />

      <path d={polygonPath} className="vpv-player-halo" />

      <path d={polygonPath} className="vpv-player-glow" />

      <path d={polygonPath} className="vpv-player-core" />

      <path d={openPath} className="vpv-player-hotline" />

      {NODE_ORDER.map((key) => {

        const point = valuePoint(key, voice[key]);

        return (

          <circle

            key={key}

            cx={point.x}

            cy={point.y}

            r="2.2"

            className="vpv-player-anchor"

            style={{ '--node-color': NODE_META[key].color }}

          />

        );

      })}

    </g>

  );

}

function FirstListenShape({ voice, firstListenKeys }) {

  const activeKeys = firstListenKeys?.length ? firstListenKeys.slice(0, 3) : getTopNodes(voice, 3);

  const trianglePath = buildPolygonPath(voice, activeKeys);

  return (

    <g className="vpv-first-shape">

      <path d={trianglePath} className="vpv-first-fill" />

      <path d={trianglePath} className="vpv-first-halo" />

      <path d={trianglePath} className="vpv-first-glow" />

      <path d={trianglePath} className="vpv-first-core" />

    </g>

  );

}

function IdentityShape({ voice }) {

  const blobPath = buildBlobPath(voice);

  return (

    <g className="vpv-identity-shape">

      <ellipse cx="272" cy="214" rx="174" ry="102" className="vpv-identity-room" />

      <path d={blobPath} className="vpv-identity-shadow" />

      <path d={blobPath} className="vpv-identity-fill" />

      <path d={blobPath} className="vpv-identity-color" />

      <path d={blobPath} className="vpv-identity-halo" />

      <path d={blobPath} className="vpv-identity-glow" />

      <path d={blobPath} className="vpv-identity-core" />

      {Array.from({ length: 28 }, (_, index) => {

        const angle = (index / 28) * Math.PI * 2;

        const radius = 18 + ((index * 19) % 72);

        const x = CENTER.x + Math.cos(angle) * radius + voice.projection * 18;

        const y = CENTER.y + Math.sin(angle) * radius * 0.55 - voice.brightness * 10;

        const opacity = 0.12 + voice.brightness * 0.36 + voice.sensitivity * 0.16;

        return (

          <circle

            key={index}

            cx={x}

            cy={y}

            r={index % 7 === 0 ? 2.15 : 1.25}

            className="vpv-identity-spark"

            style={{ opacity }}

          />

        );

      })}

    </g>

  );

}

function ReadList({ voice }) {

  return (

    <div className="vpv-read-list" aria-hidden="true">

      {NODE_ORDER.map((key) => {

        const meta = NODE_META[key];

        const value = voice[key];

        return (

          <div key={key} className="vpv-read-row">

            <span style={{ color: meta.color }}>{meta.label}</span>

            <b>{Math.round(value * 10)}</b>

            <i>

              <em style={{ width: `${Math.max(4, value * 100)}%`, background: meta.color }} />

            </i>

          </div>

        );

      })}

    </div>

  );

}

export default function VoicePlaygroundVisual({

  voice = DEFAULT_VOICE,

  readMode = 'legacyprint',

  firstListenKeys = [],

  onNodeClick,

}) {

  const resolvedVoice = useMemo(() => normalizeVoice(voice), [voice]);

  const safeReadMode = READ_COPY[readMode] ? readMode : 'legacyprint';

  const activeKeys = useMemo(() => {

    if (safeReadMode === 'firstListen') {

      return firstListenKeys?.length ? firstListenKeys.slice(0, 3) : getTopNodes(resolvedVoice, 3);

    }

    return NODE_ORDER;

  }, [safeReadMode, firstListenKeys, resolvedVoice]);

  const copy = READ_COPY[safeReadMode];

  return (

    <section className={`vpv-shell vpv-mode-${safeReadMode}`} aria-label={copy.title}>

      <ReadHeader copy={copy} />

      <div className="vpv-map">

        <svg viewBox="0 0 480 430" role="img" aria-label={`${copy.title} voice map`}>

          <defs>

            <radialGradient id="vpv-stage-glow" cx="50%" cy="48%" r="60%">

              <stop offset="0%" stopColor="rgba(168, 96, 255, 0.26)" />

              <stop offset="38%" stopColor="rgba(255, 176, 70, 0.12)" />

              <stop offset="70%" stopColor="rgba(72, 232, 228, 0.07)" />

              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />

            </radialGradient>

            <linearGradient id="vpv-player-gradient" x1="82" y1="120" x2="392" y2="296">

              <stop offset="0%" stopColor="#64d9dc" />

              <stop offset="28%" stopColor="#a18bff" />

              <stop offset="54%" stopColor="#ff7048" />

              <stop offset="76%" stopColor="#f0dc73" />

              <stop offset="100%" stopColor="#ffb23e" />

            </linearGradient>

            <radialGradient id="vpv-identity-fill" cx="48%" cy="42%" r="66%">

              <stop offset="0%" stopColor="rgba(255, 238, 176, 0.62)" />

              <stop offset="24%" stopColor="rgba(255, 112, 72, 0.52)" />

              <stop offset="48%" stopColor="rgba(176, 82, 255, 0.42)" />

              <stop offset="72%" stopColor="rgba(78, 132, 255, 0.34)" />

              <stop offset="100%" stopColor="rgba(100, 217, 220, 0.22)" />

            </radialGradient>

            <filter id="vpv-soft-glow" x="-60%" y="-60%" width="220%" height="220%">

              <feGaussianBlur stdDeviation="7" result="blur" />

              <feMerge>

                <feMergeNode in="blur" />

                <feMergeNode in="SourceGraphic" />

              </feMerge>

            </filter>

            <filter id="vpv-heavy-glow" x="-90%" y="-90%" width="280%" height="280%">

              <feGaussianBlur stdDeviation="14" result="blur" />

              <feColorMatrix

                in="blur"

                type="matrix"

                values="1 0 0 0 0.1  0 1 0 0 0.03  0 0 1 0 0.16  0 0 0 1 0"

                result="coloredBlur"

              />

              <feMerge>

                <feMergeNode in="coloredBlur" />

                <feMergeNode in="SourceGraphic" />

              </feMerge>

            </filter>

          </defs>

          <rect x="0" y="0" width="480" height="430" fill="url(#vpv-stage-glow)" />

          <Grid />

          {safeReadMode === 'firstListen' && (

            <FirstListenShape voice={resolvedVoice} firstListenKeys={firstListenKeys} />

          )}

          {safeReadMode === 'playerAnalysis' && <PlayerShape voice={resolvedVoice} />}

          {safeReadMode === 'legacyprint' && <IdentityShape voice={resolvedVoice} />}

          <NodeIcons voice={resolvedVoice} activeKeys={activeKeys} onNodeClick={onNodeClick} />

        </svg>

        {safeReadMode !== 'firstListen' && <ReadList voice={resolvedVoice} />}

      </div>

    </section>

  );

}

