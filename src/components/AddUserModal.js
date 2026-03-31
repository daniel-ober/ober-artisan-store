// src/components/AddUserModal.js
import React, { useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import './AddUserModal.css';

/* --------------------------- Password Generator --------------------------- */
const THEME_WORDS_PRIMARY = [
  'Groove',
  'Backbeat',
  'Paradiddle',
  'Rimshot',
  'Resonance',
  'Shell',
  'Bearing',
  'Tone',
  'Tempo',
  'Pitch',
  'Luthier',
  'Stave',
  'Hybrid',
  'Maple',
  'Cherry',
  'Oak',
  'Torch',
  'Acrylic',
  'Diecast',
  'Vintage',
  'Feuzon',
  'Legend',
  'Heritage',
  'Sound',
];
const THEME_WORDS_SECONDARY = [
  'Craft',
  'Snare',
  'Tuning',
  'Head',
  'Hoop',
  'Lug',
  'Throw',
  'Bed',
  'Wire',
  'Pulse',
  'Phase',
  'Meter',
  'Accent',
  'Chop',
  'Fill',
  'Kick',
  'Stick',
  'Brush',
  'Studio',
  'Session',
  'Legacy',
  'Vault',
  'Miami',
];
const SYMBOLS = ['!', '@', '#', '$', '%', '&', '?'];
const DIGITS = '23456789';
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const leetLight = (s) => s.replace(/o/g, '0').replace(/E/g, '3').replace(/e/g, '3');

function generateThemedPassword(targetLen = 14) {
  const w1 = pick(THEME_WORDS_PRIMARY);
  const w2 = pick(THEME_WORDS_SECONDARY);
  const base = `${w1}${w2}`;
  const digits = `${pick(DIGITS)}${pick(DIGITS)}${pick(DIGITS)}`;
  const sym = pick(SYMBOLS);

  let pwd = `${leetLight(base)}${digits}${sym}`;
  while (pwd.length < targetLen) {
    pwd += Math.random() > 0.5 ? pick(DIGITS) : pick(SYMBOLS);
  }
  if (!/[a-z]/.test(pwd)) pwd += 'a';
  if (!/[A-Z]/.test(pwd)) pwd += 'A';
  if (!/\d/.test(pwd)) pwd += pick(DIGITS);
  if (!/[!@#$%&?]/.test(pwd)) pwd += pick(SYMBOLS);

  return pwd;
}

/* --------------------------------- Presets -------------------------------- */
const ROLE_PRESETS = {
  standard: { isAdmin: false, isSoundlegend: false },
  soundlegend: { isAdmin: false, isSoundlegend: true },
  admin: { isAdmin: true, isSoundlegend: false },
  adminAndSL: { isAdmin: true, isSoundlegend: true },
};

const AddUserModal = ({ onClose, onUserAdded }) => {
  const { user, isAdmin, authIsReady } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isSoundlegend: false,
    isAdmin: false,
    status: 'active',
  });

  const [generatedPassword, setGeneratedPassword] = useState(
    generateThemedPassword()
  );
  const [passwordNoticeVisible, setPasswordNoticeVisible] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(
    () => `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
    [formData.firstName, formData.lastName]
  );

  const handleAdminSignIn = async () => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(e?.message || 'Failed to sign in.');
    }
  };

  async function ensureAdminAndFreshToken() {
    if (!authIsReady || !user) throw new Error('AUTH_NOT_READY');
    await user.reload();
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    if (!tokenResult.claims?.admin && !tokenResult.claims?.isAdmin) {
      throw new Error('NOT_ADMIN');
    }
    return tokenResult;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError('');
    setInfo('');
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const applyPreset = (key) => {
    const preset = ROLE_PRESETS[key];
    if (!preset) return;
    setFormData((prev) => ({ ...prev, ...preset }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await ensureAdminAndFreshToken();

      const email = formData.email.trim().toLowerCase();
      const password = generatedPassword || generateThemedPassword();

      const createUser = httpsCallable(functions, 'adminCreateUser');
      const result = await createUser({
        email,
        password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        isSoundlegend: !!formData.isSoundlegend,
        isAdmin: !!formData.isAdmin,
        status: formData.status,
      });

      const {
        uid,
        userDocId,
        existingAuthUser = false,
      } = (result && result.data) || {};

      if (!uid) {
        throw new Error('User creation completed, but no UID was returned.');
      }

      if (formData.isAdmin) {
        try {
          const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
          await setAdminClaim({ uid, admin: true });
        } catch (claimErr) {
          console.error('[setAdminClaim] failed', claimErr);
          setInfo(
            'User was created, but admin claim could not be set automatically.'
          );
        }
      }

      if (formData.isSoundlegend) {
        try {
          const setSoundlegendClaim = httpsCallable(
            functions,
            'setSoundlegendClaim'
          );
          await setSoundlegendClaim({ uid, enable: true });
        } catch (claimErr) {
          console.error('[setSoundlegendClaim] failed', claimErr);
          setInfo(
            'User was created, but SoundLegend claim could not be set automatically.'
          );
        }
      }

      setPasswordNoticeVisible(true);
      setGeneratedPassword(password);

      if (existingAuthUser) {
        setInfo(
          'This email already existed in Firebase Auth, so the existing account was linked and cleaned up instead of creating a duplicate.'
        );
      }

      onUserAdded &&
        onUserAdded({
          id: userDocId || uid,
          uid,
          email,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          fullName,
          phone: formData.phone.trim(),
          isAdmin: !!formData.isAdmin,
          isSoundlegend: !!formData.isSoundlegend,
          status: formData.status,
          slPortalLocked: formData.isSoundlegend ? true : false,
          portalAccessGranted: false,
          portalInviteSent: false,
          authAccountCreated: true,
        });
    } catch (err) {
      console.error('[AddUser] failed', err);
      const msg = (err && (err.message || err.code)) || 'Something went wrong.';

      if (msg === 'AUTH_NOT_READY') {
        setError('Still initializing sign-in. Try again in a moment.');
      } else if (msg === 'NOT_ADMIN') {
        setError(
          'Not authorized. Your account does not have admin privileges.'
        );
      } else if (msg.includes('function not found')) {
        setError(
          'Cloud Function not found in this region. Check REACT_APP_FUNCTIONS_REGION.'
        );
      } else if (msg.includes('PERMISSION_DENIED')) {
        setError('Not authorized. (Cloud Function PERMISSION_DENIED)');
      } else if (msg.includes('auth/email-already-exists')) {
        setError(
          'That email already exists in Firebase Auth, but the backend was not able to reconcile it cleanly.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="add-user-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aum-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="aum-title">Add User</h2>
          <button
            aria-label="Close"
            className="icon-btn close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="role-presets" aria-label="Role presets">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="chip"
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => applyPreset('soundlegend')}
            className="chip"
          >
            SoundLegend
          </button>
          <button
            type="button"
            onClick={() => applyPreset('admin')}
            className="chip chip--warn"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => applyPreset('adminAndSL')}
            className="chip chip--warn"
          >
            Admin + SL
          </button>
        </div>

        {authIsReady && !user && (
          <div className="banner banner--error" role="alert">
            User must be signed in.
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAdminSignIn}
              >
                Sign in with Google
              </button>
            </div>
          </div>
        )}

        {authIsReady && user && !isAdmin && (
          <div className="banner banner--error" role="alert">
            Not authorized. Your account does not have admin privileges.
          </div>
        )}

        {error && (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        )}

        {info && (
          <div className="banner banner--info" role="status">
            {info}
          </div>
        )}

        {!authIsReady ? (
          <div className="loading-message">Checking authentication…</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Jane"
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jane@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group form-group--switches">
              <label className="switch">
                <input
                  type="checkbox"
                  name="isSoundlegend"
                  checked={formData.isSoundlegend}
                  onChange={handleChange}
                />
                <span>SoundLegend Access</span>
              </label>

              <label className="switch">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleChange}
                />
                <span>Grant Admin Privileges</span>
              </label>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="password-card">
              <div className="password-row">
                <label>Generated Password</label>
                <div className="password-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() =>
                      setGeneratedPassword(generateThemedPassword())
                    }
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="password-display">
                <code>{generatedPassword}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() =>
                    navigator.clipboard.writeText(generatedPassword)
                  }
                >
                  Copy
                </button>
              </div>

              <p className="muted">
                Share this with the user; they can reset it later.
              </p>
            </div>

            <div className="modal-actions">
              <button type="submit" disabled={loading || !user || !isAdmin}>
                {loading ? 'Adding…' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {passwordNoticeVisible && (
          <div className="password-popup" role="status">
            <strong>Important:</strong> Save this password to share with the
            user:
            <div className="password-popup-display">
              <code>{generatedPassword}</code>
              <button
                className="copy-btn"
                onClick={() =>
                  navigator.clipboard.writeText(generatedPassword)
                }
              >
                Copy
              </button>
            </div>
            <p className="muted">
              They can change it later via password reset.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;