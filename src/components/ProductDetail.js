import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, analytics, logEvent } from '../firebaseConfig';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import HeritageProductDetail from './HeritageProductDetail';
import FeuzonProductDetail from './FeuzonProductDetail';
import SoundlegendProductDetail from './SoundlegendProductDetail';
import MerchCarousel from './MerchCarousel';
import './ProductDetail.css';

const FALLBACK_IMAGE = '/fallback-images/fallback_image1.png';

// ---- helpers ---------------------------------------------------------------

const getImgUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.src || img.url || img.previewImage || '';
};

// Build the display list for a given variant: prefer variant-scoped images,
// else fall back to all gallery images. Sort so is_default appears first.
const buildDisplayList = (product, variantId) => {
  if (!product) return [];
  const get = (img) =>
    typeof img === 'string' ? img : img?.src || img?.url || img?.previewImage || '';
  const imgs = Array.isArray(product.images) ? product.images : [];
  const vid = variantId ? String(variantId) : null;

  const isDisplayable = (img) => {
    const url = get(img);
    if (!url?.startsWith?.('http')) return false;
    const display = typeof img === 'object' ? img.displayInGallery !== false : true;
    return display;
  };

  const variantScoped = imgs.filter((img) => {
    if (!isDisplayable(img)) return false;
    const ids = (img?.variant_ids || []).map(String);
    return vid ? ids.includes(vid) : false;
  });

  const galleryScoped = imgs.filter(isDisplayable);

  let list = variantScoped.length ? variantScoped : galleryScoped;
  // keep the same ordering rule used in thumbnails everywhere
  list = [...list].sort(
    (a, b) => (b?.is_default ? 1 : 0) - (a?.is_default ? 1 : 0)
  );
  return list;
};

// Best image for a specific variant: prefer is_default, else first displayable
const bestVariantImage = (product, variantId) => {
  if (!product || !variantId) return '';
  const vid = String(variantId);
  const imgs = Array.isArray(product.images) ? product.images : [];

  const get = (im) =>
    typeof im === 'string' ? im : im?.src || im?.url || im?.previewImage || '';

  const scoped = imgs.filter((im) => {
    const url = get(im);
    if (!url?.startsWith?.('http')) return false;
    const display =
      typeof im === 'object' ? im.displayInGallery !== false : true;
    if (!display) return false;
    const ids = (im?.variant_ids || []).map(String);
    return ids.includes(vid);
  });

  const def = scoped.find((im) => typeof im === 'object' && im.is_default);
  return get(def || scoped[0] || null);
};

// Normalize option labels based on type so UI always sees "Colors" / "Sizes"
const normalizeOptions = (options) =>
  Array.isArray(options)
    ? options.map((opt) => ({
        ...opt,
        name:
          opt?.type === 'color'
            ? 'Colors'
            : opt?.type === 'size'
              ? 'Sizes'
              : opt?.name || '',
      }))
    : options;

// Prefer previewImage / is_default, then variant-scoped, then any gallery img
const pickPreviewImage = (product, variantId) => {
  const get = (img) =>
    typeof img === 'string' ? img : img?.src || img?.url || '';
  const imgs = Array.isArray(product?.images) ? product.images : [];

  // 1) explicit field
  if (product?.previewImage) return product.previewImage;

  // 2) image flagged as default
  const def = imgs.find((i) => typeof i === 'object' && i?.is_default);
  if (def) return get(def);

  // 3) image tied to a specific variant
  if (variantId) {
    const vid = String(variantId);
    const byVariant = imgs.find((i) =>
      (i?.variant_ids || []).map(String).includes(vid)
    );
    if (byVariant) return get(byVariant);
  }

  // 4) first gallery image that’s allowed to display
  const gallery = imgs.find((i) => {
    const url = get(i);
    const display = typeof i === 'object' ? i.displayInGallery !== false : true;
    return url?.startsWith?.('http') && display;
  });
  if (gallery) return get(gallery);

  // 5) last resort
  return '';
};

