import React, { useState, useEffect } from 'react';
import { updateUserInFirestore } from '../services/userService'; // Import your update function
import './EditUserModal.css';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsNotification, setSmsNotification] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setPhone(user.phone || '');
      setSmsNotification(user.smsNotification);
      setEmailNotification(user.emailNotification);
      setIsBlocked(user.isBlocked);
    }
  }, [user]);

  const handleSave = async () => {
    const updatedUserData = {
      firstName,
      lastName,
      email,
      phone,
      smsNotification,
      emailNotification,
      isBlocked,
    };

    try {
      await updateUserInFirestore(user.id, updatedUserData);
      onUserUpdated({ ...user, ...updatedUserData }); // Call the onUserUpdated function
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
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
      /> {/* Overlay for closing the modal */}
      <div className="edit-user-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <h2 id="modal-title">Edit User</h2>
        <div className="modal-content">
          <label>
            First Name:
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
            />
          </label>
          <label>
            Last Name:
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
            />
          </label>
          <label>
            Email:
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </label>
          <label>
            Phone:
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </label>
          <label>
            SMS Notifications:
            <input 
              type="checkbox" 
              checked={smsNotification} 
              onChange={(e) => setSmsNotification(e.target.checked)} 
            />
          </label>
          <label>
            Email Notifications:
            <input 
              type="checkbox" 
              checked={emailNotification} 
              onChange={(e) => setEmailNotification(e.target.checked)} 
            />
          </label>
          <label>
            Is Blocked:
            <input 
              type="checkbox" 
              checked={isBlocked} 
              onChange={(e) => setIsBlocked(e.target.checked)} 
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
