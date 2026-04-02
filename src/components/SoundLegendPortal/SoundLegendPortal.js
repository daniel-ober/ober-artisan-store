import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
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

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeValue = (value) => String(value || '').trim();
const normalizeUpper = (value) => normalizeValue(value).toUpperCase();

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

const ProjectPicker = ({ projects, selectedId, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const shellRef = useRef(null);
  const menuRef = useRef(null);

  const hasMultipleProjects = Array.isArray(projects) && projects.length > 1;

  const current =
    projects?.find((p) => p.id === selectedId) || projects?.[0] || null;

  const labelFor = (p) => {
    const serial =
      p?.lineSerial || p?.globalSerial || p?.snareSerial || p?.serial || '';
    const line = p?.artisanLine || p?.series || 'Project';

    if (serial) return `${serial} · ${line}`;
    return `${line} · ${p?.id?.slice(0, 6) || 'Project'}`;
  };

  const updateMenuPosition = () => {
    if (!shellRef.current) return;

    const rect = shellRef.current.getBoundingClientRect();

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 100000,
    });
  };

  useEffect(() => {
    if (!open || !hasMultipleProjects) return;

    updateMenuPosition();

    const handleWindowChange = () => updateMenuPosition();

    const handleOutsideClick = (e) => {
      const clickedShell = shellRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);

      if (!clickedShell && !clickedMenu) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, hasMultipleProjects]);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  if (!hasMultipleProjects) return null;

  return (
    <div ref={shellRef} className="slp-picker-shell">
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

      {open &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            className="slp-picker-menu"
            style={menuStyle}
            role="listbox"
          >
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
          </div>,
          document.body
        )}
    </div>
  );
};

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
          <div className="slp-tabs-eyebrow">Workspace Navigation</div>
        </div>

        {showProjectPicker ? (
          <div className="slp-tabs-header-actions">
            <ProjectPicker
              projects={projects}
              selectedId={selectedId}
              onChange={onSelectProject}
            />
          </div>
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
  );
};

