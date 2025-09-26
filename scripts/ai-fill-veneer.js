// scripts/ai-fill-veneer.js
// Usage:
//   OPENAI_API_KEY="..." node scripts/ai-fill-veneer.js <input.jpg|png|webp> <#hex> <output.png> [--size=auto|1024x1024|1024x1536|1536x1024]
//
// Notes:
// - We re-encode the source to PNG and generate a PNG mask (transparent = editable).
// - Uploads are wrapped with `toFile(..., "name.png", { type: "image/png" })`
//   to avoid the "application/octet-stream" error.
// - Size “auto” preserves the source aspect ratio (OpenAI allowed sizes).

import fs from "fs";
import os from "os";
import path from "path";
import OpenAI from "openai";
import sharp from "sharp";
import { toFile } from "openai/uploads";

/* -------------------------- CLI ARGUMENTS & FLAGS ------------------------- */

const [, , inputPath, hex, outputPath, ...rest] = process.argv;

if (!inputPath || !hex || !outputPath) {
  console.error(
    "Usage: node scripts/ai-fill-veneer.js <input> <#hex> <output.png> [--size=auto|1024x1024|1024x1536|1536x1024]"
  );
  process.exit(1);
}

if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
  console.error(`Invalid color "${hex}". Expected a hex like #0a84ff`);
  process.exit(1);
}

const flags = Object.fromEntries(
  rest
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v = true] = a.replace(/^--/, "").split("=");
      return [k, v];
    })
);

// Allowed sizes per current API
const ALLOWED_SIZES = new Set(["auto", "1024x1024", "1024x1536", "1536x1024"]);
const size = ALLOWED_SIZES.has(flags.size) ? flags.size : "auto";

/* ------------------------------ OPENAI CLIENT ----------------------------- */

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
  console.error(
    "Missing OPENAI_API_KEY. Provide it inline or via env. Example:\n" +
      'OPENAI_API_KEY="sk-..." node scripts/ai-fill-veneer.js sample.jpeg "#0a84ff" out.png'
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* --------------------------- IMAGE PREP HELPERS --------------------------- */

// 1) Re-encode to PNG so we 100% control the MIME. Also apply EXIF orientation via .rotate()
async function reencodeToPng(srcPath) {
  const buf = await sharp(srcPath).rotate().removeAlpha().png().toBuffer();
  const tmp = path.join(os.tmpdir(), `veneer-src-${Date.now()}.png`);
  fs.writeFileSync(tmp, buf);
  return tmp; // PNG on disk → has a proper extension
}

// 2) Build a PNG mask (transparent = editable pores/voids/checks; opaque = keep wood)
// This is intentionally conservative (edits only where there are dark pits/edges).
async function buildMask(srcPngPath) {
  const base = sharp(srcPngPath).rotate().removeAlpha();
  const meta = await base.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;

  // Greyscale + normalize helps separate voids/pores
  const gray = await base.greyscale().normalize().median(1).toBuffer();

  // Detect edges and darker depressions; combine both as "editable"
  const edges = await sharp(gray)
    .convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] })
    .linear(1.1, 0)
    .threshold(120)
    .toBuffer();

  const dark = await sharp(gray).threshold(110).toBuffer();

  // Lighten blend: union of edges + darks → likely pores/knots/checks
  const combined = await sharp(dark)
    .composite([{ input: edges, blend: "lighten" }])
    .blur(0.6)
    .threshold(135)
    .toBuffer();

  // In edit masks: alpha = 0 (transparent) means "model may edit".
  // We invert so detected features become transparent.
  const alpha = await sharp(combined).blur(0.8).negate().toBuffer();

  const maskPNG = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .joinChannel(alpha) // add alpha channel
    .png()
    .toBuffer();

  const tmp = path.join(os.tmpdir(), `veneer-mask-${Date.now()}.png`);
  fs.writeFileSync(tmp, maskPNG);
  return tmp;
}

// 3) Wrap a local PNG path into a *named* Web File with explicit MIME.
// This avoids "application/octet-stream" on upload.
async function fileFromPngPath(p) {
  const rs = fs.createReadStream(p);
  // Give it a real name + force type
  return toFile(rs, path.basename(p) || "file.png", { type: "image/png" });
}

/* --------------------------------- PROMPT --------------------------------- */

function buildPrompt(hex) {
  return `
Edit ONLY the natural voids, pores, knots, checks, and stress lines in this exact burl veneer.
Fill those areas with a metallic resin accent in ${hex}, keeping the original wood tone and figure untouched elsewhere.
This is an inlay-style resin fill (not a paint overlay). Preserve the wood's grain, chatoyance, and realistic finish.
Avoid halos or recoloring large smooth areas; edits must stay contained to the mask openings and look natural.
  `.trim();
}

/* --------------------------------- MAIN ----------------------------------- */

async function main() {
  // Prepare inputs
  const srcPng = await reencodeToPng(inputPath);
  const maskPng = await buildMask(srcPng);

  // Wrap as proper PNG "File"s (fixes MIME = image/png)
  const imageFile = await fileFromPngPath(srcPng);
  const maskFile = await fileFromPngPath(maskPng);

  // Build prompt
  const prompt = buildPrompt(hex);

  // Call Images Edit
  const res = await client.images.edit({
    model: "gpt-image-1",
    prompt,
    image: imageFile,
    mask: maskFile,
    size // 'auto' | '1024x1024' | '1024x1536' | '1536x1024'
  });

  const b64 = res.data[0].b64_json;
  fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
  console.log(`✅ Saved ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});