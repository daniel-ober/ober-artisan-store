// Usage:
// node scripts/veneer-resin-fill-local.js <input.jpg|png|webp> <#hex> <output.png> [--thresh=118] [--expand=10] [--feather=10] [--gloss=0.35] [--mode=soft-light]
//
// Example:
// node scripts/veneer-resin-fill-local.js sample.jpeg "#0a84ff" out-blue.png --thresh=118 --expand=12 --feather=10 --gloss=0.35 --mode=soft-light

import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

function getFlag(name, def) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!m) return def;
  const v = m.split("=")[1];
  if (name === "mode") return v;
  const num = Number(v);
  return Number.isFinite(num) ? num : def;
}

const [, , inputPath, hex, outputPath] = process.argv;
if (!inputPath || !hex || !outputPath) {
  console.error("Usage: node scripts/veneer-resin-fill-local.js <input> <#hex> <output.png> [--thresh=118] [--expand=10] [--feather=10] [--gloss=0.35] [--mode=soft-light]");
  process.exit(1);
}
if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
  console.error(`Invalid color "${hex}". Expected a hex like #0a84ff`);
  process.exit(1);
}

const THRESH   = getFlag("thresh", 118);      // darkness threshold for voids
const EXPAND   = getFlag("expand", 10);       // grow mask (px)
const FEATHER  = getFlag("feather", 10);      // soften mask (px)
const GLOSS    = Math.max(0, Math.min(1, getFlag("gloss", 0.35))); // 0..1 intensity of resin sheen
const MODE     = getFlag("mode", "soft-light"); // soft-light | overlay | multiply | screen

// parse HEX -> RGB
function hexToRgb(h) {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map(c => c + c).join("");
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const tint = hexToRgb(hex);

async function main() {
  // Read & normalise base image (do not autoOrient via deprecated option; use rotate())
  const base = sharp(inputPath, { limitInputPixels: false }).rotate(); // respects EXIF
  const meta = await base.metadata();
  const width = meta.width ?? 2048;
  const height = meta.height ?? 2048;

  // --- Build mask of “fillable” regions (voids/pores/knots) ---
  // 1) grayscale + normalize to emphasize structure
  const gray = await base.clone().removeAlpha().greyscale().normalize().toBuffer();

  // 2) darkness map catches holes/voids; edge map catches stress lines/rings
  const dark = await sharp(gray).threshold(THRESH).toBuffer();
  const edges = await sharp(gray)
    .convolve({ width:3, height:3, kernel: [-1,-1,-1, -1,8,-1, -1,-1,-1] })
    .threshold(THRESH + 10)
    .toBuffer();

  // 3) combine & clean: lighten (union), then expand and feather
  let combined = await sharp(dark)
    .composite([{ input: edges, blend: "lighten" }])
    .toBuffer();

  // expand = blur then threshold to “dilate” organically
  if (EXPAND > 0) {
    combined = await sharp(combined).blur(EXPAND / 3).threshold(120).toBuffer();
  }
  // feather = final soft edges
  if (FEATHER > 0) {
    combined = await sharp(combined).blur(FEATHER / 2).toBuffer();
  }

  // Create RGBA mask where alpha = combined (editable); RGB = white
  const maskAlpha = await sharp(combined).negate(false).linear(-1, 255).toBuffer(); // invert: white=keep wood, black=edit → we want alpha of EDIT areas
  const mask = await sharp({
    create: { width, height, channels: 3, background: { r: 0x00, g: 0x00, b: 0x00 } }
  })
    .joinChannel(maskAlpha) // alpha = where to apply color
    .png()
    .toBuffer();

  // --- Build tint layer (metallic feel via gentle micro-contrast & highlight) ---
  // Start with solid color
  let tintLayer = await sharp({
    create: { width, height, channels: 3, background: tint }
  }).png().toBuffer();

  // Add a subtle specular “sheen” by mixing a high-pass of the wood into the tint
  // (this makes the resin read like it has shimmer and follows the wood micro-topography)
  const highpass = await base.clone()
    .removeAlpha()
    .greyscale()
    .blur(6)
    .linear(-1, 255)      // invert blurred
    .composite([{ input: await base.clone().removeAlpha().greyscale().toBuffer(), blend: "lighten" }])
    .blur(0.3)
    .toBuffer();

  // Mix highpass into the tint using soft-light controlled by GLOSS
  // We approximate: tint' = mix( tint, softlight(tint, highpass), GLOSS )
  const glossBlend = await sharp(tintLayer)
    .composite([{ input: highpass, blend: "soft-light", opacity: GLOSS * 100 }])
    .png().toBuffer();

  tintLayer = glossBlend;

  // --- Composite: apply tint only inside mask, with chosen blend mode ---
  // We use the mask as the alpha for the tint layer.
  const tintWithAlpha = await sharp(tintLayer)
    .joinChannel(await sharp(mask).extractChannel(3).toBuffer()) // add alpha channel from mask
    .png().toBuffer();

  // Final composite over the original wood
  const out = await base.clone()
    .composite([{ input: tintWithAlpha, blend: MODE }]) // soft-light is most “in-wood”
    .png()
    .toBuffer();

  fs.writeFileSync(outputPath, out);
  // console.log(`✅ Saved ${outputPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});