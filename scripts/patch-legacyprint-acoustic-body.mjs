import fs from 'fs';

const jsPath = 'src/components/VoiceThreadMap.js';

const cssPath = 'src/components/VoiceThreadMap.css';

let js = fs.readFileSync(jsPath, 'utf8');

let css = fs.readFileSync(cssPath, 'utf8');

const acousticBodyHelpers = `const getLegacyPrintAcousticBodyItems = ({

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

    const neighborMix =

      type === 'pre'

        ? 0.22

        : type === 'post'

          ? 0.78

          : 0.5;

    const prevPoint = getPointForNode(rule.pre) || basePoint;

    const nextPoint = getPointForNode(rule.post) || basePoint;

    const blendedAnchor =

      type === 'main'

        ? basePoint

        : mixPoints(prevPoint, nextPoint, neighborMix);

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

        ? getAxisMovement(profile, 'sensitivity') * getSeededSignedValue(seed, \`sensitivity-ripple-\${index}\`) * 10

        : 0;

    const sharp =

      rule.sharpness *

      movement *

      (type === 'main' ? 18 : 9) *

      (delta >= 0 ? 1 : -0.35);

    const xJitter = getSeededSignedValue(seed, \`\${nodeKey}-x-\${type}-\${index}\`) * (2 + movementAverage * 4);

    const yJitter = getSeededSignedValue(seed, \`\${nodeKey}-y-\${type}-\${index}\`) * (2 + movementAverage * 4);

    const point = keepPointInsideThreadFrame(

      {

        x:

          pulled.x +

          rule.xBias * movement +

          sharp +

          shimmer +

          xJitter +

          depthLean * 5,

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

      pointKey: \`legacyprint-acoustic-\${nodeKey}-\${type}\`,

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

          Math.abs(item.point.x - point.x) < 0.001 &&

          Math.abs(item.point.y - point.y) < 0.001

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

      nodeKey === 'attack' ||

      nodeKey === 'brightness' ||

      nodeKey === 'projection';

    const shouldRound =

      nodeKey === 'warmth' ||

      nodeKey === 'sustain' ||

      controlValue > 5.6;

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

`;

const acousticPathHelper = `const getLegacyPrintAcousticBodyPath = (shapeItems = []) => {

  const cleanItems = shapeItems.filter(

    (item) => item?.point && isFinitePoint(item.point)

  );

  if (cleanItems.length < 3) {

    return getOpenPath(cleanItems.map((item) => item.point));

  }

  const points = cleanItems.map((item) => item.point);

  const first = points[0];

  const segments = [\`M \${first.x.toFixed(2)} \${first.y.toFixed(2)}\`];

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

      \`C \${controlA.x.toFixed(2)} \${controlA.y.toFixed(

        2

      )} \${controlB.x.toFixed(2)} \${controlB.y.toFixed(

        2

      )} \${next.x.toFixed(2)} \${next.y.toFixed(2)}\`

    );

  });

  return \`\${segments.join(' ')} Z\`;

};

`;

// Remove legacy pill/key header render block if present.

js = js.replace(

  /\n\s*\{resolvedReadVariant === 'legacyprint' && !compact && \(\n\s*<div className="heritage-legacyprint-read-key" aria-hidden="true">[\s\S]*?\n\s*<\/div>\n\s*\)\}/,

  ''

);

// Replace the bad fingerprint function with direct acoustic body function.

