// src/components/ManageOrders.js
import React, { useEffect, useState } from 'react';
import { fetchOrders, deleteOrder } from '../services/orderService';
import './ManageOrders.css'; // Create this file for styling

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getOrders = async () => {
      try {
        const ordersData = await fetchOrders();
        setOrders(ordersData);
      } catch (error) {
        setError('Error fetching orders: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, []);

  const handleDelete = async (orderId) => {
    try {
      await deleteOrder(orderId);
      setOrders((prevOrders) => prevOrders.filter(order => order.id !== orderId));
    } catch (error) {
      setError('Error deleting order: ' + error.message);
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="manage-orders-container">
      <h1>Manage Orders</h1>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>Order Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customerName}</td> {/* Adjust based on your order structure */}
              <td>${order.total}</td> {/* Adjust based on your order structure */}
              <td>{order.status}</td> {/* Adjust based on your order structure */}
              <td>
                <button className="view-btn">View</button>
                <button className="delete-btn" onClick={() => handleDelete(order.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrders;
