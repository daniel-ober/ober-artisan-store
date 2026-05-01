
import fs from 'fs';

const file = 'src/components/VoiceThreadMap.js';

let src = fs.readFileSync(file, 'utf8');

const replaceBlock = ({ label, start, end, replacement }) => {

  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);

  if (!pattern.test(src)) {

    console.error(`Could not find ${label}. No changes written.`);

    process.exit(1);

  }

  src = src.replace(pattern, replacement);

};

const curvedPathHelper = `

const getCurvedClosedPath = ({

  points = [],

  profile = {},

  kind = 'complex',

  intensity = 1,

}) => {

  const cleanPoints = points.filter(isFinitePoint);

  if (cleanPoints.length < 3) return getShapePath(cleanPoints, true);

  const depthLean = getDepthLeanFromProfile(profile);

  const movementAverage = getProfileMovementAverage(profile);

  const directionNodes = getProfileDirectionNodes(profile);

  const primaryDirectionPoint =

    getPointForNode(directionNodes[0]) ||

    getPointForNode(directionNodes[1]) ||

    SVG_CENTER;

  const curveBase =

    kind === 'shaped'

      ? clamp(0.1 + movementAverage * 0.13, 0.09, 0.24)

      : clamp(0.18 + movementAverage * 0.18, 0.16, 0.38);

  const directionalPull =

    kind === 'shaped'

      ? clamp(0.08 + movementAverage * 0.08, 0.08, 0.18)

      : clamp(0.12 + movementAverage * 0.12, 0.12, 0.28);

  const wobbleBase =

    kind === 'shaped'

      ? clamp(5 + movementAverage * 6, 5, 12)

      : clamp(10 + movementAverage * 16, 10, 28);

  const first = cleanPoints[0];

  const segments = [

    \`M \${first.x.toFixed(2)} \${first.y.toFixed(2)}\`,

  ];

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

    const alternating = index % 2 === 0 ? 1 : -1;

    const organicBend = {

      x:

        normal.x * wobbleBase * alternating * intensity +

        depthLean * wobbleBase * 0.42,

      y:

        normal.y * wobbleBase * alternating * intensity +

        Math.abs(depthLean) * wobbleBase * 0.32,

    };

    const directionBent = mixPoints(

      midpoint,

      primaryDirectionPoint,

      directionalPull * intensity

    );

    const control = mixPoints(

      offsetPoint(directionBent, organicBend.x, organicBend.y),

      SVG_CENTER,

      kind === 'shaped' ? curveBase * 0.2 : curveBase * 0.34

    );

    segments.push(

      \`Q \${control.x.toFixed(2)} \${control.y.toFixed(2)} \${next.x.toFixed(

        2

      )} \${next.y.toFixed(2)}\`

    );

  });

  return \`\${segments.join(' ')} Z\`;

};

`;

if (!src.includes('const getCurvedClosedPath = ({')) {

  src = src.replace(

    /const getShapePath = \(points = \[\], close = true\) => \{[\s\S]*?\n\};\n\n/,

    (match) => `${match}${curvedPathHelper}`

  );

}

replaceBlock({

  label: 'getStableShapedShape',

  start: 'const getStableShapedShape = \\(\\{ thread, profile \\}\\) => \\{',

  end: '\\n\\};\\n\\nconst getDepthLeanFromProfile',

  replacement: `const getStableShapedShape = ({ thread, profile }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const fallbackNodes =

    nodes.length >= 3

      ? nodes.slice(0, 3)

      : [...nodes, 'control', 'sustain', 'projection'].slice(0, 3);

  const trianglePoints = getDefaultRelationshipPoints(fallbackNodes).slice(0, 3);

  return {

    points: trianglePoints,

    innerPoints: [],

    interiorSegments: [],

    closePath: trianglePoints.length === 3,

    curvePath: '',

    rotation: 0,

    scale: 1,

    offsetX: 0,

    offsetY: 0,

  };

};

const getDepthLeanFromProfile`,

});

