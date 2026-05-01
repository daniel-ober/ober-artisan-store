// src/utils/legacyPrint/voiceThreadGeometry.js

const DEFAULT_NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const DEFAULT_NODE_POSITIONS = {

  attack: { x: 50, y: 16 },

  brightness: { x: 80, y: 31 },

  projection: { x: 86, y: 58 },

  sustain: { x: 66, y: 84 },

  warmth: { x: 34, y: 84 },

  sensitivity: { x: 14, y: 58 },

  control: { x: 20, y: 31 },

};

const AXIS_WEIGHTS = {

  attack: 1.11,

  brightness: 1.07,

  projection: 1.13,

  sustain: 1.09,

  warmth: 1.17,

  sensitivity: 1.19,

  control: 1.15,

};

const CONFIG_WEIGHTS = {

  width: 1.37,

  depth: 1.71,

  lugQuantity: 1.93,

  staveCount: 2.11,

  shellThicknessMm: 2.43,

  hoopType: 2.73,

  finish: 3.17,

  reRings: 3.41,

};

const clamp = (value, min, max) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const toSvgPoint = (point) => ({

  x: Number(point?.x || 0) * 5,

  y: Number(point?.y || 0) * 5,

});

const normalizeNumber = (value, fallback = 0) => {

  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;

};

const normalizeString = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase()

    .replace(/\s+/g, '-');

const getProfileValue = (profile = {}, axis) => {

  return clamp(profile?.[axis] ?? 5, 1, 10);

};

const getAxisDelta = (profile = {}, axis) => {

  return getProfileValue(profile, axis) - 5;

};

const getAxisMovement = (profile = {}, axis) => {

  return clamp(Math.abs(getAxisDelta(profile, axis)) / 2.25, 0, 1);

};

const getPointForNode = (nodeKey, nodePositions = DEFAULT_NODE_POSITIONS) => {

  return toSvgPoint(nodePositions[nodeKey] || DEFAULT_NODE_POSITIONS[nodeKey]);

};

const getCenterPoint = () => ({

  x: 250,

  y: 250,

});

const mixPoints = (a, b, ratio = 0.5) => {

  const safeRatio = clamp(ratio, 0, 1);

  return {

    x: round2(

      Number(a?.x || 0) + (Number(b?.x || 0) - Number(a?.x || 0)) * safeRatio

    ),

    y: round2(

      Number(a?.y || 0) + (Number(b?.y || 0) - Number(a?.y || 0)) * safeRatio

    ),

  };

};

const movePointToward = (point, target, amount = 0) => {

  return mixPoints(point, target, amount);

};

const offsetPoint = (point, dx = 0, dy = 0) => ({

  x: round2(Number(point?.x || 0) + dx),

  y: round2(Number(point?.y || 0) + dy),

});

const rotatePoint = (point, degrees = 0, center = getCenterPoint()) => {

  const radians = (degrees * Math.PI) / 180;

  const cos = Math.cos(radians);

  const sin = Math.sin(radians);

  const translatedX = Number(point?.x || 0) - center.x;

  const translatedY = Number(point?.y || 0) - center.y;

  return {

    x: round2(center.x + translatedX * cos - translatedY * sin),

    y: round2(center.y + translatedX * sin + translatedY * cos),

  };

};

const scalePointFromCenter = (point, scale = 1, center = getCenterPoint()) => {

  return {

    x: round2(center.x + (Number(point?.x || 0) - center.x) * scale),

    y: round2(center.y + (Number(point?.y || 0) - center.y) * scale),

  };

};

const stableHash = (value = '') => {

  const text = String(value || '');

  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {

    hash ^= text.charCodeAt(i);

    hash = Math.imul(hash, 16777619);

  }

  return hash >>> 0;

};

const hashToUnit = (hash, salt = 0) => {

  const mixed = stableHash(`${hash}:${salt}`);

  return mixed / 4294967295;

};

const hashToRange = (hash, salt, min, max) => {

  return min + hashToUnit(hash, salt) * (max - min);

};

const getThreadNodes = (thread = {}) => {

  return Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

};

const getSpecFromThread = (thread = {}) => {

  return thread?.sourceSpec || thread?.currentSpec || thread?.spec || {};

};

