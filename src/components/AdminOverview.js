import React, { useEffect, useState } from 'react';
import {
  getDoc,
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
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

  useEffect(() => {
    const fetchOverview = async () => {
      const [orders, inquiries, submissions] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(15))),
        getDocs(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(15))),
        getDocs(query(collection(db, 'soundlegend_submissions'), orderBy('submittedAt', 'desc'), limit(15))),
      ]);

      const newItems = [];
      const inProgressItems = [];
      const completedItems = [];

      orders.forEach((doc) => {
        const order = doc.data();
        const id = doc.id;
        const overviewStatus = order.overviewStatus || null;
        const item = { id, type: 'order', overviewStatus, ...order };

        if (overviewStatus === 'inProgress') {
          inProgressItems.push(item);
        } else if (overviewStatus === 'completed') {
          completedItems.push(item);
        } else {
          newItems.push(item);
        }
      });

      inquiries.forEach((docSnap) => {
        const inquiry = docSnap.data();
        const firestoreId = docSnap.id;
        const overviewStatus = inquiry.overviewStatus;
        const item = {
          id: firestoreId,
          type: 'inquiry',
          customerName: `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim(),
          email: inquiry.email || '',
          status: inquiry.status || '',
          overviewStatus,
        };

        if (overviewStatus === 'inProgress') {
          inProgressItems.push(item);
        } else if (overviewStatus === 'completed') {
          completedItems.push(item);
        } else {
          newItems.push(item);
        }
      });

      submissions.forEach((doc) => {
        const submission = doc.data();
        const id = doc.id;
        const overviewStatus = submission.overviewStatus || null;
        const item = { id, type: 'submission', overviewStatus, ...submission };

        if (overviewStatus === 'inProgress') {
          inProgressItems.push(item);
        } else if (overviewStatus === 'completed') {
          completedItems.push(item);
        } else {
          newItems.push(item);
        }
      });

      setData({
        new: newItems,
        inProgress: inProgressItems,
        completed: completedItems,
      });
    };

    fetchOverview();
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

      // 🔧 If it's a SoundLegend submission, also update `status`
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

      setData((prev) => {
        const updated = { ...prev };
        const index = updated[sourceStatus].findIndex((i) => i.id === id && i.type === type);
        if (index > -1) {
          const [movedItem] = updated[sourceStatus].splice(index, 1);
          movedItem.overviewStatus = targetStatus;
          if (type === 'submission') {
            movedItem.status = updateFields.status;
          }
          updated[targetStatus].unshift(movedItem);
        }
        return updated;
      });
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