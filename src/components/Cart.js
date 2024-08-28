// src/components/Cart.js

import React from 'react';
import { useSelector } from 'react-redux';

const Cart = () => {
  // Access the cart items from the Redux store, ensure it's an array
  const cartItems = useSelector((state) => state.cart.items || []);

  return (
    <div>
      {cartItems.length > 0 ? (
        <div>
          <h2>Your Cart</h2>
          <ul>
            {cartItems.map((item, index) => (
              <li key={index}>{item.name} - {item.quantity}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>Your cart is empty.</div>
      )}
    </div>
  );
};

export default Cart;