replaceBlock({

  label: 'buildComplexContourPoints',

  start: 'const buildComplexContourPoints = \\(\\{ thread, profile, rawPoints = \\[\\] \\}\\) => \\{',

  end: '\\n\\};\\n\\nconst getStableComplexShape',

  replacement: `const buildComplexContourPoints = ({ thread, profile, rawPoints = [] }) => {

  const nodes = Array.isArray(thread?.nodes) ? thread.nodes.filter(Boolean) : [];

  const movementAverage = getProfileMovementAverage(profile);

  const depthLean = getDepthLeanFromProfile(profile);

  const directionNodes = getProfileDirectionNodes(profile);

  const desiredPointCount = clamp(Math.round(4 + movementAverage * 3), 4, 7);

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

  const candidatePoints = removeNearDuplicatePoints(

    [

      ...weightedNodeKeys.map((nodeKey) => getPointForNode(nodeKey)).filter(Boolean),

      ...normalizeFingerprintPoints(rawPoints),

    ],

    10

  );

  const sortedCandidates = sortPointsClockwise(candidatePoints);

  const selectedPoints = [];

  if (sortedCandidates.length) {

    const step = sortedCandidates.length / desiredPointCount;

    for (let i = 0; i < desiredPointCount; i += 1) {

      const point = sortedCandidates[Math.floor(i * step) % sortedCandidates.length];

      if (point) {

        selectedPoints.push(point);

      }

    }

  }

  while (selectedPoints.length < desiredPointCount) {

    const fallbackNode = THREAD_NODE_ORDER[selectedPoints.length % THREAD_NODE_ORDER.length];

    const fallbackPoint = getPointForNode(fallbackNode);

    if (!fallbackPoint) break;

    selectedPoints.push(fallbackPoint);

  }

  const safePoints = removeNearDuplicatePoints(selectedPoints, 13).slice(

    0,

    desiredPointCount

  );

  const organicPoints = safePoints.map((point, index) => {

    const nodeKey = weightedNodeKeys[index % weightedNodeKeys.length];

    const signedMovement = getSignedAxisMovement(profile, nodeKey);

    const nodeMovement = getAxisMovement(profile, nodeKey);

    const radius = clamp(

      0.5 + movementAverage * 0.16 + nodeMovement * 0.08 + signedMovement * 0.035,

      0.46,

      0.76

    );

    const inwardPoint = pullPointFromCenter(point, radius);

    const angle = (Math.PI * 2 * index) / Math.max(1, safePoints.length);

    const organicOffsetX =

      Math.cos(angle) * (8 + movementAverage * 12) +

      depthLean * (6 + index * 0.8);

    const organicOffsetY =

      Math.sin(angle) * (7 + movementAverage * 10) +

      Math.abs(depthLean) * (4 + index * 0.55);

    return offsetPoint(inwardPoint, organicOffsetX, organicOffsetY);

  });

  const cleanPoints = removeNearDuplicatePoints(organicPoints, 12);

  if (cleanPoints.length < 4) {

    return [

      offsetPoint(pullPointFromCenter(getPointForNode('warmth'), 0.62), depthLean * 5, 3),

      offsetPoint(pullPointFromCenter(getPointForNode('sustain'), 0.66), depthLean * 4, 9),

      offsetPoint(pullPointFromCenter(getPointForNode('projection'), 0.63), depthLean * 7, 2),

      offsetPoint(pullPointFromCenter(getPointForNode('control'), 0.56), depthLean * 2, -6),

    ].filter(Boolean);

  }

  return softenContour(sortPointsClockwise(cleanPoints).slice(0, 7), 0.08);

};

const getStableComplexShape`,

});

replaceBlock({

  label: 'normalizeShape shaped branch',

  start: '  if \\(kind === \\'shaped\\'\\) \\{',

  end: '\\n  \\}\\n\\n  const complexPoints = buildComplexContourPoints',

  replacement: `  if (kind === 'shaped') {

    const shapedPoints = removeNearDuplicatePoints(fallback.points, 8).slice(0, 3);

    return {

      ...fallback,

      ...shape,

      points: shapedPoints,

      innerPoints: [],

      interiorSegments: [],

      closePath: shapedPoints.length === 3,

      curvePath: '',

      rotation: 0,

      scale: 1,

      offsetX: 0,

      offsetY: 0,

    };

  }

  const complexPoints = buildComplexContourPoints`,

});

replaceBlock({

  label: 'shapePath memo',

  start: '  const shapePath = useMemo\\(\\(\\) => \\{',

  end: '\\n  \\}, \\[shape, threadKind\\]\\);',

  replacement: `  const shapePath = useMemo(() => {

    if (threadKind === 'simple') {

      return shape.curvePath || getShapePath(shape.points, false);

    }

    if (threadKind === 'shaped') {

      return getCurvedClosedPath({

        points: shape.points,

        profile,

        kind: 'shaped',

        intensity: compact ? 0.82 : 1,

      });

    }

    if (threadKind === 'complex') {

      return getCurvedClosedPath({

        points: shape.points,

        profile,

        kind: 'complex',

        intensity: compact ? 0.94 : 1.08,

      });

    }

    return getShapePath(shape.points, shape.closePath);

  }, [shape, threadKind, profile, compact]);`,

});

fs.writeFileSync(file, src);

console.log('Patched VoiceThreadMap.js with final curved Feel triangles and organic curved Bench polygons.');

