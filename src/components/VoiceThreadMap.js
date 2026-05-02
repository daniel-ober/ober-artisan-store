// src/components/VoiceThreadMap.js

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Zap,
  Waves,
  Flame,
  Volume2,
  SunMedium,
  Feather,
  Crosshair,
} from 'lucide-react';

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

const SVG_SIZE = 500;

const SVG_CENTER = { x: 250, y: 250 };

const THREAD_FRAME_RADIUS = 205;

const SHAPE_MORPH_CACHE = new Map();

const getMorphCacheKey = ({

  compact,

  displayMode,

  resolvedReadVariant,

  threadKind,

}) => {

  return [

    compact ? 'compact' : 'large',

    displayMode || 'threads',

    resolvedReadVariant || 'read',

    threadKind || 'kind',

  ].join('|');

};

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

const softenColor = (color, amount = 0.18) => {
  return mixTwoHexColors(color, '#fff6da', amount);
};

const darkenColor = (color, amount = 0.18) => {
  return mixTwoHexColors(color, '#050506', amount);
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
  const delta = Math.abs(getAxisDelta(profile, axisKey));

  /*

   * Visual movement should be more expressive than the raw score delta.

   * A 0.25–0.40 tone movement is meaningful to the player, so the map

   * needs to show it clearly instead of treating it as tiny.

   */

  return clamp(Math.pow(delta / 1.05, 0.72), 0, 1);
};

const getNodeVoiceWeight = (profile = {}, nodeKey) => {
  const rawValue = getAxisValue(profile, nodeKey);

  const delta = Math.abs(rawValue - 5);

  return clamp(0.28 + delta / 2.25, 0.28, 1);
};

const getProfileSignature = (profile = {}) => {
  return THREAD_NODE_ORDER.map((nodeKey) => {
    return `${nodeKey}:${round(getAxisValue(profile, nodeKey), 2)}`;
  }).join('|');
};

const getNodesSignature = (thread = {}) => {
  return Array.isArray(thread?.nodes) ? thread.nodes.join('|') : '';
};

const getInputSignature = (input = {}, currentSpec = {}) => {
  return [
    input?.size,

    input?.depth,

    input?.lugs,

    input?.staveOption,

    input?.hoopType,

    input?.hardwareColor,

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

const getVisualSeed = ({ thread, profile, input, currentSpec }) => {
  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.join('|') : 'none';

  return [
    thread?.id || 'thread',

    thread?.slotKey || '',

    thread?.visualMode || thread?.mapMode || '',

    nodes,

    getProfileSignature(profile),

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

const hydrateShapeItemColors = (items = []) => {

  return items.map((item) => ({

    ...item,

    color: item.color || AXIS_COLOR_BY_KEY[item.nodeKey] || '#d6b277',

  }));

};

const interpolateShapeItems = (fromItems = [], toItems = [], progress = 1) => {

  if (!toItems.length) return [];

  return toItems.map((toItem, index) => {

    const fromItem =

      fromItems.find((item) => item.nodeKey === toItem.nodeKey) ||

      fromItems[index] ||

      toItem;

    const fromX = Number(fromItem?.point?.x ?? toItem.point.x);

    const fromY = Number(fromItem?.point?.y ?? toItem.point.y);

    const toX = Number(toItem.point.x);

    const toY = Number(toItem.point.y);

    const fromColor =

      fromItem?.color ||

      AXIS_COLOR_BY_KEY[fromItem?.nodeKey] ||

      AXIS_COLOR_BY_KEY[toItem.nodeKey] ||

      '#d6b277';

    const toColor =

      toItem?.color || AXIS_COLOR_BY_KEY[toItem.nodeKey] || '#d6b277';

    return {

      ...toItem,

      color: mixTwoHexColors(fromColor, toColor, progress),

      point: {

        x: fromX + (toX - fromX) * progress,

        y: fromY + (toY - fromY) * progress,

      },

    };

  });

};
const getShapeItemsSignature = (items = []) => {
  return items

    .map((item) => {
      return `${item.nodeKey}:${round(item.point?.x, 2)},${round(
        item.point?.y,

        2
      )}`;
    })

    .join('|');
};

const easeOutCubic = (value) => {

  const t = clamp(value, 0, 1);

  return t < 0.5

    ? 4 * t * t * t

    : 1 - Math.pow(-2 * t + 2, 3) / 2;

};

const getDistanceBetweenPoints = (a, b) => {
  if (!isFinitePoint(a) || !isFinitePoint(b)) return 0;

  const dx = Number(a.x) - Number(b.x);

  const dy = Number(a.y) - Number(b.y);

  return Math.sqrt(dx * dx + dy * dy);
};

const getTriangleArea = (points = []) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 3) return 0;

  const [a, b, c] = cleanPoints;

  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
  );
};

const getTriangleSpread = (points = []) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 3) return 0;

  const distances = [
    getDistanceBetweenPoints(cleanPoints[0], cleanPoints[1]),

    getDistanceBetweenPoints(cleanPoints[1], cleanPoints[2]),

    getDistanceBetweenPoints(cleanPoints[2], cleanPoints[0]),
  ];

  return Math.min(...distances);
};