const extractProjectIdsFromUser = (portalUser) => {
  const raw = [
    ...(Array.isArray(portalUser?.projects) ? portalUser.projects : []),
    ...(Array.isArray(portalUser?.projectIds) ? portalUser.projectIds : []),
    ...(Array.isArray(portalUser?.assignedProjectIds)
      ? portalUser.assignedProjectIds
      : []),
    portalUser?.activeProjectId,
    portalUser?.projectId,
    portalUser?.linkedProjectId,
    portalUser?.latestProjectId,
  ].filter(Boolean);

  return Array.from(
    new Set(
      raw
        .map((entry) =>
          typeof entry === 'string'
            ? entry
            : entry?.projectId || entry?.id || entry?.projectID || ''
        )
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );
};

const extractOrderIdsFromUser = (portalUser) => {
  const raw = [
    ...(Array.isArray(portalUser?.orderIds) ? portalUser.orderIds : []),
    ...(Array.isArray(portalUser?.orders) ? portalUser.orders : []),
    portalUser?.orderId,
    portalUser?.latestOrderId,
  ].filter(Boolean);

  return Array.from(
    new Set(
      raw
        .map((entry) =>
          typeof entry === 'string'
            ? entry
            : entry?.orderId || entry?.id || entry?.orderID || ''
        )
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );
};

const getPortalUserLookup = (portalUser = {}) => {
  const uidValues = Array.from(
    new Set(
      [
        portalUser?.uid,
        portalUser?.id,
        portalUser?.userId,
        portalUser?.customerUid,
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  const emailValues = Array.from(
    new Set(
      [
        portalUser?.email,
        portalUser?.customerEmail,
        portalUser?.contactEmail,
      ]
        .map((v) => normalizeEmail(v))
        .filter(Boolean)
    )
  );

  const nameValues = Array.from(
    new Set(
      [
        portalUser?.fullName,
        [portalUser?.firstName || '', portalUser?.lastName || '']
          .join(' ')
          .trim(),
        portalUser?.displayName,
        portalUser?.name,
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  const projectIds = extractProjectIdsFromUser(portalUser);
  const orderIds = extractOrderIdsFromUser(portalUser);

  return {
    uidValues,
    emailValues,
    nameValues,
    projectIds,
    orderIds,
  };
};

const getProjectCandidateValues = (project = {}) => {
  const uidValues = Array.from(
    new Set(
      [
        project?.ownerUid,
        project?.userId,
        project?.uid,
        project?.customerUid,
        project?.assignedToUid,
        project?.artistUid,
        project?.clientUid,
        project?.customer?.uid,
        project?.owner?.uid,
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  const emailValues = Array.from(
    new Set(
      [
        project?.email,
        project?.customerEmail,
        project?.contactEmail,
        project?.artistEmail,
        project?.clientEmail,
        project?.customer?.email,
        project?.owner?.email,
      ]
        .map((v) => normalizeEmail(v))
        .filter(Boolean)
    )
  );

  const nameValues = Array.from(
    new Set(
      [
        project?.customerName,
        project?.fullName,
        project?.artistName,
        project?.clientName,
        project?.customer?.name,
        [project?.customer?.firstName || '', project?.customer?.lastName || '']
          .join(' ')
          .trim(),
        [project?.firstName || '', project?.lastName || ''].join(' ').trim(),
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  const orderValues = Array.from(
    new Set(
      [
        project?.orderId,
        project?.linkedOrderId,
        project?.sourceOrderId,
        ...(Array.isArray(project?.orderIds) ? project.orderIds : []),
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  const projectValues = Array.from(
    new Set(
      [
        project?.id,
        project?.projectId,
        project?.linkedProjectId,
        project?.activeProjectId,
      ]
        .map((v) => normalizeValue(v))
        .filter(Boolean)
    )
  );

  return {
    uidValues,
    emailValues,
    nameValues,
    orderValues,
    projectValues,
  };
};

const projectMatchesPortalUser = ({ project, lookup, isAdminUser }) => {
  if (!project?.id) return false;
  if (isAdminUser) return true;

  const candidate = getProjectCandidateValues(project);

  const byExplicitProjectId = lookup.projectIds.some((id) =>
    candidate.projectValues.includes(id)
  );

  const byUid = lookup.uidValues.some((uid) => candidate.uidValues.includes(uid));

  const byEmail = lookup.emailValues.some((email) =>
    candidate.emailValues.includes(email)
  );

  const byOrder = lookup.orderIds.some((orderId) =>
    candidate.orderValues.includes(orderId)
  );

  const byName =
    lookup.nameValues.length > 0 &&
    candidate.nameValues.length > 0 &&
    lookup.nameValues.some((name) => candidate.nameValues.includes(name));

  return byExplicitProjectId || byUid || byEmail || byOrder || byName;
};

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

  const projectIdFromQuery = normalizeValue(queryParams.get('projectId') || '');
  const qpImpersonateUid = normalizeValue(queryParams.get('impersonateUid') || '');
  const qpImpersonateName = normalizeValue(
    queryParams.get('impersonateName') || ''
  );
  const qpImpersonateEmail = normalizeValue(
    queryParams.get('impersonateEmail') || ''
  );

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
                data.fullName ||
                [data.firstName || '', data.lastName || ''].join(' ').trim() ||
                impersonateName ||
                '',
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
        const matches = new Map();
        const lookup = getPortalUserLookup(effectivePortalUser);

        const addProject = (project) => {
          if (!project?.id) return;
          if (
            projectMatchesPortalUser({
              project,
              lookup,
              isAdminUser: isAdmin,
            })
          ) {
            matches.set(String(project.id), project);
          }
        };

        if (projectIdFromQuery) {
          try {
            const pRef = doc(db, 'projects', projectIdFromQuery);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              addProject({ id: pSnap.id, ...pSnap.data() });
            }
          } catch (e) {
            console.warn('Failed to fetch project by query param:', e);
          }
        }

        for (const projectId of lookup.projectIds) {
          try {
            const pRef = doc(db, 'projects', projectId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              addProject({ id: pSnap.id, ...pSnap.data() });
            }
          } catch (err) {
            console.warn('Failed to fetch allowed project:', err);
          }
        }

        for (const uid of lookup.uidValues) {
          const uidQueries = [
            query(collection(db, 'projects'), where('ownerUid', '==', uid)),
            query(collection(db, 'projects'), where('userId', '==', uid)),
            query(collection(db, 'projects'), where('uid', '==', uid)),
            query(collection(db, 'projects'), where('customerUid', '==', uid)),
            query(collection(db, 'projects'), where('artistUid', '==', uid)),
            query(collection(db, 'projects'), where('clientUid', '==', uid)),
          ];

          for (const qRef of uidQueries) {
            try {
              const snap = await getDocs(qRef);
              snap.forEach((docSnap) =>
                addProject({ id: docSnap.id, ...docSnap.data() })
              );
            } catch (err) {
              console.warn('Project UID query failed:', err);
            }
          }
        }

        for (const email of lookup.emailValues) {
          const emailQueries = [
            query(collection(db, 'projects'), where('email', '==', email)),
            query(collection(db, 'projects'), where('customerEmail', '==', email)),
            query(collection(db, 'projects'), where('contactEmail', '==', email)),
            query(collection(db, 'projects'), where('artistEmail', '==', email)),
            query(collection(db, 'projects'), where('clientEmail', '==', email)),
            query(collection(db, 'projects'), where('customer.email', '==', email)),
            query(collection(db, 'projects'), where('owner.email', '==', email)),
          ];

          for (const qRef of emailQueries) {
            try {
              const snap = await getDocs(qRef);
              snap.forEach((docSnap) =>
                addProject({ id: docSnap.id, ...docSnap.data() })
              );
            } catch (err) {
              console.warn('Project email query failed:', err);
            }
          }
        }

        for (const orderId of lookup.orderIds) {
          const orderQueries = [
            query(collection(db, 'projects'), where('orderId', '==', orderId)),
            query(collection(db, 'projects'), where('linkedOrderId', '==', orderId)),
            query(collection(db, 'projects'), where('sourceOrderId', '==', orderId)),
          ];

          for (const qRef of orderQueries) {
            try {
              const snap = await getDocs(qRef);
              snap.forEach((docSnap) =>
                addProject({ id: docSnap.id, ...docSnap.data() })
              );
            } catch (err) {
              console.warn('Project order query failed:', err);
            }
          }
        }

        if (matches.size === 0) {
          try {
            const allProjectsSnap = await getDocs(collection(db, 'projects'));
            allProjectsSnap.forEach((docSnap) => {
              addProject({ id: docSnap.id, ...docSnap.data() });
            });
          } catch (err) {
            console.warn('Fallback full project scan failed:', err);
          }
        }

        const list = Array.from(matches.values());
        list.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));

        if (!cancelled) {
          setProjects(list);

          setSelectedId((prev) => {
            if (
              projectIdFromQuery &&
              list.some((p) => String(p.id) === String(projectIdFromQuery))
            ) {
              return projectIdFromQuery;
            }

            if (prev && list.some((p) => String(p.id) === String(prev))) {
              return prev;
            }

            return list[0]?.id || '';
          });
        }
      } catch (e) {
        console.error('Error loading projects', e);
        if (!cancelled) {
          setProjects([]);
          setSelectedId('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [effectivePortalUser, loadingEffectiveUser, projectIdFromQuery, isAdmin]);

  useEffect(() => {
    if (loadingEffectiveUser || !effectivePortalUser) return;

    let cancelled = false;

    const run = async () => {
      try {
        const orderIds = extractOrderIdsFromUser(effectivePortalUser);
        const items = [];

        for (const orderId of orderIds) {
          try {
            const snap = await getDoc(doc(db, 'orders', orderId));
            if (snap.exists()) {
              items.push({ id: snap.id, ...snap.data() });
            }
          } catch (err) {
            console.warn('Order fetch skipped/failed:', err);
          }
        }

        if (cancelled) return;

        items.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));
        setOrders(items);
      } catch (e) {
        console.warn('Order fetch skipped/failed', e);
        if (!cancelled) setOrders([]);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [effectivePortalUser, loadingEffectiveUser]);

  const selectedProject = useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) return null;

    if (selectedId) {
      const matched = projects.find((p) => String(p.id) === String(selectedId));
      if (matched) return matched;
    }

    return projects[0] || null;
  }, [projects, selectedId]);

  const latestOrder = useMemo(() => (orders.length ? orders[0] : null), [orders]);

  const hasProject = Array.isArray(projects) && projects.length > 0;

  const currentChapterIndex = useMemo(
    () => (selectedProject ? getProjectCurrentChapterIndex(selectedProject) : 0),
    [selectedProject]
  );

  const artisanLine = (selectedProject?.artisanLine || '').toLowerCase();
  const serialGuess = normalizeUpper(
    selectedProject?.lineSerial ||
      selectedProject?.snareSerial ||
      selectedProject?.serial ||
      selectedProject?.id ||
      ''
  );

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

  const [didAutoSelectProgress, setDidAutoSelectProgress] = useState(false);

  useEffect(() => {
    if (loading) return;

    const allowedKeys = tabs.map((t) => t.key);

    if (!allowedKeys.length) {
      if (tab !== 'account') {
        setTab('account');
      }
      return;
    }

    if (!allowedKeys.includes(tab)) {
      setTab(allowedKeys[0] || 'account');
      return;
    }

    if (
      !isAdmin &&
      hasProject &&
      !didAutoSelectProgress &&
      allowedKeys.includes('progress')
    ) {
      setTab('progress');
      setDidAutoSelectProgress(true);
    }
  }, [tabs, tab, hasProject, isAdmin, loading, didAutoSelectProgress]);

  const handleTabChange = (nextKey) => {
    const allowedKeys = tabs.map((t) => t.key);
    if (!allowedKeys.includes(nextKey)) return;
    setTab(nextKey);
  };

  if (loadingPortalUser || loadingEffectiveUser) {
    return <div className="slp-page">Loading your SoundLegend portal…</div>;
  }

  if (!effectivePortalUser) {
    return (
      <div className="slp-page">Please sign in to view your Artist Portal.</div>
    );
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

      <div className="slp-portal-hero">
        <div className="slp-portal-hero-kicker">
          {effectiveIsImpersonating ? 'Admin Portal View' : 'Artist Portal'}
        </div>
        <h1 className="slp-heading">
          {effectiveIsImpersonating
            ? 'Viewing Artist Workspace'
            : 'Your Artist Workspace'}
        </h1>
        <p className="slp-portal-hero-subtitle">
          Follow your project, review approved details, and stay connected to
          each chapter of your build.
        </p>
      </div>

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
                isImpersonating={effectiveIsImpersonating}
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
            <div
              className={`slp-tab-panel ${tab === 'progress' ? 'is-active' : ''}`}
              hidden={tab !== 'progress'}
            >
              <ProjectProgress project={selectedProject} isAdmin={isAdmin} />
            </div>

            <div
              className={`slp-tab-panel ${tab === 'scope' ? 'is-active' : ''}`}
              hidden={tab !== 'scope'}
            >
              <ScopeOfWork project={selectedProject} />
            </div>

            {isSoundLegendProject && currentChapterIndex >= 2 && (
              <div
                className={`slp-tab-panel ${tab === 'vault' ? 'is-active' : ''}`}
                hidden={tab !== 'vault'}
              >
                <VaultPreferences project={selectedProject} />
              </div>
            )}

            {isSoundLegendProject && currentChapterIndex >= 2 && (
              <div
                className={`slp-tab-panel ${tab === 'media' ? 'is-active' : ''}`}
                hidden={tab !== 'media'}
              >
                <Media project={selectedProject} />
              </div>
            )}

            {currentChapterIndex >= 1 && (
              <div
                className={`slp-tab-panel ${tab === 'payments' ? 'is-active' : ''}`}
                hidden={tab !== 'payments'}
              >
                <PaymentHistory orders={orders} />
              </div>
            )}

            <div
              className={`slp-tab-panel ${tab === 'account' ? 'is-active' : ''}`}
              hidden={tab !== 'account'}
            >
              <AccountSettings
                user={effectivePortalUser}
                projects={projects}
                orders={orders}
                latestOrder={latestOrder}
                isAdmin={isAdmin}
                isImpersonating={effectiveIsImpersonating}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SoundLegendPortal;