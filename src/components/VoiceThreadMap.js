import React, { useMemo, useRef, useState, useEffect } from 'react';

import { Zap, Waves, Flame, Volume2, Feather } from 'lucide-react';

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

const buildThreadNodeRing = (radius = 34) => {
  const centerX = 50;

  const centerY = 50;

  const startAngle = -Math.PI / 2;

  const angleStep = (Math.PI * 2) / THREAD_NODE_ORDER.length;

  return THREAD_NODE_ORDER.reduce((positions, nodeKey, index) => {
    const angle = startAngle + index * angleStep;

    positions[nodeKey] = {
      x: Number((centerX + Math.cos(angle) * radius).toFixed(4)),

      y: Number((centerY + Math.sin(angle) * radius).toFixed(4)),
    };

    return positions;
  }, {});
};

const THREAD_NODE_POSITIONS = buildThreadNodeRing(34);

const THREAD_NODE_ICON_POSITIONS = buildThreadNodeRing(46);

const SVG_SIZE = 500;

const SVG_CENTER = { x: 250, y: 250 };

const THREAD_FRAME_RADIUS = 205;

const SHAPE_MORPH_CACHE = new Map();

const HERITAGE_REFERENCE_PROFILE = {
  attack: 5,

  brightness: 5,

  projection: 5,

  sustain: 5,

  warmth: 5,

  sensitivity: 5,

  control: 5,
};

const LEGACY_NODE_MEANING = {
  attack: {
    pull: 1.16,

    mass: 0.84,

    pulse: 0.72,

    label: 'strike edge',
  },

  brightness: {
    pull: 1.11,

    mass: 0.66,

    pulse: 0.86,

    label: 'upper shimmer',
  },

  projection: {
    pull: 1.19,

    mass: 0.74,

    pulse: 0.78,

    label: 'forward throw',
  },

  sustain: {
    pull: 1.02,

    mass: 1.18,

    pulse: 0.54,

    label: 'bloom tail',
  },

  warmth: {
    pull: 1.03,

    mass: 1.24,

    pulse: 0.48,

    label: 'body weight',
  },

  sensitivity: {
    pull: 1.08,

    mass: 0.58,

    pulse: 0.94,

    label: 'touch response',
  },

  control: {
    pull: 0.9,

    mass: 0.72,

    pulse: 0.38,

    label: 'containment',
  },
};

const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
};

const isDocumentHidden = () => {
  if (typeof document === 'undefined') return false;

  return document.hidden;
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
  return point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
};

const toSvgPoint = (point) => ({
  x: Number(point?.x || 0) * 5,

  y: Number(point?.y || 0) * 5,
});

const getPointForNode = (nodeKey) => {
  const point = THREAD_NODE_POSITIONS[nodeKey];

  return point ? toSvgPoint(point) : null;
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

const getAxisValue = (profile = {}, axisKey) => {
  const value = Number(profile?.[axisKey] ?? 5);

  return Number.isFinite(value) ? value : 5;
};

const getAxisDelta = (profile = {}, axisKey) => {
  return getAxisValue(profile, axisKey) - 5;
};

const getAxisMovement = (profile = {}, axisKey) => {
  const delta = Math.abs(getAxisDelta(profile, axisKey));

  return clamp(Math.pow(delta / 1.05, 0.72), 0, 1);
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

  return clamp((warmth + sustain + projection - attack - brightness) / 5, -1, 1);
};

const getNodeVoiceWeight = (profile = {}, nodeKey) => {
  const rawValue = getAxisValue(profile, nodeKey);

  const delta = Math.abs(rawValue - 5);

  return clamp(0.28 + delta / 2.25, 0.28, 1);
};

const getProfileDirectionNodes = (profile = {}) => {
  return THREAD_NODE_ORDER.map((nodeKey) => ({
    nodeKey,

    movement: getAxisMovement(profile, nodeKey),

    value: getAxisValue(profile, nodeKey),
  }))

    .sort((a, b) => {
      if (b.movement !== a.movement) return b.movement - a.movement;

      return b.value - a.value;
    })

    .slice(0, 3)

    .map((item) => item.nodeKey);
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

    input?.hardwareFinish,

    input?.scorchDepth,

    input?.finish,

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

    currentSpec?.hardwareColor,

    currentSpec?.hardwareFinish,

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

const THREAD_NODE_ICON_TYPE_BY_KEY = {
  attack: 'attack',

  brightness: 'brightness',

  projection: 'projection',

  sustain: 'sustain',

  warmth: 'warmth',

  sensitivity: 'sensitivity',

  control: 'control',
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
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />

          <path d="M12 2v2" />

          <path d="M12 20v2" />

          <path d="m4.93 4.93 1.41 1.41" />

          <path d="m17.66 17.66 1.41 1.41" />

          <path d="M2 12h2" />

          <path d="M20 12h2" />

          <path d="m6.34 17.66-1.41 1.41" />

          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );

    case 'sensitivity':
      return <Feather {...iconProps} />;

    case 'control':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />

          <line x1="22" x2="18" y1="12" y2="12" />

          <line x1="6" x2="2" y1="12" y2="12" />

          <line x1="12" x2="12" y1="6" y2="2" />

          <line x1="12" x2="12" y1="22" y2="18" />
        </svg>
      );

    default:
      return <Zap {...iconProps} />;
  }
};

