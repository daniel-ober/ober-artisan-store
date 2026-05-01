// src/components/VoiceThreadMap.js

import React, { useMemo } from 'react';

import {
  Zap,
  Waves,
  Flame,
  Volume2,
  SunMedium,
  Feather,
  Crosshair,
} from 'lucide-react';

import {
  buildVoiceThreadFingerprint,
  getComplexThreadVisualSignature,
} from '../utils/legacyPrint/voiceThreadGeometry';

import './VoiceThreadMap.css';

const AXIS_META = [
  { key: 'attack', label: 'Attack', icon: 'attack' },

  { key: 'brightness', label: 'Brightness', icon: 'brightness' },

  { key: 'projection', label: 'Projection', icon: 'projection' },

  { key: 'sustain', label: 'Sustain', icon: 'sustain' },

  { key: 'warmth', label: 'Warmth', icon: 'warmth' },

  { key: 'sensitivity', label: 'Sensitivity', icon: 'sensitivity' },

  { key: 'control', label: 'Control', icon: 'control' },
];

const AXIS_COLOR_BY_KEY = {
  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const THREAD_NODE_ORDER = [
  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',
];

const THREAD_NODE_POSITIONS = {
  attack: { x: 50, y: 16 },

  brightness: { x: 80, y: 31 },

  projection: { x: 86, y: 58 },

  sustain: { x: 66, y: 84 },

  warmth: { x: 34, y: 84 },

  sensitivity: { x: 14, y: 58 },

  control: { x: 20, y: 31 },
};

const THREAD_NODE_ICON_POSITIONS = {
  attack: { x: 50, y: 9 },

  brightness: { x: 88, y: 27 },

  projection: { x: 95, y: 58 },

  sustain: { x: 69, y: 93 },

  warmth: { x: 31, y: 93 },

  sensitivity: { x: 5, y: 58 },

  control: { x: 12, y: 27 },
};

const SVG_CENTER = { x: 250, y: 250 };

const THREAD_FRAME_RADIUS = 205;

const MetricIcon = ({ type, color = '#d6b277', size = 22 }) => {
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

const clamp = (value, min, max) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));
};

const round = (value, places = 2) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  return Number(num.toFixed(places));
};

const sanitizeMapId = (value = '') => {
  return String(value || 'none').replace(/[^a-zA-Z0-9_-]/g, '-');
};

const isFinitePoint = (point) => {
  return (
    point &&
    Number.isFinite(Number(point.x)) &&
    Number.isFinite(Number(point.y))
  );
};

const toSvgPoint = (point) => ({
  x: Number(point?.x || 0) * 5,

  y: Number(point?.y || 0) * 5,
});

const getPointForNode = (nodeKey) => {
  const point = THREAD_NODE_POSITIONS[nodeKey];

  return point ? toSvgPoint(point) : null;
};

const getAxisValue = (profile = {}, axisKey) => {
  const value = Number(profile?.[axisKey] ?? 5);

  return Number.isFinite(value) ? value : 5;
};

const getAxisDelta = (profile = {}, axisKey) => {
  return getAxisValue(profile, axisKey) - 5;
};

const getAxisMovement = (profile = {}, axisKey) => {
  return clamp(Math.abs(getAxisDelta(profile, axisKey)) / 1.5, 0, 1);
};

const getSignedAxisMovement = (profile = {}, axisKey) => {
  return clamp(getAxisDelta(profile, axisKey) / 1.5, -1, 1);
};

const getProfileMovementAverage = (profile = {}) => {
  return (
    THREAD_NODE_ORDER.reduce((total, nodeKey) => {
      return total + getAxisMovement(profile, nodeKey);
    }, 0) / THREAD_NODE_ORDER.length
  );
};

const getDepthLeanFromProfile = (profile = {}) => {
  const warmth = getAxisDelta(profile, 'warmth');

  const sustain = getAxisDelta(profile, 'sustain');

  const projection = getAxisDelta(profile, 'projection');

  const attack = getAxisDelta(profile, 'attack');

  const brightness = getAxisDelta(profile, 'brightness');

  return clamp(
    (warmth + sustain + projection - attack - brightness) / 5,

    -1,

    1
  );
};

const getProfileDirectionNodes = (profile = {}) => {
  return THREAD_NODE_ORDER.map((nodeKey) => ({
    nodeKey,

    movement: getAxisMovement(profile, nodeKey),
  }))

    .sort((a, b) => b.movement - a.movement)

    .slice(0, 3)

    .map((item) => item.nodeKey);
};

const pullPointFromCenter = (point, amount = 1) => {
  const x = Number(point?.x ?? SVG_CENTER.x);

  const y = Number(point?.y ?? SVG_CENTER.y);

  return {
    x: SVG_CENTER.x + (x - SVG_CENTER.x) * amount,

    y: SVG_CENTER.y + (y - SVG_CENTER.y) * amount,
  };
};

