// src/components/ViewOrderModal.js
import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getOrderStatusFromItems } from '../utils/statusConfig';
import defaultStepData from '../utils/defaultStepData';
import defaultProjectFields from '../utils/defaultProjectFields';
import { linkProjectToUserByEmail } from '../services/userService';

// THEME + SHARED MODAL STYLES
import './AdminModalTheme.css';
import './AdminModalCommon.css';

// SCOPED OVERRIDES FOR THIS MODAL
import './ViewOrderModal.css';

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

const findUserByEmail = async (email) => {
  if (!email) return null;
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { uid: docSnap.id, ...docSnap.data() };
  } catch (err) {
    console.error('❌ findUserByEmail failed:', err);
    return null;
  }
};

const ViewOrderModal = ({ isOpen, onClose, orderDetails, onUpdateOrder }) => {
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false); // used for Add Note
  const [items, setItems] = useState(orderDetails.items || []);
  const [orderStatus, setOrderStatus] = useState(
    orderDetails.status || 'Order Started'
  );
  const [relatedProjects, setRelatedProjects] = useState([]);

  // ⭐ NEW: tracking number state
  const [trackingNumber, setTrackingNumber] = useState(
    orderDetails.trackingNumber || ''
  );
  const [savingTracking, setSavingTracking] = useState(false);

  const createProject = async (item = null) => {
    const confirmCreation = window.confirm(
      `Create Project for ${item?.name || 'Blank Project'}?`
    );
    if (!confirmCreation) return;

    try {
      const customerEmail = orderDetails.customerEmail || '';

      // Get the user so we can attach ownerUid
      const user = await findUserByEmail(customerEmail);

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

        // 🔑 Key for SoundLegend portal
        ownerUid: user?.uid || null,
        ownerEmail: customerEmail,

        customerName:
          orderDetails.customerName ||
          item?.description?.split('-')[0]?.trim() ||
          item?.name?.split('-')[0]?.trim() ||
          'N/A',
        customer: {
          name: orderDetails.customerName || 'N/A',
          email: customerEmail,
          phone: orderDetails.customerPhone || '',
          address: { street, city, state, zip },
        },
        startDate: Timestamp.now(),
        currentPhase: 'Step 1. Wood Preparation',
        artisanLine: item?.name?.toLowerCase().includes('soundlegend')
          ? 'SoundLegend'
          : '',
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

      if (customerEmail) {
        const label =
          item?.name?.trim() ||
          item?.description?.split('-')[0]?.trim() ||
          orderDetails.customerName?.trim() ||
          'Custom Drum Project';
        await linkProjectToUserByEmail(customerEmail, projectId, label);
      }

      setRelatedProjects((p) => [...p, projectEntry]);
      setSystemHistory((p) => [
        {
          event: `Project created: ${projectEntry.itemName} (ID: ${projectId})`,
          timestamp: new Date().toISOString(),
        },
        ...p,
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
          // keep tracking in sync with Firestore
          setTrackingNumber(data.trackingNumber || '');
        }
      } catch (err) {
        console.error('❌ Failed to load order data:', err);
      }
    };
    if (isOpen) fetchOrderData();
  }, [isOpen, orderDetails.id]);

  // also sync when parent passes a different orderDetails
  useEffect(() => {
    setItems(orderDetails.items || []);
    setOrderStatus(orderDetails.status || 'Order Started');
    setTrackingNumber(orderDetails.trackingNumber || '');
  }, [orderDetails]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const note = { text: newNote.trim(), timestamp: new Date().toISOString() };
    setInternalNotes((prev) => [note, ...prev]);
    setSystemHistory((prev) => [
      { event: `Internal note added`, timestamp: note.timestamp },
      ...prev,
    ]);
    setNewNote('');
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  // ⭐ NEW: save tracking number to Firestore + bubble up
  const handleSaveTracking = async () => {
    const trimmed = trackingNumber.trim();
    const eventText = trimmed
      ? `Tracking number set to "${trimmed}"`
      : 'Tracking number cleared';

    try {
      setSavingTracking(true);
      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        trackingNumber: trimmed || '',
        systemHistory: arrayUnion({
          event: eventText,
          timestamp: new Date().toISOString(),
        }),
      });

      setSystemHistory((prev) => [
        { event: eventText, timestamp: new Date().toISOString() },
        ...prev,
      ]);

      if (onUpdateOrder) {
        onUpdateOrder({
          ...orderDetails,
          trackingNumber: trimmed || '',
        });
      }

      alert('✅ Tracking number saved.');
    } catch (err) {
      console.error('❌ Failed to save tracking number:', err);
      alert('❌ Failed to save tracking. Please try again.');
    } finally {
      setSavingTracking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay ordermodal adminmodal light"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="modal-close icon-btn"
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="modal-title">Order Details</h3>

        <div className="compact-order-details">
          <div className="detail-row">
            <strong>Order ID:</strong> <span>{orderDetails.id}</span>
          </div>
          <div className="detail-row">
            <strong>Order Date:</strong>{' '}
            <span>
              {orderDetails.createdAt
                ? formatFirestoreTimestamp(orderDetails.createdAt)
                : 'N/A'}
            </span>
          </div>
          <div className="detail-row">
            <strong>Order Status:</strong> <span>{orderStatus}</span>
          </div>
          <div className="detail-row">
            <strong>Customer Name:</strong>{' '}
            <span>{orderDetails.customerName || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <strong>Email:</strong>{' '}
            <span>{orderDetails.customerEmail || 'N/A'}</span>
          </div>
          {orderDetails.customerPhone && (
            <div className="detail-row">
              <strong>Phone:</strong>{' '}
              <span>{orderDetails.customerPhone}</span>
            </div>
          )}
          {orderDetails.customerAddress && (
            <div className="detail-row">
              <strong>Shipping Address:</strong>{' '}
              <span>{orderDetails.customerAddress}</span>
            </div>
          )}

          {/* ⭐ NEW: tracking number editor */}
          <div className="detail-row">
            <strong>Tracking #:</strong>
            <span>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                style={{ maxWidth: '260px', marginRight: '8px' }}
              />
              <button
                className="btn"
                onClick={handleSaveTracking}
                disabled={savingTracking}
              >
                {savingTracking ? 'Saving…' : 'Save'}
              </button>
            </span>
          </div>
        </div>

        <h3 className="section-title">Products Ordered</h3>

        {items.length > 0 ? (
          <table className="data-table order-details-table">
            <colgroup>
              <col style={{ width: '52%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} /> {/* compact icon column */}
            </colgroup>
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
                  <td className="product-cell">
                    <strong className="product-name-modal">
                      {item.description || item.name || 'N/A'}
                    </strong>
                    {item.variant && (
                      <div className="muted">
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
                      {ITEM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="actions-cell">
                    {/* Icon-only button: Create new project */}
                    <button
                      className="icon-action-btn"
                      onClick={() => createProject(item)}
                      aria-label="Create project"
                      title="Create project"
                    >
                      {/* plus-in-document icon (inline SVG) */}
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M14 2v6h6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M12 11v6M9 14h6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No products in this order.</p>
        )}

        <h3 className="section-title">Related Projects</h3>
        {relatedProjects.length > 0 ? (
          <ul className="related-list">
            {relatedProjects.map((p) => (
              <li key={p.projectId}>
                <button
                  className="project-chip"
                  onClick={() =>
                    (window.location.href = `/projects/${p.projectId}`)
                  }
                >
                  {p.itemName} (ID: {p.projectId})
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No related projects.</p>
        )}

        <h3 className="section-title">Internal Notes</h3>
        {internalNotes.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Note</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {internalNotes.map((note, i) => (
                <tr key={i}>
                  <td>{note.text}</td>
                  <td>{new Date(note.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No internal notes yet.</p>
        )}

        <textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="note-input"
        />
        <button
          className="btn add-note-btn"
          onClick={handleAddNote}
          disabled={loading}
        >
          {loading ? 'Adding Note...' : 'Add Note'}
        </button>

        <div className="history-log">
          <h3 className="section-title">System History</h3>
          {systemHistory.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {systemHistory.map((ev, i) => (
                  <tr key={i}>
                    <td>{ev.event}</td>
                    <td>{new Date(ev.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No system history available.</p>
          )}
        </div>

        <button
          className="btn btn-ghost order-close-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewOrderModal;