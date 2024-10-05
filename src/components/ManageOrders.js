// src/components/ManageOrders.js
import React, { useEffect, useState } from 'react';
import { fetchOrders, updateOrderInFirestore } from '../services/orderService';
import './ManageOrders.css'; // Create this file for styling

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status options for orders
  const statusOptions = ['Order Complete', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    const getOrders = async () => {
      try {
        const ordersData = await fetchOrders();
        // Set default status to "Order Complete" if not already set
        const updatedOrdersData = ordersData.map(order => ({
          ...order,
          status: order.status || 'Order Complete' // Default status if none exists
        }));
        setOrders(updatedOrdersData);
      } catch (error) {
        setError('Error fetching orders: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderInFirestore(orderId, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      setError('Error updating order status: ' + error.message);
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
            <th>Order Date</th>
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
              <td>{new Date(order.timestamp).toLocaleDateString()}</td> {/* Format the date */}
              <td>{order.id}</td>
              <td>{order.customerName}</td> {/* Adjust based on your order structure */}
              <td>${order.total}</td> {/* Adjust based on your order structure */}
              <td>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button className="view-btn">View</button>
                {/* Edit button removed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrders;
