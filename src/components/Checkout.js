import React, { useState } from 'react';
import './Checkout.css';

const Checkout = ({ cartItems, totalAmount, onApplyPromo }) => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  const handleApplyPromo = () => {
    if (promoCode.trim() === 'DRUM10') {
      setDiscount(0.1); // 10% discount
      setError('');
      onApplyPromo(0.1);
    } else {
      setDiscount(0);
      setError('Invalid promo code');
    }
  };

  const finalAmount = (totalAmount * (1 - discount)).toFixed(2);

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {/* Cart Items */}
      <div className="cart-summary">
        {cartItems.map((item) => (
          <div className="cart-item" key={item.id}>
            <img src={item.image} alt={item.name} className="item-image" />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="description">{item.description}</p>
              <p>Price: ${item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Total: ${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="item-actions">
              <button className="remove-btn">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className="promo-code-section">
        <h2>Apply Promo Code</h2>
        <div className="promo-input-wrapper">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter Promo Code"
          />
          <button onClick={handleApplyPromo}>Apply</button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-line">
          <span>Subtotal:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line discount">
            <span>Discount (10%):</span>
            <span>- ${(totalAmount * discount).toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line total">
          <span>Total Amount:</span>
          <span>${finalAmount}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button className="checkout-btn">Proceed to Payment</button>
    </div>
  );
};

export default Checkout;