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
      if (item.overviewStatus === 'new') newItems.push(item);
      else if (item.overviewStatus === 'inProgress') inProgressItems.push(item);
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
            const data = docSnap.data();
            let status = data.status;
            let overviewStatus = data.overviewStatus;

            if (!status || !overviewStatus) {
              status = getOrderStatusFromItems(data.items || []);
              overviewStatus = getOverviewStatus('order', status);
              await updateDoc(doc(db, 'orders', docSnap.id), { status, overviewStatus });
            }

            return {
              id: docSnap.id,
              type: 'order',
              ...data,
              status,
              overviewStatus,
            };
          })
        );
        updateColumnState('order', orders);
      }
    );

    // Inquiries
    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const inquiries = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'inquiry',
            customerName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email: data.email || '',
            status: data.status || '',
            overviewStatus: getOverviewStatus('inquiry', data.status || data.overviewStatus),
          };
        });
        updateColumnState('inquiry', inquiries);
      }
    );

    // Risk
    const unsubRisks = onSnapshot(
      query(collection(db, 'risk_notifications'), orderBy('timestamp', 'desc'), limit(100)),
      (snapshot) => {
        const risks = snapshot.docs.map((doc) => {
          const data = doc.data();
          const overviewStatus = getOverviewStatus('risk', data.status || data.overviewStatus);
          return {
            id: doc.id,
            type: 'risk',
            overviewStatus,
            status: data.status || 'Unclassified Risk',
            customerName:
              data.assessment?.username || data.assessment?.email || 'Unverified Login',
            email: data.email || 'N/A',
            ...data,
          };
        });
        updateColumnState('risk', risks);
      }
    );

    // SoundLegend submissions
    const unsubSubmissions = onSnapshot(
      query(collection(db, 'soundlegend_submissions'), orderBy('submittedAt', 'desc'), limit(100)),
      (snapshot) => {
        const submissions = snapshot.docs.map((doc) => {
          const data = doc.data();
          const overviewStatus = getOverviewStatus(
            'submission',
            data.status || data.overviewStatus
          );
          return {
            id: doc.id,
            type: 'submission',
            customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            overviewStatus,
            ...data,
          };
        });
        updateColumnState('submission', submissions);
      }
    );

    // Endorsement applications
    const unsubEndorsements = onSnapshot(
      query(collection(db, 'endorsement_applications'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const apps = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const overviewStatus = getOverviewStatus(
            'endorsement',
            data.status || data.overviewStatus || 'inProgress'
          );
        return {
            id: docSnap.id,
            type: 'endorsement',
            customerName: data.fullName || data.stageName || 'N/A',
            email: data.email || '',
            status: data.status || 'inProgress',
            overviewStatus,
            ...data,
          };
        });
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

      const data = snap.data();

      // RISK
      if (item.type === 'risk') {
        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : new Date();
        const severity = data.score >= 0.85 ? 'High' : data.score >= 0.5 ? 'Medium' : 'Low';

        setSelectedItem({
          id: snap.id,
          email: data.email || data.assessment?.email || 'N/A',
          type: data.type || 'Unknown',
          score: data.score || 0,
          timestamp,
          severity,
          source: data.source || 'N/A',
          systemHistory: data.systemHistory || [],
          status: data.status || 'New',
          overviewStatus: getOverviewStatus('risk', data.status),
        });
        setModalType('risk');
        return;
      }

      // ORDER
      if (item.type === 'order') {
        let createdAt = data.createdAt;
        if (createdAt?.seconds) createdAt = new Date(createdAt.seconds * 1000);

        const systemHistory = Array.isArray(data.systemHistory)
          ? data.systemHistory.map((entry) => ({
              ...entry,
              timestamp: entry.timestamp?.seconds
                ? new Date(entry.timestamp.seconds * 1000).toISOString()
                : entry.timestamp,
            }))
          : [];

        setSelectedItem({
          id: snap.id,
          createdAt,
          status: data.status || 'New',
          overviewStatus: data.overviewStatus || 'new',
          items: data.items || [],
          customerName: data.customerName || 'N/A',
          customerEmail: data.customerEmail || 'N/A',
          customerPhone: data.customerPhone || '',
          customerAddress: data.customerAddress || '',
          internalNotes: data.internalNotes || [],
          systemHistory,
          relatedProjects: data.relatedProjects || [],
        });
        setModalType('order');
        return;
      }

      // ✅ INQUIRY (Support) — this was missing
      if (item.type === 'inquiry') {
        const createdAt =
          data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : (data.createdAt || '');

        setSelectedItem({
          id: snap.id,
          type: 'inquiry',
          createdAt,
          origin: data.origin || data.source || 'web-contact',
          status: data.status || 'New',
          overviewStatus: getOverviewStatus('inquiry', data.status || data.overviewStatus),
          category: data.category || 'Other',
          name:
            `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
            data.name ||
            'N/A',
          email: data.email || 'N/A',
          message: data.message || '',
          internalNotes: data.internalNotes || [],
          systemHistory: data.systemHistory || [],
        });
        setModalType('inquiry');
        return;
      }

      // SOUNDLEGEND SUBMISSION
      if (item.type === 'submission') {
        const submittedAt = data.submittedAt?.seconds
          ? new Date(data.submittedAt.seconds * 1000)
          : null;

        setSelectedItem({ id: snap.id, ...data, submittedAt });
        setModalType('submission');
        return;
      }

      // ENDORSEMENT
      if (item.type === 'endorsement') {
        setSelectedItem({ id: snap.id, ...data });
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

    let page = 1;
    if (statusKey === 'new') page = newPage;
    else if (statusKey === 'inProgress') page = inProgressPage;
    else if (statusKey === 'completed') page = completedPage;

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
                  else if (statusKey === 'inProgress')
                    setInProgressPage((p) => Math.max(p - 1, 1));
                  else if (statusKey === 'completed')
                    setCompletedPage((p) => Math.max(p - 1, 1));
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
                  else if (statusKey === 'completed')
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

    setData((prev) => {
      const updatedItem = {
        ...(prev.new.find((i) => i.id === id) ||
          prev.inProgress.find((i) => i.id === id) ||
          prev.completed.find((i) => i.id === id)),
        id,
        status: newStatus,
        overviewStatus: newOverviewStatus,
      };

      return {
        new:
          newOverviewStatus === 'new'
            ? [updatedItem, ...prev.new.filter((i) => i.id !== id)]
            : prev.new.filter((i) => i.id !== id),
        inProgress:
          newOverviewStatus === 'inProgress'
            ? [updatedItem, ...prev.inProgress.filter((i) => i.id !== id)]
            : prev.inProgress.filter((i) => i.id !== id),
        completed:
          newOverviewStatus === 'completed'
            ? [updatedItem, ...prev.completed.filter((i) => i.id !== id)]
            : prev.completed.filter((i) => i.id !== id),
      };
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