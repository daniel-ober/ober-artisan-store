import React, { useState } from 'react';
import {
  FaUsers,
  FaTags,
  FaShoppingCart,
  FaChartLine,
  FaEnvelope,
  FaCog,
  FaImages
} from 'react-icons/fa';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import SalesPipeline from './SalesPipeline';
import ManageInquiries from './ManageInquiries';
import ManageGallery from './ManageGallery';  // Import ManageGallery component
import SiteSettings from './SiteSettings';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState(null);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageProducts':
        return <ManageProducts />;
      case 'manageUsers':
        return <ManageUsers />;
      case 'manageOrders':
        return <ManageOrders />;
      case 'salesPipeline':
        return <SalesPipeline />;
      case 'manageInquiries':
        return <ManageInquiries />;
      case 'manageGallery':
        return <ManageGallery />;  // Render ManageGallery when selected
      case 'siteSettings':
        return <SiteSettings />;
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
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('manageUsers')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('manageUsers')}
        >
          <div className="admin-card-icon"><FaUsers /></div>
          <h3>Manage Users</h3>
        </div>

        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('manageProducts')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('manageProducts')}
        >
          <div className="admin-card-icon"><FaTags /></div>
          <h3>Manage Products</h3>
        </div>

        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('manageOrders')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('manageOrders')}
        >
          <div className="admin-card-icon"><FaShoppingCart /></div>
          <h3>Manage Orders</h3>
        </div>

        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('salesPipeline')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('salesPipeline')}
        >
          <div className="admin-card-icon"><FaChartLine /></div>
          <h3>Sales Pipeline</h3>
        </div>

        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('manageInquiries')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('manageInquiries')}
        >
          <div className="admin-card-icon"><FaEnvelope /></div>
          <h3>Manage Inquiries</h3>
        </div>

        {/* New Manage Gallery Card */}
        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('manageGallery')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('manageGallery')}
        >
          <div className="admin-card-icon"><FaImages /></div>
          <h3>Manage Gallery</h3>
        </div>

        <div
          className="admin-card"
          role="button"
          tabIndex={0}
          onClick={() => setActiveComponent('siteSettings')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveComponent('siteSettings')}
        >
          <div className="admin-card-icon"><FaCog /></div>
          <h3>Site Settings</h3>
        </div>
      </div>
      <div className="component-container">
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
