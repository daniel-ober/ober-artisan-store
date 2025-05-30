import React, { useEffect, useState } from 'react';
import { arrayUnion } from 'firebase/firestore';
import {
  getDoc,
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
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
} from 'react-icons/fa';
import './AdminOverview.css';

const AdminOverview = () => {
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

  const [filters, setFilters] = useState({
    orders: true,
    support: true,
    slRequests: true,
    risk: true,
  });

  // Always update state with raw data per type; don't early-return based on filters.
  const updateColumnState = (type, items) => {
    const newItems = [];
    const inProgressItems = [];
    const completedItems = [];

    for (const item of items) {
      let status = (item.overviewStatus || item.status || '').toLowerCase();
      if (item.type === 'risk') {
        if (status === 'in review') status = 'inprogress';
        else if (status === 'resolved' || status === 'completed')
          status = 'completed';
        else status = 'new';
      }
      if (status === 'new') newItems.push(item);
      else if (status === 'prospecting' || status === 'inprogress')
        inProgressItems.push(item);
      else if (
        [
          'closed - won',
          'closed - lost',
          'closed - incomplete form',
          'closed - no response',
          'closed - duplicate/spam',
          'completed',
        ].includes(status)
      ) {
        completedItems.push(item);
      }
    }

    setData((prev) => {
      // Remove all items of this type from each column
      const filterOut = (arr) => arr.filter((i) => i.type !== type);

      // Prevent duplicates by checking id+type combo
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
        inProgress: uniqueById([
          ...filterOut(prev.inProgress),
          ...inProgressItems,
        ]),
        completed: uniqueById([
          ...filterOut(prev.completed),
          ...completedItems,
        ]),
      };
    });
  };

  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'order',
          overviewStatus: doc.data().overviewStatus || null,
          ...doc.data(),
        }));
        updateColumnState('order', orders);
      }
    );

    const normalizeStatus = (status = '') =>
      status.toLowerCase().replace(/\s+/g, '');

    const getDisplayStatus = (status) => {
      const normalized = normalizeStatus(status);
      if (normalized === 'inprogress') return 'In Progress';
      if (normalized === 'completed' || normalized === 'resolved')
        return 'Completed';
      return 'New';
    };

    const getStatusBadgeClass = (status) => {
      const normalized = normalizeStatus(status);
      if (normalized === 'inprogress') return 'badge-yellow';
      if (normalized === 'completed' || normalized === 'resolved')
        return 'badge-gray';
      return 'badge-green';
    };

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
            overviewStatus:
              data.overviewStatus ||
              (data.status?.toLowerCase().includes('prospecting')
                ? 'inProgress'
                : data.status?.toLowerCase().includes('closed')
                  ? 'completed'
                  : 'new'),
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
          const rawStatus = (data.status || '').toLowerCase().trim();
          const derivedStatus =
            rawStatus === 'in review'
              ? 'inProgress'
              : rawStatus === 'resolved' || rawStatus === 'completed'
                ? 'completed'
                : 'new';

          return {
            id: doc.id,
            type: 'risk',
            overviewStatus: derivedStatus,
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
          const rawStatus = (data.status || '').toLowerCase().trim(); // ✅ ADD THIS LINE
          const derivedStatus =
            data.overviewStatus ||
            (rawStatus.includes('prospecting')
              ? 'inProgress'
              : rawStatus.includes('closed')
                ? 'completed'
                : 'new');
        
          return {
            id: doc.id,
            type: 'submission',
            customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            overviewStatus: derivedStatus,
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

  const handleItemClick = async (item) => {
    try {
      const ref = doc(
        db,
        item.type === 'order'
          ? 'orders'
          : item.type === 'inquiry'
            ? 'inquiries'
            : item.type === 'submission'
              ? 'soundlegend_submissions'
              : 'risk_notifications',
        item.id
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

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
          overviewStatus:
            data.status?.toLowerCase().includes('in progress') ? 'inProgress'
            : data.status?.toLowerCase().includes('completed') || data.status?.toLowerCase().includes('resolved') ? 'completed'
            : 'new',
          assessment: data.assessment || {},
        });
      
        setModalType('risk');
        return;
      }

      // For all other item types
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

    const ref = doc(
      db,
      type === 'order'
        ? 'orders'
        : type === 'inquiry'
          ? 'inquiries'
          : type === 'submission'
            ? 'soundlegend_submissions'
            : 'risk_notifications',
      id
    );

    try {
      let normalizedStatus = 'New';

      if (type === 'submission') {
        if (targetStatus === 'inProgress') {
          normalizedStatus = 'Prospecting';
        } else if (targetStatus === 'completed') {
          normalizedStatus = 'Closed - No Response';
        }
      } else if (type === 'risk') {
        if (targetStatus === 'inProgress') {
          normalizedStatus = 'In Progress'; // ✅ Correct casing for dropdown
        } else if (targetStatus === 'completed') {
          normalizedStatus = 'Resolved'; // ✅ Also support "Dismissed" in logic elsewhere
        } else {
          normalizedStatus = 'New';
        }
      } else {
        // Generic fallback for orders/inquiries
        normalizedStatus = targetStatus;
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

      // Update local state
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
                className={`risk-status-badge ${getStatusBadgeClass(item.status)}`}
              >
                {getDisplayStatus(item.status)}
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

  // Apply filtering on render based on the current filters.
  const renderColumn = (title, items, statusKey) => {
    // First, filter items based on type:
    const filteredItems = items.filter((item) => {
      if (item.type === 'order' && !filters.orders) return false;
      if (item.type === 'inquiry' && !filters.support) return false;
      if (item.type === 'submission' && !filters.slRequests) return false;
      if (item.type === 'risk' && !filters.risk) return false;
      return true;
    });

    let page = 1;
    if (statusKey === 'new') page = newPage;
    else if (statusKey === 'inProgress') page = inProgressPage;
    else if (statusKey === 'completed') page = completedPage;

    // Always apply pagination (for all columns)
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
    const statusLower = newStatus.toLowerCase();
    let newOverviewStatus;
    if (statusLower === 'new') {
      newOverviewStatus = 'new';
    } else if (
      statusLower.includes('in progress') ||
      statusLower.includes('prospecting')
    ) {
      newOverviewStatus = 'inProgress';
    } else {
      newOverviewStatus = 'completed';
    }

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
        <FaStar
          title="SL Requests"
          onClick={() =>
            setFilters((f) => ({ ...f, slRequests: !f.slRequests }))
          }
          className={`filter-icon ${filters.slRequests ? 'enabled' : 'disabled'}`}
        />
        <FaBox
          title="Orders"
          onClick={() => setFilters((f) => ({ ...f, orders: !f.orders }))}
          className={`filter-icon ${filters.orders ? 'enabled' : 'disabled'}`}
        />
        <FaHeadset
          title="Support"
          onClick={() => setFilters((f) => ({ ...f, support: !f.support }))}
          className={`filter-icon ${filters.support ? 'enabled' : 'disabled'}`}
        />
        <div className="risk-alert-wrapper">
          <FaExclamationTriangle
            title="Risk Alerts"
            onClick={() => setFilters((f) => ({ ...f, risk: !f.risk }))}
            className={`filter-icon ${filters.risk ? 'enabled' : 'disabled'}`}
          />
          {activeRiskCount > 0 && (
            <span className="risk-alert-badge">{activeRiskCount}</span>
          )}
        </div>
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
          onStatusChange={handleStatusChange} // 👈 include this if your modal has an editable dropdown
        />
      )}
    </div>
  );
};

export default AdminOverview;
