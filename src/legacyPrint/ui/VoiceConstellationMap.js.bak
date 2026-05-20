// src/legacyPrint/ui/VoiceConstellationMap.js

import React, { useMemo } from 'react';

import VoiceThreadMap from '../../components/VoiceThreadMap.js';

import './VoiceConstellationMap.css';

const DEFAULT_VOICE = {
  attack: 0.58,

  brightness: 0.61,

  projection: 0.48,

  sustain: 0.72,

  warmth: 0.65,

  sensitivity: 0.48,

  control: 0.58,
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

  control: 'Focus',
};

const READ_MODE_COPY = {
  legacyprint: {
    label: 'LegacyPrint',

    title: 'Voice Identity',

    description: 'The organic fingerprint of this drum voice.',
  },

  firstListen: {
    label: 'First Listen',

    title: 'First Audible Impression',

    description: 'The first three traits most likely to reach the ear.',
  },

  playerAnalysis: {
    label: 'Player Analysis',

    title: 'Seven-Node Player Read',

    description: 'The full profile of how this drum responds under the hand.',
  },
};

const clamp01 = (value, fallback = 0.5) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));
};

const getVoiceValue = (voice = {}, nodeKey) => {
  return clamp01(voice?.[nodeKey], DEFAULT_VOICE[nodeKey] ?? 0.5);
};

const voiceToLegacyProfile = (voice = {}) => {
  return VOICE_NODE_ORDER.reduce((profile, nodeKey) => {
    profile[nodeKey] = Number((getVoiceValue(voice, nodeKey) * 10).toFixed(2));

    return profile;
  }, {});
};

const normalizeNodeKeys = (keys = []) => {
  if (!Array.isArray(keys)) return [];

  return keys

    .filter((key, index, arr) => {
      return VOICE_NODE_ORDER.includes(key) && arr.indexOf(key) === index;
    })

    .slice(0, 3);
};

const getFallbackFirstListenKeys = (voice = {}) => {
  return [...VOICE_NODE_ORDER]

    .map((nodeKey) => ({
      nodeKey,

      value: getVoiceValue(voice, nodeKey),
    }))

    .sort((a, b) => b.value - a.value)

    .slice(0, 3)

    .map((item) => item.nodeKey);
};

const getResolvedFirstListenKeys = (voice = {}, firstListenKeys = []) => {
  const cleanKeys = normalizeNodeKeys(firstListenKeys);

  if (cleanKeys.length >= 3) return cleanKeys;

  const fallbackKeys = getFallbackFirstListenKeys(voice);

  const mergedKeys = [...cleanKeys];

  fallbackKeys.forEach((nodeKey) => {
    if (!mergedKeys.includes(nodeKey)) {
      mergedKeys.push(nodeKey);
    }
  });

  return mergedKeys.slice(0, 3);
};

const getReadVariant = (readMode) => {
  if (readMode === 'firstListen') return 'firstTell';

  if (readMode === 'playerAnalysis') return 'player';

  return 'legacyprint';
};

const buildActiveThread = ({ readMode, firstListenKeys }) => {
  const readVariant = getReadVariant(readMode);

  if (readVariant === 'firstTell') {
    return {
      id: `voice-playground-first-tell-${firstListenKeys.join('-')}`,

      title: 'First Audible Impression',

      slotKey: 'shaped',

      visualMode: 'triangle',

      nodes: firstListenKeys,
    };
  }

  if (readVariant === 'player') {
    return {
      id: 'voice-playground-player-analysis',

      title: 'Seven-Node Player Read',

      slotKey: 'complex',

      visualMode: 'player',

      nodes: VOICE_NODE_ORDER,
    };
  }

  return {
    id: 'voice-playground-legacyprint',

    title: 'Voice Identity',

    slotKey: 'complex',

    visualMode: 'legacyprint',

    nodes: firstListenKeys.length ? firstListenKeys : ['attack', 'warmth', 'control'],
  };
};

export default function VoiceConstellationMap({
  voice = DEFAULT_VOICE,

  compareVoice = null,

  readMode = 'legacyprint',

  firstListenKeys = [],

  onNodeClick,

  showFieldDots = true,

  className = '',
}) {
  const safeReadMode = READ_MODE_COPY[readMode] ? readMode : 'legacyprint';

  const modeCopy = READ_MODE_COPY[safeReadMode];

  const profile = useMemo(() => {
    return voiceToLegacyProfile(voice);
  }, [voice]);

  const compareProfile = useMemo(() => {
    if (!compareVoice) return null;

    return voiceToLegacyProfile(compareVoice);
  }, [compareVoice]);

  const resolvedFirstListenKeys = useMemo(() => {
    return getResolvedFirstListenKeys(voice, firstListenKeys);
  }, [voice, firstListenKeys]);

  const activeThread = useMemo(() => {
    return buildActiveThread({
      readMode: safeReadMode,

      firstListenKeys: resolvedFirstListenKeys,
    });
  }, [safeReadMode, resolvedFirstListenKeys]);

  const readVariant = useMemo(() => {
    return getReadVariant(safeReadMode);
  }, [safeReadMode]);

  const mapClassName = ['vcm-shell', 'vcm-shell--threadmap', `vcm-mode-${safeReadMode}`, className]

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
          firstTellKeys={resolvedFirstListenKeys}
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
