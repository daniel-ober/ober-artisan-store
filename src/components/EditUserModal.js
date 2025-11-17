// src/components/EditUserModal.js
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EditUserModal.css';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSoundlegend, setIsSoundlegend] = useState(!!user?.isSoundlegend);
  const [error, setError] = useState('');

  const isAdmin = !!user?.isAdmin;

  const handleSave = async () => {
    try {
      if (!user?.id) {
        setError('Missing user id.');
        return;
      }

      const userDocRef = doc(db, 'users', user.id);

      // 🚫 DO NOT update isAdmin from here.
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        email,
        phone,
        isSoundlegend,
      });

      onUserUpdated &&
        onUserUpdated({
          ...user,
          firstName,
          lastName,
          email,
          phone,
          isSoundlegend,
          // keep whatever isAdmin currently is on the object
          isAdmin,
        });

      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please check your permissions.');
    }
  };

  return (
    <div className="edit-user-modal" role="dialog" aria-modal="true">
      <div className="edit-modal-content">
        <div className="edit-modal-header">
          <h2>Edit User</h2>
          <button
            className="edit-close-btn"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {isAdmin && (
          <div className="edit-banner edit-banner--warn">
            <strong>Admin account:</strong> Admin privileges are read-only in
            this UI.
            <br />
            To change admin status, update the Firestore user document and
            custom claims directly.
          </div>
        )}

        {error && (
          <div className="edit-banner edit-banner--error" role="alert">
            {error}
          </div>
        )}

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

        {/* Admin access is shown as read-only text, not editable */}
        <div className="form-group">
          <label>Admin Access</label>
          <div className="admin-readonly-pill">
            {isAdmin ? 'Admin (managed via Firestore)' : 'No'}
          </div>
        </div>

        {/* ❗ Future hook:
            If we want to attach loose projects/orders here, we can add a
            simple read-only summary of:
              - Orders linked to this user
              - Projects linked to this user
            and a "Manage" button that jumps to ManageOrders/ManageProjects.
            That keeps this modal light and avoids risky schema changes. */}

        <div className="edit-modal-actions">
          <button type="button" className="save-btn" onClick={handleSave}>
            Save
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;