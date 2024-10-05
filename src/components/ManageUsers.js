import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUserFromFirestore } from '../services/userService'; 
import './ManageUsers.css';
import EditUserModal from './EditUserModal';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (error) {
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
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      setError('Error deleting user: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers((prevUsers) => 
      prevUsers.map((user) => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setIsModalOpen(false);
  };

  const handleAddNewUser = () => {
    alert('Open Add New User modal');
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
      <button className="add-new-btn" onClick={handleAddNewUser}>
        Add New User
      </button>
      <table className="manage-users-table">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>SMS Notifications</th>
            <th>Email Notifications</th>
            <th>Is Blocked?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>{user.smsNotification ? 'Yes' : 'No'}</td>
                <td>{user.emailNotification ? 'Yes' : 'No'}</td>
                <td>{user.isBlocked ? 'Yes' : 'No'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => handleEdit(user)}>Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)} 
          onUserUpdated={handleUserUpdated} 
        />
      )}
    </div>
  );
};

export default ManageUsers;
