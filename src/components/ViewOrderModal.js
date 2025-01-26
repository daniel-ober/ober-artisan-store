import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./ViewOrderModal.css";

const ITEM_STATUSES = [
  "Preparing",
  "Back Ordered",
  "Packaged",
  "Ready for Shipment",
  "Shipped",
  "Delivered",
  "Canceled",
];

const ViewOrderModal = ({ isOpen, onClose, orderDetails }) => {
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(orderDetails.items || []);
  const [orderStatus, setOrderStatus] = useState(orderDetails.status || "Order Started");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, "orders", orderDetails.id);
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setInternalNotes(
            data.internalNotes?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []
          );
          setSystemHistory(
            data.systemHistory?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []
          );
          setItems(data.items || []);
          setOrderStatus(data.status || "Order Started");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };

    fetchOrderDetails();
  }, [orderDetails.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return alert("Note cannot be empty.");
    setLoading(true);

    try {
      const orderRef = doc(db, "orders", orderDetails.id);
      const note = {
        text: newNote,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(orderRef, {
        internalNotes: arrayUnion(note),
      });

      setInternalNotes((prevNotes) => [note, ...prevNotes]);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemStatusChange = async (index, newStatus) => {
    try {
      const updatedItems = [...items];
      updatedItems[index].status = newStatus;

      // Update Firestore
      const orderRef = doc(db, "orders", orderDetails.id);
      await updateDoc(orderRef, {
        items: updatedItems,
      });

      setItems(updatedItems);
      updateOrderStatus(updatedItems); // Update the overall order status
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Failed to update item status. Please try again.");
    }
  };

  const updateOrderStatus = async (items) => {
    const statuses = items.map((item) => item.status);
    let newStatus = "Processing";

    if (statuses.every((status) => status === "Delivered")) {
      newStatus = "Order Completed";
    } else if (statuses.every((status) => ["Ready for Shipment", "Shipped"].includes(status))) {
      newStatus = "Ready for Shipment";
    } else if (statuses.some((status) => status === "Shipped")) {
      newStatus = "Partially Fulfilled";
    } else if (statuses.some((status) => status === "Back Ordered")) {
      newStatus = "Partially Fulfilled / Back Ordered";
    } else if (statuses.every((status) => status === "Canceled")) {
      newStatus = "Canceled";
    } else if (statuses.every((status) => status === "Preparing")) {
      newStatus = "Order Started";
    }

    try {
      const orderRef = doc(db, "orders", orderDetails.id);
      await updateDoc(orderRef, { status: newStatus });

      const statusChangeEvent = {
        event: `Order status updated to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(orderRef, {
        systemHistory: arrayUnion(statusChangeEvent),
      });

      setOrderStatus(newStatus); // Update local state
      setSystemHistory((prevHistory) => [statusChangeEvent, ...prevHistory]);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Order Details</h3>

        <div className="compact-order-details">
          <div className="detail-group">
            <strong>Order ID:</strong> <span>{orderDetails.id}</span>
          </div>
          <div className="detail-group">
            <strong>Customer Name:</strong> <span>{orderDetails.customerName || "N/A"}</span>
          </div>
          <div className="detail-group">
            <strong>Email:</strong> <span>{orderDetails.customerEmail || "N/A"}</span>
          </div>
          <div className="detail-group">
            <strong>Order Status:</strong> <span>{orderStatus}</span>
          </div>
        </div>

        <h3>Products Ordered:</h3>
        {items.length > 0 ? (
          <table className="order-details-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <select
                      value={item.status || "Preparing"}
                      onChange={(e) => handleItemStatusChange(index, e.target.value)}
                      className="status-select"
                    >
                      {ITEM_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products in the order.</p>
        )}

        <h3>Internal Notes:</h3>
        <textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="note-input"
        />
        <button onClick={handleAddNote} disabled={loading} className="add-note-btn">
          {loading ? "Adding Note..." : "Add Note"}
        </button>

        <div className="history-log">
          <h4>Notes History</h4>
          {internalNotes.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {internalNotes.map((note, index) => (
                  <tr key={index}>
                    <td>{note.text}</td>
                    <td>{new Date(note.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No notes available.</p>
          )}

          <h4>System History</h4>
          {systemHistory.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {systemHistory.map((event, index) => (
                  <tr key={index}>
                    <td>{event.event}</td>
                    <td>{new Date(event.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No system history available.</p>
          )}
        </div>

        <button className="order-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewOrderModal;