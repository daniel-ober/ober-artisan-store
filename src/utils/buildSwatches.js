// utils/buildSwatches.js
import { createCanvas, loadImage } from 'canvas'; // npm i canvas

// Minimal shared palette; extend centrally over time
const PALETTE = {
  black: '#000000',
  white: '#FFFFFF',
  charcoal: '#36454F',
  'shadow grey': '#7a7d80',
  graphite: '#4a4f54',
  grey: '#808080',
  gray: '#808080',
  silver: '#C0C0C0',
  navy: '#001f3f',
  'true navy': '#001b36',
  royal: '#4169E1',
  kelly: '#2AAA00',
  red: '#FF4136',
  blue: '#0074D9',
  sand: '#C2B280',
  gold: '#DAA520',
  olive: '#808000',
};

const norm = (s) => String(s || '').toLowerCase().trim();

function tokenToHex(token) {
  const t = norm(token)
    .replace(/solid|heather|vintage|premium|classic|unisex|men'?s|women'?s|adult|youth|tee|shirt|hoodie|tank|zip|full|pullover/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (PALETTE[t]) return PALETTE[t];
  if (t === 'shadow gray') return PALETTE['shadow grey'];
  if (t.includes('navy')) return PALETTE['true navy'];
  if (t.includes('grey') || t.includes('gray')) return PALETTE['shadow grey'];
  return null;
}

function splitTitleToTokens(title) {
  return String(title || '')
    .split(/[\/|+,]/g)   // "Black/White/Navy" → ["Black","White","Navy"]
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildVariantImgMap(product) {
  const map = {};
  const images = Array.isArray(product.images) ? product.images : [];
  images.forEach((im) => {
    const idsRaw = im?.variant_ids ?? [];
    const ids = Array.isArray(idsRaw) ? idsRaw : [idsRaw].filter(Boolean);
    const src = typeof im === 'string' ? im : im?.src;
    ids.map(String).forEach((id) => { if (src && !map[id]) map[id] = src; });
  });
  return map;
}

function pickVariantIdForColor(product, colorIdx, valueId, enabledIds) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const v = variants.find(
    (v) =>
      enabledIds.includes(String(v.id)) &&
      Array.isArray(v.options) &&
      v.options[colorIdx] === valueId
  );
  return v ? String(v.id) : null;
}

async function sampleDominantHex(imageUrl) {
  try {
    const img = await loadImage(imageUrl);
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    const hex = '#' + [r / count, g / count, b / count]
      .map((x) => Math.round(x).toString(16).padStart(2, '0'))
      .join('');
    return hex;
  } catch {
    return null;
  }
}

export async function buildSwatchesForProduct(product) {
  const options = Array.isArray(product.options) ? product.options : [];
  const colorIdx = options.findIndex((o) => /colou?r/i.test(String(o?.name || '')));
  if (colorIdx < 0) return { swatches: [], variantImageMap: {} };

  const colorValues = Array.isArray(options[colorIdx]?.values) ? options[colorIdx].values : [];
  const variants = Array.isArray(product.variants) ? product.variants : [];

  // enabled variant ids
  let enabledIds = variants
    .filter((v) => v?.is_enabled && v.is_available !== false)
    .map((v) => String(v.id));
  if (!enabledIds.length) enabledIds = variants.map((v) => String(v.id));

  const variantImageMap = buildVariantImgMap(product);

  const swatches = [];
  for (const val of colorValues) {
    const variantId = pickVariantIdForColor(product, colorIdx, val.id, enabledIds);
    if (!variantId) continue;

    const imageSrc = variantImageMap[variantId] || null;

    // 1) explicit hex sources from Printify/value
    let hexes =
      (Array.isArray(val?.colors) && val.colors.length ? val.colors : null) ||
      (Array.isArray(val?.hex_colors) && val.hex_colors.length ? val.hex_colors : null) ||
      (val?.hex ? [val.hex] : null);

    // 2) if not available, parse title tokens
    if (!hexes) {
      const tokens = splitTitleToTokens(val.title || val.name);
      const mapped = tokens.map(tokenToHex).filter(Boolean);
      if (mapped.length) hexes = mapped;
    }

    // 3) as a last resort, sample the representative image
    if (!hexes || !hexes.length) {
      const sampled = imageSrc ? await sampleDominantHex(imageSrc) : null;
      hexes = sampled ? [sampled] : ['#ccc'];
    }

    // clamp to max 4 bands for gradients
    hexes = hexes.slice(0, 4);

    swatches.push({
      valueId: val.id,
      title: val.title || val.name || String(val.id),
      hexes,
      variantId: Number(variantId) || variantId,
      imageSrc,
    });
  }

  return { swatches, variantImageMap };
}