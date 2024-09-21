import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/firebaseService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // State for zoom level

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (productData) {
          setProduct(productData);
          setMainImage(productData.images?.[0] || '/path/to/placeholder.jpg');

          const cartArray = Object.values(cart);
          const cartProduct = cartArray.find(item => item.productId === id);
          setInCart(cartProduct || null);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        setError('Error fetching product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, cart]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleQuantityChange = (change) => {
    if (!inCart) return;
    const newQuantity = inCart.quantity + change;
    if (newQuantity < 1) return;
    addToCart({ ...product, quantity: newQuantity });
  };

  const handleThumbnailClick = (image) => {
    setMainImage(image);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setZoomLevel(1); // Reset zoom level when closing the modal
  };

  const handleMouseMove = (event) => {
    const image = document.querySelector('.enlarged-image');
    const rect = image.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    image.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 1));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="product-detail-container">
      <Link to="/products" className="back-to-shop-link">
        <FaArrowLeft className="back-icon" />
        Back to Shop/Gallery
      </Link>
      <div className="product-image-gallery">
        <img
          src={mainImage}
          alt={product?.name}
          className="product-main-image"
          onClick={toggleModal}
          style={{ cursor: 'zoom-in' }}
        />
        <div className="product-thumbnail-gallery">
          {product?.images.map((image, index) => (
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

      {/* Modal for Enlarged Image */}
      {isModalOpen && (
        <div className="image-modal" onClick={toggleModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()} onMouseMove={handleMouseMove}>
            <FaTimes className="close-modal" onClick={toggleModal} />
            <div className="zoom-container">
              <img
                className={`enlarged-image ${zoomLevel > 1 ? 'zoomed' : ''}`}
                style={{ transform: `scale(${zoomLevel})` }}
                src={mainImage}
                alt="Enlarged product"
              />
              <div className="zoom-icons">
                <FaSearchPlus className="zoom-icon" onClick={handleZoomIn} />
                <FaSearchMinus className="zoom-icon" onClick={handleZoomOut} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="product-info">
        <h1 className="product-title">{product?.name}</h1>
        <p className="product-description">{product?.description}</p>
        <p className="product-price">${product?.price}</p>
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          {inCart ? 'Update Cart' : 'Add to Cart'}
        </button>
        <div className="quantity-controls">
          <button
            className="quantity-button"
            onClick={() => handleQuantityChange(-1)}
            disabled={!inCart || inCart.quantity <= 1}
          >
            -
          </button>
          <span className="quantity-display">{inCart?.quantity || 0}</span>
          <button
            className="quantity-button"
            onClick={() => handleQuantityChange(1)}
            disabled={!inCart}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
