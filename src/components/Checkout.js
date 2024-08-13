import React, { useContext } from 'react';
import { CartContext } from '../CartContext';

const Checkout = () => {
  const { cart } = useContext(CartContext);

  return (
    <div>
      <h1>Checkout</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <h2>Your Items:</h2>
          <ul>
            {cart.map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
          {/* Add checkout form or payment details here */}
        </div>
      )}
    </div>
  );
};

export default Checkout;
