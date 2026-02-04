// src/components/AdminOverview.js
import React, { useEffect, useState } from 'react';
import {
  getDoc,
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

import ViewOrderModal from './ViewOrderModal';
import ViewInquiryModal from './ViewInquiryModal';
import ViewSoundlegendModal from './ViewSoundlegendModal';
import ViewRiskDetailModal from './ViewRiskDetailModal';
import EndorsementApplicationModal from './EndorsementApplicationModal';

import {
  FaBox,
  FaHeadset,
  FaStar,
  FaExclamationTriangle,
  FaThLarge,
  FaUsers,
} from 'react-icons/fa';

import {
  getOverviewStatus,
  getBadgeClass,
  getOrderStatusFromItems,
  STATUS_SCHEMA,
} from '../utils/statusConfig';

import './AdminOverview.css';

const getCollectionPath = (type) => {
  switch (type) {
    case 'order':
      return 'orders';
    case 'inquiry':
      return 'inquiries';
    case 'submission':
      return 'soundlegend_submissions';
    case 'risk':
      return 'risk_notifications';
    case 'endorsement':
      return 'endorsement_applications';
    default:
      return '';
  }
};

// ✅ normalize overviewStatus so "inprogress" / "in progress" etc don’t get misfiled
const normalizeOverviewStatus = (raw) => {
  const v = (raw || '').toString().trim().toLowerCase();
  if (!v) return null;

  if (v === 'new') return 'new';
  if (v === 'inprogress' || v === 'in progress') return 'inProgress';
  if (v === 'completed' || v === 'complete' || v === 'done') return 'completed';

  return null;
};

const inferStatusFromTarget = (type, targetStatus, currentItem = null) => {
  if (type === 'endorsement') return targetStatus;

  const schema = STATUS_SCHEMA[type];
  if (!schema) return targetStatus;

  if (type === 'order') {
    if (targetStatus === 'new') return 'new';
    if (targetStatus === 'completed') return 'fulfilled';
    return getOrderStatusFromItems(currentItem?.items || []);
  }

  switch (targetStatus) {
    case 'new':
      return schema.new?.[0] || 'New';
    case 'inProgress':
      return schema.inProgress?.[0] || 'In Progress';
    case 'completed':
      return schema.completed?.[0] || 'Completed';
    default:
      return 'New';
  }
};

const AdminOverview = ({
  notifications = {},
  secondaryNotifications = {},
  setOverviewBadgeCounts,
}) => {
  const [data, setData] = useState({
    new: [],
    inProgress: [],
    completed: [],
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [newPage, setNewPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  const itemsPerPage = 10;
  const [activeFilter, setActiveFilter] = useState('all');

  const updateColumnState = (type, items) => {
    const newItems = [];
    const inProgressItems = [];
    const completedItems = [];

    for (const item of items) {
      item.type = type;

      // ✅ ensure overviewStatus is ALWAYS canonical
      const normalized = normalizeOverviewStatus(item.overviewStatus);
      const finalOverview = normalized || 'new';
      item.overviewStatus = finalOverview;

      if (finalOverview === 'new') newItems.push(item);
      else if (finalOverview === 'inProgress') inProgressItems.push(item);
      else completedItems.push(item);
    }

    setData((prev) => {
      const filterOut = (arr) => arr.filter((i) => i.type !== type);
      const uniqueById = (arr) => {
        const seen = new Set();
        return arr.filter((item) => {
          const key = `${item.type}-${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      return {
        new: uniqueById([...filterOut(prev.new), ...newItems]),
        inProgress: uniqueById([...filterOut(prev.inProgress), ...inProgressItems]),
        completed: uniqueById([...filterOut(prev.completed), ...completedItems]),
      };
    });
  };

  useEffect(() => {
    // Orders
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      async (snapshot) => {
        const orders = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();

            // ✅ normalize & backfill status + overviewStatus
            let status = d.status;
            if (!status) status = getOrderStatusFromItems(d.items || []);

            let overviewStatus = normalizeOverviewStatus(d.overviewStatus);
            if (!overviewStatus) overviewStatus = getOverviewStatus('order', status);

            // ✅ if firestore values are missing / non-canonical, fix them
            const needsPatch =
              d.status !== status ||
              d.overviewStatus !== overviewStatus;

            if (needsPatch) {
              await updateDoc(doc(db, 'orders', docSnap.id), {
                status,
                overviewStatus,
              });
            }

            return { id: docSnap.id, type: 'order', ...d, status, overviewStatus };
          })
        );
        updateColumnState('order', orders);
      }
    );

    // Inquiries
    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(100)),
      async (snapshot) => {
        const inquiries = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();
            const status = d.status || d.overviewStatus || 'New';
            let overviewStatus = normalizeOverviewStatus(d.overviewStatus);
            if (!overviewStatus) overviewStatus = getOverviewStatus('inquiry', status);

            // optional patch (safe)
            if (d.overviewStatus !== overviewStatus) {
              await updateDoc(doc(db, 'inquiries', docSnap.id), { overviewStatus });
            }

            return {
              id: docSnap.id,
              type: 'inquiry',
              customerName: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
              email: d.email || '',
              status,
              overviewStatus,
              ...d,
            };
          })
        );
        updateColumnState('inquiry', inquiries);
      }
    );

    // Risk
    const unsubRisks = onSnapshot(
      query(collection(db, 'risk_notifications'), orderBy('timestamp', 'desc'), limit(100)),
      async (snapshot) => {
        const risks = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();
            const status = d.status || d.overviewStatus || 'Unclassified Risk';
            let overviewStatus = normalizeOverviewStatus(d.overviewStatus);
            if (!overviewStatus) overviewStatus = getOverviewStatus('risk', status);

            if (d.overviewStatus !== overviewStatus) {
              await updateDoc(doc(db, 'risk_notifications', docSnap.id), { overviewStatus });
            }

            return {
              id: docSnap.id,
              type: 'risk',
              overviewStatus,
              status,
              customerName: d.assessment?.username || d.assessment?.email || 'Unverified Login',
              email: d.email || d.assessment?.email || 'N/A',
              ...d,
            };
          })
        );
        updateColumnState('risk', risks);
      }
    );

    // SoundLegend submissions
    const unsubSubmissions = onSnapshot(
      query(collection(db, 'soundlegend_submissions'), orderBy('submittedAt', 'desc'), limit(100)),
      async (snapshot) => {
        const submissions = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();
            const status = d.status || d.overviewStatus || 'New';
            let overviewStatus = normalizeOverviewStatus(d.overviewStatus);
            if (!overviewStatus) overviewStatus = getOverviewStatus('submission', status);

            if (d.overviewStatus !== overviewStatus) {
              await updateDoc(doc(db, 'soundlegend_submissions', docSnap.id), { overviewStatus });
            }

            return {
              id: docSnap.id,
              type: 'submission',
              customerName: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
              status,
              overviewStatus,
              ...d,
            };
          })
        );
        updateColumnState('submission', submissions);
      }
    );

    // Endorsement applications
    const unsubEndorsements = onSnapshot(
      query(collection(db, 'endorsement_applications'), orderBy('createdAt', 'desc'), limit(100)),
      async (snapshot) => {
        const apps = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();
            const status = d.status || d.overviewStatus || 'inProgress';
            let overviewStatus = normalizeOverviewStatus(d.overviewStatus);
            if (!overviewStatus) overviewStatus = getOverviewStatus('endorsement', status);

            if (d.overviewStatus !== overviewStatus) {
              await updateDoc(doc(db, 'endorsement_applications', docSnap.id), { overviewStatus });
            }

            return {
              id: docSnap.id,
              type: 'endorsement',
              customerName: d.fullName || d.stageName || 'N/A',
              email: d.email || '',
              status,
              overviewStatus,
              ...d,
            };
          })
        );
        updateColumnState('endorsement', apps);
      }
    );

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubSubmissions();
      unsubRisks();
      unsubEndorsements();
    };
  }, []);

  // Overview tile badges
  useEffect(() => {
    const green =
      (notifications.manageOrders || 0) +
      (notifications.manageInquiries || 0) +
      (notifications.manageSoundlegendRequests || 0) +
      (notifications.manageRiskAlerts || 0) +
      (notifications.manageEndorsementApplications || 0);

    const yellow =
      (secondaryNotifications.manageOrders || 0) +
      (secondaryNotifications.manageInquiries || 0) +
      (secondaryNotifications.manageSoundlegendRequests || 0) +
      (secondaryNotifications.manageRiskAlerts || 0) +
      (secondaryNotifications.manageEndorsementApplications || 0);

    setOverviewBadgeCounts({ green, yellow });
  }, [notifications, secondaryNotifications, setOverviewBadgeCounts]);

  const handleItemClick = async (item) => {
    try {
      const ref = doc(db, getCollectionPath(item.type), item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const d = snap.data();

      if (item.type === 'risk') {
        const timestamp = d.timestamp?.seconds ? new Date(d.timestamp.seconds * 1000) : new Date();
        const severity = d.score >= 0.85 ? 'High' : d.score >= 0.5 ? 'Medium' : 'Low';

        setSelectedItem({
          id: snap.id,
          email: d.email || d.assessment?.email || 'N/A',
          type: d.type || 'Unknown',
          score: d.score || 0,
          timestamp,
          severity,
          source: d.source || 'N/A',
          systemHistory: d.systemHistory || [],
          status: d.status || 'New',
          overviewStatus: getOverviewStatus('risk', d.status),
        });
        setModalType('risk');
        return;
      }

      if (item.type === 'order') {
        let createdAt = d.createdAt;
        if (createdAt?.seconds) createdAt = new Date(createdAt.seconds * 1000);

        const systemHistory = Array.isArray(d.systemHistory)
          ? d.systemHistory.map((entry) => ({
              ...entry,
              timestamp: entry.timestamp?.seconds
                ? new Date(entry.timestamp.seconds * 1000).toISOString()
                : entry.timestamp,
            }))
          : [];

        setSelectedItem({
          id: snap.id,
          createdAt,
          status: d.status || 'New',
          overviewStatus: normalizeOverviewStatus(d.overviewStatus) || 'new',
          items: d.items || [],
          customerName: d.customerName || 'N/A',
          customerEmail: d.customerEmail || 'N/A',
          customerPhone: d.customerPhone || '',
          customerAddress: d.customerAddress || '',
          internalNotes: d.internalNotes || [],
          systemHistory,
          relatedProjects: d.relatedProjects || [],
        });
        setModalType('order');
        return;
      }

      if (item.type === 'inquiry') {
        const createdAt =
          d.createdAt?.seconds
            ? new Date(d.createdAt.seconds * 1000).toLocaleString()
            : d.createdAt || '';

        setSelectedItem({
          id: snap.id,
          type: 'inquiry',
          createdAt,
          origin: d.origin || d.source || 'web-contact',
          status: d.status || 'New',
          overviewStatus: getOverviewStatus('inquiry', d.status || d.overviewStatus),
          category: d.category || 'Other',
          name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.name || 'N/A',
          email: d.email || 'N/A',
          message: d.message || '',
          internalNotes: d.internalNotes || [],
          systemHistory: d.systemHistory || [],
        });
        setModalType('inquiry');
        return;
      }

      if (item.type === 'submission') {
        const submittedAt = d.submittedAt?.seconds ? new Date(d.submittedAt.seconds * 1000) : null;
        setSelectedItem({ id: snap.id, ...d, submittedAt });
        setModalType('submission');
        return;
      }

      if (item.type === 'endorsement') {
        setSelectedItem({ id: snap.id, ...d });
        setModalType('endorsement');
        return;
      }

      setModalType(item.type);
    } catch (error) {
      console.error('❌ Error fetching item details:', error);
    }
  };

  const handleDrop = async (event, targetStatus) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('text/plain');
    const { id, type } = JSON.parse(dataString);

    const ref = doc(db, getCollectionPath(type), id);

    try {
      const allItems = [...data.new, ...data.inProgress, ...data.completed];
      const currentItem = allItems.find((i) => i.id === id && i.type === type);

      let normalizedStatus = inferStatusFromTarget(type, targetStatus, currentItem);

      if (type === 'order') {
        if (targetStatus === 'new') normalizedStatus = 'new';
        else if (targetStatus === 'completed') normalizedStatus = 'fulfilled';
      }

      await updateDoc(ref, {
        overviewStatus: targetStatus,
        status: normalizedStatus,
        systemHistory: arrayUnion({
          event: `Status changed to "${normalizedStatus}" via drag-and-drop`,
          timestamp: new Date().toISOString(),
        }),
      });

      setSelectedItem((prev) =>
        prev && prev.id === id && prev.type === type
          ? { ...prev, status: normalizedStatus, overviewStatus: targetStatus }
          : prev
      );

      setData((prev) => {
        const every = [...prev.new, ...prev.inProgress, ...prev.completed];
        const moved = every.find((i) => i.id === id && i.type === type);
        if (!moved) return prev;

        const updatedItem = { ...moved, overviewStatus: targetStatus, status: normalizedStatus };

        const filterOut = (items) => items.filter((i) => i.id !== id || i.type !== type);

        return {
          new: targetStatus === 'new' ? [updatedItem, ...filterOut(prev.new)] : filterOut(prev.new),
          inProgress:
            targetStatus === 'inProgress'
              ? [updatedItem, ...filterOut(prev.inProgress)]
              : filterOut(prev.inProgress),
          completed:
            targetStatus === 'completed'
              ? [updatedItem, ...filterOut(prev.completed)]
              : filterOut(prev.completed),
        };
      });
    } catch (err) {
      console.error('❌ Error updating Firestore in handleDrop:', err.message);
    }
  };

  const renderItem = (item, sourceStatus) => {
    const labelType =
      item.type === 'order'
        ? 'ORDER'
        : item.type === 'inquiry'
        ? 'SUPPORT'
        : item.type === 'submission'
        ? 'SOUNDLEGEND'
        : item.type === 'endorsement'
        ? 'ENDORSE'
        : 'RISK';

    const label = `${labelType} • ${item.id.slice(-6)}`;
    const desc = item.customerName || item.name || item.email || item.status;

    return (
      <div
        key={`${item.type}-${item.id}`}
        className="overview-item"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ id: item.id, type: item.type, sourceStatus })
          );
        }}
        onClick={() => handleItemClick(item)}
      >
        <strong>{label}</strong>
        <div className="overview-item-desc">
          {item.type === 'risk' ? (
            <>
              <span className={`risk-status-badge ${getBadgeClass(item.status)}`}>
                {item.status}
              </span>
              <span>{desc}</span>
            </>
          ) : (
            desc
          )}
        </div>
      </div>
    );
  };

  const renderColumn = (title, items, statusKey) => {
    const filteredItems = items.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'orders') return item.type === 'order';
      if (activeFilter === 'support') return item.type === 'inquiry';
      if (activeFilter === 'slRequests') return item.type === 'submission';
      if (activeFilter === 'endorsements') return item.type === 'endorsement';
      if (activeFilter === 'risk') return item.type === 'risk';
      return false;
    });

    const page =
      statusKey === 'new' ? newPage : statusKey === 'inProgress' ? inProgressPage : completedPage;

    const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const startIndex = filteredItems.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
    const endIndex =
      filteredItems.length > 0 ? Math.min(page * itemsPerPage, filteredItems.length) : 0;

    return (
      <div
        className="overview-section"
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
        onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
        onDrop={(e) => {
          e.currentTarget.classList.remove('drag-over');
          handleDrop(e, statusKey);
        }}
      >
        <div className="column-header">
          <h2 className={statusKey.toLowerCase()}>{title}</h2>
          <span className="badge">{filteredItems?.length || 0}</span>
        </div>

        {paginatedItems.length === 0 ? (
          <p>No {title.toLowerCase()} items</p>
        ) : (
          paginatedItems.map((item) => renderItem(item, statusKey))
        )}

        {filteredItems.length > itemsPerPage && (
          <div className="pagination-footer">
            <div className="pagination-summary">
              Displaying records {startIndex}–{endIndex}
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => {
                  if (statusKey === 'new') setNewPage((p) => Math.max(p - 1, 1));
                  else if (statusKey === 'inProgress') setInProgressPage((p) => Math.max(p - 1, 1));
                  else setCompletedPage((p) => Math.max(p - 1, 1));
                }}
                disabled={page === 1}
              >
                ◀
              </button>
              <span>{page}</span>
              <button
                onClick={() => {
                  if (statusKey === 'new')
                    setNewPage((p) => (p * itemsPerPage < filteredItems.length ? p + 1 : p));
                  else if (statusKey === 'inProgress')
                    setInProgressPage((p) =>
                      p * itemsPerPage < filteredItems.length ? p + 1 : p
                    );
                  else
                    setCompletedPage((p) =>
                      p * itemsPerPage < filteredItems.length ? p + 1 : p
                    );
                }}
                disabled={page * itemsPerPage >= filteredItems.length}
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleStatusChange = async (id, newStatus) => {
    const newOverviewStatus = getOverviewStatus('risk', newStatus);
    const ref = doc(db, 'risk_notifications', id);

    try {
      await updateDoc(ref, {
        status: newStatus,
        overviewStatus: newOverviewStatus,
        systemHistory: arrayUnion({
          event: `Status changed to "${newStatus}"`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('❌ Failed to update Firestore status:', err.message);
    }

    setSelectedItem((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, status: newStatus, overviewStatus: newOverviewStatus };
    });
  };

  const handleCategoryChange = (id, newCategory) => {
    setSelectedItem((prev) => (prev?.id === id ? { ...prev, category: newCategory } : prev));
  };

  return (
    <div className="admin-overview">
      <h1 className="overview-title">Admin Overview</h1>

      <div className="overview-filters-icons">
        <FaThLarge
          title="All"
          onClick={() => setActiveFilter('all')}
          className={`filter-icon ${activeFilter === 'all' ? 'enabled' : 'disabled'}`}
        />
        <FaStar
          title="SL Requests"
          onClick={() => setActiveFilter('slRequests')}
          className={`filter-icon ${activeFilter === 'slRequests' ? 'enabled' : 'disabled'}`}
        />
        <FaBox
          title="Orders"
          onClick={() => setActiveFilter('orders')}
          className={`filter-icon ${activeFilter === 'orders' ? 'enabled' : 'disabled'}`}
        />
        <FaUsers
          title="Endorsements"
          onClick={() => setActiveFilter('endorsements')}
          className={`filter-icon ${activeFilter === 'endorsements' ? 'enabled' : 'disabled'}`}
        />
        <FaHeadset
          title="Support"
          onClick={() => setActiveFilter('support')}
          className={`filter-icon ${activeFilter === 'support' ? 'enabled' : 'disabled'}`}
        />
        <FaExclamationTriangle
          title="Risk Alerts"
          onClick={() => setActiveFilter('risk')}
          className={`filter-icon ${activeFilter === 'risk' ? 'enabled' : 'disabled'}`}
        />
      </div>

      <div className="overview-columns">
        {renderColumn('🟢 New', data.new, 'new')}
        {renderColumn('🟠 In Progress', data.inProgress, 'inProgress')}
        {renderColumn('✔️ Completed', data.completed, 'completed')}
      </div>

      {modalType === 'order' && selectedItem && (
        <ViewOrderModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          orderDetails={selectedItem}
        />
      )}
      {modalType === 'inquiry' && selectedItem && (
        <ViewInquiryModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          inquiry={selectedItem}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
        />
      )}
      {modalType === 'submission' && selectedItem && (
        <ViewSoundlegendModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          submission={selectedItem}
        />
      )}
      {modalType === 'risk' && selectedItem && (
        <ViewRiskDetailModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          risk={selectedItem}
          onStatusChange={handleStatusChange}
        />
      )}
      {modalType === 'endorsement' && selectedItem && (
        <EndorsementApplicationModal
          value={selectedItem}
          appId={selectedItem.id}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default AdminOverview;