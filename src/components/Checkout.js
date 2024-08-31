import React, { useContext } from 'react';
import { CartContext } from '../CartContext';

const Checkout = () => {
  const { cart } = useContext(CartContext);

  const handleCheckout = async () => {
    try {
      const response = await fetch('http://localhost:4949/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price, // Assuming price is in dollars
          })),
        }),
      });

      const session = await response.json();

      if (session.id) {
        window.location.href = `https://checkout.stripe.com/pay/${session.id}`;
      } else {
        console.error('Error creating checkout session:', session.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

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
              <li key={item.id}>
                {item.name} - Quantity: {item.quantity} - Price: ${item.price}
              </li>
            ))}
          </ul>
          <button onClick={handleCheckout}>Proceed to Checkout</button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
