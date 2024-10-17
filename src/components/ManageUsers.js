import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUserFromFirestore, updateUserStatus } from '../services/userService';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { auth } from '../firebaseConfig';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 

  useEffect(() => {
    const getUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Error fetching users: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const user = auth.currentUser;
    if (user) {
      getUsers();
    } else {
      setError('User is not authenticated. Please log in.');
      setLoading(false);
    }
  }, []);

  const handleDelete = async (userId) => {
    try {
      await deleteUserFromFirestore(userId);
      setUsers((prevUsers) => prevUsers.filter(user => user.uid !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user: ' + error.message);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Error updating user status: ' + error.message);
    }
  };

  const openEditModal = (userId) => {
    setEditUserId(userId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditUserId(null);
    setIsEditModalOpen(false);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true); 
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false); 
  };

  const handleUserUpdated = () => {
    const getUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error refreshing user list:', error);
      }
    };
    getUsers();
  };

  const handleUserAdded = (newUser) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
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
      <button className="add-new-btn" onClick={openAddModal}>Add New User</button>
      <table className="manage-users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.uid}>
                <td>{user.email}</td>
                <td>
                  <select 
                    value={user.status} 
                    onChange={(e) => handleStatusChange(user.uid, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(user.uid)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(user.uid)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isEditModalOpen && (
        <EditUserModal 
          userId={editUserId}
          onClose={closeEditModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
      {isAddModalOpen && (
        <AddUserModal
          onClose={closeAddModal}
          onUserAdded={handleUserAdded}
        />
      )}
    </div>
  );
};

export default ManageUsers;
