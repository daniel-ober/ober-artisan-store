// src/utils/legacyPrint/heritageThreadShape.js

const AXES = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const DEFAULT_CENTER = {

  x: 250,

  y: 250,

};

const DEFAULT_NODE_POSITIONS = {

  attack: { x: 250, y: 80 },

  brightness: { x: 400, y: 155 },

  projection: { x: 430, y: 290 },

  sustain: { x: 330, y: 420 },

  warmth: { x: 170, y: 420 },

  sensitivity: { x: 70, y: 290 },

  control: { x: 100, y: 155 },

};

const clamp = (value, min, max) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round = (value, places = 3) => {

  const factor = 10 ** places;

  return Math.round(Number(value || 0) * factor) / factor;

};

const safeNumber = (value, fallback = 5) => {

  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;

};

const getAxisValue = (profile = {}, axis) => {

  return safeNumber(profile?.[axis], 5);

};

const getAxisDelta = (profile = {}, axis) => {

  return getAxisValue(profile, axis) - 5;

};

const getAxisMovement = (profile = {}, axis) => {

  return Math.abs(getAxisDelta(profile, axis));

};

const getProfileMovementTotal = (profile = {}) => {

  return AXES.reduce((sum, axis) => {

    return sum + getAxisMovement(profile, axis);

  }, 0);

};

const getProfileSpread = (profile = {}) => {

  const values = AXES.map((axis) => getAxisValue(profile, axis));

  return Math.max(...values) - Math.min(...values);

};

const normalizeText = (value = '') => {

  return String(value || '')

    .trim()

    .toLowerCase()

    .replace(/["”]/g, '')

    .replace(/\s+/g, ' ');

};

const hashString = (value = '') => {

  const text = String(value || '');

  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {

    hash ^= text.charCodeAt(index);

    hash +=

      (hash << 1) +

      (hash << 4) +

      (hash << 7) +

      (hash << 8) +

      (hash << 24);

  }

  return Math.abs(hash >>> 0);

};

const seededUnit = (seed, salt = '') => {

  const hash = hashString(`${seed}|${salt}`);

  return (hash % 10000) / 10000;

};

const seededSigned = (seed, salt = '') => {

  return seededUnit(seed, salt) * 2 - 1;

};

const parseSourceBuildRead = (sourceBuildRead = '') => {

  const text = String(sourceBuildRead || '');

  const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);

  const lugMatch = text.match(/(\d+)\s*lugs?/i);

  const staveMatch = text.match(/(\d+)\s*staves?/i);

  const thicknessMatch = text.match(/(\d+(?:\.\d+)?)\s*mm\s*shell/i);

  const lower = text.toLowerCase();

  const hoopType = lower.includes('die-cast')

    ? 'Die-Cast'

    : lower.includes('triple flange')

      ? 'Triple Flange'

      : '';

  const finish = lower.includes('blackened')

    ? 'Blackened'

    : lower.includes('light torch')

      ? 'Light Torch'

      : lower.includes('medium torch')

        ? 'Medium Torch'

        : '';

  const reRings =

    lower.includes('re-ring') ||

    lower.includes('re rings') ||

    lower.includes('rerings')

      ? 'Re-Rings'

      : 'None';

  return {

    width: sizeMatch ? Number(sizeMatch[1]) : null,

    depth: sizeMatch ? Number(sizeMatch[2]) : null,

    lugQuantity: lugMatch ? Number(lugMatch[1]) : null,

    staveQuantity: staveMatch ? Number(staveMatch[1]) : null,

    shellThicknessMm: thicknessMatch ? Number(thicknessMatch[1]) : null,

    hoopType,

    finish,

    reRings,

  };

};

const buildSpecSignature = ({ thread = {}, profile = {}, sourceBuildRead = '' }) => {

  const parsed = parseSourceBuildRead(sourceBuildRead);

  const profileSignature = AXES.map((axis) => {

    return `${axis}:${round(getAxisValue(profile, axis), 2)}`;

  }).join('|');

  return [

    thread?.id || 'thread',

    thread?.slotKey || 'slot',

    Array.isArray(thread?.nodes) ? thread.nodes.join('-') : '',

    parsed.width ?? '',

    parsed.depth ?? '',

    parsed.lugQuantity ?? '',

    parsed.staveQuantity ?? '',

    parsed.shellThicknessMm ?? '',

    normalizeText(parsed.hoopType),

    normalizeText(parsed.finish),

    normalizeText(parsed.reRings),

    profileSignature,

    normalizeText(sourceBuildRead),

  ].join('|');

};

const getPointBetween = (from, to, amount = 0.5) => {

  return {

    x: from.x + (to.x - from.x) * amount,

    y: from.y + (to.y - from.y) * amount,

  };

};

const movePointToward = (point, target, amount = 0.5) => {

  return getPointBetween(point, target, amount);

};

const rotateAround = (point, center, degrees) => {

  const radians = (degrees * Math.PI) / 180;

  const dx = point.x - center.x;

  const dy = point.y - center.y;

  return {

    x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),

    y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians),

  };

};

const getPerpendicularOffset = (from, to, amount) => {

  const dx = to.x - from.x;

  const dy = to.y - from.y;

  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  return {

    x: (-dy / length) * amount,

    y: (dx / length) * amount,

  };

};

const getAxisPullPoint = ({

  axis,

  profile = {},

  nodePositions = DEFAULT_NODE_POSITIONS,

  center = DEFAULT_CENTER,

  threadKind = 'complex',

}) => {

  const nodePoint = nodePositions[axis] || center;

  const value = getAxisValue(profile, axis);

  const delta = value - 5;

  const movement = Math.abs(delta);

  const kindBasePull = {

    simple: 0.72,

    shaped: 0.58,

    complex: 0.43,

  };

  const basePull = kindBasePull[threadKind] ?? 0.43;

  const outwardPush = clamp(movement / 2.2, 0, 1) * 0.22;

  const inwardPull = delta < 0 ? 0.08 + clamp(movement / 2.2, 0, 1) * 0.1 : 0;

  const pull = clamp(basePull + outwardPush - inwardPull, 0.28, 0.86);

  return movePointToward(center, nodePoint, pull);

};

const getThreadKind = (thread = {}) => {

  const slotKey = String(thread?.slotKey || '').toLowerCase();

  if (slotKey === 'simple') return 'simple';

  if (slotKey === 'shaped') return 'shaped';

  if (slotKey === 'complex') return 'complex';

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes : [];

  if (nodes.length <= 2) return 'simple';

  if (nodes.length === 3) return 'shaped';

  return 'complex';

};

const getThreadIntensity = ({ thread = {}, profile = {} }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes : [];

  const nodeMovement = nodes.length

    ? nodes.reduce((sum, axis) => sum + getAxisMovement(profile, axis), 0) /

      nodes.length

    : 0;

  const scoreComponent = clamp(Number(thread?.score || 0) / 5, 0, 1);

  const movementComponent = clamp(nodeMovement / 1.4, 0, 1);

  const spreadComponent = clamp(getProfileSpread(profile) / 2.4, 0, 1);

  return clamp(

    scoreComponent * 0.35 + movementComponent * 0.45 + spreadComponent * 0.2,

    0.18,

    1

  );

};

const buildSimpleThreadShape = ({

  thread = {},

  profile = {},

  nodePositions = DEFAULT_NODE_POSITIONS,

  center = DEFAULT_CENTER,

  seed,

}) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const [first, second] = nodes;

  if (!first || !second) return [];

  const firstPoint = getAxisPullPoint({

    axis: first,

    profile,

    nodePositions,

    center,

    threadKind: 'simple',

  });

  const secondPoint = getAxisPullPoint({

    axis: second,

    profile,

    nodePositions,

    center,

    threadKind: 'simple',

  });

  const midpoint = getPointBetween(firstPoint, secondPoint, 0.5);

  const curveAmount =

    10 +

    getThreadIntensity({ thread, profile }) * 24 +

    seededSigned(seed, 'simple-curve') * 7;

  const offset = getPerpendicularOffset(firstPoint, secondPoint, curveAmount);

  return [

    {

      type: 'quadratic',

      from: firstPoint,

      control: {

        x: midpoint.x + offset.x,

        y: midpoint.y + offset.y,

      },

      to: secondPoint,

      variant: 'primary',

    },

  ];

};

const buildShapedThreadShape = ({

  thread = {},

  profile = {},

  nodePositions = DEFAULT_NODE_POSITIONS,

  center = DEFAULT_CENTER,

  seed,

}) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  if (nodes.length < 3) {

    return buildSimpleThreadShape({

      thread,

      profile,

      nodePositions,

      center,

      seed,

    });

  }

  const intensity = getThreadIntensity({ thread, profile });

  const innerPull = 0.08 + intensity * 0.1;

  const points = nodes.slice(0, 3).map((axis, index) => {

    const basePoint = getAxisPullPoint({

      axis,

      profile,

      nodePositions,

      center,

      threadKind: 'shaped',

    });

    const rotated = rotateAround(

      basePoint,

      center,

      seededSigned(seed, `shaped-rotate-${axis}-${index}`) * (5 + intensity * 7)

    );

    return movePointToward(rotated, center, innerPull);

  });

  return points.map((point, index) => {

    const next = points[(index + 1) % points.length];

    const midpoint = getPointBetween(point, next, 0.5);

    const bend =

      8 +

      intensity * 18 +

      seededSigned(seed, `shaped-bend-${index}`) * 8;

    const offset = getPerpendicularOffset(point, next, bend);

    return {

      type: 'quadratic',

      from: point,

      control: {

        x: midpoint.x + offset.x,

        y: midpoint.y + offset.y,

      },

      to: next,

      variant: index === 0 ? 'primary' : 'support',

    };

  });

};

