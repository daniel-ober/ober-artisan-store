import React, { useEffect, useMemo, useState } from 'react';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebaseConfig';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { useImpersonation } from '../context/ImpersonationContext';
import './ManageUsers.css';

const auth = getAuth();

const isAdminUser = (user) => !!user?.isAdmin;

const normalizeEmail = (email = '') =>
  String(email || '')
    .trim()
    .toLowerCase();

const normalizePhoneDigits = (phone = '') =>
  String(phone || '')
    .replace(/\D/g, '')
    .replace(/^1(?=\d{10}$)/, '');

const formatMaybeDate = (value) => {
  if (!value) return '';
  try {
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
    return '';
  } catch {
    return '';
  }
};

const scoreUserForDisplay = (user) => {
  let score = 0;
  if (user.uid) score += 100;
  if (user.portalAccessGranted) score += 40;
  if (user.portalInviteSent) score += 30;
  if (user.authAccountCreated) score += 20;
  if (user.isSoundlegend) score += 15;
  if (user.fullName && user.fullName !== '—') score += 10;
  if (user.firstName || user.lastName) score += 5;
  if (user.isAdmin) score -= 500;
  return score;
};

const mergeUsersForDisplay = (base, incoming) => {
  return {
    ...base,
    ...incoming,
    id:
      incoming.uid || base.uid
        ? incoming.uid || base.uid
        : incoming.id || base.id,
    uid: incoming.uid || base.uid || '',
    email: normalizeEmail(incoming.email || base.email || ''),
    firstName: incoming.firstName || base.firstName || '',
    lastName: incoming.lastName || base.lastName || '',
    fullName:
      incoming.fullName ||
      base.fullName ||
      `${incoming.firstName || base.firstName || ''} ${incoming.lastName || base.lastName || ''}`.trim(),
    phone: incoming.phone || base.phone || '',
    isSoundlegend: !!(base.isSoundlegend || incoming.isSoundlegend),
    isAdmin: !!(base.isAdmin || incoming.isAdmin),
    slPortalLocked:
      typeof incoming.slPortalLocked === 'boolean'
        ? incoming.slPortalLocked
        : base.slPortalLocked,
    portalAccessGranted:
      typeof incoming.portalAccessGranted === 'boolean'
        ? incoming.portalAccessGranted
        : base.portalAccessGranted,
    portalInviteSent: !!(base.portalInviteSent || incoming.portalInviteSent),
    authAccountCreated: !!(
      base.authAccountCreated ||
      incoming.authAccountCreated ||
      incoming.uid
    ),
    lastWelcomeEmailSentAt:
      incoming.lastWelcomeEmailSentAt || base.lastWelcomeEmailSentAt || null,
    lastLoginAt:
      incoming.lastLoginAt ||
      incoming.lastSignInAt ||
      base.lastLoginAt ||
      base.lastSignInAt ||
      null,
    lastSignInAt:
      incoming.lastSignInAt ||
      incoming.lastLoginAt ||
      base.lastSignInAt ||
      base.lastLoginAt ||
      null,
  };
};

const dedupeUsersByEmail = (usersList = []) => {
  const grouped = new Map();

  usersList.forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email);
    const key = normalizedEmail || `doc:${user.id}`;

    if (!grouped.has(key)) {
      grouped.set(key, user);
      return;
    }

    const existing = grouped.get(key);
    const winner =
      scoreUserForDisplay(user) > scoreUserForDisplay(existing)
        ? mergeUsersForDisplay(user, existing)
        : mergeUsersForDisplay(existing, user);

    grouped.set(key, winner);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const aAdmin = a.isAdmin ? 1 : 0;
    const bAdmin = b.isAdmin ? 1 : 0;
    if (aAdmin !== bAdmin) return aAdmin - bAdmin;

    const aName = (a.fullName || a.email || '').toLowerCase();
    const bName = (b.fullName || b.email || '').toLowerCase();
    return aName.localeCompare(bName);
  });
};

const yesNo = (value) => (value ? 'Yes' : 'No');

const getDisplayName = (user) =>
  user?.fullName ||
  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
  '—';

const copyText = async (value) => {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(String(value));
    return true;
  } catch {
    return false;
  }
};

