// src/components/Checkout.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService'; // Updated import

const Checkout = ({ onCheckoutComplete }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [total, setTotal] = useState(0); // Example for total amount
  const [items, setItems] = useState([]); // Example for ordered items
  const [error, setError] = useState(null); // State for error messages

  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logic for processing payment here (e.g., with Stripe)
    try {
      // Example: Simulate payment processing (replace with actual payment logic)
      const paymentSuccessful = true; // Simulated payment success

      if (paymentSuccessful) {
        // Create the order object
        const order = {
          customerName,
          customerPhone,
          shippingAddress,
          billingAddress,
          status: 'Processing',
          total,
          paymentMethod,
          cardLast4,
          items,
          createdAt: new Date(),
        };

        // Create the order using the orderService
        const orderId = await createOrder(order); // Call to createOrder function
        console.log('Order created successfully with ID:', orderId);

        // Call the onCheckoutComplete callback with the order data
        onCheckoutComplete(order);

        // Redirect to a confirmation page or another page
        navigate('/checkout-summary'); // Change to your desired route
      } else {
        console.error('Payment failed.');
      }
    } catch (error) {
      console.error('Error creating order: ', error);
      setError('Failed to create order: ' + error.message); // Set error message for display
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Checkout</h2>
      <label>
        Name:
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
      </label>
      <label>
        Phone:
        <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
      </label>
      <label>
        Shipping Address:
        <input type="text" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
      </label>
      <label>
        Billing Address:
        <input type="text" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required />
      </label>
      <label>
        Payment Method:
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
          <option value="">Select a payment method</option>
          <option value="Credit Card">Credit Card</option>
          <option value="PayPal">PayPal</option>
          {/* Add other payment methods as needed */}
        </select>
      </label>
      <label>
        Last 4 Digits of Card:
        <input type="text" value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} required />
      </label>
      <button type="submit">Complete Purchase</button>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
    </form>
  );
};

export default Checkout;
