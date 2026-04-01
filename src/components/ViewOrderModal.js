// src/components/ViewOrderModal.js
import React, { useEffect, useMemo, useState } from 'react';
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
  setDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getOrderStatusFromItems, getOverviewStatus } from '../utils/statusConfig';
import { defaultStepData } from '../utils/buildWorkflow';
import defaultProjectFields from '../utils/defaultProjectFields';
import { linkProjectToUserByEmail } from '../services/userService';

import './AdminModalTheme.css';
import './AdminModalCommon.css';
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

const normalizeEmail = (value = '') =>
  String(value || '').trim().toLowerCase();

const formatFirestoreTimestamp = (ts) => {
  if (!ts) return 'N/A';
  try {
    if (ts?.toDate) return ts.toDate().toLocaleDateString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return new Date(ts).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    if (value?.toDate) return value.toDate().toLocaleString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
    return new Date(value).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

const getUserDisplayName = (user = {}) =>
  user?.fullName ||
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  user?.displayName ||
  'Unnamed User';

const ViewOrderModal = ({ isOpen, onClose, orderDetails, onUpdateOrder }) => {
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState(orderDetails.items || []);
  const [orderStatus, setOrderStatus] = useState(orderDetails.status || 'New');
  const [relatedProjects, setRelatedProjects] = useState([]);

  const [trackingNumber, setTrackingNumber] = useState(
    orderDetails.trackingNumber || ''
  );
  const [savingTracking, setSavingTracking] = useState(false);

  const [assignedUser, setAssignedUser] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const orderId = orderDetails?.id || '';

  const orderOverviewStatus = useMemo(
    () => getOverviewStatus('order', orderStatus),
    [orderStatus]
  );

  const syncParentOrderState = (patch = {}) => {
    if (!onUpdateOrder) return;

    onUpdateOrder({
      ...orderDetails,
      ...patch,
      items: patch.items || items,
      status: patch.status || orderStatus,
      overviewStatus:
        patch.overviewStatus || getOverviewStatus('order', patch.status || orderStatus),
      trackingNumber:
        patch.trackingNumber !== undefined ? patch.trackingNumber : trackingNumber,
      internalNotes: patch.internalNotes || internalNotes,
      systemHistory: patch.systemHistory || systemHistory,
      relatedProjects: patch.relatedProjects || relatedProjects,
      customerUserId:
        patch.customerUserId !== undefined
          ? patch.customerUserId
          : orderDetails.customerUserId || '',
      customerName:
        patch.customerName !== undefined
          ? patch.customerName
          : orderDetails.customerName || '',
      customerEmail:
        patch.customerEmail !== undefined
          ? patch.customerEmail
          : orderDetails.customerEmail || '',
    });
  };

  const findMatchingUserByEmail = async (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    const usersRef = collection(db, 'users');
    const attempts = [
      query(usersRef, where('emailLower', '==', normalized), limit(1)),
      query(usersRef, where('email', '==', normalized), limit(1)),
      query(usersRef, where('email', '==', email.trim()), limit(1)),
    ];

    for (const qRef of attempts) {
      const snap = await getDocs(qRef);
      if (!snap.empty) {
        const match = snap.docs[0];
        return { id: match.id, ...match.data() };
      }
    }

    return null;
  };

  const loadAssignedUser = async (data) => {
    try {
      const directUid =
        data?.customerUserId ||
        data?.userId ||
        data?.ownerUid ||
        '';

      if (directUid) {
        const userSnap = await getDoc(doc(db, 'users', directUid));
        if (userSnap.exists()) {
          setAssignedUser({ id: userSnap.id, ...userSnap.data() });
          return;
        }
      }

      const email = data?.customerEmail || '';
      if (email) {
        const matched = await findMatchingUserByEmail(email);
        if (matched) {
          setAssignedUser(matched);
          return;
        }
      }

      setAssignedUser(null);
    } catch (err) {
      console.error('Failed to load assigned user:', err);
      setAssignedUser(null);
    }
  };

  const createProject = async (item = null) => {
    const confirmCreation = window.confirm(
      `Create Project for ${item?.name || item?.description || 'Blank Project'}?`
    );
    if (!confirmCreation) return;

    try {
      const customerEmailRaw = orderDetails.customerEmail || assignedUser?.email || '';
      const customerEmail = customerEmailRaw.trim();
      const customerEmailLower = normalizeEmail(customerEmailRaw);

      const customerName =
        orderDetails.customerName ||
        getUserDisplayName(assignedUser) ||
        item?.description?.split('-')[0]?.trim() ||
        item?.name?.split('-')[0]?.trim() ||
        'N/A';

      const parsedAddress = String(orderDetails.customerAddress || '').split(',');
      const street = parsedAddress[0]?.trim() || '';
      const city = parsedAddress[1]?.trim() || '';
      let state = '';
      let zip = '';

      if (parsedAddress[2]) {
        const parts = parsedAddress[2].trim().split(' ');
        state = parts[0] || '';
        zip = parts[1] || '';
      }

      const linkedUser =
        assignedUser || (customerEmail ? await findMatchingUserByEmail(customerEmail) : null);

      const linkedUid = linkedUser?.uid || linkedUser?.id || '';

      const projectData = {
        orderId: orderDetails.id,
        parentOrderId: orderDetails.id,

        customerName,
        customerEmail,
        customerEmailLower,

        ownerEmail: customerEmail,
        ownerUid: linkedUid || '',
        userId: linkedUid || '',
        customerUserId: linkedUid || '',

        customer: {
          name: customerName,
          email: customerEmail,
          emailLower: customerEmailLower,
          phone: orderDetails.customerPhone || '',
          uid: linkedUid || '',
          address: { street, city, state, zip },
        },

        startDate: Timestamp.now(),
        currentPhase: '1. Discovery & Design',
        status: 'Initial Planning',

        artisanLine:
          item?.name?.toLowerCase().includes('soundlegend') ||
          item?.description?.toLowerCase().includes('soundlegend')
            ? 'SoundLegend'
            : '',

        width: '',
        shellDepth: '',
        itemDetails: item || null,

        ...defaultStepData,
        ...defaultProjectFields,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = projectRef.id;

      await updateDoc(doc(db, 'projects', projectId), {
        id: projectId,
        projectId,
        docId: projectId,
        updatedAt: serverTimestamp(),
      });

      const projectEntry = {
        projectId,
        itemName: item?.name || item?.description || 'Blank Project',
      };

      const orderRef = doc(db, 'orders', orderDetails.id);

      await updateDoc(orderRef, {
        relatedProjects: arrayUnion(projectEntry),
        systemHistory: arrayUnion({
          event: `Project created: ${projectEntry.itemName} (ID: ${projectId})`,
          timestamp: new Date().toISOString(),
        }),
      });

      if (linkedUid) {
        const userRef = doc(db, 'users', linkedUid);

        await setDoc(
          userRef,
          {
            uid: linkedUid,
            email: linkedUser?.email || customerEmail,
            emailLower:
              normalizeEmail(linkedUser?.email || customerEmail) || customerEmailLower,
            fullName: getUserDisplayName(linkedUser),
            isSoundlegend: true,
            projectIds: arrayUnion(projectId),
            assignedProjectIds: arrayUnion(projectId),
            activeProjectId: projectId,
            projectId,
            latestProjectId: projectId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await updateDoc(doc(db, 'projects', projectId), {
          ownerUid: linkedUid,
          userId: linkedUid,
          customerUserId: linkedUid,
          updatedAt: serverTimestamp(),
        });
      }

      if (customerEmail) {
        const label =
          item?.name?.trim() ||
          item?.description?.split('-')[0]?.trim() ||
          customerName ||
          'Custom Drum Project';

        try {
          await linkProjectToUserByEmail(customerEmail, projectId, label);
        } catch (linkErr) {
          console.warn(
            'linkProjectToUserByEmail failed, but project was still created and directly linked:',
            linkErr
          );
        }
      }

      const newEvent = {
        event: `Project created: ${projectEntry.itemName} (ID: ${projectId})`,
        timestamp: new Date().toISOString(),
      };

      setRelatedProjects((prev) => [...prev, projectEntry]);
      setSystemHistory((prev) => [newEvent, ...prev]);

      syncParentOrderState({
        relatedProjects: [...relatedProjects, projectEntry],
        systemHistory: [newEvent, ...systemHistory],
      });

      alert(`✅ Project created successfully!\n\nProject ID: ${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('❌ Failed to create project. Please try again.');
    }
  };

  const assignUserByEmail = async () => {
    const email = assignEmail.trim();
    if (!email) {
      alert('Please enter an email.');
      return;
    }

    try {
      setAssignLoading(true);

      const matchedUser = await findMatchingUserByEmail(email);

      if (!matchedUser) {
        alert('No user found with that email.');
        return;
      }

      const uid = matchedUser.uid || matchedUser.id;
      const displayName = getUserDisplayName(matchedUser);
      const matchedEmail = matchedUser.email || email;
      const matchedEmailLower = normalizeEmail(matchedEmail);

      const eventText = `Order assigned to user "${displayName}" (${matchedEmail})`;

      const orderRef = doc(db, 'orders', orderId);

      await updateDoc(orderRef, {
        customerUserId: uid,
        userId: uid,
        ownerUid: uid,
        customerName: displayName,
        customerEmail: matchedEmail,
        customerEmailLower: matchedEmailLower,
        updatedAt: serverTimestamp(),
        systemHistory: arrayUnion({
          event: eventText,
          timestamp: new Date().toISOString(),
        }),
      });

      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email: matchedEmail,
          emailLower: matchedEmailLower,
          fullName: displayName,
          assignedOrderIds: arrayUnion(orderId),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const newHistory = [
        { event: eventText, timestamp: new Date().toISOString() },
        ...systemHistory,
      ];

      setAssignedUser(matchedUser);
      setSystemHistory(newHistory);
      setAssignEmail('');

      syncParentOrderState({
        customerUserId: uid,
        userId: uid,
        ownerUid: uid,
        customerName: displayName,
        customerEmail: matchedEmail,
        customerEmailLower: matchedEmailLower,
        systemHistory: newHistory,
      });

      alert(`✅ Order assigned to ${displayName}.`);
    } catch (err) {
      console.error('Failed to assign user:', err);
      alert('❌ Failed to assign user.');
    } finally {
      setAssignLoading(false);
    }
  };

  const clearAssignedUser = async () => {
    const confirmed = window.confirm(
      'Remove the currently assigned user from this order?'
    );
    if (!confirmed) return;

    try {
      setAssignLoading(true);

      const eventText = 'Order user assignment removed';

      await updateDoc(doc(db, 'orders', orderId), {
        customerUserId: '',
        userId: '',
        ownerUid: '',
        updatedAt: serverTimestamp(),
        systemHistory: arrayUnion({
          event: eventText,
          timestamp: new Date().toISOString(),
        }),
      });

      const newHistory = [
        { event: eventText, timestamp: new Date().toISOString() },
        ...systemHistory,
      ];

      setAssignedUser(null);
      setSystemHistory(newHistory);

      syncParentOrderState({
        customerUserId: '',
        userId: '',
        ownerUid: '',
        systemHistory: newHistory,
      });

      alert('✅ User assignment removed.');
    } catch (err) {
      console.error('Failed to clear assigned user:', err);
      alert('❌ Failed to remove assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderRef = doc(db, 'orders', orderDetails.id);
        const docSnap = await getDoc(orderRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setInternalNotes([...(data.internalNotes || [])].reverse());
          setSystemHistory([...(data.systemHistory || [])].reverse());
          setRelatedProjects(data.relatedProjects || []);
          setTrackingNumber(data.trackingNumber || '');
          setItems(data.items || orderDetails.items || []);

          const derivedStatus = getOrderStatusFromItems(data.items || []);
          setOrderStatus(derivedStatus);

          await loadAssignedUser(data);
        }
      } catch (err) {
        console.error('❌ Failed to load order data:', err);
      }
    };

    if (isOpen && orderDetails?.id) {
      fetchOrderData();
    }
  }, [isOpen, orderDetails.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setItems(orderDetails.items || []);
    setOrderStatus(getOrderStatusFromItems(orderDetails.items || []));
    setTrackingNumber(orderDetails.trackingNumber || '');
    setAssignEmail(orderDetails.customerEmail || '');
  }, [orderDetails]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note = {
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
    };

    const historyEvent = {
      event: 'Internal note added',
      timestamp: note.timestamp,
    };

    const nextNotes = [note, ...internalNotes];
    const nextHistory = [historyEvent, ...systemHistory];

    setInternalNotes(nextNotes);
    setSystemHistory(nextHistory);
    setNewNote('');

    try {
      setLoading(true);
      const orderRef = doc(db, 'orders', orderDetails.id);

      await updateDoc(orderRef, {
        internalNotes: arrayUnion(note),
        systemHistory: arrayUnion(historyEvent),
      });

      syncParentOrderState({
        internalNotes: nextNotes,
        systemHistory: nextHistory,
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
      updatedItems[index] = {
        ...updatedItems[index],
        status: newStatus,
      };

      const newOrderStatus = getOrderStatusFromItems(updatedItems);
      const newOverviewStatus = getOverviewStatus('order', newOrderStatus);

      setItems(updatedItems);
      setOrderStatus(newOrderStatus);

      const historyEvent = {
        event: `Item status changed to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      };

      const nextHistory = [historyEvent, ...systemHistory];

      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        items: updatedItems,
        status: newOrderStatus,
        overviewStatus: newOverviewStatus,
        updatedAt: serverTimestamp(),
        systemHistory: arrayUnion(historyEvent),
      });

      setSystemHistory(nextHistory);

      syncParentOrderState({
        items: updatedItems,
        status: newOrderStatus,
        overviewStatus: newOverviewStatus,
        systemHistory: nextHistory,
      });
    } catch (err) {
      console.error('❌ Failed to update item status:', err);
    }
  };

  const handleSaveTracking = async () => {
    const trimmed = trackingNumber.trim();
    const historyEvent = {
      event: trimmed
        ? `Tracking number set to "${trimmed}"`
        : 'Tracking number cleared',
      timestamp: new Date().toISOString(),
    };

    try {
      setSavingTracking(true);

      const orderRef = doc(db, 'orders', orderDetails.id);
      await updateDoc(orderRef, {
        trackingNumber: trimmed || '',
        updatedAt: serverTimestamp(),
        systemHistory: arrayUnion(historyEvent),
      });

      const nextHistory = [historyEvent, ...systemHistory];
      setSystemHistory(nextHistory);

      syncParentOrderState({
        trackingNumber: trimmed || '',
        systemHistory: nextHistory,
      });

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
      className="orderview-modal-overlay"
      onClick={onClose}
    >
      <div
        className="orderview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="orderview-close-btn"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="orderview-header">
          <div className="orderview-eyebrow">Admin Workspace</div>
          <h3 className="orderview-title">Order Details</h3>
          <div className="orderview-summary-row">
            <span className="orderview-pill orderview-pill--id">
              Order: {orderId}
            </span>
            <span
              className={`orderview-pill ${
                orderOverviewStatus === 'completed'
                  ? 'orderview-pill--complete'
                  : orderOverviewStatus === 'inProgress'
                    ? 'orderview-pill--progress'
                    : 'orderview-pill--new'
              }`}
            >
              {orderStatus}
            </span>
          </div>
        </div>

        <div className="orderview-grid">
          <section className="orderview-card">
            <div className="orderview-card-title">Order Snapshot</div>

            <div className="orderview-kv">
              <div className="orderview-k">Order ID</div>
              <div className="orderview-v">{orderDetails.id}</div>
            </div>

            <div className="orderview-kv">
              <div className="orderview-k">Order Date</div>
              <div className="orderview-v">
                {orderDetails.createdAt
                  ? formatFirestoreTimestamp(orderDetails.createdAt)
                  : 'N/A'}
              </div>
            </div>

            <div className="orderview-kv">
              <div className="orderview-k">Order Status</div>
              <div className="orderview-v">{orderStatus}</div>
            </div>

            <div className="orderview-kv">
              <div className="orderview-k">Customer Name</div>
              <div className="orderview-v">{orderDetails.customerName || 'N/A'}</div>
            </div>

            <div className="orderview-kv">
              <div className="orderview-k">Email</div>
              <div className="orderview-v">{orderDetails.customerEmail || 'N/A'}</div>
            </div>

            {orderDetails.customerPhone && (
              <div className="orderview-kv">
                <div className="orderview-k">Phone</div>
                <div className="orderview-v">{orderDetails.customerPhone}</div>
              </div>
            )}

            {orderDetails.customerAddress && (
              <div className="orderview-kv">
                <div className="orderview-k">Shipping Address</div>
                <div className="orderview-v">{orderDetails.customerAddress}</div>
              </div>
            )}
          </section>

          <section className="orderview-card">
            <div className="orderview-card-title">Tracking & Assignment</div>

            <div className="orderview-field-block">
              <label className="orderview-label">Tracking Number</label>
              <div className="orderview-inline-row">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="orderview-input"
                />
                <button
                  className="orderview-btn orderview-btn--primary"
                  onClick={handleSaveTracking}
                  disabled={savingTracking}
                >
                  {savingTracking ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="orderview-divider" />

            <div className="orderview-field-block">
              <label className="orderview-label">Assigned User</label>

              {assignedUser ? (
                <div className="orderview-assigned-user">
                  <div className="orderview-assigned-user__name">
                    {getUserDisplayName(assignedUser)}
                  </div>
                  <div className="orderview-assigned-user__meta">
                    {assignedUser.email || 'No email'}
                  </div>
                  <div className="orderview-assigned-user__meta">
                    UID: {assignedUser.uid || assignedUser.id}
                  </div>
                </div>
              ) : (
                <p className="orderview-muted">No user currently assigned.</p>
              )}

              <div className="orderview-inline-row orderview-inline-row--stack-mobile">
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="Enter user email to assign / reassign"
                  className="orderview-input"
                />
                <button
                  className="orderview-btn orderview-btn--primary"
                  onClick={assignUserByEmail}
                  disabled={assignLoading}
                >
                  {assignLoading ? 'Assigning…' : assignedUser ? 'Reassign' : 'Assign'}
                </button>
                {assignedUser && (
                  <button
                    className="orderview-btn orderview-btn--ghost"
                    onClick={clearAssignedUser}
                    disabled={assignLoading}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="orderview-card orderview-card--full">
          <div className="orderview-card-title">Products Ordered</div>

          {items.length > 0 ? (
            <div className="orderview-table-shell">
              <table className="orderview-table">
                <colgroup>
                  <col style={{ width: '48%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '10%' }} />
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
                      <td className="orderview-product-cell">
                        <strong className="orderview-product-name">
                          {item.description || item.name || 'N/A'}
                        </strong>

                        {item.variant && (
                          <div className="orderview-muted">
                            {[item.variant.color, item.variant.size, item.variant.other]
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
                          className="orderview-select"
                        >
                          {ITEM_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="orderview-actions-cell">
                        <button
                          className="orderview-icon-btn"
                          onClick={() => createProject(item)}
                          aria-label="Create project"
                          title="Create project"
                        >
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
            </div>
          ) : (
            <p className="orderview-muted">No products in this order.</p>
          )}
        </section>

        <div className="orderview-grid">
          <section className="orderview-card">
            <div className="orderview-card-title">Related Projects</div>

            {relatedProjects.length > 0 ? (
              <ul className="orderview-chip-list">
                {relatedProjects.map((p) => (
                  <li key={p.projectId}>
                    <button
                      className="orderview-chip"
                      onClick={() =>
                        (window.location.href = `/projects/${p.projectId}`)
                      }
                    >
                      {p.itemName} · {p.projectId}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="orderview-muted">No related projects.</p>
            )}
          </section>

          <section className="orderview-card">
            <div className="orderview-card-title">Internal Notes</div>

            {internalNotes.length > 0 ? (
              <div className="orderview-notes-list">
                {internalNotes.map((note, i) => (
                  <div key={i} className="orderview-note">
                    <div className="orderview-note__meta">
                      {formatDateTime(note.timestamp)}
                    </div>
                    <div className="orderview-note__text">{note.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="orderview-muted">No internal notes yet.</p>
            )}

            <textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="orderview-textarea"
            />
            <button
              className="orderview-btn orderview-btn--primary"
              onClick={handleAddNote}
              disabled={loading}
            >
              {loading ? 'Adding Note…' : 'Add Note'}
            </button>
          </section>
        </div>

        <section className="orderview-card orderview-card--full">
          <div className="orderview-card-title">System History</div>

          {systemHistory.length > 0 ? (
            <div className="orderview-table-shell">
              <table className="orderview-table">
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
                      <td>{formatDateTime(ev.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="orderview-muted">No system history available.</p>
          )}
        </section>

        <button className="orderview-btn orderview-btn--footer" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewOrderModal;