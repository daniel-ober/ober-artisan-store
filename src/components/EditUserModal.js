import React, { useState, useEffect } from 'react';
import { updateUserInFirestore } from '../services/userService'; // Import your update function
import './EditUserModal.css';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    smsNotification: false,
    emailNotification: false,
    isBlocked: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        smsNotification: user.smsNotification || false,
        emailNotification: user.emailNotification || false,
        isBlocked: user.isBlocked || false,
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
      onUserUpdated({ ...user, ...formData }); // Call the onUserUpdated function
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.'); // Keep the existing error handling
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="modal-overlay" 
        role="button" 
        tabIndex={0} 
        onClick={onClose} 
        onKeyDown={handleKeyDown} 
        aria-label="Close modal"
      />
      <div className="edit-user-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <h2 id="modal-title">Edit User</h2>
        <div className="modal-content">
          <label>
            First Name:
            <input 
              type="text" 
              name="firstName" // Adding name attribute for handling
              value={formData.firstName} 
              onChange={handleChange} 
              required // Making it required for better UX
            />
          </label>
          <label>
            Last Name:
            <input 
              type="text" 
              name="lastName" // Adding name attribute for handling
              value={formData.lastName} 
              onChange={handleChange} 
              required // Making it required for better UX
            />
          </label>
          <label>
            Email:
            <input 
              type="email" 
              name="email" // Adding name attribute for handling
              value={formData.email} 
              onChange={handleChange} 
              required // Making it required for better UX
            />
          </label>
          <label>
            Phone:
            <input 
              type="text" 
              name="phone" // Adding name attribute for handling
              value={formData.phone} 
              onChange={handleChange} 
            />
          </label>
          <label>
            SMS Notifications:
            <input 
              type="checkbox" 
              name="smsNotification" // Adding name attribute for handling
              checked={formData.smsNotification} 
              onChange={handleChange} 
            />
          </label>
          <label>
            Email Notifications:
            <input 
              type="checkbox" 
              name="emailNotification" // Adding name attribute for handling
              checked={formData.emailNotification} 
              onChange={handleChange} 
            />
          </label>
          <label>
            Is Blocked:
            <input 
              type="checkbox" 
              name="isBlocked" // Adding name attribute for handling
              checked={formData.isBlocked} 
              onChange={handleChange} 
            />
          </label>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </>
  );
};

export default EditUserModal;
