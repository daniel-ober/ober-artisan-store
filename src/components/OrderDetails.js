// src/components/OrderDetails.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Typography, Button } from '@mui/material';
import './OrderDetails.css';

const OrderDetails = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const fetchedOrders = querySnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setOrders(fetchedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpandDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="order-details-container">
      <Typography variant="h4" gutterBottom>
        Order History
      </Typography>
      {orders.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <Typography variant="body1">
              <strong>Order Placed:</strong>{' '}
              {order.createdAt
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                : 'Date not available'}
            </Typography>
            <Typography variant="body1">
              <strong>Order Number:</strong> {order.id}
            </Typography>
            <Typography variant="body1">
              <strong>Order Total:</strong> $
              {order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
            </Typography>
            <Typography variant="body1">
              <strong>Tracking:</strong>{' '}
              {order.trackingNumber || 'Tracking will appear here once shipped.'}
            </Typography>

            <div className="order-actions">
              <Button variant="contained" color="primary">
                View Invoice
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                style={{ marginLeft: '10px' }}
                onClick={() => toggleExpandDetails(order.id)}
              >
                {expandedOrder === order.id ? 'Hide Details' : 'Expand Details'}
              </Button>
            </div>

            {expandedOrder === order.id && (
              <div className="order-details-expanded">
                <Typography variant="body2">
                  <strong>Shipping To:</strong>{' '}
                  {order.customerAddress || 'No shipping address provided'}
                </Typography>
                <Typography variant="body2">
                  <strong>Billing Address:</strong>{' '}
                  {order.customerAddress || 'No billing address provided'}
                </Typography>
                <Typography variant="body2">
                  <strong>Subtotal:</strong> $
                  {order.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2">
                  <strong>Shipping Cost:</strong> $0.00
                </Typography>
                <Typography variant="body2">
                  <strong>Sales Tax:</strong> $0.00
                </Typography>
                <Typography
                  variant="body2"
                  style={{ fontWeight: 'bold', marginTop: 6 }}
                >
                  <strong>Grand Total:</strong> $
                  {order.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" style={{ marginTop: 6 }}>
                  <strong>Tracking Number:</strong>{' '}
                  {order.trackingNumber || 'Pending'}
                </Typography>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OrderDetails;