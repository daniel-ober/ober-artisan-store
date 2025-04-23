import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import HeritageProductDetail from './HeritageProductDetail';
import FeuzonProductDetail from './FeuzonProductDetail';
import SoundlegendProductDetail from './SoundlegendProductDetail';
import './ProductDetail.css';

const FALLBACK_IMAGE = '/fallback-images/fallback_image1.png';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, removeFromCart, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [hoverImage, setHoverImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailContainerRef = useRef(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (!productData) throw new Error('Product not found');

        const isMerch =
          !!productData.variants && Array.isArray(productData.variants);

        if (isMerch) {
          if (!productData.options)
            throw new Error('Product is missing required fields.');
          const enabledVariants = productData.variants.filter(
            (v) => v.is_enabled && Array.isArray(v.options)
          );

          const enrichedVariants = enabledVariants.map((v) => {
            const normalizedOptions = {};
            productData.options.forEach((opt) => {
              const match = opt.values.find((val) =>
                v.options.includes(val.id)
              );
              if (match) normalizedOptions[opt.name] = match.title;
            });

            return {
              ...v,
              normalizedOptions,
              options: v.options || [],
              images: v.images || [],
            };
          });

          const enabledOptionIds = new Set(
            enabledVariants.flatMap((v) => v.options || [])
          );
          const filteredOptions = productData.options.map((opt) => ({
            ...opt,
            values: opt.values
              .filter((v) => enabledOptionIds.has(v.id))
              .map((v) => ({ ...v })),
          }));

          const enrichedProduct = {
            ...productData,
            variants: enrichedVariants,
            options: filteredOptions,
          };

          setProduct(enrichedProduct);

          const defaultVariant = enrichedVariants.find(
            (v) =>
              v.is_available &&
              Object.keys(v.normalizedOptions || {}).every((key) =>
                productData.options.some((opt) => opt.name === key)
              )
          );

          if (defaultVariant) {
            setSelectedOptions({ ...defaultVariant.normalizedOptions });
            setSelectedVariant({
              ...defaultVariant,
              price:
                productData.stripePriceIds?.[defaultVariant.id]?.unitAmount /
                100,
              stripePriceId:
                productData.stripePriceIds?.[defaultVariant.id]?.priceId,
            });

            const variantImage = defaultVariant.images?.[0];
            const resolvedMainImage =
              typeof variantImage === 'string'
                ? variantImage
                : variantImage?.src || FALLBACK_IMAGE;

            setMainImage(resolvedMainImage);
          } else {
            setMainImage(FALLBACK_IMAGE);
          }
        } else {
          setProduct(productData);
          const firstImage = match.images?.find(
            (img) =>
              (typeof img === 'string' && img.startsWith('http')) ||
              (typeof img === 'object' && img?.src?.startsWith('http'))
          );

          const resolvedImage =
            typeof firstImage === 'string' ? firstImage : firstImage?.src;

          setMainImage(resolvedImage || ''); // only show fallback if broken at render
        }
      } catch (fetchError) {
        setError('Unable to fetch product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  useEffect(() => {
    if (product) {
      const cartItem = cart.find((item) => item.id === product.id);
      setInCart(cartItem || null);
    }
  }, [cart, product]);

  useEffect(() => {
    if (
      !product?.variants ||
      !product?.stripePriceIds ||
      !product?.options?.length
    )
      return;

    // Try to match both selected color AND size
    const exactMatch = product.variants.find(
      (v) =>
        v.is_enabled &&
        v.is_available &&
        product.options.every((opt) => {
          const selected = selectedOptions[opt.name];
          return selected && v.normalizedOptions?.[opt.name] === selected;
        })
    );

    if (exactMatch && product.stripePriceIds[exactMatch.id]) {
      const stripeData = product.stripePriceIds[exactMatch.id];
      setSelectedVariant({
        ...exactMatch,
        stripePriceId: stripeData.priceId,
        price: stripeData.unitAmount / 100,
      });

      const image = exactMatch.images?.[0];
      const src = typeof image === 'string' ? image : image?.src;
      setMainImage(src?.startsWith('http') ? src : '');
    } else {
      setSelectedVariant(null);

      // ✅ Try to resolve image by color only — even if size is unavailable
      const selectedColor = selectedOptions['Colors'];
      const colorVariant = product.variants.find(
        (v) =>
          v.is_enabled &&
          v.normalizedOptions?.['Colors'] === selectedColor &&
          v.images?.length
      );

      const fallbackImage = colorVariant?.images?.[0];
      const fallbackSrc =
        typeof fallbackImage === 'string' ? fallbackImage : fallbackImage?.src;

      setMainImage(fallbackSrc?.startsWith('http') ? fallbackSrc : '');
    }
  }, [selectedOptions, product]);

  useEffect(() => {
    if (hoverImage) {
      const img = new Image();
      img.src = hoverImage;
    }
  }, [hoverImage]);

  const handleOptionSelect = (optionName, valueTitle) => {
    const updatedOptions = { ...selectedOptions, [optionName]: valueTitle };

    if (optionName === 'Colors') {
      const selectedSize = selectedOptions['Sizes'];
      const sizeExistsForColor = product.variants.some(
        (v) =>
          v.is_enabled &&
          v.is_available &&
          v.normalizedOptions?.['Colors'] === valueTitle &&
          v.normalizedOptions?.['Sizes'] === selectedSize
      );

      // If the selected size isn't available, keep it selected but don't change it
      // (we still keep the button highlighted & greyed out visually)
      if (!sizeExistsForColor) {
        // Nothing needs to be changed — just leave the current selected size as is
        // This aligns with your desired UX
      }
    }

    setSelectedOptions(updatedOptions);
  };

  const isOptionValueAvailable = (optionName, valueTitle) => {
    return product.variants.some(
      (v) =>
        v.is_enabled &&
        v.is_available &&
        v.normalizedOptions?.[optionName] === valueTitle
    );
  };

  const isColorOptionCompletelyUnavailable = (optionName, valueTitle) => {
    const matchingVariants = product.variants.filter(
      (v) => v.is_enabled && v.normalizedOptions?.[optionName] === valueTitle
    );
    return matchingVariants.every((v) => !v.is_available);
  };

  const addToCartWithOptions = () => {
    if (!selectedVariant) return;
    addToCart(
      {
        id: product.id,
        name: product.title || product.name,
        description: product.description || '',
        images: selectedVariant.images || product.images,
        price: selectedVariant.price,
        stripePriceId: selectedVariant.stripePriceId,
        isPreOrder: false,
        deliveryTime: product.deliveryTime || '2–5 business days',
        currentQuantity: 1,
        maxQuantity: 1,
      },
      {
        quantity: 1,
        ...selectedOptions,
        variantId: selectedVariant.id,
      }
    );
  };

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

  if (productId === 'heritage')
    return <HeritageProductDetail product={product} />;
  if (productId === 'feuzon') return <FeuzonProductDetail product={product} />;
  if (productId === 'soundlegend')
    return <SoundlegendProductDetail product={product} />;

  return (
    <div className="product-detail-container">
      <h1 className="product-title">
        {product?.title || product?.name || 'Unnamed Product'}
      </h1>

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
              <div
                className="product-thumbnail-gallery"
                ref={thumbnailContainerRef}
              >
               {(() => {
  const selectedColor = selectedOptions['Colors'];

  // ✅ Find a variant with this color (regardless of size availability)
  const colorVariantWithImages = product.variants.find(
    (v) =>
      v.is_enabled &&
      v.normalizedOptions?.['Colors'] === selectedColor &&
      Array.isArray(v.images) &&
      v.images.some((img) => {
        const url = typeof img === 'string' ? img : img?.src;
        return url?.startsWith('http');
      })
  );

  const validImages = (colorVariantWithImages?.images || []).filter((img) => {
    const url = typeof img === 'string' ? img : img?.src;
    return url?.startsWith('http');
  });

  return validImages.length > 0
    ? validImages.map((img, index) => {
        const imageUrl = typeof img === 'string' ? img : img?.src;
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
      })
    : [
        <button key="thumb-fallback" className="product-thumbnail disabled">
          <img src={FALLBACK_IMAGE} alt="No image available" />
        </button>,
      ];
})()}

              </div>
            </div>
          </div>

          <div className="product-info">
            <h2>Product Specifications</h2>
            <p className="product-price">
              {selectedVariant
                ? `$${selectedVariant.price.toFixed(2)}`
                : product.price
                  ? `$${product.price.toFixed(2)}`
                  : 'Select options'}
            </p>

            {!!product?.options?.length &&
              [...product.options]
                .sort((a, b) => {
                  const order = { Colors: 0, Sizes: 1 }; // enforce order
                  return (order[a.name] ?? 99) - (order[b.name] ?? 99);
                })
                .map((option, optionIdx) => (
                  <div
                    key={`option-${option.id || option.name || optionIdx}`}
                    className="product-options"
                  >
                    <label>{option.name}</label>
                    <div className="option-grid">
                      {option.values.map((value, idx) => {
                        const isSelected =
                          selectedOptions[option.name] === value.title;
                        const hasColors =
                          Array.isArray(value.colors) &&
                          value.colors.length > 0;
                        const swatchBackground = hasColors
                          ? value.colors.length === 1
                            ? value.colors[0]
                            : `linear-gradient(to right, ${value.colors[0]} 50%, ${value.colors[1]} 50%)`
                          : '#ccc';

                        const disabled = (() => {
                          if (option.name === 'Colors') {
                            return isColorOptionCompletelyUnavailable(
                              option.name,
                              value.title
                            );
                          }

                          // For Sizes — only enable if there's an available variant matching current color + this size
                          // Size: disable if not available for current color
                          const selectedColor = selectedOptions['Colors'];
                          const variantExists = product.variants.some(
                            (v) =>
                              v.is_enabled &&
                              v.is_available &&
                              v.normalizedOptions?.['Colors'] ===
                                selectedColor &&
                              v.normalizedOptions?.[option.name] === value.title
                          );
                          return !variantExists;
                        })();

                        return (
                          <button
                            key={`swatch-${value.id || value.title}-${idx}`}
                            onClick={() =>
                              handleOptionSelect(option.name, value.title)
                            }
                            onMouseEnter={() => {
                              if (option.name !== 'Colors') return;

                              const hoveredColor = value.title;

                              // Always preview the first available variant with this color
                              const hoverVariant = product.variants.find(
                                (v) =>
                                  v.is_enabled &&
                                  v.is_available &&
                                  v.normalizedOptions?.['Colors'] ===
                                    hoveredColor
                              );

                              if (hoverVariant?.images?.length) {
                                const hoverImages = hoverVariant.images;
                                const hoverImageAtIndex =
                                  hoverImages[selectedImageIndex] ||
                                  hoverImages[0];
                                const src =
                                  typeof hoverImageAtIndex === 'string'
                                    ? hoverImageAtIndex
                                    : hoverImageAtIndex?.src;
                                setHoverImage(src || FALLBACK_IMAGE);
                              }
                            }}
                            onMouseLeave={() => setHoverImage(null)}
                            disabled={disabled}
                            title={value.title}
                            className={`option-button ${isSelected ? 'selected' : ''} ${
                              isSelected && disabled
                                ? 'selected-unavailable'
                                : ''
                            }`}
                            style={{
                              width: hasColors ? 32 : 'auto',
                              height: hasColors ? 32 : 'auto',
                              borderRadius: hasColors ? '50%' : '4px',
                              background: hasColors
                                ? swatchBackground
                                : undefined,
                              color: hasColors ? 'transparent' : undefined,
                            }}
                          >
                            {!hasColors && value.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

            <div className="product-action">
              {inCart ? (
                <div className="artisan-cart-hover-container">
                  <button className="artisan-in-cart-button" disabled>
                    ✔ In Cart
                  </button>
                  <div className="artisan-cart-hover-options">
                    <span onClick={() => navigate('/cart')}>View Cart</span>
                    <span onClick={() => removeFromCart(product.id)}>
                      Remove
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  className="artisan-add-to-cart-button"
                  onClick={addToCartWithOptions}
                  disabled={!selectedVariant || !selectedVariant.is_available}
                >
                  {!selectedVariant || !selectedVariant.is_available
                    ? 'Unavailable'
                    : 'Add to Cart'}
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
