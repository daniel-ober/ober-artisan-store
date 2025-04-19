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
  const { addToCart, updateQuantity, removeFromCart, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const thumbnailContainerRef = useRef(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (productData) {
          setProduct(productData);
          setMainImage(
            productData.images?.[0] || '/fallback-images/images-coming-soon-regular.png'
          );
        } else {
          setError('Product not found.');
        }
      } catch (fetchError) {
        console.error('Error fetching product:', fetchError.message);
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
      if (cartItem) {
        setInCart(cartItem);
        setQuantity(Math.min(cartItem.quantity, product.currentQuantity || 1));
      } else {
        setInCart(null);
        setQuantity(1);
      }
    }
  }, [cart, product]);

  useEffect(() => {
    if (product?.variants) {
      const variant = product.variants.find(
        (v) =>
          v.color === selectedColor &&
          v.size === selectedSize &&
          v.isAvailable
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedColor, selectedSize, product]);

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

  // For artisan products
  if (productId === 'heritage') return <HeritageProductDetail product={product} />;
  if (productId === 'feuzon') return <FeuzonProductDetail product={product} />;
  if (productId === 'soundlegend') return <SoundlegendProductDetail product={product} />;

  const isSoldOut = product.currentQuantity === 0;
  const maxQuantity = product.currentQuantity || 1;

  const availableColors = [
    ...new Set(product.variants.map((v) => v.color)),
  ];
  const availableSizes = [
    ...new Set(product.variants.map((v) => v.size)),
  ];

  const isOptionAvailable = (color, size) => {
    return product.variants.some(
      (v) => v.color === color && v.size === size && v.isAvailable
    );
  };

  const addToCartWithOptions = () => {
    if (!selectedVariant) return;

    addToCart({
      ...product,
      price: selectedVariant.price,
      stripePriceId: selectedVariant.stripePriceId,
    }, {
      color: selectedColor,
      size: selectedSize,
      quantity,
      variantId: selectedVariant.variantId,
    });
  };

  return (
    <div className="product-detail-container">
      <h1 className="product-title">{product?.name || 'Unnamed Product'}</h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <img
              src={mainImage}
              alt={product?.name || 'Product'}
              className="product-main-image"
            />
            <div className="thumbnail-scroll-container">
              <div className="product-thumbnail-gallery" ref={thumbnailContainerRef}>
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    className="product-thumbnail"
                    onClick={() => setMainImage(image)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="product-info">
            <h2>Product Specifications</h2>
            <p className="product-price">
              {selectedVariant ? `$${selectedVariant.price.toFixed(2)}` : `$${product?.price}`}
            </p>

            {/* Color Options */}
            <div className="product-options">
              <label>Color</label>
              <div className="option-grid">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={!isOptionAvailable(color, selectedSize)}
                    className={`option-button ${
                      selectedColor === color ? 'selected' : ''
                    } ${!isOptionAvailable(color, selectedSize) ? 'disabled' : ''}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Options */}
            <div className="product-options">
              <label>Size</label>
              <div className="option-grid">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={!isOptionAvailable(selectedColor, size)}
                    className={`option-button ${
                      selectedSize === size ? 'selected' : ''
                    } ${!isOptionAvailable(selectedColor, size) ? 'disabled' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {isSoldOut ? (
              <button className="prod-detail-sold-out-button" disabled>
                Sold Out - Notify Me When Available
              </button>
            ) : inCart ? (
              <>
                <div className="quantity-control">
                  <button
                    className="quantity-btn"
                    onClick={() =>
                      updateQuantity(product.id, Math.max(quantity - 1, 1))
                    }
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() =>
                      updateQuantity(
                        product.id,
                        Math.min(quantity + 1, maxQuantity)
                      )
                    }
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </button>
                </div>

                <button
                  className="prod-detail-view-cart-button"
                  onClick={() => navigate('/cart')}
                >
                  View in Cart
                </button>
                <button
                  className="prod-detail-remove-cart-button"
                  onClick={() => removeFromCart(product.id)}
                >
                  Remove from Cart
                </button>
              </>
            ) : (
              <button
                className="prod-detail-add-to-cart-button"
                onClick={addToCartWithOptions}
                disabled={!selectedVariant}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;