import React from 'react';
import './CheckoutModal.css';

const CheckoutModal = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal-content">
        <p>Redirecting you to secure checkout…</p>
        <div className="checkout-spinner" />
      </div>
    </div>
  );
};

export default CheckoutModal;