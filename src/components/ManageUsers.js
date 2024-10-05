import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUserFromFirestore } from '../services/userService';
import EditUserModal from './EditUserModal';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Error fetching users: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  const handleDelete = async (userId) => {
    try {
      await deleteUserFromFirestore(userId);
      setUsers((prevUsers) => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user: ' + error.message);
    }
  };

  const openEditModal = (userId) => {
    setEditUserId(userId);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditUserId(null);
    setIsModalOpen(false);
  };

  const handleUserUpdated = () => {
    // Refresh the user list after an update
    const getUsers = async () => {
      const usersData = await fetchUsers();
      setUsers(usersData);
    };
    getUsers();
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="manage-users-container">
      <h1>Manage Users</h1>
      <table className="manage-users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Phone</th>
            <th>Email Notification</th>
            <th>SMS Notification</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.phone}</td>
                <td>{user.emailNotification ? 'Yes' : 'No'}</td>
                <td>{user.smsNotification ? 'Yes' : 'No'}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(user.id)}>Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isModalOpen && (
        <EditUserModal 
          userId={editUserId}
          onClose={closeEditModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default ManageUsers;
