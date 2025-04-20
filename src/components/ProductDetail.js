import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import HeritageProductDetail from './HeritageProductDetail';
import FeuzonProductDetail from './FeuzonProductDetail';
import SoundlegendProductDetail from './SoundlegendProductDetail';
import './ProductDetail.css';

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
        console.log('🧾 Fetched product:', productData);

        if (!productData) throw new Error('Product not found');

        // Check if this is a merch product (with variants)
        const isMerch = !!productData.variants && Array.isArray(productData.variants);

        if (isMerch) {
          if (!productData.options) throw new Error('Product is missing required fields.');

          const enabledVariants = productData.variants.filter(v => v.is_enabled);

          const enrichedVariants = enabledVariants.map(v => {
            const normalizedOptions = {};
            productData.options.forEach(opt => {
              const match = opt.values.find(val => v.options.includes(val.id));
              if (match) normalizedOptions[opt.name] = match.title;
            });
            return { ...v, normalizedOptions };
          });

          const enabledOptionIds = new Set(enabledVariants.flatMap(v => v.options));
          const filteredOptions = productData.options.map(opt => ({
            ...opt,
            values: opt.values.filter(v => enabledOptionIds.has(v.id))
          }));

          setProduct({ ...productData, variants: enrichedVariants, options: filteredOptions });

          const defaultVariant = enrichedVariants.find(v => v.is_available);
          if (defaultVariant) {
            const initialOptions = {};
            productData.options.forEach(opt => {
              const selectedVal = defaultVariant.normalizedOptions?.[opt.name];
              if (selectedVal) initialOptions[opt.title] = selectedVal;
            });
            setSelectedOptions(initialOptions);

            if (defaultVariant.images?.length) {
              setMainImage(defaultVariant.images[0]);
            }
          }
        } else {
          // Non-merch product (artisan or misc)
          setProduct(productData);
          if (productData.images?.length) setMainImage(productData.images[0]);
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
      const cartItem = cart.find(item => item.id === product.id);
      setInCart(cartItem || null);
    }
  }, [cart, product]);

  useEffect(() => {
    if (!product?.variants || !product?.stripePriceIds || !product?.options?.length) return;

    const match = product.variants.find(v =>
      v.is_available &&
      product.options.every(opt => {
        const selected = selectedOptions[opt.title];
        return selected && v.normalizedOptions?.[opt.name] === selected;
      })
    );

    if (match && product.stripePriceIds[match.id]) {
      const stripeData = product.stripePriceIds[match.id];
      setSelectedVariant({
        ...match,
        stripePriceId: stripeData.priceId,
        price: stripeData.unitAmount / 100,
      });
      if (match.images?.length) setMainImage(match.images[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedOptions, product]);

  const handleOptionSelect = (optionTitle, valueTitle) => {
    setSelectedOptions(prev => ({ ...prev, [optionTitle]: valueTitle }));
  };

  const isOptionValueAvailable = (optionTitle, valueTitle) => {
    if (!optionTitle || !valueTitle || !product?.variants?.length) return false;
    const optionMeta = product.options.find(o => o.title === optionTitle);
    if (!optionMeta) return false;
    const key = optionMeta.name;
    const val = valueTitle.toLowerCase().trim();
    const match = product.variants.find(v => {
      const variantVal = v.normalizedOptions?.[key]?.toLowerCase().trim();
      return variantVal === val && v.is_enabled && v.is_available;
    });
    return !!match;
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

  if (productId === 'heritage') return <HeritageProductDetail product={product} />;
  if (productId === 'feuzon') return <FeuzonProductDetail product={product} />;
  if (productId === 'soundlegend') return <SoundlegendProductDetail product={product} />;

  return (
    <div className="product-detail-container">
      <h1 className="product-title">{product?.title || product?.name || 'Unnamed Product'}</h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <img
              src={mainImage}
              alt={product?.title || product?.name}
              className="product-main-image"
            />
            <div className="thumbnail-scroll-container">
              <div className="product-thumbnail-gallery" ref={thumbnailContainerRef}>
                {(selectedVariant?.images || product?.images || []).map((src, index) => (
                  <button key={`thumb-${index}`} className="product-thumbnail" onClick={() => setMainImage(src)}>
                    <img src={src} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="product-info">
            <h2>Product Specifications</h2>
            <p className="product-price">
              {selectedVariant ? `$${selectedVariant.price.toFixed(2)}` : product.price ? `$${product.price.toFixed(2)}` : 'Select options'}
            </p>

            {product.options?.map((option, optionIdx) => (
              <div key={`option-${option.id || option.title || optionIdx}`} className="product-options">
                <label>{option.title}</label>
                <div className="option-grid">
                  {option.values.map((value, idx) => {
                    const isSelected = selectedOptions[option.title] === value.title;
                    const isAvailable = isOptionValueAvailable(option.title, value.title);
                    return (
                      <button
                        key={`option-${option.id}-value-${value.id || value.title}-${idx}`}
                        onClick={() => handleOptionSelect(option.title, value.title)}
                        disabled={!isAvailable}
                        className={`option-button${isSelected ? ' selected' : ''}${!isAvailable ? ' disabled' : ''}`}
                      >
                        {value.title}
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
                    <span onClick={() => removeFromCart(product.id)}>Remove</span>
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