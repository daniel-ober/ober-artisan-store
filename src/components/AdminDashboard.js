// src/components/AdminDashboard.js

import React, { useEffect, useState } from 'react';

import { collection, onSnapshot, query } from 'firebase/firestore';

import { getAuth } from 'firebase/auth';

import {

  FaBox,

  FaCog,

  FaDrum,

  FaExclamationTriangle,

  FaGem,

  FaHammer,

  FaHeadset,

  FaLink,

  FaRegChartBar,

  FaShoppingCart,

  FaStar,

  FaTasks,

  FaUsers,

} from 'react-icons/fa';

import { backfillOverviewStatus } from '../utils/backfillOverviewStatus';

import { db } from '../firebaseConfig';

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

import AdminLegacyPrintCalibration from './AdminLegacyPrintCalibration';

import './AdminDashboard.css';

const LEGACYPRINT_ICON =

  '/legacyprint-benchmarks/ober-legacyprint-7-node-neon-all-connections-transparent.png';

const normalizeOverviewStatus = (raw) => {

  const value = (raw || '').toString().trim().toLowerCase();

  if (!value) return null;

  if (value === 'new') return 'new';

  if (value === 'inprogress' || value === 'in progress') return 'inProgress';

  if (value === 'completed' || value === 'complete' || value === 'done') {

    return 'completed';

  }

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

  const [badgeSources, setBadgeSources] = useState({

    orders: { green: 0, yellow: 0 },

    inquiries: { green: 0, yellow: 0 },

    soundlegend: { green: 0, yellow: 0 },

    risk: { green: 0, yellow: 0 },

    endorsements: { green: 0, yellow: 0 },

  });

  useEffect(() => {

    backfillOverviewStatus();

  }, []);

  useEffect(() => {

    const auth = getAuth();

    const logClaims = (user) => {

      if (!user) return;

      user.getIdTokenResult().then(() => {

        // Claims sanity check hook.

      });

    };

    logClaims(auth.currentUser);

    const unsubscribe = auth.onAuthStateChanged((user) => logClaims(user));

    return () => unsubscribe();

  }, []);

  useEffect(() => {

    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snapshot) => {

      let green = 0;

      let yellow = 0;

      snapshot.forEach((docSnap) => {

        const normalized = normalizeOverviewStatus(docSnap.data().overviewStatus);

        if (normalized === 'new') green += 1;

        else if (normalized === 'inProgress') yellow += 1;

      });

      setNotifications((prev) => ({ ...prev, manageOrders: green }));

      setSecondaryNotifications((prev) => ({ ...prev, manageOrders: yellow }));

      setBadgeSources((prev) => ({ ...prev, orders: { green, yellow } }));

    });

    const unsubInquiries = onSnapshot(

      query(collection(db, 'inquiries')),

      (snapshot) => {

        let green = 0;

        let yellow = 0;

        snapshot.forEach((docSnap) => {

          const data = docSnap.data();

          const normalized =

            normalizeOverviewStatus(data.overviewStatus) ||

            normalizeOverviewStatus(data.status) ||

            (data.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green += 1;

          else if (

            normalized === 'inProgress' ||

            normalized === 'inprogress' ||

            normalized === 'in progress'

          ) {

            yellow += 1;

          } else if (

            typeof normalized === 'string' &&

            normalized.includes('in progress')

          ) {

            yellow += 1;

          }

        });

        setNotifications((prev) => ({ ...prev, manageInquiries: green }));

        setSecondaryNotifications((prev) => ({ ...prev, manageInquiries: yellow }));

        setBadgeSources((prev) => ({ ...prev, inquiries: { green, yellow } }));

      }

    );

    const unsubSoundlegend = onSnapshot(

      query(collection(db, 'soundlegend_submissions')),

      (snapshot) => {

        let green = 0;

        let yellow = 0;

        snapshot.forEach((docSnap) => {

          const data = docSnap.data();

          const normalized =

            normalizeOverviewStatus(data.overviewStatus) ||

            normalizeOverviewStatus(data.status) ||

            (data.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green += 1;

          else if (

            normalized === 'inProgress' ||

            normalized === 'prospecting' ||

            normalized === 'inprogress' ||

            normalized === 'in progress'

          ) {

            yellow += 1;

          }

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

    const unsubRisk = onSnapshot(

      query(collection(db, 'risk_notifications')),

      (snapshot) => {

        let green = 0;

        let yellow = 0;

        snapshot.forEach((docSnap) => {

          const data = docSnap.data();

          const normalized =

            normalizeOverviewStatus(data.overviewStatus) ||

            (data.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green += 1;

          else if (

            normalized === 'inProgress' ||

            normalized === 'in review' ||

            normalized === 'in progress'

          ) {

            yellow += 1;

          }

        });

        setNotifications((prev) => ({ ...prev, manageRiskAlerts: green }));

        setSecondaryNotifications((prev) => ({

          ...prev,

          manageRiskAlerts: yellow,

        }));

        setBadgeSources((prev) => ({ ...prev, risk: { green, yellow } }));

      }

    );

    const unsubEndorsements = onSnapshot(

      query(collection(db, 'endorsement_applications')),

      (snapshot) => {

        let green = 0;

        let yellow = 0;

        snapshot.forEach((docSnap) => {

          const data = docSnap.data();

          const normalized =

            normalizeOverviewStatus(data.overviewStatus) ||

            normalizeOverviewStatus(data.status) ||

            (data.status || '').toString().trim().toLowerCase();

          if (normalized === 'new') green += 1;

          else if (

            normalized === 'inProgress' ||

            normalized === 'inprogress' ||

            normalized === 'in progress'

          ) {

            yellow += 1;

          }

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

      unsubEndorsements();

    };

  }, []);

  useEffect(() => {

    const totals = Object.values(badgeSources).reduce(

      (acc, source) => ({

        green: acc.green + source.green,

        yellow: acc.yellow + source.yellow,

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

      case 'legacyPrintCalibration':

        return <AdminLegacyPrintCalibration />;

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

    {

      name: 'Overview',

      eyebrow: 'Command center',

      icon: FaRegChartBar,

      stateKey: 'overview',

    },

    {

      name: 'Manage Orders',

      eyebrow: 'Sales flow',

      icon: FaBox,

      stateKey: 'manageOrders',

    },

    {

      name: 'SL Submissions',

      eyebrow: 'Custom leads',

      icon: FaStar,

      stateKey: 'manageSoundlegendRequests',

    },

    {

      name: 'Support Inquiries',

      eyebrow: 'Customer care',

      icon: FaHeadset,

      stateKey: 'manageInquiries',

    },

    {

      name: 'Endorsements',

      eyebrow: 'Artist requests',

      icon: FaUsers,

      stateKey: 'manageEndorsementApplications',

    },

    {

      name: 'Manage Projects',

      eyebrow: 'Build workflow',

        icon: FaTasks,

      stateKey: 'manageProjects',

    },

    {

      name: 'Manage Users',

      eyebrow: 'Access control',

      icon: FaUsers,

      stateKey: 'manageUsers',

    },

    {

      name: 'SL Vault Artists',

      eyebrow: 'Legacy pages',

      icon: FaGem,

      stateKey: 'manageSLVault',

    },

    {

      name: 'Manage Products',

      eyebrow: 'Store catalog',

      icon: FaDrum,

      stateKey: 'manageProducts',

    },

    {

      name: 'Manage Carts',

      eyebrow: 'Open checkouts',

      icon: FaShoppingCart,

      stateKey: 'manageCarts',

    },

    {

      name: 'Artisan Tools',

      eyebrow: 'Shop utilities',

      icon: FaHammer,

      stateKey: 'artisanTools',

    },

    {

      name: 'LegacyPrint',

      eyebrow: 'Voicing engine',

      iconImage: LEGACYPRINT_ICON,

      stateKey: 'legacyPrintCalibration',

      featured: true,

    },

    {

      name: 'Attach Resources',

      eyebrow: 'User assets',

      icon: FaLink,

      stateKey: 'attachResources',

    },

    {

      name: 'Risk Alerts',

      eyebrow: 'Security review',

      icon: FaExclamationTriangle,

      stateKey: 'manageRiskAlerts',

    },

    {

      name: 'Site Settings',

      eyebrow: 'Global controls',

      icon: FaCog,

      stateKey: 'siteSettings',

    },

  ];

  const renderBadges = (stateKey) => {

    if (stateKey === 'overview') {

      return (

        <>

          {overviewBadgeCounts.green > 0 && (

            <span className="admin-notification-dot admin-notification-dot--green">

              {overviewBadgeCounts.green}

            </span>

          )}

          {overviewBadgeCounts.yellow > 0 && (

            <span className="admin-notification-dot admin-notification-dot--gold">

              {overviewBadgeCounts.yellow}

            </span>

          )}

        </>

      );

    }

    if (stateKey === 'manageRiskAlerts') {

      return (

        <>

          {notifications[stateKey] > 0 && (

            <span className="admin-notification-dot admin-notification-dot--red">

              {notifications[stateKey]}

            </span>

          )}

          {secondaryNotifications[stateKey] > 0 && (

            <span className="admin-notification-dot admin-notification-dot--gold">

              {secondaryNotifications[stateKey]}

            </span>

          )}

        </>

      );

    }

    return (

      <>

        {notifications[stateKey] > 0 && (

          <span

            className={`admin-notification-dot ${

              stateKey === 'manageOrders'

                ? 'admin-notification-dot--green'

                : stateKey === 'manageInquiries'

                ? 'admin-notification-dot--orange'

                : 'admin-notification-dot--gold'

            }`}

          >

            {notifications[stateKey]}

          </span>

        )}

        {secondaryNotifications[stateKey] > 0 && (

          <span className="admin-notification-dot admin-notification-dot--gold">

            {secondaryNotifications[stateKey]}

          </span>

        )}

      </>

    );

  };

  return (

    <div className="admin-dashboard">

      <header className="admin-dashboard-header">

        <p className="admin-dashboard-kicker">Admin Workspace</p>

        <h1>Ober Artisan Control Room</h1>

        <p className="admin-dashboard-subtitle">

          Manage orders, builds, artists, site tools, and the LegacyPrint™ voicing

          engine from one clean workspace.

        </p>

      </header>

      <div className="admin-cards" aria-label="Admin dashboard tools">

        {cards.map(({ name, eyebrow, icon: Icon, iconImage, stateKey, featured }) => {

          const isActive = activeComponent === stateKey;

          return (

            <button

              key={stateKey}

              type="button"

              className={`admin-card ${isActive ? 'admin-card--active' : ''} ${

                featured ? 'admin-card--featured' : ''

              }`}

              onClick={() => setActiveComponent(stateKey)}

            >

              <span className="admin-card-topline">{eyebrow}</span>

              <span className="admin-card-icon-wrap">

                {iconImage ? (

                  <img

                    src={iconImage}

                    alt=""

                    className="admin-card-custom-icon admin-card-legacyprint-icon"

                  />

                ) : (

                  <Icon className="admin-card-react-icon" />

                )}

                <span className="admin-card-badges">{renderBadges(stateKey)}</span>

              </span>

              <span className="admin-card-title">{name}</span>

            </button>

          );

        })}

      </div>

      <div className="component-container">{renderActiveComponent()}</div>

    </div>

  );

};

export default AdminDashboard;