const pushPointAwayFromLine = (point, lineA, lineB, amount = 18) => {
  if (!isFinitePoint(point) || !isFinitePoint(lineA) || !isFinitePoint(lineB)) {
    return point;
  }

  const dx = lineB.x - lineA.x;

  const dy = lineB.y - lineA.y;

  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  const normalA = {
    x: -dy / length,

    y: dx / length,
  };

  const normalB = {
    x: dy / length,

    y: -dx / length,
  };

  const candidateA = keepPointInsideThreadFrame(
    {
      x: point.x + normalA.x * amount,

      y: point.y + normalA.y * amount,
    },

    0.86
  );

  const candidateB = keepPointInsideThreadFrame(
    {
      x: point.x + normalB.x * amount,

      y: point.y + normalB.y * amount,
    },

    0.86
  );

  const areaA = getTriangleArea([lineA, lineB, candidateA]);

  const areaB = getTriangleArea([lineA, lineB, candidateB]);

  return areaA >= areaB ? candidateA : candidateB;
};

const widenFirstTellTriangle = (items = []) => {
  if (items.length < 3) return items;

  let widened = items.map((item) => ({ ...item, point: { ...item.point } }));

  const points = widened.map((item) => item.point);

  const area = getTriangleArea(points);

  const spread = getTriangleSpread(points);

  if (area >= 5200 && spread >= 54) {
    return widened;
  }

  const centroid = getCentroid(points);

  widened = widened.map((item, index) => {
    const point = item.point;

    const dx = point.x - centroid.x;

    const dy = point.y - centroid.y;

    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    const rankBoost = index === 0 ? 1.08 : index === 1 ? 1.14 : 1.22;

    return {
      ...item,

      point: keepPointInsideThreadFrame(
        {
          x: centroid.x + dx * rankBoost,

          y: centroid.y + dy * rankBoost,
        },

        0.86
      ),
    };
  });

  const widenedPoints = widened.map((item) => item.point);

  if (
    getTriangleArea(widenedPoints) < 5200 ||
    getTriangleSpread(widenedPoints) < 54
  ) {
    widened[2] = {
      ...widened[2],

      point: pushPointAwayFromLine(
        widened[2].point,

        widened[0].point,

        widened[1].point,

        24
      ),
    };
  }

  return widened;
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

const offsetPoint = (point, offsetX = 0, offsetY = 0, maxRadius = 0.94) => {
  return keepPointInsideThreadFrame(
    {
      x: Number(point?.x ?? SVG_CENTER.x) + offsetX,

      y: Number(point?.y ?? SVG_CENTER.y) + offsetY,
    },

    maxRadius
  );
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

const sortPointsClockwise = (points = []) => {
  const center = getCentroid(points);

  return [...points].filter(isFinitePoint).sort((a, b) => {
    const angleA = Math.atan2(Number(a.y) - center.y, Number(a.x) - center.x);

    const angleB = Math.atan2(Number(b.y) - center.y, Number(b.x) - center.x);

    return angleA - angleB;
  });
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

const getCurvedClosedPath = (points = [], curveTowardCenter = 0.08) => {
  const cleanPoints = sortPointsClockwise(points.filter(isFinitePoint));

  if (cleanPoints.length < 3) {
    return getOpenPath(cleanPoints);
  }

  const first = cleanPoints[0];

  const segments = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  cleanPoints.forEach((point, index) => {
    const next = cleanPoints[(index + 1) % cleanPoints.length];

    const midpoint = mixPoints(point, next, 0.5);

    const control = mixPoints(midpoint, SVG_CENTER, curveTowardCenter);

    segments.push(
      `Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${next.x.toFixed(
        2
      )} ${next.y.toFixed(2)}`
    );
  });

  return `${segments.join(' ')} Z`;
};

const getOpenPath = (points = []) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (!cleanPoints.length) return '';

  const [first, ...rest] = cleanPoints;

  return [
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,

    ...rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
  ].join(' ');
};

const getCurvedOpenSegmentPath = (from, to, curveTowardCenter = 0.06) => {
  if (!isFinitePoint(from) || !isFinitePoint(to)) return '';

  const midpoint = mixPoints(from, to, 0.5);

  const control = mixPoints(midpoint, SVG_CENTER, curveTowardCenter);

  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${control.x.toFixed(
    2
  )} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
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

const getRankedThreadNodes = ({
  profile = {},

  activeThread = {},

  resolvedReadVariant = '',

  firstTellKeys = [],
}) => {
  const threadNodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  if (resolvedReadVariant === 'firstTell') {
    const firstTellNodes =
      threadNodes && threadNodes.length
        ? threadNodes
        : firstTellKeys && firstTellKeys.length
          ? firstTellKeys
          : ['attack', 'warmth', 'control'];

    return firstTellNodes.slice(0, 3).map((nodeKey, index) => ({
      nodeKey,

      rank: index,

      color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

      movement: getAxisMovement(profile, nodeKey),

      weight: index === 0 ? 1 : index === 1 ? 0.72 : 0.5,
    }));
  }

  const candidates = threadNodes.length ? threadNodes : THREAD_NODE_ORDER;

  return candidates

    .map((nodeKey, index) => ({
      nodeKey,

      index,

      color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

      movement: getAxisMovement(profile, nodeKey),

      weight: getNodeVoiceWeight(profile, nodeKey),
    }))

    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;

      if (b.movement !== a.movement) return b.movement - a.movement;

      return a.index - b.index;
    })

    .slice(0, resolvedReadVariant === 'legacyprint' ? 4 : 7)

    .map((item, index) => ({
      ...item,

      rank: index,
    }));
};

const getRankMap = (rankedNodes = []) => {
  return rankedNodes.reduce((acc, item) => {
    acc[item.nodeKey] = item;

    return acc;
  }, {});
};

const getSegmentStrength = ({ sourceNode, targetNode, rankMap = {} }) => {
  const source = rankMap[sourceNode];

  const target = rankMap[targetNode];

  const sourceRank = Number.isFinite(source?.rank) ? source.rank : 99;

  const targetRank = Number.isFinite(target?.rank) ? target.rank : 99;

  const bestRank = Math.min(sourceRank, targetRank);

  const sourceWeight = Number(source?.weight || 0);

  const targetWeight = Number(target?.weight || 0);

  const weight = Math.max(sourceWeight, targetWeight);

  const rankStrength =
    bestRank === 0 ? 1 : bestRank === 1 ? 0.66 : bestRank === 2 ? 0.43 : 0.2;

  return clamp(rankStrength * 0.82 + weight * 0.18, 0.18, 1);
};

const getThreadShapePoints = ({
  activeThread,

  profile,

  input,

  currentSpec,

  resolvedReadVariant,

  threadKind,

  firstTellKeys,
}) => {
  const threadNodes = Array.isArray(activeThread?.nodes)
    ? activeThread.nodes.filter(Boolean)
    : [];

  const seed = getVisualSeed({
    thread: activeThread,

    profile,

    input,

    currentSpec,
  });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  if (resolvedReadVariant === 'firstTell') {
    const nodes =
      threadNodes.length >= 3
        ? threadNodes.slice(0, 3)
        : firstTellKeys && firstTellKeys.length
          ? firstTellKeys.slice(0, 3)
          : ['attack', 'warmth', 'control'];

    const triangleItems = nodes.slice(0, 3).map((nodeKey, index) => {
      const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

      const rawValue = getAxisValue(profile, nodeKey);

      const rawDelta = rawValue - 5;

      const movement = getAxisMovement(profile, nodeKey);

      /*

       * First Tell is the big, at-a-glance read.

       * Make meaningful Heritage shell changes visually obvious:

       * - 7mm / open shell should bloom farther toward warmth/sustain.

       * - 12mm / focused shell should pull harder toward attack/projection/control.

       */

      const signed = clamp(rawDelta / 0.95, -1, 1);

      const rankBasePull = index === 0 ? 0.78 : index === 1 ? 0.68 : 0.6;

      const movementPull =
        index === 0
          ? movement * 0.28
          : index === 1
            ? movement * 0.24
            : movement * 0.2;

      const signedPull = signed * 0.12;

      const rankPull = clamp(
        rankBasePull + movementPull + signedPull,

        0.36,

        1.04
      );

      const xJitter =
        getSeededSignedValue(seed, `first-tell-x-${nodeKey}-${index}`) * 9;

      const yJitter =
        getSeededSignedValue(seed, `first-tell-y-${nodeKey}-${index}`) * 9;

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(
          offsetPoint(
            pullPointFromCenter(basePoint, rankPull),

            xJitter,

            yJitter,

            0.98
          ),

          0.98
        ),
      };
    });

    return widenFirstTellTriangle(triangleItems);
  }

  if (resolvedReadVariant === 'player') {
    return THREAD_NODE_ORDER.map((nodeKey, index) => {
      const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

      const movement = getAxisMovement(profile, nodeKey);

      const signed = clamp(getAxisDelta(profile, nodeKey) / 1.5, -1, 1);

      const radius = clamp(
        0.56 + movement * 0.18 + signed * 0.055,

        0.43,

        0.88
      );

      const pulled = pullPointFromCenter(basePoint, radius);

      const xJitter =
        getSeededSignedValue(seed, `player-x-${nodeKey}-${index}`) * 4;

      const yJitter =
        getSeededSignedValue(seed, `player-y-${nodeKey}-${index}`) * 4;

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(
          offsetPoint(pulled, xJitter, yJitter, 0.9),

          0.9
        ),
      };
    });
  }

  if (threadKind === 'simple') {
    const nodes =
      threadNodes.length >= 2 ? threadNodes.slice(0, 2) : ['attack', 'warmth'];

    return nodes.map((nodeKey, index) => {
      const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

      const movement = getAxisMovement(profile, nodeKey);

      const radius = clamp(0.6 + movement * 0.1, 0.58, 0.76);

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(
          offsetPoint(
            pullPointFromCenter(basePoint, radius),

            getSeededSignedValue(seed, `simple-x-${index}`) * 5,

            getSeededSignedValue(seed, `simple-y-${index}`) * 5,

            0.78
          ),

          0.78
        ),
      };
    });
  }

  if (threadKind === 'shaped') {
    const nodes =
      threadNodes.length >= 3
        ? threadNodes.slice(0, 3)
        : [...threadNodes, 'control', 'sustain', 'projection'].slice(0, 3);

    return sortPointsClockwise(
      nodes.map((nodeKey, index) => {
        const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

        const movement = getAxisMovement(profile, nodeKey);

        const signed = clamp(getAxisDelta(profile, nodeKey) / 1.5, -1, 1);

        const radius = clamp(
          0.6 + movement * 0.12 + movementAverage * 0.045 + signed * 0.03,

          0.54,

          0.8
        );

        const pulled = pullPointFromCenter(basePoint, radius);

        const xJitter = getSeededSignedValue(seed, `shaped-x-${index}`) * 7;

        const yJitter = getSeededSignedValue(seed, `shaped-y-${index}`) * 7;

        return keepPointInsideThreadFrame(
          offsetPoint(pulled, xJitter + depthLean * 5, yJitter, 0.82),

          0.82
        );
      })
    ).map((point) => {
      const match = nodes.find((nodeKey) => {
        const basePoint = getPointForNode(nodeKey);

        return basePoint
          ? Math.abs(basePoint.x - point.x) < 95 &&
              Math.abs(basePoint.y - point.y) < 95
          : false;
      });

      return {
        nodeKey: match || nodes[0] || 'attack',

        point,
      };
    });
  }

  const complexNodes = [
    ...threadNodes,

    ...THREAD_NODE_ORDER.map((nodeKey) => ({
      nodeKey,

      movement: getAxisMovement(profile, nodeKey),
    }))

      .sort((a, b) => b.movement - a.movement)

      .slice(0, 3)

      .map((item) => item.nodeKey),
  ].filter((nodeKey, index, arr) => nodeKey && arr.indexOf(nodeKey) === index);

  const baseNodes =
    complexNodes.length >= 4
      ? complexNodes
      : [...complexNodes, 'attack', 'projection', 'sustain', 'warmth'].filter(
          (nodeKey, index, arr) => arr.indexOf(nodeKey) === index
        );

  const corePoints = baseNodes.slice(0, 7).map((nodeKey, index) => {
    const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

    const movement = getAxisMovement(profile, nodeKey);

    const signed = clamp(getAxisDelta(profile, nodeKey) / 1.5, -1, 1);

    const radius = clamp(
      0.45 + movementAverage * 0.08 + movement * 0.13 + signed * 0.035,

      0.36,

      0.7
    );

    const pulled = pullPointFromCenter(basePoint, radius);

    const xJitter = getSeededSignedValue(seed, `complex-x-${index}`) * 12;

    const yJitter = getSeededSignedValue(seed, `complex-y-${index}`) * 12;

    return {
      nodeKey,

      point: keepPointInsideThreadFrame(
        offsetPoint(
          pulled,

          xJitter + depthLean * 7,

          yJitter + Math.abs(depthLean) * 4,

          0.74
        ),

        0.74
      ),
    };
  });

  const centered = recenterPoints(
    sortPointsClockwise(corePoints.map((item) => item.point)),

    0.42
  );

  return centered.map((point, index) => ({
    nodeKey: corePoints[index % corePoints.length]?.nodeKey || 'attack',

    point,
  }));
};

