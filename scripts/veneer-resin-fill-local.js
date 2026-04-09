// scripts/veneer-resin-fill-local.js
// Usage:
//   node scripts/veneer-resin-fill-local.js <input.jpg|png|webp> <#hexColor> <output.png> \
//        [--dark=135] [--edge=22] [--expand=2] [--feather=1.2] [--mode=color-burn] [--strength=0.85]
//
// Example:
//   node scripts/veneer-resin-fill-local.js sample.jpeg "#0a84ff" out-blue.png --dark=130 --edge=18 --expand=2 --feather=1.0 --mode=color-burn --strength=0.9
//
// What it does (no AI):
//   1) Detects only the darkest pores/voids/knots/cracks (not the whole grain).
//   2) Expands + feathers that selection just a touch (like resin creeped in).
//   3) Composites a metallic-ish color into ONLY those regions.
//   4) Adds a subtle highlight to sell “poured & sanded-back” sheen.
//   5) Leaves the rest of the wood untouched.
//
// Tuning tips:
//   - Increase --dark (e.g., 145) to select fewer regions (stricter).
//   - Decrease --dark (e.g., 120) to select more regions (looser).
//   - --edge controls crack/line detection sensitivity.
//   - --expand (0–4 px) grows the fill slightly into the edges of voids.
//   - --feather softens the mask edges so it looks sanded back.
//   - --mode can be: overlay | soft-light | color-burn | linear-burn | multiply
//   - --strength scales the color intensity (0.6–1.2 is useful).

import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

// ---------- CLI ----------
const argv = process.argv.slice(2);
if (argv.length < 3) {
  console.error("Usage: node scripts/veneer-resin-fill-local.js <input> <#hexColor> <output.png> [--dark=135] [--edge=22] [--expand=2] [--feather=1.2] [--mode=color-burn] [--strength=0.85]");
  process.exit(1);
}

const [inputPath, hex, outputPath] = argv;
const opts = Object.fromEntries(
  argv.slice(3).map(kv => {
    const [k, v] = kv.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);

if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
  console.error(`Invalid color "${hex}". Expected hex like #0a84ff`);
  process.exit(1);
}
const DARK_T = Number(opts.dark ?? 135);        // select darker pores/voids only
const EDGE_T = Number(opts.edge ?? 22);         // edge/crack sensitivity (lower = more)
const EXPAND  = Number(opts.expand ?? 2);       // grow selection (px)
const FEATHER = Number(opts.feather ?? 1.2);    // soften mask (radius in px)
const MODE = String(opts.mode ?? "color-burn"); // overlay|soft-light|color-burn|multiply...
const STRENGTH = Math.max(0, Number(opts.strength ?? 0.85)); // color strength scalar

// ---------- helpers ----------
function hexToRgb(h) {
  const s = h.replace("#", "");
  const v = s.length === 3 ? s.split("").map(c => c + c).join("") : s;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
const COLOR = hexToRgb(hex);

// Persist a temp buffer to a file path (Sharp likes file paths for composites sometimes)
function tmpPath(name) {
  return path.join(os.tmpdir(), `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
}

// Grow a mask by a few pixels (approx dilation) using blur+threshold trick
async function growMask(buf, px) {
  if (px <= 0) return buf;
  const blurred = await sharp(buf).blur(px * 0.6).toBuffer();
  // Threshold slightly above mid so the blurred whites stay white
  return sharp(blurred).threshold(180).toBuffer();
}

(async () => {
  // Auto-orient, keep original size and color
  const base = sharp(inputPath).rotate();

  const meta = await base.metadata();
  const { width = 2048, height = 2048 } = meta;

  // ---- Build voids-only mask ----
  // 1) Greyscale & normalize a bit to make dark pores pop
  const gray = await base.clone()
    .removeAlpha()
    .greyscale()
    .normalize()
    .toBuffer();

  // 2) Dark-region mask (darker-than threshold)
  //    Invert, then threshold → only very dark pits become white.
  const darkMask = await sharp(gray)
    .negate()
    .threshold(DARK_T)   // higher = stricter (fewer areas)
    .toBuffer();

  // 3) Crack/edge map (very light touch)
  const edges = await sharp(gray)
    .convolve({ // Laplacian
      width: 3, height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .linear(1.2, 0)      // lift edges slightly
    .threshold(EDGE_T)   // lower = more hairline cracks included
    .toBuffer();

  // 4) Combine (lighten = union), then clean up
  let combined = await sharp(darkMask)
    .composite([{ input: edges, blend: "lighten" }])
    .toBuffer();

  // 5) Expand slightly so resin rides up the walls a touch, then feather
  combined = await growMask(combined, EXPAND);
  if (FEATHER > 0) combined = await sharp(combined).blur(FEATHER).toBuffer();

  // 6) Ensure pure 0/255 alpha-style mask (but preserve feathering as grey alpha)
  //    We'll keep it as grey alpha so edges stay soft.
  const maskPath = tmpPath("veneer-mask");
  await sharp(combined)
    .ensureAlpha()     // just to be safe
    .extractChannel(0) // single channel
    .toColourspace("b-w")
    .png()
    .toFile(maskPath);

  // ---- Build color/resin layer with subtle depth ----
  // Base color layer
  const colorLayer = await sharp({
    create: {
      width, height, channels: 3,
      background: { r: COLOR.r, g: COLOR.g, b: COLOR.b },
    }
  })
    // add a touch of texture so it doesn't look flat:
    // do a faint sharpen and a tiny noise-like variation via linear tone
    .sharpen(0.5)
    .png()
    .toBuffer();

  // Make that color layer have alpha = mask
  const coloredWithAlphaPath = tmpPath("resin");
  await sharp(colorLayer)
    .joinChannel(combined) // alpha from mask (greyscale)
    .png()
    .toFile(coloredWithAlphaPath);

  // Optional: build a gentle highlight from mask (to sell "poured" sheen)
  // Take mask → blur more → use as alpha for a soft-light white pass
  const highlightAlpha = await sharp(combined)
    .blur(2.0)
    .linear(0.7, 0) // reduce intensity
    .toBuffer();

  const highlightPath = tmpPath("resin-highlight");
  await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .joinChannel(highlightAlpha)
    .png()
    .toFile(highlightPath);

  // ---- Composite on the original ----
  // We’ll do two passes:
  //   1) Resin color pass (MODE, scaled strength)
  //   2) Soft-light highlight pass
  //
  // Strength is applied by interpolating resin layer toward neutral via opacity.
  // For blend modes like color-burn/multiply, lower opacity = subtler color.
  const resinOpacity = Math.max(0, Math.min(1, STRENGTH));

  // Compose
  const out = await base
    .composite([
      { input: coloredWithAlphaPath, blend: MODE, opacity: resinOpacity },
      { input: highlightPath, blend: "soft-light", opacity: 0.25 },
    ])
    .png()
    .toBuffer();

  await fs.promises.writeFile(outputPath, out);
  // console.log(`✅ Saved ${outputPath}`);
  // Clean up temps
  fs.promises.unlink(maskPath).catch(() => {});
  fs.promises.unlink(coloredWithAlphaPath).catch(() => {});
  fs.promises.unlink(highlightPath).catch(() => {});
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});