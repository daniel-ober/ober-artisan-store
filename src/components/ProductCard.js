import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css'; // Ensure this path is correct

const ProductCard = ({ product }) => {
  if (!product) {
    return null; // Return nothing if product is undefined or null
  }

  return (
    <div className="product-card">
      <img src={product.images} alt={product.name} className="product-image" />
      <div className="product-info">
        <h2 className="product-name">{product.name}</h2>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <Link to={`/products/${product._id}`} className="product-link">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
