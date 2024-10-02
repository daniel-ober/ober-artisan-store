// src/components/Checkout.js
import React, { useState, useEffect } from 'react';
import { createOrder } from '../services/firebaseService'; // Import the createOrder function
import { TextField, Button, Typography } from '@mui/material';
import CheckoutForm from './CheckoutForm'; // Ensure you're importing the CheckoutForm
import './Checkout.css';

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [userDetails, setUserDetails] = useState({
    name: '',
    address: '',
    paymentMethod: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false); // Track payment success

  useEffect(() => {
    const fetchCart = async () => {
      // Fetch cart items from local storage
      const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCart(savedCart);
    };

    fetchCart();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails({
      ...userDetails,
      [name]: value,
    });
  };

  const handlePaymentSuccess = async (paymentMethodId) => {
    setLoading(true);

    try {
      const orderData = {
        userId: 'user123', // Replace with actual user ID or get from auth
        ...userDetails,
        items: cart, // Use the cart as the items in the order
        total: cart.reduce((total, item) => total + item.price * item.quantity, 0), // Calculate total price
        status: 'pending',
        paymentId: paymentMethodId, // Add payment method ID to order data
      };

      // Call the createOrder function from firebaseConfig.js
      const orderId = await createOrder(orderData);

      setStatus(`Order placed successfully! Order ID: ${orderId}`);
      setCart([]); // Clear the cart
      localStorage.removeItem('cart'); // Remove cart from local storage
      setPaymentSuccess(true); // Indicate payment success
    } catch (error) {
      console.error('Error placing order:', error);
      setStatus('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Checkout
      </Typography>
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField
          label="Name"
          name="name"
          value={userDetails.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="checkout-input"
        />
        <TextField
          label="Address"
          name="address"
          value={userDetails.address}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="checkout-input"
        />
        <TextField
          label="Payment Method"
          name="paymentMethod"
          value={userDetails.paymentMethod}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="checkout-input"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="checkout-button"
          disabled={loading || paymentSuccess} // Disable button if loading or payment is successful
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </form>
      {status && (
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2 }}>
          {status}
        </Typography>
      )}
      {/* Include the CheckoutForm for payment processing */}
      <CheckoutForm onPaymentSuccess={handlePaymentSuccess} />
    </div>
  );
};

export default Checkout;
