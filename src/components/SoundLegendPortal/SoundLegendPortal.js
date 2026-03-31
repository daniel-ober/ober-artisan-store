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

const STORY_CHAPTER_KEYS = [
  'discoveryDesign',
  'commitmentPortal',
  'woodVisionLockIn',
  'rawShellCreation',
  'shellTrueingTorchTune',
  'exteriorArtFinish',
  'edgesSnareBeds',
  'hardwareAssembly',
  'legacyTuningMedia',
  'finalQAPackagingDelivery',
];

function isChecklistItemComplete(item) {
  if (!item) return false;

  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : null;

  if (states && states.length > 0) return states.every(Boolean);
  return !!item.completed;
}

function isChecklistItemTouched(item) {
  if (!item) return false;
  if (item.completed) return true;

  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : null;

  if (states && states.length > 0) return states.some(Boolean);
  return (item.totalSeconds ?? 0) > 0;
}

/**
 * Returns the currently active story chapter index:
 * 0 = Chapter I, 1 = Chapter II, etc.
 */
function getProjectCurrentChapterIndex(project) {
  if (!project) return 0;

  for (let i = 0; i < STORY_CHAPTER_KEYS.length; i += 1) {
    const key = STORY_CHAPTER_KEYS[i];
    const checklist = Array.isArray(project?.[key]?.checklist)
      ? project[key].checklist.filter(Boolean)
      : [];

    if (!checklist.length) {
      return i;
    }

    const allComplete =
      checklist.length > 0 && checklist.every(isChecklistItemComplete);

    if (!allComplete) {
      return i;
    }
  }

  return STORY_CHAPTER_KEYS.length - 1;
}

/* -------------------- custom project picker -------------------- */

