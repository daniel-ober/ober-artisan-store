import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, _id: product.id });
    } else {
      console.error('Product is not defined');
    }
  };

  const handleImageClick = () => {
    navigate(`/products/${product.id}`);
  };

  // Check if product is already in the cart
  const isInCart = cart[product.id];

  return (
    <div className="product-card">
      <div
        className="product-image-container"
        onClick={handleImageClick}
        onKeyDown={(e) => e.key === 'Enter' && handleImageClick()}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img
          className="product-image"
          src={product.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
          alt={product.name}
        />
      </div>

      <div className="product-separator"></div>

      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <div className="product-meta">
          {product.shellDepth && product.shellWidth && (
            <p className="product-dimensions">
              {product.depth}&quot; x {product.width}&quot;

            </p>
            
          )}
        </div>
        {/* <p className="product-description">{product.description}</p> */}
        <p className="product-card-price">${product.price.toFixed(2)}</p>
        <Link to={`/products/${product.id}`} className="view-details-link">
          View Details
        </Link>


        {/* Ensure button stretches edge-to-edge */}
        <div className="product-button-container">
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
            aria-label="Add product to cart"
          >
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
