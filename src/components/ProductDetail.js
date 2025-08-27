// src/components/ProductDetail.js
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import HeritageProductDetail from './HeritageProductDetail';
import FeuzonProductDetail from './FeuzonProductDetail';
import SoundlegendProductDetail from './SoundlegendProductDetail';
import { analytics, logEvent } from '../firebaseConfig';
import './ProductDetail.css';

// If your local fallback asset may 500 in dev, you can switch this to a public URL.
const FALLBACK_IMAGE = '/fallback-images/fallback_image1.png';

// ---- helpers ---------------------------------------------------------------

const getImgUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.src || img.url || img.previewImage || '';
};

// ----------------------------------------------------------------------------

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inCart, setInCart] = useState(null);

  const [mainImage, setMainImage] = useState('');
  const [hoverImage, setHoverImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  const thumbnailContainerRef = useRef(null);

  // Fetch product
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (!productData) throw new Error('Product not found');

        const isMerch = !!productData.variants && Array.isArray(productData.variants);

        if (isMerch) {
          // Normalize & enrich variants (handle both `options` and `options_array`)
          const enabledVariantsRaw = (productData.variants || []).filter((v) => v?.is_enabled !== false);

          const enrichedVariants = enabledVariantsRaw.map((v) => {
            const rawOpts = Array.isArray(v.options) ? v.options : (Array.isArray(v.options_array) ? v.options_array : []);
            const normalizedOptions = {};

            if (Array.isArray(productData.options)) {
              productData.options.forEach((opt) => {
                const match = (opt.values || []).find((val) => rawOpts.includes(val.id));
                if (match) normalizedOptions[opt.name] = match.title;
              });
            }

            return {
              ...v,
              options: rawOpts,
              normalizedOptions,
              images: v.images || [],
              is_available: v.is_available !== false,
            };
          });

          // Filter option values that never appear in any enabled variant
          let filteredOptions = Array.isArray(productData.options) ? [...productData.options] : [];
          if (filteredOptions.length > 0) {
            const enabledIds = new Set(enrichedVariants.flatMap((v) => v.options || []));
            filteredOptions = filteredOptions.map((opt) => ({
              ...opt,
              values: (opt.values || []).filter((val) => enabledIds.has(val.id)),
            }));
          }

          const enrichedProduct = {
            ...productData,
            variants: enrichedVariants,
            options: filteredOptions, // may be []
          };

          setProduct(enrichedProduct);

          // Default variant
          const defaultVariant =
            enrichedVariants.find((v) => v.is_available) ||
            enrichedVariants[0] ||
            null;

          if (defaultVariant) {
            // Preselect options if present
            if (filteredOptions.length > 0) {
              const preselect = {};
              filteredOptions.forEach((opt) => {
                const val = (opt.values || []).find((vv) => (defaultVariant.options || []).includes(vv.id));
                if (val) preselect[opt.name] = val.title;
              });
              setSelectedOptions(preselect);
            } else {
              setSelectedOptions({});
            }

            // Price for default variant
            const stripeForDefault = enrichedProduct.stripePriceIds?.[defaultVariant.id];
            setSelectedVariant({
              ...defaultVariant,
              stripePriceId: stripeForDefault?.priceId,
              price:
                (stripeForDefault?.unitAmount ??
                  defaultVariant.price ??
                  defaultVariant.printifyPriceCents ??
                  0) / 100,
            });

            // Choose a suitable image
            const fromVariant = getImgUrl(defaultVariant.images?.[0]);
            const fromProduct = (enrichedProduct.images || []).find((img) => {
              const url = getImgUrl(img);
              if (!url?.startsWith('http')) return false;
              const ids = (img.variant_ids || []).map(String);
              // accept images with either matching variant id OR no variant binding at all
              return ids.length === 0 || ids.includes(String(defaultVariant.id));
            });
            const resolved =
              fromVariant ||
              getImgUrl(fromProduct) ||
              '';
            setMainImage(resolved || FALLBACK_IMAGE);
          } else {
            setMainImage(FALLBACK_IMAGE);
          }
        } else {
          // Non-merch (artisan) product
          setProduct(productData);
          const firstImage = (productData.images || []).find(
            (img) =>
              (typeof img === 'string' && img.startsWith('http')) ||
              (typeof img === 'object' && getImgUrl(img)?.startsWith('http'))
          );
          const resolvedImage = getImgUrl(firstImage);
          setMainImage(resolvedImage || '');
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to fetch product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

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
        Object.entries(selectedOptions).every(([k, v]) => item.config?.[k] === v)
    );
    setInCart(existingItem || null);
  }, [cart, selectedVariant, selectedOptions]);

  // When options change, try to find a matching variant and image
  useEffect(() => {
    if (!product?.variants?.length || !product?.stripePriceIds) return;

    // If no options at all (single-variant item), do nothing — default already set
    if (!Array.isArray(product.options) || product.options.length === 0) return;

    const exact = product.variants.find((v) => {
      if (v.is_enabled === false || v.is_available === false) return false;
      return product.options.every((opt) => {
        const sel = selectedOptions[opt.name];
        const match = (opt.values || []).find((val) => (v.options || []).includes(val.id));
        return sel && match && match.title === sel;
      });
    });

    if (exact) {
      const stripe = product.stripePriceIds[exact.id];
      setSelectedVariant({
        ...exact,
        stripePriceId: stripe?.priceId,
        price: (stripe?.unitAmount ?? exact.price ?? exact.printifyPriceCents ?? 0) / 100,
      });

      // image for this variant (allow unbound images too)
      const vid = String(exact.id);
      const matchedImage = (product.images || []).find((img) => {
        const ids = (img.variant_ids || []).map(String);
        const display = typeof img === 'object' ? img.displayInGallery !== false : true;
        const url = getImgUrl(img);
        return url?.startsWith('http') && display && (ids.length === 0 || ids.includes(vid));
      });
      const src = getImgUrl(matchedImage);
      setMainImage(src?.startsWith('http') ? src : FALLBACK_IMAGE);
    } else {
      // no exact match — keep a reasonable image (e.g., by chosen color)
      setSelectedVariant(null);
      const selectedColor = selectedOptions['Colors'];
      if (selectedColor) {
        const colorVariant = product.variants.find(
          (v) => v.is_enabled !== false && v.normalizedOptions?.['Colors'] === selectedColor && v.images?.length
        );
        const fallbackImage = colorVariant?.images?.[0];
        const fallbackSrc = getImgUrl(fallbackImage);
        if (fallbackSrc?.startsWith('http')) setMainImage(fallbackSrc);
      }
    }
  }, [selectedOptions, product]);

  useEffect(() => {
    if (hoverImage) {
      const img = new Image();
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

  if (productId === 'heritage') return <HeritageProductDetail product={product} />;
  if (productId === 'feuzon') return <FeuzonProductDetail product={product} />;
  if (productId === 'soundlegend') return <SoundlegendProductDetail product={product} />;

  const hasOptions = Array.isArray(product?.options) && product.options.length > 0;
  const canAdd =
    !!selectedVariant &&
    (selectedVariant.is_available !== false) &&
    (!hasOptions || Object.keys(selectedOptions).length === product.options.length);

  return (
    <div className="product-detail-container">
      <div className="back-to-merch">
        <Link to="/merch" className="back-link">← Back to Merch</Link>
      </div>

      <h1 className="product-title">{product?.title || product?.name || 'Unnamed Product'}</h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <div className="main-image-wrapper">
              <img
                src={mainImage || FALLBACK_IMAGE}
                alt="Main"
                className={`product-main-image${hoverImage ? ' faded' : ''}`}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
              />
              <img
                src={hoverImage || mainImage || FALLBACK_IMAGE}
                alt="Hover"
                className={`product-main-image hover-layer${hoverImage ? ' show' : ''}`}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
              />
            </div>

            <div className="thumbnail-scroll-container">
              <div className="product-thumbnail-gallery" ref={thumbnailContainerRef}>
                {(() => {
                  const vid = selectedVariant?.id ? String(selectedVariant.id) : null;

                  // Prefer images tied to the selected variant; if none, show any gallery images
                  const variantScoped = (product.images || []).filter((img) => {
                    const url = getImgUrl(img);
                    if (!url?.startsWith('http')) return false;
                    const display = typeof img === 'object' ? img.displayInGallery !== false : true;
                    if (!display) return false;
                    const ids = (img.variant_ids || []).map(String);
                    return vid ? ids.includes(vid) : false;
                  });

                  const galleryScoped = (product.images || []).filter((img) => {
                    const url = getImgUrl(img);
                    const display = typeof img === 'object' ? img.displayInGallery !== false : true;
                    return url?.startsWith('http') && display;
                  });

                  const list = variantScoped.length ? variantScoped : galleryScoped;

                  return (list.length ? list : []).slice(0, 12).map((img, index) => {
                    const imageUrl = getImgUrl(img) || FALLBACK_IMAGE;
                    return (
                      <button
                        key={`thumb-${index}`}
                        className="product-thumbnail"
                        onClick={() => {
                          setMainImage(imageUrl);
                          setSelectedImageIndex(index);
                        }}
                      >
                        <img
                          src={imageUrl}
                          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                          alt={`Thumbnail ${index + 1}`}
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
                  <div key={`option-${option.id || option.name || optionIdx}`} className="product-options">
                    <label>{option.name}</label>
                    <div className="option-grid">
                      {(option.values || []).map((value, idx) => {
                        const isSelected = selectedOptions[option.name] === value.title;

                        // Prefer readable token name for colors; otherwise use title.
                        const displayName =
                          (Array.isArray(value?.name_tokens) && value.name_tokens[0]) ||
                          value.title;

                        // Disable if no variant exists for this value with current other selections
                        const disabled = (() => {
                          const candidate = product.variants.find((v) => {
                            if (v.is_enabled === false || v.is_available === false) return false;
                            const vHasThisValue = (v.options || []).some((id) => id === value.id);
                            if (!vHasThisValue) return false;

                            // Check other options currently picked
                            return (product.options || []).every((opt) => {
                              if (opt.name === option.name) return true;
                              const selected = selectedOptions[opt.name];
                              if (!selected) return true;
                              const valObj = (opt.values || []).find((vv) => (v.options || []).includes(vv.id));
                              return valObj?.title === selected;
                            });
                          });
                          return !candidate;
                        })();

                        // PDP requirement: show **names only** (no swatches) for Colors;
                        // for other options (e.g., Sizes), keep text buttons as well.
                        return (
                          <button
                            key={`opt-${value.id || value.title}-${idx}`}
                            onClick={() => handleOptionSelect(option.name, value.title)}
                            onMouseEnter={() => {
                              // For color option, still preview the corresponding image on hover
                              if (/colou?r/i.test(option.name)) {
                                const hovered = product.variants.find(
                                  (v) => v.is_enabled !== false && v.normalizedOptions?.['Colors'] === value.title
                                );
                                const hVid = hovered ? String(hovered.id) : null;
                                const hoverCandidates = (product.images || []).filter((img) => {
                                  const ids = (img.variant_ids || []).map(String);
                                  const display = typeof img === 'object' ? img.displayInGallery !== false : true;
                                  const url = getImgUrl(img);
                                  return url?.startsWith('http') && display && (hVid ? ids.includes(hVid) : true);
                                });
                                const hoverImageObj = hoverCandidates[selectedImageIndex] || hoverCandidates[0];
                                const src = getImgUrl(hoverImageObj);
                                if (src) setHoverImage(src);
                              }
                            }}
                            onMouseLeave={() => setHoverImage(null)}
                            disabled={disabled}
                            title={displayName}
                            className={`option-button ${isSelected ? 'selected' : ''} ${isSelected && disabled ? 'selected-unavailable' : ''}`}
                            style={{
                              // force text-chip style: no circular swatch, no color backgrounds
                              width: 'auto',
                              height: 'auto',
                              borderRadius: '4px',
                              background: undefined,
                              color: undefined,
                              padding: '0.35rem 0.6rem',
                              lineHeight: 1.2
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
              {selectedVariant ? `$${selectedVariant.price.toFixed(2)}` : 'Select options'}
            </p>

            <div className="product-action full-width-button">
              {inCart ? (
                <div className="artisan-cart-hover-container">
                  <button className="artisan-in-cart-button" disabled>✔ In Cart</button>
                  <div className="artisan-cart-hover-options">
                    <span onClick={() => navigate('/cart')}>View Cart</span>
                    <span onClick={() => removeFromCart(`merch-${selectedVariant.stripePriceId}-${selectedVariant.id}`)}>Remove</span>
                  </div>
                </div>
              ) : (
                <button className="artisan-add-to-cart-button" onClick={addToCartWithOptions} disabled={!canAdd}>
                  {canAdd ? 'Add to Cart' : 'Unavailable'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;