/**
 * Cross-fade image manager:
 * - keeps the previous image visible until the next one is fully loaded
 * - fades new image in, then commits it as the base
 */
const useCrossfadeImage = (initialSrc) => {
  const [currentSrc, setCurrentSrc] = useState(initialSrc || '');
  const [incomingSrc, setIncomingSrc] = useState(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  const preload = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return reject(new Error('no src'));
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.decoding = 'async';
      img.fetchPriority = 'high';
      img.src = src;
    });

  const swapTo = async (nextSrc, fallback) => {
    try {
      if (!nextSrc) nextSrc = fallback;
      if (!nextSrc || nextSrc === currentSrc) return;
      const ready = await preload(nextSrc);
      setIncomingSrc(ready);
      requestAnimationFrame(() => setIncomingVisible(true));
      setTimeout(() => {
        setCurrentSrc(ready);
        setIncomingVisible(false);
        setIncomingSrc(null);
      }, 260); // keep in sync with CSS --pdp-img-crossfade
    } catch {
      if (fallback && fallback !== currentSrc) {
        setCurrentSrc(fallback);
        setIncomingSrc(null);
        setIncomingVisible(false);
      }
    }
  };

  return { currentSrc, incomingSrc, incomingVisible, swapTo };
};

// ----------------------------------------------------------------------------

