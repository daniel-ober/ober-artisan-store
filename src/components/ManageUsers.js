import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

const formatMaybeDate = (value) => {
  if (!value) return '';
  try {
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString();
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
    <div className="manage-users-action-overlay" onClick={isBusy ? undefined : onClose}>
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

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);

        const rawUsers = userSnapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          const fullName = data.fullName || `${firstName} ${lastName}`.trim();

          return {
            id: docSnap.id,
            docId: docSnap.id,
            uid: data.uid || (docSnap.id.startsWith('lead_') ? '' : docSnap.id),
            email: normalizeEmail(data.email || 'N/A'),
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
            authAccountCreated: !!data.authAccountCreated || !!data.uid,
            lastWelcomeEmailSentAt:
              data.lastWelcomeEmailSentAt || data.welcomeEmailSentAt || null,
            lastLoginAt: data.lastLoginAt || data.lastSignInAt || null,
            lastSignInAt: data.lastSignInAt || data.lastLoginAt || null,
          };
        });

        setUsers(dedupeUsersByEmail(rawUsers));
      } catch (error) {
        console.error('Error fetching users:', error);
        openInfoModal({
          type: 'error',
          title: 'Could not load users',
          message:
            'There was a problem loading the Manage Users list. Please refresh and try again.',
        });
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const haystack = [user.email, user.firstName, user.lastName, user.fullName]
        .map((v) => (v || '').toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }, [users, searchQuery]);

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
        label: 'Portal Inactive',
        className: 'off',
      };
    }

    if (user.portalAccessGranted && !user.slPortalLocked) {
      return {
        label: 'Portal Active',
        className: 'unlocked',
      };
    }

    return {
      label: 'Portal Inactive',
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

  return (
    <>
      <div className="manage-users">
        <div className="manage-users-header-row">
          <div>
            <h2 className="manage-users-header">Manage Users</h2>
            <p className="manage-users-subtitle">
              Manage SoundLegend portal access, invite emails, and password
              reset tools for your artists.
            </p>
          </div>

          <button className="add-btn" onClick={handleAddUser}>
            + Add User
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by email, first name, or last name"
          value={searchQuery}
          onChange={handleSearch}
          className="search-bar"
        />

        <div className="responsive-table-container">
          <table className="manage-users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Portal Controls</th>
                <th>More</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const busy = loadingActionId === (user.uid || user.id);
                  const isAdmin = isAdminUser(user);
                  const portalStatus = getPortalStatus(user);

                  const lastWelcomeSent = formatMaybeDate(
                    user.lastWelcomeEmailSentAt
                  );
                  const lastLoginSeen = formatMaybeDate(
                    user.lastLoginAt || user.lastSignInAt
                  );

                  const hasSignedIn =
                    !!(user.lastLoginAt || user.lastSignInAt) &&
                    String(lastLoginSeen).trim() !== '';

                  const showResetButton = hasSignedIn;
                  const showWelcomeButton = !hasSignedIn;

                  const welcomeLabel = user.portalInviteSent
                    ? 'Re-send Welcome Email'
                    : 'Send Welcome Email';

                  const statusLine = hasSignedIn
                    ? `Last portal login: ${lastLoginSeen}`
                    : user.portalInviteSent
                      ? lastWelcomeSent
                        ? `Welcome email sent: ${lastWelcomeSent}`
                        : 'Welcome email sent'
                      : 'No welcome email sent';

                  return (
                    <tr key={user.uid || user.id || user.email}>
                      <td>
                        <div className="user-email-cell">{user.email}</div>
                        <div className="user-flags">
                          {user.isSoundlegend && (
                            <span className="user-flag user-flag-sl">
                              SoundLegend
                            </span>
                          )}
                          {isAdmin && (
                            <span className="user-flag user-flag-admin">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      <td>{user.fullName || '—'}</td>

                      <td className="portal-controls-cell">
                        {isAdmin ? (
                          <div className="admin-portal-note">
                            Admin accounts are read-only in this view.
                            <br />
                            Update admin flags and access directly in the
                            Firestore
                            <br />
                            <span className="admin-portal-note-strong">
                              users
                            </span>{' '}
                            collection.
                          </div>
                        ) : (
                          <>
                            <div className="portal-toggle-row">
                              <button
                                type="button"
                                className={`pill-toggle lock ${portalStatus.className}`}
                                onClick={() => handleTogglePortalAccess(user)}
                                disabled={busy}
                                data-tooltip={
                                  portalStatus.className === 'unlocked'
                                    ? 'Portal is currently active.\nClick to expire portal access.'
                                    : 'Portal is currently expired/locked.\nClick to restore portal access.'
                                }
                              >
                                {portalStatus.label}
                              </button>
                            </div>

                            <div className="portal-password-row">
                              {showResetButton ? (
                                <button
                                  type="button"
                                  className="mini-btn"
                                  onClick={() => handleSendResetEmail(user)}
                                  disabled={
                                    busy || !user.email || user.email === 'N/A'
                                  }
                                >
                                  Send Reset Email
                                </button>
                              ) : null}

                              {showWelcomeButton ? (
                                <button
                                  type="button"
                                  className="mini-btn secondary"
                                  onClick={() => handleSendWelcomeEmail(user)}
                                  disabled={
                                    busy || !user.email || user.email === 'N/A'
                                  }
                                >
                                  {welcomeLabel}
                                </button>
                              ) : null}
                            </div>

                            <div
                              style={{
                                marginTop: '8px',
                                fontSize: '0.82rem',
                                color: '#666',
                                lineHeight: 1.45,
                              }}
                            >
                              {statusLine}
                            </div>
                          </>
                        )}
                      </td>

                      <td>
                        <div className="more-actions">
                          {isAdmin ? (
                            <>
                              <button
                                className="view-btn"
                                type="button"
                                disabled
                                title="Admin users are managed directly in Firestore"
                              >
                                Admin (read-only)
                              </button>

                              <button
                                className="impersonate-btn"
                                type="button"
                                onClick={() => handleImpersonateUser(user)}
                              >
                                View Portal as User
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="view-btn"
                                type="button"
                                onClick={() => handleViewUser(user)}
                              >
                                View / Edit
                              </button>

                              <button
                                className="impersonate-btn"
                                type="button"
                                onClick={() => handleImpersonateUser(user)}
                              >
                                View Portal as User
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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