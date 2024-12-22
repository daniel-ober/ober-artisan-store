// src/components/CheckoutSummary.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutSummary.css'; // Make sure the styles are saved in this file

const CheckoutSummary = () => {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { clearCartOnCheckout } = useCart();
  const printRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        const guestToken = params.get('guest_token');

        console.log('sessionId:', sessionId);
        console.log('guestToken:', guestToken);

        if (!sessionId || !guestToken) {
          console.error('Missing session ID or guest token.');
          setError('Missing session ID or guest token.');
          return;
        }

        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('stripeSessionId', '==', sessionId),
          where('guestToken', '==', guestToken)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error('No matching order found for sessionId and guestToken.');
          setError('Order not found.');
          return;
        }

        const orderDoc = querySnapshot.docs[0];
        const orderData = orderDoc.data();
        const createdAt = orderData.createdAt
          ? orderData.createdAt.toDate().toLocaleString()
          : 'Invalid Date';

        console.log('Order fetched successfully:', orderData);

        setOrder({ id: orderDoc.id, ...orderData, createdAt });
        setError(null);

        // Clear cart only once
        clearCartOnCheckout();
      } catch (err) {
        console.error('Error fetching order:', err.message);
        setError('Error fetching order details. Please contact support.');
      }
    };

    fetchOrder();
  }, []); // Removed `clearCartOnCheckout` to prevent loop

  const handleRegisterClick = () => {
    navigate('/register', { state: { orderId: order ? order.id : null } });
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const newWindow = window.open('', '', 'width=800,height=600');
      newWindow.document.write(`<html><head><title>Print Order Details</title></head><body>${printContent}</body></html>`);
      newWindow.document.close();
      newWindow.print();
    }
  };

  if (error) {
    return (
      <div className="transaction-success">
        <h1>Order Not Found</h1>
        <p>{error}</p>
        <div className="signup-banner">
          <p>Click below to track your order:</p>
          <button className="signup-button" onClick={handleRegisterClick}>
            Track Your Order
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return <p>Loading order details...</p>;
  }

  const isGuest = order.userId === 'guest';

  return (
    <div className="transaction-success">
      <div ref={printRef} className="order-details">
        <h1>Order Summary</h1>
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Order Date:</strong> {order.createdAt}</p>
        <h2>Products:</h2>
        <ul>
          {order.products.map((product, index) => (
            <li key={index}>
              {product.name} - {product.quantity} x ${product.price.toFixed(2)}
            </li>
          ))}
        </ul>
        <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
        <p><strong>Customer Name:</strong> {order.customerName}</p>
        <p><strong>Email:</strong> {order.customerEmail}</p>
        <p><strong>Phone:</strong> {order.customerPhone || 'Not provided'}</p>
        <p><strong>Shipping Address:</strong> {order.customerAddress}</p>
        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
        {order.cardLastFour && <p><strong>Last Four Digits of Card:</strong> **** **** **** {order.cardLastFour}</p>}
      </div>
      <button className="signup-button" onClick={handlePrint}>
        Print Order Details
      </button>
      {isGuest && (
        <div className="signup-banner">
          <p>Sign up to save your order and track future purchases!</p>
          <button className="signup-button" onClick={handleRegisterClick}>
            Click Here to Register
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutSummary;
