import React, { useState } from 'react';

const Checkout = ({ onCheckoutComplete }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [total, setTotal] = useState(0); // Example for total amount
  const [items, setItems] = useState([]); // Example for ordered items

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logic for processing payment here (e.g., with Stripe)

    // On successful payment, create the order object
    const order = {
      id: 'ORDER_ID', // You should generate or retrieve the actual order ID
      timestamp: new Date().toISOString(),
      customerName, // Capture customer name
      customerPhone,
      shippingAddress,
      billingAddress,
      status: 'Processing', // Set appropriate status
      priority: 'Normal', // Set default priority
      total,
      paymentMethod,
      cardLast4,
      items,
      subtotal: total, // If needed
      tax: 0, // Calculate tax if applicable
      internalNotes: '', // Capture any internal notes
      stripeInvoiceUrl: '', // Capture invoice URL if applicable
    };

    // Call the onCheckoutComplete callback with the order data
    onCheckoutComplete(order);
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
      {/* Add any additional fields as needed */}
      <button type="submit">Complete Purchase</button>
    </form>
  );
};

export default Checkout;
