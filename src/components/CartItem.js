// src/components/CartItem.js
import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();

  const minQuantity = 1;

  const handleRemove = () => {
    console.log('Removing item with ID:', item._id); // Log the ID being removed
    removeFromCart(item._id); // Use item._id instead of item.id
  };

  const handleIncrease = () => {
    if (item.quantity >= minQuantity) {
      updateQuantity(item._id, item.quantity + 1); // Update to item._id
    }
  };

  const handleDecrease = () => {
    if (item.quantity > minQuantity && !['one of a kind', 'custom shop'].includes(item.category)) {
      updateQuantity(item._id, item.quantity - 1); // Update to item._id
    }
  };

  // Update these properties based on the structure of your items
  const quantity = item.quantity || minQuantity;
  const price = item.price || 0;
  const subtotal = (price * quantity).toFixed(2);
  
  // Check if item has a name and description
  const name = item.name || 'Unnamed Product';
  const description = item.description || 'No description available.';

  return (
    <div className="cart-item">
      <img 
        src={item.images?.[0] || 'https://i.imgur.com/eoKsILV.png'} 
        alt={name} 
        className="cart-item-image" 
      />
      <div className="cart-item-details">
        <div>
          <h2 className="cart-item-name">{name}</h2>
          <p className="cart-item-description">{description}</p>
          <p className="cart-item-price">${price.toFixed(2)}</p>
        </div>
        <div className="cart-item-quantity">
          <button
            className={`quantity-btn ${quantity <= minQuantity ? 'disabled' : ''}`}
            onClick={handleDecrease}
            disabled={quantity <= minQuantity}
            data-tooltip="Decrease quantity"
          >
            -
          </button>
          <span className="quantity-value">{quantity}</span>
          <button
            className="quantity-btn"
            onClick={handleIncrease}
            data-tooltip="Increase quantity"
          >
            +
          </button>
          <button 
            className="remove-btn" 
            onClick={handleRemove}
            data-tooltip="Remove item"
          >
            Remove
          </button>
        </div>
        <p className="cart-item-subtotal">Subtotal: ${subtotal}</p>
      </div>
    </div>
  );
};

export default CartItem;
