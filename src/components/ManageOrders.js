import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewOrderModal from './ViewOrderModal';
import AddOrderModal from './AddOrderModal';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState('');
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
      setFilteredOrders(ordersList);
    };

    fetchOrders();
  }, []);

  const handleSearch = async (e) => {
    const searchQuery = e.target.value.toLowerCase();
    setSearchId(searchQuery);

    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      const orderIdRaw = order.id.replace(/-/g, '').toLowerCase();
      return orderIdRaw.includes(searchQuery);
    });

    setFilteredOrders(filtered);
  };

  const handleClearSearch = () => {
    setSearchId(''); // Clear the search field
    setFilteredOrders(orders); // Reset the filtered orders to show all
  };

  // Helper function to format Firestore order ID
  const formatOrderId = (id) => {
    if (id && id.length > 4) {
      const formattedId = `${id.slice(0, id.length - 4)}-${id.slice(id.length - 4)}`;
      return formattedId;
    }
    return id;
  };

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
      setFilteredOrders(filteredOrders.filter((order) => order.id !== orderId));
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
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Firestore ID"
          value={searchId}
          onChange={handleSearch}
        />
        <button onClick={handleClearSearch}>Clear</button> {/* Clear button */}
      </div>
      <button className="add-btn" onClick={handleAddOrder}>
        Add Order
      </button>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th data-label="Order ID">Order ID</th>
            <th data-label="Date">Date</th>
            <th data-label="Customer Name">Customer Name</th>
            <th data-label="Total">Total</th>
            <th data-label="Actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="6">No orders available</td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order ID">{formatOrderId(order.id)}</td>
                <td data-label="Date">{order.orderDate}</td>
                <td data-label="Customer Name">{order.customerName}</td>
                <td data-label="Total">${order.total}</td>
                <td data-label="Actions">
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
            setFilteredOrders([newOrder, ...filteredOrders]);
          }}
        />
      )}
    </div>
  );
};

export default ManageOrders;