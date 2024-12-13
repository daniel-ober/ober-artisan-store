import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CheckoutSummary = () => {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { clearCartOnCheckout } = useCart();

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
        const createdAt = orderData.createdAt ? orderData.createdAt.toDate().toLocaleString() : 'Invalid Date';

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

  if (error) {
    return (
      <div>
        <h1>Order Not Found</h1>
        <p>{error}</p>
        <button onClick={handleRegisterClick}>Click Here to Track Your Order</button>
      </div>
    );
  }

  if (!order) {
    return <p>Loading order details...</p>;
  }

  const isGuest = order.userId === 'guest';

  return (
    <div>
      <h1>Order Summary</h1>
      <p>Order ID: {order.id}</p>
      <p>Order Date: {order.createdAt}</p>
      <h2>Products:</h2>
      <ul>
        {order.products.map((product, index) => (
          <li key={index}>
            {product.name} - {product.quantity} x ${product.price.toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total Amount: ${order.totalAmount.toFixed(2)}</p>

      {isGuest && <button onClick={handleRegisterClick}>Click Here to Track Your Order</button>}
    </div>
  );
};

export default CheckoutSummary;
