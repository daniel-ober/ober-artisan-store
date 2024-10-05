import React, { useEffect, useState } from 'react';
import { fetchUserDoc, updateUserInFirestore, deleteUserFromFirestore } from '../services/userService';

const EditUserModal = ({ userId, onClose, onUserUpdated }) => {
  const [user, setUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    emailNotification: false,
    smsNotification: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await fetchUserDoc(userId);
        setUser(userData);
      } catch (error) {
        setError('Error fetching user: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserInFirestore(userId, user);
      onUserUpdated();
      onClose();
    } catch (error) {
      setError('Error updating user: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserFromFirestore(userId);
      onUserUpdated();
      onClose();
    } catch (error) {
      setError('Error deleting user: ' + error.message);
    }
  };

  if (loading) {
    return <div>Loading user details...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            name="email" 
            value={user.email} 
            onChange={(e) => setUser({ ...user, email: e.target.value })} 
            placeholder="Email" 
            required 
          />
          <input 
            type="text" 
            name="firstName" 
            value={user.firstName} 
            onChange={(e) => setUser({ ...user, firstName: e.target.value })} 
            placeholder="First Name" 
            required 
          />
          <input 
            type="text" 
            name="lastName" 
            value={user.lastName} 
            onChange={(e) => setUser({ ...user, lastName: e.target.value })} 
            placeholder="Last Name" 
            required 
          />
          <input 
            type="text" 
            name="phone" 
            value={user.phone} 
            onChange={(e) => setUser({ ...user, phone: e.target.value })} 
            placeholder="Phone" 
            required 
          />
          <label>
            Email Notifications:
            <input 
              type="checkbox" 
              checked={user.emailNotification} 
              onChange={(e) => setUser({ ...user, emailNotification: e.target.checked })} 
            />
          </label>
          <label>
            SMS Notifications:
            <input 
              type="checkbox" 
              checked={user.smsNotification} 
              onChange={(e) => setUser({ ...user, smsNotification: e.target.checked })} 
            />
          </label>
          <button type="submit">Update User</button>
          <button type="button" onClick={handleDelete}>Delete User</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