const getToneFingerprintInput = ({ thread = {}, profile = {} }) => {

  const spec = getSpecFromThread(thread);

  const nodes = getThreadNodes(thread);

  const profilePart = DEFAULT_NODE_ORDER.map((axis) => {

    const value = getProfileValue(profile, axis);

    const weighted = round2(value * (AXIS_WEIGHTS[axis] || 1));

    return `${axis}:${weighted}`;

  }).join('|');

  const specPart = [

    `width:${normalizeNumber(spec.width ?? spec.size, 14) * CONFIG_WEIGHTS.width}`,

    `depth:${normalizeNumber(spec.depth, 5.5) * CONFIG_WEIGHTS.depth}`,

    `lugs:${normalizeNumber(spec.lugQuantity ?? spec.lugs, 8) * CONFIG_WEIGHTS.lugQuantity}`,

    `staves:${normalizeNumber(spec.staveCount, 16) * CONFIG_WEIGHTS.staveCount}`,

    `thickness:${

      normalizeNumber(spec.shellThicknessMm ?? spec.thicknessMm, 10) *

      CONFIG_WEIGHTS.shellThicknessMm

    }`,

    `hoop:${normalizeString(spec.hoopType)}`,

    `finish:${normalizeString(spec.finish)}`,

    `rerings:${normalizeString(spec.reRings)}`,

  ].join('|');

  const threadPart = [

    `id:${thread?.id || ''}`,

    `slot:${thread?.slotKey || ''}`,

    `title:${thread?.title || ''}`,

    `nodes:${nodes.join(',')}`,

    `specSignature:${thread?.specSignature || ''}`,

  ].join('|');

  return `${threadPart}|${profilePart}|${specPart}`;

};

const getConfigSignature = ({ thread = {}, profile = {} }) => {

  const direct =

    thread?.uniqueBenchShapeKey ||

    thread?.specSignature ||

    thread?.fingerprint ||

    '';

  if (direct) return String(direct);

  return getToneFingerprintInput({ thread, profile });

};

const getRankedAxes = (profile = {}) => {

  return DEFAULT_NODE_ORDER.map((axis) => ({

    axis,

    value: getProfileValue(profile, axis),

    delta: getAxisDelta(profile, axis),

    movement: getAxisMovement(profile, axis),

  })).sort((a, b) => {

    const movementDiff = Math.abs(b.delta) - Math.abs(a.delta);

    if (Math.abs(movementDiff) > 0.001) return movementDiff;

    return DEFAULT_NODE_ORDER.indexOf(a.axis) - DEFAULT_NODE_ORDER.indexOf(b.axis);

  });

};

const getDirectionalScaleForAxis = (profile = {}, axis) => {

  const delta = getAxisDelta(profile, axis);

  if (delta === 0) return 1;

  const movement = getAxisMovement(profile, axis);

  return delta > 0 ? 1 + movement * 0.14 : 1 - movement * 0.11;

};

const getShapeNodes = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

}) => {

  const threadNodes = getThreadNodes(thread);

  if (threadNodes.length >= 2) return threadNodes;

  return getRankedAxes(profile)

    .slice(0, 4)

    .map((item) => item.axis)

    .filter((axis) => nodeOrder.includes(axis));

};

const getThreadBasePoints = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

}) => {

  const nodes = getShapeNodes({ thread, profile, nodeOrder });

  return nodes

    .map((nodeKey) => {

      const point = getPointForNode(nodeKey, nodePositions);

      if (!point) return null;

      const center = getCenterPoint();

      const directionScale = getDirectionalScaleForAxis(profile, nodeKey);

      return scalePointFromCenter(point, directionScale, center);

    })

    .filter(Boolean);

};

const getInnerPoints = (points = [], hash = 0, intensity = 1) => {

  if (!Array.isArray(points) || points.length < 3) return [];

  const center = getCenterPoint();

  return points.map((point, index) => {

    const pull = hashToRange(hash, index + 41, 0.18, 0.42) * intensity;

    const twist = hashToRange(hash, index + 59, -12, 12) * intensity;

    return rotatePoint(movePointToward(point, center, pull), twist, center);

  });

};

