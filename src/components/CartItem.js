import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();

  const minQuantity = 1;

  // Update handleRemove to use item._id
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

  const quantity = item.category === 'one of a kind' || item.category === 'custom shop' ? minQuantity : item.quantity || minQuantity;
  const price = item.price || 0;
  const subtotal = (price * quantity).toFixed(2);

  const isAdjustable = !['one of a kind', 'custom shop'].includes(item.category);

  return (
    <div className="cart-item">
      <img 
        src={item.images?.[0] || 'https://i.imgur.com/eoKsILV.png'} 
        alt={item.name} 
        className="cart-item-image" 
      />
      <div className="cart-item-details">
        <div>
          <h2 className="cart-item-name">{item.name}</h2>
          <p className="cart-item-price">${price.toFixed(2)}</p>
        </div>
        <div className="cart-item-quantity">
          <button
            className={`quantity-btn ${quantity <= minQuantity || !isAdjustable ? 'disabled' : ''}`}
            onClick={handleDecrease}
            disabled={quantity <= minQuantity || !isAdjustable}
            data-tooltip="Decrease quantity"
          >
            -
          </button>
          <span className="quantity-value">{quantity}</span>
          <button
            className={`quantity-btn ${!isAdjustable ? 'disabled' : ''}`}
            onClick={handleIncrease}
            disabled={!isAdjustable}
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
