// src/components/ProductCard.js

import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h2>{product.name}</h2>
      <p>${product.price}</p>
      <Link to={`/products/${product._id}`}>View Details</Link>
    </div>
  );
};

export default ProductCard;
