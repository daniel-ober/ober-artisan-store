import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPreview.css';

const CartPreview = ({ onClose }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  let quantityTimeout = null;

  const handleQuantityChange = (itemId, change) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const minQuantity = 1;
    const maxQuantity = item.currentQuantity || 1;
    const newQuantity = Math.min(
      Math.max(item.quantity + change, minQuantity),
      maxQuantity
    );

    if (newQuantity !== item.quantity) {
      // Clear any existing timeout before setting a new one
      clearTimeout(quantityTimeout);

      quantityTimeout = setTimeout(() => {
        updateQuantity(itemId, newQuantity);
      }, 250); // Delays the function execution by 250ms to prevent rapid multiple calls
    }
  };

  // ✅ Ensure price is a valid number before calling `.toFixed(2)`
  const cartTotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <h3>Cart Preview</h3>
        <button className="close-preview" onClick={onClose}>
          ✕
        </button>
      </div>
      {cart.length > 0 ? (
        <>
          {cart.map((item) => (
            <div key={item.id} className="cart-preview-item">
              <img
                src={item.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-details">
                <p>{item.name}</p>
                <span className="item-price">
                  ${Number(item.price || 0).toFixed(2)}
                </span>
                {item.category !== 'artisan' ? (
                  <div className="quantity-buttons">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
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
                onClick={() => handleRemoveItem(item.id)}
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
