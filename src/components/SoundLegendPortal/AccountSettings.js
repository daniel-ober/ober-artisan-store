import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { DarkModeContext } from '../../context/DarkModeContext';
import './AccountSettings.css';

/* -------------------- shared helpers (scoped) -------------------- */
const cleanAddr = (a = {}) => ({
  line1: (a.line1 || a.addressLine1 || a.line_1 || '').trim(),
  line2: (a.line2 || a.addressLine2 || a.line_2 || '').trim(),
  city: (a.city || '').trim(),
  state: (a.state || a.region || a.province || a.stateCode || '').trim(),
  postal_code: (
    a.postal_code ||
    a.postalCode ||
    a.postcode ||
    a.zip ||
    a.zipCode ||
    ''
  ).trim(),
  country: (a.country || a.countryCode || '').trim(),
});

const pickAddressFrom = (obj = {}) => {
  const c =
    obj?.shipping?.address ||
    obj?.shippingAddress ||
    obj?.customer?.shipping?.address ||
    obj?.customer?.shippingAddress ||
    obj?.customer?.address ||
    obj?.customerDetails?.address ||
    obj?.customer_details?.address ||
    obj?.address ||
    null;

  if (!c) return null;
  const normalized = cleanAddr(c);
  return Object.values(normalized).some(Boolean) ? normalized : null;
};

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

const firstRecordedAddress = (projectsArr = [], ordersArr = []) => {
  const candidates = [];

  for (const p of projectsArr) {
    const addr = pickAddressFrom(p);
    const t = tsToMillis(p?.createdAt) || Number.MAX_SAFE_INTEGER;
    if (addr) candidates.push({ addr, t });
  }

  for (const o of ordersArr) {
    const addr = pickAddressFrom(o);
    const t = tsToMillis(o?.createdAt) || Number.MAX_SAFE_INTEGER;
    if (addr) candidates.push({ addr, t });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0].addr;
};

const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

/* -------------------- tiny UI bits -------------------- */
const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    className={`apo-toggle ${checked ? 'on' : 'off'}`}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <span className="knob" />
  </button>
);

