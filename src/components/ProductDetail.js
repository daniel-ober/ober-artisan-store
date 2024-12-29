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
  const thumbnailContainerRef = useRef(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (productData) {
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
    setMainImage(image);
  };

  const isArtisanProduct = product?.category === 'artisan';
  const speciesList = [
    product?.woodSpecies,
    product?.customWoodSpecies
  ].filter(Boolean).join(', ');

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="product-detail-container">
      <div className="product-header">
        <Link to="/products" className="back-to-shop-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div>

      <h1 className="product-title">
        {product?.name || 'Unnamed Product'}, {product.depth} x{' '}
        {product.width} {product.drumType} ({product.finish})
      </h1>

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
                    onClick={() => handleThumbnailClick(image)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Product Specifications Section */}
          <div className="product-info">
            <div className="artisan-specs">
              <h2>Product Specifications</h2>
              <table className="artisan-specs-table">
                <tbody>
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
                    <td>Shell Thickness:</td>
                    <td>{product.shellThickness} mm</td>
                  </tr>
                  <tr>
                    <td>Bearing Edge:</td>
                    <td>{product.bearingEdge}&deg;</td>
                  </tr>
                  <tr>
                    <td>Hardware:</td>
                    <td>{product.lugCount}-lug {product.lugType}</td>
                  </tr>
                  <tr>
                    <td>Description:</td>
                    <td>{product.description}</td>
                  </tr>
                  <tr>
                    <td>Delivery Time:</td>
                    <td>{product.deliveryTime}</td>
                  </tr>
                  <tr>
                    <td>SKU:</td>
                    <td>{product.sku}</td>
                  </tr>
                </tbody>
              </table>

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;