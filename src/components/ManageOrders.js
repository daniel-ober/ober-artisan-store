import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewOrderModal from './ViewOrderModal'; // Default export
import AddOrderModal from './AddOrderModal'; // Default export

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = orderSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          orderDate: data.timestamp
            ? new Date(data.timestamp).toLocaleString()
            : 'No date available',
          customerName: data.customerName || 'No name available',
          total:
            typeof data.totalAmount === 'number'
              ? data.totalAmount.toFixed(2)
              : 'N/A',
          status: data.status || 'No status available',
          ...data,
        };
      });
      setOrders(ordersList);
    };

    fetchOrders();
  }, []);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(orders.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = () => {
    setIsAddModalOpen(true);
  };

  const handleAddOrderClose = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div className="manage-orders">
      <h2>Manage Orders</h2>
      <button className="add-btn" onClick={handleAddOrder}>
        Add Order
      </button>
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
                  <button
                    className="view-btn"
                    onClick={() => handleViewOrder(order)}
                  >
                    View
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && selectedOrder && (
        <ViewOrderModal order={selectedOrder} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <AddOrderModal
          onClose={handleAddOrderClose}
          onOrderAdded={(newOrder) => {
            setOrders([newOrder, ...orders]);
          }}
        />
      )}
    </div>
  );
};

export default ManageOrders;
