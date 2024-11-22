import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminModal.css';

const AdminModal = ({ type, onClose, itemId = null, defaultValues = {} }) => {
  const [formData, setFormData] = useState(defaultValues);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectionName = type === 'user' ? 'users' : type === 'product' ? 'products' : 'orders';

    try {
      const docRef = doc(db, collectionName, itemId || formData.id);
      await setDoc(docRef, formData, { merge: true });
      onClose();
    } catch (err) {
      setError(`Error ${itemId ? 'updating' : 'adding'} ${type}: ${err.message}`);
    }
  };

  const renderFields = () => {
    switch (type) {
      case 'user':
        return (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name || ''}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email || ''}
              onChange={handleChange}
              required
            />
            <select
              name="role"
              value={formData.role || ''}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </>
        );
      case 'product':
        return (
          <>
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name || ''}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price || ''}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description || ''}
              onChange={handleChange}
            />
          </>
        );
      case 'order':
        return (
          <>
            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName || ''}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="totalAmount"
              placeholder="Total Amount"
              value={formData.totalAmount || ''}
              onChange={handleChange}
              required
            />
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{itemId ? 'Edit' : 'Add'} {type}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {renderFields()}
          <button type="submit">{itemId ? 'Update' : 'Add'} {type}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
      <div
        className="modal-overlay"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
        aria-label="Close Modal"
      ></div>
    </div>
  );
};

export default AdminModal;
