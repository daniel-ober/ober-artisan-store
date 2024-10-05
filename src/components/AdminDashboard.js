import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css'; // Style for AdminDashboard

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-header">Admin Dashboard</h1>
      <div className="dashboard-links">
        <ul className="admin-link-list">
          <li>
            <Link to="/admin/users" className="admin-link">Manage Users</Link>
          </li>
          <li>
            <Link to="/admin/products" className="admin-link">Manage Products</Link>
          </li>
          <li>
            <Link to="/admin/orders" className="admin-link">Manage Orders</Link>
          </li>
          <li>
            <Link to="/admin/settings" className="admin-link">Site Settings</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
