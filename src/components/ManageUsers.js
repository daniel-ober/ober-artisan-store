import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { db } from '../firebaseConfig';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { useImpersonation } from '../context/ImpersonationContext';
import './ManageUsers.css';

const auth = getAuth();

/* ------------ Cloud Functions config ------------ */
/** Make sure these match your deployed Functions **/
const CF_REGION = 'us-central1'; // <- change if you deployed somewhere else
const CF_PROJECT = 'danoberartisandrums';
const CF_BASE = `https://${CF_REGION}-${CF_PROJECT}.cloudfunctions.net`;

// This MUST match the function name you see in the Functions console
const WELCOME_FN_NAME = 'sendSoundLegendWelcomeEmail';

/* ------------ helpers ------------ */

const generateTempPassword = () => {
  const words = [
    'Legend',
    'Stave',
    'Shell',
    'Groove',
    'Pulse',
    'Torch',
    'Maple',
    'Cherry',
    'Oak',
  ];
  const w = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const symbol = '!';
  return `${w}${num}${symbol}`;
};

const normalize = (str = '') =>
  String(str).toLowerCase().replace(/\s+/g, ' ').trim();

const isAdminUser = (user) => !!user?.isAdmin;

/* ====================================== */
/*              Component                 */
/* ====================================== */

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null); // per-row actions

  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  /* ---------- load users ---------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: docSnap.id,
            email: data.email || 'N/A',
            firstName,
            lastName,
            fullName,
            isSoundlegend: !!data.isSoundlegend,
            slPortalLocked: !!data.slPortalLocked,
            // 🔐 Admin flag is managed *only* in Firestore (no UI toggle)
            isAdmin: !!data.isAdmin,
          };
        });

        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  /* ---------- search filter ---------- */
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = users.filter((user) => {
      const haystack = [
        user.email,
        user.firstName,
        user.lastName,
        user.fullName,
      ]
        .map((v) => (v || '').toLowerCase())
        .join(' ');
      return haystack.includes(query);
    });

    setFilteredUsers(filtered);
  };

  /* ---------- CRUD helpers ---------- */

  const handleViewUser = (user) => {
    if (isAdminUser(user)) {
      alert(
        'Admin users are read-only in this screen.\n\n' +
          'Update their Firestore document directly if you need to change admin settings.'
      );
      return;
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId) => {
    const target = users.find((u) => u.id === userId);
    if (isAdminUser(target)) {
      alert(
        'Admin users cannot be deleted from this screen.\n\n' +
          'If you truly need to delete an admin, handle it carefully via Firebase Admin / Firestore.'
      );
      return;
    }

    if (!window.confirm('Delete this user from the users collection?')) return;
    setLoadingDelete(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      const remaining = users.filter((u) => u.id !== userId);
      setUsers(remaining);
      setFilteredUsers(remaining);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleAddUser = () => setIsAddModalOpen(true);
  const handleAddUserClose = () => setIsAddModalOpen(false);

  const updateLocalUser = (id, patch) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
    setFilteredUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  /* ---------- SoundLegend access toggle ---------- */
  const handleToggleSlAccess = async (user) => {
    if (!user?.id) return;
    if (isAdminUser(user)) {
      alert(
        'Admin users are managed via Firestore and cannot be edited here (including SoundLegend access).'
      );
      return;
    }

    const newVal = !user.isSoundlegend;
    setLoadingActionId(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isSoundlegend: newVal,
      });
      updateLocalUser(user.id, { isSoundlegend: newVal });
    } catch (err) {
      console.error('Failed to toggle SL access:', err);
      alert('There was a problem updating SoundLegend access.');
    } finally {
      setLoadingActionId(null);
    }
  };

  /* ---------- Portal lock toggle ---------- */
  const handleTogglePortalLock = async (user) => {
    if (!user?.id) return;
    if (isAdminUser(user)) {
      alert(
        'Admin users are managed via Firestore and cannot be edited here (including portal lock).'
      );
      return;
    }

    const newVal = !user.slPortalLocked;
    setLoadingActionId(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        slPortalLocked: newVal,
      });
      updateLocalUser(user.id, { slPortalLocked: newVal });
    } catch (err) {
      console.error('Failed to toggle portal lock:', err);
      alert('There was a problem updating portal lock status.');
    } finally {
      setLoadingActionId(null);
    }
  };

  /* ---------- send password reset email ---------- */
  const handleSendResetEmail = async (user) => {
    if (isAdminUser(user)) {
      alert(
        'Admin password resets should be handled manually through Firebase Auth / Admin tools, not this UI.'
      );
      return;
    }

    if (!user?.email || user.email === 'N/A') {
      alert('No valid email on file for this user.');
      return;
    }
    setLoadingActionId(user.id);
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(
        `Password reset email sent to ${user.email}.\n\nThe artist will click the link, log in, and set a new password.`
      );
    } catch (err) {
      console.error('Failed to send reset email:', err);
      alert('There was a problem sending the reset email.');
    } finally {
      setLoadingActionId(null);
    }
  };

  /* ---------- temp password flow ---------- */
  const handleTempPassword = async (user) => {
    if (isAdminUser(user)) {
      alert(
        'Admin passwords must not be changed via this temp-password flow.\n\n' +
          'Handle admin password changes via Firebase Admin / Auth console instead.'
      );
      return;
    }

    if (!user?.id || !user?.email || user.email === 'N/A') {
      alert('User must have a valid email and id for this action.');
      return;
    }

    const tempPassword = generateTempPassword();

    if (
      !window.confirm(
        `Generate a temporary password for ${user.email}?\n\n` +
          `You will see the temp password after it is set. ` +
          `Share it carefully (phone, in-person, or secure email).`
      )
    ) {
      return;
    }

    setLoadingActionId(user.id);
    try {
      // 🔐 Cloud Function that uses Firebase Admin SDK to set the password
      const resp = await fetch(`${CF_BASE}/adminSetTempPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.id,
          email: user.email,
          tempPassword,
        }),
      });

      if (!resp.ok) {
        throw new Error(
          `adminSetTempPassword failed with status ${resp.status}`
        );
      }

      // Optional: also send a standard password reset email, so they can
      // immediately choose a permanent password after first login.
      await sendPasswordResetEmail(auth, user.email);

      window.alert(
        `Temporary password for ${user.email}:\n\n` +
          `${tempPassword}\n\n` +
          `Share this carefully (phone, in-person, or secure email).\n` +
          `Ask the artist to:\n` +
          `1) Log in with this temp password.\n` +
          `2) Use the reset link in their email to set a new permanent password.`
      );
    } catch (err) {
      console.error('Failed to set temporary password:', err);
      alert(
        'There was a problem setting the temporary password. ' +
          'Check the Cloud Function logs for adminSetTempPassword.'
      );
    } finally {
      setLoadingActionId(null);
    }
  };

  /* ---------- welcome email flow ---------- */
  const handleSendWelcomeEmail = async (user) => {
    if (isAdminUser(user)) {
      alert(
        'Admin accounts do not get the SoundLegend welcome email from this screen.'
      );
      return;
    }

    if (!user?.email || user.email === 'N/A') {
      alert('No valid email on file for this user.');
      return;
    }

    const confirm = window.confirm(
      `Send a SoundLegend welcome email to ${user.email}?\n\n` +
        'This will send the artist a branded "Welcome to your Artist Portal" message with sign-in instructions.'
    );
    if (!confirm) return;

    setLoadingActionId(user.id);
    try {
      const resp = await fetch(`${CF_BASE}/${WELCOME_FN_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.fullName || '',
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${text}`);
      }

      alert(
        `Welcome email queued for ${user.email}.\n\n` +
          'Ask the artist to check their inbox (and spam/promotions).'
      );
    } catch (err) {
      console.error('Failed to send welcome email:', err);
      alert(
        'We could not send the welcome email automatically.\n\n' +
          'Please email the artist manually (e.g., from Gmail) instead.\n\n' +
          `Developer info (see console & Cloud Functions logs):\n${err?.message || err}`
      );
    } finally {
      setLoadingActionId(null);
    }
  };

  /* ---------- impersonate & view portal ---------- */
  const handleImpersonateUser = (user) => {
    if (!user?.id) return;
    // You *might* choose to block impersonation for admins too, but for now we allow it.
    startImpersonation(user.id);
    navigate('/legacy');
  };

  /* ---------- render ---------- */

  return (
    <div className="manage-users">
      <div className="manage-users-header-row">
        <div>
          <h2 className="manage-users-header">Manage Users</h2>
          <p className="manage-users-subtitle">
            Manage SoundLegend access, portal locks, and password tools for your
            artists.
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
                const busy = loadingActionId === user.id;
                const isAdmin = isAdminUser(user);

                return (
                  <tr key={user.id}>
                    {/* Email + flags */}
                    <td>
                      <div className="user-email-cell">{user.email}</div>
                      <div className="user-flags">
                        {user.isSoundlegend && (
                          <span className="user-flag user-flag-sl">
                            SoundLegend
                          </span>
                        )}
                        {user.slPortalLocked && (
                          <span className="user-flag user-flag-locked">
                            Locked
                          </span>
                        )}
                        {isAdmin && (
                          <span className="user-flag user-flag-admin">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td>{user.fullName || '—'}</td>

                    {/* Portal controls */}
                    <td className="portal-controls-cell">
                      {isAdmin ? (
                        <div className="admin-portal-note">
                          Admin accounts are read-only in this view.
                          <br />
                          Update admin flags and access directly in the Firestore
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
                              className={`pill-toggle ${
                                user.isSoundlegend ? 'on' : 'off'
                              }`}
                              onClick={() => handleToggleSlAccess(user)}
                              disabled={busy}
                            >
                              {user.isSoundlegend
                                ? 'SL Access: ON'
                                : 'SL Access: OFF'}
                            </button>

                            <button
                              type="button"
                              className={`pill-toggle lock ${
                                user.slPortalLocked ? 'locked' : 'unlocked'
                              }`}
                              onClick={() => handleTogglePortalLock(user)}
                              disabled={busy}
                              data-tooltip={
                                'Lock the SoundLegend portal for this artist.\n' +
                                'Use this if there are billing issues, account review,\n' +
                                'or the artist has requested a temporary hold.'
                              }
                            >
                              {user.slPortalLocked
                                ? 'Portal Locked'
                                : 'Portal Unlocked'}
                            </button>
                          </div>

                          <div className="portal-password-row">
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

                            <button
                              type="button"
                              className="mini-btn secondary"
                              onClick={() => handleTempPassword(user)}
                              disabled={
                                busy || !user.email || user.email === 'N/A'
                              }
                              data-tooltip={
                                'Generate a one-time temporary password, set it\n' +
                                'via the admin Cloud Function, and send the artist\n' +
                                'a reset email so they can choose a permanent one.'
                              }
                            >
                              Temp Password
                            </button>

                            <button
                              type="button"
                              className="mini-btn secondary"
                              onClick={() => handleSendWelcomeEmail(user)}
                              disabled={
                                busy || !user.email || user.email === 'N/A'
                              }
                            >
                              Send Welcome Email
                            </button>
                          </div>
                        </>
                      )}
                    </td>

                    {/* More actions */}
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

                            {/* Optional delete: re-enable if you want it visible again
                            <button
                              className="delete-btn"
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loadingDelete}
                            >
                              {loadingDelete ? 'Deleting…' : 'Delete'}
                            </button>
                            */}
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
            updateLocalUser(updatedUser.id, updatedUser);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddUserModal
          onClose={handleAddUserClose}
          onUserAdded={(newUser) => {
            const next = [newUser, ...users];
            setUsers(next);
            setFilteredUsers(next);
          }}
        />
      )}
    </div>
  );
};

export default ManageUsers;