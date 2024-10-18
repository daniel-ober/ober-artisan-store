// src/components/CheckoutSummary.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { db } from '../firebaseConfig'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CheckoutSummary.css';

const CheckoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const userId = queryParams.get('userId');

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false); 

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderCreated || !sessionId || !userId) return;

      try {
        const existingOrder = await checkIfOrderExists(sessionId);
        if (!existingOrder) {
          const orderData = await fetchOrderFromWebhook(sessionId); // Assuming webhook data is stored in Firestore or another DB
          const orderId = await createOrder(orderData); 
          setOrderDetails({ ...orderData, orderId });
          setOrderCreated(true); 
        } else {
          const orderData = await fetchOrderFromFirestore(sessionId); // Fetch existing order
          setOrderDetails(orderData);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, userId, orderCreated]);

  const checkIfOrderExists = async (stripeSessionId) => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('stripeSessionId', '==', stripeSessionId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const fetchOrderFromWebhook = async (sessionId) => {
    // Logic to fetch the webhook data from Firestore or your server
    // You will fetch the order from the webhook session
    // e.g. Fetch customer name, address, email, phone, items, shipping, and total cost
    return {
      timestamp: new Date().toISOString(),
      customerName: 'John Doe',
      customerEmail: 'johndoe@example.com',
      customerPhone: '+123456789',
      customerAddress: '123 Main St, City, State, ZIP',
      products: [
        {
          name: 'Handcrafted Drum',
          description: 'Custom drum with amazing sound',
          price: 1399.99,
          quantity: 1,
        },
        {
          name: 'Drumsticks',
          description: 'Pair of premium drumsticks',
          price: 49.99,
          quantity: 2,
        },
      ],
      shipping: 50.0,
      taxes: 100.0,
      totalAmount: 1649.97,
      stripeSessionId: sessionId,
      status: 'Payment Succeeded', // or 'Payment Failed' based on webhook data
    };
  };

  const fetchOrderFromFirestore = async (sessionId) => {
    // Logic to fetch order from Firestore if it already exists
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="checkout-summary">
      <h1>Order Summary</h1>
      {orderDetails && (
        <div className="order-details">
          <h2>Order Details</h2>
          <p><strong>Customer Name:</strong> {orderDetails.customerName}</p>
          <p><strong>Email:</strong> {orderDetails.customerEmail}</p>
          <p><strong>Phone:</strong> {orderDetails.customerPhone}</p>
          <p><strong>Delivery Address:</strong> {orderDetails.customerAddress}</p>
          <h3>Products:</h3>
          {orderDetails.products.map((product, index) => (
            <div key={index} className="product-details">
              <p><strong>Product Name:</strong> {product.name}</p>
              <p><strong>Description:</strong> {product.description}</p>
              <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
              <p><strong>Quantity:</strong> {product.quantity}</p>
              <p><strong>Subtotal:</strong> ${(product.price * product.quantity).toFixed(2)}</p>
            </div>
          ))}
          <p><strong>Shipping:</strong> ${orderDetails.shipping.toFixed(2)}</p>
          <p><strong>Taxes:</strong> ${orderDetails.taxes.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> ${orderDetails.totalAmount.toFixed(2)}</p>
          <p><strong>Payment Status:</strong> {orderDetails.status}</p>
        </div>
      )}
      <div className="signup-banner">
        <p>Sign up for our newsletter to receive exclusive promotions, updates, and new product launches.</p>
        <button onClick={() => navigate('/signup')}>Sign Up Now</button>
      </div>
    </div>
  );
};

export default CheckoutSummary;
