// src/components/TransactionSuccess.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CreateOrder } from '../createOrder'; // Adjust the import path if necessary
import './TransactionSuccess.css';

const TransactionSuccess = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const sessionId = query.get('session_id');
  const userId = query.get('userId');

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId && userId) {
      const orderData = {
        timestamp: new Date().toISOString(),
        itemName: 'Handcrafted Drum 1',
        itemPrice: 1399.99,
        itemQuantity: 1,
        orderId: Math.floor(Math.random() * 1000),
        stripeSessionId: sessionId,
        totalAmount: 2199.98,
        userId: userId,
        status: 'Order Complete',
      };

      // Create order in Firestore
      CreateOrder(orderData)
        .then((orderId) => {
          setOrderDetails({ ...orderData, orderId });
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to create order:', error);
          setLoading(false);
        });
    } else {
      setLoading(false); // If no sessionId or userId, stop loading
    }
  }, [sessionId, userId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="transaction-success">
      <h1>Thank You for Your Order!</h1>
      <p>Your payment was successful.</p>
      {orderDetails && (
        <div className="order-details">
          <h2>Order Details</h2>
          <p><strong>Item Name:</strong> {orderDetails.itemName}</p>
          <p><strong>Item Price:</strong> ${orderDetails.itemPrice.toFixed(2)}</p>
          <p><strong>Item Quantity:</strong> {orderDetails.itemQuantity}</p>
          <p><strong>Total Amount:</strong> ${orderDetails.totalAmount.toFixed(2)}</p>
          <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
          <p><strong>Status:</strong> {orderDetails.status}</p>
          <p>Your order will be shipped within X days. You can find your order details and status in your account page.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionSuccess;