const getThreadKind = (thread = {}) => {
  const visualMode = String(
    thread?.visualMode || thread?.mapMode || thread?.VoiceMappingMode || ''
  ).toLowerCase();

  if (visualMode === 'triangle' || visualMode === 'first-tell') return 'shaped';

  if (visualMode === 'legacyprint' || visualMode === 'identity-print') return 'complex';

  if (visualMode === 'line' || visualMode === 'first-line') return 'simple';

  const slotKey = String(thread?.slotKey || '').toLowerCase();

  if (slotKey === 'simple') return 'simple';

  if (slotKey === 'shaped') return 'shaped';

  if (slotKey === 'complex') return 'complex';

  const nodeCount = Array.isArray(thread?.nodes) ? thread.nodes.length : 0;

  if (nodeCount <= 2) return 'simple';

  if (nodeCount === 3) return 'shaped';

  return 'complex';
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

  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
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

const getOpenPath = (points = []) => {
  const cleanPoints = points.filter(isFinitePoint);

  if (!cleanPoints.length) return '';

  const [first, ...rest] = cleanPoints;

  return [
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,

    ...rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
  ].join(' ');
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
      `Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
    );
  });

  return `${segments.join(' ')} Z`;
};

const getBlobPath = (points = [], tension = 0.78) => {
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

const getCurvedOpenSegmentPath = (from, to, curveTowardCenter = 0.06) => {
  if (!isFinitePoint(from) || !isFinitePoint(to)) return '';

  const midpoint = mixPoints(from, to, 0.5);

  const control = mixPoints(midpoint, SVG_CENTER, curveTowardCenter);

  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${control.x.toFixed(
    2
  )} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
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

  if (getTriangleArea(widenedPoints) < 5200 || getTriangleSpread(widenedPoints) < 54) {
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

const getShapeColors = (activeThread = {}) => {
  const nodes = Array.isArray(activeThread?.nodes) ? activeThread.nodes.filter(Boolean) : [];

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

const getRankedThreadNodes = ({
  profile = {},

  activeThread = {},

  resolvedReadVariant = '',

  firstTellKeys = [],
}) => {
  const threadNodes = Array.isArray(activeThread?.nodes) ? activeThread.nodes.filter(Boolean) : [];

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

  const candidates =
    resolvedReadVariant === 'legacyprint'
      ? THREAD_NODE_ORDER
      : threadNodes.length
        ? threadNodes
        : THREAD_NODE_ORDER;

  return candidates

    .map((nodeKey, index) => ({
      nodeKey,

      index,

      color: AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277',

      movement: getAxisMovement(profile, nodeKey),

      weight: getNodeVoiceWeight(profile, nodeKey),

      value: getAxisValue(profile, nodeKey),
    }))

    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;

      if (b.movement !== a.movement) return b.movement - a.movement;

      return a.index - b.index;
    })

    .slice(0, resolvedReadVariant === 'legacyprint' ? 7 : 7)

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

  const rankStrength = bestRank === 0 ? 1 : bestRank === 1 ? 0.66 : bestRank === 2 ? 0.43 : 0.2;

  return clamp(rankStrength * 0.82 + weight * 0.18, 0.18, 1);
};

const getPlayerReadRadiusForNode = (profile = {}, nodeKey) => {
  const value = getAxisValue(profile, nodeKey);

  const delta = value - 5;

  const absDelta = Math.abs(delta);

  const direction = delta === 0 ? 0 : Math.sign(delta);

  const visualDelta =
    absDelta <= 0.2
      ? absDelta * 1.45
      : absDelta <= 0.6
        ? 0.29 + (absDelta - 0.2) * 1.05
        : absDelta <= 1.2
          ? 0.71 + (absDelta - 0.6) * 0.78
          : 1.18 + (absDelta - 1.2) * 0.55;

  return clamp(0.5 + direction * visualDelta * 0.14, 0.24, 0.88);
};

const getLegacyPrintSpecFactor = (input = {}, currentSpec = {}) => {
  const size = Number(input?.size || currentSpec?.size || currentSpec?.diameter || 14);

  const depth = Number(input?.depth || currentSpec?.depth || 5.5);

  const lugs = Number(input?.lugs || currentSpec?.lugs || currentSpec?.lugQuantity || 8);

  const staveText = String(input?.staveOption || currentSpec?.staveOption || '');

  const thicknessMatch = staveText.match(/(\d+)\s*mm/i);

  const thickness = thicknessMatch
    ? Number(thicknessMatch[1])
    : Number(currentSpec?.shellThicknessMm || currentSpec?.thicknessMm || 10);

  return {
    size: Number.isFinite(size) ? size : 14,

    depth: Number.isFinite(depth) ? depth : 5.5,

    lugs: Number.isFinite(lugs) ? lugs : 8,

    thickness: Number.isFinite(thickness) ? thickness : 10,
  };
};

const getLegacyPrintProfile = ({
  activeThread = {},

  profile = {},

  input = {},

  currentSpec = {},
}) => {
  const spec = getLegacyPrintSpecFactor(input, currentSpec);

  const threadNodes = Array.isArray(activeThread?.nodes) ? activeThread.nodes.filter(Boolean) : [];

  const rankedAxes = THREAD_NODE_ORDER.map((nodeKey) => ({
    nodeKey,

    value: getAxisValue(profile, nodeKey),

    delta: getAxisDelta(profile, nodeKey),

    movement: getAxisMovement(profile, nodeKey),

    weight: getNodeVoiceWeight(profile, nodeKey),
  })).sort((a, b) => {
    if (b.movement !== a.movement) return b.movement - a.movement;

    return Math.abs(b.delta) - Math.abs(a.delta);
  });

  const dominantNodes = [...threadNodes, ...rankedAxes.map((item) => item.nodeKey)].filter(
    (nodeKey, index, arr) => nodeKey && arr.indexOf(nodeKey) === index
  );

  const primaryNode = dominantNodes[0] || rankedAxes[0]?.nodeKey || 'warmth';

  const secondaryNode = dominantNodes[1] || rankedAxes[1]?.nodeKey || 'attack';

  const tertiaryNode = dominantNodes[2] || rankedAxes[2]?.nodeKey || 'control';

  const attack = getAxisDelta(profile, 'attack');

  const brightness = getAxisDelta(profile, 'brightness');

  const projection = getAxisDelta(profile, 'projection');

  const sustain = getAxisDelta(profile, 'sustain');

  const warmth = getAxisDelta(profile, 'warmth');

  const sensitivity = getAxisDelta(profile, 'sensitivity');

  const control = getAxisDelta(profile, 'control');

  const depthPush = clamp((spec.depth - 5.5) / 2.5, -0.75, 0.95);

  const shellFocus = clamp((spec.thickness - 10) / 4, -0.75, 0.75);

  const lugFocus = clamp((spec.lugs - 8) / 2, -0.65, 0.65);

  const sizeWeight = clamp((spec.size - 13) / 2, -0.65, 0.65);

  const angularPull =
    attack * 0.24 +
    brightness * 0.2 +
    projection * 0.18 -
    warmth * 0.18 -
    sustain * 0.14 +
    control * 0.1;

  const openness =
    warmth * 0.28 + sustain * 0.24 + sensitivity * 0.14 - control * 0.18 - shellFocus * 0.2;

  const focus =
    control * 0.3 +
    attack * 0.22 +
    projection * 0.18 +
    shellFocus * 0.2 +
    lugFocus * 0.14 -
    sustain * 0.14;

  const family =
    control > 0.28 && attack > 0.18
      ? 'blackened-sigil'
      : projection > 0.3
        ? 'forward-flare'
        : warmth > 0.24 && sustain > 0.2
          ? 'ember-bloom'
          : sensitivity > 0.24
            ? 'ghost-thread'
            : brightness > 0.22 || attack > 0.26
              ? 'strike-shard'
              : depthPush > 0.45
                ? 'deep-orbit'
                : shellFocus > 0.28 || lugFocus > 0.28
                  ? 'controlled-frame'
                  : 'heritage-mark';

  return {
    spec,

    rankedAxes,

    dominantNodes,

    primaryNode,

    secondaryNode,

    tertiaryNode,

    family,

    deltas: {
      attack,

      brightness,

      projection,

      sustain,

      warmth,

      sensitivity,

      control,
    },

    factors: {
      depthPush,

      shellFocus,

      lugFocus,

      sizeWeight,

      movementAverage: getProfileMovementAverage(profile),

      depthLean: getDepthLeanFromProfile(profile),

      angularPull: clamp(angularPull, -1, 1),

      openness: clamp(openness, -1, 1),

      focus: clamp(focus, -1, 1),
    },
  };
};

const getLegacyContourFamily = ({ read, input = {}, currentSpec = {} }) => {
  const { spec, factors } = read;

  const depth = Number(spec?.depth || input?.depth || currentSpec?.depth || 5.5);

  const thickness = Number(spec?.thickness || 10);

  const lugs = Number(spec?.lugs || input?.lugs || currentSpec?.lugs || 8);

  const finishText = String(
    input?.scorchDepth || input?.finish || currentSpec?.finish || currentSpec?.scorchDepth || ''
  ).toLowerCase();

  const isBlackened = finishText.includes('black');

  const isMediumTorch = finishText.includes('medium');

  if (isBlackened && depth <= 5.5) return 'dryShard';

  if (isBlackened) return 'torchCrown';

  if (thickness >= 12 || lugs >= 10 || factors.focus > 0.34) return 'focusedSeat';

  if (depth <= 5) return 'compactCut';

  if (depth <= 5.5) return 'pocketHook';

  if (depth <= 6) return 'shoulderLean';

  if (depth <= 6.5) return 'lowCrest';

  if (depth <= 7) return isMediumTorch ? 'wideShelf' : 'shoulderLean';

  return 'deepDrop';
};

const LEGACY_FAMILY_CONTOURS = {
  compactCut: [
    { a: -118, r: 96 },

    { a: -76, r: 154 },

    { a: -30, r: 106 },

    { a: 18, r: 164 },

    { a: 68, r: 102 },

    { a: 124, r: 138 },

    { a: 184, r: 90 },

    { a: 244, r: 128 },

    { a: 306, r: 104 },
  ],

  pocketHook: [
    { a: -130, r: 150 },

    { a: -88, r: 100 },

    { a: -42, r: 164 },

    { a: 8, r: 118 },

    { a: 62, r: 170 },

    { a: 118, r: 108 },

    { a: 176, r: 154 },

    { a: 236, r: 96 },

    { a: 300, r: 148 },
  ],

  shoulderLean: [
    { a: -138, r: 112 },

    { a: -92, r: 160 },

    { a: -38, r: 112 },

    { a: 16, r: 154 },

    { a: 70, r: 136 },

    { a: 126, r: 154 },

    { a: 186, r: 106 },

    { a: 246, r: 156 },

    { a: 306, r: 118 },
  ],

  lowCrest: [
    { a: -138, r: 104 },

    { a: -92, r: 152 },

    { a: -34, r: 126 },

    { a: 22, r: 138 },

    { a: 78, r: 110 },

    { a: 132, r: 168 },

    { a: 190, r: 152 },

    { a: 246, r: 162 },

    { a: 306, r: 112 },
  ],

  wideShelf: [
    { a: -146, r: 164 },

    { a: -96, r: 124 },

    { a: -42, r: 166 },

    { a: 12, r: 132 },

    { a: 70, r: 178 },

    { a: 124, r: 126 },

    { a: 180, r: 172 },

    { a: 238, r: 132 },

    { a: 304, r: 166 },
  ],

  deepDrop: [
    { a: -146, r: 114 },

    { a: -98, r: 150 },

    { a: -42, r: 132 },

    { a: 14, r: 142 },

    { a: 68, r: 128 },

    { a: 124, r: 174 },

    { a: 184, r: 176 },

    { a: 242, r: 178 },

    { a: 304, r: 120 },
  ],

  torchCrown: [
    { a: -128, r: 158 },

    { a: -84, r: 96 },

    { a: -32, r: 174 },

    { a: 18, r: 104 },

    { a: 76, r: 166 },

    { a: 132, r: 104 },

    { a: 190, r: 160 },

    { a: 246, r: 108 },

    { a: 304, r: 154 },
  ],

  dryShard: [
    { a: -128, r: 92 },

    { a: -82, r: 168 },

    { a: -30, r: 104 },

    { a: 24, r: 174 },

    { a: 78, r: 96 },

    { a: 134, r: 152 },

    { a: 190, r: 110 },

    { a: 248, r: 168 },

    { a: 306, r: 96 },
  ],

  focusedSeat: [
    { a: -132, r: 96 },

    { a: -84, r: 146 },

    { a: -28, r: 102 },

    { a: 26, r: 148 },

    { a: 80, r: 100 },

    { a: 136, r: 150 },

    { a: 190, r: 98 },

    { a: 246, r: 144 },

    { a: 304, r: 102 },
  ],
};

const getLegacyPrintAcousticBodyItems = ({
  profile = {},

  activeThread = {},

  input = {},

  currentSpec = {},
}) => {
  const seed = getVisualSeed({
    thread: activeThread,

    profile,

    input,

    currentSpec,
  });

  const read = getLegacyPrintProfile({
    activeThread,

    profile,

    input,

    currentSpec,
  });

  const controlValue = getAxisValue(profile, 'control');

  const controlDelta = getAxisDelta(profile, 'control');

  const controlMovement = getAxisMovement(profile, 'control');

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const compression = clamp((controlValue - 5) / 3, -0.45, 0.55);

  const focusTighten = clamp(read.factors.focus * 0.18 + compression * 0.22, -0.16, 0.24);

  const openness = clamp(read.factors.openness, -1, 1);

  const spec = read.spec || {};

  const depthPush = clamp((Number(spec.depth || 5.5) - 5.5) / 2.5, -0.65, 0.9);

  const sizePush = clamp((Number(spec.size || 14) - 14) / 2, -0.35, 0.35);

  const nodeRules = {
    attack: {
      anchor: 'attack',

      pre: 'control',

      post: 'brightness',

      basePull: 0.68,

      valuePull: 0.28,

      highPull: 0.26,

      sharpness: 0.24,

      xBias: 0,

      yBias: -10,
    },

    brightness: {
      anchor: 'brightness',

      pre: 'attack',

      post: 'projection',

      basePull: 0.66,

      valuePull: 0.23,

      highPull: 0.2,

      sharpness: 0.16,

      xBias: 8,

      yBias: -7,
    },

    projection: {
      anchor: 'projection',

      pre: 'brightness',

      post: 'sustain',

      basePull: 0.68,

      valuePull: 0.28,

      highPull: 0.28,

      sharpness: 0.14,

      xBias: 14,

      yBias: 0,
    },

    sustain: {
      anchor: 'sustain',

      pre: 'projection',

      post: 'warmth',

      basePull: 0.64,

      valuePull: 0.24,

      highPull: 0.22,

      sharpness: -0.12,

      xBias: 6,

      yBias: 12,
    },

    warmth: {
      anchor: 'warmth',

      pre: 'sustain',

      post: 'sensitivity',

      basePull: 0.66,

      valuePull: 0.25,

      highPull: 0.24,

      sharpness: -0.18,

      xBias: -8,

      yBias: 13,
    },

    sensitivity: {
      anchor: 'sensitivity',

      pre: 'warmth',

      post: 'control',

      basePull: 0.62,

      valuePull: 0.2,

      highPull: 0.16,

      sharpness: 0.08,

      xBias: -12,

      yBias: 0,
    },

    control: {
      anchor: 'control',

      pre: 'sensitivity',

      post: 'attack',

      basePull: 0.56,

      valuePull: -0.12,

      highPull: -0.18,

      sharpness: -0.1,

      xBias: -4,

      yBias: -6,
    },
  };

  const makePoint = (nodeKey, type, index) => {
    const rule = nodeRules[nodeKey] || nodeRules.warmth;

    const anchorKey = type === 'pre' ? rule.pre : type === 'post' ? rule.post : rule.anchor;

    const basePoint = getPointForNode(anchorKey) || SVG_CENTER;

    const value = getAxisValue(profile, nodeKey);

    const delta = value - 5;

    const movement = getAxisMovement(profile, nodeKey);

    const signed = getSignedAxisMovement(profile, nodeKey);

    const neighborMix = type === 'pre' ? 0.22 : type === 'post' ? 0.78 : 0.5;

    const prevPoint = getPointForNode(rule.pre) || basePoint;

    const nextPoint = getPointForNode(rule.post) || basePoint;

    const blendedAnchor =
      type === 'main' ? basePoint : mixPoints(prevPoint, nextPoint, neighborMix);

    const bodyPush =
      rule.basePull +
      delta * rule.valuePull * 0.16 +
      movement * rule.highPull -
      focusTighten +
      (nodeKey === 'warmth' || nodeKey === 'sustain' ? openness * 0.08 : 0) +
      (nodeKey === 'sustain' || nodeKey === 'warmth' ? depthPush * 0.06 : 0) +
      (nodeKey === 'projection' ? sizePush * 0.06 : 0);

    const radius = clamp(bodyPush, 0.38, 0.96);

    const pulled = pullPointFromCenter(blendedAnchor, radius);

    const shimmer =
      nodeKey === 'sensitivity'
        ? getAxisMovement(profile, 'sensitivity') *
          getSeededSignedValue(seed, `sensitivity-ripple-${index}`) *
          10
        : 0;

    const sharp = rule.sharpness * movement * (type === 'main' ? 18 : 9) * (delta >= 0 ? 1 : -0.35);

    const xJitter =
      getSeededSignedValue(seed, `${nodeKey}-x-${type}-${index}`) * (2 + movementAverage * 4);

    const yJitter =
      getSeededSignedValue(seed, `${nodeKey}-y-${type}-${index}`) * (2 + movementAverage * 4);

    const point = keepPointInsideThreadFrame(
      {
        x: pulled.x + rule.xBias * movement + sharp + shimmer + xJitter + depthLean * 5,

        y:
          pulled.y +
          rule.yBias * movement +
          (nodeKey === 'warmth' || nodeKey === 'sustain' ? depthPush * 10 : 0) +
          yJitter,
      },

      controlDelta > 0.7 ? 0.8 : 0.88
    );

    const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

    return {
      pointKey: `legacyprint-acoustic-${nodeKey}-${type}`,

      nodeKey,

      family: 'acousticBody',

      color,

      point,

      movement,

      signed,

      value,

      type,
    };
  };

  const items = [];

  THREAD_NODE_ORDER.forEach((nodeKey, nodeIndex) => {
    items.push(makePoint(nodeKey, 'pre', nodeIndex * 3));

    items.push(makePoint(nodeKey, 'main', nodeIndex * 3 + 1));

    items.push(makePoint(nodeKey, 'post', nodeIndex * 3 + 2));
  });

  const sorted = sortPointsClockwise(items.map((item) => item.point));

  const sortedItems = sorted.map((point) => {
    const match =
      items.find(
        (item) =>
          Math.abs(item.point.x - point.x) < 0.001 && Math.abs(item.point.y - point.y) < 0.001
      ) || items[0];

    return {
      ...match,

      point,
    };
  });

  const points = sortedItems.map((item) => item.point);

  const smoothed = points.map((point, index) => {
    const item = sortedItems[index];

    const prev = points[(index - 1 + points.length) % points.length];

    const next = points[(index + 1) % points.length];

    const nodeKey = item.nodeKey;

    const value = getAxisValue(profile, nodeKey);

    const movement = getAxisMovement(profile, nodeKey);

    const shouldSharpen =
      nodeKey === 'attack' || nodeKey === 'brightness' || nodeKey === 'projection';

    const shouldRound = nodeKey === 'warmth' || nodeKey === 'sustain' || controlValue > 5.6;

    const smoothAmount = shouldSharpen
      ? clamp(0.08 + (1 - movement) * 0.08, 0.06, 0.16)
      : shouldRound
        ? clamp(0.18 + movement * 0.1, 0.18, 0.34)
        : 0.14;

    const neighborAverage = {
      x: prev.x * 0.2 + point.x * 0.6 + next.x * 0.2,

      y: prev.y * 0.2 + point.y * 0.6 + next.y * 0.2,
    };

    const mixed = mixPoints(point, neighborAverage, smoothAmount);

    if (nodeKey === 'control' && value > 5.6) {
      return mixPoints(mixed, SVG_CENTER, clamp((value - 5.6) * 0.035, 0, 0.1));
    }

    return mixed;
  });

  const centered = recenterPoints(smoothed, 0.08);

  return sortedItems.map((item, index) => ({
    ...item,

    point: centered[index] || item.point,
  }));
};

const getLegacyPrintAcousticBodyPath = (shapeItems = []) => {
  const cleanItems = shapeItems.filter((item) => item?.point && isFinitePoint(item.point));

  if (cleanItems.length < 3) {
    return getOpenPath(cleanItems.map((item) => item.point));
  }

  const points = cleanItems.map((item) => item.point);

  const first = points[0];

  const segments = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];

    const next = points[(index + 1) % points.length];

    const afterNext = points[(index + 2) % points.length];

    const item = cleanItems[index];

    const nodeKey = item.nodeKey;

    const movement = Number(item.movement || 0);

    const sharpNodes = ['attack', 'brightness', 'projection'];

    const roundNodes = ['warmth', 'sustain'];

    const tension = sharpNodes.includes(nodeKey)
      ? clamp(0.3 + movement * 0.18, 0.3, 0.52)
      : roundNodes.includes(nodeKey)
        ? clamp(0.68 - movement * 0.08, 0.52, 0.68)
        : 0.52;

    const controlA = {
      x: point.x + ((next.x - previous.x) / 6) * tension,

      y: point.y + ((next.y - previous.y) / 6) * tension,
    };

    const controlB = {
      x: next.x - ((afterNext.x - point.x) / 6) * tension,

      y: next.y - ((afterNext.y - point.y) / 6) * tension,
    };

    segments.push(
      `C ${controlA.x.toFixed(2)} ${controlA.y.toFixed(
        2
      )} ${controlB.x.toFixed(2)} ${controlB.y.toFixed(
        2
      )} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
    );
  });

  return `${segments.join(' ')} Z`;
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
  const threadNodes = Array.isArray(activeThread?.nodes) ? activeThread.nodes.filter(Boolean) : [];

  const seed = getVisualSeed({
    thread: activeThread,

    profile,

    input,

    currentSpec,
  });

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  if (resolvedReadVariant === 'legacyprint') {
    return getLegacyPrintAcousticBodyItems({
      activeThread,

      profile,

      input,

      currentSpec,
    });
  }

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

      const signed = clamp(rawDelta / 0.95, -1, 1);

      const rankBasePull = index === 0 ? 0.78 : index === 1 ? 0.68 : 0.6;

      const movementPull =
        index === 0 ? movement * 0.28 : index === 1 ? movement * 0.24 : movement * 0.2;

      const signedPull = signed * 0.12;

      const rankPull = clamp(rankBasePull + movementPull + signedPull, 0.36, 1.04);

      const xJitter = getSeededSignedValue(seed, `first-tell-x-${nodeKey}-${index}`) * 9;

      const yJitter = getSeededSignedValue(seed, `first-tell-y-${nodeKey}-${index}`) * 9;

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(
          offsetPoint(pullPointFromCenter(basePoint, rankPull), xJitter, yJitter, 0.98),

          0.98
        ),
      };
    });

    return widenFirstTellTriangle(triangleItems);
  }

  if (resolvedReadVariant === 'player') {
    return THREAD_NODE_ORDER.map((nodeKey) => {
      const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

      const radius = getPlayerReadRadiusForNode(profile, nodeKey);

      return {
        nodeKey,

        point: keepPointInsideThreadFrame(pullPointFromCenter(basePoint, radius), 0.92),
      };
    });
  }

  if (threadKind === 'simple') {
    const nodes = threadNodes.length >= 2 ? threadNodes.slice(0, 2) : ['attack', 'warmth'];

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

    return {
      nodeKey,

      point: keepPointInsideThreadFrame(
        offsetPoint(
          pulled,

          getSeededSignedValue(seed, `complex-x-${index}`) * 12 + depthLean * 7,

          getSeededSignedValue(seed, `complex-y-${index}`) * 12 + Math.abs(depthLean) * 4,

          0.74
        ),

        0.74
      ),
    };
  });

  const sortedCoreItems = [...corePoints]

    .filter((item) => item?.nodeKey && isFinitePoint(item?.point))

    .sort((a, b) => {
      const centroid = getCentroid(corePoints.map((item) => item.point));

      const angleA = Math.atan2(
        Number(a.point.y) - centroid.y,

        Number(a.point.x) - centroid.x
      );

      const angleB = Math.atan2(
        Number(b.point.y) - centroid.y,

        Number(b.point.x) - centroid.x
      );

      return angleA - angleB;
    });

  const centeredPoints = recenterPoints(
    sortedCoreItems.map((item) => item.point),

    0.42
  );

  return sortedCoreItems.map((item, index) => ({
    ...item,

    point: centeredPoints[index] || item.point,
  }));
};

