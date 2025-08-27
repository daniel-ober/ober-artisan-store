import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { analytics, logEvent } from '../firebaseConfig';
import './ProductCard.css';

const FALLBACK_IMAGE = '/fallback-images/fallback_image1.png';

/* ───────────────── helpers ───────────────── */

const idEq = (a, b) => String(a) === String(b);

/** Return all indexes that represent a color-like option */
const getColorIdxs = (options = []) =>
  options.reduce((acc, o, i) => {
    const isColorType = String(o?.type || '').toLowerCase() === 'color';
    const isColorName = /colou?r/i.test(String(o?.name || ''));
    if (isColorType || isColorName) acc.push(i);
    return acc;
  }, []);

/** Build a Set of ALL color value ids across all color-like options */
const buildColorValueIdSet = (product, colorIdxs) => {
  const set = new Set();
  colorIdxs.forEach((idx) => {
    const vals = product?.options?.[idx]?.values || [];
    vals.forEach((v) => set.add(String(v?.id)));
  });
  return set;
};

/** Enabled variant IDs (fallback to all if none are marked enabled) */
const getEnabledVariantIds = (product) => {
  const vs = Array.isArray(product.variants) ? product.variants : [];
  let ids = vs.filter((v) => v?.is_enabled && v.is_available !== false).map((v) => String(v.id));
  if (!ids.length) ids = vs.map((v) => String(v.id));
  return ids;
};

/** Map variantId -> first image src that references it */
const buildVariantImgMap = (product) => {
  const map = new Map();
  const imgs = Array.isArray(product.images) ? product.images : [];
  imgs.forEach((im) => {
    const idsRaw = im?.variant_ids ?? [];
    const ids = Array.isArray(idsRaw) ? idsRaw : [idsRaw].filter(Boolean);
    const src = typeof im === 'string' ? im : im?.src;
    ids.map(String).forEach((id) => {
      if (src && !map.has(id)) map.set(id, src);
    });
  });
  return map;
};

/**
 * Choose a representative variantId for a given color value.
 * Works even if variant.options order != product.options order.
 */
const pickVariantIdForColor = (product, colorIdxs, valueObj, enabledIds, colorValueSet) => {
  const valueId = String(valueObj?.id);
  const vs = Array.isArray(product.variants) ? product.variants : [];

  // 1) Try to find a variant whose options include this valueId among *any* color slot.
  const byValuePresence = vs.find((v) => {
    if (!enabledIds.includes(String(v.id))) return false;
    const opts = Array.isArray(v.options)
      ? v.options
      : Array.isArray(v.options_array)
      ? v.options_array
      : [];
    const colorLikeValues = opts.map(String).filter((val) => colorValueSet.has(val));
    return colorLikeValues.some((val) => idEq(val, valueId));
  });
  if (byValuePresence) return String(byValuePresence.id);

  // 2) Fallback: if variant objects happen to carry a "color" field.
  const norm = (s) => String(s || '').toLowerCase().trim();
  const valueTitle = String(valueObj?.title || valueObj?.name || '').trim();
  const byName = vs.find((v) => enabledIds.includes(String(v.id)) && norm(v.color) === norm(valueTitle));
  return byName ? String(byName.id) : null;
};

const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
};

const getLowestPrice = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map(
        (v) =>
          v.price ??
          product.stripePriceIds?.[v.id]?.unitAmount ??
          product.stripePriceIds?.[v.id]?.price ??
          v.printifyPriceCents
      )
      .filter((p) => Number.isFinite(p))
      .map((p) => p / 100);
    return prices.length ? Math.min(...prices) : null;
  }
  return product.price ?? null;
};

const baseImageSrc = (product) => {
  if (!Array.isArray(product.images) || product.images.length === 0) return FALLBACK_IMAGE;
  const preferred =
    product.images.find((img) => typeof img === 'object' && img?.src && img.displayInGallery !== false) ||
    product.images.find((img) => typeof img === 'object' && img?.src) ||
    product.images[0];
  const src = typeof preferred === 'string' ? preferred : preferred?.src;
  return src || FALLBACK_IMAGE;
};

/* ───────── equalizers ───────── */
let PC_DESC_MAX = 0;
let PC_SWATCH_MAX = 0;
const setGlobalDescMin = (h) => {
  if (Number.isFinite(h) && h > PC_DESC_MAX) {
    PC_DESC_MAX = h;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--pc-desc-min', `${Math.ceil(h)}px`);
    });
  }
};
const setGlobalSwatchMin = (h) => {
  if (Number.isFinite(h) && h > PC_SWATCH_MAX) {
    PC_SWATCH_MAX = h;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--pc-swatch-min', `${Math.ceil(h)}px`);
    });
  }
};