const keepPointInsideThreadFrame = (point, maxRadius = 0.94) => {
  const x = Number(point?.x ?? SVG_CENTER.x);

  const y = Number(point?.y ?? SVG_CENTER.y);

  const dx = x - SVG_CENTER.x;

  const dy = y - SVG_CENTER.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  const maxDistance = THREAD_FRAME_RADIUS * maxRadius;

  if (!Number.isFinite(distance) || distance <= maxDistance) {
    return { x, y };
  }

  const scale = maxDistance / distance;

  return {
    x: SVG_CENTER.x + dx * scale,

    y: SVG_CENTER.y + dy * scale,
  };
};

const mixPoints = (a, b, amount = 0.5) => {
  return {
    x:
      Number(a?.x ?? SVG_CENTER.x) +
      (Number(b?.x ?? SVG_CENTER.x) - Number(a?.x ?? SVG_CENTER.x)) * amount,

    y:
      Number(a?.y ?? SVG_CENTER.y) +
      (Number(b?.y ?? SVG_CENTER.y) - Number(a?.y ?? SVG_CENTER.y)) * amount,
  };
};

const offsetPoint = (point, offsetX = 0, offsetY = 0, maxRadius = 0.94) => {
  return keepPointInsideThreadFrame(
    {
      x: Number(point?.x ?? SVG_CENTER.x) + offsetX,

      y: Number(point?.y ?? SVG_CENTER.y) + offsetY,
    },

    maxRadius
  );
};

const hashStringToUnit = (value = '') => {
  const str = String(value || 'none');

  let hash = 2166136261;

  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);

    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 10000) / 10000;
};

const getSeededSignedValue = (seed, salt = '') => {
  return hashStringToUnit(`${seed}|${salt}`) * 2 - 1;
};

const getInputSignature = (input = {}, currentSpec = {}) => {

  /**

   * Hardware color is intentionally excluded.

   *

   * Hardware finish can change the Musical Identity title/copy,

   * but it should not change the Voice Thread shape geometry.

   *

   * Tone-affecting shape drivers:

   * - diameter / size

   * - depth

   * - lug count

   * - stave option / shell thickness

   * - hoop type

   * - scorch depth / finish treatment

   */

  return [

    input?.size,

    input?.depth,

    input?.lugs,

    input?.staveOption,

    input?.hoopType,

    input?.scorchDepth,

    currentSpec?.size,

    currentSpec?.width,

    currentSpec?.diameter,

    currentSpec?.depth,

    currentSpec?.lugs,

    currentSpec?.lugQuantity,

    currentSpec?.staveOption,

    currentSpec?.staveCount,

    currentSpec?.staveQuantity,

    currentSpec?.shellThicknessMm,

    currentSpec?.thicknessMm,

    currentSpec?.hoopType,

    currentSpec?.finish,

    currentSpec?.scorchDepth,

    currentSpec?.reRings,

    currentSpec?.reRing,

  ]

    .filter((value) => value !== undefined && value !== null && value !== '')

    .join('|');

};

const getVisualSeed = ({ thread, profile, input, currentSpec }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.join('|') : 'none';

  const profilePart = THREAD_NODE_ORDER.map((nodeKey) => {

    return `${nodeKey}:${round(getAxisValue(profile, nodeKey), 2)}`;

  }).join('|');

  /**

   * This seed controls shape geometry.

   * Keep it limited to tone-affecting choices only.

   * Do not add hardwareColor / hardwareFinish here.

   */

  return [

    thread?.id || 'thread',

    thread?.slotKey || '',

    nodes,

    profilePart,

    getInputSignature(input, currentSpec),

  ].join('|');

};

const getThreadNodePairs = () => {
  const pairs = [];

  THREAD_NODE_ORDER.forEach((source, sourceIndex) => {
    THREAD_NODE_ORDER.forEach((target, targetIndex) => {
      if (targetIndex <= sourceIndex) return;

      pairs.push([source, target]);
    });
  });

  return pairs;
};

const THREAD_NODE_PAIRS = getThreadNodePairs();

const getThreadGradientId = (mapId, source, target) => {
  const sourceIndex = THREAD_NODE_ORDER.indexOf(source);

  const targetIndex = THREAD_NODE_ORDER.indexOf(target);

  if (sourceIndex === -1 || targetIndex === -1) {
    return `${mapId}-thread-${source}-${target}`;
  }

  const first = sourceIndex <= targetIndex ? source : target;

  const second = sourceIndex <= targetIndex ? target : source;

  return `${mapId}-thread-${first}-${second}`;
};

