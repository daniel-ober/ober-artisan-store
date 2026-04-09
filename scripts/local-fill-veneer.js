// scripts/local-fill-veneer.js
// Usage: node scripts/local-fill-veneer.js <input.jpg|png|webp> <#hex> <output.png> [--coverage=0.55] [--feather=1.2] [--sparkle=0.35]

import fs from "fs";
import path from "path";
import sharp from "sharp";

function parseArgs() {
  const [, , input, hex, out, ...rest] = process.argv;
  if (!input || !hex || !out) {
    console.error("Usage: node scripts/local-fill-veneer.js <input> <#hex> <output.png> [--coverage=0.55] [--feather=1.2] [--sparkle=0.35]");
    process.exit(1);
  }
  const opts = { coverage: 0.55, feather: 1.2, sparkle: 0.35 };
  for (const arg of rest) {
    const m = arg.match(/^--(coverage|feather|sparkle)=(\d+(\.\d+)?)$/);
    if (m) opts[m[1]] = parseFloat(m[2]);
  }
  return { input, hex, out, ...opts };
}

function hexToRgb(hex) {
  const h = hex.replace("#","").toLowerCase();
  const to2 = s => s.length===1 ? s+s : s;
  const r = parseInt(to2(h.slice(0, h.length===3?1:2)),16);
  const g = parseInt(to2(h.slice(h.length===3?1:2, h.length===3?2:4)),16);
  const b = parseInt(to2(h.slice(h.length===3?2:4, h.length===3?3:6)),16);
  return { r, g, b };
}

(async () => {
  const { input, hex, out, coverage, feather, sparkle } = parseArgs();
  const { r, g, b } = hexToRgb(hex);

  const base = sharp(input).removeAlpha();
  const { width = 1024, height = 1024 } = await base.metadata();

  // Luma and edges
  const gray = await base.greyscale().normalize().median(1).toBuffer();
  const edges = await sharp(gray)
    .convolve({ width: 3, height: 3, kernel: [-1,-1,-1, -1,8,-1, -1,-1,-1] })
    .linear(1.25, 0)
    .threshold(120)
    .toBuffer();

  // Dark pores/voids map. Tune coverage by threshold and blur.
  const dark = await sharp(gray)
    .linear(1.0, 0)
    .threshold(Math.round(110 + (1-coverage)*40)) // lower threshold => fewer pixels
    .toBuffer();

  // Union → soften → re-threshold → feather to build alpha
  const union = await sharp(dark)
    .composite([{ input: edges, blend: "lighten" }])
    .blur(0.8)
    .threshold(140)
    .toBuffer();

  const alpha = await sharp(union).blur(feather).toBuffer(); // white where we’ll paint color

  // Metallic-ish color layer (base)
  const colorLayer = await sharp({
    create: { width, height, channels: 3, background: { r, g, b } }
  }).png().toBuffer();

  // “Sparkle” = bright speckle only inside mask (noise * alpha)
  const noise = await sharp({
    create: { width, height, channels: 1, background: { r: 0, g: 0, b: 0 } }
  })
    .noise({ type: 'gaussian', mean: 128, sigma: 32 })
    .linear(sparkle, 0)     // scale
    .toColourspace("b-w")
    .toBuffer();

  // Build RGBA for color layer with alpha
  const coloredRGBA = await sharp(colorLayer)
    .ensureAlpha()
    .joinChannel(alpha)     // use our mask as alpha
    .png()
    .toBuffer();

  // Add sparkle only where mask is present by blending noise into highlights
  const sparkleRGBA = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([{ input: noise, blend: "multiply" }]) // darker speckle
    .modulate({ brightness: 1.1, saturation: 1.0 })
    .ensureAlpha()
    .joinChannel(alpha)
    .png()
    .toBuffer();

  // Composite: wood base → color (overlay) → sparkle (screen)
  const wood = await base.png().toBuffer();
  const outBuf = await sharp(wood)
    .composite([
      { input: coloredRGBA, blend: "overlay" }, // resin hue into pores
      { input: sparkleRGBA, blend: "screen", opacity: 0.6 } // metallic-ish glints
    ])
    .sharpen()
    .png()
    .toBuffer();

  fs.writeFileSync(out, outBuf);
  // console.log(`✅ Saved ${out}`);
})();