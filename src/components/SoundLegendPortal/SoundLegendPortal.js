// src/components/SoundLegendPortal/SoundLegendPortal.js

import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

import ProjectProgress from './ProjectProgress';
import ScopeOfWork from './ScopeOfWork';
import VaultPreferences from './VaultPreferences';
import Media from './Media';
import PaymentHistory from './PaymentHistory';
import AccountSettings from './AccountSettings';

import './SoundLegendTabs.css';
import './SoundLegendPortal.css';

/* -------------------- tiny helpers -------------------- */

function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

const Tabs = ({ tabs, current, onChange, rightSlot }) => (
  <div className="slp-tabs">
    <div
      className="slp-tablist"
      role="tablist"
      aria-label="SoundLegend sections"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={current === t.key}
          className={`slp-tab ${current === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
    <div className="slp-tab-right">{rightSlot}</div>
  </div>
);

/* -------------------- main portal -------------------- */

const SoundLegendPortal = () => {
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('progress');

  // Load projects for this user
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const run = async () => {
      try {
        // Primary: ownerUid
        let qProj = query(
          collection(db, 'projects'),
          where('ownerUid', '==', user.uid)
        );
        let snap = await getDocs(qProj);

        // Fallback: customer.emailLower
        if (snap.empty && user.email) {
          const emailLower = user.email.trim().toLowerCase();
          qProj = query(
            collection(db, 'projects'),
            where('customer.emailLower', '==', emailLower)
          );
          snap = await getDocs(qProj);
        }

        if (cancelled) return;

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(a.createdAt) - tsToMillis(b.createdAt));

        setProjects(list);
        setSelectedId(list[0]?.id || '');
      } catch (e) {
        console.error('Error loading projects', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load orders for this user (by email)
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    const run = async () => {
      try {
        const qOrders = query(
          collection(db, 'orders'),
          where('customerEmail', '==', user.email)
        );
        const snap = await getDocs(qOrders);
        if (cancelled) return;

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));
        setOrders(list);
      } catch (e) {
        console.warn('Order fetch skipped/failed', e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const latestOrder = useMemo(
    () => (orders.length ? orders[0] : null),
    [orders]
  );

  if (!user) {
    return (
      <div className="slp-page">
        Please sign in to view your Artist Portal.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="slp-page">Loading your SoundLegend experience…</div>
    );
  }

  if (!projects.length) {
    return (
      <div className="slp-page">
        <h2>Welcome to your SoundLegend</h2>
        <p>
          No projects are linked to your account yet. If this seems wrong,
          email:{' '}
          <a href="mailto:soundlegend@oberartisandrums.com">
            soundlegend@oberartisandrums.com
          </a>
        </p>
      </div>
    );
  }

  const ProjectPicker =
    projects.length > 1 ? (
      <select
        className="slp-picker"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.lineSerial || p.globalSerial || p.artisanLine || p.id}
            {p.width && p.shellDepth ? ` — ${p.width}×${p.shellDepth}"` : ''}
          </option>
        ))}
      </select>
    ) : null;

  const tabs = [
    { key: 'progress', label: 'Build Progress' },
    { key: 'scope', label: 'Scope of Work' },
    { key: 'vault', label: 'Vault Preferences' },
    { key: 'media', label: 'Media' },
    { key: 'payments', label: 'Payment History' },
    { key: 'account', label: 'Account Settings' },
  ];

  return (
    <div className="slp-page">
      <div className="signin-logo-container">
        <img
          src="/soundlegend-signin/white-logo.png"
          alt="SoundLegend Experience"
          className="signin-logo"
          loading="eager"
        />
      </div>

      <Tabs
        tabs={tabs}
        current={tab}
        onChange={setTab}
        rightSlot={ProjectPicker}
      />

      <div className="slp-panel">
        {tab === 'progress' && (
          <ProjectProgress project={selectedProject} isAdmin={isAdmin} />
        )}

        {tab === 'scope' && <ScopeOfWork project={selectedProject} />}

        {tab === 'vault' && <VaultPreferences project={selectedProject} />}

        {tab === 'media' && <Media project={selectedProject} />}

        {tab === 'payments' && <PaymentHistory orders={orders} />}

        {tab === 'account' && (
          <AccountSettings
            user={user}
            projects={projects}
            orders={orders}
            latestOrder={latestOrder}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default SoundLegendPortal;