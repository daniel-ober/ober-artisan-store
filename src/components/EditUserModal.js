import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isAdmin, setIsAdmin] = useState(!!user?.isAdmin);          
  const [isSoundlegend, setIsSoundlegend] = useState(!!user?.isSoundlegend); 
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        email,
        phone,
        isAdmin,           
        isSoundlegend,    
      });
      onUserUpdated({ ...user, firstName, lastName, email, phone, isAdmin, isSoundlegend });
      onClose();
    } catch (error) {
      console.error('Error updating user:', error.message);
      setError('Failed to update user. Please check your permissions.');
    }
  };

  return (
    <div className="edit-user-modal">
      <div className="modal-content">
        <h2>Edit User</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {/* New Fields Below */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={() => setIsAdmin((prev) => !prev)}
            />
            Admin Access
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isSoundlegend}
              onChange={() => setIsSoundlegend((prev) => !prev)}
            />
            SoundLegend Access
          </label>
        </div>
        <button type="submit" onClick={handleSave}>
          Save
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditUserModal;