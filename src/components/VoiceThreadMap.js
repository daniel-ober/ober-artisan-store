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

const getAxisDominance = (profile = {}, axisKey) => {
  const rawValue = getAxisValue(profile, axisKey);

  const deltaWeight = Math.abs(rawValue - 5) * 0.18;

  return clamp(rawValue + deltaWeight, 1, 10);
};

const getNodeVoiceWeight = (profile = {}, nodeKey) => {
  const rawValue = getAxisValue(profile, nodeKey);

  const delta = Math.abs(rawValue - 5);

  /**

   * Meaning:

   * - 5.0 is neutral, so it should not glow hard.

   * - movement away from 5.0 should visually matter more than raw value.

   * - clamp keeps quiet nodes visible but restrained.

   */

  return clamp(0.28 + delta / 2.25, 0.28, 1);
};

const hexToRgb = (hex = '#d6b277') => {
  const clean = String(hex).replace('#', '');

  const value =
    clean.length === 3
      ? clean

          .split('')

          .map((char) => char + char)

          .join('')
      : clean;

  const parsed = Number.parseInt(value, 16);

  if (!Number.isFinite(parsed)) {
    return { r: 214, g: 178, b: 119 };
  }

  return {
    r: (parsed >> 16) & 255,

    g: (parsed >> 8) & 255,

    b: parsed & 255,
  };
};

