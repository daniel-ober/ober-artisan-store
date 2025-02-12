// src/components/CartPreview.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPreview.css';

const CartPreview = ({ onClose }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleQuantityChange = (itemId, change) => {
    const item = cart.find((i) => i._id === itemId);
    if (!item) return;

    const minQuantity = 1;
    const maxQuantity = item.currentQuantity || 1;
    const newQuantity = item.quantity + change;

    if (newQuantity < minQuantity) {
      removeFromCart(itemId);
    } else if (
      newQuantity <= maxQuantity &&
      !['one of a kind', 'custom shop'].includes(item.category)
    ) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <h3>Cart Preview</h3>
        <button className="close-preview" onClick={onClose}>✕</button>
      </div>
      {cart.length > 0 ? (
        <>
          {cart.map((item) => (
            <div key={item._id} className="cart-preview-item">
              <img
                src={item.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-details">
                <p>{item.name}</p>
                <span className="item-price">${item.price.toFixed(2)}</span>
                {item.category !== 'artisan' ? (
                  <div className="quantity-buttons">
                    <button
                      onClick={() => handleQuantityChange(item._id, -1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item._id, 1)}
                      disabled={item.quantity >= (item.currentQuantity || 1)}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="quantity-value">1</span>
                )}
              </div>
              <button
                className="remove-item red"
                onClick={() => handleRemoveItem(item._id)}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="cart-total-container">
            <span className="cart-total-label">Total:</span>
            <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
          </div>
          <Link to="/cart" className="view-cart-link" onClick={onClose}>
            View Full Cart
          </Link>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartPreview;