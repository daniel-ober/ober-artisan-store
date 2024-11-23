import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

const Checkout = ({ cart }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Generate a unique guest token
      const guestToken = uuidv4(); // This creates the guestToken
  
      const stripeSessionId = `cs_test_${uuidv4()}`; // Simulated Stripe session ID
  
      const order = {
        userId: 'guest',
        guestToken, // Add the generated guestToken to the order object
        stripeSessionId,
        customerName,
        customerEmail,
        products: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
        status: 'paid',
        createdAt: new Date(),
      };
  
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, order); // Save the order in Firestore, including the guestToken
  
      console.log('Generated guestToken:', guestToken);
      console.log('Order created:', order);
  
      // Navigate to Checkout Summary
      navigate(`/checkout-summary?session_id=${stripeSessionId}&guest_token=${guestToken}`);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to complete checkout. Please try again.');
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <h2>Checkout</h2>
      <label>
        Name:
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </label>
      <label>
        Email:
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />
      </label>
      <h3>Total: ${totalAmount.toFixed(2)}</h3>
      <button type="submit">Complete Purchase</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default Checkout;
