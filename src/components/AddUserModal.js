import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AddUserModal.css';

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emailNotification: true,
    smsNotification: false,
    status: 'active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if the email already exists
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email));
      const existingUsers = await getDocs(emailQuery);

      if (!existingUsers.empty) {
        setError('A user with this email already exists.');
        setLoading(false);
        return;
      }

      // Add the new user to Firestore
      const newUser = {
        ...formData,
        createdAt: Timestamp.now(),
      };

      const userRef = await addDoc(usersRef, newUser);

      // Pass the new user back to the parent component
      onUserAdded({ ...newUser, id: userRef.id });

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-modal">
      <div className="modal-content">
        <h2>Add User</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="emailNotification">
              <input
                type="checkbox"
                id="emailNotification"
                name="emailNotification"
                checked={formData.emailNotification}
                onChange={handleChange}
              />
              Email Notification
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="smsNotification">
              <input
                type="checkbox"
                id="smsNotification"
                name="smsNotification"
                checked={formData.smsNotification}
                onChange={handleChange}
              />
              SMS Notification
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