const buildSegments = ({ shapeItems, closed = true }) => {

  const cleanItems = shapeItems.filter(

    (item) => item?.nodeKey && isFinitePoint(item?.point)

  );

  if (cleanItems.length < 2) return [];

  const segmentCount =

    closed && cleanItems.length > 2 ? cleanItems.length : cleanItems.length - 1;

  return Array.from({ length: segmentCount }).map((_, index) => {

    const item = cleanItems[index];

    const next = cleanItems[(index + 1) % cleanItems.length];

    return {

      key: `${item.nodeKey}-${next.nodeKey}-${index}`,

      sourceNode: item.nodeKey,

      targetNode: next.nodeKey,

      sourceColor:

        item.color || AXIS_COLOR_BY_KEY[item.nodeKey] || '#d6b277',

      targetColor:

        next.color || AXIS_COLOR_BY_KEY[next.nodeKey] || '#d6b277',

      sourcePoint: item.point,

      targetPoint: next.point,

      path: getCurvedOpenSegmentPath(

        item.point,

        next.point,

        closed ? 0.055 : 0.035

      ),

    };

  });

};

const getGradientVector = (shapeItems = []) => {
  const cleanItems = shapeItems.filter(
    (item) => item?.nodeKey && isFinitePoint(item?.point)
  );

  if (!cleanItems.length) {
    return {
      x1: SVG_CENTER.x,

      y1: SVG_CENTER.y,

      x2: SVG_CENTER.x + 1,

      y2: SVG_CENTER.y + 1,
    };
  }

  const first = cleanItems[0];

  const last = cleanItems[cleanItems.length - 1];

  return {
    x1: first.point.x,

    y1: first.point.y,

    x2: last.point.x,

    y2: last.point.y,
  };
};

