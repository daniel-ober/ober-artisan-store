import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { usePortalUser } from '../../hooks/usePortalUser';

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

/* -------------------- custom project picker -------------------- */

const ProjectPicker = ({ projects, selectedId, onChange }) => {
  const [open, setOpen] = useState(false);

  if (!projects || projects.length <= 1) return null;

  const current =
    projects.find((p) => p.id === selectedId) || projects[0] || null;

  const labelFor = (p) => {
    const base =
      p.lineSerial || p.globalSerial || p.artisanLine || p.id || 'Project';
    return base; // serial only, no diameter/depth
  };

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="slp-picker-shell">
      <button
        type="button"
        className="slp-picker slp-picker-button slp-picker-soundlegend"
        onClick={() => setOpen((o) => !o)}
      >
        {current ? labelFor(current) : 'Select your project'}
      </button>

      {open && (
        <div className="slp-picker-menu" role="listbox">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`slp-picker-item ${
                p.id === selectedId ? 'is-active' : ''
              }`}
              onClick={() => handleSelect(p.id)}
              role="option"
              aria-selected={p.id === selectedId}
            >
              {labelFor(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------- tabs w/ picker on the left -------------------- */

const Tabs = ({
  tabs,
  current,
  onChange,
  projects,
  selectedId,
  onSelectProject,
  isSoundLegendProject,
}) => {
  const slOnlyKeys = new Set(['vault', 'media']);

  return (
    <div className="slp-tabs">
      <div className="slp-tabs-left">
        <ProjectPicker
          projects={projects}
          selectedId={selectedId}
          onChange={onSelectProject}
        />
      </div>

      <div
        className="slp-tablist slp-tabs-buttons"
        role="tablist"
        aria-label="SoundLegend sections"
      >
        {tabs.map((t) => {
          const isSlOnly = slOnlyKeys.has(t.key);
          const disabled = isSlOnly && !isSoundLegendProject;

          const tooltipText =
            t.key === 'vault'
              ? 'Vault preferences are part of the SoundLegend experience.'
              : t.key === 'media'
              ? 'Legacy media is part of the SoundLegend experience.'
              : '';

          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={current === t.key}
              className={[
                'slp-tab',
                current === t.key ? 'active' : '',
                disabled ? 'slp-tab-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (disabled) return;
                onChange(t.key);
              }}
              type="button"
            >
              <span>{t.label}</span>
              {disabled && tooltipText && (
                <span className="slp-tab-tooltip">{tooltipText}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------- main portal -------------------- */

const SoundLegendPortal = () => {
  const { isAdmin } = useAuth();
  const { portalUser, loadingPortalUser, isImpersonating } = usePortalUser();

  const [loading, setLoading] = useState(true); // loading projects/orders
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('progress');

  /* ---------- LOAD PROJECTS FOR PORTAL USER (ownerUid OR userId OR email) ---------- */
  useEffect(() => {
    if (!portalUser || loadingPortalUser) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const ownerUid = portalUser.uid || portalUser.id;
        const colRef = collection(db, 'projects');

        let snap = { empty: true, docs: [] };

        // 1) Primary: ownerUid
        if (ownerUid) {
          const qByOwner = query(colRef, where('ownerUid', '==', ownerUid));
          snap = await getDocs(qByOwner);
        }

        // 2) Fallback: userId (what AttachUserResourcesTool writes)
        if (snap.empty && ownerUid) {
          const qByUserId = query(colRef, where('userId', '==', ownerUid));
          snap = await getDocs(qByUserId);
        }

        // 3) Fallback: customer.emailLower
        if (snap.empty && portalUser.email) {
          const emailLower = portalUser.email.trim().toLowerCase();
          const qByEmail = query(
            colRef,
            where('customer.emailLower', '==', emailLower)
          );
          snap = await getDocs(qByEmail);
        }

        if (cancelled) return;

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(a.createdAt) - tsToMillis(b.createdAt));

        setProjects(list);

        // keep current selection if still present, else default to first
        setSelectedId((prev) =>
          prev && list.some((p) => p.id === prev) ? prev : list[0]?.id || ''
        );
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
  }, [portalUser, loadingPortalUser]);

  // Load orders for this portal user (by email)
  useEffect(() => {
    if (!portalUser?.email || loadingPortalUser) return;
    let cancelled = false;

    const run = async () => {
      try {
        const qOrders = query(
          collection(db, 'orders'),
          where('customerEmail', '==', portalUser.email)
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
  }, [portalUser?.email, loadingPortalUser]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const latestOrder = useMemo(
    () => (orders.length ? orders[0] : null),
    [orders]
  );

  /* -------------------- loading / empty states -------------------- */

  if (loadingPortalUser) {
    return (
      <div className="slp-page">Loading your SoundLegend portal…</div>
    );
  }

  if (!portalUser) {
    return (
      <div className="slp-page">Please sign in to view your Artist Portal.</div>
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
        <h2>
          Welcome to your SoundLegend
          {isImpersonating ? ' (admin view)' : ''}
        </h2>
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

  const tabs = [
    { key: 'progress', label: 'Build Progress' },
    { key: 'scope', label: 'Scope of Work' },
    { key: 'vault', label: 'Vault Preferences' },
    { key: 'media', label: 'Media' },
    { key: 'payments', label: 'Payment History' },
    { key: 'account', label: 'Account Settings' },
  ];

  // 🔐 Is the currently selected project a SoundLegend drum?
  const artisanLine = (selectedProject?.artisanLine || '').toLowerCase();
  const serialGuess = (
    selectedProject?.lineSerial ||
    selectedProject?.snareSerial ||
    selectedProject?.serial ||
    selectedProject?.id ||
    ''
  ).toUpperCase();

  const isSoundLegendProject =
    artisanLine === 'soundlegend' || serialGuess.startsWith('SL-');

  const handleTabChange = (nextKey) => {
    // Block navigation to SL-only tabs for non-SL drums
    if (
      !isSoundLegendProject &&
      (nextKey === 'vault' || nextKey === 'media')
    ) {
      return;
    }
    setTab(nextKey);
  };

  return (
    <div className="slp-page">
      <h2 className="slp-heading">
        Welcome to your Artist Portal
        {isImpersonating ? ' (admin view)' : ''}
      </h2>

      <Tabs
        tabs={tabs}
        current={tab}
        onChange={handleTabChange}
        projects={projects}
        selectedId={selectedId}
        onSelectProject={setSelectedId}
        isSoundLegendProject={isSoundLegendProject}
      />

      <div className="slp-panel">
        {tab === 'progress' && (
          <ProjectProgress project={selectedProject} isAdmin={isAdmin} />
        )}
        {tab === 'scope' && <ScopeOfWork project={selectedProject} />}

        {/* SL-only sections */}
        {tab === 'vault' && isSoundLegendProject && (
          <VaultPreferences project={selectedProject} />
        )}
        {tab === 'media' && isSoundLegendProject && (
          <Media project={selectedProject} />
        )}

        {tab === 'payments' && <PaymentHistory orders={orders} />}
        {tab === 'account' && (
          <AccountSettings
            user={portalUser}
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