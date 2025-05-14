import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import {
  FaUsers,
  FaDrum,
  FaShoppingCart,
  FaBox,
  FaHammer,
  FaEnvelope,
  FaCog,
  FaImages,
  FaStar,
  FaRegChartBar,
  FaFlask,
} from 'react-icons/fa';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import ManageInquiries from './ManageInquiries';
import ManageGallery from './ManageGallery';
import SiteSettings from './SiteSettings';
import ManageCarts from './ManageCarts';
import ManageProjects from './ManageProjects';
import ManageElixirBatches from './ManageElixirBatches';
import ManageSoundlegendRequests from './ManageSoundlegendRequests';
import AdminOverview from './AdminOverview';
import { db } from '../firebaseConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState('overview');
  const [notifications, setNotifications] = useState({});
  const [secondaryNotifications, setSecondaryNotifications] = useState({});
  const [tertiaryNotifications, setTertiaryNotifications] = useState({});

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snapshot) => {
      const counts = { new: 0, inProgress: 0, completed: 0 };
      snapshot.forEach((doc) => {
        const status = doc.data().overviewStatus;
        if (status === 'new') counts.new++;
        else if (status === 'inProgress') counts.inProgress++;
        else if (status === 'completed') counts.completed++;
      });
      setNotifications((prev) => ({ ...prev, manageOrders: counts.new }));
      setSecondaryNotifications((prev) => ({ ...prev, manageOrders: counts.inProgress }));
      setTertiaryNotifications((prev) => ({ ...prev, manageOrders: counts.completed }));
    });

    const unsubInquiries = onSnapshot(query(collection(db, 'inquiries')), (snapshot) => {
      const counts = { new: 0, inProgress: 0, completed: 0 };
      snapshot.forEach((doc) => {
        const status = doc.data().overviewStatus;
        if (status === 'new') counts.new++;
        else if (status === 'inProgress') counts.inProgress++;
        else if (status === 'completed') counts.completed++;
      });
      setNotifications((prev) => ({ ...prev, manageInquiries: counts.new }));
      setSecondaryNotifications((prev) => ({ ...prev, manageInquiries: counts.inProgress }));
      setTertiaryNotifications((prev) => ({ ...prev, manageInquiries: counts.completed }));
    });

    const unsubSoundlegend = onSnapshot(query(collection(db, 'soundlegend_submissions')), (snapshot) => {
      const counts = { new: 0, inProgress: 0, completed: 0 };
      snapshot.forEach((doc) => {
        const raw = doc.data().status || doc.data().overviewStatus || '';
        const status = raw.toLowerCase();
    
        if (status === 'new') counts.new++;
        else if (status === 'prospecting' || status === 'inprogress') counts.inProgress++;
        else if (status.includes('closed') || status === 'completed') counts.completed++;
      });
      setNotifications((prev) => ({ ...prev, manageSoundlegendRequests: counts.new }));
      setSecondaryNotifications((prev) => ({ ...prev, manageSoundlegendRequests: counts.inProgress }));
      setTertiaryNotifications((prev) => ({ ...prev, manageSoundlegendRequests: counts.completed }));
    });

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubSoundlegend();
    };
  }, []);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageOrders': return <ManageOrders />;
      case 'manageInquiries': return <ManageInquiries />;
      case 'manageProducts': return <ManageProducts />;
      case 'manageProjects': return <ManageProjects />;
      case 'manageUsers': return <ManageUsers />;
      case 'manageCarts': return <ManageCarts />;
      case 'manageGallery': return <ManageGallery />;
      case 'manageElixirBatches': return <ManageElixirBatches />;
      case 'siteSettings': return <SiteSettings />;
      case 'manageSoundlegendRequests': return <ManageSoundlegendRequests />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-cards">
        {[
          { name: 'Overview', icon: FaRegChartBar, stateKey: 'overview' },
          { name: 'Manage Orders', icon: FaBox, stateKey: 'manageOrders' },
          { name: 'SL Submissions', icon: FaStar, stateKey: 'manageSoundlegendRequests' },
          { name: 'Support Inquiries', icon: FaEnvelope, stateKey: 'manageInquiries' },
          { name: 'Manage Projects', icon: FaHammer, stateKey: 'manageProjects' },
          { name: 'Manage Products', icon: FaDrum, stateKey: 'manageProducts' },
          { name: 'Manage Users', icon: FaUsers, stateKey: 'manageUsers' },
          { name: 'Manage Carts', icon: FaShoppingCart, stateKey: 'manageCarts' },
          { name: 'Manage Gallery', icon: FaImages, stateKey: 'manageGallery' },
          { name: 'Elixir Batches', icon: FaFlask, stateKey: 'manageElixirBatches' },
          { name: 'Site Settings', icon: FaCog, stateKey: 'siteSettings' },
        ].map(({ name, icon: Icon, stateKey }) => (
          <div
            key={stateKey}
            className="admin-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveComponent(stateKey)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveComponent(stateKey)}
          >
            <div className="admin-card-icon">
              <Icon />
              {(notifications[stateKey] > 0 ||
                secondaryNotifications[stateKey] > 0 ||
                tertiaryNotifications[stateKey] > 0) && (
                <div className="badge-wrapper">
                  {notifications[stateKey] > 0 && (
                    <span className="notification-badge">
                      {notifications[stateKey]}
                    </span>
                  )}
                  {secondaryNotifications[stateKey] > 0 && (
                    <span className="notification-badge-secondary">
                      {secondaryNotifications[stateKey]}
                    </span>
                  )}
                  {tertiaryNotifications[stateKey] > 0 && (
                    <span className="notification-badge-tertiary">
                      {tertiaryNotifications[stateKey]}
                    </span>
                  )}
                </div>
              )}
            </div>
            <h3 style={{ whiteSpace: 'nowrap' }}>{name}</h3>
          </div>
        ))}
      </div>
      <div className="component-container">{renderActiveComponent()}</div>
    </div>
  );
};

export default AdminDashboard;