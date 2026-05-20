import fs from 'fs';

const jsPath = 'src/components/VoiceThreadMap.js';

const cssPath = 'src/components/VoiceThreadMap.css';

let js = fs.readFileSync(jsPath, 'utf8');

let css = fs.readFileSync(cssPath, 'utf8');

js = js.replace(

  /import React, \{ useEffect, useMemo, useRef, useState \} from 'react';/,

  "import React, { useMemo, useRef, useState, useEffect } from 'react';"

);

// Remove the new LegacyPrint pill/key header render block.

js = js.replace(

  /\n\s*\{resolvedReadVariant === 'legacyprint' && !compact && \(\n\s*<div className="heritage-legacyprint-read-key" aria-hidden="true">[\s\S]*?\n\s*<\/div>\n\s*\)\}/,

  ''

);

// Make the LegacyPrint contour path less circular.

js = js.replace(

  /if \(resolvedReadVariant === 'legacyprint'\) \{\n\s*return getBlobPath\(points, compact \? 0\.62 : 0\.72\);\n\s*\}/,

  `if (resolvedReadVariant === 'legacyprint') {

      return getLegacyPrintPath(shapeItems);

    }`

);

// Add getLegacyPrintPath if it does not exist.

if (!js.includes('const getLegacyPrintPath = (shapeItems = []) => {')) {

  js = js.replace(

    /const getThreadShapePoints = \(\{/,

    `const getLegacyPrintPath = (shapeItems = []) => {

  const cleanItems = shapeItems.filter(

    (item) => item?.point && isFinitePoint(item.point)

  );

  if (cleanItems.length < 3) {

    return getOpenPath(cleanItems.map((item) => item.point));

  }

  const points = cleanItems.map((item) => item.point);

  const first = points[0];

  const family = cleanItems[0]?.family || 'shoulderLean';

  const tensionByFamily = {

    compactCut: 0.42,

    pocketHook: 0.5,

    shoulderLean: 0.56,

    lowCrest: 0.54,

    wideShelf: 0.6,

    deepDrop: 0.62,

    torchCrown: 0.44,

    dryShard: 0.36,

    focusedSeat: 0.46,

  };

  const tension = tensionByFamily[family] || 0.52;

  const segments = [\`M \${first.x.toFixed(2)} \${first.y.toFixed(2)}\`];

  points.forEach((point, index) => {

    const previous = points[(index - 1 + points.length) % points.length];

    const next = points[(index + 1) % points.length];

    const afterNext = points[(index + 2) % points.length];

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

const getThreadShapePoints = ({`

  );

}

// Make family contours more distinct.

js = js.replace(

  /compactCut: \[\n\s*\{ a: -116, r: 112 \},\n\s*\{ a: -72, r: 144 \},\n\s*\{ a: -22, r: 124 \},\n\s*\{ a: 28, r: 152 \},\n\s*\{ a: 82, r: 112 \},\n\s*\{ a: 134, r: 134 \},\n\s*\{ a: 190, r: 102 \},\n\s*\{ a: 248, r: 132 \},\n\s*\{ a: 306, r: 116 \},\n\s*\]/,

  `compactCut: [

    { a: -118, r: 96 },

    { a: -76, r: 154 },

    { a: -30, r: 106 },

    { a: 18, r: 164 },

    { a: 68, r: 102 },

    { a: 124, r: 138 },

    { a: 184, r: 90 },

    { a: 244, r: 128 },

    { a: 306, r: 104 },

  ]`

);

js = js.replace(

  /pocketHook: \[\n\s*\{ a: -124, r: 136 \},\n\s*\{ a: -82, r: 112 \},\n\s*\{ a: -34, r: 148 \},\n\s*\{ a: 18, r: 132 \},\n\s*\{ a: 72, r: 154 \},\n\s*\{ a: 126, r: 118 \},\n\s*\{ a: 180, r: 146 \},\n\s*\{ a: 236, r: 108 \},\n\s*\{ a: 292, r: 138 \},\n\s*\]/,

  `pocketHook: [

    { a: -130, r: 150 },

    { a: -88, r: 100 },

    { a: -42, r: 164 },

    { a: 8, r: 118 },

    { a: 62, r: 170 },

    { a: 118, r: 108 },

    { a: 176, r: 154 },

    { a: 236, r: 96 },

    { a: 300, r: 148 },

  ]`

);

js = js.replace(

  /shoulderLean: \[\n\s*\{ a: -130, r: 124 \},\n\s*\{ a: -84, r: 150 \},\n\s*\{ a: -32, r: 116 \},\n\s*\{ a: 22, r: 154 \},\n\s*\{ a: 74, r: 128 \},\n\s*\{ a: 128, r: 142 \},\n\s*\{ a: 184, r: 112 \},\n\s*\{ a: 240, r: 148 \},\n\s*\{ a: 300, r: 120 \},\n\s*\]/,

  `shoulderLean: [

    { a: -138, r: 112 },

    { a: -92, r: 160 },

    { a: -38, r: 112 },

    { a: 16, r: 154 },

    { a: 70, r: 136 },

    { a: 126, r: 154 },

    { a: 186, r: 106 },

    { a: 246, r: 156 },

    { a: 306, r: 118 },

  ]`

);

js = js.replace(

  /lowCrest: \[\n\s*\{ a: -132, r: 118 \},\n\s*\{ a: -86, r: 152 \},\n\s*\{ a: -28, r: 132 \},\n\s*\{ a: 26, r: 146 \},\n\s*\{ a: 80, r: 118 \},\n\s*\{ a: 134, r: 156 \},\n\s*\{ a: 188, r: 126 \},\n\s*\{ a: 244, r: 136 \},\n\s*\{ a: 302, r: 110 \},\n\s*\]/,

  `lowCrest: [

    { a: -138, r: 104 },

    { a: -92, r: 152 },

    { a: -34, r: 126 },

    { a: 22, r: 138 },

    { a: 78, r: 110 },

    { a: 132, r: 168 },

    { a: 190, r: 152 },

    { a: 246, r: 162 },

    { a: 306, r: 112 },

  ]`

);

js = js.replace(

  /wideShelf: \[\n\s*\{ a: -136, r: 148 \},\n\s*\{ a: -88, r: 126 \},\n\s*\{ a: -34, r: 154 \},\n\s*\{ a: 20, r: 138 \},\n\s*\{ a: 74, r: 166 \},\n\s*\{ a: 126, r: 126 \},\n\s*\{ a: 180, r: 156 \},\n\s*\{ a: 236, r: 134 \},\n\s*\{ a: 296, r: 150 \},\n\s*\]/,

  `wideShelf: [

    { a: -146, r: 164 },

    { a: -96, r: 124 },

    { a: -42, r: 166 },

    { a: 12, r: 132 },

    { a: 70, r: 178 },

    { a: 124, r: 126 },

    { a: 180, r: 172 },

    { a: 238, r: 132 },

    { a: 304, r: 166 },

  ]`

);

js = js.replace(

  /deepDrop: \[\n\s*\{ a: -140, r: 128 \},\n\s*\{ a: -92, r: 158 \},\n\s*\{ a: -38, r: 136 \},\n\s*\{ a: 18, r: 150 \},\n\s*\{ a: 70, r: 132 \},\n\s*\{ a: 124, r: 166 \},\n\s*\{ a: 182, r: 146 \},\n\s*\{ a: 238, r: 158 \},\n\s*\{ a: 300, r: 124 \},\n\s*\]/,

  `deepDrop: [

    { a: -146, r: 114 },

    { a: -98, r: 150 },

    { a: -42, r: 132 },

    { a: 14, r: 142 },

    { a: 68, r: 128 },

    { a: 124, r: 174 },

    { a: 184, r: 176 },

    { a: 242, r: 178 },

    { a: 304, r: 120 },

  ]`

);

js = js.replace(

  /torchCrown: \[\n\s*\{ a: -128, r: 140 \},\n\s*\{ a: -82, r: 112 \},\n\s*\{ a: -30, r: 158 \},\n\s*\{ a: 22, r: 122 \},\n\s*\{ a: 76, r: 150 \},\n\s*\{ a: 132, r: 116 \},\n\s*\{ a: 188, r: 154 \},\n\s*\{ a: 244, r: 120 \},\n\s*\{ a: 302, r: 142 \},\n\s*\]/,

  `torchCrown: [

    { a: -128, r: 158 },

    { a: -84, r: 96 },

    { a: -32, r: 174 },

    { a: 18, r: 104 },

    { a: 76, r: 166 },

    { a: 132, r: 104 },

    { a: 190, r: 160 },

    { a: 246, r: 108 },

    { a: 304, r: 154 },

  ]`

);

js = js.replace(

  /dryShard: \[\n\s*\{ a: -126, r: 118 \},\n\s*\{ a: -82, r: 150 \},\n\s*\{ a: -28, r: 122 \},\n\s*\{ a: 24, r: 156 \},\n\s*\{ a: 78, r: 116 \},\n\s*\{ a: 134, r: 144 \},\n\s*\{ a: 188, r: 126 \},\n\s*\{ a: 246, r: 154 \},\n\s*\{ a: 304, r: 112 \},\n\s*\]/,

  `dryShard: [

    { a: -128, r: 92 },

    { a: -82, r: 168 },

    { a: -30, r: 104 },

    { a: 24, r: 174 },

    { a: 78, r: 96 },

    { a: 134, r: 152 },

    { a: 190, r: 110 },

    { a: 248, r: 168 },

    { a: 306, r: 96 },

  ]`

);

js = js.replace(

  /focusedSeat: \[\n\s*\{ a: -132, r: 112 \},\n\s*\{ a: -84, r: 142 \},\n\s*\{ a: -28, r: 118 \},\n\s*\{ a: 26, r: 146 \},\n\s*\{ a: 80, r: 114 \},\n\s*\{ a: 136, r: 148 \},\n\s*\{ a: 190, r: 116 \},\n\s*\{ a: 246, r: 140 \},\n\s*\{ a: 304, r: 118 \},\n\s*\]/,

  `focusedSeat: [

    { a: -132, r: 96 },

    { a: -84, r: 146 },

    { a: -28, r: 102 },

    { a: 26, r: 148 },

    { a: 80, r: 100 },

    { a: 136, r: 150 },

    { a: 190, r: 98 },

    { a: 246, r: 144 },

    { a: 304, r: 102 },

  ]`

);

// Reduce smoothing/recentering if this exact logic exists.

js = js.replace(

  /const smoothAmount = clamp\(0\.24 \+ item\.mass \* 0\.12, 0\.24, 0\.42\);/,

  `const smoothAmount = clamp(0.12 + item.mass * 0.06, 0.12, 0.22);`

);

js = js.replace(

  /const centered = recenterPoints\(smoothedPoints, 0\.18\);/,

  `const centered = recenterPoints(smoothedPoints, 0.06);`

);

// Reduce overly circular radius clamp.

js = js.replace(

  /const radius = clamp\(base\.r \+ broadWave \+ configPush \+ voicePush, 86, 172\);/,

  `const radius = clamp(base.r + broadWave + configPush + voicePush, 78, 184);`

);

// Make influence lines quieter.

css = css.replace(

  /\.heritage-legacyprint-read-key[\s\S]*?\.heritage-legacyprint-read-key__item span \{[\s\S]*?\n\}/,

  ''

);

css = css.replace(

  /top: -12px;/g,

  'top: -8px;'

);

css = css.replace(

  /opacity: calc\(0\.1 \+ \(var\(--influence-strength, 0\.5\) \* 0\.28\)\);/,

  'opacity: calc(0.045 + (var(--influence-strength, 0.5) * 0.12));'

);

css = css.replace(

  /stroke-width: calc\(0\.8px \+ \(var\(--influence-strength, 0\.5\) \* 2\.4px\)\);/,

  'stroke-width: calc(0.45px + (var(--influence-strength, 0.5) * 1.15px));'

);

css = css.replace(

  /opacity: calc\(0\.18 \+ \(var\(--influence-strength, 0\.5\) \* 0\.38\)\);/,

  'opacity: calc(0.1 + (var(--influence-strength, 0.5) * 0.22));'

);

css = css.replace(

  /opacity: calc\(0\.24 \+ \(var\(--contour-motion, 0\) \* 0\.52\)\);/,

  'opacity: calc(0.18 + (var(--contour-motion, 0) * 0.36));'

);

css = css.replace(

  /r: 4\.8;/g,

  ''

);

// Make the blob outline sharper / less coin-like.

css += `

/* =========================================================

   LEGACYPRINT™ IDENTITY — DISTINCT SHAPE PASS

   ========================================================= */

.heritage-voice-thread-map--read-legacyprint .heritage-legacyprint-read-key {

  display: none !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-active-shape {

  animation: heritageLegacyPrintBlobBreath 8200ms ease-in-out infinite;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-core {

  stroke-width: 3.35px !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-glow {

  opacity: 0.36 !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-shape-halo {

  opacity: 0.1 !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-complex-fill {

  opacity: 0.24 !important;

}

.heritage-voice-thread-map--read-legacyprint .heritage-voice-thread-complex-sheen {

  opacity: 0.14 !important;

}

.heritage-voice-thread-map--legacyprint-dryShard .heritage-voice-thread-shape-core,

.heritage-voice-thread-map--legacyprint-torchCrown .heritage-voice-thread-shape-core,

.heritage-voice-thread-map--legacyprint-compactCut .heritage-voice-thread-shape-core {

  stroke-width: 3.05px !important;

}

.heritage-voice-thread-map--legacyprint-wideShelf .heritage-voice-thread-shape-core,

.heritage-voice-thread-map--legacyprint-deepDrop .heritage-voice-thread-shape-core {

  stroke-width: 3.75px !important;

}

.heritage-legacyprint-influence-trail {

  opacity: calc(0.035 + (var(--influence-strength, 0.5) * 0.09)) !important;

  stroke-width: calc(0.4px + (var(--influence-strength, 0.5) * 0.9px)) !important;

}

.heritage-legacyprint-influence-node {

  opacity: calc(0.08 + (var(--influence-strength, 0.5) * 0.16)) !important;

}

.heritage-legacyprint-contour-point {

  opacity: calc(0.12 + (var(--contour-motion, 0) * 0.24)) !important;

}

`;

fs.writeFileSync(jsPath, js);

fs.writeFileSync(cssPath, css);

console.log('Patched LegacyPrint Identity shape/header pass.');