import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { usePortalUser } from '../../hooks/usePortalUser';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  const { isAdmin } = useAuth();
  const {
    portalUser,
    loadingPortalUser,
    isImpersonating: hookIsImpersonating,
  } = usePortalUser();

  // -------------------- Query params (project + optional impersonation bootstrap) --------------------
  const queryParams = useMemo(() => {
    try {
      return new URLSearchParams(location.search);
    } catch {
      return new URLSearchParams();
    }
  }, [location.search]);

  const projectIdFromQuery = (queryParams.get('projectId') || '').trim();
  const qpImpersonateUid = (queryParams.get('impersonateUid') || '').trim();
  const qpImpersonateName = (queryParams.get('impersonateName') || '').trim();
  const qpImpersonateEmail = (queryParams.get('impersonateEmail') || '').trim();

  // If we arrive via "View as Customer ↗" in a new tab, sessionStorage will be empty.
  // Bootstrap impersonation from query params (admin only), then trigger the same reactive flow.
  useEffect(() => {
    if (!isAdmin) return;
    if (!qpImpersonateUid) return;

    // Set session storage exactly like ManageUsers does
    sessionStorage.setItem('impersonateUid', qpImpersonateUid);
    sessionStorage.setItem('impersonateMode', 'admin');

    if (qpImpersonateName) sessionStorage.setItem('impersonateName', qpImpersonateName);
    if (qpImpersonateEmail) sessionStorage.setItem('impersonateEmail', qpImpersonateEmail);

    window.dispatchEvent(new Event('impersonation-changed'));

    // Optional: strip impersonation params from URL to keep it clean (projectId stays)
    // (Keeps behavior stable even if user refreshes)
    try {
      const clean = new URLSearchParams(location.search);
      clean.delete('impersonateUid');
      clean.delete('impersonateName');
      clean.delete('impersonateEmail');

      const nextSearch = clean.toString();
      const nextUrl = nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname;

      // Only replace if it actually changes anything
      if (nextUrl !== `${location.pathname}${location.search}`) {
        navigate(nextUrl, { replace: true });
      }
    } catch {
      // no-op
    }
  }, [
    isAdmin,
    qpImpersonateUid,
    qpImpersonateName,
    qpImpersonateEmail,
    location.pathname,
    location.search,
    navigate,
  ]);

  // -------------------- Impersonation values persisted by ManageUsers (reactive) --------------------
  const [impersonateUid, setImpersonateUid] = useState(
    () => sessionStorage.getItem('impersonateUid') || ''
  );
  const [impersonateName, setImpersonateName] = useState(
    () => sessionStorage.getItem('impersonateName') || ''
  );
  const [impersonateEmail, setImpersonateEmail] = useState(
    () => sessionStorage.getItem('impersonateEmail') || ''
  );

  useEffect(() => {
    const sync = () => {
      setImpersonateUid(sessionStorage.getItem('impersonateUid') || '');
      setImpersonateName(sessionStorage.getItem('impersonateName') || '');
      setImpersonateEmail(sessionStorage.getItem('impersonateEmail') || '');
    };

    sync();
    window.addEventListener('impersonation-changed', sync);
    return () => window.removeEventListener('impersonation-changed', sync);
  }, []);

  // -------------------- Effective portal user resolution --------------------
  const [effectivePortalUser, setEffectivePortalUser] = useState(null);
  const [loadingEffectiveUser, setLoadingEffectiveUser] = useState(true);
  const [effectiveIsImpersonating, setEffectiveIsImpersonating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loadingPortalUser) return;

      setLoadingEffectiveUser(true);

      try {
        if (isAdmin && impersonateUid) {
          const ref = doc(db, 'users', impersonateUid);
          const snap = await getDoc(ref);

          if (cancelled) return;

          if (snap.exists()) {
            const data = snap.data() || {};
            setEffectivePortalUser({
              id: impersonateUid,
              uid: impersonateUid,
              ...data,
              email: data.email || impersonateEmail || '',
              fullName:
                data.firstName || data.lastName
                  ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
                  : data.fullName || impersonateName || '',
            });
          } else {
            setEffectivePortalUser(portalUser || null);
          }

          setEffectiveIsImpersonating(true);
          return;
        }

        setEffectivePortalUser(portalUser || null);
        setEffectiveIsImpersonating(Boolean(hookIsImpersonating));
      } catch (e) {
        console.error('Failed to resolve effective portal user:', e);
        setEffectivePortalUser(portalUser || null);
        setEffectiveIsImpersonating(Boolean(hookIsImpersonating));
      } finally {
        if (!cancelled) setLoadingEffectiveUser(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    isAdmin,
    impersonateUid,
    impersonateEmail,
    impersonateName,
    portalUser,
    loadingPortalUser,
    hookIsImpersonating,
  ]);

  const exitImpersonation = () => {
    sessionStorage.removeItem('impersonateUid');
    sessionStorage.removeItem('impersonateName');
    sessionStorage.removeItem('impersonateEmail');
    sessionStorage.removeItem('impersonateMode');

    setImpersonateUid('');
    setImpersonateName('');
    setImpersonateEmail('');

    window.dispatchEvent(new Event('impersonation-changed'));
    navigate('/admin', { replace: true });
  };

  // -------------------- Projects / Orders state --------------------
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('progress');

  /* ---------- LOAD PROJECTS FOR EFFECTIVE PORTAL USER (ownerUid OR userId OR email) ---------- */
  useEffect(() => {
    if (!effectivePortalUser || loadingEffectiveUser) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const ownerUid = effectivePortalUser.uid || effectivePortalUser.id;
        const colRef = collection(db, 'projects');

        let list = [];

        // 0) If a projectId was passed, fetch it directly and seed the list
        let seededProject = null;
        if (projectIdFromQuery) {
          try {
            const pRef = doc(db, 'projects', projectIdFromQuery);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              seededProject = { id: pSnap.id, ...pSnap.data() };
            }
          } catch (e) {
            console.warn('Failed to fetch project by projectId query param:', e);
          }
        }

        // 1) Primary: ownerUid
        let snap = { empty: true, docs: [] };
        if (ownerUid) {
          const qByOwner = query(colRef, where('ownerUid', '==', ownerUid));
          snap = await getDocs(qByOwner);
        }

        // 2) Fallback: userId
        if (snap.empty && ownerUid) {
          const qByUserId = query(colRef, where('userId', '==', ownerUid));
          snap = await getDocs(qByUserId);
        }

        // 3) Fallback: customer.emailLower
        if (snap.empty && effectivePortalUser.email) {
          const emailLower = effectivePortalUser.email.trim().toLowerCase();
          const qByEmailLower = query(
            colRef,
            where('customer.emailLower', '==', emailLower)
          );
          snap = await getDocs(qByEmailLower);
        }

        // 4) Extra fallbacks (older schemas)
        if (snap.empty && effectivePortalUser.email) {
          const email = effectivePortalUser.email.trim();
          const emailLower = email.toLowerCase();

          // projects.customerEmail
          const qByCustomerEmail = query(colRef, where('customerEmail', '==', email));
          const snapA = await getDocs(qByCustomerEmail);

          if (!snapA.empty) snap = snapA;

          // projects.customer.email (exact)
          if (snap.empty) {
            const qByCustomerDotEmail = query(colRef, where('customer.email', '==', email));
            const snapB = await getDocs(qByCustomerDotEmail);
            if (!snapB.empty) snap = snapB;
          }

          // projects.customer.emailLower might exist but emailLower stored differently
          if (snap.empty) {
            const qByCustomerDotEmailLower = query(
              colRef,
              where('customer.emailLower', '==', emailLower)
            );
            const snapC = await getDocs(qByCustomerDotEmailLower);
            if (!snapC.empty) snap = snapC;
          }
        }

        if (!cancelled) {
          const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Merge seededProject (from direct projectId fetch) into fetched list, de-duped
          const map = new Map();
          [...(seededProject ? [seededProject] : []), ...fetched].forEach((p) => {
            if (p?.id) map.set(p.id, p);
          });
          list = Array.from(map.values());

          list.sort((a, b) => tsToMillis(a.createdAt) - tsToMillis(b.createdAt));

          setProjects(list);

          // Selection logic:
          // - if projectIdFromQuery exists and is in list -> select it
          // - else keep previous selection if still present
          // - else first project
          setSelectedId((prev) => {
            if (projectIdFromQuery && list.some((p) => p.id === projectIdFromQuery)) {
              return projectIdFromQuery;
            }
            if (prev && list.some((p) => p.id === prev)) return prev;
            return list[0]?.id || '';
          });
        }
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
  }, [effectivePortalUser, loadingEffectiveUser, projectIdFromQuery]);

  // Load orders for this effective portal user (by email)
  useEffect(() => {
    if (!effectivePortalUser?.email || loadingEffectiveUser) return;
    let cancelled = false;

    const run = async () => {
      try {
        const qOrders = query(
          collection(db, 'orders'),
          where('customerEmail', '==', effectivePortalUser.email)
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
  }, [effectivePortalUser?.email, loadingEffectiveUser]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const latestOrder = useMemo(() => (orders.length ? orders[0] : null), [orders]);

  /* -------------------- loading / empty states -------------------- */

  if (loadingPortalUser || loadingEffectiveUser) {
    return <div className="slp-page">Loading your SoundLegend portal…</div>;
  }

  if (!effectivePortalUser) {
    return <div className="slp-page">Please sign in to view your Artist Portal.</div>;
  }

  if (loading) {
    return <div className="slp-page">Loading your SoundLegend experience…</div>;
  }

  if (!projects.length) {
    return (
      <div className="slp-page">
        {effectiveIsImpersonating && (
          <div className="slp-impersonation-banner">
            <div className="slp-impersonation-left">
              <span className="slp-impersonation-pill">IMPERSONATING</span>
              <span className="slp-impersonation-text">
                {effectivePortalUser.fullName ||
                  effectivePortalUser.email ||
                  impersonateName ||
                  impersonateEmail ||
                  impersonateUid}
              </span>
            </div>

            <button
              type="button"
              className="slp-impersonation-exit"
              onClick={exitImpersonation}
            >
              Exit
            </button>
          </div>
        )}

        <h2>
          Welcome to your SoundLegend
          {effectiveIsImpersonating ? ' (admin view)' : ''}
        </h2>
        <p>
          No projects are linked to your account yet. If this seems wrong, email:{' '}
          <a href="mailto:soundlegend@oberartisandrums.com">
            support@oberartisandrums.com
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

  const isSoundLegendProject = artisanLine === 'soundlegend' || serialGuess.startsWith('SL-');

  const handleTabChange = (nextKey) => {
    if (!isSoundLegendProject && (nextKey === 'vault' || nextKey === 'media')) {
      return;
    }
    setTab(nextKey);
  };

  return (
    <div className="slp-page">
      {effectiveIsImpersonating && (
        <div className="slp-impersonation-banner">
          <div className="slp-impersonation-left">
            <span className="slp-impersonation-pill">IMPERSONATING</span>
            <span className="slp-impersonation-text">
              {effectivePortalUser.fullName ||
                effectivePortalUser.email ||
                impersonateName ||
                impersonateEmail ||
                impersonateUid}
            </span>
          </div>

          <button
            type="button"
            className="slp-impersonation-exit"
            onClick={exitImpersonation}
          >
            Exit
          </button>
        </div>
      )}

      <h2 className="slp-heading">
        Welcome to your Artist Portal
        {effectiveIsImpersonating ? ' (admin view)' : ''}
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

        {tab === 'vault' && isSoundLegendProject && (
          <VaultPreferences project={selectedProject} />
        )}
        {tab === 'media' && isSoundLegendProject && <Media project={selectedProject} />}

        {tab === 'payments' && <PaymentHistory orders={orders} />}

        {tab === 'account' && (
          <AccountSettings
            user={effectivePortalUser}
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