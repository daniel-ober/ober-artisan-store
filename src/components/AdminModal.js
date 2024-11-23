import React, { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminModal.css';

const AdminModal = ({ type, onClose, itemId = null, onItemAdded }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectionName = type === 'user' ? 'users' : type === 'product' ? 'products' : 'orders';

    try {
      if (itemId) {
        const docRef = doc(db, collectionName, itemId);
        await setDoc(docRef, formData, { merge: true });
      } else {
        const collectionRef = collection(db, collectionName);
        await addDoc(collectionRef, formData);
      }
      onItemAdded();
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
              placeholder="Name"
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
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{itemId ? 'Edit' : 'Add'} {type}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {renderFields()}
          <button type="submit">{itemId ? 'Update' : 'Add'} {type}</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;
