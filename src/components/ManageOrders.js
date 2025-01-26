import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ViewOrderModal from "./ViewOrderModal";
import AddOrderModal from "./AddOrderModal";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideFulfilled, setHideFulfilled] = useState(true);

  const orderStages = [
    "Payment Processed",
    "Unable to Process Payment",
    "Consultation - Initial Consult",
    "Consultation - Proposed Concept, Design, Timeline",
    "Purchase Order - Agreement Issued",
    "Purchase Order - Agreement Expired",
    "Purchase Order - Agreement Renewal Issued",
    "In Production - Step 1. Wood Preparation",
    "In Production - Step 2. Shell Construction",
    "In Production - Step 3. Fine-Tuning",
    "In Production - Step 4. Shell Exterior Finish",
    "In Production - Step 5. Bearing Edge Cutting",
    "In Production - Step 6. Snare Bed Cutting",
    "In Production - Step 7. Hardware Drilling",
    "In Production - Step 8. Hardware Assembly",
    "In Production - Step 9. Tuning and Detailing",
    "In Production - Step 10. Thorough Quality Check",
    "Shipping - Preparing Shipping Materials",
    "Shipping - Package Shipped and Tracking Shared",
    "Shipping - Delivery Confirmation",
    "Followup - Check-in with Customer",
    "Order Fulfilled",
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersCollection = collection(db, "orders");
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = orderSnapshot.docs.map((doc) => {
        const data = doc.data();
        const orderStage =
          data.status.toLowerCase() === "paid" ? "Payment Processed" : "Unable to Process Payment";
        return {
          id: doc.id,
          orderDate: data.timestamp
            ? new Date(data.timestamp).toLocaleString()
            : "No date available",
          customerName: data.customerName || "No name available",
          total:
            typeof data.totalAmount === "number"
              ? data.totalAmount.toFixed(2)
              : "N/A",
          status: data.status || "No status available",
          currentStage: data.currentStage || orderStage,
          ...data,
        };
      });

      setOrders(ordersList);
      applyFilters(ordersList);
    };

    fetchOrders();
  }, [hideFulfilled]);

  const applyFilters = (ordersList) => {
    const filtered = ordersList.filter((order) => {
      if (hideFulfilled && order.currentStage === "Order Fulfilled") {
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

  const handleStageChange = async (orderId, newStage) => {
    try {
      const orderDoc = doc(db, "orders", orderId);
      await updateDoc(orderDoc, { currentStage: newStage });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, currentStage: newStage } : order
        )
      );
      applyFilters(orders);
    } catch (error) {
      console.error("Error updating order stage:", error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "orders", orderId));
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
    } catch (error) {
      console.error("Error deleting order:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHideFulfilled = () => {
    setHideFulfilled((prev) => !prev);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
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
          Hide Fulfilled Orders
        </label>
        <input
          type="text"
          placeholder="Search by Firestore ID"
          value={searchId}
          onChange={handleSearch}
        />
        <button onClick={handleClearSearch}>Clear</button>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
          Add Order
        </button>
      </div>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th data-label="Order ID">Order ID</th>
            <th data-label="Date">Date</th>
            <th data-label="Customer Name">Customer Name</th>
            <th data-label="Total">Total</th>
            <th data-label="Order Stage">Order Stage</th>
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
                <td data-label="Order ID">{order.id}</td>
                <td data-label="Date">{order.orderDate}</td>
                <td data-label="Customer Name">{order.customerName}</td>
                <td data-label="Total">${order.total}</td>
                <td data-label="Order Stage">
                  <select
                    value={order.currentStage}
                    onChange={(e) => handleStageChange(order.id, e.target.value)}
                  >
                    {orderStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </td>
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
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && selectedOrder && (
        <ViewOrderModal
          order={selectedOrder}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isAddModalOpen && (
        <AddOrderModal
          onClose={() => setIsAddModalOpen(false)}
          onOrderAdded={(newOrder) => {
            setOrders([newOrder, ...orders]);
            applyFilters([newOrder, ...orders]);
          }}
        />
      )}
    </div>
  );
};

export default ManageOrders;