import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css'; // Add the styles for ProductCard here
import { useCart } from '../context/CartContext'; // Ensure this is the correct path

const ProductCard = ({ product }) => {
  const { addToCart, removeFromCart, cartItems } = useCart();

  const isInCart = cartItems.some(item => item.id === product._id);

  const handleCartToggle = (e) => {
    e.stopPropagation(); // Prevent click event from bubbling up to the Link component
    if (isInCart) {
      removeFromCart(product._id);
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/item/${product._id}`} className="product-link">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : '/path/to/placeholder-image.jpg'}
          alt={product.name}
          className="product-image"
        />
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <p className="product-price">
            {product.price !== undefined && product.price !== null ? `$${product.price.toFixed(2)}` : 'Price not available'}
          </p>
        </div>
      </Link>
      <div className="product-card-footer">
        <button
          className={isInCart ? 'remove-from-cart-button' : 'add-to-cart-button'}
          onClick={handleCartToggle}
        >
          {isInCart ? 'Remove from Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
