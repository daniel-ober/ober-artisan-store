// functions/src/resin-router.js
import express from "express";
import sharp from "sharp";
import crypto from "crypto";

const router = express.Router();

function dataURLtoBuffer(dataUrl) {
  const m = /^data:(.+);base64,(.*)$/.exec(dataUrl || "");
  if (!m) throw new Error("Bad veneerDataUrl");
  return Buffer.from(m[2], "base64");
}
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
const INTENSITY_LOOKUP = {
  light:   { dark: 95,  edge: 26, expand: 1, feather: 1.0, strength: 0.80 },
  medium:  { dark: 102, edge: 24, expand: 2, feather: 1.1, strength: 0.90 },
  heavy:   { dark: 112, edge: 22, expand: 3, feather: 1.2, strength: 0.95 },
};
const blendColorBurn = () => (s, d) => (d <= 0 ? 0 : 1 - (1 - s) / d);

router.post("/generate", express.json({ limit: "30mb" }), async (req, res) => {
  try {
    const {
      veneerDataUrl,
      hex = "#1aa7ff",
      intensity = "medium",
      coverage = 0.45,
      size = 1536,
      quality = "high",
    } = req.body || {};

    if (!veneerDataUrl) throw new Error("Missing veneerDataUrl");

    const baseBuf = dataURLtoBuffer(veneerDataUrl);
    const base = sharp(baseBuf, { failOn: "none" }).rotate();
    const meta = await base.metadata();

    const fitW = meta.width >= meta.height ? size : Math.round((meta.width / meta.height) * size);
    const fitH = meta.height > meta.width ? size : Math.round((meta.height / meta.width) * size);
    const baseResized = base.resize(fitW, fitH, { fit: "cover" }).toFormat("png");

    const gray = await baseResized.clone().ensureAlpha().removeAlpha()
      .greyscale().normalize().linear(1.1,0).median(1).toBuffer();

    const edgeK = [-1,-1,-1,-1,8,-1,-1,-1,-1];
    const edges = await sharp(gray).convolve({ width:3, height:3, kernel: edgeK })
      .linear(1.2,0).threshold((INTENSITY_LOOKUP[intensity]?.edge ?? 24) * 2).blur(0.6).toBuffer();

    const darkThrBias = Math.round((INTENSITY_LOOKUP[intensity]?.dark ?? 102) + coverage*12);
    const darks = await sharp(gray).threshold(darkThrBias).toBuffer();

    let combined = await sharp(darks).composite([{ input: edges, blend: "lighten" }]).toBuffer();

    const expandPx = INTENSITY_LOOKUP[intensity]?.expand ?? 2;
    const featherSigma = INTENSITY_LOOKUP[intensity]?.feather ?? 1.1;
    if (expandPx > 0) combined = await sharp(combined).blur(expandPx * 0.8).threshold(120).toBuffer();

    const maskAlpha = await sharp(combined).blur(featherSigma).toBuffer();
    const mask = await sharp({ create: { width: fitW, height: fitH, channels: 4, background: { r:255,g:255,b:255,alpha:0 } } })
      .joinChannel(maskAlpha).png().toBuffer();

    const rgb = hexToRgb(hex);
    const resin = await sharp({ create: { width: fitW, height: fitH, channels: 4, background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 } } }).png().toBuffer();
    const basePng = await baseResized.png().toBuffer();

    const baseRaw  = await sharp(basePng).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const resinRaw = await sharp(resin).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const maskRaw  = await sharp(mask).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    const W = baseRaw.info.width, H = baseRaw.info.height;
    const out = Buffer.alloc(baseRaw.data.length);
    const strength = clamp01(INTENSITY_LOOKUP[intensity]?.strength ?? 0.9);
    const burn = blendColorBurn();

    for (let i = 0; i < baseRaw.data.length; i += 4) {
      const sr = baseRaw.data[i]   / 255, sg = baseRaw.data[i+1] / 255, sb = baseRaw.data[i+2] / 255, sa = baseRaw.data[i+3] / 255;
      const rr = resinRaw.data[i]  / 255, rg = resinRaw.data[i+1] / 255, rb = resinRaw.data[i+2] / 255;
      const m  = (maskRaw.data[i+3] / 255) * strength;

      const or = (1 - m) * sr + m * burn(sr, rr);
      const og = (1 - m) * sg + m * burn(sg, rg);
      const ob = (1 - m) * sb + m * burn(sb, rb);

      out[i]   = Math.round(clamp01(or) * 255);
      out[i+1] = Math.round(clamp01(og) * 255);
      out[i+2] = Math.round(clamp01(ob) * 255);
      out[i+3] = Math.round(sa * 255);
    }

    const pngOut = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .sharpen({ sigma: 0.8 })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const resultDataUrl = `data:image/png;base64,${pngOut.toString("base64")}`;
    res.json({
      ok: true,
      jobId: crypto.randomUUID(),
      resultDataUrl,
      meta: { size: { width: W, height: H }, intensity, coverage, quality }
    });
  } catch (e) {
    console.error("resin/generate error:", e);
    res.status(400).json({ error: e.message || "Generation failed" });
  }
});

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 26, g: 167, b: 255 };
  return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
}

export default router;