import React, { useState, useEffect } from 'react';
import './AdminCard.css';
import AdminModal from './AdminModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdminCard = ({ title, icon, isSelected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { isAdmin } = useAuth();
  const [highSeverityCount, setHighSeverityCount] = useState(0);
  const [mediumSeverityCount, setMediumSeverityCount] = useState(0);

  useEffect(() => {
    const fetchRiskCounts = async () => {
      try {
        const q = query(collection(db, 'risk_notifications'));
        const snapshot = await getDocs(q);

        let high = 0;
        let medium = 0;

        snapshot.forEach((doc) => {
          const score = doc.data().score || 0;
          if (score >= 0.85) high++;
          else if (score >= 0.5) medium++;
        });

        setHighSeverityCount(high);
        setMediumSeverityCount(medium);
      } catch (error) {
        console.error('Error fetching risk notification counts:', error);
      }
    };

    if (title === 'Risk Alerts') {
      fetchRiskCounts();
    }
  }, [title]);

  const handleAddClick = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
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
          {highSeverityCount > 0 && (
            <span className="notification-badge">{highSeverityCount}</span>
          )}
          {mediumSeverityCount > 0 && (
            <span className="notification-badge-secondary">{mediumSeverityCount}</span>
          )}
        </div>
      </div>
      <h2 className="admin-card-title">{title}</h2>

      {isAdmin && (
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