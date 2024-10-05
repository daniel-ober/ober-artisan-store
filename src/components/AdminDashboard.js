import React, { useState } from 'react';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import './AdminDashboard.css'; // Ensure this file exists for styling

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
      <div className="admin-cards">
        <div
          className="admin-card"
          onClick={() => setActiveComponent('manageProducts')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') setActiveComponent('manageProducts');
          }}
        >
          <h3>Manage Products</h3>
        </div>
        <div
          className="admin-card"
          onClick={() => setActiveComponent('manageUsers')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') setActiveComponent('manageUsers');
          }}
        >
          <h3>Manage Users</h3>
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
