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
import {
  FaBox,
  FaHeadset,
  FaStar,
  FaExclamationTriangle,
  FaThLarge,
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
    default:
      return '';
  }
};

const inferStatusFromTarget = (type, targetStatus, currentItem = null) => {
  const schema = STATUS_SCHEMA[type];
  if (!schema) return 'New';

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

const normalizeStatusAndOverview = (type, data) => {
  let status = data.status;

  // Only auto-infer order status from items if it's missing or marked as 'order started'
  if (type === 'order' && (!status || status === 'order started')) {
    status = getOrderStatusFromItems(data.items || []);
  }

  const overviewStatus = getOverviewStatus(type, status);
  return { status, overviewStatus };
};

const AdminOverview = ({ notifications = {}, secondaryNotifications = {}, setOverviewBadgeCounts }) => {
  const [data, setData] = useState({
    new: [],
    inProgress: [],
    completed: [],
    risks: [],
  });
  const activeRiskCount = [...data.new, ...data.inProgress].filter(
    (item) => item.type === 'risk'
  ).length;
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
  
      // ✅ Only use item.overviewStatus directly — do NOT recalculate
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
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      async (snapshot) => {
        const orders = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let status = data.status;
            let overviewStatus = data.overviewStatus;
            
            // ✅ Only infer if they're missing (for backward compatibility)
            if (!status || !overviewStatus) {
              status = getOrderStatusFromItems(data.items || []);
              overviewStatus = getOverviewStatus('order', status);
            
              // ✅ Only save to Firestore if it was actually missing
              await updateDoc(doc(db, 'orders', docSnap.id), {
                status,
                overviewStatus,
              });
            }
            
            // ✅ Never override manual status/overviewStatus if already present
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

    const unsubInquiries = onSnapshot(
      query(
        collection(db, 'inquiries'),
        orderBy('createdAt', 'desc'),
        limit(100)
      ),
      (snapshot) => {
        const inquiries = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'inquiry',
            customerName:
              `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email: data.email || '',
            status: data.status || '',
            overviewStatus: getOverviewStatus(
              'inquiry',
              data.status || data.overviewStatus
            ),
          };
        });
        updateColumnState('inquiry', inquiries);
      }
    );

    const unsubRisks = onSnapshot(
      query(
        collection(db, 'risk_notifications'),
        orderBy('timestamp', 'desc'),
        limit(100)
      ),
      (snapshot) => {
        const risks = snapshot.docs.map((doc) => {
          const data = doc.data();
          const overviewStatus = getOverviewStatus(
            'risk',
            data.status || data.overviewStatus
          );

          return {
            id: doc.id,
            type: 'risk',
            overviewStatus,
            status: data.status || 'Unclassified Risk',
            customerName:
              data.assessment?.username ||
              data.assessment?.email ||
              'Unverified Login',
            email: data.email || 'N/A',
            ...data,
          };
        });

        updateColumnState('risk', risks);
      }
    );

    const unsubSubmissions = onSnapshot(
      query(
        collection(db, 'soundlegend_submissions'),
        orderBy('submittedAt', 'desc'),
        limit(100)
      ),
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
            customerName:
              `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            overviewStatus,
            ...data,
          };
        });
        updateColumnState('submission', submissions);
      }
    );

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubSubmissions();
      unsubRisks();
    };
  }, []);

  useEffect(() => {
    const calcOverviewCounts = () => {
      const green =
        (notifications.manageOrders || 0) +
        (notifications.manageInquiries || 0) +
        (notifications.manageSoundlegendRequests || 0) +
        (notifications.manageRiskAlerts || 0);
  
      const yellow =
        (secondaryNotifications.manageOrders || 0) +
        (secondaryNotifications.manageInquiries || 0) +
        (secondaryNotifications.manageSoundlegendRequests || 0) +
        (secondaryNotifications.manageRiskAlerts || 0);
  
      setOverviewBadgeCounts({ green, yellow });
    };
  
    calcOverviewCounts();
  }, [notifications, secondaryNotifications]);

  const handleItemClick = async (item) => {
    try {
      const ref = doc(db, getCollectionPath(item.type), item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.warn('❗ Document not found in Firestore for', item);
        return;
      }

      const data = snap.data();

      if (item.type === 'risk') {
        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : new Date();

        const severity =
          data.score >= 0.85 ? 'High' : data.score >= 0.5 ? 'Medium' : 'Low';

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

      if (item.type === 'order' && !Array.isArray(data.items)) {
        data.items = [];
      }

      if (data.createdAt?.seconds) {
        data.createdAt = new Date(
          data.createdAt.seconds * 1000
        ).toLocaleString();
      }

      if (Array.isArray(data.systemHistory)) {
        data.systemHistory = data.systemHistory.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp?.seconds
            ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
            : entry.timestamp,
        }));
      }

      setSelectedItem({
        id: snap.id,
        overviewStatus: data.overviewStatus || 'new',
        createdAt: data.createdAt || 'No date',
        status: data.status || 'New',
        internalNotes: data.internalNotes || [],
        systemHistory: data.systemHistory || [],
        category: data.category || 'General',
        origin: data.origin || 'Contact Form',
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email || 'N/A',
        message: data.message || '',
      });

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
      const currentItem = allItems.find(
        (item) => item.id === id && item.type === type
      );
      let normalizedStatus = inferStatusFromTarget(type, targetStatus, currentItem);

      // ⚠️ Force manual override of status if dragging order to new/completed
      if (type === 'order') {
        if (targetStatus === 'new') normalizedStatus = 'new';
        else if (targetStatus === 'completed') normalizedStatus = 'fulfilled';
      }
      const updateFields = {
        overviewStatus: targetStatus,
        status: normalizedStatus,
        systemHistory: arrayUnion({
          event: `Status changed to "${normalizedStatus}" via drag-and-drop`,
          timestamp: new Date().toISOString(),
        }),
      };

      await updateDoc(ref, updateFields);

      setSelectedItem((prev) => {
        if (!prev || prev.id !== id || prev.type !== type) return prev;
        return {
          ...prev,
          status: normalizedStatus,
          overviewStatus: targetStatus,
        };
      });

      setData((prev) => {
        const allItems = [...prev.new, ...prev.inProgress, ...prev.completed];
        const movedItem = allItems.find(
          (item) => item.id === id && item.type === type
        );
        if (!movedItem) return prev;

        const updatedItem = {
          ...movedItem,
          overviewStatus: targetStatus,
          status: normalizedStatus,
        };
        updatedItem._manuallyUpdated = true;

        const filterOut = (items) =>
          items.filter((i) => i.id !== id || i.type !== type);

        return {
          new:
            targetStatus === 'new'
              ? [updatedItem, ...filterOut(prev.new)]
              : filterOut(prev.new),
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
              <span
                className={`risk-status-badge ${getBadgeClass(item.status)}`}
              >
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
      if (activeFilter === 'risk') return item.type === 'risk';
      return false;
    });

    let page = 1;
    if (statusKey === 'new') page = newPage;
    else if (statusKey === 'inProgress') page = inProgressPage;
    else if (statusKey === 'completed') page = completedPage;

    const paginatedItems = filteredItems.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
    const startIndex =
      filteredItems.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
    const endIndex =
      filteredItems.length > 0
        ? Math.min(page * itemsPerPage, filteredItems.length)
        : 0;

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
                  if (statusKey === 'new')
                    setNewPage((p) => Math.max(p - 1, 1));
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
                    setNewPage((p) =>
                      p * itemsPerPage < filteredItems.length ? p + 1 : p
                    );
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
      return {
        ...prev,
        status: newStatus,
        overviewStatus: newOverviewStatus,
      };
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
    setSelectedItem((prev) =>
      prev?.id === id ? { ...prev, category: newCategory } : prev
    );
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
    </div>
  );
};

export default AdminOverview;
