import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Ensure the path is correct
import { doc, setDoc } from 'firebase/firestore';

const Checkout = ({ onCheckoutComplete }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [total, setTotal] = useState(0); // Example for total amount
  const [items, setItems] = useState([]); // Example for ordered items

  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logic for processing payment here (e.g., with Stripe)
    try {
      // Example: Simulate payment processing (replace with actual payment logic)
      const paymentSuccessful = true; // Simulated payment success

      if (paymentSuccessful) {
        // On successful payment, create the order object
        const order = {
          id: `ORDER_${Date.now()}`, // Generate a unique order ID
          timestamp: new Date().toISOString(),
          customerName,
          customerPhone,
          shippingAddress,
          billingAddress,
          status: 'Processing',
          priority: 'Normal',
          total,
          paymentMethod,
          cardLast4,
          items,
          subtotal: total, // If needed
          tax: 0, // Calculate tax if applicable
          internalNotes: '', // Capture any internal notes
          stripeInvoiceUrl: '', // Capture invoice URL if applicable
        };

        // Create a new order document in Firestore
        const orderRef = doc(db, 'orders', `${Date.now()}`); // Use a timestamp as an ID
        await setDoc(orderRef, order);
        console.log('Order created successfully!');

        // Call the onCheckoutComplete callback with the order data
        onCheckoutComplete(order);

        // Redirect to a confirmation page or another page
        navigate('/success'); // Change to your desired route
      } else {
        console.error('Payment failed.');
      }
    } catch (error) {
      console.error('Error creating order: ', error);
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
    </form>
  );
};

export default Checkout;
