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
          console.log('📦 productData.options', productData.options);

          const enabledVariants = productData.variants.filter(
            (v) => v.is_enabled && Array.isArray(v.options)
          );

          const enrichedVariants = enabledVariants.map((v) => {
            const normalizedOptions = {};
            if (
              Array.isArray(v.options) &&
              Array.isArray(productData.options)
            ) {
              productData.options.forEach((opt) => {
                const match = opt.values.find((val) =>
                  v.options.includes(val.id)
                );
                if (match) {
                  normalizedOptions[opt.name] = match.title;
                }
              });
            }

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

          console.log('🧪 enrichedVariants', enrichedVariants);
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
              price: productData.stripePriceIds?.[defaultVariant.id]?.unitAmount / 100,
              stripePriceId: productData.stripePriceIds?.[defaultVariant.id]?.priceId,
            });
          
            const variantImage = defaultVariant.images?.[0];
            const resolvedMainImage =
              typeof variantImage === 'string'
                ? variantImage
                : variantImage?.src || FALLBACK_IMAGE;
          
            console.log('✅ Default variant set:', defaultVariant);
            console.log('🖼️ Resolved default main image:', resolvedMainImage);
            setMainImage(resolvedMainImage);
          } else {
            console.warn('⚠️ No valid default variant found at all.');
            setMainImage(FALLBACK_IMAGE);
          }
        } else {
          setProduct(productData);
          const firstImage = productData.images?.[0];
          const resolvedImage =
            typeof firstImage === 'string' ? firstImage : firstImage?.src;
          setMainImage(resolvedImage || FALLBACK_IMAGE);
        }
      } catch (fetchError) {
        console.error('❌ Error fetching product:', fetchError);
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

      const match = product.variants.find(
        (v) =>
          v.is_available &&
          product.options.every((opt) => {
            const selected = selectedOptions[opt.name];
            return selected && v.normalizedOptions?.[opt.name] === selected;
          })
      );

    if (match && product.stripePriceIds[match.id]) {
      const stripeData = product.stripePriceIds[match.id];

      console.log('🧩 Selected variant images:', match.images); // 👈 add this line

      setSelectedVariant({
        ...match,
        stripePriceId: stripeData.priceId,
        price: stripeData.unitAmount / 100,
      });

      const firstImage = match.images?.[0];
      const imageUrl =
        typeof firstImage === 'string' ? firstImage : firstImage?.src;
      setMainImage(imageUrl || FALLBACK_IMAGE);
    } else {
      setSelectedVariant(null);
      setMainImage(FALLBACK_IMAGE);
    }
  }, [selectedOptions, product]);

  const handleOptionSelect = (optionName, valueTitle) => {
    const updatedOptions = { ...selectedOptions, [optionName]: valueTitle };
    setSelectedOptions(updatedOptions);
  };

  const isOptionValueAvailable = (optionName, valueTitle) => {
    if (!optionName || !valueTitle || !product?.variants?.length) return false;
    const valueLower = valueTitle.toLowerCase().trim();
    return product.variants.some(
      (v) =>
        v.is_enabled &&
        v.is_available &&
        v.normalizedOptions?.[optionName]?.toLowerCase().trim() === valueLower
    );
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
            <img
              src={mainImage || FALLBACK_IMAGE}
              alt={product?.title || product?.name}
              className="product-main-image"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div className="thumbnail-scroll-container">
              <div
                className="product-thumbnail-gallery"
                ref={thumbnailContainerRef}
              >
                {(selectedVariant?.images || [FALLBACK_IMAGE]).map(
                  (src, index) => {
                    const imageUrl =
                      typeof src === 'string'
                        ? src
                        : src?.src || FALLBACK_IMAGE;
                    return (
                      <button
                        key={`thumb-${index}`}
                        className="product-thumbnail"
                        onClick={() => setMainImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          onError={(e) => {
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                      </button>
                    );
                  }
                )}
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
              product.options.map((option, optionIdx) => (
                <div
                  key={`option-${option.id || option.name || optionIdx}`}
                  className="product-options"
                >
                  <label>{option.name}</label>
                  <div className="option-grid">
                    {option.values.map((value, idx) => {
                      const isSelected = selectedOptions[option.name] === value.title;
                      const isAvailable = isOptionValueAvailable(option.name, value.title);;

                      const hasColors =
                        Array.isArray(value.colors) && value.colors.length > 0;
                      const swatchBackground = hasColors
                        ? value.colors.length === 1
                          ? value.colors[0]
                          : `linear-gradient(to right, ${value.colors[0]} 50%, ${value.colors[1]} 50%)`
                        : '#ccc';

                      return (
                        <button
                          key={`swatch-${value.id || value.title}-${idx}`}
                          onClick={() =>
                            handleOptionSelect(option.name, value.title)
                          }
                          disabled={!isAvailable}
                          title={value.title}
                          style={{
                            width: hasColors ? 32 : 'auto',
                            height: hasColors ? 32 : 'auto',
                            borderRadius: hasColors ? '50%' : '4px',
                            background: swatchBackground,
                            border: isSelected
                              ? '2px solid black'
                              : '1px solid #999',
                            padding: hasColors ? 0 : '6px 12px',
                            fontSize: '12px',
                            color: hasColors ? 'transparent' : '#000',
                            margin: '4px',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            display: 'inline-block',
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
                  disabled={!!product.variants && !selectedVariant}
                >
                  Add to Cart
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
