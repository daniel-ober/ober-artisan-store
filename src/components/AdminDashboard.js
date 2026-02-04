// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { backfillOverviewStatus } from '../utils/backfillOverviewStatus';
import {
  FaUsers,
  FaDrum,
  FaShoppingCart,
  FaBox,
  FaHammer,
  FaHeadset,
  FaCog,
  FaGem,
  FaStar,
  FaRegChartBar,
  FaFlask,
  FaExclamationTriangle,
  FaLink,
} from 'react-icons/fa';
import { getAuth } from 'firebase/auth';

import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import ManageInquiries from './ManageInquiries';
import SiteSettings from './SiteSettings';
import ManageCarts from './ManageCarts';
import ManageProjects from './ManageProjects';
import ManageElixirBatches from './ManageElixirBatches';
import ManageSoundlegendRequests from './ManageSoundlegendRequests';
import ManageEndorsementApplications from './ManageEndorsementApplications';
import AdminOverview from './AdminOverview';
import AdminRiskNotifications from './AdminRiskNotifications';
import ArtisanTools from './ArtisanTools';
import SoundLegendVaultCreator from './SoundLegendVaultCreator';
import SoundLegendVaultAdmin from './SoundLegendVaultAdmin';
import AttachUserResourcesTool from './AttachUserResourcesTool';

import { db } from '../firebaseConfig';
import './AdminDashboard.css';

