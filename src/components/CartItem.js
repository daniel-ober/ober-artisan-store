import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css'; // Import the CSS file

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();

  const handleRemove = () => removeFromCart(item.id);

  const handleIncrease = () => {
    if (item.quantity < 1) return; // No increase if quantity is 1 or more
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity <= 1) return; // No decrease if quantity is 1 or less
    updateQuantity(item.id, item.quantity - 1);
  };

  const quantity = item.quantity || 0;
  const price = item.price || 0;
  const subtotal = (price * quantity).toFixed(2);

  // Disable quantity adjustment for certain categories
  const isAdjustable = !['one of a kind', 'custom shop'].includes(item.category);

  return (
    <div className="cart-item">
      <img 
        src={item.images[0] || '/path/to/placeholder.jpg'} 
        alt={item.name} 
        className="cart-item-image" 
      />
      <div className="cart-item-details">
        <div>
          <h2 className="cart-item-name">{item.name}</h2>
          <p className="cart-item-price">${price.toFixed(2)}</p>
        </div>
        <div className="cart-item-quantity">
          {isAdjustable ? (
            <>
              <button
                className={`quantity-btn ${quantity <= 1 ? 'disabled' : ''}`}
                onClick={handleDecrease}
                disabled={quantity <= 1}
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
            </>
          ) : (
            <span className="quantity-value">Quantity: {quantity}</span>
          )}
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