const ProductDetail = () => {
  const { productId } = useParams(); // URL param
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cart } = useCart();

  // keep a local product id so we can swap PDP content without remounting
  const [activeProductId, setActiveProductId] = useState(productId);
  useEffect(() => setActiveProductId(productId), [productId]);

  const [carouselItems, setCarouselItems] = useState([]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); // first mount only
  const [isSwitching, setIsSwitching] = useState(false); // quick fade between products
  const [error, setError] = useState('');
  const [inCart, setInCart] = useState(null);

  // smooth image swapping (no fallback flash)
  const {
    currentSrc: mainImage,
    incomingSrc,
    incomingVisible,
    swapTo,
  } = useCrossfadeImage(FALLBACK_IMAGE);

  const [hoverImage, setHoverImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  const thumbnailContainerRef = useRef(null);

  // NEW: lock hero wrapper height to its measured width (prevents iOS jump)
  const heroWrapperRef = useRef(null);
  useEffect(() => {
    const el = heroWrapperRef.current;
    if (!el) return;

    const setSquare = () => {
      const w = el.clientWidth || 0;
      // lock the height to the current width (square)
      el.style.setProperty('--hero-size', `${w}px`);
    };

    // initial + on resize/orientation
    setSquare();
    const ro = new ResizeObserver(setSquare);
    ro.observe(el);
    window.addEventListener('orientationchange', setSquare);
    window.addEventListener('resize', setSquare);

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', setSquare);
      window.removeEventListener('resize', setSquare);
    };
  }, []);

  // fetch minimal merch list for carousel (runs when activeProductId changes)
  useEffect(() => {
    (async () => {
      try {
        const ref = collection(db, 'merchProducts');

        // Prefer active products; fall back to all
        let snap = await getDocs(query(ref, where('status', '==', 'active')));
        if (snap.empty) snap = await getDocs(ref);

        let items = snap.docs.map((d) => {
          const data = d.data() || {};
          const firstImg =
            data.previewImage ||
            (Array.isArray(data.images) &&
              (typeof data.images[0] === 'string'
                ? data.images[0]
                : data.images[0]?.src ||
                  data.images[0]?.url ||
                  data.images[0]?.previewImage)) ||
            FALLBACK_IMAGE;

          return {
            id: d.id,
            title: data.title || data.name || 'Untitled',
            previewImage: firstImg || FALLBACK_IMAGE,
            displayOrder: Number(data.displayOrder) || 0,
          };
        });

        // sort stable; DO NOT inject current id (prevents duplicates/jumps)
        items.sort((a, b) => a.displayOrder - b.displayOrder);
        setCarouselItems(items);
      } catch (e) {
        console.warn('[MerchCarousel] fetch failed:', e);
        setCarouselItems([]); // empty is OK; the PDP still renders
      }
    })();
  }, [activeProductId]);

  // Fetch product for the ACTIVE id (smooth swap)
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setError('');
        setIsSwitching(product !== null); // fade only after first load

        const productData = await fetchProductById(activeProductId);
        if (!productData) throw new Error('Product not found');

        const isMerch =
          !!productData.variants && Array.isArray(productData.variants);

        if (isMerch) {
          const normalizedOpts = normalizeOptions(productData.options);
          const enabledVariantsRaw = (productData.variants || []).filter(
            (v) => v?.is_enabled !== false
          );

          const enrichedVariants = enabledVariantsRaw.map((v) => {
            const rawOpts = Array.isArray(v.options)
              ? v.options
              : Array.isArray(v.options_array)
                ? v.options_array
                : [];
            const normalizedOptionsMap = {};

            if (Array.isArray(normalizedOpts)) {
              normalizedOpts.forEach((opt) => {
                const match = (opt.values || []).find((val) =>
                  rawOpts.includes(val.id)
                );
                if (match) normalizedOptionsMap[opt.name] = match.title; // keys: "Colors" / "Sizes"
              });
            }

            return {
              ...v,
              options: rawOpts,
              normalizedOptions: normalizedOptionsMap,
              images: v.images || [],
              is_available: v.is_available !== false,
            };
          });

          // filter option values to those that actually appear
          let filteredOptions = Array.isArray(normalizedOpts)
            ? [...normalizedOpts]
            : [];
          if (filteredOptions.length > 0) {
            const enabledIds = new Set(
              enrichedVariants.flatMap((v) => v.options || [])
            );
            filteredOptions = filteredOptions.map((opt) => ({
              ...opt,
              values: (opt.values || []).filter((val) =>
                enabledIds.has(val.id)
              ),
            }));
          }

          const enrichedProduct = {
            ...productData,
            variants: enrichedVariants,
            options: filteredOptions,
          };

          setProduct(enrichedProduct);

          // default variant
          // default variant
          const defaultVariant =
            enrichedVariants.find(
              (v) => String(v.id) === String(productData.defaultVariantId)
            ) ||
            enrichedVariants.find((v) => v.is_available) ||
            enrichedVariants[0] ||
            null;

          if (defaultVariant) {
            // preselect options if present
            if (filteredOptions.length > 0) {
              const preselect = {};
              filteredOptions.forEach((opt) => {
                const val = (opt.values || []).find((vv) =>
                  (defaultVariant.options || []).includes(vv.id)
                );
                if (val) preselect[opt.name] = val.title;
              });
              setSelectedOptions(preselect);
            } else {
              setSelectedOptions({});
            }

            // price for default variant
            const stripeForDefault =
              enrichedProduct.stripePriceIds?.[defaultVariant.id];
            setSelectedVariant({
              ...defaultVariant,
              stripePriceId: stripeForDefault?.priceId,
              price:
                (stripeForDefault?.unitAmount ??
                  defaultVariant.price ??
                  defaultVariant.printifyPriceCents ??
                  0) / 100,
            });

            // choose initial hero that aligns with the default variant
            const initialHero =
              pickPreviewImage(enrichedProduct, defaultVariant?.id) ||
              FALLBACK_IMAGE;
            swapTo(initialHero, FALLBACK_IMAGE);
          } else {
            swapTo(FALLBACK_IMAGE, FALLBACK_IMAGE);
          }
        } else {
          // Non-merch
          setProduct(productData);
          const firstImage = (productData.images || []).find(
            (img) =>
              (typeof img === 'string' && img.startsWith('http')) ||
              (typeof img === 'object' && getImgUrl(img)?.startsWith('http'))
          );
          const resolvedImage = getImgUrl(firstImage) || FALLBACK_IMAGE;
          swapTo(resolvedImage, FALLBACK_IMAGE);
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to fetch product details. Please try again later.');
      } finally {
        setLoading(false);
        setIsSwitching(false); // end fade
      }
    };

    if (activeProductId) fetchProductData();
  }, [activeProductId]);

  // Keep inCart in sync
  useEffect(() => {
    if (!selectedVariant) {
      setInCart(null);
      return;
    }
    const variantId = `merch-${selectedVariant.stripePriceId}-${selectedVariant.id}`;
    const existingItem = cart.find(
      (item) =>
        item.id === variantId &&
        Object.entries(selectedOptions).every(
          ([k, v]) => item.config?.[k] === v
        )
    );
    setInCart(existingItem || null);
  }, [cart, selectedVariant, selectedOptions]);

  // When options change, select matching variant + image
  useEffect(() => {
    if (!product?.variants?.length || !product?.stripePriceIds) return;
    if (!Array.isArray(product.options) || product.options.length === 0) return;

    const exact = product.variants.find((v) => {
      if (v.is_enabled === false || v.is_available === false) return false;
      return product.options.every((opt) => {
        const sel = selectedOptions[opt.name];
        const match = (opt.values || []).find((val) =>
          (v.options || []).includes(val.id)
        );
        return sel && match && match.title === sel;
      });
    });

    if (exact) {
      const stripe = product.stripePriceIds[exact.id];
      setSelectedVariant({
        ...exact,
        stripePriceId: stripe?.priceId,
        price:
          (stripe?.unitAmount ?? exact.price ?? exact.printifyPriceCents ?? 0) /
          100,
      });

      const heroForVariant =
        bestVariantImage(product, exact.id) ||
        pickPreviewImage(product, exact.id) ||
        FALLBACK_IMAGE;

      swapTo(heroForVariant, FALLBACK_IMAGE);
    } else {
      setSelectedVariant(null);
      const selectedColor = selectedOptions['Colors'];
      if (selectedColor) {
        const colorVariant = product.variants.find(
          (v) =>
            v.is_enabled !== false &&
            v.normalizedOptions?.['Colors'] === selectedColor &&
            v.images?.length
        );
        const fallbackImage = colorVariant?.images?.[0];
        const fallbackSrc = getImgUrl(fallbackImage);
        if (fallbackSrc?.startsWith('http'))
          swapTo(fallbackSrc, FALLBACK_IMAGE);
      }
    }
  }, [selectedOptions, product]);

  useEffect(() => {
    if (hoverImage) {
      const img = new Image();
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.src = hoverImage;
    }
  }, [hoverImage]);

  const handleOptionSelect = (optionName, valueTitle) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: valueTitle }));
  };

  const addToCartWithOptions = () => {
    if (!selectedVariant) return;

    const cartItemId = `merch-${selectedVariant.stripePriceId}-${selectedVariant.id}`;

    const cartItem = {
      id: cartItemId,
      productId: product.id,
      name: product.title || product.name,
      description: product.description || '',
      images: selectedVariant.images || product.images,
      price: selectedVariant.price,
      stripePriceId: selectedVariant.stripePriceId,
      isPreOrder: false,
      deliveryTime: product.deliveryTime || '7–10 business days',
      currentQuantity: 10,
      maxQuantity: 10,
      variantId: selectedVariant.id,
      category: 'merch',
    };

    const cartMetadata = { quantity: 1, ...selectedOptions };

    if (analytics) {
      logEvent(analytics, 'add_to_cart', {
        productId: product.id,
        productName: product.title || product.name,
        variantId: selectedVariant?.id || null,
        price: selectedVariant?.price || 0,
        category: 'merch',
      });
    }

    addToCart(cartItem, cartMetadata);
    setInCart({ ...cartItem, options: { ...selectedOptions } });
  };

  // ------- render -----------------------------------------------------------

  if (loading) return <p>Loading product details...</p>;
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <Link to="/products">Return to Products</Link>
      </div>
    );
  }
  if (!product) return <div>Product not found</div>;

  // special artisan slugs
  if (activeProductId === 'heritage')
    return <HeritageProductDetail product={product} />;
  if (activeProductId === 'feuzon')
    return <FeuzonProductDetail product={product} />;
  if (activeProductId === 'soundlegend')
    return <SoundlegendProductDetail product={product} />;

  const hasOptions =
    Array.isArray(product?.options) && product.options.length > 0;
  const canAdd =
    !!selectedVariant &&
    selectedVariant.is_available !== false &&
    (!hasOptions ||
      Object.keys(selectedOptions).length === product.options.length);

  return (
    <div className="product-detail-container">
      <MerchCarousel
        items={carouselItems}
        activeId={activeProductId}
        onSelect={(id) => {
          if (!id || id === activeProductId) return;
          // reset PDP state (but DO NOT clear main image; crossfade handles it)
          setSelectedOptions({});
          setSelectedVariant(null);
          setHoverImage(null);
          setSelectedImageIndex(0);
          setActiveProductId(id);
          try {
            window.history.replaceState(null, '', `/merch/${id}`);
          } catch {}
        }}
      />

      <div className={`pdp-fade ${isSwitching ? 'switching' : ''}`}>
        <h1 className="product-title">
          {product?.title || product?.name || 'Unnamed Product'}
        </h1>

        <div className="product-content">
          <div className="product-gallery-info">
            <div className="product-image-gallery">
              <div className="main-image-wrapper" ref={heroWrapperRef}>
                {/* Base (committed) */}
                <img
                  src={mainImage || FALLBACK_IMAGE}
                  alt="Main"
                  className="product-main-image"
                  decoding="async"
                  fetchpriority="high"
                  width="1000"
                  height="1000"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                />

                {/* Incoming (cross-fade) */}
                {incomingSrc && (
                  <img
                    src={incomingSrc}
                    alt="Incoming"
                    className={`product-main-image incoming${
                      incomingVisible ? ' show' : ''
                    }`}
                    decoding="async"
                    fetchpriority="high"
                    width="1000"
                    height="1000"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}

                {/* Hover overlay (unchanged) */}
                <img
                  src={hoverImage || mainImage || FALLBACK_IMAGE}
                  alt="Hover"
                  className={`product-main-image hover-layer${
                    hoverImage ? ' show' : ''
                  }`}
                  width="1000"
                  height="1000"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                />
              </div>

              <div className="thumbnail-scroll-container">
                <div
                  className="product-thumbnail-gallery"
                  ref={thumbnailContainerRef}
                >
                  {(() => {
                    const vid = selectedVariant?.id
                      ? String(selectedVariant.id)
                      : null;

                    const variantScoped = (product.images || []).filter(
                      (img) => {
                        const url = getImgUrl(img);
                        if (!url?.startsWith('http')) return false;
                        const display =
                          typeof img === 'object'
                            ? img.displayInGallery !== false
                            : true;
                        if (!display) return false;
                        const ids = (img.variant_ids || []).map(String);
                        return vid ? ids.includes(vid) : false;
                      }
                    );

                    const galleryScoped = (product.images || []).filter(
                      (img) => {
                        const url = getImgUrl(img);
                        const display =
                          typeof img === 'object'
                            ? img.displayInGallery !== false
                            : true;
                        return url?.startsWith('http') && display;
                      }
                    );

                    let list = variantScoped.length
                      ? variantScoped
                      : galleryScoped;

                    list = [...list].sort(
                      (a, b) =>
                        (b?.is_default ? 1 : 0) - (a?.is_default ? 1 : 0)
                    );

                    return (list.length ? list : [])
                      .slice(0, 12)
                      .map((img, index) => {
                        const imageUrl = getImgUrl(img) || FALLBACK_IMAGE;
                        return (
                          <button
                            key={`thumb-${index}`}
                            className="product-thumbnail"
                            onClick={() => {
                              swapTo(imageUrl, FALLBACK_IMAGE);
                              setSelectedImageIndex(index);
                            }}
                          >
                            <img
                              src={imageUrl}
                              onError={(e) =>
                                (e.currentTarget.src = FALLBACK_IMAGE)
                              }
                              alt={`Thumbnail ${index + 1}`}
                              width="200"
                              height="200"
                            />
                          </button>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>

            <div className="product-info">
              {hasOptions &&
                [...product.options]
                  .sort((a, b) => {
                    const order = { Colors: 0, Sizes: 1 };
                    return (order[a.name] ?? 99) - (order[b.name] ?? 99);
                  })
                  .map((option, optionIdx) => (
                    <div
                      key={`option-${option.id || option.name || optionIdx}`}
                      className="product-options"
                    >
                      <label>{option.name}</label>
                      <div className="option-grid">
                        {(option.values || []).map((value, idx) => {
                          const isSelected =
                            selectedOptions[option.name] === value.title;

                          const displayName =
                            (Array.isArray(value?.name_tokens) &&
                              value.name_tokens[0]) ||
                            value.title;

                          const disabled = (() => {
                            const candidate = product.variants.find((v) => {
                              if (
                                v.is_enabled === false ||
                                v.is_available === false
                              )
                                return false;
                              const vHasThisValue = (v.options || []).some(
                                (id) => id === value.id
                              );
                              if (!vHasThisValue) return false;

                              return (product.options || []).every((opt) => {
                                if (opt.name === option.name) return true;
                                const selected = selectedOptions[opt.name];
                                if (!selected) return true;
                                const valObj = (opt.values || []).find((vv) =>
                                  (v.options || []).includes(vv.id)
                                );
                                return valObj?.title === selected;
                              });
                            });
                            return !candidate;
                          })();

                          return (
                            <button
                              key={`opt-${value.id || value.title}-${idx}`}
                              onClick={() =>
                                handleOptionSelect(option.name, value.title)
                              }
                              onMouseEnter={() => {
                                if (/colou?r/i.test(option.name)) {
                                  const hovered = product.variants.find(
                                    (v) =>
                                      v.is_enabled !== false &&
                                      v.normalizedOptions?.['Colors'] ===
                                        value.title
                                  );
                                  const hVid = hovered
                                    ? String(hovered.id)
                                    : null;
                                  const hoverCandidates = (
                                    product.images || []
                                  ).filter((img) => {
                                    const ids = (img.variant_ids || []).map(
                                      String
                                    );
                                    const display =
                                      typeof img === 'object'
                                        ? img.displayInGallery !== false
                                        : true;
                                    const url = getImgUrl(img);
                                    return (
                                      url?.startsWith('http') &&
                                      display &&
                                      (hVid ? ids.includes(hVid) : true)
                                    );
                                  });
                                  const hoverImageObj =
                                    hoverCandidates[selectedImageIndex] ||
                                    hoverCandidates[0];
                                  const src = getImgUrl(hoverImageObj);
                                  if (src) setHoverImage(src);
                                }
                              }}
                              onMouseLeave={() => setHoverImage(null)}
                              disabled={disabled}
                              title={displayName}
                              className={`option-button ${isSelected ? 'selected' : ''} ${isSelected && disabled ? 'selected-unavailable' : ''}`}
                              style={{
                                width: 'auto',
                                height: 'auto',
                                borderRadius: '4px',
                                background: undefined,
                                color: undefined,
                                padding: '0.35rem 0.6rem',
                                lineHeight: 1.2,
                              }}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

              {product.description && (
                <div className="product-description-wrapper">
                  <div
                    className="product-description-html"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              <p className="product-price">
                {selectedVariant
                  ? `$${selectedVariant.price.toFixed(2)}`
                  : 'Select options'}
              </p>

              <div className="product-action full-width-button">
                {inCart ? (
                  <div className="artisan-cart-hover-container">
                    <button className="artisan-in-cart-button" disabled>
                      ✔ In Cart
                    </button>
                    <div className="artisan-cart-hover-options">
                      <span onClick={() => navigate('/cart')}>View Cart</span>
                      <span
                        onClick={() =>
                          removeFromCart(
                            `merch-${selectedVariant.stripePriceId}-${selectedVariant.id}`
                          )
                        }
                      >
                        Remove
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    className="artisan-add-to-cart-button"
                    onClick={addToCartWithOptions}
                    disabled={!canAdd}
                  >
                    {canAdd ? 'Add to Cart' : 'Unavailable'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
