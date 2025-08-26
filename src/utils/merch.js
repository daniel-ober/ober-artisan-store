// src/utils/merch.js

// Safely get a display price in cents for a merch product.
// Prefers legacy stripePriceIds map; falls back to min variant price.
export function getDisplayPriceCents(product) {
  const mapFirst =
    product?.stripePriceIds &&
    Object.values(product.stripePriceIds)[0] &&
    Number(Object.values(product.stripePriceIds)[0].unitAmount);

  if (Number.isFinite(mapFirst)) return mapFirst;

  const minFromDoc = Number(product?.minPriceCents);
  if (Number.isFinite(minFromDoc)) return minFromDoc;

  const variantCents = Array.isArray(product?.variants)
    ? product.variants
        .map((v) => Number(v.printifyPriceCents))
        .filter((n) => Number.isFinite(n))
    : [];

  if (variantCents.length) return Math.min(...variantCents);

  return null; // caller can decide what to render when null
}

// Derive readable option sets from product. If product.options exists,
// use that; otherwise derive from variants' size/color.
export function getOptionSets(product) {
  if (Array.isArray(product?.options) && product.options.length) {
    return product.options;
  }

  const sizes = new Set();
  const colors = new Set();

  (product?.variants || []).forEach((v) => {
    if (v.size) sizes.add(v.size);
    if (v.color) colors.add(v.color);
  });

  const opts = [];
  if (colors.size) {
    opts.push({
      name: 'Colors',
      type: 'color',
      display_in_preview: true,
      values: [...colors].map((title) => ({ id: title, title })),
    });
  }
  if (sizes.size) {
    opts.push({
      name: 'Sizes',
      type: 'size',
      display_in_preview: true,
      values: [...sizes].map((title) => ({ id: title, title })),
    });
  }
  return opts;
}

// Find the matching variant given a chosen color/size (strings).
export function findVariantBySelection(product, { color, size }) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return (
    variants.find(
      (v) =>
        (color ? (v.color || '').toLowerCase() === color.toLowerCase() : true) &&
        (size ? (v.size || '').toLowerCase() === size.toLowerCase() : true)
    ) || null
  );
}