const getThreadKind = (thread = {}) => {
  const slotKey = String(thread?.slotKey || '').toLowerCase();

  if (slotKey === 'simple') return 'simple';

  if (slotKey === 'shaped') return 'shaped';

  if (slotKey === 'complex') return 'complex';

  const nodeCount = Array.isArray(thread?.nodes) ? thread.nodes.length : 0;

  if (nodeCount <= 2) return 'simple';

  if (nodeCount === 3) return 'shaped';

  return 'complex';
};

const getDefaultRelationshipPoints = (nodes = []) => {
  return nodes

    .map((nodeKey) => getPointForNode(nodeKey))

    .filter(Boolean)

    .map((point) => keepPointInsideThreadFrame(point, 0.9));
};

const getCentroid = (points = []) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (!cleanPoints.length) {
    return { ...SVG_CENTER };
  }

  const total = cleanPoints.reduce(
    (acc, point) => ({
      x: acc.x + Number(point.x || 0),

      y: acc.y + Number(point.y || 0),
    }),

    { x: 0, y: 0 }
  );

  return {
    x: total.x / cleanPoints.length,

    y: total.y / cleanPoints.length,
  };
};

const recenterPoints = (points = [], amount = 0.32) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (!cleanPoints.length) return cleanPoints;

  const centroid = getCentroid(cleanPoints);

  return cleanPoints.map((point) => ({
    x: Number(point.x) + (SVG_CENTER.x - centroid.x) * amount,

    y: Number(point.y) + (SVG_CENTER.y - centroid.y) * amount,
  }));
};

const sortPointsClockwise = (points = []) => {
  const center = getCentroid(points);

  return [...points].filter(isFinitePoint).sort((a, b) => {
    const angleA = Math.atan2(Number(a.y) - center.y, Number(a.x) - center.x);

    const angleB = Math.atan2(Number(b.y) - center.y, Number(b.x) - center.x);

    return angleA - angleB;
  });
};

const removeNearDuplicatePoints = (points = [], threshold = 12) => {
  const cleanPoints = [];

  points.filter(isFinitePoint).forEach((point) => {
    const alreadyExists = cleanPoints.some((existing) => {
      const dx = Number(existing.x) - Number(point.x);

      const dy = Number(existing.y) - Number(point.y);

      return Math.sqrt(dx * dx + dy * dy) < threshold;
    });

    if (!alreadyExists) {
      cleanPoints.push(point);
    }
  });

  return cleanPoints;
};

const getShapePath = (points = [], close = true) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (!cleanPoints.length) return '';

  const [first, ...rest] = cleanPoints;

  const body = [
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,

    ...rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
  ].join(' ');

  return close && cleanPoints.length > 2 ? `${body} Z` : body;
};

