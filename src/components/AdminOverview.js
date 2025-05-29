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
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewOrderModal from './ViewOrderModal';
import ViewInquiryModal from './ViewInquiryModal';
import ViewSoundlegendModal from './ViewSoundlegendModal';
import { FaBox, FaHeadset, FaStar } from 'react-icons/fa';
import './AdminOverview.css';

const AdminOverview = () => {
  const [data, setData] = useState({ new: [], inProgress: [], completed: [] });
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
  });

  // Always update state with raw data per type; don't early-return based on filters.
  const updateColumnState = (type, items) => {
    const newItems = items.filter((i) => {
      const status = (i.overviewStatus || i.status || 'new').toLowerCase();
      return status === 'new';
    });

    const inProgressItems = items.filter((i) => {
      const status = (i.overviewStatus || i.status || '').toLowerCase();
      return status === 'prospecting' || status === 'inprogress';
    });

    const completedItems = items.filter((i) => {
      const status = (i.overviewStatus || i.status || '').toLowerCase();
      return [
        'closed - won',
        'closed - lost',
        'closed - incomplete form',
        'closed - no response',
        'closed - duplicate/spam',
        'completed',
      ].includes(status);
    });

    setData((prev) => ({
      new: [...prev.new.filter((i) => i.type !== type), ...newItems],
      inProgress: [
        ...prev.inProgress.filter((i) => i.type !== type),
        ...inProgressItems,
      ],
      completed: [
        ...prev.completed.filter((i) => i.type !== type),
        ...completedItems,
      ],
    }));
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

    const unsubSubmissions = onSnapshot(
      query(
        collection(db, 'soundlegend_submissions'),
        orderBy('submittedAt', 'desc'),
        limit(100)
      ),
      (snapshot) => {
        const submissions = snapshot.docs.map((doc) => {
          const data = doc.data();
          const rawStatus = (data.status || '').toLowerCase().trim();
          const derivedStatus =
            data.overviewStatus ||
            (rawStatus.includes('prospecting')
              ? 'inProgress'
              : rawStatus.includes('closed')
                ? 'completed'
                : 'new');
          console.log(
            `🔥 SUBMISSION ${doc.id.slice(-6)} | status: "${data.status}" | derived: "${derivedStatus}"`
          );
          return {
            id: doc.id,
            type: 'submission',
            customerName:
              `${data.firstName || ''} ${data.lastName || ''}`.trim(),
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
            : 'soundlegend_submissions',
        item.id
      );
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
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
          createdAt: data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : 'No date',
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
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleDrop = async (event, targetStatus) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('text/plain');
    const { id, type, sourceStatus } = JSON.parse(dataString);
    const ref = doc(
      db,
      type === 'order'
        ? 'orders'
        : type === 'inquiry'
          ? 'inquiries'
          : 'soundlegend_submissions',
      id
    );
    try {
      const updateFields = { overviewStatus: targetStatus };
      if (type === 'submission') {
        if (targetStatus === 'inProgress') {
          updateFields.status = 'Prospecting';
        } else if (targetStatus === 'completed') {
          updateFields.status = 'Closed - No Response';
        } else {
          updateFields.status = 'New';
        }
      }
      await updateDoc(ref, updateFields);
    } catch (err) {
      console.error('❌ Error updating overview status:', err.message);
    }
  };

  const renderItem = (item, sourceStatus) => {
    const labelType =
      item.type === 'order'
        ? 'ORDER'
        : item.type === 'inquiry'
          ? 'SUPPORT'
          : 'SOUNDLEGEND';
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
        <div>{desc}</div>
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

  const handleStatusChange = (id, newStatus) => {
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
          onClick={() =>
            setFilters((f) => ({ ...f, orders: !f.orders }))
          }
          className={`filter-icon ${filters.orders ? 'enabled' : 'disabled'}`}
        />
        <FaHeadset
          title="Support"
          onClick={() =>
            setFilters((f) => ({ ...f, support: !f.support }))
          }
          className={`filter-icon ${filters.support ? 'enabled' : 'disabled'}`}
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
    </div>
  );
};

export default AdminOverview;
