// src/components/TransactionSuccess.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService'; // Updated import
import { db } from '../firebaseConfig'; // Firestore instance
import { collection, query, where, getDocs } from 'firebase/firestore'; // Import Firestore functions
import './TransactionSuccess.css';

const TransactionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const userId = queryParams.get('userId');

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false); // Track if the order has been created

  useEffect(() => {
    const createOrderAndDisplay = async () => {
      if (orderCreated || !sessionId || !userId) return; // Skip if the order is already created or IDs are missing

      const orderData = {
        timestamp: new Date().toISOString(),
        productName: 'Handcrafted Drum 1',
        productPrice: 1399.99,
        productQuantity: 1,
        orderId: Math.floor(Math.random() * 1000), // Consider generating orderId on the server
        stripeSessionId: sessionId,
        totalAmount: 2199.98,
        userId: userId,
        status: 'Order Complete',
      };

      try {
        const existingOrder = await checkIfOrderExists(sessionId);
        if (!existingOrder) {
          const orderId = await createOrder(orderData); // Use the createOrder function
          console.log('Order created with ID:', orderId);
          setOrderDetails({ ...orderData, orderId });
          setOrderCreated(true); // Set orderCreated to true to prevent further calls
        } else {
          console.log('Order already exists. Skipping creation.');
        }
      } catch (error) {
        console.error('Failed to create order:', error);
      } finally {
        setLoading(false); // Ensure loading is set to false regardless of the outcome
      }
    };

    createOrderAndDisplay();
  }, [sessionId, userId, orderCreated]); // Include orderCreated in dependencies

  const checkIfOrderExists = async (stripeSessionId) => {
    const ordersRef = collection(db, 'orders'); // Get the collection reference
    const q = query(ordersRef, where('stripeSessionId', '==', stripeSessionId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty; // If querySnapshot is not empty, order exists
  };

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
