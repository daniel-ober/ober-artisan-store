
import fs from 'fs';

const file = 'src/components/VoiceThreadMap.js';

let src = fs.readFileSync(file, 'utf8');

const insertAfter = `const getSimpleCurvePath = (points = [], controlPoint = null) => {

  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 2) return '';

  const start = cleanPoints[0];

  const end = cleanPoints[cleanPoints.length - 1];

  const midpoint = mixPoints(start, end, 0.5);

  const control = isFinitePoint(controlPoint)

    ? controlPoint

    : mixPoints(midpoint, SVG_CENTER, 0.32);

  return \`M \${start.x.toFixed(2)} \${start.y.toFixed(2)} Q \${control.x.toFixed(

    2

  )} \${control.y.toFixed(2)} \${end.x.toFixed(2)} \${end.y.toFixed(2)}\`;

};

`;

const curvedHelpers = `const getCurvedClosedShapePath = (points = [], options = {}) => {

  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 3) return getShapePath(cleanPoints, true);

  const {

    profile = {},

    thread = {},

    curveStrength = 0.18,

    organicPull = 0.12,

    keepCorners = true,

  } = options;

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const threadNodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const directionNodes = getProfileDirectionNodes(profile);

  const pullNode = directionNodes.find((nodeKey) => !threadNodes.includes(nodeKey)) || directionNodes[0];

  const pullPoint = getPointForNode(pullNode) || SVG_CENTER;

  const centroid = getCentroid(cleanPoints);

  const parts = [\`M \${cleanPoints[0].x.toFixed(2)} \${cleanPoints[0].y.toFixed(2)}\`];

  cleanPoints.forEach((point, index) => {

    const next = cleanPoints[(index + 1) % cleanPoints.length];

    const midpoint = mixPoints(point, next, 0.5);

    const edgeDx = Number(next.x) - Number(point.x);

    const edgeDy = Number(next.y) - Number(point.y);

    const edgeLength = Math.max(1, Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy));

    const normal = {

      x: -edgeDy / edgeLength,

      y: edgeDx / edgeLength,

    };

    const outward = mixPoints(centroid, midpoint, 1.18 + organicPull + movementAverage * 0.06);

    const tonalPull = mixPoints(midpoint, pullPoint, 0.08 + movementAverage * 0.04);

    const directionBias = {

      x: depthLean * 5,

      y: Math.abs(depthLean) * 4,

    };

    const alternatingBias = index % 2 === 0 ? 1 : -1;

    const control = {

      x:

        midpoint.x +

        (outward.x - midpoint.x) * curveStrength +

        (tonalPull.x - midpoint.x) * 0.3 +

        normal.x * alternatingBias * movementAverage * 7 +

        directionBias.x,

      y:

        midpoint.y +

        (outward.y - midpoint.y) * curveStrength +

        (tonalPull.y - midpoint.y) * 0.3 +

        normal.y * alternatingBias * movementAverage * 7 +

        directionBias.y,

    };

    if (keepCorners) {

      parts.push(

        \`Q \${control.x.toFixed(2)} \${control.y.toFixed(2)} \${next.x.toFixed(2)} \${next.y.toFixed(2)}\`

      );

    } else {

      const softEnd = mixPoints(next, centroid, 0.02);

      parts.push(

        \`Q \${control.x.toFixed(2)} \${control.y.toFixed(2)} \${softEnd.x.toFixed(2)} \${softEnd.y.toFixed(2)}\`

      );

    }

  });

  return \`\${parts.join(' ')} Z\`;

};

`;

if (!src.includes(curvedHelpers)) {

  if (!src.includes(insertAfter)) {

    console.error('Could not find getSimpleCurvePath insertion point.');

    process.exit(1);

  }

  src = src.replace(insertAfter, insertAfter + curvedHelpers);

}

const oldShapedFunction = `const getStableShapedShape = ({ thread, profile }) => {

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

};

`;

const newShapedFunction = `const getStableShapedShape = ({ thread, profile }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const fallbackNodes =

    nodes.length >= 3 ? nodes.slice(0, 3) : [...nodes, 'control', 'sustain'].slice(0, 3);

  const basePoints = getDefaultRelationshipPoints(fallbackNodes).slice(0, 3);

  const movementAverage = getProfileMovementAverage(profile);

  const points = basePoints.map((point) => {

    return pullPointFromCenter(point, 1);

  });

  return {

    points,

    innerPoints: [],

    interiorSegments: [],

    closePath: true,

    curvePath: getCurvedClosedShapePath(points, {

      profile,

      thread,

      curveStrength: 0.13 + movementAverage * 0.07,

      organicPull: 0.04,

      keepCorners: true,

    }),

    rotation: 0,

    scale: clamp(

      1 + movementAverage * 0.018,

      SLOT_VISUAL_TUNING.shaped.scaleMin,

      SLOT_VISUAL_TUNING.shaped.scaleMax

    ),

    offsetX: 0,

    offsetY: 0,

  };

};

`;

