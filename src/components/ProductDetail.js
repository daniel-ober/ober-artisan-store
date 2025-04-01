import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import HeritageProductDetail from './HeritageProductDetail';
import FeuzonProductDetail from './FeuzonProductDetail';
import SoundlegendProductDetail from './SoundlegendProductDetail';
import { fetchPrintifyProductOptions } from '../services/printifyService'; // New service for Printify API
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
  const [merchOptions, setMerchOptions] = useState(null); // For storing Printify options
  const thumbnailContainerRef = useRef(null);

  // Fetch product details
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (productData) {
          setProduct(productData);
          setMainImage(
            productData.images?.[0] || '/fallback-images/images-coming-soon-regular.png'
          );
          // Only fetch size/color options if the product is a "merch" category
          if (productData.category === 'merch') {
            const printifyOptions = await fetchPrintifyProductOptions(
              productData.printifyProductId
            );
            setMerchOptions(printifyOptions);
          }
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

  // For artisan products
  if (productId === 'heritage')
    return <HeritageProductDetail product={product} />;
  if (productId === 'feuzon') return <FeuzonProductDetail product={product} />;
  if (productId === 'soundlegend')
    return <SoundlegendProductDetail product={product} />;

  const isSoldOut = product.currentQuantity === 0;
  const isArtisan = product.category === 'artisan';
  const maxQuantity = product.currentQuantity || 1;

  // Handle color selection change
  const handleColorChange = (color) => {
    setSelectedColor(color);
    const imageForColor = product.images.find((img) => img.includes(color));
    setMainImage(imageForColor || product.images[0]);
  };

  // Handle size selection change
  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  const addToCartWithOptions = () => {
    const selectedOptions = {
      size: selectedSize || 'N/A',
      color: selectedColor || 'N/A',
      quantity,
    };
    addToCart(product, selectedOptions);
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

            {/* Merch product options */}
            {product.category === 'merch' && merchOptions && (
              <>
                {/* Color Options Dropdown */}
                {merchOptions.colors && merchOptions.colors.length > 0 && (
                  <div className="product-options">
                    <label htmlFor="color-select">Color</label>
                    <select
                      id="color-select"
                      value={selectedColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                    >
                      {merchOptions.colors.map((color, index) => (
                        <option
                          key={index}
                          value={color.name}
                          disabled={!color.available} // Disable unavailable colors
                        >
                          {color.name} {color.available ? '' : '(Out of Stock)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Size Options Dropdown */}
                {merchOptions.sizes && merchOptions.sizes.length > 0 && (
                  <div className="product-options">
                    <label htmlFor="size-select">Size</label>
                    <select
                      id="size-select"
                      value={selectedSize}
                      onChange={(e) => handleSizeChange(e.target.value)}
                    >
                      {merchOptions.sizes.map((size, index) => (
                        <option
                          key={index}
                          value={size.name}
                          disabled={!size.available} // Disable unavailable sizes
                        >
                          {size.name} {size.available ? '' : '(Out of Stock)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

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
                className={`prod-detail-${inCart ? 'remove-cart' : 'add-to-cart'}-button`}
                onClick={addToCartWithOptions}
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