import React, { useContext } from 'react';
import { CartContext } from '../CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe("pk_test_51PrBd7Jbbx8jAR4NZ2vOilq5lRJaQ0JnQjT9R7Z1brJvVokZc6TpaRFtX67jSCg8PpeqeUqmXBmFTUBLo0lkeI1G00KrLLeSJb");

const Checkout = () => {
  const { cart } = useContext(CartContext);

  const handleCheckout = async () => {
    const userId = 'exampleUserId'; // Replace with actual user ID
  
    try {
      const response = await fetch('http://localhost:4949/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          userId, // Include userId in the request payload
        }),
      });
  
      const session = await response.json();
  
      if (session.url) {
        window.location.href = session.url;
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
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default Checkout;