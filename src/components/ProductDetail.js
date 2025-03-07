// src/components/ProductDetail.js
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
  const [notifyMe, setNotifyMe] = useState(false);
  const thumbnailContainerRef = useRef(null);

  // Fetch product details
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (productData) {
          setProduct(productData);
          setMainImage(
            productData.images?.[0] ||
              '/fallback-images/images-coming-soon-regular.png'
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

  // Sync cart state
  useEffect(() => {
    if (product) {
      const cartItem = cart.find((item) => item.id === product.id);
      if (cartItem) {
        setInCart(cartItem);
        setQuantity(Math.min(cartItem.quantity, product.currentQuantity));
      } else {
        setInCart(null);
        setQuantity(1);
      }
    }
  }, [cart, product]);

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

  const isSoldOut = product.currentQuantity === 0;
  const isArtisan = product.category === 'artisan';
  const maxQuantity = product.currentQuantity || 1;

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
              <div
                className="product-thumbnail-gallery"
                ref={thumbnailContainerRef}
              >
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
            <p className="product-price">${product?.price}</p>

            {/* SoundLegend Custom Handling */}
            {product.id === 'soundlegend' ? (
              <button
                className="prod-detail-request-consultation-button"
                onClick={() => navigate('/products/soundlegend')}
              >
                Request Consultation
              </button>
            ) : isSoldOut ? (
              <button className="prod-detail-sold-out-button" disabled>
                Sold Out - Notify Me When Available
              </button>
            ) : inCart ? (
              <>
                {/* Quantity Control for Non-Artisan Items */}
                {!isArtisan && (
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
                )}

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
                className={`prod-detail-${inCart ? 'remove-cart' : 'add-to-cart'}-button`}
                onClick={() => {
                  if (inCart) {
                    removeFromCart(product.id);
                  } else {
                    const selectedOptions = {
                      size: product.size || 'N/A',
                      depth: product.depth || 'N/A',
                      lugQuantity: product.lugQuantity || 'N/A',
                      staveQuantity: product.staveQuantity || 'N/A',
                      reRing: product.reRing ?? false,
                      stripePriceId: product.stripePriceId || '',
                      totalPrice: Number(product.price) || 0, // 🔥 Ensure price is correctly passed
                    };

                    console.log('🛒 Adding Artisan Product to Cart:', {
                      product,
                      selectedOptions,
                    });

                    addToCart(product, selectedOptions);
                  }
                }}
              >
                {inCart ? 'Remove from Cart' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
