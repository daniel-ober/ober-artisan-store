import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from '../firebaseConfig';
import './EditMerchProductModal.css';

const currency = 'usd';

const EditMerchProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // UI selections
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [defaultVariantId, setDefaultVariantId] = useState(null);
  const [defaultImageIndex, setDefaultImageIndex] = useState(null);

  // local editable copies
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // local editable variant prices by id (in dollars for UI)
  const [variantPrices, setVariantPrices] = useState({}); // { [variantId]: number }
  const [dirtyVariantIds, setDirtyVariantIds] = useState(new Set()); // track which changed
  const [bulkPriceAll, setBulkPriceAll] = useState('');
  const [bulkPriceColor, setBulkPriceColor] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!productId || typeof productId !== 'string') {
          setError('Invalid product ID');
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'merchProducts', productId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError('Product not found');
          setLoading(false);
          return;
        }

        const data = snap.data() || {};

        const safeImages = Array.isArray(data.images)
          ? data.images.map((img = {}, i) => ({
              _index: i,
              src: typeof img.src === 'string' ? img.src : '',
              variant_ids: Array.isArray(img.variant_ids)
                ? img.variant_ids.map(String)
                : [],
              displayInGallery:
                typeof img.displayInGallery === 'boolean'
                  ? img.displayInGallery
                  : true,
            }))
          : [];

        const safeVariants = Array.isArray(data.variants)
          ? data.variants.filter((v) => v?.is_enabled && v?.is_available)
          : [];

        // Build a Colors map (title -> variant.id) for dropdowns
        const optionsList = Array.isArray(data.options) ? data.options : [];
        const colorOption =
          optionsList.find((opt) => /color/i.test(opt?.name || '')) ||
          optionsList[0] ||
          null;
        const colorIndex = colorOption ? optionsList.indexOf(colorOption) : 0;

        const colorEntries = [];
        safeVariants.forEach((v) => {
          const optId = v?.options?.[colorIndex];
          const matched = colorOption?.values?.find((x) => x.id === optId);
          if (matched?.title) colorEntries.push([matched.title, String(v.id)]);
        });

        // De-dup by title (keep first seen)
        const titleToId = new Map();
        for (const [t, id] of colorEntries)
          if (!titleToId.has(t)) titleToId.set(t, id);

        // Prepare variant price map
        const vPrices = {};
        safeVariants.forEach((v) => {
          const rawCents = Number.isFinite(v?.priceCents)
            ? v.priceCents
            : Number.isFinite(v?.price)
              ? Math.round(Number(v.price) * 100)
              : null;
          vPrices[String(v.id)] = rawCents ? rawCents / 100 : 0;
        });

        // Defaults
        const initialDefaultVariantId =
          String(data.defaultVariantId || '') ||
          (safeVariants.length ? String(safeVariants[0].id) : null);

        // pick first image matching default variant for defaultImageIndex if missing
        let initialDefaultImageIndex =
          typeof data.defaultImageIndex === 'number'
            ? data.defaultImageIndex
            : null;
        if (
          initialDefaultImageIndex === null &&
          safeImages.length &&
          initialDefaultVariantId
        ) {
          const idx = safeImages.findIndex((img) =>
            img.variant_ids.includes(String(initialDefaultVariantId))
          );
          initialDefaultImageIndex = idx >= 0 ? idx : 0;
        }

        setProduct({
          id: snap.id,
          ...data,
          variants: safeVariants,
          options: optionsList,
        });
        setImages(safeImages);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDefaultVariantId(initialDefaultVariantId);
        setSelectedVariantId(initialDefaultVariantId);
        setDefaultImageIndex(initialDefaultImageIndex);
        setVariantPrices(vPrices);
      } catch (e) {
        console.error(e);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Unique color options + groupings: one entry per COLOR (not per size)
  const { colorOptions, colorGroups, variantIdToColor } = useMemo(() => {
    const out = { colorOptions: [], colorGroups: {}, variantIdToColor: {} };
    if (!product?.variants?.length) return out;

    const opts = Array.isArray(product.options) ? product.options : [];
    const colorOption =
      opts.find((o) => /color/i.test(o?.name || '')) || opts[0] || null;
    const colorIndex = colorOption ? opts.indexOf(colorOption) : 0;

    // walk enabled variants and map each to a human color title
    const seen = new Set();
    for (const v of product.variants) {
      const optId = v?.options?.[colorIndex];
      const match = colorOption?.values?.find((x) => x.id === optId);
      const colorTitle = match?.title || `Color ${v.id}`;
      const vId = String(v.id);

      // reverse map for quick lookup
      out.variantIdToColor[vId] = colorTitle;

      // group by color
      if (!out.colorGroups[colorTitle]) out.colorGroups[colorTitle] = [];
      out.colorGroups[colorTitle].push(vId);

      // build unique color options (first variant id acts as representative)
      if (!seen.has(colorTitle)) {
        out.colorOptions.push({ id: vId, label: colorTitle }); // representative variant id for this color
        seen.add(colorTitle);
      }
    }
    return out;
  }, [product]);

  const filteredImages = useMemo(() => {
    if (!images?.length || !selectedVariantId) return [];
    return images.filter((img) =>
      img.variant_ids.includes(String(selectedVariantId))
    );
  }, [images, selectedVariantId]);

  const handleToggleImage = (index) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, displayInGallery: !img.displayInGallery } : img
      )
    );
  };

  const handleChooseDefaultImage = (index) => {
    setDefaultImageIndex(index);
  };

  const setPriceForIds = (ids = [], dollars = 0) => {
    const clean = Number(dollars);
    const val = Number.isFinite(clean) ? clean : 0;
    setVariantPrices((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[String(id)] = val;
      });
      return next;
    });
    setDirtyVariantIds((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => s.add(String(id)));
      return s;
    });
  };

  const handlePriceChangeColor = (colorTitle, dollars) => {
    const ids = colorGroups[colorTitle] || [];
    setPriceForIds(ids, dollars);
  };

  const applyBulkAll = () => {
    const allIds = Object.keys(variantPrices);
    setPriceForIds(allIds, bulkPriceAll);
  };

  const applyBulkSelectedColor = () => {
    if (!selectedVariantId) return;
    const colorTitle = variantIdToColor[String(selectedVariantId)];
    if (!colorTitle) return;
    handlePriceChangeColor(colorTitle, bulkPriceColor);
  };

  const getColorPrice = (colorTitle) => {
    const ids = colorGroups[colorTitle] || [];
    const firstId = ids[0];
    return firstId ? (variantPrices[firstId] ?? 0) : 0;
  };

  const handlePriceChange = (variantId, dollars) => {
    const clean = Number(dollars);
    setVariantPrices((p) => ({
      ...p,
      [variantId]: Number.isFinite(clean) ? clean : 0,
    }));
    setDirtyVariantIds((prev) => new Set(prev).add(String(variantId)));
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setError(null);

    try {
      // 1) Persist prices back into variants (UI stores dollars)
      const updatedVariants = (product.variants || []).map((v) => {
        const dollars = variantPrices[String(v.id)] ?? 0;
        return {
          ...v,
          priceCents: Math.round(Number(dollars) * 100),
          price: Number(dollars),
        };
      });

      // 2) Normalize images: mark the chosen image as `is_default`
      const imagesWithDefault = (images || []).map((img, i) => ({
        ...img,
        is_default: i === defaultImageIndex, // 👈 storefronts should read this
      }));

      // 3) Compute preview image (safe fallbacks)
      const chosen = imagesWithDefault.find((i) => i.is_default) || null;
      const previewImage =
        chosen?.src ||
        imagesWithDefault.find((i) =>
          (i.variant_ids || []).includes(String(defaultVariantId || ''))
        )?.src ||
        imagesWithDefault[0]?.src ||
        '';

      // 4) Compute min price (used by listings/details)
      const centsList = updatedVariants
        .map((v) => Number(v.priceCents))
        .filter((n) => Number.isFinite(n) && n > 0);
      const minPriceCents = centsList.length ? Math.min(...centsList) : null;

      // 5) Update Firestore core fields the storefront depends on
      const docRef = doc(db, 'merchProducts', product.id);
      await updateDoc(docRef, {
        title,
        description,
        images: imagesWithDefault,
        defaultVariantId,
        defaultImageIndex,
        previewImage,
        variants: updatedVariants,
        minPriceCents,
        updatedAt: new Date(),
      });

      // helper: turn a variant's options into "Color / Size" etc.
      const variantLabel = (v) => {
        const parts = (product.options || [])
          .map((opt) => {
            const match = (opt.values || []).find((val) =>
              (v.options || []).includes(val.id)
            );
            return match?.title || null;
          })
          .filter(Boolean);
        return parts.join(' / ') || `Variant ${v.id}`;
      };

      // 6) Sync changed variant prices to Stripe + Printify
      if (dirtyVariantIds.size) {
        const fn = httpsCallable(
          getFunctions(undefined, 'us-central1'),
          'syncMerchVariantPrice'
        );

        const stripeProductId =
          product?.stripeProductId ||
          product?.stripe?.productId ||
          product?.stripe_product_id;
        const printifyProductId =
          product?.printifyProductId || product?.printify_product_id;
        const shopId = product?.printifyShopId || product?.printify_shop_id;
        const stripePriceIds = product?.stripePriceIds || {};

        const changed = updatedVariants.filter((v) =>
          dirtyVariantIds.has(String(v.id))
        );

        for (const v of changed) {
          try {
            await fn({
              productId: product.id,
              variantId: String(v.id),
              newPriceCents: v.priceCents,
              currency,
              stripeProductId,
              currentStripePriceId: stripePriceIds[String(v.id)] || null,
              printify: {
                shopId,
                productId: printifyProductId,
                variantId: String(v.id),
              },
            });
          } catch (err) {
            console.error('Price sync failed for variant', v.id, err);
            setError(
              'Some prices failed to sync to Stripe/Printify. Check console logs.'
            );
          }
        }
      }

      // 7) Reflect changes immediately in the local UI
      onProductUpdated?.({
        ...product,
        title,
        description,
        images: imagesWithDefault,
        defaultVariantId,
        defaultImageIndex,
        previewImage,
        minPriceCents,
        variants: (product.variants || []).map((v) => ({
          ...v,
          priceCents: Math.round((variantPrices[String(v.id)] ?? 0) * 100),
          price: variantPrices[String(v.id)] ?? 0,
        })),
      });

      onClose?.();
    } catch (e) {
      console.error('❌ Failed to save merch product:', e);
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
      setDirtyVariantIds(new Set());
    }
  };

  if (loading) return null;
  if (!product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Merch Product</h2>
        {error && <p className="error-message">{error}</p>}

        <label className="field-label">Title:</label>
        <input
          className="text-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="field-label">Description:</label>
        <textarea
          className="textarea-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {colorOptions.length > 0 && (
          <>
            <div className="variant-row">
              <div>
                <div className="field-label">Default Color:</div>
                <select
                  className="select-input"
                  value={defaultVariantId || ''}
                  onChange={(e) => {
                    setDefaultVariantId(e.target.value);
                    if (selectedVariantId === defaultVariantId)
                      setSelectedVariantId(e.target.value);
                  }}
                >
                  {colorOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="help-text">
                  Used for the product’s default image/color on the storefront.
                </p>
              </div>

              <div>
                <div className="field-label">Working Color (preview/edit):</div>
                <select
                  className="select-input"
                  value={selectedVariantId || ''}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                >
                  {colorOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="help-text">
                  Only affects what you see here while editing (filters images &
                  pricing rows).
                </p>
              </div>
            </div>
          </>
        )}

        <div className="image-toggle-grid">
          {filteredImages.length ? (
            filteredImages.map((img) => (
              <div key={img._index} className="image-toggle-item">
                {img?.src ? (
                  <img src={img.src} alt={`Image ${img._index}`} />
                ) : (
                  <div className="image-placeholder">No image</div>
                )}

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={!!images[img._index]?.displayInGallery}
                    onChange={() => handleToggleImage(img._index)}
                  />
                  Display in Gallery
                </label>

                <label className="radio-row">
                  <input
                    type="radio"
                    name="default-image"
                    checked={defaultImageIndex === img._index}
                    onChange={() => handleChooseDefaultImage(img._index)}
                  />
                  Use as Default Image
                </label>
              </div>
            ))
          ) : (
            <p className="muted">No images available for this variant.</p>
          )}
        </div>

        {!!product?.variants?.length && (
          <>
            <div className="section-sep" />
            <h3 className="section-title">Pricing by Color</h3>

            <div className="bulk-controls">
              <div className="bulk-card">
                <div className="bulk-title">
                  Set price for <strong>all colors</strong>
                </div>
                <div className="bulk-row">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="price-input"
                    placeholder="e.g. 49.00"
                    value={bulkPriceAll}
                    onChange={(e) => setBulkPriceAll(e.target.value)}
                  />
                  <button type="button" className="btn" onClick={applyBulkAll}>
                    Apply to All
                  </button>
                </div>
              </div>

              <div className="bulk-card">
                <div className="bulk-title">
                  Set price for <strong>selected color</strong>
                </div>
                <div className="bulk-row">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="price-input"
                    placeholder="e.g. 49.00"
                    value={bulkPriceColor}
                    onChange={(e) => setBulkPriceColor(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={applyBulkSelectedColor}
                  >
                    Apply to Selected
                  </button>
                </div>
              </div>
            </div>

            <div className="variant-price-table">
              <div className="vpt header">
                <div>Color</div>
                <div>Price (USD)</div>
              </div>
              {colorOptions.map((o) => {
                const colorTitle = o.label;
                const value = getColorPrice(colorTitle);
                return (
                  <div key={o.id} className="vpt row">
                    <div>{colorTitle}</div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="price-input"
                        value={value}
                        onChange={(e) =>
                          handlePriceChangeColor(colorTitle, e.target.value)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="tiny-note">
              Prices apply to <em>all sizes</em> within each color. Saving
              updates Firestore and syncs changed prices to Stripe &amp;
              Printify.
            </p>
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMerchProductModal;
