import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Typography, Button } from '@mui/material';
import './OrderDetails.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedOrders = await Promise.all(
            querySnapshot.docs.map(async (docSnap) => {
              const orderData = { id: docSnap.id, ...docSnap.data() };
              if (Array.isArray(orderData.relatedProjects)) {
                const fullProjects = await Promise.all(
                  orderData.relatedProjects.map(async (proj) => {
                    try {
                      const projRef = doc(db, 'projects', proj.projectId);
                      const projSnap = await getDoc(projRef);
                      return projSnap.exists() ? { id: projSnap.id, ...projSnap.data() } : null;
                    } catch {
                      return null;
                    }
                  })
                );
                orderData.projectDetails = fullProjects.filter(Boolean);
              }
              return orderData;
            })
          );
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

  if (loading) return <div>Loading orders...</div>;

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
                ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                : 'Date not available'}
            </Typography>
            <Typography variant="body1">
              <strong>Order Number:</strong> {order.id}
            </Typography>
            <Typography variant="body1">
              <strong>Order Total:</strong> ${order.totalAmount?.toFixed(2) || '0.00'}
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
                  <strong>Customer Name:</strong> {order.customerName || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {order.customerEmail || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Shipping Address:</strong> {order.customerAddress || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Subtotal:</strong> ${order.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2">
                  <strong>Shipping Cost:</strong> $0.00
                </Typography>
                <Typography variant="body2">
                  <strong>Sales Tax:</strong> $0.00
                </Typography>
                <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                  <strong>Grand Total:</strong> ${order.totalAmount?.toFixed(2) || '0.00'}
                </Typography>

                {order.projectDetails?.length > 0 && (
                  <>
                    <Typography variant="body2" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                      Related Projects:
                    </Typography>
                    <ul>
                      {order.projectDetails.map((proj) => (
                        <li key={proj.id}>
                          {proj.projectName || 'Unnamed Project'} (ID: {proj.id})
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {order.systemHistory?.length > 0 && (
                  <>
                    <Typography variant="body2" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                      System History:
                    </Typography>
                    <ul>
                      {order.systemHistory.map((log, idx) => (
                        <li key={idx}>
                          {log.event} — {new Date(log.timestamp).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;