import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
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
  FaExclamationTriangle,
} from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
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
import AdminRiskNotifications from './AdminRiskNotifications';
import { db } from '../firebaseConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState('overview');
  const [notifications, setNotifications] = useState({});
  const [secondaryNotifications, setSecondaryNotifications] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const logClaims = (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          console.log('Custom Claims:', idTokenResult.claims);
        });
      }
    };
    logClaims(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      logClaims(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders')),
      (snapshot) => {
        const counts = { new: 0, inProgress: 0 };
        snapshot.forEach((doc) => {
          const status = doc.data().overviewStatus;
          if (status === 'new') counts.new++;
          else if (status === 'inProgress') counts.inProgress++;
        });
        setNotifications((prev) => ({ ...prev, manageOrders: counts.new }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageOrders: counts.inProgress,
        }));
      }
    );

    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries')),
      (snapshot) => {
        const counts = { new: 0, inProgress: 0 };
        snapshot.forEach((doc) => {
          const raw = doc.data().overviewStatus || doc.data().status || '';
          const status = raw.toLowerCase();
          if (status === 'new') counts.new++;
          else if (status === 'inprogress') counts.inProgress++;
        });
        setNotifications((prev) => ({ ...prev, manageInquiries: counts.new }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageInquiries: counts.inProgress,
        }));
      }
    );

    const unsubSoundlegend = onSnapshot(
      query(collection(db, 'soundlegend_submissions')),
      (snapshot) => {
        const counts = { new: 0, inProgress: 0 };
        snapshot.forEach((doc) => {
          const raw = doc.data().status || doc.data().overviewStatus || '';
          const status = raw.toLowerCase();
          if (status === 'new') counts.new++;
          else if (status === 'prospecting' || status === 'inprogress')
            counts.inProgress++;
        });
        setNotifications((prev) => ({
          ...prev,
          manageSoundlegendRequests: counts.new,
        }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageSoundlegendRequests: counts.inProgress,
        }));
      }
    );

    const unsubRisk = onSnapshot(
      query(collection(db, 'risk_notifications')),
      (snapshot) => {
        let high = 0;
        let medium = 0;

        snapshot.forEach((doc) => {
          const status = (doc.data().status || '').toLowerCase().trim();
          const score = doc.data().score || 0;

          if (
            status === 'new' ||
            status === 'in review' ||
            status === 'in progress'
          ) {
            if (score >= 0.85) high++;
            else if (score >= 0.5) medium++;
          }
        });

        setNotifications((prev) => ({ ...prev, manageRiskAlerts: high }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageRiskAlerts: medium,
        }));
      }
    );

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubSoundlegend();
      unsubRisk();
    };
  }, []);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageOrders':
        return <ManageOrders />;
      case 'manageInquiries':
        return <ManageInquiries />;
      case 'manageProducts':
        return <ManageProducts />;
      case 'manageProjects':
        return <ManageProjects />;
      case 'manageUsers':
        return <ManageUsers />;
      case 'manageCarts':
        return <ManageCarts />;
      case 'manageGallery':
        return <ManageGallery />;
      case 'manageElixirBatches':
        return <ManageElixirBatches />;
      case 'siteSettings':
        return <SiteSettings />;
      case 'manageSoundlegendRequests':
        return <ManageSoundlegendRequests />;
      case 'manageRiskAlerts':
        return <AdminRiskNotifications />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-cards">
        {[
          { name: 'Overview', icon: FaRegChartBar, stateKey: 'overview' },
          { name: 'Manage Orders', icon: FaBox, stateKey: 'manageOrders' },
          {
            name: 'SL Submissions',
            icon: FaStar,
            stateKey: 'manageSoundlegendRequests',
          },
          {
            name: 'Support Inquiries',
            icon: FaEnvelope,
            stateKey: 'manageInquiries',
          },
          {
            name: 'Manage Projects',
            icon: FaHammer,
            stateKey: 'manageProjects',
          },
          { name: 'Manage Products', icon: FaDrum, stateKey: 'manageProducts' },
          { name: 'Manage Users', icon: FaUsers, stateKey: 'manageUsers' },
          {
            name: 'Manage Carts',
            icon: FaShoppingCart,
            stateKey: 'manageCarts',
          },
          { name: 'Manage Gallery', icon: FaImages, stateKey: 'manageGallery' },
          {
            name: 'Elixir Batches',
            icon: FaFlask,
            stateKey: 'manageElixirBatches',
          },
          {
            name: 'Risk Alerts',
            icon: FaExclamationTriangle,
            stateKey: 'manageRiskAlerts',
          },
          { name: 'Site Settings', icon: FaCog, stateKey: 'siteSettings' },
        ].map(({ name, icon: Icon, stateKey }) => (
          <div
            key={stateKey}
            className={`admin-card ${stateKey === 'overview' ? 'full-width-mobile' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setActiveComponent(stateKey)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveComponent(stateKey)}
          >
            <div className="admin-card-icon">
              <Icon />
              {(notifications[stateKey] > 0 ||
                secondaryNotifications[stateKey] > 0) && (
                <div className="badge-wrapper">
                  {stateKey === 'manageRiskAlerts' ? (
                    <>
                      {notifications[stateKey] > 0 && (
                        <span className="notification-badge-high">
                          {notifications[stateKey]}
                        </span>
                      )}
                      {secondaryNotifications[stateKey] > 0 && (
                        <span className="notification-badge-medium">
                          {secondaryNotifications[stateKey]}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
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
                    </>
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
