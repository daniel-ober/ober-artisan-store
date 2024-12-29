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
    const currentQuantity = cart[itemId]?.quantity || 0;
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const cartTotal = Object.values(cart).reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <h3>Cart Preview</h3>
        <button className="close-preview" onClick={onClose}>✕</button>
      </div>
      {Object.keys(cart).length > 0 ? (
        <>
          {Object.values(cart).map((item) => (
            <div key={item.id} className="cart-preview-item">
              <img
                src={item.images?.[0] || 'https://i.imgur.com/eoKsILV.png'}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-details">
                <p>{item.name}</p>
                <span className="item-price">${item.price.toFixed(2)}</span>
                {item.category !== 'artisan' && (
                  <div className="quantity-buttons">
                    <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                  </div>
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