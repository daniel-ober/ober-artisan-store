import React, { useState } from 'react';
import './AdminCard.css';
import AdminModal from './AdminModal'; // AdminModal component
import { useAuth } from '../context/AuthContext'; // Access auth context

const AdminCard = ({ title, icon, isSelected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { isAdmin } = useAuth(); // Check if the user is an admin

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
      <div className="admin-card-icon">{icon}</div>
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