/* ───────── color style helpers ───────── */

const PALETTE = {
  black: '#000000',
  white: '#FFFFFF',
  charcoal: '#36454F',
  'shadow grey': '#7a7d80',
  'shadow gray': '#7a7d80',
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
  khaki: '#C3B091',
  espresso: '#4b3621',
  hemp: '#7e807a',
  midnight: '#191970',
  'blue spruce': '#0a4b5f',
};
const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s || ''));
const normToken = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/solid|heather|vintage|premium|classic|unisex|men'?s|women'?s|adult|youth|tee|shirt|hoodie|tank|zip|full|pullover/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
const tokenToHex = (token) => {
  const t = normToken(token);
  if (PALETTE[t]) return PALETTE[t];
  if (t.includes('navy')) return PALETTE['true navy'];
  if (t.includes('grey')) return PALETTE['shadow grey'];
  if (t.includes('gray')) return PALETTE['shadow gray'];
  return null;
};

// Return explicit hex colors from Printify (or overrides) for a given value
const explicitHexesForValue = (val, product) => {
  const fromVal =
    (Array.isArray(val?.colors) && val.colors.length ? val.colors : null) ||
    (Array.isArray(val?.hex_colors) && val.hex_colors.length ? val.hex_colors : null) ||
    (val?.hex ? [val.hex] : null);

  const fromOverride = (() => {
    const id = String(val?.id ?? '');
    const o = product?.swatchHexOverrides?.[id] || product?.printifyColorHex?.[id];
    if (!o) return null;
    return Array.isArray(o) ? o : [o];
  })();

  const raw = fromVal || fromOverride || [];
  const isHex2 = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s));
  return raw.map(String).filter(isHex2);
};

const styleFromHexes = (hexes) => {
  if (hexes.length === 1) return { backgroundColor: hexes[0] };
  if (hexes.length >= 2) {
    const stops = hexes.slice(0, 4).map((c, i, arr) => {
      const start = Math.round((100 / arr.length) * i);
      const end = Math.round((100 / arr.length) * (i + 1));
      return `${c} ${start}% ${end}%`;
    }).join(', ');
    return { background: `linear-gradient(90deg, ${stops})` };
  }
  return { backgroundColor: '#ccc' };
};

/* ───────── optional proxy for sampling ───────── */
const USE_PROXY = false;
const proxyUrl = (url) => (USE_PROXY ? `/img-proxy?url=${encodeURIComponent(url)}` : url);

/* ───────────────── component ───────────────── */

const ProductCard = ({ product }) => {
  const { cartId } = useCart();
  const navigate = useNavigate();

  const fallbackSrcMain = baseImageSrc(product);
  const price = getLowestPrice(product);
  const delivery = product.deliveryTime || 'Varies';

  const colorIdxs = useMemo(() => getColorIdxs(product.options || []), [product.options]);
  const colorValueSet = useMemo(() => buildColorValueIdSet(product, colorIdxs), [product, colorIdxs]);
  const enabledVariantIds = useMemo(() => getEnabledVariantIds(product), [product]);
  const variantImgMap = useMemo(() => buildVariantImgMap(product), [product]);

  const baseSwatches = useMemo(() => {
    if (!colorIdxs.length) return [];

    const colorValues = colorIdxs.flatMap((idx) => product.options?.[idx]?.values || []);

    const seen = new Set();
    const uniqValues = colorValues.filter((v) => {
      const id = String(v?.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const filtered = uniqValues.filter((val) => {
      const vid = pickVariantIdForColor(product, colorIdxs, val, enabledVariantIds, colorValueSet);
      return !!vid;
    });

    return filtered.map((val, i) => {
      const variantId = pickVariantIdForColor(product, colorIdxs, val, enabledVariantIds, colorValueSet);
      const imageSrc = variantId ? variantImgMap.get(String(variantId)) : null;

      const explicitHexes = explicitHexesForValue(val, product);
      const hasExplicit = explicitHexes.length > 0;

      return {
        id: String(val.id ?? i),
        valueId: val.id,
        title: val.title || val.name || `Color ${i + 1}`,
        variantId,
        imageSrc: imageSrc || null,
        style: hasExplicit ? styleFromHexes(explicitHexes) : { backgroundColor: '#ccc' },
        needsSampling: !hasExplicit && !!imageSrc,
      };
    });
  }, [product, colorIdxs, enabledVariantIds, variantImgMap, colorValueSet]);

  const [swatchStyles, setSwatchStyles] = useState({});

  useEffect(() => {
    let cancelled = false;
    const sampleDominant = (url) =>
      new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 32, 32);
            const { data } = ctx.getImageData(0, 0, 32, 32);
            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < data.length; i += 4) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++; }
            const hex = '#' + [r/n, g/n, b/n].map(x => Math.round(x).toString(16).padStart(2,'0')).join('');
            resolve(hex);
          } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = proxyUrl(url);
      });

    (async () => {
      const updates = {};
      for (const sw of baseSwatches) {
        if (!sw.needsSampling) continue;
        const hex = await sampleDominant(sw.imageSrc);
        if (cancelled) return;
        if (hex) updates[String(sw.valueId)] = { backgroundColor: hex };
      }
      if (!cancelled && Object.keys(updates).length) {
        setSwatchStyles((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => { cancelled = true; };
  }, [baseSwatches]);

  const swatches = useMemo(
    () => baseSwatches.map((sw) => ({ ...sw, style: swatchStyles[String(sw.valueId)] || sw.style })),
    [baseSwatches, swatchStyles]
  );

  /* equalizers */
  const descRef = useRef(null);
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    let rafId = null, t = null;
    const measure = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setGlobalDescMin(el.scrollHeight));
    };
    measure();
    const onResize = () => { clearTimeout(t); t = setTimeout(measure, 60); };
    window.addEventListener('resize', onResize);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(()=>{});
    window.addEventListener('load', measure);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', measure);
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [product.description]);

  const swatchRef = useRef(null);
  useEffect(() => {
    const el = swatchRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => setGlobalSwatchMin(el.scrollHeight));
    return () => cancelAnimationFrame(raf);
  }, [swatches.length]);

  /* image preview */
  const [lockedColorId, setLockedColorId] = useState(null);
  const lockedSwatch = swatches.find((s) => s.id === lockedColorId) || null;
  const [displaySrc, setDisplaySrc] = useState(fallbackSrcMain);
  useEffect(() => {
    setDisplaySrc(lockedSwatch?.imageSrc || fallbackSrcMain);
  }, [fallbackSrcMain, lockedSwatch]);

  const goToDetails = (source) => {
    if (analytics) {
      logEvent(analytics, 'click_merch_product', {
        cartId: cartId || undefined,
        productId: product.id,
        productName: product.title || product.name,
        source,
      });
    }
    const path = product.collection === 'merchProducts' ? `/merch/${product.id}` : `/products/${product.id}`;
    navigate(path);
  };

  return (
    <div className="product-card">
      {/* Image */}
      <div
        className="product-image-container"
        onClick={() => goToDetails('card_image')}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.title || product.name}`}
      >
        <img
          src={displaySrc}
          alt={product.title || product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
        />
      </div>

      {/* Swatches row (now directly under image).
          Always render. If empty, it's a placeholder with equalized height. */}
      <div
        ref={swatchRef}
        className={`color-swatches ${swatches.length ? '' : 'placeholder'}`}
        aria-label="Color options"
      >
        {swatches.length > 0 &&
          swatches.map((sw) => (
            <button
              key={sw.id}
              type="button"
              className={`swatch ${lockedColorId === sw.id ? 'selected' : ''}`}
              style={sw.style}
              title={sw.title}
              aria-label={sw.title}
              onMouseEnter={() => { if (sw.imageSrc) setDisplaySrc(sw.imageSrc); }}
              onMouseLeave={() => { setDisplaySrc(lockedSwatch?.imageSrc || fallbackSrcMain); }}
              onClick={() => {
                setLockedColorId((prev) => (prev === sw.id ? null : sw.id));
                if (sw.imageSrc) setDisplaySrc(sw.imageSrc);
              }}
            />
          ))}
      </div>

      {/* Info */}
      <div className="product-card-info">
        <h2 className="product-name">{product.title || product.name}</h2>

        <p ref={descRef} className="product-card-description">
          {stripHtml(product.description)}
        </p>

        <div className="product-card-bottom">
          <p className="card-product-price">
            {price ? `$${price.toFixed(2)}` : 'Price Unavailable'}
          </p>
          <p className="delivery-time">Delivery: 7-10 business days</p>
          <button className="add-to-cart-button" onClick={() => goToDetails('choose_button')}>
            Choose Yours
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;