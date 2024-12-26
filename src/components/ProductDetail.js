import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const thumbnailContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (productData) {
          if (
            productData.category === 'artisan' &&
            productData.interactive360Url
          ) {
            productData.images.push(productData.interactive360Url);
          }
          setProduct(productData);
          setMainImage(
            productData.images?.[0] || 'https://i.imgur.com/eoKsILV.png'
          );
          const cartItem = Object.values(cart).find((item) => item.id === id);
          setInCart(cartItem || null);
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
  }, [id, cart]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, id });
      setInCart({ ...product, quantity: 1 });
    }
  };

  const handleRemoveFromCart = () => {
    if (inCart) {
      removeFromCart(inCart.id);
      setInCart(null);
    }
  };

  const handleThumbnailClick = (image) => {
    if (image === product.interactive360Url) {
      setShowModal(true);
    } else {
      setMainImage(image);
    }
  };

  const handleModalClose = () => setShowModal(false);

  const scrollThumbnails = (direction) => {
    const container = thumbnailContainerRef.current;
    const scrollAmount = direction === 'left' ? -200 : 200;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setScrollPosition(container.scrollLeft + scrollAmount);
  };

  const handleQuantityChange = (change) => {
    if (inCart) {
      const newQuantity = inCart.quantity + change;
      if (newQuantity > 0) {
        updateQuantity(inCart.id, newQuantity);
        setInCart({ ...inCart, quantity: newQuantity });
      }
    }
  };

  const isArtisanProduct = product?.category === 'artisan';
  const isMerchOrAccessory =
    product?.category === 'merch' || product?.category === 'accessory';

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p>{error}</p>;

  const atStart = scrollPosition <= 0;
  const atEnd =
    thumbnailContainerRef.current &&
    scrollPosition + thumbnailContainerRef.current.clientWidth >=
      thumbnailContainerRef.current.scrollWidth;

  return (
    <div className="product-detail-container">
      <div className="product-header">
        <Link to="/products" className="back-to-shop-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div>

      <h1 className="product-title">{product?.name || 'Unnamed Product'}, {product.height} x {product.width} {product.drumType} ({product.finish})</h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <img
              src={mainImage}
              alt={product?.name || 'Product'}
              className="product-main-image"
            />
            <div className="thumbnail-scroll-container">
              {!atStart && (
                <button
                  className="scroll-button scroll-left"
                  onClick={() => scrollThumbnails('left')}
                  aria-label="Scroll thumbnails left"
                >
                  &lt;
                </button>
              )}
              <div
                className="product-thumbnail-gallery"
                ref={thumbnailContainerRef}
              >
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    className="product-thumbnail"
                    onClick={() => handleThumbnailClick(image)}
                    aria-label={`Select image ${index + 1}`}
                  >
                    {image === product.interactive360Url ? (
                      <span className="thumbnail-360">360°</span>
                    ) : (
                      <img src={image} alt={`Thumbnail ${index + 1}`} />
                    )}
                  </button>
                ))}
              </div>
              {!atEnd && (
                <button
                  className="scroll-button scroll-right"
                  onClick={() => scrollThumbnails('right')}
                  aria-label="Scroll thumbnails right"
                >
                  &gt;
                </button>
              )}
            </div>
          </div>

          <div className="product-info">
            <div className="artisan-specs">
              <h2>Product Specifications</h2>
              {isArtisanProduct ? (
                <>
                  <p>
                    <strong>Type:</strong> {product.drumType}
                  </p>
                  <p>
                    <strong>Construction:</strong>{' '}
                    {product.constructionType}
                  </p>
                  <p>
                    <strong>Species:</strong> {product.woodSpecies}{' '}
                    {product.customWoodSpecies}
                  </p>
                  <p>
                    <strong>Size:</strong> H:{product.height} in. x W:{product.width} in.
                  </p>
                  <p>
                    <strong>Shell Thickness:</strong> {product.shellThickness} mm
                  </p>
                  <p>
                    <strong>Bearing Edge:</strong> {product.bearingEdge}&deg;
                  </p>
                  <p>
                    <strong>Hardware:</strong> {product.lugCount/2}-lug {product.lugType} ({product.hardwareColor}), {product.snareThrowOff} 
                  </p>
                  <p>
                    <strong>Drum Type:</strong> {product.drumType}
                  </p>
                  <p>
                    <strong>Drum Type:</strong> {product.drumType}
                  </p>
                  <p>
                    <strong>Description:</strong> {product.description}
                  </p>
                  <p>
                    <strong>Delivery Time:</strong> {product.deliveryTime}
                  </p>
                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Description:</strong> {product.description}
                  </p>
                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>
                  <p>
                    <strong>Delivery Time:</strong> {product.deliveryTime}
                  </p>
                </>
              )}

              <div className="product-price-container">
                <p className="product-price">${product?.price?.toFixed(2)}</p>
                {inCart ? (
                  <button
                    onClick={handleRemoveFromCart}
                    className="remove-from-cart-button"
                  >
                    Remove from Cart
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="add-to-cart-button"
                  >
                    Add to Cart
                  </button>
                )}

                {inCart && isMerchOrAccessory && (
                  <div className="quantity-control">
                    <button onClick={() => handleQuantityChange(-1)}>-</button>
                    <span className="quantity-display">{inCart.quantity}</span>
                    <button onClick={() => handleQuantityChange(1)}>+</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="modal show"
          onClick={handleModalClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleModalClose();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="modal-content">
            <iframe
              src={product.interactive360Url}
              width="100%"
              height="500px"
              title="360° View"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
