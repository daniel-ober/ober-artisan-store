import React, { useState } from 'react';
import { addUserToFirestore } from '../services/userService'; // You'll need to implement this
import './Modal.css';

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [error, setError] = useState(null);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addUserToFirestore(user); // Assuming this service adds the user
      onUserAdded(); // Refresh the user list
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Error adding user: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New User</h3>
        <form onSubmit={handleAddUser}>
          <input 
            type="text" 
            placeholder="First Name" 
            value={user.firstName} 
            onChange={(e) => setUser({ ...user, firstName: e.target.value })} 
            required
          />
          <input 
            type="text" 
            placeholder="Last Name" 
            value={user.lastName} 
            onChange={(e) => setUser({ ...user, lastName: e.target.value })} 
            required
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={user.email} 
            onChange={(e) => setUser({ ...user, email: e.target.value })} 
            required
          />
          <input 
            type="text" 
            placeholder="Phone" 
            value={user.phone} 
            onChange={(e) => setUser({ ...user, phone: e.target.value })} 
          />
          <button type="submit">Add User</button>
        </form>
        {error && <p className="error">{error}</p>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddUserModal;
