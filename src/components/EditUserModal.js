import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EditUserModal.css';

const formatTimestamp = (value) => {
  if (!value) return '—';

  try {
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString();
    }

    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

const formatPhoneForInput = (value = '') => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .replace(/^1(?=\d{10}$)/, '');

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const normalizePhoneForSave = (value = '') => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .replace(/^1(?=\d{10}$)/, '');

  if (digits.length !== 10) return String(value || '').trim();

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const prettifyAuditKey = (key = '') =>
  String(key || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (s) => s.toUpperCase());

const renderAuditValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }

  return String(value);
};

const AuditLogCard = ({ entry }) => {
  const changes = entry?.changes || {};
  const changeKeys = Object.keys(changes);

  return (
    <div className="eum-audit-card">
      <div className="eum-audit-header-row">
        <div className="eum-audit-type">
          {prettifyAuditKey(entry?.type || 'account_update')}
        </div>
        <div className="eum-audit-time">{formatTimestamp(entry?.createdAt)}</div>
      </div>

      <div className="eum-audit-meta-row">
        <span className="eum-audit-meta-item">
          <strong>Source:</strong> {entry?.source || '—'}
        </span>
        <span className="eum-audit-meta-item">
          <strong>Actor:</strong> {entry?.actorEmail || entry?.actorUid || '—'}
        </span>
      </div>

      {changeKeys.length ? (
        <div className="eum-audit-change-list">
          {changeKeys.map((key) => {
            const item = changes[key] || {};
            const before = renderAuditValue(item?.before);
            const after = renderAuditValue(item?.after);

            return (
              <div className="eum-audit-change-row" key={`${entry.id}-${key}`}>
                <div className="eum-audit-field">{prettifyAuditKey(key)}</div>

                <div className="eum-audit-inline-values">
                  <div className="eum-audit-inline-pill">
                    <span className="eum-audit-inline-label">Before</span>
                    <span className="eum-audit-inline-value">{before}</span>
                  </div>

                  <div className="eum-audit-inline-arrow">→</div>

                  <div className="eum-audit-inline-pill eum-audit-inline-pill--after">
                    <span className="eum-audit-inline-label">After</span>
                    <span className="eum-audit-inline-value">{after}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="eum-audit-empty-inline">
          No field-level changes recorded.
        </div>
      )}
    </div>
  );
};

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(formatPhoneForInput(user?.phone || ''));
  const [isSoundlegend, setIsSoundlegend] = useState(
    !!(
      user?.isSoundlegend ||
      user?.access?.soundLegend ||
      user?.access?.soundlegend
    )
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');

  const fullName = useMemo(
    () =>
      `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim(),
    [firstName, lastName]
  );

  useEffect(() => {
    document.body.classList.add('eum-body-lock');

    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.classList.remove('eum-body-lock');
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    const loadAuditLogs = async () => {
      if (!user?.id) {
        if (isMounted) {
          setAuditLogs([]);
          setAuditLoading(false);
        }
        return;
      }

      try {
        setAuditLoading(true);
        setAuditError('');

        const auditRef = collection(db, 'users', user.id, 'audit_logs');
        const auditQuery = query(auditRef, orderBy('createdAt', 'desc'), limit(25));
        const snap = await getDocs(auditQuery);

        if (!isMounted) return;

        const logs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setAuditLogs(logs);
      } catch (err) {
        console.error('Error loading audit logs:', err);
        if (!isMounted) return;
        setAuditError('Could not load audit history.');
      } finally {
        if (isMounted) setAuditLoading(false);
      }
    };

    loadAuditLogs();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSave = async () => {
    try {
      setError('');
      setIsSaving(true);

      const trimmedFirstName = String(firstName || '').trim();
      const trimmedLastName = String(lastName || '').trim();
      const trimmedEmail = String(email || '').trim();
      const normalizedPhone = normalizePhoneForSave(phone);

      const nextPortalExpired = !isSoundlegend;
      const nextPortalLocked = !isSoundlegend;

      const beforeState = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        fullName:
          user?.fullName ||
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
          '',
        email: user?.email || '',
        phone: user?.phone || '',
        isSoundlegend: !!(
          user?.isSoundlegend ||
          user?.access?.soundLegend ||
          user?.access?.soundlegend
        ),
        portalExpired: !!(user?.portalExpired || user?.slPortalExpired),
        portalLocked: !!(user?.portalLocked || user?.slPortalLocked),
      };

      const afterState = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        fullName,
        email: trimmedEmail,
        phone: normalizedPhone,
        isSoundlegend: !!isSoundlegend,
        portalExpired: nextPortalExpired,
        portalLocked: nextPortalLocked,
      };

      const changes = {};
      Object.keys(afterState).forEach((key) => {
        if (beforeState[key] !== afterState[key]) {
          changes[key] = {
            before: beforeState[key],
            after: afterState[key],
          };
        }
      });

      const userDocRef = doc(db, 'users', user.id);

      await updateDoc(userDocRef, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        fullName,
        name: fullName,
        email: trimmedEmail,
        phone: normalizedPhone,
        isSoundlegend: !!isSoundlegend,
        portalExpired: nextPortalExpired,
        slPortalExpired: nextPortalExpired,
        portalLocked: nextPortalLocked,
        slPortalLocked: nextPortalLocked,
        access: {
          ...(user?.access || {}),
          soundLegend: !!isSoundlegend,
          soundlegend: !!isSoundlegend,
        },
        updatedAt: serverTimestamp(),
      });

      if (Object.keys(changes).length > 0) {
        const { setDoc } = await import('firebase/firestore');
        const auditDocRef = doc(collection(db, 'users', user.id, 'audit_logs'));
        await setDoc(auditDocRef, {
          type: 'admin_user_update',
          actorUid: null,
          actorEmail: 'admin-portal',
          source: 'EditUserModal/admin-save',
          changes,
          createdAt: serverTimestamp(),
        });
      }

      onUserUpdated?.({
        ...user,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        fullName,
        name: fullName,
        email: trimmedEmail,
        phone: normalizedPhone,
        isSoundlegend: !!isSoundlegend,
        portalExpired: nextPortalExpired,
        slPortalExpired: nextPortalExpired,
        portalLocked: nextPortalLocked,
        slPortalLocked: nextPortalLocked,
        access: {
          ...(user?.access || {}),
          soundLegend: !!isSoundlegend,
          soundlegend: !!isSoundlegend,
        },
      });

      onClose?.();
    } catch (saveError) {
      console.error('Error updating user:', saveError);
      setError('Failed to update user. Please check your permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="eum-overlay" onClick={onClose}>
      <div
        className="eum-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-modal-title"
      >
        <div className="eum-header">
          <div>
            <div className="eum-kicker">Manage User</div>
            <h2 id="edit-user-modal-title" className="eum-title">
              Edit User
            </h2>
            <div className="eum-subtitle">
              Review account details, SoundLegend access, and audit history.
            </div>
          </div>

          <button
            type="button"
            className="eum-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {error ? <div className="eum-error">{error}</div> : null}

        <div className="eum-grid">
          <section className="eum-panel">
            <div className="eum-panel-title">Account Details</div>

            <div className="eum-form-grid">
              <div className="eum-form-group">
                <label htmlFor="eum-firstName">First Name</label>
                <input
                  id="eum-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="eum-form-group">
                <label htmlFor="eum-lastName">Last Name</label>
                <input
                  id="eum-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="eum-form-group eum-form-group--full">
                <label htmlFor="eum-email">Email</label>
                <input
                  id="eum-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="eum-form-group eum-form-group--full">
                <label htmlFor="eum-phone">Phone</label>
                <input
                  id="eum-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneForInput(e.target.value))}
                />
              </div>
            </div>

            <div className="eum-access-grid">
              <label className="eum-checkcard">
                <input
                  type="checkbox"
                  checked={isSoundlegend}
                  onChange={() => setIsSoundlegend((prev) => !prev)}
                />
                <div>
                  <div className="eum-checkcard-title">SoundLegend Access</div>
                  <div className="eum-checkcard-copy">
                    Controls whether this user can access the Artist Portal.
                    Turning this off will mark the portal as expired and remove
                    active portal access.
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section className="eum-panel">
            <div className="eum-panel-title">Audit History</div>

            <div className="eum-audit-wrap">
              {auditLoading ? (
                <div className="eum-audit-empty">Loading audit history…</div>
              ) : null}

              {!auditLoading && auditError ? (
                <div className="eum-audit-empty eum-audit-error">
                  {auditError}
                </div>
              ) : null}

              {!auditLoading && !auditError && auditLogs.length === 0 ? (
                <div className="eum-audit-empty">
                  No audit history found for this user yet.
                </div>
              ) : null}

              {!auditLoading && !auditError && auditLogs.length > 0
                ? auditLogs.map((entry) => (
                    <AuditLogCard key={entry.id} entry={entry} />
                  ))
                : null}
            </div>
          </section>
        </div>

        <div className="eum-footer">
          <button
            type="button"
            className="eum-btn eum-btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="eum-btn eum-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditUserModal;