import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';  // Import CartContext

const CheckoutSummary = () => {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { clearCartOnCheckout } = useCart();  // Access the clearCartOnCheckout function

  useEffect(() => {
    const fetchOrder = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const guestToken = params.get('guest_token');

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('stripeSessionId', '==', sessionId),
          where('guestToken', '==', guestToken)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          const orderData = orderDoc.data();
          const createdAt = orderData.createdAt ? orderData.createdAt.toDate().toLocaleString() : 'Invalid Date';
          setOrder({ id: orderDoc.id, ...orderData, createdAt });
          setError(null);

          // Trigger cart clearing after successful checkout
          clearCartOnCheckout();  // Call to clear the cart
        } else {
          throw new Error('Order not found.');
        }
      } catch (err) {
        console.error('Error fetching order:', err.message);
        setError('Error fetching order details. Please contact support.');
      }
    };

    fetchOrder();
  }, [clearCartOnCheckout]);  // Make sure to include clearCartOnCheckout as a dependency

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
      {isGuest ? (
        <>
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
        </>
      ) : (
        <>
          <p>Order ID: {order.stripeSessionId}</p>
          <p>Order Date: {order.createdAt}</p>
          <p>Customer Name: {order.customerName}</p>
          <p>Total Amount: ${order.totalAmount.toFixed(2)}</p>
          <h2>Products:</h2>
          <ul>
            {order.products.map((product, index) => (
              <li key={index}>
                {product.name} - {product.quantity} x ${product.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      )}

      {isGuest && (
        <button onClick={handleRegisterClick}>Click Here to Track Your Order</button>
      )}
    </div>
  );
};

export default CheckoutSummary;
