import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product) {
      addToCart(product).catch((error) => {
        console.error('Failed to add product to cart:', error);
      });
    } else {
      console.error('Product is not defined');
    }
  };

  return (
    <div className="product-card">
      <img
        className="product-image"
        src={product.images?.[0] || '/path/to/placeholder.jpg'}
        alt={product.name}
      />
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${product.price}</p>
        
        {/* Add View Details Link */}
        <Link to={`/products/${product._id}`} className="view-details-link">
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
