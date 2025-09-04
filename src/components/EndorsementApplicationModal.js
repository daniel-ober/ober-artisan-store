import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EndorsementApplicationModal.css';
import './AdminModalTheme.css';


const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

const EndorsementApplicationModal = ({ value, appId, onClose }) => {
  const [form, setForm] = useState({
    internalNotes: value?.internalNotes || '',
    status: value?.status || 'inProgress'
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateDoc(doc(db, 'endorsement_applications', appId), {
      internalNotes: form.internalNotes || '',
      status: form.status || 'inProgress',
      updatedAt: serverTimestamp()
    });
    setSaving(false);
    onClose();
  };

  const safe = (x) => (x === undefined || x === null || x === '' ? '—' : x);

  return (
    <Portal>
      <div className="eamodal__backdrop">
        <div className="eamodal">
          <div className="eamodal__header">
            <h3>Application Details</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="eamodal__body">
            <div className="ea-grid">
              <div className="ea-block">
                <h4>Applicant</h4>
                <div className="row"><span>Name</span><b>{safe(value.fullName)}</b></div>
                <div className="row"><span>Stage Name</span><b>{safe(value.stageName)}</b></div>
                <div className="row"><span>Location</span><b>{[value.city, value.state, value.country].filter(Boolean).join(', ') || '—'}</b></div>
                <div className="row"><span>Email</span><b>{safe(value.email)}</b></div>
                <div className="row"><span>Phone</span><b>{safe(value.phone)}</b></div>
                <div className="row"><span>Bands</span><b>{safe(value.bands)}</b></div>
                <div className="row"><span>Heard About Us</span><b>{safe(value.heardAboutUs)}</b></div>
                <div className="row"><span>Goals</span><b>{safe(value.endorsementGoals)}</b></div>
              </div>

              <div className="ea-block">
                <h4>Links</h4>
                <div className="row"><span>Instagram</span><b>{safe(value.instagram)}</b></div>
                <div className="row"><span>TikTok</span><b>{safe(value.tiktok)}</b></div>
                <div className="row"><span>YouTube</span><b>{safe(value.youtube)}</b></div>
                <div className="row"><span>Website</span><b>{safe(value.website)}</b></div>
                <div className="row"><span>Media</span><b>{safe(value.mediaLinks)}</b></div>
              </div>

              <div className="ea-block">
                <h4>Attachment</h4>
                {value?.attachment?.url || value?.url ? (
                  <a className="file-link" href={value?.attachment?.url || value?.url} target="_blank" rel="noreferrer">
                    {value?.attachment?.name || value?.fileName || 'Open file'}
                  </a>
                ) : <div className="muted">No file</div>}
                <div className="row"><span>Client Scan</span><b>{safe(value.clientScan)}</b></div>
                <div className="row"><span>Created</span><b>{value?.createdAt?.toDate ? value.createdAt.toDate().toLocaleString() : '—'}</b></div>
                <div className="row"><span>Status</span>
                  <select value={form.status} onChange={(e)=>setForm(f=>({ ...f, status: e.target.value }))}>
                    <option value="new">New</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="ea-block col-span-2">
                <h4>Why Ober</h4>
                <div className="text-box">{safe(value.whyOber)}</div>
              </div>

              <div className="ea-block col-span-2">
                <h4>Current Gear</h4>
                <div className="text-box">{safe(value.currentGear)}</div>
              </div>

              <div className="ea-block col-span-2">
                <h4>Internal Notes (private)</h4>
                <textarea
                  rows={5}
                  value={form.internalNotes}
                  onChange={(e)=>setForm(f=>({ ...f, internalNotes: e.target.value }))}
                  placeholder="Decision notes, next steps, etc."
                />
              </div>
            </div>
          </div>

          <div className="eamodal__footer">
            <button className="btn btn--ghost" onClick={onClose}>Close</button>
            <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default EndorsementApplicationModal;