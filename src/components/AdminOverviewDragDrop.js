import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import './AdminOverview.css';

const statusGroups = ['New', 'In Progress', 'Completed'];

const AdminOverviewDragDrop = () => {
  const [inquiries, setInquiries] = useState([]);
  const [draggingItem, setDraggingItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      const inqSnap = await getDocs(collection(db, 'inquiries'));
      const riskSnap = await getDocs(collection(db, 'risk_notifications'));

      const inqItems = inqSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        type: 'inquiry',
        ...docSnap.data(),
      }));

      const riskItems = riskSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || '').toLowerCase();
        let overviewStatus = 'new';
        if (status === 'in progress') overviewStatus = 'inProgress';
        else if (status === 'completed') overviewStatus = 'completed';

        return {
          id: docSnap.id,
          type: 'risk',
          status: data.status || 'New',
          overviewStatus,
          email: data.email || data.assessment?.email || 'N/A',
        };
      });

      setInquiries([...inqItems, ...riskItems]);
    };

    fetchItems();
  }, []);

  const handleDrop = async (newStatus) => {
    if (!draggingItem) return;

    if (draggingItem.type === 'risk') {
      const ref = doc(db, 'risk_notifications', draggingItem.id);
      const derivedOverview =
        newStatus.toLowerCase() === 'in progress'
          ? 'inProgress'
          : newStatus.toLowerCase() === 'completed'
          ? 'completed'
          : 'new';

          await updateDoc(ref, {
            status: newStatus.toLowerCase(), // ✅ Normalize to lowercase
            overviewStatus: derivedOverview,
            systemHistory: arrayUnion({
              event: `Risk item moved to "${newStatus}"`,
              timestamp: new Date().toISOString(),
            }),
          });

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === draggingItem.id
            ? {
                ...item,
                status: newStatus,
                overviewStatus: derivedOverview,
                systemHistory: [
                  {
                    event: `Risk item moved to "${newStatus}"`,
                    timestamp: new Date().toISOString(),
                  },
                  ...(item.systemHistory || []),
                ],
              }
            : item
        )
      );
    } else {
      // Default inquiry behavior
      const ref = doc(db, 'inquiries', draggingItem.id);
      await updateDoc(ref, { overviewStatus: newStatus });

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === draggingItem.id
            ? { ...item, overviewStatus: newStatus }
            : item
        )
      );
    }

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
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('open-inquiry-modal', {
                      detail: item.id,
                    })
                  )
                }
              >
                <strong>
                  {(item.category || item.type)?.toUpperCase()} •{' '}
                  {item.id.slice(-6)}
                </strong>
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