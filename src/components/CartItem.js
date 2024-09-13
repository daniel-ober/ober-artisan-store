// CartItem.js
import React from 'react';
import './Cart.css';

const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  const handleIncrease = () => {
    if (!['custom shop', 'one of a kind'].includes(item.category)) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1 && !['custom shop', 'one of a kind'].includes(item.category)) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="cart-item">
      <img
        src={item.images || '/path/to/placeholder-image.jpg'}
        alt={item.name}
        className="cart-item-image"
      />
      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        <p className="cart-item-price">${Number(item.price).toFixed(2)}</p>
        {['custom shop', 'one of a kind'].includes(item.category) ? (
          <div className="cart-item-quantity">
            <button
              className="quantity-btn disabled"
              data-tooltip='Quantity cannot be adjusted. Please use "Remove" to take this item out of your cart.'
            >
              -
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn disabled"
              data-tooltip='Quantity cannot be adjusted. Please use "Remove" to take this item out of your cart.'
            >
              +
            </button>
          </div>
        ) : (
          <div className="cart-item-quantity">
            <button
              className={`quantity-btn ${item.quantity === 1 ? 'disabled' : ''}`}
              data-tooltip={
                item.quantity === 1
                  ? 'Minimum quantity reached. Please use "Remove" to take this item out of your cart.'
                  : ''
              }
              onClick={handleDecrease}
            >
              -
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn"
              onClick={handleIncrease}
            >
              +
            </button>
          </div>
        )}
        <button
          className="remove-btn"
          onClick={() => removeFromCart(item.id)}
        >
          Remove
        </button>
      </div>
      <p className="cart-item-subtotal">
        Subtotal: ${(item.price * item.quantity).toFixed(2)}
      </p>
    </div>
  );
};

export default CartItem;
