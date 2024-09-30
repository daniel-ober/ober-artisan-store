// src/components/ProductCard.js
import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product) {
      // Adding the product to cart with its ID and other properties
      addToCart({ ...product, _id: product.id }); // Ensure the product ID is passed correctly
    } else {
      console.error('Product is not defined');
    }
  };

  return (
    <div className="product-card">
      <img
        className="product-image"
        src={product.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
        alt={product.name}
      />
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${product.price}</p>
        
        <Link to={`/products/${product.id}`} className="view-details-link">
          View Details
        </Link>
        
        <button 
          className="add-to-cart-button" 
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