const hydrateShapeItemColors = (items = []) => {
  return items.map((item) => ({
    ...item,

    color: item.color || AXIS_COLOR_BY_KEY[item.nodeKey] || '#d6b277',
  }));
};

const getShapeIdentityKey = (item = {}, index = 0) => {
  return item.pointKey || `${item.nodeKey || 'node'}-${index}`;
};

const interpolateShapeItems = (fromItems = [], toItems = [], progress = 1) => {
  if (!toItems.length) return [];

  return toItems.map((toItem, index) => {
    const toKey = getShapeIdentityKey(toItem, index);

    const fromItem =
      fromItems.find((item, fromIndex) => {
        return getShapeIdentityKey(item, fromIndex) === toKey;
      }) ||
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

    const toColor = toItem?.color || AXIS_COLOR_BY_KEY[toItem.nodeKey] || '#d6b277';

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

    .map((item, index) => {
      return `${getShapeIdentityKey(item, index)}:${item.nodeKey}:${round(
        item.point?.x,

        2
      )},${round(item.point?.y, 2)}`;
    })

    .join('|');
};

const easeOutCubic = (value) => {
  const t = clamp(value, 0, 1);

  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const buildSegments = ({ shapeItems, closed = true }) => {
  const cleanItems = shapeItems.filter((item) => item?.nodeKey && isFinitePoint(item?.point));

  if (cleanItems.length < 2) return [];

  const segmentCount = closed && cleanItems.length > 2 ? cleanItems.length : cleanItems.length - 1;

  return Array.from({ length: segmentCount }).map((_, index) => {
    const item = cleanItems[index];

    const next = cleanItems[(index + 1) % cleanItems.length];

    return {
      key: `${item.nodeKey}-${next.nodeKey}-${index}`,

      sourceNode: item.nodeKey,

      targetNode: next.nodeKey,

      sourceColor: item.color || AXIS_COLOR_BY_KEY[item.nodeKey] || '#d6b277',

      targetColor: next.color || AXIS_COLOR_BY_KEY[next.nodeKey] || '#d6b277',

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

const buildPlayerReadSegments = (shapeItems = []) => {
  const cleanItems = shapeItems.filter((item) => item?.nodeKey && isFinitePoint(item?.point));

  if (cleanItems.length < 2) return [];

  return cleanItems.map((item, index) => {
    const next = cleanItems[(index + 1) % cleanItems.length];

    return {
      key: `player-read-${item.nodeKey}-${next.nodeKey}-${index}`,

      sourceNode: item.nodeKey,

      targetNode: next.nodeKey,

      sourcePoint: item.point,

      targetPoint: next.point,

      sourceColor: AXIS_COLOR_BY_KEY[item.nodeKey] || '#d6b277',

      targetColor: AXIS_COLOR_BY_KEY[next.nodeKey] || '#d6b277',

      path: `M ${item.point.x.toFixed(2)} ${item.point.y.toFixed(
        2
      )} L ${next.point.x.toFixed(2)} ${next.point.y.toFixed(2)}`,
    };
  });
};

const buildLegacyPrintInfluences = (shapeItems = [], profile = {}) => {
  const grouped = THREAD_NODE_ORDER.map((nodeKey) => {
    const anchorPoint = getPointForNode(nodeKey) || SVG_CENTER;

    const related = shapeItems.filter((item) => item.nodeKey === nodeKey);

    const fallbackPoint = pullPointFromCenter(anchorPoint, 0.58);

    const targetPoint = related.length
      ? getCentroid(related.map((item) => item.point))
      : fallbackPoint;

    const movement = getAxisMovement(profile, nodeKey);

    const signed = getSignedAxisMovement(profile, nodeKey);

    const value = getAxisValue(profile, nodeKey);

    const weight = getNodeVoiceWeight(profile, nodeKey);

    const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

    const meaning = LEGACY_NODE_MEANING[nodeKey] || LEGACY_NODE_MEANING.warmth;

    const controlA = mixPoints(anchorPoint, targetPoint, 0.38);

    const controlB = mixPoints(anchorPoint, targetPoint, 0.7);

    const curveLean = signed * 18;

    const curveDepth = meaning.mass * 10;

    const path = `M ${anchorPoint.x.toFixed(2)} ${anchorPoint.y.toFixed(
      2
    )} C ${(controlA.x + curveLean).toFixed(2)} ${(controlA.y - curveDepth).toFixed(
      2
    )} ${(controlB.x - curveLean).toFixed(2)} ${(controlB.y + curveDepth).toFixed(
      2
    )} ${targetPoint.x.toFixed(2)} ${targetPoint.y.toFixed(2)}`;

    return {
      nodeKey,

      anchorPoint,

      targetPoint,

      path,

      movement,

      signed,

      value,

      weight,

      color,

      label: meaning.label,

      pulse: meaning.pulse,
    };
  });

  return grouped;
};

const getGradientVector = (shapeItems = []) => {
  const cleanItems = shapeItems.filter((item) => item?.nodeKey && isFinitePoint(item?.point));

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

      <stop offset="38%" stopColor={earlyBlend} stopOpacity={sourceOpacity * 0.9} />

      <stop offset="50%" stopColor={middleColor} stopOpacity={midOpacity} />

      <stop offset="62%" stopColor={lateBlend} stopOpacity={targetOpacity * 0.9} />

      <stop
        offset={`${targetHold}%`}
        stopColor={softenColor(targetColor, 0.12)}
        stopOpacity={targetOpacity}
      />

      <stop offset="100%" stopColor={targetColor} stopOpacity={targetOpacity} />
    </>
  );
};

const SPIDER_GRID_LEVELS = Array.from({ length: 10 }, (_, index) => index + 1);

const getSpiderGridPolygonPoints = (level) => {
  const scale = clamp(level / 10, 0, 1);

  return THREAD_NODE_ORDER.map((nodeKey) => {
    const point = getPointForNode(nodeKey) || SVG_CENTER;

    const scaledPoint = mixPoints(SVG_CENTER, point, scale);

    return `${scaledPoint.x.toFixed(2)},${scaledPoint.y.toFixed(2)}`;
  }).join(' ');
};

const getReferenceProfilePoints = () => {
  return THREAD_NODE_ORDER.map((nodeKey) => {
    const basePoint = getPointForNode(nodeKey) || SVG_CENTER;

    const radius = getPlayerReadRadiusForNode(HERITAGE_REFERENCE_PROFILE, nodeKey);

    return {
      nodeKey,

      point: pullPointFromCenter(basePoint, radius),
    };
  });
};

const getReferenceProfilePath = () => {
  const points = getReferenceProfilePoints().map((item) => item.point);

  if (!points.length) return '';

  const [first, ...rest] = points;

  return [
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,

    ...rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),

    'Z',
  ].join(' ');
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
  const isVoiceMappingMode = displayMode === 'VoiceMapping';

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

  const shapeColors = useMemo(() => getShapeColors(activeThread), [activeThread]);

  const rankedNodes = useMemo(() => {
    return getRankedThreadNodes({
      profile,

      activeThread,

      resolvedReadVariant,

      firstTellKeys,
    });
  }, [profile, profileSignature, activeThread, nodesSignature, resolvedReadVariant, firstTellKeys]);

  const rankMap = useMemo(() => getRankMap(rankedNodes), [rankedNodes]);

  const activeNodeSet = useMemo(() => {
    return new Set(
      activeThread?.nodes && activeThread.nodes.length
        ? activeThread.nodes
        : resolvedReadVariant === 'firstTell' && firstTellKeys.length
          ? firstTellKeys
          : resolvedReadVariant === 'legacyprint'
            ? rankedNodes.slice(0, 4).map((node) => node.nodeKey)
            : []
    );
  }, [nodesSignature, activeThread?.nodes, resolvedReadVariant, firstTellKeys, rankedNodes]);

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
      SHAPE_MORPH_CACHE.get(morphCacheKey) && SHAPE_MORPH_CACHE.get(morphCacheKey).length
        ? SHAPE_MORPH_CACHE.get(morphCacheKey)
        : null;

    const fromItems = liveItems || cachedItems || toItems;

    const fromSignature = getShapeItemsSignature(fromItems);

    const toSignature = getShapeItemsSignature(toItems);

    if (fromSignature === toSignature || compact || shouldReduceMotion() || isDocumentHidden()) {
      animatedShapeItemsRef.current = toItems;

      SHAPE_MORPH_CACHE.set(morphCacheKey, toItems);

      setAnimatedShapeItems(toItems);

      return undefined;
    }

    const duration = resolvedReadVariant === 'legacyprint' ? 880 : 520;

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

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
  }, [targetShapeSignature, morphCacheKey, compact, targetShapeItems, resolvedReadVariant]);

  const shapeItems = animatedShapeItems;

  const shouldCloseShape = !(
    threadKind === 'simple' &&
    !isVoiceMappingMode &&
    shapeItems.length <= 2
  );

  const shapePath = useMemo(() => {
    const points = shapeItems.map((item) => item.point).filter(isFinitePoint);

    if (!points.length) return '';

    if (resolvedReadVariant === 'legacyprint') {
      return getLegacyPrintAcousticBodyPath(shapeItems);
    }

    if (!shouldCloseShape || points.length < 3) {
      return getOpenPath(points);
    }

    return getCurvedClosedPath(points, 0.075);
  }, [shapeItems, shouldCloseShape, resolvedReadVariant, compact]);

  const relationshipSegments = useMemo(() => {
    if (resolvedReadVariant === 'legacyprint') return [];

    return buildSegments({
      shapeItems,

      closed: shouldCloseShape,
    });
  }, [shapeItems, shouldCloseShape, resolvedReadVariant]);

  const playerReadSegments = useMemo(() => {
    if (resolvedReadVariant !== 'player') return [];

    return buildPlayerReadSegments(shapeItems);
  }, [shapeItems, resolvedReadVariant]);

  const legacyPrintInfluences = useMemo(() => {
    if (resolvedReadVariant !== 'legacyprint') return [];

    return buildLegacyPrintInfluences(shapeItems, profile);
  }, [shapeItems, profile, profileSignature, resolvedReadVariant]);

  const legacyPrintTopNodes = useMemo(() => {
    if (resolvedReadVariant !== 'legacyprint') return [];

    return rankedNodes.slice(0, 4);
  }, [rankedNodes, resolvedReadVariant]);

  const mapId = `heritage-voice-thread-${
    compact ? 'compact' : 'large'
  }-${sanitizeMapId(activeThread?.id)}-${sanitizeMapId(
    [activeThread?.slotKey, threadKind, resolvedReadVariant].join('|')
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
    shapePath && (threadKind === 'complex' || resolvedReadVariant === 'legacyprint');

  const baseCoreStrokeWidth =
    resolvedReadVariant === 'legacyprint'
      ? compact
        ? 2.05
        : 3.2
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
        ? 6.5
        : 11.5
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
        ? 12
        : 22
      : resolvedReadVariant === 'player'
        ? compact
          ? 23
          : 34
        : compact
          ? 24
          : 35;

  const legacyPrintFamily =
    resolvedReadVariant === 'legacyprint'
      ? shapeItems.find((item) => item?.family)?.family || 'heritage-mark'
      : '';

  const legacyPrintMotionStrength =
    resolvedReadVariant === 'legacyprint' ? clamp(getProfileMovementAverage(profile), 0, 1) : 0;

  return (
    <div
      className={`heritage-voice-thread-map ${
        compact ? 'heritage-voice-thread-map--compact' : ''
      } heritage-voice-thread-map--${threadKind} heritage-voice-thread-map--${displayMode} heritage-voice-thread-map--read-${resolvedReadVariant} ${
        legacyPrintFamily ? `heritage-voice-thread-map--legacyprint-${legacyPrintFamily}` : ''
      }`}
      style={{
        '--dominant-thread-color': primaryNode.color,

        '--secondary-thread-color': secondaryNode.color,

        '--tertiary-thread-color': tertiaryNode.color,

        '--legacyprint-motion-strength': legacyPrintMotionStrength,
      }}
      aria-label={
        activeThread ? `Voice Thread map showing ${activeThread.title}` : 'Voice Thread map'
      }
      data-thread-id={activeThread?.id || ''}
      data-thread-kind={threadKind}
      data-strength-score={strengthScore}
      data-legacyprint-family={legacyPrintFamily}
    >
      {resolvedReadVariant === 'player' && !compact && (
        <div className="heritage-player-read-map-key" aria-hidden="true">
          <span className="heritage-player-read-map-key__item">
            <span className="heritage-player-read-map-key__line heritage-player-read-map-key__line--reference" />
            Reference baseline
          </span>

          <span className="heritage-player-read-map-key__item">
            <span className="heritage-player-read-map-key__line heritage-player-read-map-key__line--selected" />
            Selected build
          </span>
        </div>
      )}

      <svg
        className="heritage-voice-thread-svg"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <filter id={`${mapId}-softGlow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={compact ? '4.2' : '6.2'} result="softBlur" />

            <feMerge>
              <feMergeNode in="softBlur" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${mapId}-neonGlow`} x="-130%" y="-130%" width="360%" height="360%">
            <feGaussianBlur stdDeviation={compact ? '2.3' : '3.4'} result="glowA" />

            <feGaussianBlur stdDeviation={compact ? '6.5' : '9.6'} result="glowB" />

            <feGaussianBlur stdDeviation={compact ? '13' : '18'} result="glowC" />

            <feMerge>
              <feMergeNode in="glowC" />

              <feMergeNode in="glowB" />

              <feMergeNode in="glowA" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${mapId}-primaryGlow`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation={compact ? '3.8' : '5.4'} result="primaryA" />

            <feGaussianBlur stdDeviation={compact ? '10' : '15'} result="primaryB" />

            <feGaussianBlur stdDeviation={compact ? '18' : '26'} result="primaryC" />

            <feMerge>
              <feMergeNode in="primaryC" />

              <feMergeNode in="primaryB" />

              <feMergeNode in="primaryA" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${mapId}-nodeGlow`} x="-130%" y="-130%" width="360%" height="360%">
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

                <stop offset="50%" stopColor={mixTwoHexColors(sourceColor, targetColor, 0.5)} />

                <stop offset="100%" stopColor={darkenColor(targetColor, 0.12)} />
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

          {playerReadSegments.map((segment) => (
            <linearGradient
              key={`${mapId}-${segment.key}-gradient`}
              id={`${mapId}-${segment.key}-gradient`}
              gradientUnits="userSpaceOnUse"
              x1={segment.sourcePoint.x}
              y1={segment.sourcePoint.y}
              x2={segment.targetPoint.x}
              y2={segment.targetPoint.y}
            >
              <stop offset="0%" stopColor={segment.sourceColor} stopOpacity="0.9" />

              <stop
                offset="50%"
                stopColor={mixTwoHexColors(
                  segment.sourceColor,

                  segment.targetColor,

                  0.5
                )}
                stopOpacity="0.86"
              />

              <stop offset="100%" stopColor={segment.targetColor} stopOpacity="0.9" />
            </linearGradient>
          ))}

          {legacyPrintInfluences.map((influence) => (
            <linearGradient
              key={`${mapId}-legacy-influence-gradient-${influence.nodeKey}`}
              id={`${mapId}-legacy-influence-gradient-${influence.nodeKey}`}
              gradientUnits="userSpaceOnUse"
              x1={influence.anchorPoint.x}
              y1={influence.anchorPoint.y}
              x2={influence.targetPoint.x}
              y2={influence.targetPoint.y}
            >
              <stop offset="0%" stopColor={influence.color} stopOpacity="0.02" />

              <stop offset="42%" stopColor={influence.color} stopOpacity="0.2" />

              <stop offset="100%" stopColor={influence.color} stopOpacity="0.54" />
            </linearGradient>
          ))}

          <linearGradient
            id={`${mapId}-activeShapeGradient`}
            gradientUnits="userSpaceOnUse"
            x1={gradientVector.x1}
            y1={gradientVector.y1}
            x2={gradientVector.x2}
            y2={gradientVector.y2}
          >
            <stop offset="0%" stopColor={primaryNode.color} stopOpacity="0.96" />

            <stop
              offset="38%"
              stopColor={mixTwoHexColors(primaryNode.color, secondaryNode.color, 0.35)}
              stopOpacity="0.92"
            />

            <stop
              offset="72%"
              stopColor={mixTwoHexColors(secondaryNode.color, tertiaryNode.color, 0.45)}
              stopOpacity="0.78"
            />

            <stop offset="100%" stopColor={tertiaryNode.color} stopOpacity="0.62" />
          </linearGradient>

          <radialGradient id={`${mapId}-complexFillGradient`} cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor={primaryNode.color} stopOpacity="0.2" />

            <stop offset="46%" stopColor={secondaryNode.color} stopOpacity="0.13" />

            <stop offset="78%" stopColor={tertiaryNode.color} stopOpacity="0.06" />

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
            <stop offset="0%" stopColor={primaryNode.color} stopOpacity="0.62" />

            <stop
              offset="44%"
              stopColor={mixTwoHexColors(primaryNode.color, secondaryNode.color, 0.42)}
              stopOpacity="0.34"
            />

            <stop offset="100%" stopColor={secondaryNode.color} stopOpacity="0.14" />
          </linearGradient>
        </defs>

        <g
          className={`heritage-voice-thread-map-stage heritage-voice-thread-map-stage--${resolvedReadVariant}`}
        >
          <g className="heritage-voice-thread-network">
            {resolvedReadVariant === 'player' && (
              <g className="heritage-voice-thread-spider-grid" aria-hidden="true">
                {SPIDER_GRID_LEVELS.map((level) => (
                  <polygon
                    key={`spider-grid-level-${level}`}
                    points={getSpiderGridPolygonPoints(level)}
                    className={`heritage-voice-thread-spider-grid-ring heritage-voice-thread-spider-grid-ring--${level}`}
                  />
                ))}

                <path
                  d={getReferenceProfilePath()}
                  className="heritage-player-read-reference-line"
                  fill="none"
                />

                {getReferenceProfilePoints().map((item) => (
                  <circle
                    key={`reference-dot-${item.nodeKey}`}
                    cx={item.point.x}
                    cy={item.point.y}
                    r="2.25"
                    className="heritage-player-read-reference-dot"
                  />
                ))}
              </g>
            )}

            {resolvedReadVariant === 'player' &&
              THREAD_NODE_ORDER.map((nodeKey) => {
                const point = THREAD_NODE_POSITIONS[nodeKey];

                if (!point) return null;

                const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

                return (
                  <line
                    key={`spider-${nodeKey}`}
                    x1="250"
                    y1="250"
                    x2={point.x * 5}
                    y2={point.y * 5}
                    className="heritage-voice-thread-spider-line"
                    stroke={color}
                    style={{ color }}
                  />
                );
              })}

            {resolvedReadVariant !== 'player' &&
              resolvedReadVariant !== 'legacyprint' &&
              THREAD_NODE_PAIRS.map(([source, target]) => {
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
              const nextNodeKey = THREAD_NODE_ORDER[(index + 1) % THREAD_NODE_ORDER.length];

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

          {shapePath && resolvedReadVariant !== 'player' && (
            <g
              className={`heritage-voice-thread-active-shape heritage-voice-thread-active-shape--${threadKind} heritage-voice-thread-active-shape--read-${resolvedReadVariant}`}
              data-transition-signature={targetShapeSignature}
              data-legacyprint-family={legacyPrintFamily}
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

                    const segmentHaloWidth = baseHaloStrokeWidth * (0.46 + segmentStrength * 0.74);

                    const segmentGlowWidth = baseGlowStrokeWidth * (0.54 + segmentStrength * 0.78);

                    const segmentCoreWidth = baseCoreStrokeWidth * (0.72 + segmentStrength * 0.58);

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
                            isPrimarySegment ? (compact ? 1.15 : 1.5) : compact ? 0.7 : 0.95
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
                    opacity={
                      resolvedReadVariant === 'legacyprint'
                        ? compact
                          ? 0.09
                          : 0.2
                        : compact
                          ? 0.15
                          : 0.21
                    }
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
                    opacity={
                      resolvedReadVariant === 'legacyprint'
                        ? compact
                          ? 0.28
                          : 0.48
                        : compact
                          ? 0.4
                          : 0.58
                    }
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
                    opacity="0.94"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d={shapePath}
                    className="heritage-voice-thread-shape-hotline"
                    fill="none"
                    stroke={`url(#${mapId}-complexSheenGradient)`}
                    strokeWidth={compact ? 0.75 : 1}
                    opacity="0.26"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </g>
          )}

          {resolvedReadVariant === 'player' && playerReadSegments.length > 0 && (
            <g
              className="heritage-player-read-polygon-layer"
              data-transition-signature={targetShapeSignature}
            >
              {playerReadSegments.map((segment) => {
                const gradientId = `${mapId}-${segment.key}-gradient`;

                return (
                  <g key={segment.key} className="heritage-player-read-polygon-segment">
                    <path
                      d={segment.path}
                      className="heritage-player-read-polygon-soft"
                      fill="none"
                      stroke={`url(#${gradientId})`}
                    />

                    <path
                      d={segment.path}
                      className="heritage-player-read-polygon-core"
                      fill="none"
                      stroke={`url(#${gradientId})`}
                    />
                  </g>
                );
              })}
            </g>
          )}

          <g className="heritage-voice-thread-node-layer">
            {THREAD_NODE_ORDER.map((nodeKey) => {
              const point = THREAD_NODE_POSITIONS[nodeKey];

              const baseIconPoint = THREAD_NODE_ICON_POSITIONS[nodeKey] || point;

              const iconPoint =
                resolvedReadVariant === 'firstTell'
                  ? baseIconPoint
                  : {
                      ...baseIconPoint,

                      x: baseIconPoint.x + 2.65,
                    };

              if (!point) return null;

              const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

              const rankItem = rankMap[nodeKey];

              const isActive = activeNodeSet.has(nodeKey);

              const rank = Number.isFinite(rankItem?.rank) ? rankItem.rank : 99;

              const nodeScore = Number(profile?.[nodeKey] ?? 5);

              const nodeStrength = Math.max(0, Math.min(1, nodeScore / 10));

              const movement = getAxisMovement(profile, nodeKey);

              return (
                <g
                  key={nodeKey}
                  className={`heritage-voice-thread-node ${
                    isActive ? 'is-active' : ''
                  } heritage-voice-thread-node--rank-${rank}`}
                  style={{
                    '--node-color': color,

                    '--node-motion': movement,

                    '--pulse-delay': `${THREAD_NODE_ORDER.indexOf(nodeKey) * 130}ms`,
                  }}
                  data-rank={rank}
                  data-node-key={nodeKey}
                >
                  <circle
                    cx={point.x * 5}
                    cy={point.y * 5}
                    r={rank === 0 ? 5.4 : rank === 1 ? 4.4 : isActive ? 3.7 : 2.45}
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
                        <MetricIcon type={nodeKey} color={color} size={22} />
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default VoiceThreadMap;
