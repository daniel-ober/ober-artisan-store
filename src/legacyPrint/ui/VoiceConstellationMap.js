
import React, { useMemo } from 'react';

import VoiceThreadMap from '../../components/VoiceThreadMap.js';

import './VoiceConstellationMap.css';

const DEFAULT_VOICE = {

  attack: 5,

  brightness: 5,

  projection: 5,

  sustain: 5,

  warmth: 5,

  sensitivity: 5,

  control: 5,

};

const VOICE_NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const NODE_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

const NODE_SHORT_LABELS = {

  attack: 'Strike',

  brightness: 'Clarity',

  projection: 'Carry',

  sustain: 'Bloom',

  warmth: 'Body',

  sensitivity: 'Touch',

  control: 'Refinement',

};

const READ_MODE_COPY = {

  legacyprint: {

    label: 'LegacyPrint',

    title: 'Voice Identity',

    description:

      'The organic fingerprint of the selected voice profile.',

  },

  firstListen: {

    label: 'First Listen',

    title: 'First Audible Impression',

    description:

      'The first three traits most likely to reach the ear before the full profile settles.',

  },

  playerAnalysis: {

    label: 'Player Analysis',

    title: 'Seven-Node Player Read',

    description:

      'The full profile across attack, brightness, projection, sustain, warmth, sensitivity, and control.',

  },

};

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const clampScore = (value, fallback = 5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return number > 1 ? Math.max(0, Math.min(10, number)) : clamp01(number, 0.5) * 10;

};

const normalizeVoice = (voice = {}) =>

  VOICE_NODE_ORDER.reduce((acc, key) => {

    acc[key] = clampScore(voice?.[key] ?? DEFAULT_VOICE[key], DEFAULT_VOICE[key]);

    return acc;

  }, {});

const voiceToLegacyProfile = (voice = {}) =>

  VOICE_NODE_ORDER.reduce((acc, key) => {

    acc[key] = Math.round(clampScore(voice[key], DEFAULT_VOICE[key]) * 1000) / 1000;

    return acc;

  }, {});

const getReadVariant = (readMode) => {

  if (readMode === 'firstListen') return 'firstTell';

  if (readMode === 'playerAnalysis') return 'player';

  return 'legacyprint';

};

const getVisualMode = (readMode) => {

  if (readMode === 'firstListen') return 'triangle';

  if (readMode === 'playerAnalysis') return 'player';

  return 'legacyprint';

};

const getTopNodes = (voice, count = 3) =>

  VOICE_NODE_ORDER.map((key) => ({

    key,

    value: clampScore(voice[key], DEFAULT_VOICE[key]),

    movement: Math.abs(clampScore(voice[key], DEFAULT_VOICE[key]) - 5),

  }))

    .sort((a, b) => {

      if (b.movement !== a.movement) return b.movement - a.movement;

      return b.value - a.value;

    })

    .slice(0, count)

    .map((item) => item.key);

const buildActiveThread = ({ readMode, voice, firstListenKeys }) => {

  const isFirstListen = readMode === 'firstListen';

  const topNodes = isFirstListen && Array.isArray(firstListenKeys) && firstListenKeys.length

    ? firstListenKeys.slice(0, 3)

    : getTopNodes(voice, 3);

  const nodeKeys = isFirstListen ? topNodes : VOICE_NODE_ORDER;

  const voiceSignature = VOICE_NODE_ORDER.map((key) =>

    Math.round(clampScore(voice?.[key], DEFAULT_VOICE[key]) * 10)

  ).join('-');

  return {

    id: `voice-playground-${readMode}-${voiceSignature}`,

    title: READ_MODE_COPY[readMode]?.title || 'Voice Map',

    summary: READ_MODE_COPY[readMode]?.description || '',

    nodes: nodeKeys,

    nodeKeys,

    firstTellKeys: isFirstListen ? topNodes : [],

    dominantNodes: topNodes,

    visualMode: getVisualMode(readMode),

  };

};

export default function VoiceConstellationMap({

  voice = DEFAULT_VOICE,

  compareVoice = null,

  readMode = 'legacyprint',

  firstListenKeys = [],

  showFieldDots = false,

  onNodeClick,

  className = '',

}) {

  const safeReadMode = READ_MODE_COPY[readMode] ? readMode : 'legacyprint';

  const normalizedVoice = useMemo(() => normalizeVoice(voice), [voice]);

  const normalizedCompareVoice = useMemo(

    () => (compareVoice ? normalizeVoice(compareVoice) : null),

    [compareVoice]

  );

  const profile = useMemo(

    () => voiceToLegacyProfile(normalizedVoice),

    [normalizedVoice]

  );

  const compareProfile = useMemo(

    () =>

      normalizedCompareVoice

        ? voiceToLegacyProfile(normalizedCompareVoice)

        : null,

    [normalizedCompareVoice]

  );

  const resolvedFirstListenKeys = useMemo(() => {

    if (Array.isArray(firstListenKeys) && firstListenKeys.length) {

      return firstListenKeys.slice(0, 3);

    }

    return getTopNodes(normalizedVoice, 3);

  }, [firstListenKeys, normalizedVoice]);

  const activeThread = useMemo(

    () =>

      buildActiveThread({

        readMode: safeReadMode,

        voice: normalizedVoice,

        firstListenKeys: resolvedFirstListenKeys,

      }),

    [safeReadMode, normalizedVoice, resolvedFirstListenKeys]

  );

  const readVariant = getReadVariant(safeReadMode);

  const modeCopy = READ_MODE_COPY[safeReadMode];

  const mapClassName = [

    'vcm-shell',

    'vcm-shell--threadmap',

    `vcm-mode-${safeReadMode}`,

    className,

  ]

    .filter(Boolean)

    .join(' ');

  return (

    <section className={mapClassName} aria-label={`${modeCopy.label} voice map`}>

      <div className="vcm-ambient vcm-ambient-purple" />

      <div className="vcm-ambient vcm-ambient-cyan" />

      <div className="vcm-ambient vcm-ambient-gold" />

      <div className="vcm-read-badge">

        <span>{modeCopy.label}</span>

        <strong>{modeCopy.title}</strong>

        <p>{modeCopy.description}</p>

      </div>

      <div className="vcm-map-frame">

        <VoiceThreadMap

          activeThread={activeThread}

          compact={false}

          strengthScore={1}

          profile={profile}

          input={{}}

          currentSpec={{}}

          displayMode="VoiceMapping"

          readVariant={readVariant}

          firstTellKeys={safeReadMode === 'firstListen' ? resolvedFirstListenKeys : []}

          compareProfile={compareProfile}

          showFieldDots={showFieldDots}

        />

        <div className="vcm-node-click-layer" aria-hidden="true">

          {VOICE_NODE_ORDER.map((nodeKey) => (

            <button

              key={nodeKey}

              type="button"

              className="vcm-node-click-target"

              onClick={() => onNodeClick?.(nodeKey)}

              title={`${NODE_LABELS[nodeKey]} / ${NODE_SHORT_LABELS[nodeKey]}`}

            />

          ))}

        </div>

      </div>

    </section>

  );

}

