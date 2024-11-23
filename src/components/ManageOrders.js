// src/components/ManageOrders.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Add deleteDoc and doc for deletion
import { db } from '../firebaseConfig'; // Ensure the correct path to firebaseConfig
import ViewOrderModal from './ViewOrderModal'; // Import the modal component

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // Track the selected order
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal state
  const [loading, setLoading] = useState(false); // Track loading state for deletion

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = orderSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          orderDate: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'No date available',
          customerName: data.customerName || 'No name available',
          total: typeof data.totalAmount === 'number' ? data.totalAmount.toFixed(2) : 'N/A',
          status: data.status || 'No status available',
          ...data // Include all other order fields
        };
      });
      setOrders(ordersList);
    };

    fetchOrders();
  }, []);

  // Function to open modal and set selected order
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null); // Clear selected order
  };

  // Function to delete an order
  const handleDeleteOrder = async (orderId) => {
    setLoading(true); // Optional loading indicator

    try {
      // Delete the order from Firestore
      await deleteDoc(doc(db, 'orders', orderId));

      // Remove the order from the state
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-orders">
      <h2>Manage Orders</h2>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Order ID</th>
            <th>Customer Name</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="6">No orders available</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderDate}</td>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>${order.total}</td>
                <td>{order.status}</td>
                <td>
                  {/* View button to open the modal */}
                  <button className="view-btn" onClick={() => handleViewOrder(order)}>View</button>
                  {/* Delete button to delete the order */}
                  <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)} disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Render ViewOrderModal if modal is open and an order is selected */}
      {isModalOpen && selectedOrder && (
        <ViewOrderModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ManageOrders;
