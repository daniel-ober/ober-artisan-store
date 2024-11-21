import React, { useEffect, useState } from 'react';
import { fetchUsers } from '../services/userService';
import './ManageUsers.css';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getUsers = async () => {
            try {
                setLoading(true);
                const fetchedUsers = await fetchUsers();
                setUsers(fetchedUsers || []); // Ensure default empty array if no data
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        getUsers();
    }, []);

    if (loading) return <p>Loading users...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="manage-users-container">
            <h1>Manage Users</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) =>
                        user && user.email ? (
                            <tr key={user.id}>
                                <td>{user.name || 'N/A'}</td>
                                <td>{user.email}</td>
                                <td>{user.role || 'User'}</td>
                            </tr>
                        ) : (
                            <tr key={Math.random()}>
                                <td colSpan="3">Invalid User Data</td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ManageUsers;