const rgbToHex = ({ r, g, b }) => {
  const toHex = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))

      .toString(16)

      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixNodeColorsByWeight = ({ nodes = [], profile = {} }) => {
  const cleanNodes = nodes.filter(Boolean);

  if (!cleanNodes.length) return '#d6b277';

  const weighted = cleanNodes.map((nodeKey) => {
    const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

    const movement = getAxisMovement(profile, nodeKey);

    const value = getAxisValue(profile, nodeKey);

    return {
      color,

      weight: Math.max(
        0.35,
        0.55 + movement * 1.25 + Math.abs(value - 5) * 0.18
      ),
    };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);

  const mixed = weighted.reduce(
    (acc, item) => {
      const rgb = hexToRgb(item.color);

      return {
        r: acc.r + rgb.r * item.weight,

        g: acc.g + rgb.g * item.weight,

        b: acc.b + rgb.b * item.weight,
      };
    },

    { r: 0, g: 0, b: 0 }
  );

  return rgbToHex({
    r: mixed.r / totalWeight,

    g: mixed.g / totalWeight,

    b: mixed.b / totalWeight,
  });
};

const mixTwoHexColors = (colorA, colorB, amount = 0.5) => {
  const a = hexToRgb(colorA);

  const b = hexToRgb(colorB);

  const t = clamp(amount, 0, 1);

  return rgbToHex({
    r: a.r + (b.r - a.r) * t,

    g: a.g + (b.g - a.g) * t,

    b: a.b + (b.b - a.b) * t,
  });
};

const getPairColorBalance = ({ profile = {}, sourceNode, targetNode }) => {
  const sourceWeight = getNodeVoiceWeight(profile, sourceNode);

  const targetWeight = getNodeVoiceWeight(profile, targetNode);

  const total = Math.max(0.001, sourceWeight + targetWeight);

  const sourceShare = sourceWeight / total;

  /**

   * Higher sourceShare means source color should travel farther

   * before blending into target.

   */

  const blendCenter = clamp(sourceShare * 100, 34, 66);

  return {
    sourceWeight,

    targetWeight,

    blendCenter,

    sourceHold: clamp(blendCenter - 20, 8, 58),

    blendStart: clamp(blendCenter - 10, 18, 66),

    blendEnd: clamp(blendCenter + 10, 34, 82),

    targetHold: clamp(blendCenter + 20, 42, 92),
  };
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

  return [
    thread?.id || 'thread',

    thread?.slotKey || '',

    thread?.visualMode || thread?.mapMode || '',

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
  const visualMode = String(
    thread?.visualMode || thread?.mapMode || thread?.voiceMapMode || ''
  ).toLowerCase();

  if (visualMode === 'triangle' || visualMode === 'first-tell') {
    return 'shaped';
  }

  if (visualMode === 'legacyprint' || visualMode === 'identity-print') {
    return 'complex';
  }

  if (visualMode === 'line' || visualMode === 'first-line') {
    return 'simple';
  }

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

const getSegmentPath = (from, to, curveTowardCenter = 0.06) => {
  if (!isFinitePoint(from) || !isFinitePoint(to)) return '';

  if (!curveTowardCenter) {
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L ${to.x.toFixed(
      2
    )} ${to.y.toFixed(2)}`;
  }

  const midpoint = mixPoints(from, to, 0.5);

  const control = mixPoints(midpoint, SVG_CENTER, curveTowardCenter);

  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${control.x.toFixed(
    2
  )} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
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

  const pullNode =
    directionNodes.find((nodeKey) => !activeSet.has(nodeKey)) ||
    directionNodes[0] ||
    'projection';

  const pullBase =
    getPointForNode(pullNode) || getPointForNode('projection') || SVG_CENTER;

  const start = keepPointInsideThreadFrame(
    pullPointFromCenter(
      startBase,

      0.58 + getAxisMovement(profile, fallbackNodes[0]) * 0.06
    ),

    0.74
  );

  const end = keepPointInsideThreadFrame(
    pullPointFromCenter(
      endBase,

      0.58 + getAxisMovement(profile, fallbackNodes[1]) * 0.06
    ),

    0.74
  );

  const apex = keepPointInsideThreadFrame(
    offsetPoint(
      pullPointFromCenter(pullBase, 0.5 + movementAverage * 0.08),

      depthLean * 9 + getSeededSignedValue(seed, 'first-tell-apex-x') * 7,

      getSeededSignedValue(seed, 'first-tell-apex-y') * 7,

      0.72
    ),

    0.72
  );

  const trianglePoints = sortPointsClockwise(
    recenterPoints([start, apex, end], 0.36)
  );

  return getCurvedClosedPath(trianglePoints);
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

const getVoiceMapRelationshipPoints = ({
  activeThread,

  resolvedReadVariant,

  profile,

  input,

  currentSpec,
}) => {
  const nodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  const fallbackNodes =
    resolvedReadVariant === 'firstTell'
      ? ['attack', 'warmth', 'control']
      : ['attack', 'brightness', 'warmth', 'control'];

  const voiceMapNodes =
    resolvedReadVariant === 'firstTell'
      ? nodes.length >= 3
        ? nodes.slice(0, 3)
        : [...nodes, ...fallbackNodes]

            .filter((nodeKey, index, arr) => arr.indexOf(nodeKey) === index)

            .slice(0, 3)
      : nodes.length >= 3
        ? nodes.slice(0, 3)
        : [...nodes, ...fallbackNodes]

            .filter((nodeKey, index, arr) => arr.indexOf(nodeKey) === index)

            .slice(0, 3);

  const seed = getVisualSeed({
    thread: activeThread,

    profile,

    input,

    currentSpec,
  });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const points = voiceMapNodes

    .map((nodeKey, index) => {
      const basePoint = getPointForNode(nodeKey);

      if (!basePoint) return null;

      const movement = getAxisMovement(profile, nodeKey);

      const signed = getSignedAxisMovement(profile, nodeKey);

      const radius =
        resolvedReadVariant === 'firstTell'
          ? 0.9
          : clamp(
              0.62 + movement * 0.1 + movementAverage * 0.045 + signed * 0.03,

              0.56,

              0.78
            );

      const pulled =
        resolvedReadVariant === 'firstTell'
          ? basePoint
          : pullPointFromCenter(basePoint, radius);

      const xJitter =
        resolvedReadVariant === 'firstTell'
          ? 0
          : getSeededSignedValue(seed, `voicemap-point-x-${index}`) * 7;

      const yJitter =
        resolvedReadVariant === 'firstTell'
          ? 0
          : getSeededSignedValue(seed, `voicemap-point-y-${index}`) * 7;

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(
          offsetPoint(pulled, xJitter + depthLean * 5, yJitter, 0.9),

          0.9
        ),
      };
    })

    .filter((item) => item && isFinitePoint(item.point));

  if (resolvedReadVariant === 'firstTell') {
    return points;
  }

  return sortPointsClockwise(points.map((item) => item.point)).map((point) => {
    const match = points.find((item) => {
      return (
        Math.abs(item.point.x - point.x) < 0.01 &&
        Math.abs(item.point.y - point.y) < 0.01
      );
    });

    return {
      nodeKey: match?.nodeKey || 'attack',

      point,
    };
  });
};

const getPlayerReadPoints = ({ activeThread, profile, input, currentSpec }) => {
  const seed = getVisualSeed({
    thread: activeThread,

    profile,

    input,

    currentSpec,
  });

  return THREAD_NODE_ORDER.map((nodeKey, index) => {
    const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

    const movement = getAxisMovement(profile, nodeKey);

    const signed = getSignedAxisMovement(profile, nodeKey);

    const radius = clamp(
      0.58 + movement * 0.16 + signed * 0.055,

      0.44,

      0.86
    );

    const pulled = pullPointFromCenter(basePoint, radius);

    const xNudge =
      getSeededSignedValue(seed, `player-x-${nodeKey}-${index}`) * 4;

    const yNudge =
      getSeededSignedValue(seed, `player-y-${nodeKey}-${index}`) * 4;

    return keepPointInsideThreadFrame(
      offsetPoint(pulled, xNudge, yNudge, 0.88),

      0.88
    );
  });
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

      const xJitter =
        getSeededSignedValue(seed, `complex-node-x-${index}`) * 12;

      const yJitter =
        getSeededSignedValue(seed, `complex-node-y-${index}`) * 12;

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
      const xJitter =
        getSeededSignedValue(seed, `complex-core-x-${index}`) * 10;

      const yJitter =
        getSeededSignedValue(seed, `complex-core-y-${index}`) * 10;

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
const renderSoftRelationshipStops = ({
  profile,

  sourceNode,

  targetNode,

  sourceColor,

  targetColor,

  dominantShareByNode = {},
}) => {
  const sourceShare =
    dominantShareByNode[sourceNode]?.share ??
    getNodeVoiceWeight(profile, sourceNode) * 0.33;

  const targetShare =
    dominantShareByNode[targetNode]?.share ??
    getNodeVoiceWeight(profile, targetNode) * 0.33;

  const total = Math.max(0.001, sourceShare + targetShare);

  const normalizedSourceShare = sourceShare / total;

  /**

   * Keep the meeting point weighted, but never let it jump too far.

   * This keeps dominant colors feeling like they originate from their node.

   */

  const blendCenter = clamp(50 + (normalizedSourceShare - 0.5) * 22, 39, 61);

  /**

   * Wider blend zone = less hard seam.

   */

  const blendWidth = 42;

  const sourceHold = clamp(blendCenter - blendWidth * 0.58, 10, 42);

  const sourceFeather = clamp(blendCenter - blendWidth * 0.24, 24, 50);

  const targetFeather = clamp(blendCenter + blendWidth * 0.24, 50, 76);

  const targetHold = clamp(blendCenter + blendWidth * 0.58, 58, 90);

  /**

   * IMPORTANT:

   * This avoids the pale/white bridge.

   * Instead of averaging through a bright midpoint, it creates several

   * real color-to-color mix stops between the two node colors.

   */

  const blendA = mixTwoHexColors(sourceColor, targetColor, 0.28);

  const blendMid = mixTwoHexColors(sourceColor, targetColor, 0.5);

  const blendB = mixTwoHexColors(sourceColor, targetColor, 0.72);

  const sourceOpacity = clamp(0.74 + sourceShare * 0.2, 0.74, 0.9);

  const targetOpacity = clamp(0.74 + targetShare * 0.2, 0.74, 0.9);

  return (
    <>
      <stop offset="0%" stopColor={sourceColor} stopOpacity={sourceOpacity} />

      <stop
        offset={`${sourceHold}%`}
        stopColor={sourceColor}
        stopOpacity={sourceOpacity}
      />

      <stop
        offset={`${sourceFeather}%`}
        stopColor={blendA}
        stopOpacity={0.84}
      />

      <stop
        offset={`${blendCenter}%`}
        stopColor={blendMid}
        stopOpacity={0.82}
      />

      <stop
        offset={`${targetFeather}%`}
        stopColor={blendB}
        stopOpacity={0.84}
      />

      <stop
        offset={`${targetHold}%`}
        stopColor={targetColor}
        stopOpacity={targetOpacity}
      />

      <stop offset="100%" stopColor={targetColor} stopOpacity={targetOpacity} />
    </>
  );
};

const getDominantVoiceNodes = ({
  profile = {},

  activeThread = {},

  limit = 4,
}) => {
  const threadNodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  const candidateNodes = threadNodes.length ? threadNodes : THREAD_NODE_ORDER;

  return candidateNodes

    .map((nodeKey, index) => ({
      nodeKey,

      color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

      weight: getNodeVoiceWeight(profile, nodeKey),

      delta: Math.abs(getAxisDelta(profile, nodeKey)),

      index,
    }))

    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;

      if (b.delta !== a.delta) return b.delta - a.delta;

      return a.index - b.index;
    })

    .slice(0, limit);
};

const getDominantNodeShareMap = ({ profile = {}, activeThread = {} }) => {
  const dominantNodes = getDominantVoiceNodes({
    profile,

    activeThread,

    limit: 3,
  });

  const totalWeight = dominantNodes.reduce(
    (sum, item) => sum + Math.max(0.001, Number(item.weight || 0)),

    0
  );

  return dominantNodes.reduce((acc, item) => {
    acc[item.nodeKey] = {
      ...item,

      share: Math.max(0.001, Number(item.weight || 0)) / totalWeight,
    };

    return acc;
  }, {});
};

const getDominantThreadColor = ({
  profile = {},

  activeThread = {},
}) => {
  const dominantNodes = getDominantVoiceNodes({
    profile,

    activeThread,

    limit: 1,
  });

  return dominantNodes[0]?.color || '#d6b277';
};

const getGradientNodeSequence = ({
  profile = {},

  activeThread = {},

  resolvedReadVariant = '',
}) => {
  const threadNodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  if (resolvedReadVariant === 'player') {
    return THREAD_NODE_ORDER.map((nodeKey) => ({
      nodeKey,

      color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

      weight: getNodeVoiceWeight(profile, nodeKey),
    }));
  }

  const sequence = threadNodes.length
    ? threadNodes
    : THREAD_NODE_ORDER.slice(0, 3);

  return sequence.map((nodeKey) => ({
    nodeKey,

    color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

    weight: getNodeVoiceWeight(profile, nodeKey),
  }));
};

const renderVoiceGradientStops = ({
  nodes = [],
  fallbackColor = '#d6b277',
}) => {
  const cleanNodes = nodes.filter(Boolean);

  if (!cleanNodes.length) {
    return (
      <>
        <stop offset="0%" stopColor={fallbackColor} />

        <stop offset="100%" stopColor={fallbackColor} />
      </>
    );
  }

  if (cleanNodes.length === 1) {
    return (
      <>
        <stop offset="0%" stopColor={cleanNodes[0].color} />

        <stop offset="100%" stopColor={cleanNodes[0].color} />
      </>
    );
  }

  const totalWeight = cleanNodes.reduce(
    (sum, item) => sum + Math.max(0.1, Number(item.weight || 0.1)),

    0
  );

  let cursor = 0;

  const stops = [];

  cleanNodes.forEach((item, index) => {
    const weight = Math.max(0.1, Number(item.weight || 0.1));

    const share = (weight / totalWeight) * 100;

    const start = cursor;

    const end = index === cleanNodes.length - 1 ? 100 : cursor + share;

    const blend = Math.min(7, Math.max(3, share * 0.18));

    if (index === 0) {
      stops.push({
        offset: 0,

        color: item.color,

        opacity: 0.96,
      });
    }

    stops.push({
      offset: clamp(start + blend, 0, 100),

      color: item.color,

      opacity: 0.96,
    });

    stops.push({
      offset: clamp(end - blend, 0, 100),

      color: item.color,

      opacity: 0.96,
    });

    if (index < cleanNodes.length - 1) {
      const next = cleanNodes[index + 1];

      stops.push({
        offset: clamp(end, 0, 100),

        color: next.color,

        opacity: 0.92,
      });
    } else {
      stops.push({
        offset: 100,

        color: item.color,

        opacity: 0.96,
      });
    }

    cursor = end;
  });

  return stops

    .sort((a, b) => a.offset - b.offset)

    .map((stop, index) => (
      <stop
        key={`${stop.color}-${stop.offset}-${index}`}
        offset={`${stop.offset}%`}
        stopColor={stop.color}
        stopOpacity={stop.opacity}
      />
    ));
};

const VoiceThreadMap = ({
  activeThread,

  compact = false,

  strengthScore = 0,

  profile = {},

  input = {},

  currentSpec = {},

  displayMode = 'threads',

  readVariant = '',

  firstTellKeys = [],
}) => {
  const isVoiceMapMode = displayMode === 'voicemap';

  const resolvedReadVariant =
    readVariant ||
    (activeThread?.slotKey === 'simple'
      ? 'firstTell'
      : activeThread?.slotKey === 'shaped'
        ? 'player'
        : 'legacyprint');

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

  const voiceMapRelationshipPoints = useMemo(() => {
    if (!isVoiceMapMode || resolvedReadVariant === 'legacyprint') {
      return [];
    }

    return getVoiceMapRelationshipPoints({
      activeThread,

      resolvedReadVariant,

      profile,

      input,

      currentSpec,
    });
  }, [
    activeThread,

    nodesSignature,

    profile,

    profileSignature,

    inputSignature,

    isVoiceMapMode,

    resolvedReadVariant,
  ]);

  const playerReadPoints = useMemo(() => {
    if (!activeThread || !isVoiceMapMode || resolvedReadVariant !== 'player') {
      return [];
    }

    return getPlayerReadPoints({
      activeThread,

      profile,

      input,

      currentSpec,
    });
  }, [
    activeThread,

    isVoiceMapMode,

    resolvedReadVariant,

    profile,

    profileSignature,

    inputSignature,

    currentSpec,
  ]);

  const playerReadSegments = useMemo(() => {
    if (!playerReadPoints.length) return [];

    return playerReadPoints.map((point, index) => {
      const nextPoint = playerReadPoints[(index + 1) % playerReadPoints.length];

      const sourceNode = THREAD_NODE_ORDER[index];

      const targetNode =
        THREAD_NODE_ORDER[(index + 1) % THREAD_NODE_ORDER.length];

      return {
        id: `${sourceNode}-${targetNode}`,

        path: getSegmentPath(point, nextPoint, 0.06),

        sourceNode,

        targetNode,

        sourceColor: AXIS_COLOR_BY_KEY[sourceNode] || '#d6b277',

        targetColor: AXIS_COLOR_BY_KEY[targetNode] || '#d6b277',

        x1: point.x,

        y1: point.y,

        x2: nextPoint.x,

        y2: nextPoint.y,
      };
    });
  }, [playerReadPoints]);

  const voiceMapRelationshipSegments = useMemo(() => {
    if (
      !isVoiceMapMode ||
      resolvedReadVariant === 'legacyprint' ||
      resolvedReadVariant === 'player' ||
      voiceMapRelationshipPoints.length < 2
    ) {
      return [];
    }

    return voiceMapRelationshipPoints.map((item, index) => {
      const next =
        voiceMapRelationshipPoints[
          (index + 1) % voiceMapRelationshipPoints.length
        ];

      return {
        key: `${item.nodeKey}-${next.nodeKey}-${index}`,

        sourceNode: item.nodeKey,

        targetNode: next.nodeKey,

        sourcePoint: item.point,

        targetPoint: next.point,

        path: getSegmentPath(item.point, next.point, 0),
      };
    });
  }, [isVoiceMapMode, resolvedReadVariant, voiceMapRelationshipPoints]);

  const shapePath = useMemo(() => {
    if (!activeThread) return '';

    if (isVoiceMapMode && resolvedReadVariant === 'firstTell') {
      const points = voiceMapRelationshipPoints.map((item) => item.point);

      return getShapePath(points, true);
    }

    if (isVoiceMapMode && resolvedReadVariant === 'player') {
      return getCurvedClosedPath(playerReadPoints);
    }

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

    activeThread?.visualMode,

    activeThread?.mapMode,

    nodesSignature,

    profile,

    profileSignature,

    inputSignature,

    threadKind,

    isVoiceMapMode,

    resolvedReadVariant,

    firstTellKeys,

    compact,

    voiceMapRelationshipPoints,

    playerReadPoints,
  ]);

  const shapeColors = useMemo(
    () => getShapeColors(activeThread),

    [activeThread]
  );

  const dominantVoiceNodes = useMemo(() => {
    return getDominantVoiceNodes({
      profile,

      activeThread,

      limit: resolvedReadVariant === 'legacyprint' ? 4 : 7,
    });
  }, [profileSignature, resolvedReadVariant, nodesSignature, activeThread]);

  const activeGradientNodes = useMemo(() => {
    return getGradientNodeSequence({
      profile,

      activeThread,

      resolvedReadVariant,
    });
  }, [profileSignature, resolvedReadVariant, nodesSignature, activeThread]);

  const dominantThreadColor = useMemo(() => {
    return getDominantThreadColor({
      profile,

      activeThread,
    });
  }, [profileSignature, nodesSignature, activeThread]);

  const dominantShareByNode = useMemo(() => {
    return getDominantNodeShareMap({
      profile,

      activeThread,
    });
  }, [profileSignature, nodesSignature, activeThread]);

  const dominantPrimary = dominantVoiceNodes[0] || {
    color: shapeColors.first,

    nodeKey: 'attack',

    weight: 0.5,
  };

  const dominantSecondary = dominantVoiceNodes[1] || {
    color: shapeColors.second,

    nodeKey: 'warmth',

    weight: 0.5,
  };

  const dominantTertiary = dominantVoiceNodes[2] || {
    color: shapeColors.third,

    nodeKey: 'control',

    weight: 0.5,
  };

  const firstTellNodeOrder =
    resolvedReadVariant === 'firstTell'
      ? Array.isArray(activeThread?.nodes)
        ? activeThread.nodes.filter(Boolean)
        : []
      : [];

  const firstTellPrimaryNode = firstTellNodeOrder[0] || 'attack';

  const firstTellSecondaryNode = firstTellNodeOrder[1] || firstTellPrimaryNode;

  const firstTellTertiaryNode = firstTellNodeOrder[2] || firstTellSecondaryNode;

  const firstTellPrimaryColor =
    AXIS_COLOR_BY_KEY[firstTellPrimaryNode] || '#d6b277';

  const firstTellSecondaryColor =
    AXIS_COLOR_BY_KEY[firstTellSecondaryNode] || firstTellPrimaryColor;

  const firstTellTertiaryColor =
    AXIS_COLOR_BY_KEY[firstTellTertiaryNode] || firstTellSecondaryColor;

  const gradientVector = useMemo(() => {
    if (resolvedReadVariant === 'firstTell') {
      const nodes = Array.isArray(activeThread?.nodes)
        ? activeThread.nodes.filter(Boolean)
        : [];

      const startNode = nodes[0] || 'attack';

      const endNode = nodes[2] || nodes[1] || startNode;

      const startPoint = getPointForNode(startNode) || SVG_CENTER;

      const endPoint = getPointForNode(endNode) || startPoint;

      return {
        x1: startPoint.x,

        y1: startPoint.y,

        x2: endPoint.x,

        y2: endPoint.y,

        strongestNode: startNode,

        weakestNode: endNode,
      };
    }

    return getThreadGradientVector(activeThread, profile);
  }, [activeThread, profileSignature, resolvedReadVariant]);

  const strongestColor =
    AXIS_COLOR_BY_KEY[gradientVector.strongestNode] || shapeColors.second;

  const weakestColor =
    AXIS_COLOR_BY_KEY[gradientVector.weakestNode] || shapeColors.first;

  const isLegacyPrintShape =
    threadKind === 'complex' || resolvedReadVariant === 'legacyprint';

  const coreStrokeWidth = isLegacyPrintShape
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

  const glowStrokeWidth = isLegacyPrintShape
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

  const haloStrokeWidth = isLegacyPrintShape
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

  const shouldRenderComplexFill = isLegacyPrintShape && shapePath;

  return (
    <div
      className={`heritage-voice-thread-map ${
        compact ? 'heritage-voice-thread-map--compact' : ''
      } heritage-voice-thread-map--${threadKind} heritage-voice-thread-map--${displayMode} heritage-voice-thread-map--read-${resolvedReadVariant}`}
      aria-label={
        activeThread
          ? `Voice Thread map showing ${activeThread.title}`
          : 'Voice Thread map'
      }
      data-thread-id={activeThread?.id || ''}
      data-thread-kind={threadKind}
      data-strength-score={strengthScore}
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

          {voiceMapRelationshipSegments.map((segment) => {
            const sourceColor =
              AXIS_COLOR_BY_KEY[segment.sourceNode] || '#d6b277';

            const targetColor =
              AXIS_COLOR_BY_KEY[segment.targetNode] || '#d6b277';

            return (
              <linearGradient
                key={`${mapId}-active-segment-${segment.key}`}
                id={`${mapId}-active-segment-${segment.key}`}
                gradientUnits="userSpaceOnUse"
                x1={segment.sourcePoint.x}
                y1={segment.sourcePoint.y}
                x2={segment.targetPoint.x}
                y2={segment.targetPoint.y}
              >
                {renderSoftRelationshipStops({
                  profile,

                  sourceNode: segment.sourceNode,

                  targetNode: segment.targetNode,

                  sourceColor,

                  targetColor,

                  dominantShareByNode,
                })}
              </linearGradient>
            );
          })}

          {playerReadSegments.map((segment) => {
            return (
              <linearGradient
                key={`${mapId}-player-${segment.id}`}
                id={`${mapId}-player-${segment.id}`}
                gradientUnits="userSpaceOnUse"
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
              >
                {renderSoftRelationshipStops({
                  profile,

                  sourceNode: segment.sourceNode,

                  targetNode: segment.targetNode,

                  sourceColor: segment.sourceColor,

                  targetColor: segment.targetColor,

                  dominantShareByNode,
                })}
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
           {resolvedReadVariant === 'firstTell' ? (

  <>

    <stop offset="0%" stopColor={firstTellPrimaryColor} stopOpacity="0.94" />

    <stop offset="24%" stopColor={firstTellPrimaryColor} stopOpacity="0.9" />

    <stop

      offset="39%"

      stopColor={mixTwoHexColors(firstTellPrimaryColor, firstTellSecondaryColor, 0.35)}

      stopOpacity="0.84"

    />

    <stop offset="50%" stopColor={firstTellSecondaryColor} stopOpacity="0.82" />

    <stop

      offset="61%"

      stopColor={mixTwoHexColors(firstTellSecondaryColor, firstTellTertiaryColor, 0.65)}

      stopOpacity="0.84"

    />

    <stop offset="76%" stopColor={firstTellTertiaryColor} stopOpacity="0.9" />

    <stop offset="100%" stopColor={firstTellTertiaryColor} stopOpacity="0.94" />

  </>

) : (
              <>
                <stop offset="0%" stopColor={dominantThreadColor} />

                <stop offset="52%" stopColor={dominantThreadColor} />

                <stop offset="100%" stopColor={dominantThreadColor} />
              </>
            )}
          </linearGradient>

          <radialGradient
            id={`${mapId}-complexFillGradient`}
            cx="50%"
            cy="48%"
            r="62%"
          >
            <stop
              offset="0%"
              stopColor={dominantPrimary.color}
              stopOpacity={0.12 + dominantPrimary.weight * 0.12}
            />

            <stop
              offset="42%"
              stopColor={dominantSecondary.color}
              stopOpacity={0.07 + dominantSecondary.weight * 0.1}
            />

            <stop
              offset="72%"
              stopColor={dominantTertiary.color}
              stopOpacity={0.04 + dominantTertiary.weight * 0.08}
            />

            <stop offset="100%" stopColor="#050506" stopOpacity="0" />
          </radialGradient>

          <linearGradient
            id={`${mapId}-complexSheenGradient`}
            gradientUnits="userSpaceOnUse"
            x1={gradientVector.x1}
            y1={gradientVector.y1}
            x2={gradientVector.x2}
            y2={gradientVector.y2}
          >
            {renderVoiceGradientStops({
              nodes: activeGradientNodes,

              fallbackColor: dominantPrimary.color,
            })}
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
            className={`heritage-voice-thread-active-shape heritage-voice-thread-active-shape--${threadKind} heritage-voice-thread-active-shape--read-${resolvedReadVariant}`}
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

            {isVoiceMapMode && resolvedReadVariant === 'player' ? (
              <g className="heritage-voice-thread-player-segments">
                {playerReadSegments.map((segment) => (
                  <React.Fragment key={segment.id}>
                    <path
                      d={shapePath}
                      className="heritage-voice-thread-shape-halo"
                      fill="none"
                      stroke={
                        resolvedReadVariant === 'firstTell'
                          ? firstTellPrimaryColor
                          : `url(#${mapId}-activeShapeGradient)`
                      }
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
                      stroke={
                        resolvedReadVariant === 'firstTell'
                          ? firstTellPrimaryColor
                          : `url(#${mapId}-activeShapeGradient)`
                      }
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
                      d={segment.path}
                      className="heritage-voice-thread-shape-hotline"
                      fill="none"
                      stroke="rgba(255, 246, 218, 0.5)"
                      strokeWidth={compact ? 0.7 : 0.95}
                      opacity={0.24}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </React.Fragment>
                ))}
              </g>
            ) : voiceMapRelationshipSegments.length > 0 ? (
              <g className="heritage-voice-thread-relationship-segments">
                {voiceMapRelationshipSegments.map((segment) => {
                  const segmentGradientId = `${mapId}-active-segment-${segment.key}`;

                  return (
                    <React.Fragment key={segment.key}>
                      <path
                        d={segment.path}
                        className="heritage-voice-thread-shape-halo"
                        fill="none"
                        stroke={`url(#${segmentGradientId})`}
                        strokeWidth={haloStrokeWidth}
                        opacity={compact ? 0.16 : 0.2}
                        filter={`url(#${mapId}-softGlow)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d={segment.path}
                        className="heritage-voice-thread-shape-glow"
                        fill="none"
                        stroke={`url(#${segmentGradientId})`}
                        strokeWidth={glowStrokeWidth}
                        opacity={compact ? 0.4 : 0.5}
                        filter={`url(#${mapId}-neonGlow)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d={segment.path}
                        className="heritage-voice-thread-shape-core"
                        fill="none"
                        stroke={`url(#${segmentGradientId})`}
                        strokeWidth={coreStrokeWidth}
                        opacity={0.98}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d={segment.path}
                        className="heritage-voice-thread-shape-hotline"
                        fill="none"
                        stroke="rgba(255, 246, 218, 0.42)"
                        strokeWidth={compact ? 0.75 : 0.95}
                        opacity={0.24}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </React.Fragment>
                  );
                })}
              </g>
            ) : (
              <>
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
                  stroke={`url(#${mapId}-complexSheenGradient)`}
                  strokeWidth={compact ? 0.95 : 1.25}
                  opacity={
                    resolvedReadVariant === 'firstTell'
                      ? 0.42
                      : threadKind === 'complex'
                        ? 0.2
                        : 0.34
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
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