const renderSmoothSegmentStops = ({
  sourceColor,

  targetColor,

  sourceStrength = 0.5,

  targetStrength = 0.5,

  sourceRank = 99,

  targetRank = 99,
}) => {
  const sourceHold = sourceRank === 0 ? 27 : sourceRank === 1 ? 22 : 16;

  const targetHold = targetRank === 0 ? 73 : targetRank === 1 ? 78 : 84;

  const middleColor = mixTwoHexColors(sourceColor, targetColor, 0.5);

  const earlyBlend = mixTwoHexColors(sourceColor, targetColor, 0.26);

  const lateBlend = mixTwoHexColors(sourceColor, targetColor, 0.74);

  const sourceOpacity = clamp(0.36 + sourceStrength * 0.56, 0.36, 0.98);

  const targetOpacity = clamp(0.36 + targetStrength * 0.56, 0.36, 0.98);

  const midOpacity = clamp(
    Math.min(sourceOpacity, targetOpacity) + 0.04,

    0.42,

    0.82
  );

  return (
    <>
      <stop offset="0%" stopColor={sourceColor} stopOpacity={sourceOpacity} />

      <stop
        offset={`${sourceHold}%`}
        stopColor={softenColor(sourceColor, 0.12)}
        stopOpacity={sourceOpacity}
      />

      <stop
        offset="38%"
        stopColor={earlyBlend}
        stopOpacity={sourceOpacity * 0.9}
      />

      <stop offset="50%" stopColor={middleColor} stopOpacity={midOpacity} />

      <stop
        offset="62%"
        stopColor={lateBlend}
        stopOpacity={targetOpacity * 0.9}
      />

      <stop
        offset={`${targetHold}%`}
        stopColor={softenColor(targetColor, 0.12)}
        stopOpacity={targetOpacity}
      />

      <stop offset="100%" stopColor={targetColor} stopOpacity={targetOpacity} />
    </>
  );
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

  const shapeColors = useMemo(
    () => getShapeColors(activeThread),

    [activeThread]
  );

  const rankedNodes = useMemo(() => {
    return getRankedThreadNodes({
      profile,

      activeThread,

      resolvedReadVariant,

      firstTellKeys,
    });
  }, [
    profile,

    profileSignature,

    activeThread,

    nodesSignature,

    resolvedReadVariant,

    firstTellKeys,
  ]);

  const rankMap = useMemo(() => getRankMap(rankedNodes), [rankedNodes]);

  const activeNodeSet = useMemo(() => {
    return new Set(
      activeThread?.nodes && activeThread.nodes.length
        ? activeThread.nodes
        : resolvedReadVariant === 'firstTell' && firstTellKeys.length
          ? firstTellKeys
          : []
    );
  }, [nodesSignature, activeThread?.nodes, resolvedReadVariant, firstTellKeys]);

  const targetShapeItems = useMemo(() => {
    if (!activeThread) return [];

return hydrateShapeItemColors(

  getThreadShapePoints({

    activeThread,

    profile,

    input,

    currentSpec,

    resolvedReadVariant,

    threadKind,

    firstTellKeys,

  })

);
  }, [
    activeThread,

    nodesSignature,

    profile,

    profileSignature,

    input,

    inputSignature,

    currentSpec,

    resolvedReadVariant,

    threadKind,

    firstTellKeys,
  ]);

  const targetShapeSignature = useMemo(() => {
    return getShapeItemsSignature(targetShapeItems);
  }, [targetShapeItems]);

const morphCacheKey = useMemo(() => {

  return getMorphCacheKey({

    compact,

    displayMode,

    resolvedReadVariant,

    threadKind,

  });

}, [compact, displayMode, resolvedReadVariant, threadKind]);

const getInitialShapeItems = () => {

  const cachedItems = SHAPE_MORPH_CACHE.get(morphCacheKey);

  if (cachedItems && cachedItems.length) {

    return cachedItems;

  }

  return targetShapeItems;

};

const [animatedShapeItems, setAnimatedShapeItems] = useState(getInitialShapeItems);

const animatedShapeItemsRef = useRef(animatedShapeItems);

const animationFrameRef = useRef(null);

useEffect(() => {

  animatedShapeItemsRef.current = animatedShapeItems;

  if (animatedShapeItems && animatedShapeItems.length) {

    SHAPE_MORPH_CACHE.set(morphCacheKey, animatedShapeItems);

  }

}, [animatedShapeItems, morphCacheKey]);

useEffect(() => {

  const toItems = targetShapeItems;

  if (!toItems.length) {

    if (animationFrameRef.current) {

      cancelAnimationFrame(animationFrameRef.current);

    }

    setAnimatedShapeItems([]);

    animatedShapeItemsRef.current = [];

    SHAPE_MORPH_CACHE.delete(morphCacheKey);

    return undefined;

  }

  if (animationFrameRef.current) {

    cancelAnimationFrame(animationFrameRef.current);

    animationFrameRef.current = null;

  }

  const liveItems =

    animatedShapeItemsRef.current && animatedShapeItemsRef.current.length

      ? animatedShapeItemsRef.current

      : null;

  const cachedItems =

    SHAPE_MORPH_CACHE.get(morphCacheKey) &&

    SHAPE_MORPH_CACHE.get(morphCacheKey).length

      ? SHAPE_MORPH_CACHE.get(morphCacheKey)

      : null;

  const fromItems = liveItems || cachedItems || toItems;

  const fromSignature = getShapeItemsSignature(fromItems);

  const toSignature = getShapeItemsSignature(toItems);

  if (fromSignature === toSignature) {

    animatedShapeItemsRef.current = toItems;

    SHAPE_MORPH_CACHE.set(morphCacheKey, toItems);

    setAnimatedShapeItems(toItems);

    return undefined;

  }

  const duration = 520;

  const startTime = performance.now();

  const animate = (now) => {

    const elapsed = now - startTime;

    const rawProgress = Math.min(elapsed / duration, 1);

    const easedProgress = easeOutCubic(rawProgress);

    const nextItems = interpolateShapeItems(fromItems, toItems, easedProgress);

    animatedShapeItemsRef.current = nextItems;

    SHAPE_MORPH_CACHE.set(morphCacheKey, nextItems);

    setAnimatedShapeItems(nextItems);

    if (rawProgress < 1) {

      animationFrameRef.current = requestAnimationFrame(animate);

      return;

    }

    animatedShapeItemsRef.current = toItems;

    SHAPE_MORPH_CACHE.set(morphCacheKey, toItems);

    setAnimatedShapeItems(toItems);

    animationFrameRef.current = null;

  };

  animationFrameRef.current = requestAnimationFrame(animate);

  return () => {

    if (animationFrameRef.current) {

      cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = null;

    }

  };

}, [targetShapeSignature, morphCacheKey]);

const shapeItems = animatedShapeItems;
  const shouldCloseShape = !(
    threadKind === 'simple' &&
    !isVoiceMapMode &&
    shapeItems.length <= 2
  );

  const shapePath = useMemo(() => {
    const points = shapeItems.map((item) => item.point).filter(isFinitePoint);

    if (!points.length) return '';

    if (!shouldCloseShape || points.length < 3) {
      return getOpenPath(points);
    }

    return getCurvedClosedPath(
      points,
      resolvedReadVariant === 'legacyprint' ? 0.12 : 0.075
    );
  }, [shapeItems, shouldCloseShape, resolvedReadVariant]);

  const relationshipSegments = useMemo(() => {
    return buildSegments({
      shapeItems,

      closed: shouldCloseShape,
    });
  }, [shapeItems, shouldCloseShape]);

const mapId = `heritage-voice-thread-${

  compact ? 'compact' : 'large'

}-${sanitizeMapId(activeThread?.id)}-${sanitizeMapId(

  [

    activeThread?.slotKey,

    threadKind,

    resolvedReadVariant,

  ].join('|')

)}`;

  const primaryNode = rankedNodes[0] || {
    nodeKey: 'attack',

    color: shapeColors.first,

    rank: 0,

    weight: 1,
  };

  const secondaryNode = rankedNodes[1] || {
    nodeKey: 'warmth',

    color: shapeColors.second,

    rank: 1,

    weight: 0.72,
  };

  const tertiaryNode = rankedNodes[2] || {
    nodeKey: 'control',

    color: shapeColors.third,

    rank: 2,

    weight: 0.5,
  };

  const gradientVector = getGradientVector(shapeItems);

  const shouldRenderComplexFill =
    shapePath &&
    (threadKind === 'complex' || resolvedReadVariant === 'legacyprint');

  const baseCoreStrokeWidth =
    resolvedReadVariant === 'legacyprint'
      ? compact
        ? 3.1
        : 4.15
      : resolvedReadVariant === 'player'
        ? compact
          ? 3.6
          : 4.8
        : compact
          ? 3.8
          : 5.2;

  const baseGlowStrokeWidth =
    resolvedReadVariant === 'legacyprint'
      ? compact
        ? 12
        : 19
      : resolvedReadVariant === 'player'
        ? compact
          ? 12
          : 17
        : compact
          ? 13
          : 19;

  const baseHaloStrokeWidth =
    resolvedReadVariant === 'legacyprint'
      ? compact
        ? 24
        : 36
      : resolvedReadVariant === 'player'
        ? compact
          ? 23
          : 34
        : compact
          ? 24
          : 35;

  return (
    <div
      className={`heritage-voice-thread-map ${
        compact ? 'heritage-voice-thread-map--compact' : ''
      } heritage-voice-thread-map--${threadKind} heritage-voice-thread-map--${displayMode} heritage-voice-thread-map--read-${resolvedReadVariant}`}
      style={{
        '--dominant-thread-color': primaryNode.color,

        '--secondary-thread-color': secondaryNode.color,

        '--tertiary-thread-color': tertiaryNode.color,
      }}
      aria-label={
        activeThread
          ? `Voice Thread map showing ${activeThread.title}`
          : 'Voice Thread map'
      }
      data-thread-id={activeThread?.id || ''}
      data-thread-kind={threadKind}
      data-strength-score={strengthScore}
    >
      <svg
        className="heritage-voice-thread-svg"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
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
              stdDeviation={compact ? '4.2' : '6.2'}
              result="softBlur"
            />

            <feMerge>
              <feMergeNode in="softBlur" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${mapId}-neonGlow`}
            x="-130%"
            y="-130%"
            width="360%"
            height="360%"
          >
            <feGaussianBlur
              stdDeviation={compact ? '2.3' : '3.4'}
              result="glowA"
            />

            <feGaussianBlur
              stdDeviation={compact ? '6.5' : '9.6'}
              result="glowB"
            />

            <feGaussianBlur
              stdDeviation={compact ? '13' : '18'}
              result="glowC"
            />

            <feMerge>
              <feMergeNode in="glowC" />

              <feMergeNode in="glowB" />

              <feMergeNode in="glowA" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${mapId}-primaryGlow`}
            x="-150%"
            y="-150%"
            width="400%"
            height="400%"
          >
            <feGaussianBlur
              stdDeviation={compact ? '3.8' : '5.4'}
              result="primaryA"
            />

            <feGaussianBlur
              stdDeviation={compact ? '10' : '15'}
              result="primaryB"
            />

            <feGaussianBlur
              stdDeviation={compact ? '18' : '26'}
              result="primaryC"
            />

            <feMerge>
              <feMergeNode in="primaryC" />

              <feMergeNode in="primaryB" />

              <feMergeNode in="primaryA" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id={`${mapId}-nodeGlow`}
            x="-130%"
            y="-130%"
            width="360%"
            height="360%"
          >
            <feGaussianBlur stdDeviation="3.2" result="nodeGlow" />

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
                <stop offset="0%" stopColor={darkenColor(sourceColor, 0.12)} />

                <stop
                  offset="50%"
                  stopColor={mixTwoHexColors(sourceColor, targetColor, 0.5)}
                />

                <stop
                  offset="100%"
                  stopColor={darkenColor(targetColor, 0.12)}
                />
              </linearGradient>
            );
          })}

          {relationshipSegments.map((segment) => {
           const sourceColor =

  segment.sourceColor || AXIS_COLOR_BY_KEY[segment.sourceNode] || '#d6b277';

const targetColor =

  segment.targetColor || AXIS_COLOR_BY_KEY[segment.targetNode] || '#d6b277';

            const sourceRank = rankMap[segment.sourceNode]?.rank ?? 99;

            const targetRank = rankMap[segment.targetNode]?.rank ?? 99;

            const sourceStrength = getSegmentStrength({
              sourceNode: segment.sourceNode,

              targetNode: segment.sourceNode,

              rankMap,
            });

            const targetStrength = getSegmentStrength({
              sourceNode: segment.targetNode,

              targetNode: segment.targetNode,

              rankMap,
            });

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
                {renderSmoothSegmentStops({
                  sourceColor,

                  targetColor,

                  sourceStrength,

                  targetStrength,

                  sourceRank,

                  targetRank,
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
            <stop
              offset="0%"
              stopColor={primaryNode.color}
              stopOpacity="0.96"
            />

            <stop
              offset="31%"
              stopColor={softenColor(primaryNode.color, 0.12)}
              stopOpacity="0.94"
            />

            <stop
              offset="48%"
              stopColor={mixTwoHexColors(
                primaryNode.color,
                secondaryNode.color,
                0.52
              )}
              stopOpacity="0.82"
            />

            <stop
              offset="67%"
              stopColor={softenColor(secondaryNode.color, 0.1)}
              stopOpacity="0.78"
            />

            <stop
              offset="100%"
              stopColor={tertiaryNode.color}
              stopOpacity="0.7"
            />
          </linearGradient>

          <radialGradient
            id={`${mapId}-complexFillGradient`}
            cx="50%"
            cy="48%"
            r="62%"
          >
            <stop
              offset="0%"
              stopColor={primaryNode.color}
              stopOpacity="0.26"
            />

            <stop
              offset="38%"
              stopColor={secondaryNode.color}
              stopOpacity="0.16"
            />

            <stop
              offset="68%"
              stopColor={tertiaryNode.color}
              stopOpacity="0.09"
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
            <stop
              offset="0%"
              stopColor={primaryNode.color}
              stopOpacity="0.68"
            />

            <stop
              offset="42%"
              stopColor={mixTwoHexColors(
                primaryNode.color,
                secondaryNode.color,
                0.5
              )}
              stopOpacity="0.36"
            />

            <stop
              offset="100%"
              stopColor={tertiaryNode.color}
              stopOpacity="0.18"
            />
          </linearGradient>
        </defs>

        <g className="heritage-voice-thread-network">
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
        </g>

        {shapePath && (

          <g

            className={`heritage-voice-thread-active-shape heritage-voice-thread-active-shape--${threadKind} heritage-voice-thread-active-shape--read-${resolvedReadVariant}`}

            data-transition-signature={targetShapeSignature}

          >

            {shouldRenderComplexFill && (

              <>

                <path

                  d={shapePath}

                  className="heritage-voice-thread-complex-fill"

                  fill={`url(#${mapId}-complexFillGradient)`}

                  stroke="none"

                />

                <path

                  d={shapePath}

                  className="heritage-voice-thread-complex-sheen"

                  fill={`url(#${mapId}-complexSheenGradient)`}

                  stroke="none"

                />

              </>

            )}

            {relationshipSegments.length > 0 ? (

              <g className="heritage-voice-thread-relationship-segments">

                {relationshipSegments.map((segment) => {

                  const segmentGradientId = `${mapId}-active-segment-${segment.key}`;

                  const segmentStrength = getSegmentStrength({

                    sourceNode: segment.sourceNode,

                    targetNode: segment.targetNode,

                    rankMap,

                  });

                  const sourceRank = rankMap[segment.sourceNode]?.rank ?? 99;

                  const targetRank = rankMap[segment.targetNode]?.rank ?? 99;

                  const bestRank = Math.min(sourceRank, targetRank);

                  const isPrimarySegment = bestRank === 0;

                  const segmentHaloWidth =

                    baseHaloStrokeWidth * (0.46 + segmentStrength * 0.74);

                  const segmentGlowWidth =

                    baseGlowStrokeWidth * (0.54 + segmentStrength * 0.78);

                  const segmentCoreWidth =

                    baseCoreStrokeWidth * (0.72 + segmentStrength * 0.58);

                  const segmentHaloOpacity = clamp(

                    0.055 + segmentStrength * 0.19,

                    0.055,

                    0.27

                  );

                  const segmentGlowOpacity = clamp(

                    0.16 + segmentStrength * 0.52,

                    0.16,

                    0.72

                  );

                  const segmentCoreOpacity = clamp(

                    0.58 + segmentStrength * 0.4,

                    0.58,

                    0.99

                  );

                  return (

                    <g

                      key={segment.key}

                      className={`heritage-voice-thread-segment heritage-voice-thread-segment--rank-${bestRank}`}

                    >

                      <path

                        d={segment.path}

                        className="heritage-voice-thread-shape-halo"

                        fill="none"

                        stroke={`url(#${segmentGradientId})`}

                        strokeWidth={segmentHaloWidth}

                        opacity={segmentHaloOpacity}

                        filter={`url(#${mapId}-softGlow)`}

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                      <path

                        d={segment.path}

                        className="heritage-voice-thread-shape-glow"

                        fill="none"

                        stroke={`url(#${segmentGradientId})`}

                        strokeWidth={segmentGlowWidth}

                        opacity={segmentGlowOpacity}

                        filter={

                          isPrimarySegment

                            ? `url(#${mapId}-primaryGlow)`

                            : `url(#${mapId}-neonGlow)`

                        }

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                      <path

                        d={segment.path}

                        className="heritage-voice-thread-shape-core"

                        fill="none"

                        stroke={`url(#${segmentGradientId})`}

                        strokeWidth={segmentCoreWidth}

                        opacity={segmentCoreOpacity}

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                      <path

                        d={segment.path}

                        className="heritage-voice-thread-shape-hotline"

                        fill="none"

                        stroke="rgba(255, 246, 218, 0.54)"

                        strokeWidth={

                          isPrimarySegment

                            ? compact

                              ? 1.15

                              : 1.5

                            : compact

                              ? 0.7

                              : 0.95

                        }

                        opacity={clamp(

                          0.035 + segmentStrength * 0.24,

                          0.035,

                          0.28

                        )}

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                    </g>

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

                  strokeWidth={baseHaloStrokeWidth}

                  opacity={compact ? 0.15 : 0.21}

                  filter={`url(#${mapId}-softGlow)`}

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

                <path

                  d={shapePath}

                  className="heritage-voice-thread-shape-glow"

                  fill="none"

                  stroke={`url(#${mapId}-activeShapeGradient)`}

                  strokeWidth={baseGlowStrokeWidth}

                  opacity={compact ? 0.4 : 0.58}

                  filter={`url(#${mapId}-primaryGlow)`}

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

                <path

                  d={shapePath}

                  className="heritage-voice-thread-shape-core"

                  fill="none"

                  stroke={`url(#${mapId}-activeShapeGradient)`}

                  strokeWidth={baseCoreStrokeWidth}

                  opacity="0.96"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

                <path

                  d={shapePath}

                  className="heritage-voice-thread-shape-hotline"

                  fill="none"

                  stroke={`url(#${mapId}-complexSheenGradient)`}

                  strokeWidth={compact ? 0.95 : 1.25}

                  opacity="0.34"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

              </>

            )}

          </g>

        )}

        <g className="heritage-voice-thread-node-layer">
          {THREAD_NODE_ORDER.map((nodeKey) => {
            const point = THREAD_NODE_POSITIONS[nodeKey];

            const iconPoint = THREAD_NODE_ICON_POSITIONS[nodeKey] || point;

            if (!point) return null;

            const axis = AXIS_META.find((item) => item.key === nodeKey);

            const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

            const rankItem = rankMap[nodeKey];

            const isActive = activeNodeSet.has(nodeKey);

            const rank = Number.isFinite(rankItem?.rank) ? rankItem.rank : 99;

            return (
              <g
                key={nodeKey}
                className={`heritage-voice-thread-node ${
                  isActive ? 'is-active' : ''
                } heritage-voice-thread-node--rank-${rank}`}
                style={{ '--node-color': color }}
                data-rank={rank}
              >
                <circle
                  cx={point.x * 5}
                  cy={point.y * 5}
                  r={
                    rank === 0 ? 5.4 : rank === 1 ? 4.4 : isActive ? 3.7 : 2.45
                  }
                  className="heritage-voice-thread-anchor-dot"
                  fill={color}
                  filter={rank <= 2 ? `url(#${mapId}-nodeGlow)` : undefined}
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
        </g>
      </svg>
    </div>
  );
};

export default VoiceThreadMap;
