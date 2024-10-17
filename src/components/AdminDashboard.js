import React, { useState } from 'react';
import { FaUsers, FaTags, FaShoppingCart } from 'react-icons/fa';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState(null); // State to track active component

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageProducts':
        return <ManageProducts />;
      case 'manageUsers':
        return <ManageUsers />;
      case 'manageOrders':
        return <ManageOrders />;
      default:
        return <div>Select a management option above.</div>;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-cards">
        <div
          className="admin-card"
          onClick={() => setActiveComponent('manageUsers')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') setActiveComponent('manageUsers');
          }}
        >
          <div className="admin-card-icon"><FaUsers /></div>
          <h3>Manage Users</h3>
        </div>
        <div
          className="admin-card"
          onClick={() => setActiveComponent('manageProducts')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') setActiveComponent('manageProducts');
          }}
        >
          <div className="admin-card-icon"><FaTags /></div>
          <h3>Manage Products</h3>
        </div>
        <div
          className="admin-card"
          onClick={() => setActiveComponent('manageOrders')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') setActiveComponent('manageOrders');
          }}
        >
          <div className="admin-card-icon"><FaShoppingCart /></div>
          <h3>Manage Orders</h3>
        </div>
      </div>
      <div className="component-container">
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
