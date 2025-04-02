import React, { useState, useEffect } from 'react';
import './AdminCard.css';
import AdminModal from './AdminModal'; // AdminModal component
import { useAuth } from '../context/AuthContext'; // Access auth context
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdminCard = ({ title, icon, isSelected, primaryCount, secondaryCount }) => { 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { isAdmin } = useAuth(); // Check if the user is an admin
  const [totalCount, setTotalCount] = useState(0);

  // Fetch combined count for support inquiries, orders, and soundlegend submissions
  useEffect(() => {
    const fetchCombinedCount = async () => {
      try {
        // Fetch new orders, inquiries, and soundlegend submissions
        const [orders, inquiries, submissions] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('status', '==', 'new'))),
          getDocs(query(collection(db, 'inquiries'), where('status', '==', 'new'))),
          getDocs(query(collection(db, 'soundlegend_submissions'), where('status', '==', 'new')))
        ]);

        const newOrders = orders.size;
        const newInquiries = inquiries.size;
        const newSubmissions = submissions.size;

        // Log the fetched data for debugging
        console.log('Fetched Data:', { newOrders, newInquiries, newSubmissions });

        // Calculate the total count of new items across all categories
        setTotalCount(newOrders + newInquiries + newSubmissions);

        // Log the final total count
        console.log('Total Count:', newOrders + newInquiries + newSubmissions);

      } catch (error) {
        console.error("Error fetching data for admin overview:", error);
      }
    };

    fetchCombinedCount();
  }, []);

  const handleAddClick = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(''); // Reset modal type
  };

  return (
    <div
      className={`admin-card ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="admin-card-icon">
        {icon}
        <div className="badge-wrapper">
          {totalCount > 0 && (
            <span className="notification-badge">{totalCount}</span> 
          )}
        </div>
      </div>
      <h2 className="admin-card-title">{title}</h2>

      {isAdmin && ( // Render buttons only for admin users
        <div className="admin-card-buttons">
          <button onClick={() => handleAddClick('user')}>Add User</button>
          <button onClick={() => handleAddClick('product')}>Add Product</button>
          <button onClick={() => handleAddClick('order')}>Add Order</button>
        </div>
      )}

      {isModalOpen && (
        <AdminModal type={modalType} onClose={closeModal} />
      )}
    </div>
  );
};

export default AdminCard;