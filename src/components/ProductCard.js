import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // Updated import path
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  if (!product) return null;

  return (
    <div className="product-card">
      <img src={product.images[0]} alt={product.name} className="product-image" /> {/* Ensure images is an array */}
      <div className="product-info">
        <h2 className="product-name">{product.name}</h2>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <Link to={`/products/${product._id}`} className="product-link">
          View Details
        </Link>
        <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
