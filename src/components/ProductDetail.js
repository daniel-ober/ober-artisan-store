import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
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
      const cartItem = cart ? Object.values(cart).find((item) => item.id === productId) : null;
      if (cartItem) {
        setInCart(cartItem);
        setQuantity(cartItem.quantity);
      } else {
        setInCart(null);
        setQuantity(1);
      }
    }
  }, [cart, product, productId]);

  const handleAddToCart = () => {
    if (product) {
      const maxQuantity = product.category === 'merch' || product.category === 'accessories' ? 20 : 1;
      const currentQuantity = inCart?.quantity || 0;

      if (currentQuantity + quantity > maxQuantity) {
        alert(`You cannot add more than ${maxQuantity} of this product.`);
        return;
      }

      addToCart({ ...product, id: productId, quantity });
      setInCart({ ...product, quantity: currentQuantity + quantity });
    }
  };

  const handleRemoveFromCart = () => {
    if (inCart) {
      removeFromCart(inCart.id);
      setInCart(null);
    }
  };

  const handleThumbnailClick = (image) => {
    setMainImage(image);
  };

  const handleQuantityIncrease = () => {
    const maxQuantity = product.category === 'merch' || product.category === 'accessories' ? 20 : 1;

    if (quantity + (inCart?.quantity || 0) >= maxQuantity) {
      alert(`You cannot exceed the max limit of ${maxQuantity} items for this product.`);
      return;
    }

    setQuantity(quantity + 1);
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const speciesList = [product?.woodSpecies, product?.customWoodSpecies].filter(Boolean).join(', ');

  if (loading) return <p>Loading product details...</p>;
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <Link to="/products">Return to Products</Link>
      </div>
    );
  }

  const isArtisan = product.category === 'artisan';
  const isArtisanOne = product.artisanLine === 'ONE';

  return (
    <div className="product-detail-container">
      <div className="product-header">
        <Link to="/products" className="back-to-shop-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div>

      <h1 className="product-title">
        {product?.name || 'Unnamed Product'}, {product.depth}&quot; x {product.width}&quot;{' '}
        {product.drumType} ({product.finish})
      </h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <img
              src={mainImage}
              alt={product?.name || 'Product'}
              className={`product-main-image ${isArtisan ? 'artisan' : 'non-artisan'}`}
            />
            <div className="thumbnail-scroll-container">
              <div className="product-thumbnail-gallery" ref={thumbnailContainerRef}>
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    className="product-thumbnail"
                    onClick={() => handleThumbnailClick(image)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="product-info">
            <h2>Product Specifications</h2>
            <table className="artisan-specs-table">
              <tbody>
                {isArtisan && (
                  <>
                    <tr>
                      <td>Type:</td>
                      <td>{product.drumType}</td>
                    </tr>
                    <tr>
                      <td>Construction:</td>
                      <td>{product.constructionType}</td>
                    </tr>
                    <tr>
                      <td>Wood Species:</td>
                      <td>{speciesList}</td>
                    </tr>
                    <tr>
                      <td>Depth:</td>
                      <td>{product.depth}&quot;</td>
                    </tr>
                    <tr>
                      <td>Diameter:</td>
                      <td>{product.width}&quot;</td>
                    </tr>
                    <tr>
                      <td>Thickness:</td>
                      <td>{product.thickness}mm</td>
                    </tr>
                    {/* <tr>
                      <td>Quantity Staves:</td>
                      <td>{product.quantityStaves}</td>
                    </tr> */}
                    <tr>
                      <td>Lug Count:</td>
                      <td>{product.lugCount}</td>
                    </tr>
                    <tr>
                      <td>Hardware:</td>
                      <td>{product.hardwareColor}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td>Description:</td>
                  <td>{product.description}</td>
                </tr>
              </tbody>
            </table>

            <div className="product-price-container">
              <p className="product-price">${product?.price?.toFixed(2)}</p>

              {/* Conditionally render quantity section */}
              {!isArtisanOne && inCart && (
                <div className="quantity-section">
                  <span className="quantity-label">Quantity:</span>
                  <div className="quantity-selector">
                    <button
                      onClick={handleQuantityDecrease}
                      className={`quantity-btn ${quantity <= 1 ? 'disabled' : ''}`}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-display">{quantity}</span>
                    <button
                      onClick={handleQuantityIncrease}
                      className={`quantity-btn ${
                        product.category === 'merch' || product.category === 'accessories'
                          ? quantity >= 20
                            ? 'disabled'
                            : ''
                          : 'disabled'
                      }`}
                      disabled={quantity >= (product.maxQuantity || 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {inCart ? (
                <button onClick={handleRemoveFromCart} className="remove-from-cart-button">
                  Remove from Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="add-to-cart-button"
                  title={
                    isArtisanOne
                      ? 'This product is one-of-a-kind and limited to 1 per customer.'
                      : undefined
                  }
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