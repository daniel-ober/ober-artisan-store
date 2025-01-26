import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore";
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
  const [relatedProjects, setRelatedProjects] = useState([]);

  // Fetch order details when the modal opens
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
          setRelatedProjects(data.relatedProjects || []);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };

    if (isOpen) {
      fetchOrderDetails();
    }
  }, [orderDetails.id, isOpen]);

  // Function to dynamically determine the order status based on item statuses
  const calculateOrderStatus = (items) => {
    const statuses = items.map((item) => item.status);
    if (statuses.every((status) => status === "Delivered")) return "Order Completed";
    if (statuses.every((status) => ["Ready for Shipment", "Shipped"].includes(status)))
      return "Ready for Shipment";
    if (statuses.some((status) => status === "Shipped")) return "Partially Fulfilled";
    if (statuses.some((status) => status === "Back Ordered"))
      return "Partially Fulfilled / Back Ordered";
    if (statuses.every((status) => status === "Canceled")) return "Canceled";
    if (statuses.every((status) => status === "Preparing")) return "Order Started";
    return "Processing";
  };

  // Update item status and recalculate order status
  const handleItemStatusChange = async (index, newStatus) => {
    try {
      const updatedItems = [...items];
      updatedItems[index].status = newStatus;

      // Recalculate the order status
      const newOrderStatus = calculateOrderStatus(updatedItems);

      // Update Firestore
      const orderRef = doc(db, "orders", orderDetails.id);
      await updateDoc(orderRef, {
        items: updatedItems,
        status: newOrderStatus,
        systemHistory: arrayUnion({
          event: `Item status updated: ${items[index].name} to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        }),
      });

      // Update local state
      setItems(updatedItems);
      setOrderStatus(newOrderStatus);
      setSystemHistory((prevHistory) => [
        {
          event: `Item status updated: ${items[index].name} to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        },
        ...prevHistory,
      ]);
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Failed to update item status. Please try again.");
    }
  };

  // Add a new internal note
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

  // Create a new project from an item or as a blank project
  const createProject = async (item = null) => {
    const confirmCreation = window.confirm(
      `Create Project for ${item?.name || "Blank Project"}?`
    );
    if (!confirmCreation) return;

    try {
      const projectData = {
        orderId: orderDetails.id,
        customerName: orderDetails.customerName || "N/A",
        startDate: new Date().toISOString(),
        itemDetails: item || null,
        status: "Not Started",
        phases: [],
        notes: [],
      };

      const projectRef = await addDoc(collection(db, "projects"), projectData);
      const projectId = projectRef.id;

      const projectEntry = { projectId, itemName: item?.name || "Blank Project" };

      const orderRef = doc(db, "orders", orderDetails.id);
      await updateDoc(orderRef, {
        relatedProjects: arrayUnion(projectEntry),
        systemHistory: arrayUnion({
          event: `Project created: ${projectEntry.itemName} (ID: ${projectId})`,
          timestamp: new Date().toISOString(),
        }),
      });

      setRelatedProjects((prev) => [...prev, projectEntry]);
      setSystemHistory((prev) => [
        {
          event: `Project created: ${projectEntry.itemName} (ID: ${projectId})`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      alert(`Project created successfully! Project ID: ${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const redirectToProject = (projectId) => {
    window.location.href = `/projects/${projectId}`;
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
                <th>Actions</th>
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
                  <td>
                    <button
                      onClick={() => createProject(item)}
                      className="create-project-btn"
                    >
                      Create Project
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  <button onClick={() => createProject()} className="create-project-btn">
                    Create Blank Project
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>No products in the order.</p>
        )}

        <h3>Related Projects:</h3>
        {relatedProjects.length > 0 ? (
          <ul className="related-projects-list">
            {relatedProjects.map((project) => (
              <li key={project.projectId}>
                <button
                  onClick={() => redirectToProject(project.projectId)}
                  className="related-project-link"
                >
                  {project.itemName} (ID: {project.projectId})
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No related projects.</p>
        )}

        <h3>Internal Notes:</h3>
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
          <p>No internal notes available.</p>
        )}
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