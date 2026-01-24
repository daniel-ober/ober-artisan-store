// src/components/AttachUserResourcesTool.js
import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AttachUserResourcesTool.css';

const AttachUserResourcesTool = () => {
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [projectId, setProjectId] = useState('');

  const [busyAttach, setBusyAttach] = useState(false);
  const [busyRefresh, setBusyRefresh] = useState(false);

  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const [looseOrders, setLooseOrders] = useState([]);
  const [looseProjects, setLooseProjects] = useState([]);
  const [usersWithoutResources, setUsersWithoutResources] = useState([]);

  /* ---------------------- helpers ---------------------- */

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast._timer || 0);
    showToast._timer = window.setTimeout(() => setToast(null), 4500);
  };

  const refreshLooseResources = async () => {
    setBusyRefresh(true);
    try {
      const [ordersSnap, projectsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'users')),
      ]);

      const looseOrdersArr = [];
      const looseProjectsArr = [];

      const existingUserIds = new Set();
      const userIdsWithResources = new Set();

      // All current user IDs
      usersSnap.forEach((u) => existingUserIds.add(u.id));

      /* ---------- Orders ---------- */
      ordersSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const rawUid = data.userId || data.userUID || data.user || null;
        const uid = typeof rawUid === 'string' ? rawUid.trim() : rawUid;

        const attachedToRealUser =
          uid && uid !== 'guest' && existingUserIds.has(uid);

        if (attachedToRealUser) {
          userIdsWithResources.add(uid);
        } else {
          const status = (
            data.overviewStatus ||
            data.status ||
            ''
          ).toLowerCase();
          const customerName = data.customerName || 'Unknown customer';
          const customerEmail =
            data.customerEmail || data.paymentMethodDetails?.email || '';
          const description =
            data.items?.[0]?.description ||
            data.description ||
            data.orderDescription ||
            'Untitled Order';

          looseOrdersArr.push({
            id: docSnap.id,
            customerName,
            customerEmail,
            description,
            status,
          });
        }
      });

      /* ---------- Projects ---------- */
      projectsSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const rawUid = data.userId || data.userUID || data.user || null;
        const uid = typeof rawUid === 'string' ? rawUid.trim() : rawUid;

        const attachedToRealUser =
          uid && uid !== 'guest' && existingUserIds.has(uid);

        if (attachedToRealUser) {
          userIdsWithResources.add(uid);
        } else {
          looseProjectsArr.push({
            id: docSnap.id,
            label:
              data.label ||
              data.projectName ||
              data.title ||
              'Untitled Project',
            status: data.status || data.phase || '',
          });
        }
      });

      /* ---------- Users without any resources ---------- */
      const usersWithoutArr = [];
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const id = docSnap.id;

        const hasOrdersArray =
          Array.isArray(data.orderIds) && data.orderIds.length > 0;
        const hasProjectsArray =
          Array.isArray(data.projects) && data.projects.length > 0;

        const hasResources =
          userIdsWithResources.has(id) || hasOrdersArray || hasProjectsArray;

        if (!hasResources) {
          usersWithoutArr.push({
            id,
            name:
              data.fullName ||
              `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
              data.email ||
              'Unnamed User',
            email: data.email || '',
          });
        }
      });

      setLooseOrders(looseOrdersArr);
      setLooseProjects(looseProjectsArr);
      setUsersWithoutResources(usersWithoutArr);
      showToast('success', 'Loose resources list updated.');
    } catch (err) {
      console.error(
        '[AttachUserResourcesTool] refreshLooseResources failed',
        err
      );
      showToast(
        'error',
        'Failed to refresh loose resources. Check console for details.'
      );
    } finally {
      setBusyRefresh(false);
    }
  };

  /* -------------------- attach actions -------------------- */

  const attachOrderToUser = async () => {
    if (!userId.trim() || !orderId.trim()) {
      showToast(
        'error',
        'User ID and Order ID are required to attach an order.'
      );
      return;
    }

    setBusyAttach(true);
    try {
      const uid = userId.trim();
      const oid = orderId.trim();

      const orderRef = doc(db, 'orders', oid);
      const userRef = doc(db, 'users', uid);

      // Make sure user exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        showToast('error', 'No user found with that User ID.');
        setBusyAttach(false);
        return;
      }

      // 1) write userId on the order doc
      await updateDoc(orderRef, { userId: uid });

      // 2) mirror on user doc
      await updateDoc(userRef, {
        orderIds: arrayUnion(oid),
      });

      showToast('success', 'Order successfully attached to user.');
      setOrderId('');
      await refreshLooseResources();
    } catch (err) {
      console.error('[AttachUserResourcesTool] attachOrderToUser failed', err);
      showToast(
        'error',
        `Failed to attach order: ${err?.message || 'verify IDs and rules.'}`
      );
    } finally {
      setBusyAttach(false);
    }
  };

  const attachProjectToUser = async () => {
    if (!userId.trim() || !projectId.trim()) {
      showToast(
        'error',
        'User ID and Project ID are required to attach a project.'
      );
      return;
    }

    setBusyAttach(true);
    try {
      const uid = userId.trim();
      const pid = projectId.trim();

      const userRef = doc(db, 'users', uid);
      const projectRef = doc(db, 'projects', pid);

      // Make sure user exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        showToast('error', 'No user found with that User ID.');
        setBusyAttach(false);
        return;
      }

      // Make sure project exists
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        showToast('error', 'No project found with that Project ID.');
        setBusyAttach(false);
        return;
      }

      const projectData = projectSnap.data() || {};
      const now = Date.now();

      const projectSummary = {
        projectId: pid,
        label:
          projectData.label ||
          projectData.projectName ||
          projectData.title ||
          'Untitled Project',
        width: String(
          projectData.diameter ??
            projectData.width ??
            projectData.shellWidth ??
            ''
        ),
        depth: String(projectData.depth ?? projectData.shellDepth ?? ''),
        staveQuantity: String(
          projectData.staveQuantity ?? projectData.staveCount ?? ''
        ),
        updatedAt: now, // plain number timestamp
      };

      // 1) write userId to project doc
      // 2) mirror on user doc
      await Promise.all([
        updateDoc(projectRef, {
          userId: uid,
          ownerUid: uid, // 🔑 ensures future portal lookups are clean
        }),
        updateDoc(userRef, {
          projectIds: arrayUnion(pid),
          projects: arrayUnion(projectSummary),
        }),
      ]);

      showToast('success', 'Project successfully attached to user.');
      setProjectId('');
      await refreshLooseResources();
    } catch (err) {
      console.error(
        '[AttachUserResourcesTool] attachProjectToUser failed',
        err
      );
      showToast(
        'error',
        `Failed to attach project: ${err?.message || 'verify IDs and rules.'}`
      );
    } finally {
      setBusyAttach(false);
    }
  };

  /* -------------------- effects -------------------- */

  useEffect(() => {
    refreshLooseResources();
  }, []);

  /* ---------------------- render ---------------------- */

  return (
    <div className="aur-root">
      {toast && (
        <div
          className={`aur-toast ${
            toast.type === 'success' ? 'aur-toast--success' : 'aur-toast--error'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="aur-card">
        <div className="aur-header">
          <h2>Attach Orders / Projects to User</h2>
          <p>
            Admin-only utility. Use this to connect existing orders or projects
            to a user by their Firestore document IDs.
          </p>
        </div>

        <div className="aur-form">
          <div className="aur-field-group">
            <label className="aur-label">
              User ID{' '}
              <span className="aur-label-sub">(from users collection)</span>
            </label>
            <input
              className="aur-input"
              placeholder="e.g. kUBVZnh1EDX1W6CS2c09Rfdshjw2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="aur-field-group">
            <label className="aur-label">
              Project ID <span className="aur-label-sub">(optional)</span>
            </label>
            <input
              className="aur-input"
              placeholder="Paste a project doc ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="aur-btn aur-btn--primary"
            onClick={attachProjectToUser}
            disabled={busyAttach}
          >
            Attach Project → User
          </button>
          <div className="aur-field-group">
            <label className="aur-label">
              Order ID <span className="aur-label-sub">(optional)</span>
            </label>
            <input
              className="aur-input"
              placeholder="Paste an order doc ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>

          <div className="aur-actions-row">
            <button
              type="button"
              className="aur-btn aur-btn--primary"
              onClick={attachOrderToUser}
              disabled={busyAttach}
            >
              Attach Order → User
            </button>
          </div>

          <div className="aur-help">
            <h4>Where do I get these IDs?</h4>
            <ul>
              <li>
                <code>User ID</code>: from the <code>users</code> collection in
                Firestore (document ID), or from logs when you create the user.
              </li>
              <li>
                <code>Order / Project ID</code>: from your <code>orders</code>{' '}
                or <code>projects</code> collections, or surfaced in your admin
                UI.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="aur-card aur-card--secondary">
        <div className="aur-card-header-row">
          <div>
            <h3>Loose Resources (Unattached)</h3>
            <p className="aur-muted">
              These are orders, projects, and users that don&apos;t appear to be
              linked. Click a pill to populate the form above and attach them.
            </p>
          </div>
          <button
            type="button"
            className="aur-btn aur-btn--ghost"
            onClick={refreshLooseResources}
            disabled={busyRefresh}
          >
            {busyRefresh ? 'Refreshing…' : 'Refresh List'}
          </button>
        </div>

        <div className="aur-loose-columns">
          {/* Projects */}
          <div className="aur-loose-column">
            <h4>Projects with no user</h4>
            {looseProjects.length === 0 ? (
              <p className="aur-empty">No loose projects detected.</p>
            ) : (
              <div className="aur-pill-list">
                {looseProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="aur-pill"
                    onClick={() => setProjectId(p.id)}
                  >
                    <span className="aur-pill-id">{p.id}</span>
                    <span className="aur-pill-label">
                      {' · '}
                      {p.label}
                    </span>
                    {p.status && (
                      <span className="aur-pill-tag">{p.status}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Users */}
          <div className="aur-loose-column">
            <h4>Users without orders / projects</h4>
            {usersWithoutResources.length === 0 ? (
              <p className="aur-empty">No loose users detected.</p>
            ) : (
              <div className="aur-pill-list">
                {usersWithoutResources.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="aur-pill"
                    onClick={() => setUserId(u.id)}
                  >
                    <span className="aur-pill-label">{u.name}</span>
                    <span className="aur-pill-separator"> · </span>
                    <span className="aur-pill-id">{u.id}</span>
                    {u.email && <span className="aur-pill-tag">{u.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Orders */}
          <div className="aur-loose-column">
            <h4>Orders with no user</h4>
            {looseOrders.length === 0 ? (
              <p className="aur-empty">No loose orders detected.</p>
            ) : (
              <div className="aur-pill-list">
                {looseOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="aur-pill"
                    onClick={() => setOrderId(o.id)}
                  >
                    <span className="aur-pill-id">{o.id}</span>
                    <span className="aur-pill-label">
                      {' · '}
                      {o.customerName}
                      {o.customerEmail ? ` (${o.customerEmail})` : ''}
                      {' · '}
                      {o.description}
                    </span>
                    {o.status && (
                      <span className="aur-pill-tag">{o.status}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachUserResourcesTool;