const buildComplexThreadShape = ({

  thread = {},

  profile = {},

  sourceBuildRead = '',

  nodePositions = DEFAULT_NODE_POSITIONS,

  center = DEFAULT_CENTER,

  seed,

}) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const safeNodes = nodes.length >= 4 ? nodes.slice(0, 4) : [...nodes];

  while (safeNodes.length < 4) {

    const fallbackAxis = AXES.find((axis) => !safeNodes.includes(axis));

    if (!fallbackAxis) break;

    safeNodes.push(fallbackAxis);

  }

  const parsed = parseSourceBuildRead(sourceBuildRead);

  const intensity = getThreadIntensity({ thread, profile });

  const width = safeNumber(parsed.width, 14);

  const depth = safeNumber(parsed.depth, 5.5);

  const lugs = safeNumber(parsed.lugQuantity, 8);

  const thickness = safeNumber(parsed.shellThicknessMm, 10);

  const depthRatio = clamp((depth - 5) / 3, 0, 1);

  const lugRatio = clamp((lugs - 6) / 4, 0, 1);

  const thicknessRatio = clamp((thickness - 7) / 5, 0, 1);

  const widthRatio = clamp((width - 12) / 2, 0, 1);

  const isDieCast = normalizeText(parsed.hoopType).includes('die');

  const isBlackened = normalizeText(parsed.finish).includes('blackened');

  const isLight = normalizeText(parsed.finish).includes('light');

  const hasReRings = normalizeText(parsed.reRings).includes('re-ring');

  const profileSpread = getProfileSpread(profile);

  const profileMovement = getProfileMovementTotal(profile);

  const innerBase = clamp(

    0.34 -

      depthRatio * 0.05 +

      lugRatio * 0.035 +

      thicknessRatio * 0.04 +

      (isDieCast ? 0.035 : 0) +

      (isBlackened ? 0.045 : 0) -

      (isLight ? 0.025 : 0),

    0.26,

    0.48

  );

  const twist =

    seededSigned(seed, 'complex-twist') *

      (7 + intensity * 11 + profileSpread * 2) +

    (isDieCast ? 5 : 0) -

    (isLight ? 3 : 0) +

    (hasReRings ? -4 : 0);

  const compression =

    1 -

    clamp(

      lugRatio * 0.05 +

        thicknessRatio * 0.06 +

        (isDieCast ? 0.06 : 0) +

        (isBlackened ? 0.05 : 0),

      0,

      0.22

    );

  const bloom =

    clamp(

      depthRatio * 0.12 +

        (isLight ? 0.05 : 0) +

        (!isDieCast ? 0.05 : 0) -

        (isBlackened ? 0.04 : 0),

      -0.04,

      0.2

    );

  const anchorPoints = safeNodes.map((axis, index) => {

    const axisDelta = getAxisDelta(profile, axis);

    const axisMovement = Math.abs(axisDelta);

    const baseNodePoint = nodePositions[axis] || center;

    const basePull =

      innerBase +

      clamp(axisMovement / 2.2, 0, 1) * 0.16 +

      (axisDelta > 0 ? bloom : -0.025);

    const pulled = movePointToward(center, baseNodePoint, clamp(basePull, 0.24, 0.68));

    const rotated = rotateAround(

      pulled,

      center,

      twist + seededSigned(seed, `complex-node-rotate-${axis}-${index}`) * 8

    );

    const centerShiftX =

      seededSigned(seed, `complex-x-${axis}-${index}`) *

      (8 + intensity * 14 + profileMovement * 0.8);

    const centerShiftY =

      seededSigned(seed, `complex-y-${axis}-${index}`) *

      (8 + intensity * 14 + profileMovement * 0.8);

    const compressed = {

      x: center.x + (rotated.x - center.x) * compression + centerShiftX,

      y: center.y + (rotated.y - center.y) * compression + centerShiftY,

    };

    return {

      axis,

      x: clamp(compressed.x, 105, 395),

      y: clamp(compressed.y, 105, 395),

    };

  });

  const diagonalAControlBase = getPointBetween(anchorPoints[0], anchorPoints[2], 0.5);

  const diagonalBControlBase = getPointBetween(anchorPoints[1], anchorPoints[3], 0.5);

  const diagonalAOffset = getPerpendicularOffset(

    anchorPoints[0],

    anchorPoints[2],

    seededSigned(seed, 'complex-diagonal-a') *

      (18 + intensity * 28 + depthRatio * 12)

  );

  const diagonalBOffset = getPerpendicularOffset(

    anchorPoints[1],

    anchorPoints[3],

    seededSigned(seed, 'complex-diagonal-b') *

      (18 + intensity * 28 + widthRatio * 10)

  );

  const outerSegments = anchorPoints.map((point, index) => {

    const next = anchorPoints[(index + 1) % anchorPoints.length];

    const midpoint = getPointBetween(point, next, 0.5);

    const bend =

      seededSigned(seed, `complex-outer-bend-${index}`) *

      (10 + intensity * 18 + profileSpread * 4);

    const offset = getPerpendicularOffset(point, next, bend);

    return {

      type: 'quadratic',

      from: point,

      control: {

        x: midpoint.x + offset.x,

        y: midpoint.y + offset.y,

      },

      to: next,

      variant: index === 0 ? 'primary' : 'support',

    };

  });

  const crossSegments = [

    {

      type: 'quadratic',

      from: anchorPoints[0],

      control: {

        x: diagonalAControlBase.x + diagonalAOffset.x,

        y: diagonalAControlBase.y + diagonalAOffset.y,

      },

      to: anchorPoints[2],

      variant: 'cross',

    },

    {

      type: 'quadratic',

      from: anchorPoints[1],

      control: {

        x: diagonalBControlBase.x + diagonalBOffset.x,

        y: diagonalBControlBase.y + diagonalBOffset.y,

      },

      to: anchorPoints[3],

      variant: 'cross',

    },

  ];

  const internalPulsePointA = {

    x:

      center.x +

      seededSigned(seed, 'complex-pulse-a-x') *

        (18 + depthRatio * 16 + intensity * 16),

    y:

      center.y +

      seededSigned(seed, 'complex-pulse-a-y') *

        (18 + lugRatio * 16 + intensity * 16),

  };

  const internalPulsePointB = {

    x:

      center.x +

      seededSigned(seed, 'complex-pulse-b-x') *

        (18 + thicknessRatio * 16 + intensity * 16),

    y:

      center.y +

      seededSigned(seed, 'complex-pulse-b-y') *

        (18 + widthRatio * 16 + intensity * 16),

  };

  const centerSegments = [

    {

      type: 'quadratic',

      from: anchorPoints[0],

      control: internalPulsePointA,

      to: anchorPoints[3],

      variant: 'inner',

    },

    {

      type: 'quadratic',

      from: anchorPoints[1],

      control: internalPulsePointB,

      to: anchorPoints[2],

      variant: 'inner',

    },

  ];

  return [...outerSegments, ...crossSegments, ...centerSegments];

};

export const buildSvgPathFromSegment = (segment = {}) => {

  if (!segment?.from || !segment?.to) return '';

  if (segment.type === 'quadratic' && segment.control) {

    return [

      `M ${round(segment.from.x, 2)} ${round(segment.from.y, 2)}`,

      `Q ${round(segment.control.x, 2)} ${round(segment.control.y, 2)}`,

      `${round(segment.to.x, 2)} ${round(segment.to.y, 2)}`,

    ].join(' ');

  }

  return [

    `M ${round(segment.from.x, 2)} ${round(segment.from.y, 2)}`,

    `L ${round(segment.to.x, 2)} ${round(segment.to.y, 2)}`,

  ].join(' ');

};

export const buildHeritageThreadShape = ({

  thread = {},

  profile = {},

  sourceBuildRead = '',

  nodePositions = DEFAULT_NODE_POSITIONS,

  center = DEFAULT_CENTER,

} = {}) => {

  const kind = getThreadKind(thread);

  const seed = buildSpecSignature({

    thread,

    profile,

    sourceBuildRead,

  });

  const commonArgs = {

    thread,

    profile,

    sourceBuildRead,

    nodePositions,

    center,

    seed,

  };

  const segments =

    kind === 'simple'

      ? buildSimpleThreadShape(commonArgs)

      : kind === 'shaped'

        ? buildShapedThreadShape(commonArgs)

        : buildComplexThreadShape(commonArgs);

  const intensity = getThreadIntensity({ thread, profile });

  return {

    kind,

    seed,

    intensity,

    movementTotal: round(getProfileMovementTotal(profile), 3),

    spread: round(getProfileSpread(profile), 3),

    segments: segments.map((segment, index) => ({

      ...segment,

      id: `${kind}-${index}-${segment.variant || 'segment'}`,

      path: buildSvgPathFromSegment(segment),

    })),

  };

};

export default buildHeritageThreadShape;