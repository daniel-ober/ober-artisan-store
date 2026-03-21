import React, { useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
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
  const uid = user?.uid;
  const { isDarkMode, setIsDarkMode, isForcedDarkRoute } =
    useContext(DarkModeContext);

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
    name: '',
    email: '',
    phone: '',
    notifyEmail: true,
    notifySms: false,
    address: null,
  });

  const [name, setName] = useState('');
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

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test((val || '').trim());
  const digitsOnly = (str) => (str || '').replace(/\D/g, '');
  const prettyUSPhone = (d) => {
    const v = (d || '').slice(0, 10);
    if (v.length < 4) return v;
    if (v.length < 7) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!uid) return;

      try {
        const uref = doc(db, 'users', uid);
        const usnap = await getDoc(uref);

        const userDoc = usnap.exists() ? usnap.data() || {} : {};

        const userDocFullName =
          `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();

        const resolvedName =
          userDoc.name ||
          userDocFullName ||
          projects?.[0]?.customer?.name ||
          projects?.[0]?.publicPrefs?.displayName ||
          user?.displayName ||
          '';

        const fallbackEmail =
          projects?.[0]?.customer?.email || user?.email || '';

        const fallbackPhone = projects?.[0]?.customer?.phone || '';

        const userLevelAddr =
          pickAddressFrom({ address: userDoc.address }) ||
          pickAddressFrom(userDoc) ||
          null;

        const originAddr = firstRecordedAddress(projects, orders || []);

        const base = {
          name: resolvedName,
          email: usnap.exists()
            ? userDoc.email || fallbackEmail
            : fallbackEmail,
          phone: usnap.exists()
            ? userDoc.phone || fallbackPhone
            : fallbackPhone,
          notifyEmail: !!(userDoc.notificationPrefs?.email ?? true),
          notifySms: !!(userDoc.notificationPrefs?.sms ?? false),
          address: userLevelAddr || originAddr || null,
        };

        if (!alive) return;

        setInitial(base);
        setName(base.name || '');
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

    if (Object.keys(auditChanges || {}).length) {
      const logRef = doc(collection(db, 'users', uid, 'audit_logs'));
      await setDoc(logRef, {
        type: 'account_update',
        actorUid: uid,
        actorEmail: user?.email || null,
        changes: auditChanges,
        createdAt: serverTimestamp(),
        source: 'AccountSettings/section-save',
      });
    }
  };

  const onSaveName = async () => {
    setSavingName(true);
    try {
      const before = initial.name || '';
      const after = (name || '').trim();
      await writeUserPatch(
        { name: after },
        before === after ? {} : { name: { before, after } },
        { name: after }
      );
      setInitial((i) => ({ ...i, name: after }));
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
    setName(initial.name || '');
    setEditName(false);
  };

  const onSavePhone = async () => {
    const digits = digitsOnly(phone);
    if (digits.length !== 10) {
      setPhoneErr('Enter a valid 10-digit phone number');
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
      setEditPhone(false);
      alert('Phone updated.');
    } catch (e) {
      console.error(e);
      alert('Could not save phone.');
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
            before: null,
            after: { email: !!notifyEmail, sms: !!notifySms },
          },
        },
        null
      );
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
    const targetEmail = (user?.email || initial.email || '').trim();

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
    } catch (e) {
      console.error('Password reset request failed:', e);
      setPwResetStatus(
        'We could not send a reset email automatically. Please email support@oberartisandrums.com instead.'
      );
    }
  };

  const onRequestEmailChange = () => {
    const currentLogin = user?.email || initial.email || '';
    const subject = 'SoundLegend — login email change request';
    const body = `Hi Ober team,

I need to change the login email for my SoundLegend Artist Portal.

Current login email: ${currentLogin || '(not sure / unknown)'}
New email address:
(enter new email here)

Project details (optional):
- Drum serial or project ID
- Name on order

Thanks!
`;

    window.location.href =
      'mailto:support@oberartisandrums.com' +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
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
    <div className="slp-card as-card" data-component="AccountSettings">
      <div className="as-title-wrap">
        <div className="as-eyebrow">Portal Preferences</div>
        <h3>Account Settings</h3>
        <p className="as-intro">
          Manage your contact information, notification preferences, appearance,
          and shipping details for your Artist Portal experience.
        </p>
      </div>

      <div className="as-stack">
        {/* APPEARANCE */}
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

        {/* PROFILE */}
        <section className="as-section as-surface-card">
          <div className="as-block">
            <div className="as-header">
              <div>
                <label className="vp-label">Name</label>
                <div className="as-section-copy">
                  This is how your portal identity appears across your account.
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

            <input
              className="vp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editName}
              placeholder="Full name"
            />
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
                <button className="apo-btn" onClick={() => setEditPhone(true)}>
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

        {/* EMAIL */}
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
                onClick={onRequestEmailChange}
              >
                I use a different email now
              </button>
            </div>

            {pwResetStatus && (
              <div className="as-status-text">{pwResetStatus}</div>
            )}
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="as-section as-surface-card">
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
        </section>

        {/* ADDRESS */}
        <section className="as-section as-surface-card">
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
                  onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                  disabled={!editAddr}
                />
                <input
                  className="vp-input"
                  placeholder="Address line 2 (optional)"
                  value={addr.line2}
                  onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
                  disabled={!editAddr}
                />

                <div className="as-grid two">
                  <input
                    className="vp-input"
                    placeholder="City"
                    value={addr.city}
                    onChange={(e) => setAddr({ ...addr, city: e.target.value })}
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
              <div className="vp-card as-address-card" style={{ whiteSpace: 'pre-line' }}>
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
        </section>
      </div>

      <p className="slp-muted as-footer-note">
        Changes are saved one section at a time. Be sure to click <b>Save</b>{' '}
        for each section you update.
      </p>
    </div>
  );
}