if (!src.includes(oldShapedFunction)) {

  console.error('Could not find exact getStableShapedShape block.');

  process.exit(1);

}

src = src.replace(oldShapedFunction, newShapedFunction);

const oldComplexReturn = `  return {

    ...complexShape,

    points,

    innerPoints: [],

    interiorSegments: [],

    closePath: points.length > 2,

    curvePath: '',

    rotation: depthLean * 2.2,

    scale: clamp(

      1.02 + movementAverage * 0.06,

      SLOT_VISUAL_TUNING.complex.scaleMin,

      SLOT_VISUAL_TUNING.complex.scaleMax

    ),

    offsetX: depthLean * 2.5,

    offsetY: Math.abs(depthLean) * 1.5,

  };

};

`;

const newComplexReturn = `  return {

    ...complexShape,

    points,

    innerPoints: [],

    interiorSegments: [],

    closePath: points.length > 2,

    curvePath: getCurvedClosedShapePath(points, {

      profile,

      thread,

      curveStrength: 0.24 + movementAverage * 0.12,

      organicPull: 0.16,

      keepCorners: false,

    }),

    rotation: depthLean * 2.2,

    scale: clamp(

      1.02 + movementAverage * 0.06,

      SLOT_VISUAL_TUNING.complex.scaleMin,

      SLOT_VISUAL_TUNING.complex.scaleMax

    ),

    offsetX: depthLean * 2.5,

    offsetY: Math.abs(depthLean) * 1.5,

  };

};

`;

if (!src.includes(oldComplexReturn)) {

  console.error('Could not find exact getStableComplexShape return block.');

  process.exit(1);

}

src = src.replace(oldComplexReturn, newComplexReturn);

const oldNormalizeShaped = `  if (kind === 'shaped') {

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

  }

`;

const newNormalizeShaped = `  if (kind === 'shaped') {

    const shapedPoints = removeNearDuplicatePoints(points.slice(0, 3), 10);

    return {

      ...fallback,

      ...shape,

      points: shapedPoints,

      innerPoints: [],

      interiorSegments: [],

      closePath: shapedPoints.length > 2,

      curvePath: getCurvedClosedShapePath(shapedPoints, {

        profile,

        thread,

        curveStrength: 0.16 + getProfileMovementAverage(profile) * 0.06,

        organicPull: 0.04,

        keepCorners: true,

      }),

      scale: clamp(Number(shape?.scale || fallback.scale || 1), 0.98, 1.05),

    };

  }

`;

if (!src.includes(oldNormalizeShaped)) {

  console.error('Could not find exact normalizeShape shaped block.');

  process.exit(1);

}

src = src.replace(oldNormalizeShaped, newNormalizeShaped);

const oldNormalizeComplex = `  const complexPoints = buildComplexContourPoints({

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

  };

};

`;

const newNormalizeComplex = `  const complexPoints = buildComplexContourPoints({

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

    curvePath: getCurvedClosedShapePath(complexPoints, {

      profile,

      thread,

      curveStrength: 0.24 + getProfileMovementAverage(profile) * 0.12,

      organicPull: 0.16,

      keepCorners: false,

    }),

    scale: clamp(Number(shape?.scale || fallback.scale || 1.04), 1.02, 1.1),

  };

};

`;

if (!src.includes(oldNormalizeComplex)) {

  console.error('Could not find exact normalizeShape complex block.');

  process.exit(1);

}

src = src.replace(oldNormalizeComplex, newNormalizeComplex);

const oldShapePathMemo = `  const shapePath = useMemo(() => {

    if (threadKind === 'simple') {

      return shape.curvePath || getShapePath(shape.points, false);

    }

    return getShapePath(shape.points, shape.closePath);

  }, [shape, threadKind]);

`;

const newShapePathMemo = `  const shapePath = useMemo(() => {

    if (shape.curvePath) {

      return shape.curvePath;

    }

    if (threadKind === 'simple') {

      return getShapePath(shape.points, false);

    }

    return getShapePath(shape.points, shape.closePath);

  }, [shape, threadKind]);

`;

if (!src.includes(oldShapePathMemo)) {

  console.error('Could not find exact shapePath memo block.');

  process.exit(1);

}

src = src.replace(oldShapePathMemo, newShapePathMemo);

fs.writeFileSync(file, src);

console.log('Patched VoiceThreadMap.js with curved connected Feel triangles and organic curved Bench polygons.');

