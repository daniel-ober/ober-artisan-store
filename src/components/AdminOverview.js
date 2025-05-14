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
import './AdminOverview.css';

const AdminOverview = () => {
  const [data, setData] = useState({ new: [], inProgress: [], completed: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  const updateColumnState = (type, items) => {
    const newItems = items.filter(i => (i.overviewStatus || 'new') === 'new');
    const inProgressItems = items.filter(i => i.overviewStatus === 'inProgress');
    const completedItems = items.filter(i => i.overviewStatus === 'completed');

    setData(prev => ({
      new: [
        ...prev.new.filter(i => i.type !== type),
        ...newItems,
      ],
      inProgress: [
        ...prev.inProgress.filter(i => i.type !== type),
        ...inProgressItems,
      ],
      completed: [
        ...prev.completed.filter(i => i.type !== type),
        ...completedItems,
      ],
    }));
  };

  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(15)),
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'order',
          overviewStatus: doc.data().overviewStatus || null,
          ...doc.data(),
        }));
        updateColumnState('order', orders);
      }
    );

    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(15)),
      (snapshot) => {
        const inquiries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'inquiry',
            customerName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email: data.email || '',
            status: data.status || '',
            overviewStatus: data.overviewStatus,
          };
        });
        updateColumnState('inquiry', inquiries);
      }
    );

    const unsubSubmissions = onSnapshot(
      query(collection(db, 'soundlegend_submissions'), orderBy('submittedAt', 'desc'), limit(15)),
      (snapshot) => {
        const submissions = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'submission',
          overviewStatus: doc.data().overviewStatus || null,
          ...doc.data(),
        }));
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
          data.createdAt = new Date(data.createdAt.seconds * 1000).toLocaleString();
        }

        if (Array.isArray(data.systemHistory)) {
          data.systemHistory = data.systemHistory.map((entry) => ({
            ...entry,
            timestamp: entry.timestamp?.seconds
              ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
              : entry.timestamp,
          }));
        }

        setSelectedItem({ id: snap.id, ...data });
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
          updateFields.status = 'Closed - Won';
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

  const renderColumn = (title, items, statusKey) => (
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
      <h2 className={statusKey.toLowerCase()}>
        {title} <span className="badge">{items?.length || 0}</span>
      </h2>
      {Array.isArray(items) && items.length === 0 ? (
        <p>No {title.toLowerCase()} items</p>
      ) : (
        items.map((item) => renderItem(item, statusKey))
      )}
    </div>
  );

  return (
    <div className="admin-overview">
      <h1 className="overview-title">Admin Overview</h1>
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