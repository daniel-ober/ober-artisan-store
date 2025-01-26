import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

  // Determine the overall order status based on item statuses
  const determineOrderStatus = (items) => {
    if (!items || items.length === 0) return "No Items";

    const statuses = items.map((item) => item.status || "Preparing");

    if (statuses.every((status) => status === "Shipped")) return "Order Completed";
    if (statuses.some((status) => status === "Back Ordered")) return "Partially Fulfilled / Back Ordered";
    if (statuses.some((status) => status === "Ready for Shipment")) return "Ready for Shipment";
    if (statuses.some((status) => status === "Packaged")) return "Order Started";
    return "Order Started";
  };

  useEffect(() => {
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
            status: determineOrderStatus(data.items || []), // Calculate the overall status
            ...data,
          };
        });
        setOrders(ordersList);
        applyFilters(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [hideFulfilled]);

  const applyFilters = (ordersList) => {
    const filtered = ordersList.filter((order) => {
      if (hideFulfilled && order.status === "Order Completed") {
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
      </div>
      <table className="manage-orders-table">
        <thead>
          <tr>
            <th data-label="Order ID">Order ID</th>
            <th data-label="Date">Date</th>
            <th data-label="Customer Name">Customer Name</th>
            <th data-label="Total">Total</th>
            <th data-label="Order Status">Order Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="5">No orders available</td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.id} onClick={() => handleRowClick(order)}>
                <td data-label="Order ID">{order.id}</td>
                <td data-label="Date">{order.orderDate}</td>
                <td data-label="Customer Name">{order.customerName}</td>
                <td data-label="Total">${order.total}</td>
                <td data-label="Order Status">{order.status}</td>
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