const ActionModal = ({
  open,
  type = 'info',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  isBusy = false,
  hideCancel = false,
}) => {
  if (!open) return null;

  return (
    <div
      className="manage-users-action-overlay"
      onClick={isBusy ? undefined : onClose}
    >
      <div
        className={`manage-users-action-modal ${type}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="manage-users-action-kicker">
          {type === 'success'
            ? 'Success'
            : type === 'error'
              ? 'Something went wrong'
              : type === 'confirm'
                ? 'Please confirm'
                : 'Notice'}
        </div>

        <h3 className="manage-users-action-title">{title}</h3>

        <div className="manage-users-action-message">
          {String(message || '')
            .split('\n')
            .map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
        </div>

        <div className="manage-users-action-buttons">
          {!hideCancel ? (
            <button
              type="button"
              className="manage-users-action-btn secondary"
              onClick={onClose}
              disabled={isBusy}
            >
              {cancelLabel}
            </button>
          ) : null}

          <button
            type="button"
            className={`manage-users-action-btn ${
              type === 'error' ? 'danger' : 'primary'
            }`}
            onClick={onConfirm || onClose}
            disabled={isBusy}
          >
            {isBusy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCell = ({ label, value, subtle = false, meta = '' }) => (
  <div className={`mu-stat-cell ${subtle ? 'is-subtle' : ''}`}>
    <div className="mu-stat-label">{label}</div>
    <div className="mu-stat-value">{value || '—'}</div>
    {meta ? <div className="mu-meta-line">{meta}</div> : null}
  </div>
);

const ResourceCard = ({
  title,
  items = [],
  emptyText,
  onAttachClick,
  onCopyId,
  kind,
}) => {
  return (
    <div className="mu-resource-card">
      <div className="mu-resource-card-head">
        <div>
          <h4>{title}</h4>
          <div className="mu-resource-card-count">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mu-resource-empty">{emptyText}</div>
      ) : (
        <div className="mu-resource-list">
          {items.map((item) => (
            <div key={`${kind}-${item.id}`} className="mu-resource-row">
              <div className="mu-resource-copy">
                <div className="mu-resource-title">
                  {item.title || item.name || item.label || item.id}
                </div>
                <div className="mu-resource-meta">{item.meta || '—'}</div>
              </div>

              <div className="mu-resource-actions">
                <button
                  type="button"
                  className="mu-inline-btn"
                  onClick={() => onCopyId?.(item.id)}
                >
                  Copy ID
                </button>
                <button
                  type="button"
                  className="mu-inline-btn secondary"
                  onClick={() => onAttachClick?.(item)}
                >
                  Re-attach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UnassignedBucket = ({ title, items = [], emptyText, onAttach, kind }) => {
  return (
    <div className="mu-unassigned-card">
      <div className="mu-unassigned-head">
        <h4>{title}</h4>
        <span>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="mu-resource-empty">{emptyText}</div>
      ) : (
        <div className="mu-unassigned-list">
          {items.map((item) => (
            <div key={`${kind}-${item.id}`} className="mu-unassigned-row">
              <div className="mu-unassigned-copy">
                <div className="mu-unassigned-title">
                  {item.title || item.name || item.label || item.id}
                </div>
                <div className="mu-unassigned-meta">{item.meta || '—'}</div>
              </div>

              <button
                type="button"
                className="mu-inline-btn"
                onClick={() => onAttach(item)}
              >
                Attach
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [soundlegendRequests, setSoundlegendRequests] = useState([]);
  const [endorsements, setEndorsements] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeAttachUserId, setActiveAttachUserId] = useState(null);

  const [actionModal, setActionModal] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    hideCancel: false,
    onConfirm: null,
  });

  const { startImpersonation } = useImpersonation();

  const openInfoModal = ({
    type = 'info',
    title,
    message,
    confirmLabel = 'OK',
    hideCancel = true,
  }) => {
    setActionModal({
      open: true,
      type,
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancel',
      hideCancel,
      onConfirm: null,
    });
  };

  const openConfirmModal = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
  }) => {
    setActionModal({
      open: true,
      type: 'confirm',
      title,
      message,
      confirmLabel,
      cancelLabel,
      hideCancel: false,
      onConfirm,
    });
  };

  const closeActionModal = () => {
    setActionModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const refreshAll = async () => {
    try {
      setPageLoading(true);

      const [
        userSnapshot,
        projectSnapshot,
        orderSnapshot,
        slSnapshot,
        endorsementSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'soundlegend_submissions')),
        getDocs(collection(db, 'endorsement_applications')),
      ]);

      const rawUsers = userSnapshot.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const fullName = data.fullName || `${firstName} ${lastName}`.trim();

        const derivedUid =
          data.uid || (docSnap.id.startsWith('lead_') ? '' : docSnap.id);

        const derivedAuthAccountCreated =
          !!data.authAccountCreated || !!derivedUid;

        return {
          id: docSnap.id,
          docId: docSnap.id,
          uid: derivedUid,
          email: normalizeEmail(data.email || ''),
          firstName,
          lastName,
          fullName: fullName || '—',
          phone: data.phone || '',
          status: data.status || 'active',
          isSoundlegend: !!data.isSoundlegend,
          isAdmin: !!data.isAdmin,
          slPortalLocked: !!data.slPortalLocked,
          portalAccessGranted: !!data.portalAccessGranted,
          portalInviteSent: !!data.portalInviteSent,
          authAccountCreated: derivedAuthAccountCreated,
          lastWelcomeEmailSentAt:
            data.lastWelcomeEmailSentAt || data.welcomeEmailSentAt || null,
          lastLoginAt: data.lastLoginAt || data.lastSignInAt || null,
          lastSignInAt: data.lastSignInAt || data.lastLoginAt || null,
          projectIds: Array.isArray(data.projectIds) ? data.projectIds : [],
          orderIds: Array.isArray(data.orderIds) ? data.orderIds : [],
        };
      });

      const projectRows = projectSnapshot.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          userId: data.userId || data.ownerUid || '',
          customerEmail: normalizeEmail(
            data.customerEmail || data.ownerEmail || data.customer?.email || ''
          ),
          customerPhone: normalizePhoneDigits(
            data.customerPhone || data.customer?.phone || ''
          ),
          title:
            data.label ||
            data.projectName ||
            data.title ||
            `${data.artisanLine || 'Project'} ${data.width || data.diameter || ''}${data.depth || data.shellDepth ? ` × ${data.depth || data.shellDepth}` : ''}`.trim() ||
            'Untitled Project',
          meta: [data.currentPhase || 'No phase', d.id]
            .filter(Boolean)
            .join(' • '),
          raw: data,
        };
      });

      const orderRows = orderSnapshot.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          userId: data.userId || '',
          customerEmail: normalizeEmail(
            data.customerEmail ||
              data.email ||
              data.paymentMethodDetails?.email ||
              ''
          ),
          customerPhone: normalizePhoneDigits(data.phone || ''),
          title: data.customerName || `Order ${d.id}`,
          meta: [data.status || data.overviewStatus || 'No status', d.id]
            .filter(Boolean)
            .join(' • '),
          raw: data,
        };
      });

      const slRows = slSnapshot.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          userId: data.userId || data.linkedUserId || '',
          customerEmail: normalizeEmail(data.email || ''),
          customerPhone: normalizePhoneDigits(data.phone || ''),
          title:
            `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
            data.email ||
            `SL Request ${d.id}`,
          meta: [
            data.status || data.overviewStatus || 'No status',
            data.projectId ? `Project ${data.projectId}` : null,
          ]
            .filter(Boolean)
            .join(' • '),
          raw: data,
        };
      });

      const endorsementRows = endorsementSnapshot.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          userId: data.userId || data.linkedUserId || '',
          customerEmail: normalizeEmail(data.email || ''),
          customerPhone: normalizePhoneDigits(data.phone || ''),
          title: data.fullName || data.email || `Endorsement ${d.id}`,
          meta: [
            data.status || data.overviewStatus || 'No status',
            data.stageName || null,
          ]
            .filter(Boolean)
            .join(' • '),
          raw: data,
        };
      });

      setUsers(dedupeUsersByEmail(rawUsers));
      setProjects(projectRows);
      setOrders(orderRows);
      setSoundlegendRequests(slRows);
      setEndorsements(endorsementRows);
    } catch (error) {
      console.error('Error loading Manage Users data:', error);
      openInfoModal({
        type: 'error',
        title: 'Could not load user workspace',
        message:
          'There was a problem loading users and linked resources. Please refresh and try again.',
      });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const haystack = [
        user.email,
        user.firstName,
        user.lastName,
        user.fullName,
        user.id,
        user.uid,
      ]
        .map((v) => (v || '').toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }, [users, searchQuery]);

  const userResourceMap = useMemo(() => {
    const map = new Map();

    const ensureBucket = (userId) => {
      if (!map.has(userId)) {
        map.set(userId, {
          projects: [],
          orders: [],
          soundlegend: [],
          endorsements: [],
        });
      }
      return map.get(userId);
    };

    const usersById = new Map();
    const usersByEmail = new Map();
    const usersByPhone = new Map();

    users.forEach((user) => {
      const canonicalUserId = user.uid || user.id;
      usersById.set(canonicalUserId, user);
      usersById.set(user.id, user);

      const email = normalizeEmail(user.email);
      const phone = normalizePhoneDigits(user.phone);

      if (email) usersByEmail.set(email, user);
      if (phone) usersByPhone.set(phone, user);
    });

    const resolveUserForItem = (item) => {
      const explicitUserId = item.userId;
      if (explicitUserId && usersById.has(explicitUserId)) {
        return usersById.get(explicitUserId);
      }

      if (item.customerEmail && usersByEmail.has(item.customerEmail)) {
        return usersByEmail.get(item.customerEmail);
      }

      if (item.customerPhone && usersByPhone.has(item.customerPhone)) {
        return usersByPhone.get(item.customerPhone);
      }

      return null;
    };

    projects.forEach((item) => {
      const user = resolveUserForItem(item);
      if (!user) return;
      ensureBucket(user.uid || user.id).projects.push(item);
    });

    orders.forEach((item) => {
      const user = resolveUserForItem(item);
      if (!user) return;
      ensureBucket(user.uid || user.id).orders.push(item);
    });

    soundlegendRequests.forEach((item) => {
      const user = resolveUserForItem(item);
      if (!user) return;
      ensureBucket(user.uid || user.id).soundlegend.push(item);
    });

    endorsements.forEach((item) => {
      const user = resolveUserForItem(item);
      if (!user) return;
      ensureBucket(user.uid || user.id).endorsements.push(item);
    });

    return map;
  }, [users, projects, orders, soundlegendRequests, endorsements]);

  const unassigned = useMemo(() => {
    const usersById = new Set(users.map((u) => u.uid || u.id));
    const usersByEmail = new Set(
      users.map((u) => normalizeEmail(u.email)).filter(Boolean)
    );
    const usersByPhone = new Set(
      users.map((u) => normalizePhoneDigits(u.phone)).filter(Boolean)
    );

    const isLinked = (item) => {
      if (item.userId && usersById.has(item.userId)) return true;
      if (item.customerEmail && usersByEmail.has(item.customerEmail))
        return true;
      if (item.customerPhone && usersByPhone.has(item.customerPhone))
        return true;
      return false;
    };

    return {
      projects: projects.filter((item) => !isLinked(item)),
      orders: orders.filter((item) => !isLinked(item)),
      soundlegend: soundlegendRequests.filter((item) => !isLinked(item)),
      endorsements: endorsements.filter((item) => !isLinked(item)),
    };
  }, [users, projects, orders, soundlegendRequests, endorsements]);

  const updateLocalUser = (idOrEmail, patch) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        const emailMatch =
          normalizeEmail(idOrEmail) &&
          normalizeEmail(u.email) === normalizeEmail(idOrEmail);

        if (u.id === idOrEmail || u.uid === idOrEmail || emailMatch) {
          return { ...u, ...patch };
        }
        return u;
      });

      return dedupeUsersByEmail(next);
    });

    setSelectedUser((prev) => {
      if (!prev) return prev;

      const emailMatch =
        normalizeEmail(idOrEmail) &&
        normalizeEmail(prev.email) === normalizeEmail(idOrEmail);

      if (prev.id === idOrEmail || prev.uid === idOrEmail || emailMatch) {
        return { ...prev, ...patch };
      }
      return prev;
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleViewUser = (user) => {
    if (isAdminUser(user)) {
      openInfoModal({
        type: 'info',
        title: 'Admin account',
        message:
          'Admin users are read-only in this screen.\n\nUpdate admin flags directly in Firestore if needed.',
      });
      return;
    }

    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleAddUser = () => setIsAddModalOpen(true);
  const handleAddUserClose = () => setIsAddModalOpen(false);

  const getPortalStatus = (user) => {
    if (
      !user?.isSoundlegend &&
      !user?.portalInviteSent &&
      !user?.authAccountCreated
    ) {
      return {
        label: 'Portal inactive',
        className: 'off',
      };
    }

    if (user.portalAccessGranted && !user.slPortalLocked) {
      return {
        label: 'Portal active',
        className: 'unlocked',
      };
    }

    return {
      label: 'Portal inactive',
      className: 'locked',
    };
  };

  const handleTogglePortalAccess = (user) => {
    const canonicalId = user?.uid || user?.id;
    if (!canonicalId) return;

    if (isAdminUser(user)) {
      openInfoModal({
        type: 'info',
        title: 'Admin account',
        message:
          'Admin users are managed via Firestore and cannot be edited here.',
      });
      return;
    }

    const isCurrentlyActive =
      user.isSoundlegend && !user.slPortalLocked && user.portalAccessGranted;

    const nextLocked = isCurrentlyActive;
    const nextGranted = !isCurrentlyActive;
    const nextIsSoundlegend = true;

    const confirmTitle = isCurrentlyActive
      ? 'Expire portal access?'
      : 'Restore portal access?';

    const confirmMessage = isCurrentlyActive
      ? `This will expire portal access for ${user.email}.\n\nThey will no longer be able to use the SoundLegend portal until access is restored.`
      : `This will restore portal access for ${user.email}.\n\nThey will be able to use the SoundLegend portal again.`;

    openConfirmModal({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: isCurrentlyActive ? 'Expire Access' : 'Restore Access',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setLoadingActionId(canonicalId);

        try {
          closeActionModal();

          await updateDoc(doc(db, 'users', canonicalId), {
            isSoundlegend: nextIsSoundlegend,
            slPortalLocked: nextLocked,
            portalLocked: nextLocked,
            slPortalExpired: nextLocked,
            portalExpired: nextLocked,
            portalAccessGranted: nextGranted,
            portalStatus: nextGranted ? 'active' : 'expired',
            access: {
              soundlegend: nextGranted,
              soundLegend: nextGranted,
            },
          });

          updateLocalUser(user.email || canonicalId, {
            id: canonicalId,
            uid: canonicalId,
            isSoundlegend: nextIsSoundlegend,
            slPortalLocked: nextLocked,
            portalLocked: nextLocked,
            slPortalExpired: nextLocked,
            portalExpired: nextLocked,
            portalAccessGranted: nextGranted,
          });

          openInfoModal({
            type: 'success',
            title: nextGranted ? 'Portal restored' : 'Portal expired',
            message: nextGranted
              ? `${user.email} can access the Artist Portal again.`
              : `${user.email} no longer has active Artist Portal access.`,
          });
        } catch (err) {
          console.error('Failed to update portal access:', err);
          openInfoModal({
            type: 'error',
            title: 'Could not update portal access',
            message:
              'There was a problem updating this user’s portal access. Please try again.',
          });
        } finally {
          setLoadingActionId(null);
        }
      },
    });
  };

  const handleSendResetEmail = (user) => {
    if (isAdminUser(user)) {
      openInfoModal({
        type: 'info',
        title: 'Admin account',
        message:
          'Admin password resets should be handled manually through Firebase Auth / Admin tools, not this UI.',
      });
      return;
    }

    if (!user?.email || user.email === 'N/A') {
      openInfoModal({
        type: 'error',
        title: 'No valid email',
        message: 'There is no valid email address on file for this user.',
      });
      return;
    }

    openConfirmModal({
      title: 'Send password reset email?',
      message: `Send a password reset email to ${user.email}?\n\nUse this when the artist has already set their password and needs a new reset link.`,
      confirmLabel: 'Send Reset Email',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setLoadingActionId(user.uid || user.id);

        try {
          closeActionModal();
          await sendPasswordResetEmail(auth, user.email);

          openInfoModal({
            type: 'success',
            title: 'Password reset email sent',
            message: `${user.email} has been sent a password reset email.\n\nThey can use that link to reset their password and sign back in.`,
          });
        } catch (err) {
          console.error('Failed to send reset email:', err);
          openInfoModal({
            type: 'error',
            title: 'Could not send reset email',
            message:
              'There was a problem sending the password reset email. Please try again.',
          });
        } finally {
          setLoadingActionId(null);
        }
      },
    });
  };

  const handleSendWelcomeEmail = (user) => {
    if (isAdminUser(user)) {
      openInfoModal({
        type: 'info',
        title: 'Admin account',
        message:
          'Admin accounts do not get the SoundLegend welcome email from this screen.',
      });
      return;
    }

    if (!user?.email || user.email === 'N/A') {
      openInfoModal({
        type: 'error',
        title: 'No valid email',
        message: 'There is no valid email address on file for this user.',
      });
      return;
    }

    const confirmTitle = user.portalInviteSent
      ? 'Re-send welcome email?'
      : 'Send welcome email?';

    const confirmMessage = user.portalInviteSent
      ? `Re-send the SoundLegend welcome email to ${user.email}?\n\nThis will send them another create-password / portal access email.`
      : `Send a SoundLegend welcome email to ${user.email}?\n\nThis will create the Firebase Auth account if needed, grant portal access, and send a create-password email.`;

    openConfirmModal({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: user.portalInviteSent
        ? 'Re-send Welcome Email'
        : 'Send Welcome Email',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setLoadingActionId(user.uid || user.id);

        try {
          closeActionModal();

          const sendWelcomeEmail = httpsCallable(
            functions,
            'sendSoundLegendWelcomeEmail'
          );

          const result = await sendWelcomeEmail({
            userId: user.uid || user.id,
            email: user.email,
            name: user.fullName || '',
          });

          const returnedUid = result?.data?.uid || user.uid || user.id;
          const now = new Date();

          updateLocalUser(user.email || returnedUid, {
            id: returnedUid,
            uid: returnedUid,
            isSoundlegend: true,
            slPortalLocked: false,
            portalLocked: false,
            slPortalExpired: false,
            portalExpired: false,
            portalAccessGranted: true,
            portalInviteSent: true,
            authAccountCreated: true,
            lastWelcomeEmailSentAt: now,
          });

          openInfoModal({
            type: 'success',
            title: user.portalInviteSent
              ? 'Welcome email re-sent'
              : 'Welcome email sent',
            message: `${user.email} has been sent a SoundLegend welcome email.\n\nThey should use the email link to create their password, then sign in at /artisan-portal/signin.`,
          });
        } catch (err) {
          console.error('Failed to send welcome email:', err);
          openInfoModal({
            type: 'error',
            title: 'Could not send welcome email',
            message: `We could not send the welcome email automatically.\n\n${
              err?.message || 'Please try again.'
            }`,
          });
        } finally {
          setLoadingActionId(null);
        }
      },
    });
  };

  const handleImpersonateUser = (user) => {
    const canonicalId = user?.uid || user?.id;
    if (!canonicalId) return;

    startImpersonation(canonicalId);
    sessionStorage.setItem('impersonateUid', canonicalId);
    sessionStorage.setItem('impersonateEmail', user.email || '');
    sessionStorage.setItem('impersonateName', user.fullName || '');

    window.open('/legacy', '_blank');
  };

  const handleCopy = async (label, value) => {
    const ok = await copyText(value);
    openInfoModal({
      type: ok ? 'success' : 'error',
      title: ok ? `${label} copied` : 'Copy failed',
      message: ok
        ? `${label} has been copied to your clipboard.`
        : `We could not copy that ${label.toLowerCase()} right now.`,
    });
  };

  const attachResourceToUser = async ({ user, item, type }) => {
    const canonicalUserId = user?.uid || user?.id;
    if (!canonicalUserId || !item?.id) return;

    const busyKey = `${canonicalUserId}:${type}:${item.id}`;
    setLoadingActionId(busyKey);

    try {
      const userRef = doc(db, 'users', canonicalUserId);

      if (type === 'project') {
        const projectRef = doc(db, 'projects', item.id);
        const raw = item.raw || {};
        const projectSummary = {
          projectId: item.id,
          label:
            raw.label ||
            raw.projectName ||
            raw.title ||
            item.title ||
            'Untitled Project',
          width: String(raw.diameter ?? raw.width ?? raw.shellWidth ?? ''),
          depth: String(raw.depth ?? raw.shellDepth ?? ''),
          staveQuantity: String(raw.staveQuantity ?? raw.staveCount ?? ''),
          updatedAt: Date.now(),
        };

        await Promise.all([
          updateDoc(projectRef, {
            userId: canonicalUserId,
            ownerUid: canonicalUserId,
          }),
          updateDoc(userRef, {
            projectIds: arrayUnion(item.id),
            projects: arrayUnion(projectSummary),
          }),
        ]);
      }

      if (type === 'order') {
        const orderRef = doc(db, 'orders', item.id);
        await Promise.all([
          updateDoc(orderRef, {
            userId: canonicalUserId,
          }),
          updateDoc(userRef, {
            orderIds: arrayUnion(item.id),
          }),
        ]);
      }

      if (type === 'soundlegend') {
        const submissionRef = doc(db, 'soundlegend_submissions', item.id);
        await updateDoc(submissionRef, {
          userId: canonicalUserId,
          linkedUserId: canonicalUserId,
        });
      }

      if (type === 'endorsement') {
        const endorsementRef = doc(db, 'endorsement_applications', item.id);
        await updateDoc(endorsementRef, {
          userId: canonicalUserId,
          linkedUserId: canonicalUserId,
        });
      }

      await refreshAll();

      openInfoModal({
        type: 'success',
        title: 'Resource attached',
        message: `${item.title || item.id} has been attached to ${getDisplayName(
          user
        )}.`,
      });
    } catch (err) {
      console.error(`Failed to attach ${type}:`, err);
      openInfoModal({
        type: 'error',
        title: 'Could not attach resource',
        message:
          'There was a problem attaching this resource to the user. Please try again.',
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  const buildUserSummary = (user) => {
    const canonicalUserId = user.uid || user.id;
    const bucket = userResourceMap.get(canonicalUserId) || {
      projects: [],
      orders: [],
      soundlegend: [],
      endorsements: [],
    };

    const lastWelcomeSent = formatMaybeDate(user.lastWelcomeEmailSentAt);
    const lastLoginSeen = formatMaybeDate(
      user.lastLoginAt || user.lastSignInAt
    );

    return {
      resources: bucket,
      hasProjects: bucket.projects.length > 0,
      hasOrders: bucket.orders.length > 0,
      hasSoundlegend: bucket.soundlegend.length > 0,
      hasEndorsements: bucket.endorsements.length > 0,
      hasAnyResources:
        bucket.projects.length > 0 ||
        bucket.orders.length > 0 ||
        bucket.soundlegend.length > 0 ||
        bucket.endorsements.length > 0,
      authCreated: !!user.authAccountCreated,
      welcomeSent: !!user.portalInviteSent,
      lastWelcomeSent: lastWelcomeSent || '—',
      lastLoginSeen: lastLoginSeen || '—',
    };
  };

  return (
    <>
      <div className="manage-users">
        <div className="manage-users-shell">
          <div className="manage-users-topbar">
            <div className="manage-users-topbar-copy">
              <div className="manage-users-eyebrow">Admin Workspace</div>
              <h2 className="manage-users-header">Manage Users</h2>
              <p className="manage-users-subtitle">
                Clean user directory for account state, welcome email
                visibility, portal access, linked resources, and manual
                attachment of unassigned projects, orders, SoundLegend requests,
                and endorsements.
              </p>
            </div>

            <button className="add-btn" onClick={handleAddUser}>
              + Add User
            </button>
          </div>

          <div className="manage-users-toolbar">
            <input
              type="text"
              placeholder="Search by name, email, user ID, or UID"
              value={searchQuery}
              onChange={handleSearch}
              className="search-bar"
            />

            <button
              type="button"
              className="mu-refresh-btn"
              onClick={refreshAll}
              disabled={pageLoading}
            >
              {pageLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

{pageLoading ? (
  <div className="mu-loading-state">Loading user workspace…</div>
) : (
  <div className="mu-list-shell">
    {filteredUsers.length === 0 ? (
      <div className="mu-empty-state">No users found.</div>
    ) : (
      filteredUsers.map((user) => {
        const isAdmin = isAdminUser(user);
        const portalStatus = getPortalStatus(user);
        const summary = buildUserSummary(user);
        const canonicalId = user.uid || user.id;
        const expanded = expandedUserId === canonicalId;
        const showResetButton =
          !!formatMaybeDate(user.lastLoginAt || user.lastSignInAt);
        const showWelcomeButton = !showResetButton;

        return (
          <div
            className={`mu-user-card ${expanded ? 'is-expanded' : ''}`}
            key={canonicalId || user.email}
          >
            <div className="mu-user-main">
              <div className="mu-user-identity">
                <div className="mu-user-name-row">
                  <div className="mu-user-name">{getDisplayName(user)}</div>

                  <div className="mu-user-badges">
                    {user.isSoundlegend ? (
                      <span className="mu-badge tone-blue">SoundLegend</span>
                    ) : null}
                    {isAdmin ? (
                      <span className="mu-badge tone-purple">Admin</span>
                    ) : null}
                  </div>
                </div>

                <div className="mu-user-email">{user.email || '—'}</div>

                {user.phone ? (
                  <div className="mu-user-subtle">{user.phone}</div>
                ) : null}

                <div className="mu-id-stack">
                  <div className="mu-id-label">User ID</div>
                  <div className="mu-id-value">{canonicalId || '—'}</div>

                  <div className="mu-id-actions">
                    <button
                      type="button"
                      className="mu-inline-btn"
                      onClick={() => handleCopy('User ID', canonicalId)}
                      disabled={!canonicalId}
                    >
                      Copy
                    </button>

                    {user.uid && user.uid !== user.id ? (
                      <button
                        type="button"
                        className="mu-inline-btn secondary"
                        onClick={() => handleCopy('Auth UID', user.uid)}
                      >
                        Copy UID
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mu-user-summary-grid">
                <StatCell
                  label="Auth Account"
                  value={yesNo(summary.authCreated)}
                />

                <StatCell
                  label="Welcome Email"
                  value={yesNo(summary.welcomeSent)}
                  meta={summary.lastWelcomeSent}
                />

                <StatCell
                  label="Last Login"
                  value={summary.lastLoginSeen}
                  subtle
                />

                <StatCell
                  label="Linked Resources"
                  value={yesNo(summary.hasAnyResources)}
                  meta={`${summary.resources.projects.length} projects • ${summary.resources.orders.length} orders • ${summary.resources.soundlegend.length} SL • ${summary.resources.endorsements.length} endorsements`}
                />
              </div>

              <div className="mu-user-side">
                <div className={`mu-portal-state ${portalStatus.className}`}>
                  {portalStatus.label}
                </div>

                <div className="mu-action-stack">
                  <button
                    className="mu-primary-btn"
                    type="button"
                    onClick={() =>
                      setExpandedUserId(expanded ? null : canonicalId)
                    }
                  >
                    {expanded ? 'Collapse' : 'Expand'}
                  </button>

                  {isAdmin ? (
                    <button
                      className="mu-secondary-btn"
                      type="button"
                      disabled
                      title="Admin users are managed directly in Firestore"
                    >
                      Admin (read-only)
                    </button>
                  ) : (
                    <button
                      className="mu-secondary-btn"
                      type="button"
                      onClick={() => handleViewUser(user)}
                    >
                      View / Edit
                    </button>
                  )}

                  <button
                    className="mu-secondary-btn"
                    type="button"
                    onClick={() => handleImpersonateUser(user)}
                  >
                    View Portal
                  </button>
                </div>
              </div>
            </div>

            {expanded ? (
              <div className="mu-expanded-panel">
                {!isAdmin ? (
                  <div className="mu-quick-actions">
                    <div className="mu-quick-actions-head">
                      <h3>Account tools</h3>
                      <p>
                        Quick actions for portal access and account messaging.
                      </p>
                    </div>

                    <div className="mu-quick-actions-row">
                      <button
                        type="button"
                        className={`mu-tool-btn portal ${portalStatus.className}`}
                        onClick={() => handleTogglePortalAccess(user)}
                        disabled={!!loadingActionId}
                      >
                        {portalStatus.className === 'unlocked'
                          ? 'Expire Portal Access'
                          : 'Restore Portal Access'}
                      </button>

                      {showResetButton ? (
                        <button
                          type="button"
                          className="mu-tool-btn"
                          onClick={() => handleSendResetEmail(user)}
                          disabled={
                            !!loadingActionId ||
                            !user.email ||
                            user.email === 'N/A'
                          }
                        >
                          Send Reset Email
                        </button>
                      ) : null}

                      {showWelcomeButton ? (
                        <button
                          type="button"
                          className="mu-tool-btn secondary"
                          onClick={() => handleSendWelcomeEmail(user)}
                          disabled={
                            !!loadingActionId ||
                            !user.email ||
                            user.email === 'N/A'
                          }
                        >
                          {user.portalInviteSent
                            ? 'Re-send Welcome Email'
                            : 'Send Welcome Email'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mu-admin-note">
                    This is an admin account. Admin privileges and auth-level
                    changes should still be handled directly in Firestore /
                    Firebase Admin tooling.
                  </div>
                )}

                <div className="mu-resource-grid">
                  <ResourceCard
                    title="Projects"
                    kind="project"
                    items={summary.resources.projects}
                    emptyText="No projects attached to this user."
                    onCopyId={(id) => handleCopy('Project ID', id)}
                    onAttachClick={(item) =>
                      attachResourceToUser({
                        user,
                        item,
                        type: 'project',
                      })
                    }
                  />

                  <ResourceCard
                    title="Orders"
                    kind="order"
                    items={summary.resources.orders}
                    emptyText="No orders attached to this user."
                    onCopyId={(id) => handleCopy('Order ID', id)}
                    onAttachClick={(item) =>
                      attachResourceToUser({
                        user,
                        item,
                        type: 'order',
                      })
                    }
                  />

                  <ResourceCard
                    title="SoundLegend Requests"
                    kind="soundlegend"
                    items={summary.resources.soundlegend}
                    emptyText="No SoundLegend requests attached to this user."
                    onCopyId={(id) =>
                      handleCopy('SoundLegend Request ID', id)
                    }
                    onAttachClick={(item) =>
                      attachResourceToUser({
                        user,
                        item,
                        type: 'soundlegend',
                      })
                    }
                  />

                  <ResourceCard
                    title="Endorsements"
                    kind="endorsement"
                    items={summary.resources.endorsements}
                    emptyText="No endorsement applications attached to this user."
                    onCopyId={(id) => handleCopy('Endorsement ID', id)}
                    onAttachClick={(item) =>
                      attachResourceToUser({
                        user,
                        item,
                        type: 'endorsement',
                      })
                    }
                  />
                </div>

                <div className="mu-attach-zone">
                  <div className="mu-attach-zone-head">
                    <div>
                      <h3>Attach unassigned resources</h3>
                      <p>
                        Manually connect loose records to{' '}
                        <strong>{getDisplayName(user)}</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mu-refresh-btn secondary"
                      onClick={() =>
                        setActiveAttachUserId(
                          activeAttachUserId === canonicalId
                            ? null
                            : canonicalId
                        )
                      }
                    >
                      {activeAttachUserId === canonicalId
                        ? 'Hide Attachments'
                        : 'Attach Resources'}
                    </button>
                  </div>

                  {activeAttachUserId === canonicalId ? (
                    <div className="mu-unassigned-grid">
                      <UnassignedBucket
                        kind="project"
                        title="Unassigned Projects"
                        items={unassigned.projects}
                        emptyText="No loose projects."
                        onAttach={(item) =>
                          attachResourceToUser({
                            user,
                            item,
                            type: 'project',
                          })
                        }
                      />

                      <UnassignedBucket
                        kind="order"
                        title="Unassigned Orders"
                        items={unassigned.orders}
                        emptyText="No loose orders."
                        onAttach={(item) =>
                          attachResourceToUser({
                            user,
                            item,
                            type: 'order',
                          })
                        }
                      />

                      <UnassignedBucket
                        kind="soundlegend"
                        title="Unassigned SoundLegend Requests"
                        items={unassigned.soundlegend}
                        emptyText="No loose SoundLegend requests."
                        onAttach={(item) =>
                          attachResourceToUser({
                            user,
                            item,
                            type: 'soundlegend',
                          })
                        }
                      />

                      <UnassignedBucket
                        kind="endorsement"
                        title="Unassigned Endorsements"
                        items={unassigned.endorsements}
                        emptyText="No loose endorsements."
                        onAttach={(item) =>
                          attachResourceToUser({
                            user,
                            item,
                            type: 'endorsement',
                          })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })
    )}
  </div>
)}

        {isEditModalOpen && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={handleCloseModal}
            onUserUpdated={(updatedUser) => {
              updateLocalUser(updatedUser.email || updatedUser.id, updatedUser);
            }}
          />
        )}

        {isAddModalOpen && (
          <AddUserModal
            onClose={handleAddUserClose}
            onUserAdded={(newUser) => {
              setUsers((prev) => dedupeUsersByEmail([newUser, ...prev]));
            }}
          />
        )}
      </div>
    </div>

      <ActionModal
        open={actionModal.open}
        type={actionModal.type}
        title={actionModal.title}
        message={actionModal.message}
        confirmLabel={actionModal.confirmLabel}
        cancelLabel={actionModal.cancelLabel}
        hideCancel={actionModal.hideCancel}
        isBusy={!!loadingActionId}
        onClose={closeActionModal}
        onConfirm={actionModal.onConfirm || closeActionModal}
      />
    </>
  );
};

export default ManageUsers;