const ProjectPicker = ({ projects, selectedId, onChange }) => {
  const [open, setOpen] = useState(false);

  if (!projects || projects.length <= 1) return null;

  const current =
    projects.find((p) => p.id === selectedId) || projects[0] || null;

  const labelFor = (p) => {
    const serial =
      p.lineSerial || p.globalSerial || p.snareSerial || p.serial || '';
    const line = p.artisanLine || p.series || 'Project';

    if (serial) return `${serial} · ${line}`;
    return `${line} · ${p.id?.slice(0, 6) || 'Project'}`;
  };

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="slp-picker-shell">
      <button
        type="button"
        className="slp-picker-button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="slp-picker-button-text">
          {current ? labelFor(current) : 'Select your project'}
        </span>
        <span className={`slp-picker-chevron ${open ? 'is-open' : ''}`} />
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

/* -------------------- tabs -------------------- */

const Tabs = ({
  tabs,
  current,
  onChange,
  projects,
  selectedId,
  onSelectProject,
  showProjectPicker = true,
}) => {
  return (
    <div className="slp-tabs-shell">
      <div className="slp-tabs-header">
        <div className="slp-tabs-header-copy">
          <div className="slp-tabs-eyebrow">Artist Portal</div>
          <h2 className="slp-tabs-title">Your Project Workspace</h2>
        </div>
      </div>

      <div className="slp-tabs">
        <div className="slp-tabs-left">
          {showProjectPicker ? (
            <ProjectPicker
              projects={projects}
              selectedId={selectedId}
              onChange={onSelectProject}
            />
          ) : null}
        </div>

        <div
          className="slp-tablist slp-tabs-buttons"
          role="tablist"
          aria-label="SoundLegend sections"
        >
          {tabs.map((t) => {
            const disabled = !!t.disabled;

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
                <span className="slp-tab-label">{t.label}</span>
                {disabled && t.tooltip ? (
                  <span className="slp-tab-tooltip">{t.tooltip}</span>
                ) : null}
              </button>
            );
          })}
        </div>
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

  useEffect(() => {
    if (!isAdmin) return;
    if (!qpImpersonateUid) return;

    sessionStorage.setItem('impersonateUid', qpImpersonateUid);
    sessionStorage.setItem('impersonateMode', 'admin');

    if (qpImpersonateName) {
      sessionStorage.setItem('impersonateName', qpImpersonateName);
    }
    if (qpImpersonateEmail) {
      sessionStorage.setItem('impersonateEmail', qpImpersonateEmail);
    }

    window.dispatchEvent(new Event('impersonation-changed'));

    try {
      const clean = new URLSearchParams(location.search);
      clean.delete('impersonateUid');
      clean.delete('impersonateName');
      clean.delete('impersonateEmail');

      const nextSearch = clean.toString();
      const nextUrl = nextSearch
        ? `${location.pathname}?${nextSearch}`
        : location.pathname;

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

  const [effectivePortalUser, setEffectivePortalUser] = useState(null);
  const [loadingEffectiveUser, setLoadingEffectiveUser] = useState(true);
  const [effectiveIsImpersonating, setEffectiveIsImpersonating] =
    useState(false);

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

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('progress');

  useEffect(() => {
    if (!effectivePortalUser || loadingEffectiveUser) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const ownerUid = effectivePortalUser.uid || effectivePortalUser.id;
        const colRef = collection(db, 'projects');

        let list = [];
        let seededProject = null;

        if (projectIdFromQuery) {
          try {
            const pRef = doc(db, 'projects', projectIdFromQuery);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              seededProject = { id: pSnap.id, ...pSnap.data() };
            }
          } catch (e) {
            console.warn(
              'Failed to fetch project by projectId query param:',
              e
            );
          }
        }

        let snap = { empty: true, docs: [] };

        if (ownerUid) {
          const qByOwner = query(colRef, where('ownerUid', '==', ownerUid));
          snap = await getDocs(qByOwner);
        }

        if (snap.empty && ownerUid) {
          const qByUserId = query(colRef, where('userId', '==', ownerUid));
          snap = await getDocs(qByUserId);
        }

        if (snap.empty && ownerUid) {
          const qByCustomerUserId = query(
            colRef,
            where('customerUserId', '==', ownerUid)
          );
          snap = await getDocs(qByCustomerUserId);
        }

        if (snap.empty && effectivePortalUser.email) {
          const emailLower = effectivePortalUser.email.trim().toLowerCase();
          const qByEmailLower = query(
            colRef,
            where('customer.emailLower', '==', emailLower)
          );
          snap = await getDocs(qByEmailLower);
        }

        if (snap.empty && effectivePortalUser.email) {
          const email = effectivePortalUser.email.trim();
          const emailLower = email.toLowerCase();

          const qByCustomerEmail = query(
            colRef,
            where('customerEmail', '==', email)
          );
          const snapA = await getDocs(qByCustomerEmail);
          if (!snapA.empty) snap = snapA;

          if (snap.empty) {
            const qByCustomerDotEmail = query(
              colRef,
              where('customer.email', '==', email)
            );
            const snapB = await getDocs(qByCustomerDotEmail);
            if (!snapB.empty) snap = snapB;
          }

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

          const map = new Map();
          [...(seededProject ? [seededProject] : []), ...fetched].forEach(
            (p) => {
              if (p?.id) map.set(p.id, p);
            }
          );

          list = Array.from(map.values());

          // newest first so the latest/active project is the default one
          list.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));

          setProjects(list);

          setSelectedId((prev) => {
            if (
              projectIdFromQuery &&
              list.some((p) => p.id === projectIdFromQuery)
            ) {
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

  const hasProject = !!selectedProject;
  const currentChapterIndex = useMemo(
    () => (selectedProject ? getProjectCurrentChapterIndex(selectedProject) : 0),
    [selectedProject]
  );

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

  const tabs = useMemo(() => {
    if (!hasProject) {
      return [
        { key: 'payments', label: 'Payment History' },
        { key: 'account', label: 'Account Settings' },
      ];
    }

    const nextTabs = [
      { key: 'progress', label: 'Build Progress' },
      { key: 'scope', label: 'Scope of Work' },
    ];

    if (currentChapterIndex >= 2 && isSoundLegendProject) {
      nextTabs.push({ key: 'vault', label: 'Vault Preferences' });
      nextTabs.push({ key: 'media', label: 'Media' });
    }

    if (currentChapterIndex >= 1) {
      nextTabs.push({ key: 'payments', label: 'Payment History' });
    }

    nextTabs.push({ key: 'account', label: 'Account Settings' });

    return nextTabs;
  }, [hasProject, currentChapterIndex, isSoundLegendProject]);

  useEffect(() => {
    const allowedKeys = tabs.map((t) => t.key);
    if (!allowedKeys.includes(tab)) {
      setTab(allowedKeys[0] || 'account');
    }
  }, [tabs, tab]);

  const handleTabChange = (nextKey) => {
    const allowedKeys = tabs.map((t) => t.key);
    if (!allowedKeys.includes(nextKey)) return;
    setTab(nextKey);
  };

  if (loadingPortalUser || loadingEffectiveUser) {
    return <div className="slp-page">Loading your SoundLegend portal…</div>;
  }

  if (!effectivePortalUser) {
    return <div className="slp-page">Please sign in to view your Artist Portal.</div>;
  }

  if (loading) {
    return <div className="slp-page">Loading your SoundLegend experience…</div>;
  }

  return (
    <div className="slp-page">
      {effectiveIsImpersonating && (
        <div className="slp-impersonation-banner">
          <div className="slp-impersonation-left">
            <span className="slp-impersonation-pill">Impersonating</span>
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

      <h1 className="slp-heading">
        Welcome to your Artist Portal
        {effectiveIsImpersonating ? ' (admin view)' : ''}
      </h1>

      {!hasProject ? (
        <>
          <Tabs
            tabs={tabs}
            current={tab}
            onChange={handleTabChange}
            projects={projects}
            selectedId={selectedId}
            onSelectProject={setSelectedId}
            showProjectPicker={false}
          />

          <div className="slp-panel">
            <div className="slp-empty-copy" style={{ marginBottom: 20 }}>
              Your build-specific portal areas will appear once your project is
              officially created and committed.
            </div>

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
        </>
      ) : (
        <>
          <Tabs
            tabs={tabs}
            current={tab}
            onChange={handleTabChange}
            projects={projects}
            selectedId={selectedId}
            onSelectProject={setSelectedId}
            showProjectPicker={projects.length > 1}
          />

          <div className="slp-panel">
            {tab === 'progress' && (
              <ProjectProgress project={selectedProject} isAdmin={isAdmin} />
            )}

            {tab === 'scope' && <ScopeOfWork project={selectedProject} />}

            {tab === 'vault' && isSoundLegendProject && currentChapterIndex >= 2 && (
              <VaultPreferences project={selectedProject} />
            )}

            {tab === 'media' && isSoundLegendProject && currentChapterIndex >= 2 && (
              <Media project={selectedProject} />
            )}

            {tab === 'payments' && currentChapterIndex >= 1 && (
              <PaymentHistory orders={orders} />
            )}

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
        </>
      )}
    </div>
  );
};

export default SoundLegendPortal;