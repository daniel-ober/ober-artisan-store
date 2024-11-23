import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const OrderLookup = () => {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  const handleLookup = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('customerEmail', '==', email),
        where('__name__', '==', orderId)  // Use Firestore document ID (orderId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const order = querySnapshot.docs[0].data();
        // Check if the user is a guest to only show allowed fields
        if (order.userId === 'guest') {
          const { products, status } = order;
          setOrderDetails({ products, status });
        } else {
          setOrderDetails(order);
        }
        setError(null);
      } else {
        throw new Error('Order not found.');
      }
    } catch (err) {
      console.error('Error fetching order:', err.message);
      setOrderDetails(null);
      setError('Order not found.');
    }
  };

  return (
    <div>
      <h1>Order Lookup</h1>
      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Order ID:
        <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
      </label>
      <button onClick={handleLookup}>Lookup Order</button>

      {orderDetails && (
        <div>
          <h2>Order Details</h2>
          {orderDetails.status && <p>Status: {orderDetails.status}</p>}
          <h3>Products:</h3>
          <ul>
            {orderDetails.products.map((product, index) => (
              <li key={index}>
                {product.name} - {product.quantity} x ${product.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default OrderLookup;