const getBlobPath = (points = [], tension = 0.44) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 3) {
    return getShapePath(cleanPoints, true);
  }

  const sorted = sortPointsClockwise(cleanPoints);

  const getPoint = (index) => {
    return sorted[(index + sorted.length) % sorted.length];
  };

  const first = sorted[0];

  const commands = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  for (let i = 0; i < sorted.length; i += 1) {
    const p0 = getPoint(i - 1);

    const p1 = getPoint(i);

    const p2 = getPoint(i + 1);

    const p3 = getPoint(i + 2);

    const cp1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension,

      y: p1.y + ((p2.y - p0.y) / 6) * tension,
    };

    const cp2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension,

      y: p2.y - ((p3.y - p1.y) / 6) * tension,
    };

    commands.push(
      `C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)} ${cp2.x.toFixed(
        2
      )} ${cp2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }

  return `${commands.join(' ')} Z`;
};

const expandBlobPoints = ({
  points = [],

  profile = {},

  personality = {},

  thread = {},
}) => {
  const cleanPoints = sortPointsClockwise(points.filter(isFinitePoint));

  if (cleanPoints.length < 3) return cleanPoints;

  const centroid = getCentroid(cleanPoints);

  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  const seed = personality.seed || thread?.id || 'heritage-blob';

  const movementAverage =
    personality.movementAverage ?? getProfileMovementAverage(profile);

  const expanded = [];

  cleanPoints.forEach((point, index) => {
    const prev =
      cleanPoints[(index - 1 + cleanPoints.length) % cleanPoints.length];

    const next = cleanPoints[(index + 1) % cleanPoints.length];

    const nodeKey =
      nodes[index % Math.max(nodes.length, 1)] ||
      THREAD_NODE_ORDER[index % THREAD_NODE_ORDER.length];

    const nodeMovement = getAxisMovement(profile, nodeKey);

    const seedOut = getSeededSignedValue(seed, `blob-out-${index}`);

    const seedSide = getSeededSignedValue(seed, `blob-side-${index}`);

    const seedMid = getSeededSignedValue(seed, `blob-mid-${index}`);

    const dx = point.x - centroid.x;

    const dy = point.y - centroid.y;

    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    const normal = {
      x: dx / distance,

      y: dy / distance,
    };

    const tangent = {
      x: -normal.y,

      y: normal.x,
    };

    const outwardAmount =
      10 + movementAverage * 28 + nodeMovement * 18 + seedOut * 16;

    const sideAmount = seedSide * (14 + movementAverage * 18);

    const blobPoint = keepPointInsideThreadFrame(
      {
        x: point.x + normal.x * outwardAmount + tangent.x * sideAmount,

        y: point.y + normal.y * outwardAmount + tangent.y * sideAmount,
      },

      0.84
    );

    const midpointA = mixPoints(prev, point, 0.5);

    const midpointB = mixPoints(point, next, 0.5);

    const tuckedA = keepPointInsideThreadFrame(
      mixPoints(
        midpointA,

        {
          x: centroid.x + seedMid * 18,

          y: centroid.y - seedSide * 14,
        },

        0.22
      ),

      0.8
    );

    const tuckedB = keepPointInsideThreadFrame(
      mixPoints(
        midpointB,

        {
          x: centroid.x - seedSide * 16,

          y: centroid.y + seedOut * 12,
        },

        0.18
      ),

      0.8
    );

    expanded.push(tuckedA, blobPoint, tuckedB);
  });

  return removeNearDuplicatePoints(expanded, 9);
};

const getStrongestThreadNode = (thread = {}, profile = {}) => {
  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  if (!nodes.length) return null;

  return nodes

    .map((nodeKey) => ({
      nodeKey,

      value: getAxisMovement(profile, nodeKey),
    }))

    .sort((a, b) => b.value - a.value)[0]?.nodeKey;
};

const getThreadGradientVector = (thread = {}, profile = {}) => {
  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  const fallbackStart = nodes[0] || 'attack';

  const fallbackEnd = nodes[nodes.length - 1] || 'warmth';

  const strongestNode = getStrongestThreadNode(thread, profile) || fallbackEnd;

  const weakestNode =
    nodes

      .map((nodeKey) => ({
        nodeKey,

        value: getAxisMovement(profile, nodeKey),
      }))

      .sort((a, b) => a.value - b.value)[0]?.nodeKey || fallbackStart;

  const startPoint =
    getPointForNode(weakestNode) ||
    getPointForNode(fallbackStart) ||
    SVG_CENTER;

  const endPoint =
    getPointForNode(strongestNode) ||
    getPointForNode(fallbackEnd) ||
    SVG_CENTER;

  return {
    x1: startPoint.x,

    y1: startPoint.y,

    x2: endPoint.x,

    y2: endPoint.y,

    strongestNode,

    weakestNode,
  };
};

const getSimpleCurvePath = ({ thread, profile, input, currentSpec }) => {
  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  const fallbackNodes =
    nodes.length >= 2 ? nodes.slice(0, 2) : ['attack', 'warmth'];

  const seed = getVisualSeed({ thread, profile, input, currentSpec });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const directionNodes = getProfileDirectionNodes(profile);

  const activeSet = new Set(fallbackNodes);

  const startBase =
    getPointForNode(fallbackNodes[0]) || getPointForNode('attack');

  const endBase =
    getPointForNode(fallbackNodes[1]) || getPointForNode('warmth');

  const start = keepPointInsideThreadFrame(
    pullPointFromCenter(
      startBase,
      0.78 + getAxisMovement(profile, fallbackNodes[0]) * 0.035
    ),

    0.82
  );

  const end = keepPointInsideThreadFrame(
    pullPointFromCenter(
      endBase,
      0.78 + getAxisMovement(profile, fallbackNodes[1]) * 0.035
    ),

    0.82
  );

  const pullNode =
    directionNodes.find((nodeKey) => !activeSet.has(nodeKey)) ||
    directionNodes[0] ||
    fallbackNodes[0];

  const pullPoint = pullPointFromCenter(
    getPointForNode(pullNode) || SVG_CENTER,
    0.52
  );

  const midpoint = mixPoints(start, end, 0.5);

  const bendSide = getSeededSignedValue(seed, 'simple-bend-side');

  const bendStrength = clamp(0.2 + movementAverage * 0.22, 0.2, 0.42);

  const directionalControl = mixPoints(midpoint, pullPoint, bendStrength);

  const control = keepPointInsideThreadFrame(
    offsetPoint(
      directionalControl,

      depthLean * 10 + bendSide * 10,

      getSeededSignedValue(seed, 'simple-y') * 10,

      0.68
    ),

    0.68
  );

  const pathPoints = recenterPoints([start, control, end], 0.24);

  const [nextStart, nextControl, nextEnd] = pathPoints;

  return `M ${nextStart.x.toFixed(2)} ${nextStart.y.toFixed(
    2
  )} Q ${nextControl.x.toFixed(2)} ${nextControl.y.toFixed(
    2
  )} ${nextEnd.x.toFixed(2)} ${nextEnd.y.toFixed(2)}`;
};

const getShapedPoints = ({ thread, profile, input, currentSpec }) => {
  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  const fallbackNodes =
    nodes.length >= 3
      ? nodes.slice(0, 3)
      : [...nodes, 'control', 'sustain', 'projection'].slice(0, 3);

  const seed = getVisualSeed({ thread, profile, input, currentSpec });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const points = fallbackNodes.map((nodeKey, index) => {
    const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

    const movement = getAxisMovement(profile, nodeKey);

    const signed = getSignedAxisMovement(profile, nodeKey);

    const radius = clamp(
      0.62 + movement * 0.1 + movementAverage * 0.045 + signed * 0.03,

      0.56,

      0.78
    );

    const pulled = pullPointFromCenter(basePoint, radius);

    const xJitter = getSeededSignedValue(seed, `shape-x-${index}`) * 7;

    const yJitter = getSeededSignedValue(seed, `shape-y-${index}`) * 7;

    return keepPointInsideThreadFrame(
      offsetPoint(pulled, xJitter + depthLean * 5, yJitter, 0.78),

      0.78
    );
  });

  return sortPointsClockwise(recenterPoints(points, 0.36));
};

const getComplexPoints = ({ thread, profile, input, currentSpec }) => {

  const nodes = Array.isArray(thread?.nodes)

    ? thread.nodes.filter(Boolean)

    : [];

  const seed = getVisualSeed({ thread, profile, input, currentSpec });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const directionNodes = getProfileDirectionNodes(profile);

  const complexShape = getComplexThreadVisualSignature({

    thread,

    profile,

    nodeOrder: THREAD_NODE_ORDER,

    nodePositions: THREAD_NODE_POSITIONS,

  });

  const rawShapePoints = [

    ...(Array.isArray(complexShape?.points) ? complexShape.points : []),

    ...(Array.isArray(complexShape?.innerPoints)

      ? complexShape.innerPoints

      : []),

    ...(Array.isArray(complexShape?.interiorSegments)

      ? complexShape.interiorSegments.flatMap((segment) =>

          segment?.from && segment?.to ? [segment.from, segment.to] : []

        )

      : []),

  ]

    .filter(isFinitePoint)

    .map((point) =>

      keepPointInsideThreadFrame(

        {

          x: Number(point.x),

          y: Number(point.y),

        },

        0.68

      )

    );

  const weightedNodeKeys = [

    ...nodes,

    ...directionNodes,

    ...nodes,

    'attack',

    'brightness',

    'projection',

    'sustain',

    'warmth',

    'sensitivity',

    'control',

  ].filter(Boolean);

  const nodePoints = weightedNodeKeys

    .map((nodeKey, index) => {

      const basePoint = getPointForNode(nodeKey);

      if (!basePoint) return null;

      const movement = getAxisMovement(profile, nodeKey);

      const signed = getSignedAxisMovement(profile, nodeKey);

      const radius = clamp(

        0.44 + movementAverage * 0.08 + movement * 0.11 + signed * 0.035,

        0.38,

        0.68

      );

      const pulled = pullPointFromCenter(basePoint, radius);

      const xJitter = getSeededSignedValue(seed, `complex-node-x-${index}`) * 12;

      const yJitter = getSeededSignedValue(seed, `complex-node-y-${index}`) * 12;

      return keepPointInsideThreadFrame(

        offsetPoint(

          pulled,

          xJitter + depthLean * 7,

          yJitter + Math.abs(depthLean) * 4,

          0.7

        ),

        0.7

      );

    })

    .filter(Boolean);

  const combined = removeNearDuplicatePoints(

    [...nodePoints, ...rawShapePoints],

    10

  );

  const safeCombined =

    combined.length >= 4

      ? combined

      : getDefaultRelationshipPoints(

          [...nodes, 'attack', 'projection', 'sustain', 'warmth'].slice(0, 4)

        );

  const selected = sortPointsClockwise(safeCombined)

    .slice(0, clamp(nodes.length + 2, 5, 7))

    .map((point, index) => {

      const xJitter = getSeededSignedValue(seed, `complex-core-x-${index}`) * 10;

      const yJitter = getSeededSignedValue(seed, `complex-core-y-${index}`) * 10;

      return keepPointInsideThreadFrame(

        offsetPoint(point, xJitter, yJitter, 0.72),

        0.72

      );

    });

  const centeredCore = sortPointsClockwise(recenterPoints(selected, 0.46));

  return expandBlobPoints({

    points: centeredCore,

    profile,

    personality: {

      seed,

      movementAverage,

    },

    thread,

  });

};

const getCurvedClosedPath = (points = []) => {
  const cleanPoints = sortPointsClockwise(points.filter(isFinitePoint));

  if (cleanPoints.length < 3) {
    return getShapePath(cleanPoints, true);
  }

  const first = cleanPoints[0];

  const segments = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  cleanPoints.forEach((point, index) => {
    const next = cleanPoints[(index + 1) % cleanPoints.length];

    const midpoint = mixPoints(point, next, 0.5);

    const control = mixPoints(midpoint, SVG_CENTER, 0.1);

    segments.push(
      `Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${next.x.toFixed(
        2
      )} ${next.y.toFixed(2)}`
    );
  });

  return `${segments.join(' ')} Z`;
};

const getShapeColors = (activeThread = {}) => {
  const nodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  const colors = nodes
    .map((nodeKey) => AXIS_COLOR_BY_KEY[nodeKey])
    .filter(Boolean);

  return {
    first: colors[0] || '#d6b277',

    second: colors[1] || colors[0] || '#d6b277',

    third: colors[2] || colors[1] || colors[0] || '#d6b277',

    fourth: colors[3] || colors[2] || colors[1] || colors[0] || '#d6b277',
  };
};

const getProfileSignature = (profile = {}) => {
  return THREAD_NODE_ORDER.map((nodeKey) => {
    return `${nodeKey}:${round(getAxisValue(profile, nodeKey), 2)}`;
  }).join('|');
};

const getNodesSignature = (thread = {}) => {
  return Array.isArray(thread?.nodes) ? thread.nodes.join('|') : '';
};

const getSlotStableVisualKey = ({
  thread,
  profile,
  kind,
  input,
  currentSpec,
}) => {
  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.join('-') : 'none';

  return [
    thread?.id || 'thread',

    thread?.slotKey || kind,

    nodes,

    getProfileSignature(profile),

    getInputSignature(input, currentSpec),

    thread?.visualSignatureHash || thread?.visualSignature || '',
  ]

    .filter(Boolean)

    .join('|');
};

const getBuiltFingerprintForHashCompatibility = ({ thread, profile, kind }) => {
  if (!thread) return null;

  if (kind === 'complex') {
    return getComplexThreadVisualSignature({
      thread,

      profile,

      nodeOrder: THREAD_NODE_ORDER,

      nodePositions: THREAD_NODE_POSITIONS,
    });
  }

  return buildVoiceThreadFingerprint({
    thread,

    profile,

    nodeOrder: THREAD_NODE_ORDER,

    nodePositions: THREAD_NODE_POSITIONS,
  });
};

const VoiceThreadMap = ({
  activeThread,

  compact = false,

  strengthScore = 0,

  profile = {},

  input = {},

  currentSpec = {},
}) => {
  const threadKind = getThreadKind(activeThread);

  const profileSignature = getProfileSignature(profile);

  const nodesSignature = getNodesSignature(activeThread);

  const inputSignature = getInputSignature(input, currentSpec);

  const activeNodeSet = useMemo(() => {
    return new Set(activeThread?.nodes || []);
  }, [nodesSignature, activeThread?.nodes]);

  const fingerprintForHashCompatibility = useMemo(() => {
    return getBuiltFingerprintForHashCompatibility({
      thread: activeThread,

      profile,

      kind: threadKind,
    });
  }, [activeThread, profile, profileSignature, threadKind]);

  const visualKey = getSlotStableVisualKey({
    thread: activeThread,

    profile,

    kind: threadKind,

    input,

    currentSpec,
  });

  const mapId = `heritage-voice-thread-${
    compact ? 'compact' : 'large'
  }-${sanitizeMapId(activeThread?.id)}-${sanitizeMapId(visualKey)}`;

  const shapePath = useMemo(() => {
    if (!activeThread) return '';

    if (threadKind === 'simple') {
      return getSimpleCurvePath({
        thread: activeThread,

        profile,

        input,

        currentSpec,
      });
    }

    if (threadKind === 'shaped') {
      const points = getShapedPoints({
        thread: activeThread,

        profile,

        input,

        currentSpec,
      });

      return getCurvedClosedPath(points);
    }

const points = getComplexPoints({

  thread: activeThread,

  profile,

  input,

  currentSpec,

});

return getBlobPath(points, compact ? 0.62 : 0.78);
  }, [
    activeThread,

    activeThread?.id,

    activeThread?.slotKey,

    nodesSignature,

    profile,

    profileSignature,

    inputSignature,

    threadKind,
  ]);

  const shapeColors = useMemo(
    () => getShapeColors(activeThread),
    [activeThread]
  );

  const gradientVector = useMemo(() => {
    return getThreadGradientVector(activeThread, profile);
  }, [activeThread, profileSignature]);

  const strongestColor =
    AXIS_COLOR_BY_KEY[gradientVector.strongestNode] || shapeColors.second;

  const weakestColor =
    AXIS_COLOR_BY_KEY[gradientVector.weakestNode] || shapeColors.first;

  const coreStrokeWidth =
    threadKind === 'complex'
      ? compact
        ? 3.2
        : 4.4
      : threadKind === 'shaped'
        ? compact
          ? 3.8
          : 5.2
        : compact
          ? 4
          : 5.4;

  const glowStrokeWidth =
    threadKind === 'complex'
      ? compact
        ? 16
        : 24
      : threadKind === 'shaped'
        ? compact
          ? 11
          : 16
        : compact
          ? 12
          : 17;

  const haloStrokeWidth =
    threadKind === 'complex'
      ? compact
        ? 30
        : 42
      : threadKind === 'shaped'
        ? compact
          ? 19
          : 27
        : compact
          ? 19
          : 26;

  const shouldRenderComplexFill = threadKind === 'complex' && shapePath;

  return (
    <div
      className={`heritage-voice-thread-map ${
        compact ? 'heritage-voice-thread-map--compact' : ''
      } heritage-voice-thread-map--${threadKind}`}
      aria-label={
        activeThread
          ? `Voice Thread map showing ${activeThread.title}`
          : 'Voice Thread map'
      }
      data-thread-id={activeThread?.id || ''}
      data-thread-kind={threadKind}
      data-visual-signature={
        activeThread?.visualSignatureHash ||
        activeThread?.visualSignature ||
        fingerprintForHashCompatibility?.visualSignature ||
        ''
      }
    >
      <svg
        className="heritage-voice-thread-svg"
        viewBox="0 0 500 500"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={`${mapId}-softGlow`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation={compact ? '4.6' : '6.8'}
              result="softBlur"
            />

            <feMerge>
              <feMergeNode in="softBlur" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${mapId}-neonGlow`}
            x="-120%"
            y="-120%"
            width="340%"
            height="340%"
          >
            <feGaussianBlur
              stdDeviation={compact ? '3' : '4.4'}
              result="glowA"
            />

            <feGaussianBlur
              stdDeviation={compact ? '7' : '10'}
              result="glowB"
            />

            <feMerge>
              <feMergeNode in="glowB" />

              <feMergeNode in="glowA" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${mapId}-nodeGlow`}
            x="-120%"
            y="-120%"
            width="340%"
            height="340%"
          >
            <feGaussianBlur stdDeviation="2.8" result="nodeGlow" />

            <feMerge>
              <feMergeNode in="nodeGlow" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {THREAD_NODE_PAIRS.map(([source, target]) => {
            const sourcePoint = THREAD_NODE_POSITIONS[source];

            const targetPoint = THREAD_NODE_POSITIONS[target];

            if (!sourcePoint || !targetPoint) return null;

            const sourceColor = AXIS_COLOR_BY_KEY[source] || '#d6b277';

            const targetColor = AXIS_COLOR_BY_KEY[target] || '#d6b277';

            const gradientId = `${mapId}-thread-${source}-${target}`;

            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1={sourcePoint.x * 5}
                y1={sourcePoint.y * 5}
                x2={targetPoint.x * 5}
                y2={targetPoint.y * 5}
              >
                <stop offset="0%" stopColor={sourceColor} />

                <stop offset="100%" stopColor={targetColor} />
              </linearGradient>
            );
          })}

          <linearGradient
            id={`${mapId}-activeShapeGradient`}
            gradientUnits="userSpaceOnUse"
            x1={gradientVector.x1}
            y1={gradientVector.y1}
            x2={gradientVector.x2}
            y2={gradientVector.y2}
          >
            <stop offset="0%" stopColor={weakestColor} />

            <stop offset="42%" stopColor={shapeColors.second} />

            <stop offset="72%" stopColor={strongestColor} />

            <stop offset="100%" stopColor={strongestColor} />
          </linearGradient>

          <radialGradient
            id={`${mapId}-complexFillGradient`}
            cx="50%"
            cy="48%"
            r="62%"
          >
            <stop offset="0%" stopColor={strongestColor} stopOpacity="0.34" />

            <stop
              offset="42%"
              stopColor={shapeColors.third}
              stopOpacity="0.18"
            />

            <stop offset="100%" stopColor={weakestColor} stopOpacity="0.04" />
          </radialGradient>

          <linearGradient
            id={`${mapId}-complexSheenGradient`}
            gradientUnits="userSpaceOnUse"
            x1={gradientVector.x1}
            y1={gradientVector.y1}
            x2={gradientVector.x2}
            y2={gradientVector.y2}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />

            <stop offset="66%" stopColor={strongestColor} stopOpacity="0.16" />

            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {THREAD_NODE_PAIRS.map(([source, target]) => {
          const sourcePoint = THREAD_NODE_POSITIONS[source];

          const targetPoint = THREAD_NODE_POSITIONS[target];

          if (!sourcePoint || !targetPoint) return null;

          const gradientId = getThreadGradientId(mapId, source, target);

          return (
            <line
              key={`${source}-${target}`}
              x1={sourcePoint.x * 5}
              y1={sourcePoint.y * 5}
              x2={targetPoint.x * 5}
              y2={targetPoint.y * 5}
              className="heritage-voice-thread-line heritage-voice-thread-line--base"
              stroke={`url(#${gradientId})`}
            />
          );
        })}

        {THREAD_NODE_ORDER.map((nodeKey, index) => {
          const nextNodeKey =
            THREAD_NODE_ORDER[(index + 1) % THREAD_NODE_ORDER.length];

          const point = THREAD_NODE_POSITIONS[nodeKey];

          const nextPoint = THREAD_NODE_POSITIONS[nextNodeKey];

          if (!point || !nextPoint) return null;

          const gradientId = getThreadGradientId(mapId, nodeKey, nextNodeKey);

          return (
            <line
              key={`outer-${nodeKey}-${nextNodeKey}`}
              className="heritage-voice-thread-outer-line"
              x1={point.x * 5}
              y1={point.y * 5}
              x2={nextPoint.x * 5}
              y2={nextPoint.y * 5}
              stroke={`url(#${gradientId})`}
            />
          );
        })}

        {shapePath && (
          <g
            className={`heritage-voice-thread-active-shape heritage-voice-thread-active-shape--${threadKind}`}
          >
            {shouldRenderComplexFill && (
              <>
                <path
                  d={shapePath}
                  className="heritage-voice-thread-complex-fill"
                  fill={`url(#${mapId}-complexFillGradient)`}
                  stroke="none"
                  opacity={0.42}
                />

                <path
                  d={shapePath}
                  className="heritage-voice-thread-complex-sheen"
                  fill={`url(#${mapId}-complexSheenGradient)`}
                  stroke="none"
                />
              </>
            )}

            <path
              d={shapePath}
              className="heritage-voice-thread-shape-halo"
              fill="none"
              stroke={`url(#${mapId}-activeShapeGradient)`}
              strokeWidth={haloStrokeWidth}
              opacity={compact ? 0.16 : 0.2}
              filter={`url(#${mapId}-softGlow)`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={shapePath}
              className="heritage-voice-thread-shape-glow"
              fill="none"
              stroke={`url(#${mapId}-activeShapeGradient)`}
              strokeWidth={glowStrokeWidth}
              opacity={compact ? 0.4 : 0.5}
              filter={`url(#${mapId}-neonGlow)`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={shapePath}
              className="heritage-voice-thread-shape-core"
              fill="none"
              stroke={`url(#${mapId}-activeShapeGradient)`}
              strokeWidth={coreStrokeWidth}
              opacity={0.98}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={shapePath}
              className="heritage-voice-thread-shape-hotline"
              fill="none"
              stroke="rgba(255, 246, 218, 0.58)"
              strokeWidth={compact ? 0.8 : 1.05}
              opacity={threadKind === 'complex' ? 0.16 : 0.28}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {THREAD_NODE_ORDER.map((nodeKey) => {
          const point = THREAD_NODE_POSITIONS[nodeKey];

          const iconPoint = THREAD_NODE_ICON_POSITIONS[nodeKey] || point;

          if (!point) return null;

          const axis = AXIS_META.find((item) => item.key === nodeKey);

          const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

          const isActive = activeNodeSet.has(nodeKey);

          return (
            <g
              key={nodeKey}
              className={`heritage-voice-thread-node ${
                isActive ? 'is-active' : ''
              }`}
              style={{ '--node-color': color }}
            >
              <circle
                cx={point.x * 5}
                cy={point.y * 5}
                r={isActive ? 4.2 : 2.6}
                className="heritage-voice-thread-anchor-dot"
                fill={color}
              />

              {!compact && (
                <foreignObject
                  x={iconPoint.x * 5 - 25}
                  y={iconPoint.y * 5 - 25}
                  width="50"
                  height="50"
                  className="heritage-voice-thread-node-icon-wrap"
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="heritage-voice-thread-node-icon"
                    style={{ color }}
                  >
                    <MetricIcon
                      type={axis?.icon || nodeKey}
                      color={color}
                      size={22}
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default VoiceThreadMap;
