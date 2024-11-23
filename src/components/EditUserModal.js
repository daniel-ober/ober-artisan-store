import React, { useState, useEffect } from 'react';
import { updateUserInFirestore } from '../services/userService';
import './EditUserModal.css';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emailNotification: false,
    smsNotification: false,
    status: 'active', // Reflects account status
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        emailNotification: user.emailNotification || false,
        smsNotification: user.smsNotification || false,
        status: user.status || 'active',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    const { firstName, lastName, email } = formData;

    if (!firstName || !lastName || !email) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      await updateUserInFirestore(user.id, formData);
      onUserUpdated({ ...user, ...formData });
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDeactivateActivate = async () => {
    const updatedStatus = formData.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserInFirestore(user.id, { status: updatedStatus });
      setFormData((prev) => ({ ...prev, status: updatedStatus }));
      onUserUpdated({ ...user, status: updatedStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update user status.');
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        role="button"
        tabIndex={0}
        onClick={handleCancel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleCancel();
        }}
        aria-label="Close modal"
      />
      <div className="edit-user-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <h2 id="modal-title">Edit User</h2>
        <div className="modal-content">
          <label>
            First Name:
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Last Name:
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled // Email is non-editable
            />
          </label>
          <label>
            Phone:
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </label>
          <label>
            SMS Notifications:
            <input
              type="checkbox"
              name="smsNotification"
              checked={formData.smsNotification}
              onChange={handleChange}
            />
          </label>
          <label>
            Email Notifications:
            <input
              type="checkbox"
              name="emailNotification"
              checked={formData.emailNotification}
              onChange={handleChange}
            />
          </label>
          <label>
            Status:
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
          <button
            onClick={handleDeactivateActivate}
            className={
              formData.status === 'active' ? 'deactivate-button' : 'activate-button'
            }
          >
            {formData.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditUserModal;
