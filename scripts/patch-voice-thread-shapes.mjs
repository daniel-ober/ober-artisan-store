
import fs from 'fs';

const file = 'src/components/VoiceThreadMap.js';

let src = fs.readFileSync(file, 'utf8');

const replaceBlock = (label, oldText, newText) => {

  if (!src.includes(oldText)) {

    console.error(`Missing expected block: ${label}`);

    process.exit(1);

  }

  src = src.replace(oldText, newText);

};

replaceBlock(

  'getStableShapedShape',

`const getStableShapedShape = ({ thread, profile }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const fallbackNodes =

    nodes.length >= 3 ? nodes : [...nodes, 'control', 'sustain'].slice(0, 3);

  const basePoints = getDefaultRelationshipPoints(fallbackNodes).slice(0, 3);

  const movementAverage = getProfileMovementAverage(profile);

  const points = basePoints.map((point, index) => {

    const nodeKey = fallbackNodes[index];

    const signedMovement = getSignedAxisMovement(profile, nodeKey);

    const slotRadius =

      index === 1

        ? SLOT_VISUAL_TUNING.shaped.activeRadius

        : SLOT_VISUAL_TUNING.shaped.baseRadius;

    const radius = clamp(

      slotRadius + signedMovement * SLOT_VISUAL_TUNING.shaped.movementPull,

      SLOT_VISUAL_TUNING.shaped.inactiveRadius,

      1.02

    );

    return pullPointFromCenter(point, radius);

  });

  const centroid = getCentroid(points);

  const innerPoint = mixPoints(SVG_CENTER, centroid, 0.42 + movementAverage * 0.12);

  const shapedPoints = removeNearDuplicatePoints([...points, innerPoint], 10);

  return {

    points: shapedPoints,

    innerPoints: [],

    interiorSegments: [],

    closePath: shapedPoints.length > 2,

    curvePath: '',

    rotation: 0,

    scale: clamp(

      1 + movementAverage * 0.025,

      SLOT_VISUAL_TUNING.shaped.scaleMin,

      SLOT_VISUAL_TUNING.shaped.scaleMax

    ),

    offsetX: 0,

    offsetY: 0,

  };

};`,

`const getStableShapedShape = ({ thread, profile }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const fallbackNodes =

    nodes.length >= 3 ? nodes.slice(0, 3) : [...nodes, 'control', 'sustain', 'projection'].slice(0, 3);

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const profileDirectionNodes = getProfileDirectionNodes(profile);

  const directionPoint = getPointForNode(profileDirectionNodes[0]) || SVG_CENTER;

  const basePoints = getDefaultRelationshipPoints(fallbackNodes).slice(0, 3);

  const points = basePoints.map((point, index) => {

    const nodeKey = fallbackNodes[index];

    const signedMovement = getSignedAxisMovement(profile, nodeKey);

    const nodeMovement = getAxisMovement(profile, nodeKey);

    const radius = clamp(

      SLOT_VISUAL_TUNING.shaped.baseRadius +

        signedMovement * 0.11 +

        nodeMovement * 0.045 +

        movementAverage * 0.035,

      0.74,

      1.01

    );

    const pulledPoint = pullPointFromCenter(point, radius);

    const directionalPull = mixPoints(

      pulledPoint,

      directionPoint,

      clamp(0.035 + movementAverage * 0.035, 0.035, 0.095)

    );

    return offsetPoint(

      directionalPull,

      depthLean * (index === 1 ? 4 : 2),

      Math.abs(depthLean) * (index === 2 ? 3 : 1.5)

    );

  });

  const trianglePoints = sortPointsClockwise(removeNearDuplicatePoints(points, 8)).slice(0, 3);

  return {

    points: trianglePoints,

    innerPoints: [],

    interiorSegments: [],

    closePath: trianglePoints.length === 3,

    curvePath: '',

    rotation: depthLean * 1.2,

    scale: clamp(

      1 + movementAverage * 0.025,

      SLOT_VISUAL_TUNING.shaped.scaleMin,

      SLOT_VISUAL_TUNING.shaped.scaleMax

    ),

    offsetX: depthLean * 1.2,

    offsetY: Math.abs(depthLean) * 0.8,

  };

};`

);

