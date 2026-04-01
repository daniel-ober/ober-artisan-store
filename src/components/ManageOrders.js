// src/components/ManageOrders.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  getBadgeClass,
  getOrderStatusFromItems,
  getOverviewStatus,
} from '../utils/statusConfig';
import ViewOrderModal from './ViewOrderModal';
import './ManageOrders.css';

const formatDate = (value) => {
  if (!value) return '—';

  try {
    if (value?.toDate) {
      return value.toDate().toLocaleString();
    }

    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  } catch {
    return '—';
  }
};

const formatMoney = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

const getCreatedAtMs = (value) => {
  if (!value) return 0;

  try {
    if (value?.toDate) return value.toDate().getTime();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  } catch {
    return 0;
  }
};

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);

      const ordersList = await Promise.all(
        orderSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          const derivedStatus = getOrderStatusFromItems(data.items || []);
          const derivedOverview = getOverviewStatus('order', derivedStatus);

          if (
            data.status !== derivedStatus ||
            data.overviewStatus !== derivedOverview
          ) {
            await updateDoc(doc(db, 'orders', docSnap.id), {
              status: derivedStatus,
              overviewStatus: derivedOverview,
            });
          }

          return {
            id: docSnap.id,
            ...data,

            createdAtMs: getCreatedAtMs(data.createdAt),
            orderDate: formatDate(data.createdAt),
            customerName: data.customerName || 'No name available',
            totalDisplay: formatMoney(data.totalAmount),
            itemsCount: Array.isArray(data.items) ? data.items.length : 0,
            status: derivedStatus,
          };
        })
      );

      ordersList.sort((a, b) => b.createdAtMs - a.createdAtMs);
      setOrders(ordersList);
    } catch (fetchError) {
      console.error('Error fetching orders:', fetchError);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const search = normalize(searchValue);

    return orders.filter((order) => {
      if (hideCompleted && order.overviewStatus === 'completed') {
        return false;
      }

      if (
        statusFilter !== 'all' &&
        normalize(order.overviewStatus) !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      const haystack = [
        order.id,
        order.customerName,
        order.customerEmail,
        order.email,
        order.status,
        order.overviewStatus,
        order.trackingNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/-/g, '');

      return haystack.includes(search.replace(/-/g, ''));
    });
  }, [orders, searchValue, statusFilter, hideCompleted]);

  const counts = useMemo(() => {
    const total = orders.length;
    const newCount = orders.filter((o) => o.overviewStatus === 'new').length;
    const inProgressCount = orders.filter(
      (o) => o.overviewStatus === 'inProgress'
    ).length;
    const completedCount = orders.filter(
      (o) => o.overviewStatus === 'completed'
    ).length;

    return {
      total,
      newCount,
      inProgressCount,
      completedCount,
    };
  }, [orders]);

  const handleClearSearch = () => {
    setSearchValue('');
    setStatusFilter('all');
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this order?'
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (deleteError) {
      console.error('Error deleting order:', deleteError);
      setError('Failed to delete order.');
    }
  };

  return (
    <div className="manage-orders-v2">
      <div className="manage-orders-v2__header">
        <div className="manage-orders-v2__header-copy">
          <div className="manage-orders-v2__eyebrow">Admin Workspace</div>
          <h2>Manage Orders</h2>
          <p>
            Review incoming orders, track fulfillment progress, manage shipping,
            and quickly open any order for full detail editing.
          </p>
        </div>

        <div className="manage-orders-v2__summary">
          <div className="manage-orders-v2__pill manage-orders-v2__pill--neutral">
            Total: {counts.total}
          </div>
          <div className="manage-orders-v2__pill manage-orders-v2__pill--new">
            New: {counts.newCount}
          </div>
          <div className="manage-orders-v2__pill manage-orders-v2__pill--progress">
            In Progress: {counts.inProgressCount}
          </div>
          <div className="manage-orders-v2__pill manage-orders-v2__pill--completed">
            Completed: {counts.completedCount}
          </div>
        </div>
      </div>

      <div className="manage-orders-v2__toolbar">
        <div className="manage-orders-v2__filter-group manage-orders-v2__filter-group--search">
          <label htmlFor="orders-search">Search</label>
          <input
            id="orders-search"
            type="text"
            placeholder="Search order ID, customer, email, tracking..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="manage-orders-v2__filter-group">
          <label htmlFor="orders-status-filter">Overview Status</label>
          <select
            id="orders-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="new">New</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="manage-orders-v2__toolbar-actions">
          <button
            type="button"
            className="manage-orders-v2__btn manage-orders-v2__btn--ghost"
            onClick={handleClearSearch}
          >
            Clear Filters
          </button>

          <label className="manage-orders-v2__checkbox">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={() => setHideCompleted((prev) => !prev)}
            />
            Hide Completed / Canceled
          </label>
        </div>
      </div>

      {loading && (
        <div className="manage-orders-v2__state manage-orders-v2__state--loading">
          Loading orders...
        </div>
      )}

      {!loading && error && (
        <div className="manage-orders-v2__state manage-orders-v2__state--error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="manage-orders-v2__table-shell">
          <div className="manage-orders-v2__table-scroll">
            <table className="manage-orders-v2__table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="manage-orders-v2__empty">
                      No orders matched your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="manage-orders-v2__row">
                      <td onClick={() => handleRowClick(order)}>
                        <span
                          className={`manage-orders-v2__status-badge ${getBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td onClick={() => handleRowClick(order)}>
                        <div className="manage-orders-v2__order-cell">
                          <div className="manage-orders-v2__order-id">
                            {order.id}
                          </div>
                          <div className="manage-orders-v2__order-meta">
                            {order.overviewStatus || '—'}
                          </div>
                        </div>
                      </td>

                      <td onClick={() => handleRowClick(order)}>
                        {order.orderDate}
                      </td>

                      <td onClick={() => handleRowClick(order)}>
                        <div className="manage-orders-v2__customer-cell">
                          <div className="manage-orders-v2__customer-name">
                            {order.customerName}
                          </div>
                          <div className="manage-orders-v2__customer-meta">
                            {order.customerEmail || order.email || '—'}
                          </div>
                        </div>
                      </td>

                      <td onClick={() => handleRowClick(order)}>
                        {order.totalDisplay}
                      </td>

                      <td onClick={() => handleRowClick(order)}>
                        {order.itemsCount}
                      </td>

                      <td
                        className="manage-orders-v2__tracking-cell"
                        onClick={() => handleRowClick(order)}
                      >
                        {order.trackingNumber || 'Add tracking'}
                      </td>

                      <td>
                        <div className="manage-orders-v2__actions">
                          <button
                            type="button"
                            className="manage-orders-v2__action-btn manage-orders-v2__action-btn--open"
                            onClick={() => handleRowClick(order)}
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            className="manage-orders-v2__action-btn manage-orders-v2__action-btn--delete"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && selectedOrder && (
        <ViewOrderModal
          orderDetails={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdateOrder={(updatedOrder) => {
            const updatedOrders = orders.map((order) =>
              order.id === updatedOrder.id
                ? {
                    ...order,
                    ...updatedOrder,
                    orderDate: formatDate(
                      updatedOrder.createdAt || order.createdAt
                    ),
                    totalDisplay:
                      typeof updatedOrder.totalAmount === 'number'
                        ? formatMoney(updatedOrder.totalAmount)
                        : order.totalDisplay,
                    itemsCount: Array.isArray(updatedOrder.items)
                      ? updatedOrder.items.length
                      : order.itemsCount,
                  }
                : order
            );

            setOrders(updatedOrders);
          }}
        />
      )}
    </div>
  );
};

export default ManageOrders;
