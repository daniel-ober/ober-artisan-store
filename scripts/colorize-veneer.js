// scripts/colorize-veneer.js
// Usage:
//   node scripts/colorize-veneer.js <input> <hex> <output>
//   [--thresh=150] [--feather=2] [--target=dark|light] [--mode=overlay|soft-light|color|screen|multiply] [--opacity=0.85]
//
// Examples:
//   node scripts/colorize-veneer.js sample.jpeg "#0a84ff" out.png
//   node scripts/colorize-veneer.js sample.jpeg "#0a84ff" out.png --thresh=155 --feather=2 --target=dark --mode=overlay --opacity=0.9

const sharp = require('sharp');

function parseArgs() {
  const [, , input, hex, output, ...rest] = process.argv;
  if (!input || !hex || !output) {
    console.error('Usage: node scripts/colorize-veneer.js <input> <hex> <output> [--thresh=150] [--feather=2] [--target=dark|light] [--mode=overlay|soft-light|color|screen|multiply] [--opacity=0.85]');
    process.exit(1);
  }
  const opts = { thresh: 150, feather: 2, target: 'dark', mode: 'overlay', opacity: 0.9 };
  rest.forEach(arg => {
    const m = arg.match(/^--([a-z-]+)=(.+)$/i);
    if (!m) return;
    const k = m[1]; const v = m[2];
    if (k === 'thresh') opts.thresh = Number(v);
    if (k === 'feather') opts.feather = Number(v);
    if (k === 'target') opts.target = v;               // dark or light (what to color)
    if (k === 'mode') opts.mode = v;                   // overlay, soft-light, color, screen, multiply
    if (k === 'opacity') opts.opacity = Number(v);     // 0..1
  });
  return { input, hex, output, opts };
}

(async () => {
  const { input, hex, output, opts } = parseArgs();

  // Load to get dimensions
  const base = sharp(input);
  const { width, height } = await base.metadata();

  // 1) Build a luminance mask from the image to catch pores/knots.
  //    We create a grayscale, run a threshold, optionally invert based on target,
  //    then lightly blur (feather) for natural edges.
  let lum = await sharp(input)
    .greyscale()
    .normalize()                // helps consistency across shots
    .threshold(opts.thresh)     // 0..255; higher = fewer, darker-only pixels
    .toBuffer();

  // target = dark   → keep dark spots (as 1s)
  // target = light  → invert so we target lighter streaks if desired
  if (opts.target === 'light') {
    lum = await sharp(lum).negate().toBuffer();
  }

  // Feather the mask
  const mask = await sharp(lum)
    .blur(opts.feather)     // fractional allowed, e.g. 1.5–3
    .toColourspace('b-w')   // ensure single-channel look
    .toBuffer();

  // 2) Make a solid color layer with your HEX and adjustable opacity.
  const colorLayer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      // premultiply via alpha == opacity so we can composite cleanly
      background: hexToRgba(hex, opts.opacity)
    }
  }).png().toBuffer();

  // 3) Apply mask to the color layer (mask becomes the alpha channel).
  //    dest-in keeps only the parts where mask is white.
  const maskedColor = await sharp(colorLayer)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4) Lay masked color on top of the original with a gentle blend mode.
  //    overlay = natural pop, soft-light = subtler, color = recolor while keeping luminance,
  //    screen = bright tint, multiply = darker tint.
  const out = await sharp(input)
    .composite([{ input: maskedColor, blend: opts.mode }])
    .toFile(output);

  console.log(`✅ Wrote ${output} (${opts.mode}, thresh=${opts.thresh}, feather=${opts.feather}, target=${opts.target}, opacity=${opts.opacity})`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

function hexToRgba(hex, a = 1) {
  const m = hex.replace('#', '');
  const bigint = parseInt(m.length === 3 ? m.split('').map(x => x + x).join('') : m, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  // sharp expects CSS-ish color string like `rgba(r,g,b,a)`
  return { r, g, b, alpha: a };
}