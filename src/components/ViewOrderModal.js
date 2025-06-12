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
import { linkProjectToUserByEmail } from '../services/userService';

const ITEM_STATUSES = [
  'Preparing',
  'Back Ordered',
  'Packaged',
  'Ready for Shipment',
  'Shipped',
  'Delivered',
  'Canceled',
];


const formatFirestoreTimestamp = (ts) => {
  if (!ts) return 'N/A';
  try {
    if (ts.toDate) return ts.toDate().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return new Date(ts).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

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

  const createProject = async (item = null) => {
    const confirmCreation = window.confirm(
      `Create Project for ${item?.name || 'Blank Project'}?`
    );
    if (!confirmCreation) return;

    try {
      const customerEmail = orderDetails.customerEmail || '';
      const parsedAddress = (orderDetails.customerAddress || '').split(',');
      const street = parsedAddress[0]?.trim() || '';
      const city = parsedAddress[1]?.trim() || '';
      let state = '';
      let zip = '';
      if (parsedAddress[2]) {
        const parts = parsedAddress[2].trim().split(' ');
        state = parts[0] || '';
        zip = parts[1] || '';
      }

      const projectData = {
        orderId: orderDetails.id,
        customerName:
          orderDetails.customerName ||
          item?.description?.split('-')[0]?.trim() ||
          item?.name?.split('-')[0]?.trim() ||
          'N/A',
        ownerEmail: customerEmail, // ✅ ADD THIS LINE
        customer: {
          name: orderDetails.customerName || 'N/A',
          email: customerEmail,
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
        ...defaultStepData,
        ...defaultProjectFields,
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
      console.log('🟢 relatedProjects updated in Firestore:', projectEntry);
      // 🔗 Link the project to a user doc via email
      if (customerEmail) {
        const label = item?.name?.trim() ||
        item?.description?.split('-')[0]?.trim() ||
        orderDetails.customerName?.trim() ||
        'Custom Drum Project';

        await linkProjectToUserByEmail(customerEmail, projectId, label);
        console.log(`📁 User ${customerEmail} linked to project ${projectId}`);
      }

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

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderRef = doc(db, 'orders', orderDetails.id);
        const docSnap = await getDoc(orderRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInternalNotes(data.internalNotes || []);
          setSystemHistory(data.systemHistory || []);
          setRelatedProjects(data.relatedProjects || []);
        }
      } catch (err) {
        console.error('❌ Failed to load order data:', err);
      }
    };

    if (isOpen) fetchOrderData();
  }, [isOpen, orderDetails.id]);

  const redirectToProject = (projectId) => {
    window.location.href = `/projects/${projectId}`;
  };

  if (!isOpen) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const note = {
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
    };

    setInternalNotes((prev) => [note, ...prev]);
    setSystemHistory((prev) => [
      { event: `Internal note added`, timestamp: note.timestamp },
      ...prev,
    ]);
    setNewNote('');

    try {
      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        internalNotes: arrayUnion(note),
        systemHistory: arrayUnion({
          event: 'Internal note added',
          timestamp: note.timestamp,
        }),
      });
    } catch (error) {
      console.error('❌ Failed to save note to Firestore:', error);
    }
  };

  const handleItemStatusChange = async (index, newStatus) => {
    try {
      const updatedItems = [...items];
      updatedItems[index].status = newStatus;

      const newOrderStatus = getOrderStatusFromItems(updatedItems);
      setItems(updatedItems);
      setOrderStatus(newOrderStatus);

      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        items: updatedItems,
        status: newOrderStatus,
        systemHistory: arrayUnion({
          event: `Item status changed to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        }),
      });

      setSystemHistory((prev) => [
        {
          event: `Item status changed to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('❌ Failed to update item status:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close">
          ✕
        </button>
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
            <strong>Customer Name:</strong>{' '}
            <span>{orderDetails.customerName || 'N/A'}</span>
          </div>
          <div className="detail-group">
            <strong>Email:</strong>{' '}
            <span>{orderDetails.customerEmail || 'N/A'}</span>
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