const buildSimpleShape = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

}) => {

  const hash = stableHash(getConfigSignature({ thread, profile }));

  const points = getThreadBasePoints({

    thread,

    profile,

    nodeOrder,

    nodePositions,

  });

  if (points.length < 2) {

    return {

      points: [],

      innerPoints: [],

      interiorSegments: [],

      closePath: false,

      rotation: 0,

      scale: 1,

      offsetX: 0,

      offsetY: 0,

      visualHash: hash,

      visualSignature: String(hash),

      signatureHash: String(hash),

    };

  }

  const center = getCenterPoint();

  const threadNodes = getThreadNodes(thread);

  const movementAverage =

    threadNodes.reduce((sum, axis) => sum + getAxisMovement(profile, axis), 0) /

    Math.max(1, threadNodes.length);

  const first = movePointToward(

    points[0],

    center,

    hashToRange(hash, 1, 0.04, 0.18) + movementAverage * 0.04

  );

  const second = movePointToward(

    points[1],

    center,

    hashToRange(hash, 2, 0.04, 0.18) + movementAverage * 0.04

  );

  const mid = mixPoints(first, second, 0.5);

  const bend = offsetPoint(

    movePointToward(mid, center, hashToRange(hash, 3, 0.05, 0.22)),

    hashToRange(hash, 4, -10, 10),

    hashToRange(hash, 5, -10, 10)

  );

  const shouldUseBend = hashToUnit(hash, 6) > 0.52;

  return {

    points: shouldUseBend ? [first, bend, second] : [first, second],

    innerPoints: [],

    interiorSegments: [],

    closePath: false,

    rotation: hashToRange(hash, 7, -2.5, 2.5),

    scale: 1,

    offsetX: hashToRange(hash, 8, -2.5, 2.5),

    offsetY: hashToRange(hash, 9, -2.5, 2.5),

    visualHash: hash,

    visualSignature: String(hash),

    signatureHash: String(hash),

  };

};

const buildShapedThreadShape = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

}) => {

  const hash = stableHash(getConfigSignature({ thread, profile }));

  const basePoints = getThreadBasePoints({

    thread,

    profile,

    nodeOrder,

    nodePositions,

  });

  if (basePoints.length < 2) {

    return buildSimpleShape({ thread, profile, nodeOrder, nodePositions });

  }

  const center = getCenterPoint();

  const shapeNodes = getShapeNodes({ thread, profile, nodeOrder });

  const points = basePoints.map((point, index) => {

    const nodeKey = shapeNodes[index];

    const movement = getAxisMovement(profile, nodeKey);

    const inwardPull = hashToRange(hash, index + 13, 0.06, 0.26) - movement * 0.04;

    const twist = hashToRange(hash, index + 23, -10, 10);

    const nextPoint = movePointToward(point, center, clamp(inwardPull, 0.03, 0.32));

    return rotatePoint(nextPoint, twist, center);

  });

  const hasEnoughForShape = points.length >= 3;

  const innerPoints = hasEnoughForShape ? getInnerPoints(points, hash, 0.45) : [];

  return {

    points,

    innerPoints,

    interiorSegments: [],

    closePath: hasEnoughForShape,

    rotation: hashToRange(hash, 31, -4, 4),

    scale: hashToRange(hash, 37, 0.94, 1.03),

    offsetX: hashToRange(hash, 43, -4, 4),

    offsetY: hashToRange(hash, 47, -4, 4),

    visualHash: hash,

    visualSignature: String(hash),

    signatureHash: String(hash),

  };

};

const getSpecMovementSeed = ({ thread = {}, profile = {} }) => {

  const spec = getSpecFromThread(thread);

  const width = normalizeNumber(spec.width ?? spec.size, 14);

  const depth = normalizeNumber(spec.depth, 5.5);

  const lugs = normalizeNumber(spec.lugQuantity ?? spec.lugs, 8);

  const staves = normalizeNumber(spec.staveCount, 16);

  const thickness = normalizeNumber(spec.shellThicknessMm ?? spec.thicknessMm, 10);

  const hoop = normalizeString(spec.hoopType);

  const finish = normalizeString(spec.finish);

  const reRings = normalizeString(spec.reRings);

  const profileSeed = DEFAULT_NODE_ORDER.reduce((sum, axis, index) => {

    const value = getProfileValue(profile, axis);

    const delta = getAxisDelta(profile, axis);

    return sum + value * (index + 1.7) + delta * delta * (index + 2.3);

  }, 0);

  const specSeed =

    width * CONFIG_WEIGHTS.width +

    depth * CONFIG_WEIGHTS.depth +

    lugs * CONFIG_WEIGHTS.lugQuantity +

    staves * CONFIG_WEIGHTS.staveCount +

    thickness * CONFIG_WEIGHTS.shellThicknessMm +

    stableHash(hoop) * 0.0000017 +

    stableHash(finish) * 0.0000023 +

    stableHash(reRings) * 0.0000029;

  return round2(profileSeed + specSeed);

};

const getComplexNodeSequence = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  hash = 0,

}) => {

  const threadNodes = getThreadNodes(thread);

  const ranked = getRankedAxes(profile).map((item) => item.axis);

  const sequence = [];

  const pushUnique = (axis) => {

    if (!axis || !nodeOrder.includes(axis)) return;

    if (!sequence.includes(axis)) {

      sequence.push(axis);

    }

  };

  threadNodes.forEach(pushUnique);

  ranked.forEach(pushUnique);

  const desiredLength = clamp(4 + Math.floor(hashToRange(hash, 71, 0, 3.99)), 4, 7);

  nodeOrder.forEach((axis) => {

    if (sequence.length < desiredLength) pushUnique(axis);

  });

  const finalSequence = sequence.slice(0, desiredLength);

  if (finalSequence.length < 4) {

    nodeOrder.slice(0, 4).forEach(pushUnique);

  }

  const safeSequence = sequence.slice(0, desiredLength);

  const rotationSteps = Math.floor(hashToRange(hash, 79, 0, safeSequence.length));

  return [...safeSequence.slice(rotationSteps), ...safeSequence.slice(0, rotationSteps)];

};

const sortPointsClockwise = (points = []) => {

  return [...points].sort((a, b) => {

    const angleA = Math.atan2(Number(a.y) - 250, Number(a.x) - 250);

    const angleB = Math.atan2(Number(b.y) - 250, Number(b.x) - 250);

    return angleA - angleB;

  });

};

const getPointDistanceFromCenter = (point = {}) => {

  const x = Number(point.x ?? 250);

  const y = Number(point.y ?? 250);

  return Math.sqrt((x - 250) ** 2 + (y - 250) ** 2);

};

const removeNearDuplicatePoints = (points = [], minDistance = 20) => {

  const cleanPoints = [];

  points.forEach((point) => {

    const alreadyExists = cleanPoints.some((existing) => {

      const dx = Number(existing.x) - Number(point.x);

      const dy = Number(existing.y) - Number(point.y);

      return Math.sqrt(dx * dx + dy * dy) < minDistance;

    });

    if (!alreadyExists) {

      cleanPoints.push(point);

    }

  });

  return cleanPoints;

};

const softenContour = (points = [], amount = 0.11) => {

  if (!Array.isArray(points) || points.length < 3) return points;

  const center = getCenterPoint();

  return points.map((point, index) => {

    const prev = points[(index - 1 + points.length) % points.length];

    const next = points[(index + 1) % points.length];

    const neighborAverage = {

      x: (Number(prev.x) + Number(next.x)) / 2,

      y: (Number(prev.y) + Number(next.y)) / 2,

    };

    const softened = {

      x: Number(point.x) + (neighborAverage.x - Number(point.x)) * amount,

      y: Number(point.y) + (neighborAverage.y - Number(point.y)) * amount,

    };

    return {

      x: round2(softened.x + (Number(point.x) - center.x) * 0.035),

      y: round2(softened.y + (Number(point.y) - center.y) * 0.035),

    };

  });

};

const buildComplexPoints = ({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

  hash = 0,

}) => {

  const center = getCenterPoint();

  const sequence = getComplexNodeSequence({

    thread,

    profile,

    nodeOrder,

    hash,

  });

  const specSeed = getSpecMovementSeed({ thread, profile });

  const candidatePoints = sequence.map((axis, index) => {

    const outerPoint = getPointForNode(axis, nodePositions);

    const axisDelta = getAxisDelta(profile, axis);

    const axisMovement = getAxisMovement(profile, axis);

    const inwardBase = hashToRange(hash, index + 101, 0.1, 0.31);

    const outwardPush = axisDelta > 0 ? axisMovement * 0.075 : -axisMovement * 0.055;

    const tonePull = clamp(inwardBase - outwardPush, 0.04, 0.39);

    const point = movePointToward(outerPoint, center, tonePull);

    const angleJitter = hashToRange(hash, index + 131, -9, 9);

    const seedJitter = Math.sin(specSeed * (index + 1.33)) * 5.5;

    const rotated = rotatePoint(point, angleJitter + seedJitter, center);

    const radialScale =

      0.94 +

      hashToUnit(hash, index + 167) * 0.12 +

      Math.sin(specSeed * (index + 0.7)) * 0.025;

    return scalePointFromCenter(rotated, radialScale, center);

  });

  const dedupedPoints = removeNearDuplicatePoints(candidatePoints, 18);

  if (dedupedPoints.length < 3) {

    return dedupedPoints;

  }

  const sorted = sortPointsClockwise(dedupedPoints);

  const maxPoints = clamp(4 + Math.floor(hashToRange(hash, 211, 0, 2.99)), 4, 6);

  const outerPoints = [...sorted]

    .map((point) => ({

      ...point,

      distance: getPointDistanceFromCenter(point),

    }))

    .sort((a, b) => b.distance - a.distance)

    .slice(0, maxPoints)

    .map(({ distance, ...point }) => point);

  const contour = sortPointsClockwise(outerPoints).map((point, index) => {

    const alternatingPull = index % 2 === 0 ? 1.025 : 0.965;

    const hashPull = hashToRange(hash, index + 229, 0.975, 1.045);

    return scalePointFromCenter(point, alternatingPull * hashPull, center);

  });

  return softenContour(contour, 0.09);

};

