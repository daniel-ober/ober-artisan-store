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
import { db } from '../firebaseConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState('overview');
  const [notifications, setNotifications] = useState({});
  const [secondaryNotifications, setSecondaryNotifications] = useState({});
  const [overviewBadgeCounts, setOverviewBadgeCounts] = useState({ green: 0, yellow: 0 });

  useEffect(() => { backfillOverviewStatus(); }, []);

  useEffect(() => {
    const auth = getAuth();
    const logClaims = (user) => { if (user) { user.getIdTokenResult().then(() => {}); } };
    logClaims(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged((user) => { logClaims(user); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let greenTotal = 0;
    let yellowTotal = 0;

    const updateOverviewBadges = () => {
      setOverviewBadgeCounts({ green: greenTotal, yellow: yellowTotal });
    };

    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snapshot) => {
      let green = 0, yellow = 0;
      snapshot.forEach((doc) => {
        const status = doc.data().overviewStatus;
        if (status === 'new') green++;
        else if (status === 'inProgress') yellow++;
      });
      greenTotal += green; yellowTotal += yellow;
      setNotifications((p)=>({ ...p, manageOrders: green }));
      setSecondaryNotifications((p)=>({ ...p, manageOrders: yellow }));
      updateOverviewBadges();
    });

    const unsubInquiries = onSnapshot(query(collection(db, 'inquiries')),(snapshot)=>{
      let green = 0, yellow = 0;
      snapshot.forEach((doc) => {
        const status = (doc.data().overviewStatus || doc.data().status || '').toLowerCase();
        if (status === 'new') green++;
        else if (status === 'inprogress') yellow++;
      });
      greenTotal += green; yellowTotal += yellow;
      setNotifications((p)=>({ ...p, manageInquiries: green }));
      setSecondaryNotifications((p)=>({ ...p, manageInquiries: yellow }));
      updateOverviewBadges();
    });

    const unsubSoundlegend = onSnapshot(query(collection(db, 'soundlegend_submissions')),(snapshot)=>{
      let green = 0, yellow = 0;
      snapshot.forEach((doc) => {
        const status = (doc.data().status || doc.data().overviewStatus || '').toLowerCase();
        if (status === 'new') green++;
        else if (status === 'prospecting' || status === 'inprogress') yellow++;
      });
      greenTotal += green; yellowTotal += yellow;
      setNotifications((p)=>({ ...p, manageSoundlegendRequests: green }));
      setSecondaryNotifications((p)=>({ ...p, manageSoundlegendRequests: yellow }));
      updateOverviewBadges();
    });

    const unsubRisk = onSnapshot(query(collection(db, 'risk_notifications')),(snapshot)=>{
      let green = 0, yellow = 0;
      snapshot.forEach((doc) => {
        const status = (doc.data().status || '').toLowerCase().trim();
        if (status === 'new') green++;
        else if (status === 'in review' || status === 'in progress') yellow++;
      });
      greenTotal += green; yellowTotal += yellow;
      setNotifications((p)=>({ ...p, manageRiskAlerts: green }));
      setSecondaryNotifications((p)=>({ ...p, manageRiskAlerts: yellow }));
      updateOverviewBadges();
    });

    // ✅ NEW: Endorsement Applications badges
    const unsubEndorseApps = onSnapshot(query(collection(db, 'endorsement_applications')),(snapshot)=>{
      let green = 0, yellow = 0;
      snapshot.forEach((doc) => {
        const s = (doc.data().status || '').toLowerCase();
        if (s === 'new') green++;
        else if (s === 'inprogress' || s === 'in progress' || s === 'inprogress') yellow++;
        else if (s === 'inprogress') yellow++;
      });
      greenTotal += green; yellowTotal += yellow;
      setNotifications((p)=>({ ...p, manageEndorsementApplications: green }));
      setSecondaryNotifications((p)=>({ ...p, manageEndorsementApplications: yellow }));
      updateOverviewBadges();
    });

    return () => {
      unsubOrders(); unsubInquiries(); unsubSoundlegend(); unsubRisk(); unsubEndorseApps();
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
      case 'manageElixirBatches': return <ManageElixirBatches />;
      case 'siteSettings': return <SiteSettings />;
      case 'manageSoundlegendRequests': return <ManageSoundlegendRequests />;
      case 'manageRiskAlerts': return <AdminRiskNotifications />;
      case 'artisanTools': return <ArtisanTools />;
      case 'manageSLVault': return <SoundLegendVaultAdmin />;
      case 'manageSLVaultCreate': return <SoundLegendVaultCreator />;
      case 'manageEndorsementApplications': return <ManageEndorsementApplications onClose={()=>setActiveComponent('overview')} />;
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

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-cards">
        {[
          { name: 'Overview', icon: FaRegChartBar, stateKey: 'overview' },
          { name: 'Manage Orders', icon: FaBox, stateKey: 'manageOrders' },
          { name: 'SL Submissions', icon: FaStar, stateKey: 'manageSoundlegendRequests' },
          { name: 'Endorsements', icon: FaUsers, stateKey: 'manageEndorsementApplications' }, // ✅ NEW
          { name: 'Support Inquiries', icon: FaHeadset, stateKey: 'manageInquiries' },
          { name: 'Manage Projects', icon: FaHammer, stateKey: 'manageProjects' },
          { name: 'Manage Products', icon: FaDrum, stateKey: 'manageProducts' },
          { name: 'SL Vault Artists', icon: FaGem, stateKey: 'manageSLVault' },
          { name: 'Manage Users', icon: FaUsers, stateKey: 'manageUsers' },
          { name: 'Manage Carts', icon: FaShoppingCart, stateKey: 'manageCarts' },
          { name: 'Elixir Batches', icon: FaFlask, stateKey: 'manageElixirBatches' },
          { name: 'Artisan Tools', icon: FaHammer, stateKey: 'artisanTools' },
          { name: 'Risk Alerts', icon: FaExclamationTriangle, stateKey: 'manageRiskAlerts' },
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
              <div className="badge-wrapper">
                {stateKey === 'overview' ? (
                  <>
                    {overviewBadgeCounts.green > 0 && (
                      <span className="notification-badge badge-green">
                        {overviewBadgeCounts.green}
                      </span>
                    )}
                    {overviewBadgeCounts.yellow > 0 && (
                      <span className="notification-badge-secondary">
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
                      <span className="notification-badge-secondary">
                        {secondaryNotifications[stateKey]}
                      </span>
                    )}
                  </>
                )}
              </div>
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