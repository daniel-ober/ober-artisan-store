import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            // phone: data.phone || 'N/A',
            // status: data.status || 'active',
          };
        });

        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter((user) => user.id !== userId));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleAddUserClose = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div className="manage-users">
      <div className="manage-users-header">Manage Users</div>
      <button className="add-btn" onClick={handleAddUser}>
        Add User
      </button>
      <input
        type="text"
        placeholder="Search by email or last name"
        value={searchQuery}
        onChange={handleSearch}
        className="search-bar"
      />
      <div className="responsive-table-container">
        <table className="manage-users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Actions</th>
              {/* <th>First Name</th> */}
              {/* <th>Last Name</th> */}
              {/* <th className="hidden-column">Phone</th> */}
              {/* <th className="hidden-column">Status</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  {/* <td>{user.firstName}</td> */}
                  {/* <td>{user.lastName}</td> */}
                  {/* <td className="hidden-column">{user.phone}</td> */}
                  {/* <td className="hidden-column">{user.status}</td> */}
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewUser(user)}
                    >
                      View
                    </button>
                    {/* <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button> */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUserUpdated={(updatedUser) => {
            const updatedUsers = users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            );
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddUserModal
          onClose={handleAddUserClose}
          onUserAdded={(newUser) => {
            setUsers([newUser, ...users]);
            setFilteredUsers([newUser, ...filteredUsers]);
          }}
        />
      )}
    </div>
  );
};

export default ManageUsers;