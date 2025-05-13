// AdminOverviewDragDrop.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import './AdminOverview.css';

const statusGroups = ['New', 'In Progress', 'Completed'];

const AdminOverviewDragDrop = () => {
  const [inquiries, setInquiries] = useState([]);
  const [draggingItem, setDraggingItem] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      const snapshot = await getDocs(collection(db, 'inquiries'));
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setInquiries(items);
    };
    fetchInquiries();
  }, []);

  const handleDrop = async (status) => {
    if (!draggingItem) return;
    const ref = doc(db, 'inquiries', draggingItem.id);
    await updateDoc(ref, { overviewStatus: status });
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === draggingItem.id ? { ...item, overviewStatus: status } : item
      )
    );
    setDraggingItem(null);
  };

  const groupedItems = statusGroups.reduce((acc, group) => {
    acc[group] = inquiries.filter(
      (item) => (item.overviewStatus || 'New') === group
    );
    return acc;
  }, {});

  return (
    <div className="admin-overview-drag">
      {statusGroups.map((group) => (
        <div
          key={group}
          className={`overview-column status-${group.toLowerCase()}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(group)}
        >
          <h3>{group}</h3>
          {groupedItems[group].length === 0 ? (
            <p className="empty">No items</p>
          ) : (
            groupedItems[group].map((item) => (
              <div
                key={item.id}
                className="overview-card"
                draggable
                onDragStart={() => setDraggingItem(item)}
                onClick={() => window.dispatchEvent(new CustomEvent('open-inquiry-modal', { detail: item.id }))}
              >
                <strong>{item.category?.toUpperCase()} • {item.id.slice(-6)}</strong>
                <p>{item.email}</p>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminOverviewDragDrop;
