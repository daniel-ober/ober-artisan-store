import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, _id: product.id });
    } else {
      console.error('Product is not defined');
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          className="product-image"
          src={product.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
          alt={product.name}
        />
      </div>
      <div className="product-info">
        <h3 className="product-title product-title-custom">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${product.price}</p>
        <Link to={`/products/${product.id}`} className="view-details-link">
          View Details
        </Link>
      </div>
      <button 
        className="add-to-cart-button" 
        onClick={handleAddToCart}
        aria-label="Add product to cart"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
