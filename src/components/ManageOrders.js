// src/components/ManageOrders.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getBadgeClass } from '../utils/statusConfig';
import {
  getOrderStatusFromItems,
  getOverviewStatus
} from '../utils/statusConfig';
import ViewOrderModal from './ViewOrderModal';
import './ManageOrders.css';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hideFulfilled, setHideFulfilled] = useState(true);

  const determineOrderStatus = (items) => {
    if (!items || items.length === 0) return 'No Items';
    const statuses = items.map((item) => item.status || 'Preparing');
    if (statuses.every((status) => ['Shipped', 'Delivered'].includes(status)))
      return 'Fulfilled';
    if (statuses.every((status) => status === 'Canceled')) return 'Canceled';
    if (statuses.some((status) => status === 'Back Ordered'))
      return 'Partially Fulfilled / Back Ordered';
    if (statuses.some((status) => status === 'Ready for Shipment'))
      return 'Ready for Shipment';
    if (statuses.some((status) => status === 'Packaged'))
      return 'Order Started';
    return 'Order Started';
  };

  useEffect(() => {
    fetchOrders();
  }, [hideFulfilled]);

  const getOrderBadgeClass = (status) => {
    const lower = status.toLowerCase();

    if (lower === 'fulfilled') return 'badge-green';
    if (
      lower.includes('partial') ||
      lower.includes('started') ||
      lower.includes('shipment')
    )
      return 'badge-yellow';
    if (lower.includes('canceled')) return 'badge-red';

    return 'badge-yellow';
  };

  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = await Promise.all(
        orderSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let derivedStatus = data.status;
          let derivedOverview = data.overviewStatus;

          if (!derivedStatus || derivedStatus === 'order started') {
            derivedStatus = getOrderStatusFromItems(data.items || []);
          }

          if (!derivedOverview) {
            derivedOverview = getOverviewStatus('order', derivedStatus);
            await updateDoc(doc(db, 'orders', docSnap.id), {
              overviewStatus: derivedOverview,
              status: derivedStatus, // keep in sync
            });
          }

          return {
            id: docSnap.id,
            orderDate:
              data.createdAt?.toDate().toLocaleString() || 'No date available',
            customerName: data.customerName || 'No name available',
            total:
              typeof data.totalAmount === 'number'
                ? data.totalAmount.toFixed(2)
                : 'N/A',
            status: derivedStatus,
            overviewStatus: derivedOverview,
            ...data, // ⭐ includes trackingNumber if present
          };
        })
      );

      ordersList.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setOrders(ordersList);
      applyFilters(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const applyFilters = (ordersList) => {
    const filtered = ordersList.filter((order) => {
      if (hideFulfilled && order.overviewStatus === 'completed') {
        return false;
      }
      return true;
    });
    setFilteredOrders(filtered);
  };

  const handleSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase();
    setSearchId(searchQuery);

    const filtered = orders.filter((order) => {
      const orderIdRaw = order.id.replace(/-/g, '').toLowerCase();
      return orderIdRaw.includes(searchQuery);
    });

    setFilteredOrders(filtered);
  };

  const handleClearSearch = () => {
    setSearchId('');
    applyFilters(orders);
  };

  const toggleHideFulfilled = () => {
    setHideFulfilled((prev) => !prev);
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this order?'
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      fetchOrders(); // Refresh the order list after deletion
    } catch (error) {
      console.error('❌ Error deleting order:', error);
    }
  };

  return (
    <div className="manage-orders">
      <h2>Manage Orders</h2>
      <div className="controls-container">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search by Firestore ID"
            value={searchId}
            onChange={handleSearch}
          />
          <button onClick={handleClearSearch}>Clear</button>
        </div>

        <div className="filter-controls">
          <label className="hide-fulfilled-label">
            <input
              type="checkbox"
              checked={hideFulfilled}
              onChange={toggleHideFulfilled}
            />
            Hide Completed/Canceled
          </label>
        </div>
      </div>

      <table className="manage-orders-table">
        <thead>
          <tr>
            <th>Order Status</th>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Total</th>
            <th>Tracking</th> {/* ⭐ new column */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="7">No orders available</td> {/* ⭐ colSpan updated */}
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.id}>
                <td onClick={() => handleRowClick(order)}>
                  <span
                    className={`status-badge ${getBadgeClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td onClick={() => handleRowClick(order)}>{order.id}</td>
                <td onClick={() => handleRowClick(order)}>{order.orderDate}</td>
                <td onClick={() => handleRowClick(order)}>
                  {order.customerName}
                </td>
                <td onClick={() => handleRowClick(order)}>${order.total}</td>
                {/* ⭐ tracking cell – click to edit in modal */}
                <td
                  className="tracking-cell"
                  onClick={() => handleRowClick(order)}
                >
                  {order.trackingNumber || 'Add tracking'}
                </td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && selectedOrder && (
        <ViewOrderModal
          orderDetails={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdateOrder={(updatedOrder) => {
            const updatedOrders = orders.map((o) =>
              o.id === updatedOrder.id ? updatedOrder : o
            );
            setOrders(updatedOrders);
            applyFilters(updatedOrders);
          }}
        />
      )}
    </div>
  );
};

export default ManageOrders;