js = js.replace(

  /const getLegacyPrintFingerprintItems = \(\{[\s\S]*?\n\};\n\nconst getThreadShapePoints = \(\{/,

  `${acousticBodyHelpers}${acousticPathHelper}const getThreadShapePoints = ({`

);

// If previous patch renamed/changed structure and function replacement failed, inject helpers before getThreadShapePoints.

if (!js.includes('const getLegacyPrintAcousticBodyItems = ({')) {

  js = js.replace(

    /const getThreadShapePoints = \(\{/,

    `${acousticBodyHelpers}${acousticPathHelper}const getThreadShapePoints = ({`

  );

}

// Make legacyprint use the new body model.

js = js.replace(

  /if \(resolvedReadVariant === 'legacyprint'\) \{\s*return getLegacyPrintFingerprintItems\(\{\s*activeThread,\s*profile,\s*input,\s*currentSpec,\s*\}\);\s*\}/,

  `if (resolvedReadVariant === 'legacyprint') {

    return getLegacyPrintAcousticBodyItems({

      activeThread,

      profile,

      input,

      currentSpec,

    });

  }`

);

// Make legacyprint path use acoustic body path.

js = js.replace(

  /if \(resolvedReadVariant === 'legacyprint'\) \{\s*return getLegacyPrintPath\(shapeItems\);\s*\}/,

  `if (resolvedReadVariant === 'legacyprint') {

      return getLegacyPrintAcousticBodyPath(shapeItems);

    }`

);

js = js.replace(

  /if \(resolvedReadVariant === 'legacyprint'\) \{\s*return getBlobPath\(points, compact \? 0\.62 : 0\.72\);\s*\}/,

  `if (resolvedReadVariant === 'legacyprint') {

      return getLegacyPrintAcousticBodyPath(shapeItems);

    }`

);

js = js.replace(

  /if \(resolvedReadVariant === 'legacyprint'\) \{\s*const points = shapeItems\.map\(\(item\) => item\.point\)\.filter\(isFinitePoint\);\s*return getBlobPath\(points, compact \? 0\.62 : 0\.78\);\s*\}/,

  `if (resolvedReadVariant === 'legacyprint') {

      return getLegacyPrintAcousticBodyPath(shapeItems);

    }`

);

// Disable noisy legacy decorative layers in render if present.

js = js.replace(

  /\n\s*\{resolvedReadVariant === 'legacyprint' && \(\n\s*<g className="heritage-legacyprint-influence-field"[\s\S]*?\n\s*<\/g>\n\s*\)\}/,

  ''

);

js = js.replace(

  /\n\s*\{resolvedReadVariant === 'legacyprint' && \(\n\s*<g className="heritage-legacyprint-contour-points"[\s\S]*?\n\s*<\/g>\n\s*\)\}/,

  ''

);

// Keep calculated influence data harmless if existing render references were removed.

js = js.replace(

  /const legacyPrintTopNodes = useMemo\(\(\) => \{[\s\S]*?\}, \[rankedNodes, resolvedReadVariant\]\);/,

  `const legacyPrintTopNodes = useMemo(() => {

    if (resolvedReadVariant !== 'legacyprint') return [];

    return rankedNodes.slice(0, 4);

  }, [rankedNodes, resolvedReadVariant]);`

);

// CSS: hide/remove bad decorative layer behavior and simplify identity visual.

css += `

/* =========================================================

   LEGACYPRINT™ IDENTITY — ACOUSTIC BODY RESET

   ========================================================= */

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-read-key,

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-influence-field,

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-contour-points,

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-center-breath,

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-influence,

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-contour-point {

  display: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-line--base,

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-spider-line {

  display: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-network {

  opacity: 0.72 !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-outer-line {

  opacity: 0.12 !important;

  stroke-width: 0.85 !important;

  filter: none !important;

  mix-blend-mode: screen !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-active-shape {

  animation: heritageLegacyPrintAcousticBodyBreath 7800ms ease-in-out infinite !important;

  transform-box: view-box;

  transform-origin: center;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-complex-fill {

  opacity: 0.22 !important;

  filter: blur(0.18px) !important;

  mix-blend-mode: screen !important;

  animation: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-complex-sheen {

  opacity: 0.13 !important;

  filter: blur(0.12px) !important;

  mix-blend-mode: screen !important;

  animation: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-halo {

  opacity: 0.1 !important;

  stroke-width: 16px !important;

  filter:

    drop-shadow(0 0 10px color-mix(in srgb, var(--dominant-thread-color) 22%, transparent))

    drop-shadow(0 0 18px color-mix(in srgb, var(--secondary-thread-color) 12%, transparent)) !important;

  mix-blend-mode: screen !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-glow {

  opacity: 0.28 !important;

  stroke-width: 7.5px !important;

  filter:

    drop-shadow(0 0 6px color-mix(in srgb, var(--dominant-thread-color) 32%, transparent))

    drop-shadow(0 0 14px color-mix(in srgb, var(--secondary-thread-color) 14%, transparent)) !important;

  mix-blend-mode: screen !important;

  animation: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-core {

  opacity: 0.98 !important;

  stroke-width: 3.05px !important;

  stroke-linecap: round !important;

  stroke-linejoin: round !important;

  filter:

    drop-shadow(0 0 3px rgba(255, 246, 218, 0.16))

    drop-shadow(0 0 7px color-mix(in srgb, var(--dominant-thread-color) 34%, transparent)) !important;

  mix-blend-mode: screen !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-hotline {

  opacity: 0.16 !important;

  stroke-width: 0.75px !important;

  filter: none !important;

  mix-blend-mode: screen !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-anchor-dot {

  opacity: 0.46 !important;

  filter: drop-shadow(0 0 4px currentColor) !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-node-icon {

  opacity: calc(0.34 + (var(--node-motion, 0) * 0.42)) !important;

  filter: drop-shadow(0 0 5px currentColor) !important;

}

.heritage-voice-thread-map--read-legacyprint

  .heritage-voice-thread-node.is-active

  .heritage-voice-thread-node-icon {

  opacity: 0.95 !important;

  animation: none !important;

}

@keyframes heritageLegacyPrintAcousticBodyBreath {

  0%,

  100% {

    transform: scale(1) rotate(0deg);

  }

  48% {

    transform: scale(calc(1 + (var(--legacyprint-motion-strength, 0) * 0.012))) rotate(0.12deg);

  }

  72% {

    transform: scale(calc(1 - (var(--legacyprint-motion-strength, 0) * 0.004))) rotate(-0.08deg);

  }

}

`;

fs.writeFileSync(jsPath, js);

fs.writeFileSync(cssPath, css);

console.log('Patched LegacyPrint Identity to direct acoustic body model.');