/* -------------------- main component -------------------- */
export default function AccountSettings({
  user,
  projects,
  orders,
  latestOrder, // kept for future use
  isAdmin,
}) {
  const uid = user?.uid || user?.id || '';
  const { isDarkMode, setIsDarkMode, isForcedDarkRoute } =
    useContext(DarkModeContext);

  const emailSyncLoggedRef = useRef('');

  const s = (v) => String(v || '').toLowerCase();
  const isDelivered = (p) => !!p?.shipping?.deliveryDate;
  const isInTransit = (p) => !!p?.shipping?.shipDate && !isDelivered(p);
  const isFinished = (p) =>
    s(p?.status) === 'finished' ||
    /all steps complete|completed/.test(s(p?.currentPhase)) ||
    isDelivered(p);

  const addressLocked = (projects || []).some(
    (p) => !isFinished(p) || isInTransit(p)
  );
  const lockReason = (projects || []).some(isInTransit)
    ? 'in transit'
    : (projects || []).some((p) => !isFinished(p))
      ? 'in progress'
      : null;

  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    notifyEmail: true,
    notifySms: false,
    address: null,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  const [phoneErr, setPhoneErr] = useState('');

  const [editName, setEditName] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [editAddr, setEditAddr] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [pwResetStatus, setPwResetStatus] = useState('');

  const [showEmailUpdate, setShowEmailUpdate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdateStatus, setEmailUpdateStatus] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);

  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [pendingEmailForUpdate, setPendingEmailForUpdate] = useState('');
  const [reauthStatus, setReauthStatus] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test((val || '').trim());

  const digitsOnly = (str) => {
    const raw = String(str || '').replace(/\D/g, '');

    if (raw.length === 11 && raw.startsWith('1')) {
      return raw.slice(1);
    }

    return raw;
  };

  const prettyUSPhone = (d) => {
    const v = digitsOnly(d).slice(0, 10);

    if (v.length < 4) return v;
    if (v.length < 7) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  };

  const buildFullName = (first = '', last = '') =>
    [String(first || '').trim(), String(last || '').trim()]
      .filter(Boolean)
      .join(' ');

  const safeCreateAuditLog = async (
    changes,
    source = 'AccountSettings/section-save'
  ) => {
    try {
      if (!uid || !changes || !Object.keys(changes).length) return false;

      const actorUid = auth.currentUser?.uid || null;
      const actorEmail = auth.currentUser?.email || user?.email || null;

      const logRef = doc(collection(db, 'users', uid, 'audit_logs'));
      await setDoc(logRef, {
        type: 'account_update',
        actorUid,
        actorEmail,
        changes,
        createdAt: serverTimestamp(),
        source,
      });

      return true;
    } catch (err) {
      console.warn('Audit log write skipped:', err);
      return false;
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!uid) return;

      try {
        const currentAuthUser = auth.currentUser;

        if (currentAuthUser) {
          try {
            await currentAuthUser.reload();
          } catch (reloadErr) {
            console.warn(
              'Could not reload auth user before account sync:',
              reloadErr
            );
          }
        }

        const refreshedAuthEmail = (
          auth.currentUser?.email ||
          user?.email ||
          ''
        ).trim();

        const uref = doc(db, 'users', uid);
        const usnap = await getDoc(uref);
        const userDoc = usnap.exists() ? usnap.data() || {} : {};

        const storedUserEmail = String(userDoc.email || '').trim();
        const storedUserEmailLower = normalizeEmail(
          userDoc.emailLower || storedUserEmail
        );

        const authEmailLower = normalizeEmail(refreshedAuthEmail);

        if (
          refreshedAuthEmail &&
          authEmailLower &&
          authEmailLower !== storedUserEmailLower &&
          emailSyncLoggedRef.current !== `${uid}:${authEmailLower}`
        ) {
          try {
            await setDoc(
              doc(db, 'users', uid),
              {
                email: refreshedAuthEmail,
                emailLower: authEmailLower,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            emailSyncLoggedRef.current = `${uid}:${authEmailLower}`;

            void safeCreateAuditLog(
              {
                email: {
                  before: storedUserEmail || null,
                  after: refreshedAuthEmail,
                },
              },
              'AccountSettings/email-change-confirmed'
            );
          } catch (syncErr) {
            console.warn('Could not sync confirmed auth email:', syncErr);
          }
        }

        const resolvedFirstName =
          String(userDoc.firstName || '').trim() ||
          String(user?.displayName || '')
            .trim()
            .split(' ')
            .filter(Boolean)[0] ||
          '';

        const resolvedLastName =
          String(userDoc.lastName || '').trim() ||
          (() => {
            const parts = String(user?.displayName || '')
              .trim()
              .split(' ')
              .filter(Boolean);
            return parts.length > 1 ? parts.slice(1).join(' ') : '';
          })();

        const resolvedFullName =
          String(userDoc.fullName || '').trim() ||
          String(userDoc.name || '').trim() ||
          buildFullName(resolvedFirstName, resolvedLastName) ||
          projects?.[0]?.customer?.name ||
          projects?.[0]?.publicPrefs?.displayName ||
          user?.displayName ||
          '';

        const fallbackEmail =
          projects?.[0]?.customer?.email || refreshedAuthEmail || '';

        const fallbackPhone = projects?.[0]?.customer?.phone || '';

        const userLevelAddr =
          pickAddressFrom({ address: userDoc.address }) ||
          pickAddressFrom(userDoc) ||
          null;

        const originAddr = firstRecordedAddress(projects, orders || []);

        const base = {
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          fullName: resolvedFullName,
          email: refreshedAuthEmail || storedUserEmail || fallbackEmail,
          phone: usnap.exists()
            ? userDoc.phone || fallbackPhone
            : fallbackPhone,
          notifyEmail: !!(userDoc.notificationPrefs?.email ?? true),
          notifySms: !!(userDoc.notificationPrefs?.sms ?? false),
          address: userLevelAddr || originAddr || null,
        };

        if (!alive) return;

        setInitial(base);
        setFirstName(base.firstName || '');
        setLastName(base.lastName || '');
        setEmail(base.email || '');
        setPhone(prettyUSPhone(digitsOnly(base.phone || '')));
        setNotifyEmail(base.notifyEmail);
        setNotifySms(base.notifySms);
        setAddr(
          base.address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
          }
        );

        const d = digitsOnly(base.phone || '');
        setPhoneErr(
          d.length === 10 || d.length === 0
            ? ''
            : 'Enter a valid 10-digit phone number'
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid, projects, orders, user]);

  const writeUserPatch = async (patch, auditChanges, primaryProjectPatch) => {
    if (!uid) {
      throw new Error('Missing user uid/id for account update.');
    }

    await setDoc(
      doc(db, 'users', uid),
      { ...patch, updatedAt: serverTimestamp() },
      { merge: true }
    );

    const primaryProject = projects?.[0];
    if (isAdmin && primaryProject?.id && primaryProjectPatch) {
      await setDoc(
        doc(db, 'projects', primaryProject.id),
        {
          customer: {
            ...(primaryProject.customer || {}),
            ...primaryProjectPatch,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    void safeCreateAuditLog(auditChanges, 'AccountSettings/section-save');
  };

  const onSaveName = async () => {
    setSavingName(true);
    try {
      const nextFirst = String(firstName || '').trim();
      const nextLast = String(lastName || '').trim();
      const nextFull = buildFullName(nextFirst, nextLast);

      const before = {
        firstName: initial.firstName || '',
        lastName: initial.lastName || '',
        fullName: initial.fullName || '',
      };

      const after = {
        firstName: nextFirst,
        lastName: nextLast,
        fullName: nextFull,
      };

      await writeUserPatch(
        {
          firstName: nextFirst,
          lastName: nextLast,
          fullName: nextFull,
          name: nextFull,
        },
        JSON.stringify(before) === JSON.stringify(after)
          ? {}
          : { name: { before, after } },
        {
          firstName: nextFirst,
          lastName: nextLast,
          name: nextFull,
        }
      );

      setInitial((i) => ({
        ...i,
        firstName: nextFirst,
        lastName: nextLast,
        fullName: nextFull,
      }));
      setEditName(false);
      alert('Name updated.');
    } catch (e) {
      console.error(e);
      alert('Could not save name.');
    } finally {
      setSavingName(false);
    }
  };

  const onCancelName = () => {
    setFirstName(initial.firstName || '');
    setLastName(initial.lastName || '');
    setEditName(false);
  };

  const onSavePhone = async () => {
    const digits = digitsOnly(phone);

    if (digits.length !== 10) {
      setPhoneErr('Enter a valid 10-digit phone number');
      return;
    }

    if (!uid) {
      console.error('Phone save blocked: missing user uid/id', { user });
      alert('Could not save phone. Missing user account ID.');
      return;
    }

    setSavingPhone(true);

    try {
      const pretty = prettyUSPhone(digits);
      const before = initial.phone || '';
      const after = pretty;

      await writeUserPatch(
        { phone: after },
        before === after ? {} : { phone: { before, after } },
        { phone: after }
      );

      setInitial((i) => ({ ...i, phone: after }));
      setPhone(pretty);
      setPhoneErr('');
      setEditPhone(false);
      alert('Phone updated.');
    } catch (e) {
      console.error('Phone save failed:', e);
      alert(`Could not save phone. ${e?.message || ''}`.trim());
    } finally {
      setSavingPhone(false);
    }
  };

  const onCancelPhone = () => {
    setPhone(prettyUSPhone(digitsOnly(initial.phone || '')));
    setPhoneErr('');
    setEditPhone(false);
  };

  const onSaveAddr = async () => {
    setSavingAddr(true);
    try {
      const before = initial.address || null;
      const after = cleanAddr(addr);
      const changed =
        JSON.stringify(before || {}) !== JSON.stringify(after || {});

      await writeUserPatch(
        { address: after },
        changed ? { address: { before, after } } : {},
        { shippingAddress: after }
      );

      setInitial((i) => ({ ...i, address: after }));
      setEditAddr(false);
      alert('Address updated.');
    } catch (e) {
      console.error(e);
      alert('Could not save address.');
    } finally {
      setSavingAddr(false);
    }
  };

  const onCancelAddr = () => {
    setAddr(
      initial.address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      }
    );
    setEditAddr(false);
  };

  const onSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await writeUserPatch(
        { notificationPrefs: { email: !!notifyEmail, sms: !!notifySms } },
        {
          notificationPrefs: {
            before: {
              email: !!initial.notifyEmail,
              sms: !!initial.notifySms,
            },
            after: { email: !!notifyEmail, sms: !!notifySms },
          },
        },
        null
      );

      setInitial((i) => ({
        ...i,
        notifyEmail: !!notifyEmail,
        notifySms: !!notifySms,
      }));
      alert('Notification preferences saved.');
    } catch (e) {
      console.error(e);
      alert('Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const onSetTheme = (nextDarkMode) => {
    setIsDarkMode(nextDarkMode);
    localStorage.setItem('darkMode', String(nextDarkMode));
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(nextDarkMode ? 'dark' : 'light');
  };

  const onSendPasswordReset = async () => {
    setPwResetStatus('');

    const targetEmail = (
      auth.currentUser?.email ||
      user?.email ||
      initial.email ||
      ''
    ).trim();

    if (!targetEmail || !isValidEmail(targetEmail)) {
      alert(
        'We could not find a valid login email on file. Please contact support@oberartisandrums.com.'
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);

      setPwResetStatus(
        'Password reset link sent. Check your inbox and spam folder.'
      );

      void safeCreateAuditLog(
        {
          passwordResetRequested: {
            before: null,
            after: {
              email: targetEmail,
              requestedAt: new Date().toISOString(),
            },
          },
        },
        'AccountSettings/password-reset-requested'
      );
    } catch (e) {
      console.error('Password reset request failed:', e);
      setPwResetStatus(
        'We could not send a reset email automatically. Please email support@oberartisandrums.com instead.'
      );
    }
  };

  const handleEmailUpdate = async () => {
    setEmailUpdateStatus('');

    const trimmed = (newEmail || '').trim().toLowerCase();

    if (!trimmed || !isValidEmail(trimmed)) {
      setEmailUpdateStatus('Please enter a valid email address.');
      return;
    }

    if (
      trimmed ===
      normalizeEmail(
        auth.currentUser?.email || user?.email || initial.email || ''
      )
    ) {
      setEmailUpdateStatus('That email is already on file.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setEmailUpdateStatus('User session not found. Please sign in again.');
      return;
    }

    setEmailUpdating(true);

    try {
      await verifyBeforeUpdateEmail(currentUser, trimmed);

      setEmailUpdateStatus(
        `Verification sent to ${trimmed}. Your login email will update after you confirm it from that inbox.`
      );
      setNewEmail('');

      void safeCreateAuditLog(
        {
          emailChangeRequested: {
            before: currentUser.email || initial.email || null,
            after: trimmed,
          },
        },
        'AccountSettings/email-change-requested'
      );
    } catch (e) {
      console.error('Email update request failed:', e);

      if (e?.code === 'auth/requires-recent-login') {
        setPendingEmailForUpdate(trimmed);
        setReauthPassword('');
        setReauthStatus('');
        setShowReauth(true);
      } else if (e?.code === 'auth/email-already-in-use') {
        setEmailUpdateStatus(
          'That email is already associated with another account.'
        );
      } else if (e?.code === 'auth/invalid-email') {
        setEmailUpdateStatus('Please enter a valid email address.');
      } else {
        setEmailUpdateStatus(
          'We could not send the verification email right now. Please try again.'
        );
      }
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleReauthenticateAndRetryEmail = async () => {
    setReauthStatus('');

    const currentUser = auth.currentUser;
    const passwordFromUserInput = (reauthPassword || '').trim();

    if (!currentUser?.email) {
      setReauthStatus('Could not verify your current login session.');
      return;
    }

    if (!passwordFromUserInput) {
      setReauthStatus('Please enter your password.');
      return;
    }

    if (!pendingEmailForUpdate) {
      setReauthStatus('No pending email update was found. Please try again.');
      return;
    }

    setReauthLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordFromUserInput
      );

      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, pendingEmailForUpdate);

      setShowReauth(false);
      setReauthPassword('');
      setPendingEmailForUpdate('');
      setNewEmail('');
      setEmailUpdateStatus(
        `Verification sent to ${pendingEmailForUpdate}. Your login email will update after you confirm it from that inbox.`
      );

      void safeCreateAuditLog(
        {
          emailChangeRequested: {
            before: currentUser.email || initial.email || null,
            after: pendingEmailForUpdate,
          },
        },
        'AccountSettings/email-change-requested-after-reauth'
      );
    } catch (e) {
      console.error('Reauthentication / email update failed:', e);

      if (
        e?.code === 'auth/wrong-password' ||
        e?.code === 'auth/invalid-credential'
      ) {
        setReauthStatus('That password was incorrect. Please try again.');
      } else if (e?.code === 'auth/too-many-requests') {
        setReauthStatus(
          'Too many attempts. Please wait a moment and try again.'
        );
      } else if (e?.code === 'auth/email-already-in-use') {
        setShowReauth(false);
        setEmailUpdateStatus(
          'That email is already associated with another account.'
        );
      } else {
        setReauthStatus(
          'We could not verify your password right now. Please try again.'
        );
      }
    } finally {
      setReauthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="slp-card" data-component="AccountSettings">
        <h3>Account Settings</h3>
        <div className="slp-muted">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <div className="slp-card as-card" data-component="AccountSettings">
        <div className="as-title-wrap">
          <div className="as-eyebrow">Portal Preferences</div>
          <h3>Account Settings</h3>
          <p className="as-intro">
            Manage your contact information, notification preferences,
            appearance, and shipping details for your Artist Portal experience.
          </p>
        </div>

        <div className="as-stack">
          <section className="as-section as-surface-card">
            <div className="as-header">
              <div>
                <label className="vp-label">Appearance</label>
                <div className="as-section-copy">
                  Choose how your Artist Portal looks on this device.
                </div>
              </div>
            </div>

            <div className="as-appearance-card">
              <div className="as-appearance-copy">
                <div className="as-appearance-title">Theme</div>
                <div className="vp-hint">
                  Light mode keeps things crisp. Dark mode matches the portal’s
                  immersive look.
                </div>
              </div>

              <div className="as-theme-segmented" aria-label="Theme selection">
                <button
                  type="button"
                  className={`as-theme-btn ${!isDarkMode ? 'active' : ''}`}
                  onClick={() => onSetTheme(false)}
                  disabled={isForcedDarkRoute}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`as-theme-btn ${isDarkMode ? 'active' : ''}`}
                  onClick={() => onSetTheme(true)}
                  disabled={isForcedDarkRoute}
                >
                  Dark
                </button>
              </div>
            </div>

            {isForcedDarkRoute && (
              <div className="vp-hint as-inline-note">
                This page is currently using a forced dark experience.
              </div>
            )}
          </section>

          <section className="as-section as-surface-card">
            <div className="as-block">
              <div className="as-header">
                <div>
                  <label className="vp-label">Name</label>
                  <div className="as-section-copy">
                    This is how your portal identity appears across your
                    account.
                  </div>
                </div>

                {!editName ? (
                  <button className="apo-btn" onClick={() => setEditName(true)}>
                    Edit
                  </button>
                ) : (
                  <div className="as-actions">
                    <button className="apo-btn" onClick={onCancelName}>
                      Cancel
                    </button>
                    <button
                      className="apo-btn primary"
                      onClick={onSaveName}
                      disabled={savingName}
                    >
                      {savingName ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="as-grid two">
                <input
                  className="vp-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!editName}
                  placeholder="First name"
                />
                <input
                  className="vp-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!editName}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="as-divider" />

            <div className="as-block">
              <div className="as-header">
                <div>
                  <label className="vp-label">Phone</label>
                  <div className="as-section-copy">
                    Used for direct build communication and important updates.
                  </div>
                </div>

                {!editPhone ? (
                  <button
                    className="apo-btn"
                    onClick={() => setEditPhone(true)}
                  >
                    Edit
                  </button>
                ) : (
                  <div className="as-actions">
                    <button className="apo-btn" onClick={onCancelPhone}>
                      Cancel
                    </button>
                    <button
                      className="apo-btn primary"
                      onClick={onSavePhone}
                      disabled={savingPhone}
                    >
                      {savingPhone ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <input
                className={`vp-input ${phoneErr ? 'has-error' : ''}`}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  const d = digitsOnly(e.target.value).slice(0, 10);
                  setPhone(prettyUSPhone(d));
                  setPhoneErr(
                    d.length === 10 ? '' : 'Enter a valid 10-digit phone number'
                  );
                }}
                onBlur={() => {
                  const d = digitsOnly(phone).slice(0, 10);
                  setPhone(prettyUSPhone(d));
                  setPhoneErr(
                    d.length === 10 ? '' : 'Enter a valid 10-digit phone number'
                  );
                }}
                disabled={!editPhone}
                placeholder="(555) 555-5555"
              />

              {phoneErr && <div className="vp-hint error">{phoneErr}</div>}
            </div>
          </section>

          <section className="as-section as-surface-card">
            <div className="as-header as-header--stack">
              <div>
                <label className="vp-label">Email</label>
                <div className="as-section-copy">
                  This email is tied to your Artist Portal login and account
                  notifications.
                </div>
              </div>
            </div>

            <input
              className="vp-input vp-input-readonly"
              type="email"
              value={email}
              disabled
            />

            <div className="as-email-meta">
              <div className="as-email-actions">
                <button
                  type="button"
                  className="apo-btn subtle"
                  onClick={onSendPasswordReset}
                >
                  Send password reset link
                </button>
                <button
                  type="button"
                  className="apo-btn subtle"
                  onClick={() => {
                    setEmailUpdateStatus('');
                    setNewEmail('');
                    setShowEmailUpdate(true);
                  }}
                >
                  Update my email
                </button>
              </div>

              {pwResetStatus && (
                <div className="as-status-text">{pwResetStatus}</div>
              )}
            </div>
          </section>

          {/* <section className="as-section as-surface-card">
            <div className="as-header">
              <div>
                <label className="vp-label">Notifications</label>
                <div className="as-section-copy">
                  Choose how you’d like to receive account and build updates.
                </div>
              </div>

              <div className="as-actions">
                <button
                  className="apo-btn primary"
                  onClick={onSavePrefs}
                  disabled={savingPrefs}
                >
                  {savingPrefs ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="as-toggle-grid">
              <label className="as-toggle-card">
                <div className="as-toggle-copy">
                  <div className="as-toggle-title">Email updates</div>
                  <div className="as-toggle-desc">
                    Receive progress updates and account notices by email.
                  </div>
                </div>
                <Switch checked={notifyEmail} onChange={setNotifyEmail} />
              </label>

              <label className="as-toggle-card">
                <div className="as-toggle-copy">
                  <div className="as-toggle-title">Text (SMS) updates</div>
                  <div className="as-toggle-desc">
                    Receive key milestones and direct text notifications.
                  </div>
                </div>
                <Switch checked={notifySms} onChange={setNotifySms} />
              </label>
            </div>
          </section> */}

          {/* <section className="as-section as-surface-card">
            <div className="as-header">
              <div>
                <label className="vp-label">Shipping Address</label>
                <div className="as-section-copy">
                  This applies to future fulfillment and delivery coordination.
                </div>
              </div>

              {!addressLocked && !editAddr ? (
                <button className="apo-btn" onClick={() => setEditAddr(true)}>
                  Edit
                </button>
              ) : !addressLocked ? (
                <div className="as-actions">
                  <button className="apo-btn" onClick={onCancelAddr}>
                    Cancel
                  </button>
                  <button
                    className="apo-btn primary"
                    onClick={onSaveAddr}
                    disabled={savingAddr}
                  >
                    {savingAddr ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : null}
            </div>

            {!addressLocked ? (
              <>
                <div className="as-grid">
                  <input
                    className="vp-input"
                    placeholder="Address line 1"
                    value={addr.line1}
                    onChange={(e) =>
                      setAddr({ ...addr, line1: e.target.value })
                    }
                    disabled={!editAddr}
                  />
                  <input
                    className="vp-input"
                    placeholder="Address line 2 (optional)"
                    value={addr.line2}
                    onChange={(e) =>
                      setAddr({ ...addr, line2: e.target.value })
                    }
                    disabled={!editAddr}
                  />

                  <div className="as-grid two">
                    <input
                      className="vp-input"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) =>
                        setAddr({ ...addr, city: e.target.value })
                      }
                      disabled={!editAddr}
                    />
                    <input
                      className="vp-input"
                      placeholder="State/Province"
                      value={addr.state}
                      onChange={(e) =>
                        setAddr({ ...addr, state: e.target.value })
                      }
                      disabled={!editAddr}
                    />
                  </div>

                  <div className="as-grid two">
                    <input
                      className="vp-input"
                      placeholder="Postal / ZIP"
                      value={addr.postal_code}
                      onChange={(e) =>
                        setAddr({ ...addr, postal_code: e.target.value })
                      }
                      disabled={!editAddr}
                    />
                    <input
                      className="vp-input"
                      placeholder="Country"
                      value={addr.country}
                      onChange={(e) =>
                        setAddr({ ...addr, country: e.target.value })
                      }
                      disabled={!editAddr}
                    />
                  </div>
                </div>

                <div className="vp-hint as-inline-note">
                  Updating your address here affects future shipments only. Past
                  orders remain unchanged.
                </div>
              </>
            ) : (
              <>
                <div
                  className="vp-card as-address-card"
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {(() => {
                    const a = initial.address || addr;
                    const parts = [
                      a?.line1,
                      a?.line2,
                      [a?.city, a?.state].filter(Boolean).join(', '),
                      [a?.postal_code, a?.country].filter(Boolean).join(' '),
                    ].filter(Boolean);
                    return parts.length ? parts.join('\n') : '—';
                  })()}
                </div>

                <div className="vp-hint as-inline-note">
                  {lockReason === 'in transit'
                    ? 'Your order is currently in transit. For security, address changes are locked until delivery.'
                    : 'Your drum is currently in production. Address changes are locked until the build is complete.'}
                </div>

                <div className="vp-requests">
                  <a
                    className="apo-btn request"
                    href={
                      'mailto:soundlegend@oberartisandrums.com' +
                      '?subject=' +
                      encodeURIComponent(
                        'SoundLegend — Shipping address change request'
                      ) +
                      '&body=' +
                      encodeURIComponent(
                        `Hi Ober team,

I need to update my shipping address for an in-progress build.

New address:

(Street)
(City, State, ZIP)
(Country)

Thanks!`
                      )
                    }
                  >
                    Request an address change ↗
                  </a>
                </div>
              </>
            )}
          </section> */}
        </div>

        <p className="slp-muted as-footer-note">
          Changes are saved one section at a time. Be sure to click <b>Save</b>{' '}
          for each section you update.
        </p>
      </div>

      {showEmailUpdate && (
        <div
          className="as-modal-overlay"
          onClick={() => {
            if (emailUpdating) return;
            setShowEmailUpdate(false);
          }}
        >
          <div
            className="as-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="as-email-update-title"
          >
            <div className="as-modal-head">
              <h4 id="as-email-update-title">Update your email</h4>
              <button
                type="button"
                className="as-modal-close"
                onClick={() => setShowEmailUpdate(false)}
                disabled={emailUpdating}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="as-modal-copy">
              Enter your new email address below. We’ll send a verification link
              to that new inbox, and your login email will only change after you
              confirm it.
            </p>

            <div className="as-modal-current">
              <span className="as-modal-current-label">Current email</span>
              <span className="as-modal-current-value">
                {auth.currentUser?.email || user?.email || initial.email || '—'}
              </span>
            </div>

            <input
              className="vp-input"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter your new email"
              autoComplete="email"
            />

            {emailUpdateStatus && (
              <div className="as-status-text as-status-text--modal">
                {emailUpdateStatus}
              </div>
            )}

            <div className="as-modal-actions">
              <button
                type="button"
                className="apo-btn"
                onClick={() => setShowEmailUpdate(false)}
                disabled={emailUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="apo-btn primary"
                onClick={handleEmailUpdate}
                disabled={emailUpdating}
              >
                {emailUpdating ? 'Sending…' : 'Send verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReauth && (
        <div
          className="as-modal-overlay"
          onClick={() => {
            if (reauthLoading) return;
            setShowReauth(false);
          }}
        >
          <div
            className="as-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="as-reauth-title"
          >
            <div className="as-modal-head">
              <h4 id="as-reauth-title">Confirm your password</h4>
              <button
                type="button"
                className="as-modal-close"
                onClick={() => setShowReauth(false)}
                disabled={reauthLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="as-modal-copy">
              For security, please enter your current password to continue your
              email update.
            </p>

            <input
              className="vp-input"
              type="password"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />

            {reauthStatus && (
              <div className="as-status-text as-status-text--modal">
                {reauthStatus}
              </div>
            )}

            <div className="as-modal-actions">
              <button
                type="button"
                className="apo-btn"
                onClick={() => setShowReauth(false)}
                disabled={reauthLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="apo-btn primary"
                onClick={handleReauthenticateAndRetryEmail}
                disabled={reauthLoading}
              >
                {reauthLoading ? 'Verifying…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}