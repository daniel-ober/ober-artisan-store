import React, { useState, useEffect } from 'react';
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
} from 'react-icons/fa';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import ManageInquiries from './ManageInquiries';
import ManageGallery from './ManageGallery';
import SiteSettings from './SiteSettings';
import ManageCarts from './ManageCarts';
import ManageProjects from './ManageProjects';
import ManageSoundlegendRequests from './ManageSoundlegendRequests';
import AdminOverview from './AdminOverview';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState('overview');
  const [notifications, setNotifications] = useState({});
  const [secondaryNotifications, setSecondaryNotifications] = useState({});
  const [tertiaryNotifications, setTertiaryNotifications] = useState({});

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [
          productsOutOfStock,
          newOrders,
          inProgressOrders,
          newInquiries,
          inProgressInquiries,
          newSoundlegend,
          inProgressSoundlegend,
          completedInquiries,
          completedSoundlegend
        ] = await Promise.all([
          getOutOfStockProductsCount(),
          getNewOrdersCount(),
          getInProgressOrdersCount(),
          getNewInquiriesCount(),
          getInProgressInquiriesCount(),
          getNewSoundlegendRequestsCount(),
          getInProgressSoundlegendCount(),
          getCompletedInquiriesCount(),
          getCompletedSoundlegendCount()
        ]);

        setNotifications({
          manageProducts: productsOutOfStock,
          manageOrders: newOrders,
          manageInquiries: newInquiries,
          manageSoundlegendRequests: newSoundlegend
        });

        setSecondaryNotifications({
          manageOrders: inProgressOrders,
          manageInquiries: inProgressInquiries,
          manageSoundlegendRequests: inProgressSoundlegend
        });

        setTertiaryNotifications({
          manageInquiries: completedInquiries,
          manageSoundlegendRequests: completedSoundlegend
        });
      } catch (error) {
        console.error('❌ Error fetching notifications:', error.message);
      }
    };

    fetchNotifications();
  }, []);

  const getOutOfStockProductsCount = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`);
      const data = await response.json();
      return data.products.filter((p) => p.currentQuantity === 0).length;
    } catch (error) {
      return 0;
    }
  };

  const getNewOrdersCount = async () => {
    const snapshot = await getDocs(collection(db, 'orders'));
    return snapshot.docs.filter(doc => (doc.data().items || []).some(item => item.status === 'Order Successful')).length;
  };

  const getInProgressOrdersCount = async () => {
    const snapshot = await getDocs(collection(db, 'orders'));
    return snapshot.docs.filter(doc => {
      const statuses = (doc.data().items || []).map(item => item.status);
      return statuses.some(status =>
        ['Preparing', 'Packaged', 'Ready for Shipment', 'Back Ordered'].includes(status)
      );
    }).length;
  };

  const getNewInquiriesCount = async () => {
    const snapshot = await getDocs(collection(db, 'inquiries'));
    return snapshot.docs.filter(doc => doc.data().status?.trim().toLowerCase() === 'new').length;
  };

  const getInProgressInquiriesCount = async () => {
    const snapshot = await getDocs(collection(db, 'inquiries'));
    return snapshot.docs.filter(doc => {
      const status = doc.data().status?.trim().toLowerCase();
      return ['support - in progress', 'sales - prospecting'].includes(status);
    }).length;
  };

  const getCompletedInquiriesCount = async () => {
    const snapshot = await getDocs(collection(db, 'inquiries'));
    return snapshot.docs.filter(doc => {
      const status = doc.data().status?.trim().toLowerCase();
      return ['support - closed', 'sales - closed won', 'sales - closed lost'].includes(status);
    }).length;
  };

  const getNewSoundlegendRequestsCount = async () => {
    const snapshot = await getDocs(collection(db, 'soundlegend_submissions'));
    return snapshot.docs.filter(doc => doc.data().status === 'New').length;
  };

  const getInProgressSoundlegendCount = async () => {
    const snapshot = await getDocs(collection(db, 'soundlegend_submissions'));
    return snapshot.docs.filter(doc =>
      ['Prospecting', 'Consulting', 'Design', 'Building'].includes(doc.data().status)
    ).length;
  };

  const getCompletedSoundlegendCount = async () => {
    const snapshot = await getDocs(collection(db, 'soundlegend_submissions'));
    return snapshot.docs.filter(doc =>
      ['Closed - Won', 'Closed - Lost', 'Closed - No Response', 'Closed - Incomplete Form'].includes(doc.data().status)
    ).length;
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageOrders': return <ManageOrders />;
      case 'manageInquiries': return <ManageInquiries />;
      case 'manageProducts': return <ManageProducts />;
      case 'manageProjects': return <ManageProjects />;
      case 'manageUsers': return <ManageUsers />;
      case 'manageCarts': return <ManageCarts />;
      case 'manageGallery': return <ManageGallery />;
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
          { name: 'Site Settings', icon: FaCog, stateKey: 'siteSettings' }
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