// ✅ normalize overviewStatus so badges don’t drift ("inprogress" vs "inProgress", etc.)
const normalizeOverviewStatus = (raw) => {
  const v = (raw || '').toString().trim().toLowerCase();
  if (!v) return null;

  if (v === 'new') return 'new';
  if (v === 'inprogress' || v === 'in progress') return 'inProgress';
  if (v === 'completed' || v === 'complete' || v === 'done') return 'completed';

  return null;
};

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState('overview');

  const [notifications, setNotifications] = useState({});
  const [secondaryNotifications, setSecondaryNotifications] = useState({});
  const [overviewBadgeCounts, setOverviewBadgeCounts] = useState({
    green: 0,
    yellow: 0,
  });

  // Per-collection badge source of truth for overview
  const [badgeSources, setBadgeSources] = useState({
    orders: { green: 0, yellow: 0 },
    inquiries: { green: 0, yellow: 0 },
    soundlegend: { green: 0, yellow: 0 },
    risk: { green: 0, yellow: 0 },
    endorsements: { green: 0, yellow: 0 },
  });

  /* Ensure legacy docs have overviewStatus hydrated */
  useEffect(() => {
    backfillOverviewStatus();
  }, []);

  /* Just sanity-logging auth claims */
  useEffect(() => {
    const auth = getAuth();
    const logClaims = (user) => {
      if (user) {
        user.getIdTokenResult().then(() => {
          // You could log or inspect claims here if needed
        });
      }
    };
    logClaims(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged((user) => logClaims(user));
    return () => unsubscribe();
  }, []);

  /* Live badge counts from Firestore collections */
  useEffect(() => {
    // Orders
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders')),
      (snapshot) => {
        let green = 0;
        let yellow = 0;

        snapshot.forEach((docSnap) => {
          const normalized = normalizeOverviewStatus(docSnap.data().overviewStatus);
          if (normalized === 'new') green++;
          else if (normalized === 'inProgress') yellow++;
        });

        // ✅ keep per-card keys consistent with card stateKey
        setNotifications((prev) => ({ ...prev, manageOrders: green }));
        setSecondaryNotifications((prev) => ({ ...prev, manageOrders: yellow }));

        setBadgeSources((prev) => ({
          ...prev,
          orders: { green, yellow },
        }));
      }
    );

    // Support Inquiries
    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries')),
      (snapshot) => {
        let green = 0;
        let yellow = 0;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const normalized =
            normalizeOverviewStatus(d.overviewStatus) ||
            normalizeOverviewStatus(d.status) ||
            (d.status || '').toString().trim().toLowerCase();

          // inquiries might still have textual statuses—fall back to string checks
          if (normalized === 'new') green++;
          else if (normalized === 'inProgress' || normalized === 'inprogress' || normalized === 'in progress')
            yellow++;
          else if (typeof normalized === 'string' && normalized.includes('in progress')) yellow++;
        });

        setNotifications((prev) => ({ ...prev, manageInquiries: green }));
        setSecondaryNotifications((prev) => ({ ...prev, manageInquiries: yellow }));

        setBadgeSources((prev) => ({
          ...prev,
          inquiries: { green, yellow },
        }));
      }
    );

    // SoundLegend submissions
    const unsubSoundlegend = onSnapshot(
      query(collection(db, 'soundlegend_submissions')),
      (snapshot) => {
        let green = 0;
        let yellow = 0;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const normalized =
            normalizeOverviewStatus(d.overviewStatus) ||
            normalizeOverviewStatus(d.status) ||
            (d.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green++;
          else if (
            normalized === 'inProgress' ||
            normalized === 'prospecting' ||
            normalized === 'inprogress' ||
            normalized === 'in progress'
          )
            yellow++;
        });

        setNotifications((prev) => ({
          ...prev,
          manageSoundlegendRequests: green,
        }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageSoundlegendRequests: yellow,
        }));

        setBadgeSources((prev) => ({
          ...prev,
          soundlegend: { green, yellow },
        }));
      }
    );

    // Risk Alerts
    const unsubRisk = onSnapshot(
      query(collection(db, 'risk_notifications')),
      (snapshot) => {
        let green = 0;
        let yellow = 0;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          // risk uses status like "In Review" etc, but may also have overviewStatus
          const normalized =
            normalizeOverviewStatus(d.overviewStatus) ||
            (d.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green++;
          else if (
            normalized === 'inProgress' ||
            normalized === 'in review' ||
            normalized === 'in progress'
          )
            yellow++;
        });

        // ✅ IMPORTANT: your card uses stateKey "manageRiskAlerts"
        setNotifications((prev) => ({
          ...prev,
          manageRiskAlerts: green,
        }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageRiskAlerts: yellow,
        }));

        setBadgeSources((prev) => ({
          ...prev,
          risk: { green, yellow },
        }));
      }
    );

    // Endorsement Applications
    const unsubEndorseApps = onSnapshot(
      query(collection(db, 'endorsement_applications')),
      (snapshot) => {
        let green = 0;
        let yellow = 0;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const normalized =
            normalizeOverviewStatus(d.overviewStatus) ||
            normalizeOverviewStatus(d.status) ||
            (d.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green++;
          else if (normalized === 'inProgress' || normalized === 'inprogress' || normalized === 'in progress')
            yellow++;
        });

        setNotifications((prev) => ({
          ...prev,
          manageEndorsementApplications: green,
        }));
        setSecondaryNotifications((prev) => ({
          ...prev,
          manageEndorsementApplications: yellow,
        }));

        setBadgeSources((prev) => ({
          ...prev,
          endorsements: { green, yellow },
        }));
      }
    );

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubSoundlegend();
      unsubRisk();
      unsubEndorseApps();
    };
  }, []);

  /* Derive overview totals from per-source badge counts */
  useEffect(() => {
    const totals = Object.values(badgeSources).reduce(
      (acc, { green, yellow }) => ({
        green: acc.green + green,
        yellow: acc.yellow + yellow,
      }),
      { green: 0, yellow: 0 }
    );
    setOverviewBadgeCounts(totals);
  }, [badgeSources]);

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
      case 'manageElixirBatches':
        return <ManageElixirBatches />;
      case 'siteSettings':
        return <SiteSettings />;
      case 'manageSoundlegendRequests':
        return <ManageSoundlegendRequests />;
      case 'manageRiskAlerts':
        return <AdminRiskNotifications />;
      case 'artisanTools':
        return <ArtisanTools />;
      case 'manageSLVault':
        return <SoundLegendVaultAdmin />;
      case 'manageSLVaultCreate':
        return <SoundLegendVaultCreator />;
      case 'manageEndorsementApplications':
        return (
          <ManageEndorsementApplications
            onClose={() => setActiveComponent('overview')}
          />
        );
      case 'attachResources':
        return <AttachUserResourcesTool />;
      default:
        return (
          <AdminOverview
            notifications={notifications}
            secondaryNotifications={secondaryNotifications}
            setOverviewBadgeCounts={setOverviewBadgeCounts}
          />
        );
    }
  };

  const cards = [
    { name: 'Overview', icon: FaRegChartBar, stateKey: 'overview' },
    { name: 'Manage Orders', icon: FaBox, stateKey: 'manageOrders' },
    { name: 'SL Submissions', icon: FaStar, stateKey: 'manageSoundlegendRequests' },
    { name: 'Support Inquiries', icon: FaHeadset, stateKey: 'manageInquiries' },
    { name: 'Endorsements', icon: FaUsers, stateKey: 'manageEndorsementApplications' },
    { name: 'Manage Projects', icon: FaHammer, stateKey: 'manageProjects' },
    { name: 'Manage Users', icon: FaUsers, stateKey: 'manageUsers' },
    { name: 'SL Vault Artists', icon: FaGem, stateKey: 'manageSLVault' },
    { name: 'Manage Products', icon: FaDrum, stateKey: 'manageProducts' },
    { name: 'Manage Carts', icon: FaShoppingCart, stateKey: 'manageCarts' },
    { name: 'Elixir Batches', icon: FaFlask, stateKey: 'manageElixirBatches' },
    { name: 'Artisan Tools', icon: FaHammer, stateKey: 'artisanTools' },
    { name: 'Attach Resources', icon: FaLink, stateKey: 'attachResources' },
    { name: 'Risk Alerts', icon: FaExclamationTriangle, stateKey: 'manageRiskAlerts' },
    { name: 'Site Settings', icon: FaCog, stateKey: 'siteSettings' },
  ];

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="admin-cards">
        {cards.map(({ name, icon: Icon, stateKey }) => {
          const isActive =
            activeComponent === stateKey ||
            (stateKey === 'overview' && activeComponent === 'overview');

          return (
            <div
              key={stateKey}
              className={`admin-card ${
                stateKey === 'overview' ? 'full-width-mobile' : ''
              } ${isActive ? 'admin-card--active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveComponent(stateKey)}
              onKeyDown={(e) => e.key === 'Enter' && setActiveComponent(stateKey)}
            >
              <div className="admin-card-icon">
                <Icon />
                <div className="badge-wrapper">
                  {stateKey === 'overview' ? (
                    <>
                      {overviewBadgeCounts.green > 0 && (
                        <span className="notification-badge badge-green">
                          {overviewBadgeCounts.green}
                        </span>
                      )}
                      {overviewBadgeCounts.yellow > 0 && (
                        <span className="notification-badge-secondary badge-yellow">
                          {overviewBadgeCounts.yellow}
                        </span>
                      )}
                    </>
                  ) : stateKey === 'manageRiskAlerts' ? (
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
                        <span
                          className={`notification-badge ${
                            stateKey === 'manageOrders'
                              ? 'badge-green'
                              : stateKey === 'manageInquiries'
                              ? 'badge-orange'
                              : 'badge-yellow'
                          }`}
                        >
                          {notifications[stateKey]}
                        </span>
                      )}
                      {secondaryNotifications[stateKey] > 0 && (
                        <span className="notification-badge-secondary badge-yellow">
                          {secondaryNotifications[stateKey]}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <h3>{name}</h3>
            </div>
          );
        })}
      </div>

      <div className="component-container">{renderActiveComponent()}</div>
    </div>
  );
};

export default AdminDashboard;