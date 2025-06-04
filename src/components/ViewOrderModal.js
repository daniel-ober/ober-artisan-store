import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ViewOrderModal.css';
import { Timestamp } from 'firebase/firestore';
import { getOrderStatusFromItems } from '../utils/statusConfig';
import defaultStepData from '../utils/defaultStepData';
import defaultProjectFields from '../utils/defaultProjectFields';

const ITEM_STATUSES = [
  'Preparing',
  'Back Ordered',
  'Packaged',
  'Ready for Shipment',
  'Shipped',
  'Delivered',
  'Canceled',
];

const ViewOrderModal = ({ isOpen, onClose, orderDetails, onUpdateOrder }) => {
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(orderDetails.items || []);
  const [orderStatus, setOrderStatus] = useState(
    orderDetails.status || 'Order Started'
  );
  const [relatedProjects, setRelatedProjects] = useState([]);

  const formatFirestoreTimestamp = (timestamp) => {
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    if (timestamp?._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return 'Invalid Date';
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, 'orders', orderDetails.id);
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setInternalNotes(
            data.internalNotes?.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            ) || []
          );
          setSystemHistory(
            data.systemHistory?.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            ) || []
          );
          setItems(data.items || []);
          setOrderStatus(data.status || 'Order Started');
          setRelatedProjects(data.relatedProjects || []);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    if (isOpen) {
      fetchOrderDetails();
    }
  }, [orderDetails.id, isOpen]);

  const handleItemStatusChange = async (index, newStatus) => {
    try {
      const updatedItems = [...items];
      updatedItems[index].status = newStatus;

      const newOrderStatus = getOrderStatusFromItems(updatedItems);

      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        items: updatedItems,
        status: newOrderStatus,
        systemHistory: arrayUnion({
          event: `Item status updated: ${items[index].name} to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        }),
      });

      setItems(updatedItems);
      setOrderStatus(newOrderStatus);
      setSystemHistory((prevHistory) => [
        {
          event: `Item status updated: ${items[index].name} to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        },
        ...prevHistory,
      ]);

      if (onUpdateOrder) {
        onUpdateOrder({
          ...orderDetails,
          items: updatedItems,
          status: newOrderStatus,
        });
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Failed to update item status. Please try again.');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return alert('Note cannot be empty.');
    setLoading(true);

    try {
      const orderRef = doc(db, 'orders', orderDetails.id);
      const note = {
        text: newNote,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(orderRef, {
        internalNotes: arrayUnion(note),
      });

      setInternalNotes((prevNotes) => [note, ...prevNotes]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (item = null) => {
    const confirmCreation = window.confirm(
      `Create Project for ${item?.name || 'Blank Project'}?`
    );
    if (!confirmCreation) return;
  
    try {
      const parsedAddress = (orderDetails.customerAddress || '').split(',');
      const street = parsedAddress[0]?.trim() || '';
      const city = parsedAddress[1]?.trim() || '';
      const [state, zip] = parsedAddress[2]?.trim().split(' ') || [];
  
      const projectData = {
        orderId: orderDetails.id,
        customerName: orderDetails.customerName || 'N/A',
        customer: {
          name: orderDetails.customerName || 'N/A',
          email: orderDetails.customerEmail || 'N/A',
          phone: orderDetails.customerPhone || '',
          address: {
            street,
            city,
            state,
            zip,
          },
        },
        startDate: Timestamp.now(),
        currentPhase: 'Step 1. Wood Preparation',
        artisanLine: item?.name?.includes('Soundlegend') ? 'SoundLegend' : '',
        width: '',
        shellDepth: '',
        itemDetails: item || null,
        ...defaultStepData,         // ✅ workflow
        ...defaultProjectFields     // ✅ proposal specs
      };
  
      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = projectRef.id;
  
      const projectEntry = {
        projectId,
        itemName: item?.name || 'Blank Project',
      };
  
      const orderRef = doc(db, 'orders', orderDetails.id);
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
  
      alert(`✅ Project created successfully!\n\nProject ID: ${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('❌ Failed to create project. Please try again.');
    }
  };

  const redirectToProject = (projectId) => {
    window.location.href = `/projects/${projectId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
<div className="modal-content">
  <button onClick={onClose} className="modal-close">✕</button>
  <h3 className="modal-title">Order Details</h3>

  <div className="compact-order-details">
    <div className="detail-group">
      <strong>Order ID:</strong> <span>{orderDetails.id}</span>
    </div>
    <div className="detail-group">
      <strong>Order Date:</strong>{' '}
      <span>
        {orderDetails.createdAt
          ? formatFirestoreTimestamp(orderDetails.createdAt)
          : 'N/A'}
      </span>
    </div>
    <div className="detail-group">
      <strong>Order Status:</strong> <span>{orderStatus}</span>
    </div>
    <div className="detail-group">
      <strong>Customer Name:</strong> <span>{orderDetails.customerName || 'N/A'}</span>
    </div>
    <div className="detail-group">
      <strong>Email:</strong> <span>{orderDetails.customerEmail || 'N/A'}</span>
    </div>
    {orderDetails.customerPhone && (
      <div className="detail-group">
        <strong>Phone:</strong> <span>{orderDetails.customerPhone}</span>
      </div>
    )}
    {orderDetails.customerAddress && (
      <div className="detail-group">
        <strong>Shipping Address:</strong>{' '}
        <span>{orderDetails.customerAddress}</span>
      </div>
    )}
  </div>

  <h3>Products Ordered:</h3>
  {items.length > 0 ? (
    <table className="order-details-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>
              <strong>{item.description || item.name || 'N/A'}</strong>
              {item.variant && (
                <div className="variant-details">
                  {[
                    item.variant.color,
                    item.variant.size,
                    item.variant.other,
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </div>
              )}
            </td>
            <td>{item.quantity || 0}</td>
            <td>${Math.abs(item.price ?? 0).toFixed(2)}</td>
            <td>
              <select
                value={item.status || 'Preparing'}
                onChange={(e) =>
                  handleItemStatusChange(index, e.target.value)
                }
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
                className="create-project-btn"
                onClick={() => createProject(item)}
              >
                Create Project
              </button>
            </td>
          </tr>
        ))}
        {/* <tr>
          <td colSpan="5" style={{ textAlign: 'center' }}>
            <button
              className="create-project-btn"
              onClick={() => createProject()}
            >
              Create Blank Project
            </button>
          </td>
        </tr> */}
      </tbody>
    </table>
  ) : (
    <p>No products in this order.</p>
  )}

  <h3>Related Projects</h3>
  {relatedProjects.length > 0 ? (
    <ul className="related-projects-list">
      {relatedProjects.map((p) => (
        <li key={p.projectId}>
          <button
            className="related-project-link"
            onClick={() => redirectToProject(p.projectId)}
          >
            {p.itemName} (ID: {p.projectId})
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <p>No related projects.</p>
  )}

  <h3>Internal Notes</h3>
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
    <p>No internal notes yet.</p>
  )}
  <textarea
    placeholder="Add a note..."
    value={newNote}
    onChange={(e) => setNewNote(e.target.value)}
    className="note-input"
  />
  <button
    className="add-note-btn"
    onClick={handleAddNote}
    disabled={loading}
  >
    {loading ? 'Adding Note...' : 'Add Note'}
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