const buildComplexInteriorSegments = () => {

  return [];

};

export function buildVoiceThreadFingerprint({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

} = {}) {

  const nodes = getThreadNodes(thread);

  const kind =

    thread?.slotKey === 'complex'

      ? 'complex'

      : nodes.length <= 2

        ? 'simple'

        : 'shaped';

  if (kind === 'complex') {

    return getComplexThreadVisualSignature({

      thread,

      profile,

      nodeOrder,

      nodePositions,

    });

  }

  if (kind === 'simple') {

    return buildSimpleShape({

      thread,

      profile,

      nodeOrder,

      nodePositions,

    });

  }

  return buildShapedThreadShape({

    thread,

    profile,

    nodeOrder,

    nodePositions,

  });

}

export function getComplexThreadVisualSignature({

  thread = {},

  profile = {},

  nodeOrder = DEFAULT_NODE_ORDER,

  nodePositions = DEFAULT_NODE_POSITIONS,

} = {}) {

  const fingerprintInput = getConfigSignature({ thread, profile });

  const profileInput = DEFAULT_NODE_ORDER.map((axis) => {

    const value = getProfileValue(profile, axis);

    const delta = getAxisDelta(profile, axis);

    return `${axis}:${round2(value)}:${round2(delta)}`;

  }).join('|');

  const spec = getSpecFromThread(thread);

  const specInput = [

    `width:${normalizeNumber(spec.width ?? spec.size, 14)}`,

    `depth:${normalizeNumber(spec.depth, 5.5)}`,

    `lugs:${normalizeNumber(spec.lugQuantity ?? spec.lugs, 8)}`,

    `staves:${normalizeNumber(spec.staveCount, 16)}`,

    `thickness:${normalizeNumber(spec.shellThicknessMm ?? spec.thicknessMm, 10)}`,

    `hoop:${normalizeString(spec.hoopType)}`,

    `finish:${normalizeString(spec.finish)}`,

    `rerings:${normalizeString(spec.reRings)}`,

  ].join('|');

  const specSeed = getSpecMovementSeed({ thread, profile });

  const hash = stableHash(

    `${fingerprintInput}|${profileInput}|${specInput}|seed:${specSeed}`

  );

  const points = buildComplexPoints({

    thread,

    profile,

    nodeOrder,

    nodePositions,

    hash,

  });

  const signatureHash = String(hash);

  if (!points.length) {

    return {

      points: [],

      innerPoints: [],

      interiorSegments: [],

      closePath: false,

      rotation: 0,

      scale: 1,

      offsetX: 0,

      offsetY: 0,

      visualHash: hash,

      visualSignature: signatureHash,

      signatureHash,

    };

  }

  const axisSpread = DEFAULT_NODE_ORDER.reduce((sum, axis) => {

    return sum + Math.abs(getAxisDelta(profile, axis));

  }, 0);

  const normalizedSpread = clamp(axisSpread / 8, 0, 1);

  const innerPoints = [];

  const interiorSegments = buildComplexInteriorSegments(points, hash);

  const rotation =

    hashToRange(hash, 307, -4.5, 4.5) + Math.sin(specSeed * 1.13) * 1.8;

  const scale = hashToRange(hash, 331, 0.98, 1.08) + normalizedSpread * 0.035;

  const offsetX =

    hashToRange(hash, 353, -5.5, 5.5) + Math.sin(specSeed * 0.91) * 2.2;

  const offsetY =

    hashToRange(hash, 379, -5.5, 5.5) + Math.cos(specSeed * 0.87) * 2.2;

  return {

    points,

    innerPoints,

    interiorSegments,

    closePath: true,

    rotation: round2(rotation),

    scale: round2(clamp(scale, 0.95, 1.12)),

    offsetX: round2(offsetX),

    offsetY: round2(offsetY),

    visualHash: hash,

    visualSignature: signatureHash,

    signatureHash,

  };

}

export default buildVoiceThreadFingerprint;