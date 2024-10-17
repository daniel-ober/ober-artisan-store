import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateOrder } from '../createOrder'; // Adjust the import path if necessary
import './TransactionSuccess.css';

const TransactionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const sessionId = query.get('session_id');
  const userId = query.get('userId');

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousSessionId, setPreviousSessionId] = useState(null); // Track previous session ID
  const orderCreatedRef = useRef(false); // Use a ref to track order creation

  useEffect(() => {
    const createOrder = async () => {
      // Log the sessionId and userId for debugging
      console.log('Session ID:', sessionId);
      console.log('User ID:', userId);
      console.log('Previous Session ID:', previousSessionId);
      console.log('Order Created:', orderCreatedRef.current);

      // Check if sessionId and userId exist and if an order hasn't been created for this session
      if (sessionId && userId && previousSessionId !== sessionId && !orderCreatedRef.current) {
        console.log('Attempting to create order...');

        const orderData = {
          timestamp: new Date().toISOString(),
          productName: 'Handcrafted Drum 1', // Adjust as necessary
          productPrice: 1399.99, // Adjust as necessary
          productQuantity: 1, // Quantity of the product
          orderId: Math.floor(Math.random() * 1000), // For testing
          stripeSessionId: sessionId, // Stripe session ID from query params
          totalAmount: 2199.98, // Total amount (for testing)
          userId: userId, // User ID from query params
          status: 'Order Complete', // Order status
        };

        try {
          const orderId = await CreateOrder(orderData);
          console.log('Order created with ID:', orderId);
          setOrderDetails({ ...orderData, orderId });
          orderCreatedRef.current = true; // Mark the order as created
          setPreviousSessionId(sessionId); // Set previous session ID to current
        } catch (error) {
          console.error('Failed to create order:', error);
        }
      } else {
        console.log('Order creation skipped. Either session ID or user ID is missing, or the order has already been created.');
      }

      // Stop loading after checking conditions
      setLoading(false);
    };

    createOrder();
  }, [sessionId, userId]); // Remove orderCreated and previousSessionId from dependencies

  if (loading) return <p>Loading...</p>;

  return (
    <div className="transaction-success">
      <h1>Thank You for Your Order!</h1>
      <p>Your payment was successful.</p>
      {orderDetails && (
        <div className="order-details">
          <h2>Order Details</h2>
          <p><strong>Product Name:</strong> {orderDetails.productName}</p>
          <p><strong>Product Price:</strong> ${orderDetails.productPrice.toFixed(2)}</p>
          <p><strong>Product Quantity:</strong> {orderDetails.productQuantity}</p>
          <p><strong>Total Amount:</strong> ${orderDetails.totalAmount.toFixed(2)}</p>
          <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
          <p><strong>Status:</strong> {orderDetails.status}</p>
          <p>Your order will be shipped within X days. You can find your order details and status in your account page.</p>
        </div>
      )}
      <div className="signup-banner">
        <p>Sign up for our newsletter to receive exclusive promotions, updates, and new product launches.</p>
        <button onClick={() => navigate('/signup')}>Sign Up Now</button>
      </div>
    </div>
  );
};

export default TransactionSuccess;
