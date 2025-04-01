import React, { useEffect, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { getDoc, doc, updateDoc, arrayUnion, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';  // Updated import
import { db } from '../firebaseConfig';
import ViewOrderModal from './ViewOrderModal';
import ViewInquiryModal from './ViewInquiryModal';
import ViewSoundlegendModal from './ViewSoundlegendModal';
import './AdminOverview.css';

const AdminOverview = () => {
  const [data, setData] = useState({
    new: [],
    inProgress: [],
    completed: [],
  });

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

      // Handle orders
      orders.forEach((doc) => {
        const order = doc.data();
        const id = doc.id;
        const itemStatuses = (order.items || []).map(item => item.status);

        if (itemStatuses.some(status => status === 'New')) {
          newItems.push({ id, type: 'order', ...order });
        } else if (itemStatuses.some(status => ['Preparing', 'Packaged', 'Ready for Shipment', 'Back Ordered'].includes(status))) {
          inProgressItems.push({ id, type: 'order', ...order });
        } else if (itemStatuses.every(status => ['Shipped', 'Delivered'].includes(status))) {
          completedItems.push({ id, type: 'order', ...order });
        }
      });

      // Handle inquiries
      inquiries.forEach((doc) => {
        const inquiry = doc.data();
        const id = doc.id;
        const status = inquiry.status || '';

        if (status === 'New') {
          newItems.push({ id, type: 'inquiry', ...inquiry });
        } else if (['Support - In Progress', 'Sales - Prospecting'].includes(status)) {
          inProgressItems.push({ id, type: 'inquiry', ...inquiry });
        } else if (['Support - Closed', 'Sales - Closed Won', 'Sales - Closed Lost'].includes(status)) {
          completedItems.push({ id, type: 'inquiry', ...inquiry });
        }
      });

      // Handle soundlegend submissions
      submissions.forEach((doc) => {
        const submission = doc.data();
        const id = doc.id;
        const status = submission.status || '';

        if (status === 'New') {
          newItems.push({ id, type: 'submission', ...submission });
        } else if (status === 'Prospecting') {
          inProgressItems.push({ id, type: 'submission', ...submission });
        } else if (status.startsWith('Closed')) {
          completedItems.push({ id, type: 'submission', ...submission });
        }
      });

      setData({
        new: newItems.slice(0, 10),
        inProgress: inProgressItems.slice(0, 10),
        completed: completedItems.slice(0, 10),
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
  
        // Safeguard: Ensure 'items' exists as an array for orders
        if (item.type === 'order' && !Array.isArray(data.items)) {
          data.items = [];
        }
  
        // Update state to render the appropriate modal
        setSelectedItem({ id: snap.id, ...data });
        setModalType(item.type);  // Ensure the correct modal type is set
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const renderItem = (item) => {
    const labelType = item.type === 'order' ? 'ORDER' : item.type === 'inquiry' ? 'SUPPORT' : 'SOUNDLEGEND';
    const label = `${labelType} • ${item.id.slice(0, 6)}`;
    const desc = item.customerName || item.name || item.email || item.status;
    return (
      <div
        key={`${item.type}-${item.id}`}
        className="overview-item"
        onClick={() => handleItemClick(item)} // Ensure that clicking triggers the handleItemClick
      >
        <strong>{label}</strong>
        <div>{desc}</div>
      </div>
    );
  };

  return (
    <div className="admin-overview">
      <h1 className="overview-title">📊 Admin Overview</h1>
      <div className="overview-columns">
        <div className="overview-section">
          <h2 className="new">🆕 New</h2>
          {data.new.length === 0 ? <p>No new items</p> : data.new.map(renderItem)}
        </div>
        <div className="overview-section">
          <h2 className="in-progress">⏳ In Progress</h2>
          {data.inProgress.length === 0 ? <p>No items in progress</p> : data.inProgress.map(renderItem)}
        </div>
        <div className="overview-section">
          <h2 className="completed">✅ Completed</h2>
          {data.completed.length === 0 ? <p>No completed items</p> : data.completed.map(renderItem)}
        </div>
      </div>

      {/* Render Modals */}
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
          inquiry={selectedItem}  // Ensure inquiry is passed properly
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