import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./CartPreview.css";

const CartPreview = ({ onClose, closeMenu }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

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
      updateQuantity(itemId, newQuantity);
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <div className="cart-preview-header">Your Cart</div>
        <button className="close-preview" onClick={onClose}>✕</button>
      </div>

      {cart.length > 0 ? (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-preview-item">
                <img
                  src={item.images?.[0] || "https://i.imgur.com/eoKsILV.png"}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <p className="item-name">{item.name}</p>
                  <span className="item-price">${Number(item.price || 0).toFixed(2)}</span>

                  {item.category !== "artisan" ? (
                    <div className="quantity-buttons">
                      <button onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)} disabled={item.quantity >= (item.currentQuantity || 1)}>
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="quantity-value">1</span>
                  )}
                </div>
                <button className="remove-item" onClick={() => handleRemoveItem(item.id)}>✕</button>
              </div>
            ))}
          </div>

          <div className="cart-total-container">
            <span className="cart-total-label">Total:</span>
            <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
          </div>

          {/* ✅ Fix: Close menu when navigating to full cart */}
          <Link to="/cart" className="view-cart-button" onClick={() => { onClose(); closeMenu(); }}>
            View Full Cart
          </Link>
        </>
      ) : (
        <p className="empty-cart">Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartPreview;