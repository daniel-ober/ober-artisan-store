// src/components/EndorsementApplicationModal.js
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EndorsementApplicationModal.css';
import './AdminModalTheme.css';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

const safeDate = (ts) => {
  try {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (ts instanceof Date) return ts.toLocaleString();
    return '';
  } catch {
    return '';
  }
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function EndorsementApplicationModal({ value, appId, onClose }) {
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');

  const status = value?.status || 'inProgress';
  const overviewStatus =
    value?.overviewStatus ||
    (status === 'new' ? 'new' : status === 'completed' ? 'completed' : 'inProgress');

  const attachmentUrl = useMemo(() => {
    return (
      value?.attachment?.url ||
      value?.attachmentUrl ||
      (value?.hasAttachment && value?.url ? value.url : '') ||
      ''
    );
  }, [value]);

  const createdAt = safeDate(value?.createdAt);
  const updatedAt = safeDate(value?.updatedAt);

  const onChangeStatus = async (nextStatus) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'endorsement_applications', appId), {
        status: nextStatus,
        overviewStatus:
          nextStatus === 'new'
            ? 'new'
            : nextStatus === 'completed'
            ? 'completed'
            : 'inProgress',
        updatedAt: serverTimestamp(),
        systemHistory: arrayUnion({
          event: `Status changed to "${nextStatus}"`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error('Failed to update endorsement status', e);
    } finally {
      setSaving(false);
    }
  };

  const addInternalNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'endorsement_applications', appId), {
        updatedAt: serverTimestamp(),
        internalNotes: arrayUnion({
          text: trimmed,
          timestamp: new Date().toISOString(),
        }),
        systemHistory: arrayUnion({
          event: 'Internal note added',
          timestamp: new Date().toISOString(),
        }),
      });
      setNoteText('');
    } catch (e) {
      console.error('Failed to add internal note', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div className="admin-modal-backdrop" onMouseDown={onClose}>
        <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="admin-modal-header">
            <div className="admin-modal-title">
              <h3>Endorsement Application</h3>
              <div className="admin-modal-subtitle">
                <span className="pill">{overviewStatus}</span>
                <span className="mono">ID: {appId}</span>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="btn btn--ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          <div className="admin-modal-body">
            <div className="eamodal-grid">
              <section className="eamodal-card">
                <h4>Applicant</h4>
                <div className="kv">
                  <div className="k">Full Name</div>
                  <div className="v">{value?.fullName || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Stage Name</div>
                  <div className="v">{value?.stageName || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Email</div>
                  <div className="v">
                    {value?.email ? <a href={`mailto:${value.email}`}>{value.email}</a> : '—'}
                  </div>
                </div>
                <div className="kv">
                  <div className="k">Phone</div>
                  <div className="v">{value?.phone || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Location</div>
                  <div className="v">
                    {[value?.city, value?.state, value?.country].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
              </section>

              <section className="eamodal-card">
                <h4>Links</h4>
                <div className="kv">
                  <div className="k">Website</div>
                  <div className="v">
                    {value?.website ? (
                      <a href={value.website} target="_blank" rel="noreferrer">
                        {value.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="kv">
                  <div className="k">Instagram</div>
                  <div className="v">{value?.instagram || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">TikTok</div>
                  <div className="v">{value?.tiktok || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">YouTube</div>
                  <div className="v">{value?.youtube || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Media Links</div>
                  <div className="v prewrap">{value?.mediaLinks || '—'}</div>
                </div>
              </section>

              <section className="eamodal-card">
                <h4>Application</h4>
                <div className="kv">
                  <div className="k">Band(s)</div>
                  <div className="v prewrap">{value?.bands || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Touring / Gigs</div>
                  <div className="v prewrap">{value?.tourSchedule || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Current Gear</div>
                  <div className="v prewrap">{value?.currentGear || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Goals</div>
                  <div className="v prewrap">{value?.endorsementGoals || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Why Ober</div>
                  <div className="v prewrap">{value?.whyOber || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Heard About Us</div>
                  <div className="v prewrap">{value?.heardAboutUs || '—'}</div>
                </div>
              </section>

              <section className="eamodal-card">
                <h4>Attachment</h4>
                {attachmentUrl ? (
                  <a className="btn btn--ghost" href={attachmentUrl} target="_blank" rel="noreferrer">
                    Open Attachment
                  </a>
                ) : (
                  <div className="muted">No attachment on file.</div>
                )}

                <div className="kv" style={{ marginTop: 12 }}>
                  <div className="k">Created</div>
                  <div className="v">{createdAt || '—'}</div>
                </div>
                <div className="kv">
                  <div className="k">Updated</div>
                  <div className="v">{updatedAt || '—'}</div>
                </div>

                <div className="kv" style={{ marginTop: 12 }}>
                  <div className="k">Status</div>
                  <div className="v">
                    <select value={status} disabled={saving} onChange={(e) => onChangeStatus(e.target.value)}>
                      <option value="new">New</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="eamodal-card eamodal-notes">
                <h4>Internal Notes</h4>
<div className="notes-list">
  {asArray(value?.internalNotes)
    .slice()
    .reverse()
    .map((n, idx) => (
      <div className="note" key={idx}>
        <div className="note-meta">
          {safeDate(n?.timestamp) || n?.timestamp || '—'}
        </div>
        <div className="note-text">{n?.text || '—'}</div>
      </div>
    ))}

  {asArray(value?.internalNotes).length === 0 && (
    <div className="muted">No internal notes yet.</div>
  )}
</div>

                <div className="note-compose">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add an internal note..."
                  />
                  <button className="btn" disabled={saving || !noteText.trim()} onClick={addInternalNote}>
                    {saving ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
              </section>

              <section className="eamodal-card eamodal-history">
                <h4>System History</h4>
<div className="history-list">
  {asArray(value?.systemHistory)
    .slice()
    .reverse()
    .map((h, idx) => (
      <div className="history-item" key={idx}>
        <div className="history-meta">
          {safeDate(h?.timestamp) || h?.timestamp || '—'}
        </div>
        <div className="history-text">{h?.event || '—'}</div>
      </div>
    ))}

  {asArray(value?.systemHistory).length === 0 && (
    <div className="muted">No system history yet.</div>
  )}
</div>
              </section>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}