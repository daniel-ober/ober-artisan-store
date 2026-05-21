
import React, { useEffect, useMemo, useRef, useState } from 'react';

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

  shapeMode = false,

  onNodeClick,

  onNodeDrag,

  className = '',

}) {

  const safeReadMode = READ_MODE_COPY[readMode] ? readMode : 'legacyprint';

  const normalizedVoice = useMemo(() => normalizeVoice(voice), [voice]);

  const normalizedCompareVoice = useMemo(

    () => (compareVoice ? normalizeVoice(compareVoice) : null),

    [compareVoice]

  );

  const mapFrameRef = useRef(null);

  const draggingNodeKeyRef = useRef(null);

  const localShapeVoiceRef = useRef(null);

  const [draggingNodeKey, setDraggingNodeKey] = useState(null);

  const [localShapeVoice, setLocalShapeVoice] = useState(normalizedVoice);

  useEffect(() => {

    if (!shapeMode || draggingNodeKeyRef.current) return;

    localShapeVoiceRef.current = normalizedVoice;

    setLocalShapeVoice(normalizedVoice);

  }, [shapeMode, normalizedVoice]);

  const visualVoice = shapeMode ? localShapeVoice || normalizedVoice : normalizedVoice;

  const profile = useMemo(

    () => voiceToLegacyProfile(visualVoice),

    [visualVoice]

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

    return getTopNodes(visualVoice, 3);

  }, [firstListenKeys, visualVoice]);

  const activeThread = useMemo(

    () =>

      buildActiveThread({

        readMode: safeReadMode,

        voice: visualVoice,

        firstListenKeys: resolvedFirstListenKeys,

      }),

    [safeReadMode, visualVoice, resolvedFirstListenKeys]

  );

  const isPlayerShapeDragEnabled = shapeMode && safeReadMode === 'playerAnalysis';

  const getPointerValueForNode = (event, nodeKey) => {

    const frame = mapFrameRef.current;

    if (!frame) return null;

    const rect = frame.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;

    const centerY = rect.top + rect.height / 2;

    const pointerX = event.clientX;

    const pointerY = event.clientY;

    const nodeIndex = VOICE_NODE_ORDER.indexOf(nodeKey);

    if (nodeIndex < 0) return null;

    const angle = -Math.PI / 2 + (nodeIndex / VOICE_NODE_ORDER.length) * Math.PI * 2;

    const axisX = Math.cos(angle);

    const axisY = Math.sin(angle);

    const pointerVectorX = pointerX - centerX;

    const pointerVectorY = pointerY - centerY;

    const projectedDistance = pointerVectorX * axisX + pointerVectorY * axisY;

    const radius = Math.min(rect.width, rect.height) * 0.34;

    const rawValue = projectedDistance / radius;

    return Math.max(0.035, Math.min(1, rawValue));

  };

  const updateLocalNodeValue = (nodeKey, nextValue) => {

    const baseVoice = localShapeVoiceRef.current || visualVoice || normalizedVoice;

    const updatedVoice = {

      ...baseVoice,

      [nodeKey]: nextValue,

    };

    localShapeVoiceRef.current = updatedVoice;

    setLocalShapeVoice(updatedVoice);

  };

  const getShapeNodeStrength = (nodeKey) => {

    const rawValue = Number(visualVoice?.[nodeKey]);

    if (!Number.isFinite(rawValue)) return 0.35;

    return Math.max(0, Math.min(1, rawValue));

  };

  const shapeNodeStyleVars = {

    '--shape-attack-strength': getShapeNodeStrength('attack'),

    '--shape-brightness-strength': getShapeNodeStrength('brightness'),

    '--shape-projection-strength': getShapeNodeStrength('projection'),

    '--shape-sustain-strength': getShapeNodeStrength('sustain'),

    '--shape-warmth-strength': getShapeNodeStrength('warmth'),

    '--shape-sensitivity-strength': getShapeNodeStrength('sensitivity'),

    '--shape-control-strength': getShapeNodeStrength('control'),

  };

  const handleNodePointerDown = (event, nodeKey) => {

    if (!isPlayerShapeDragEnabled) {

      onNodeClick?.(nodeKey);

      return;

    }

    event.preventDefault();

    event.stopPropagation();

    draggingNodeKeyRef.current = nodeKey;

    setDraggingNodeKey(nodeKey);

    event.currentTarget.setPointerCapture?.(event.pointerId);

    const nextValue = getPointerValueForNode(event, nodeKey);

    if (nextValue !== null) {

      updateLocalNodeValue(nodeKey, nextValue);

    }

  };

  const handleNodePointerMove = (event, nodeKey) => {

    if (!isPlayerShapeDragEnabled) return;

    if (draggingNodeKeyRef.current !== nodeKey) return;

    if (event.pointerType === 'mouse' && event.buttons !== 1) return;

    event.preventDefault();

    event.stopPropagation();

    const nextValue = getPointerValueForNode(event, nodeKey);

    if (nextValue !== null) {

      updateLocalNodeValue(nodeKey, nextValue);

    }

  };

  const handleNodePointerEnd = (event) => {

    if (!isPlayerShapeDragEnabled) return;

    event.preventDefault();

    event.stopPropagation();

    const committedNodeKey = draggingNodeKeyRef.current;

    const committedVoice = localShapeVoiceRef.current;

    draggingNodeKeyRef.current = null;

    setDraggingNodeKey(null);

    if (committedNodeKey && committedVoice?.[committedNodeKey] !== undefined) {

      onNodeDrag?.(committedNodeKey, committedVoice[committedNodeKey]);

    }

  };

  const readVariant = getReadVariant(safeReadMode);

  const modeCopy = READ_MODE_COPY[safeReadMode];

  const mapClassName = [

    'vcm-shell',

    'vcm-shell--threadmap',

    `vcm-mode-${safeReadMode}`,

    shapeMode ? 'vcm-shape-enabled' : '',

    draggingNodeKey ? `vcm-is-dragging-node-${draggingNodeKey}` : '',

    className,

  ]

    .filter(Boolean)

    .join(' ');

  return (

    <section

      className={mapClassName}

      aria-label={`${modeCopy.label} voice map`}

      style={shapeMode ? shapeNodeStyleVars : undefined}

    >

      <div className="vcm-ambient vcm-ambient-purple" />

      <div className="vcm-ambient vcm-ambient-cyan" />

      <div className="vcm-ambient vcm-ambient-gold" />

      <div className="vcm-read-badge">

        <span>{modeCopy.label}</span>

        <strong>{modeCopy.title}</strong>

        <p>{modeCopy.description}</p>

      </div>

      <div className="vcm-map-frame" ref={mapFrameRef}>

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

        <div

          className={`vcm-node-click-layer ${isPlayerShapeDragEnabled ? 'is-draggable' : ''}`}

          aria-hidden="true"

        >

          {VOICE_NODE_ORDER.map((nodeKey) => (

            <button

              key={nodeKey}

              type="button"

              className="vcm-node-click-target"

              onPointerDown={(event) => handleNodePointerDown(event, nodeKey)}

              onPointerMove={(event) => handleNodePointerMove(event, nodeKey)}

              onPointerUp={handleNodePointerEnd}

              onPointerCancel={handleNodePointerEnd}

              onLostPointerCapture={handleNodePointerEnd}

              title={

                isPlayerShapeDragEnabled

                  ? `Drag ${NODE_LABELS[nodeKey]} along its spoke`

                  : `${NODE_LABELS[nodeKey]} / ${NODE_SHORT_LABELS[nodeKey]}`

              }

            />

          ))}

        </div>

      </div>

    </section>

  );

}

