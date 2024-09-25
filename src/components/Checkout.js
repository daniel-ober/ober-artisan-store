import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { TextField, Button, Typography } from '@mui/material';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderId = Date.now(); // Generate a unique ID based on timestamp
      await addDoc(collection(firestore, 'orders'), {
        id: orderId, // Include the generated ID
        ...userDetails,
        cart,
        placedAt: new Date(),
      });

      setStatus('Order placed successfully!');
      setCart([]); // Clear the cart
      localStorage.removeItem('cart'); // Remove cart from local storage
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
      <form onSubmit={handleSubmit}>
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
          disabled={loading}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </form>
      {status && (
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2 }}>
          {status}
        </Typography>
      )}
    </div>
  );
};

export default Checkout;
