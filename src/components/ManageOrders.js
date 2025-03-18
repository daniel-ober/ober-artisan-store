import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ViewOrderModal from "./ViewOrderModal";
import "./ManageOrders.css";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hideFulfilled, setHideFulfilled] = useState(true);

  const determineOrderStatus = (items) => {
    if (!items || items.length === 0) return "No Items";
    const statuses = items.map((item) => item.status || "Preparing");
    if (statuses.every((status) => status === "Shipped")) return "Order Completed";
    if (statuses.every((status) => status === "Canceled")) return "Canceled";
    if (statuses.some((status) => status === "Back Ordered")) return "Partially Fulfilled / Back Ordered";
    if (statuses.some((status) => status === "Ready for Shipment")) return "Ready for Shipment";
    if (statuses.some((status) => status === "Packaged")) return "Order Started";
    return "Order Started";
  };

  useEffect(() => {
    fetchOrders();
  }, [hideFulfilled]);

  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(db, "orders");
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = orderSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          orderDate: data.createdAt?.toDate().toLocaleString() || "No date available",
          customerName: data.customerName || "No name available",
          total: typeof data.totalAmount === "number" ? data.totalAmount.toFixed(2) : "N/A",
          status: determineOrderStatus(data.items || []),
          ...data,
        };
      });
      setOrders(ordersList);
      applyFilters(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const applyFilters = (ordersList) => {
    const filtered = ordersList.filter((order) => {
      if (hideFulfilled && ["Order Completed", "Canceled"].includes(order.status)) {
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
      const orderIdRaw = order.id.replace(/-/g, "").toLowerCase();
      return orderIdRaw.includes(searchQuery);
    });

    setFilteredOrders(filtered);
  };

  const handleClearSearch = () => {
    setSearchId("");
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
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "orders", orderId));
      // console.log(`✅ Order ${orderId} deleted successfully`);
      fetchOrders(); // Refresh the order list after deletion
    } catch (error) {
      console.error("❌ Error deleting order:", error);
    }
  };

  return (
    <div className="manage-orders">
      <h2>Manage Orders</h2>
      <div className="controls">
        <label className="hide-fulfilled-label">
          <input
            type="checkbox"
            checked={hideFulfilled}
            onChange={toggleHideFulfilled}
          />
          Hide Completed/Canceled
        </label>
        <input
          type="text"
          placeholder="Search by Firestore ID"
          value={searchId}
          onChange={handleSearch}
        />
        <button onClick={handleClearSearch}>Clear</button>
      </div>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Total</th>
            <th>Order Status</th>
            <th>Actions</th> {/* New column for actions */}
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
                <td onClick={() => handleRowClick(order)}>{order.id}</td>
                <td onClick={() => handleRowClick(order)}>{order.orderDate}</td>
                <td onClick={() => handleRowClick(order)}>{order.customerName}</td>
                <td onClick={() => handleRowClick(order)}>${order.total}</td>
                <td onClick={() => handleRowClick(order)}>{order.status}</td>
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
        />
      )}
    </div>
  );
};

export default ManageOrders;