replaceBlock(

  'buildComplexContourPoints',

`const buildComplexContourPoints = ({ thread, profile, rawPoints = [] }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const nodePoints = getDefaultRelationshipPoints(nodes);

  const directionNodes = getProfileDirectionNodes(profile);

  const directionPoints = directionNodes

    .map((nodeKey) => getPointForNode(nodeKey))

    .filter(Boolean);

  const sourcePoints = removeNearDuplicatePoints(

    [

      ...nodePoints,

      ...directionPoints,

      ...normalizeFingerprintPoints(rawPoints),

    ],

    13

  );

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const stablePoints = sourcePoints.map((point) => {

    const angleBias = {

      x: depthLean * 8,

      y: Math.abs(depthLean) * 5,

    };

    const radius = clamp(

      SLOT_VISUAL_TUNING.complex.baseRadius +

        movementAverage * SLOT_VISUAL_TUNING.complex.movementPull,

      SLOT_VISUAL_TUNING.complex.innerRadius,

      SLOT_VISUAL_TUNING.complex.activeRadius

    );

    return offsetPoint(pullPointFromCenter(point, radius), angleBias.x, angleBias.y);

  });

  const cleanPoints = removeNearDuplicatePoints(stablePoints, 15);

  if (cleanPoints.length < 3) {

    return nodePoints.length >= 3

      ? nodePoints.map((point) => pullPointFromCenter(point, 0.9))

      : [

          pullPointFromCenter(getPointForNode('warmth'), 0.9),

          pullPointFromCenter(getPointForNode('sustain'), 0.9),

          pullPointFromCenter(getPointForNode('projection'), 0.9),

          pullPointFromCenter(getPointForNode('control'), 0.78),

        ].filter(Boolean);

  }

  return softenContour(sortPointsClockwise(cleanPoints).slice(0, 7), 0.06);

};`,

`const buildComplexContourPoints = ({ thread, profile, rawPoints = [] }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const sourceNodeKeys = [

    ...nodes,

    ...getProfileDirectionNodes(profile),

    'attack',

    'brightness',

    'projection',

    'sustain',

    'warmth',

    'sensitivity',

    'control',

  ].filter(Boolean);

  const sourcePoints = removeNearDuplicatePoints(

    [

      ...sourceNodeKeys.map((nodeKey) => getPointForNode(nodeKey)).filter(Boolean),

      ...normalizeFingerprintPoints(rawPoints),

    ],

    12

  );

  const sortedPoints = sortPointsClockwise(sourcePoints);

  const desiredPointCount = clamp(

    Math.round(4 + movementAverage * 3),

    4,

    7

  );

  const selectedPoints = [];

  sortedPoints.forEach((point, index) => {

    if (selectedPoints.length >= desiredPointCount) return;

    const step = Math.max(1, Math.floor(sortedPoints.length / desiredPointCount));

    if (index % step === 0) {

      selectedPoints.push(point);

    }

  });

  while (selectedPoints.length < desiredPointCount) {

    const fallbackNode = THREAD_NODE_ORDER[selectedPoints.length % THREAD_NODE_ORDER.length];

    const fallbackPoint = getPointForNode(fallbackNode);

    if (fallbackPoint) {

      selectedPoints.push(fallbackPoint);

    } else {

      break;

    }

  }

  const safePoints = removeNearDuplicatePoints(selectedPoints, 16).slice(0, desiredPointCount);

  const organicPoints = safePoints.map((point, index) => {

    const nodeKey = sourceNodeKeys[index % sourceNodeKeys.length];

    const signedMovement = getSignedAxisMovement(profile, nodeKey);

    const nodeMovement = getAxisMovement(profile, nodeKey);

    const radius = clamp(

      0.58 + movementAverage * 0.18 + nodeMovement * 0.08 + signedMovement * 0.05,

      0.52,

      0.86

    );

    const inwardPoint = pullPointFromCenter(point, radius);

    const angle = (Math.PI * 2 * index) / Math.max(1, safePoints.length);

    const organicOffsetX = Math.cos(angle) * (5 + movementAverage * 8) + depthLean * 6;

    const organicOffsetY = Math.sin(angle) * (4 + movementAverage * 6) + Math.abs(depthLean) * 4;

    return offsetPoint(inwardPoint, organicOffsetX, organicOffsetY);

  });

  const cleanPoints = removeNearDuplicatePoints(organicPoints, 14);

  if (cleanPoints.length < 4) {

    return [

      offsetPoint(pullPointFromCenter(getPointForNode('warmth'), 0.68), depthLean * 5, 2),

      offsetPoint(pullPointFromCenter(getPointForNode('sustain'), 0.7), depthLean * 4, 7),

      offsetPoint(pullPointFromCenter(getPointForNode('projection'), 0.66), depthLean * 7, 2),

      offsetPoint(pullPointFromCenter(getPointForNode('control'), 0.6), depthLean * 2, -5),

    ].filter(Boolean);

  }

  return softenContour(sortPointsClockwise(cleanPoints).slice(0, 7), 0.035);

};`

);

replaceBlock(

  'normalizeShape shaped branch',

`  if (kind === 'shaped') {

    const shapedPoints = removeNearDuplicatePoints(points, 10);

    return {

      ...fallback,

      ...shape,

      points: shapedPoints,

      innerPoints: [],

      interiorSegments: [],

      closePath: shapedPoints.length > 2,

      curvePath: '',

      scale: clamp(Number(shape?.scale || fallback.scale || 1), 0.98, 1.05),

    };

  }`,

`  if (kind === 'shaped') {

    const shapedPoints = removeNearDuplicatePoints(fallback.points, 8).slice(0, 3);

    return {

      ...fallback,

      ...shape,

      points: shapedPoints,

      innerPoints: [],

      interiorSegments: [],

      closePath: shapedPoints.length === 3,

      curvePath: '',

      scale: clamp(Number(shape?.scale || fallback.scale || 1), 0.98, 1.05),

    };

  }`

);

replaceBlock(

  'normalizeShape complex branch',

`  const complexPoints = buildComplexContourPoints({

    thread,

    profile,

    rawPoints: points,

  });

  return {

    ...fallback,

    ...shape,

    points: complexPoints,

    innerPoints: [],

    interiorSegments: [],

    closePath: complexPoints.length > 2,

    curvePath: '',

    scale: clamp(Number(shape?.scale || fallback.scale || 1.04), 1.02, 1.1),

  };`,

`  const complexPoints = buildComplexContourPoints({

    thread,

    profile,

    rawPoints: points,

  });

  return {

    ...fallback,

    ...shape,

    points: complexPoints,

    innerPoints: [],

    interiorSegments: [],

    closePath: complexPoints.length >= 4,

    curvePath: '',

    scale: clamp(Number(shape?.scale || fallback.scale || 1.04), 1.02, 1.1),

  };`

);

fs.writeFileSync(file, src);

console.log('Patched VoiceThreadMap.js: shaped reads are closed triangles; complex reads are closed organic polygons.');

