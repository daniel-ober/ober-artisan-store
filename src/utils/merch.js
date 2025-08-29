// src/utils/merch.js

/**
 * Safely get a display price in cents for a merch product.
 * Prefers the legacy stripePriceIds map; falls back to min variant price; then to product.minPriceCents.
 */
export function getDisplayPriceCents(product) {
  const mapFirst =
    product?.stripePriceIds &&
    Object.values(product.stripePriceIds)[0] &&
    Number(Object.values(product.stripePriceIds)[0].unitAmount);

  if (Number.isFinite(mapFirst)) return mapFirst;

  // Some docs already persist minPriceCents
  const minFromDoc = Number(product?.minPriceCents);
  if (Number.isFinite(minFromDoc)) return minFromDoc;

  // Fallback: compute min from variant pricing
  const variantCents = Array.isArray(product?.variants)
    ? product.variants
        .map((v) => {
          // allow either printifyPriceCents or price (already cents in your docs)
          const n =
            Number(v.printifyPriceCents) ||
            Number(v.price) ||
            Number(v.unitAmount);
          return Number.isFinite(n) ? n : NaN;
        })
        .filter((n) => Number.isFinite(n))
    : [];

  if (variantCents.length) return Math.min(...variantCents);

  return null; // caller can decide how to render when null
}

/** Normalize option headings based on type so UI always sees "Colors" / "Sizes". */
export function normalizeOptions(options) {
  if (!Array.isArray(options)) return options;
  return options.map((opt) => {
    if (opt?.type === "color") return { ...opt, name: "Colors" };
    if (opt?.type === "size") return { ...opt, name: "Sizes" };
    return opt;
  });
}

/**
 * Derive readable option sets from product. If product.options exists, use it (normalized).
 * Otherwise, derive from legacy variants' size/color strings.
 */
export function getOptionSets(product) {
  if (Array.isArray(product?.options) && product.options.length) {
    return normalizeOptions(product.options);
  }

  // Legacy derivation
  const sizes = new Set();
  const colors = new Set();

  (product?.variants || []).forEach((v) => {
    if (v.size) sizes.add(String(v.size));
    if (v.color) colors.add(String(v.color));
  });

  const opts = [];
  if (colors.size) {
    opts.push({
      name: "Colors",
      type: "color",
      display_in_preview: true,
      values: [...colors].map((title) => ({ id: title, title })),
    });
  }
  if (sizes.size) {
    opts.push({
      name: "Sizes",
      type: "size",
      display_in_preview: true,
      values: [...sizes].map((title) => ({ id: title, title })),
    });
  }
  return opts;
}

/** Get the first available value id for an option (nice for initial state). */
export function getFirstValueId(opt) {
  return opt?.values?.[0]?.id ?? null;
}

/** Find a value object by id within an option. */
export function getValueById(opt, id) {
  if (!opt || id == null) return null;
  return (opt.values || []).find((v) => String(v.id) === String(id)) || null;
}

/** Extract a hex color for swatch rendering from an option value. */
export function getSwatchHex(value) {
  if (!value) return null;
  const fromHex = Array.isArray(value.hex_colors) && value.hex_colors[0];
  const fromColors = Array.isArray(value.colors) && value.colors[0];
  return fromHex || fromColors || null;
}

/**
 * Find a variant by selected option IDs (Printify style).
 * Variants have e.g. v.options = [sizeId, colorId] but order can vary; we match by inclusion.
 */
export function findVariantBySelectedIds(product, { sizeId, colorId }) {
  const idsWanted = [sizeId, colorId].filter((x) => x != null).map(String);
  if (!idsWanted.length) return null;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return (
    variants.find((v) => {
      const opts = (v.options || []).map(String);
      return idsWanted.every((id) => opts.includes(id));
    }) || null
  );
}

/**
 * Legacy: Find a variant by selected string titles (size & color strings on variant).
 */
export function findVariantBySelection(product, { color, size }) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const colorL = color ? String(color).toLowerCase() : null;
  const sizeL = size ? String(size).toLowerCase() : null;

  return (
    variants.find((v) => {
      const vColor = String(v.color || "").toLowerCase();
      const vSize = String(v.size || "").toLowerCase();
      const colorOk = colorL ? vColor === colorL : true;
      const sizeOk = sizeL ? vSize === sizeL : true;
      return colorOk && sizeOk;
    }) || null
  );
}

/**
 * Resolve the currently selected variant using the most reliable info available.
 * 1) Try by numeric IDs (Printify schema)
 * 2) Fallback by titles/strings (legacy schema)
 */
export function resolveSelectedVariant(product, { sizeId, colorId, sizeTitle, colorTitle }) {
  // Prefer id matching when options/variants follow Printify schema
  const byIds = findVariantBySelectedIds(product, { sizeId, colorId });
  if (byIds) return byIds;

  // Fallback to string titles if legacy fields present
  return findVariantBySelection(product, { size: sizeTitle, color: colorTitle });
}

/** Compose a nice "Size | Color" label for carts, etc. */
export function buildVariantLabel(sizeVal, colorVal) {
  const pieces = [];
  if (sizeVal?.title) pieces.push(sizeVal.title);
  if (colorVal?.title) pieces.push(colorVal.title);
  return pieces.join(" | ");
}

/** Get Stripe price mapping for a specific variant id (if present). */
export function getStripePriceForVariant(product, variantId) {
  if (!product?.stripePriceIds || !variantId) return null;
  const entry = product.stripePriceIds[String(variantId)] || product.stripePriceIds[Number(variantId)];
  if (!entry) return null;
  const priceId = entry.priceId || entry.id;
  const unitAmount = Number(entry.unitAmount);
  return priceId ? { priceId, unitAmount: Number.isFinite(unitAmount) ? unitAmount : null } : null;
}

/**
 * Convenience: produce a normalized “selection model” for UI state.
 * It picks the first available size/color ids and their value objects.
 */
export function getInitialSelection(product) {
  const opts = getOptionSets(product);
  const sizeOpt = opts.find((o) => o.type === "size") || null;
  const colorOpt = opts.find((o) => o.type === "color") || null;

  const sizeId = getFirstValueId(sizeOpt);
  const colorId = getFirstValueId(colorOpt);

  const sizeVal = getValueById(sizeOpt, sizeId);
  const colorVal = getValueById(colorOpt, colorId);

  return { sizeOpt, colorOpt, sizeId, colorId, sizeVal, colorVal };
}