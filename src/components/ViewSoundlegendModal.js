// src/components/ViewSoundlegendModal.js
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

import './AdminModalTheme.css';
import './ViewSoundlegendModal.css';

import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';
import defaultProjectFields from '../utils/defaultProjectFields';
import { defaultStepData } from '../utils/buildWorkflow';

const generateAndDownloadVCard = ({ firstName, lastName, email, phone }) => {
  const safeFirst = firstName || 'Contact';
  const safeLast = lastName || 'Ober';

  const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${safeLast};${safeFirst}
FN:${safeFirst} ${safeLast}
EMAIL:${email || ''}
${phone ? `TEL;TYPE=CELL:${phone}` : ''}
END:VCARD
  `.trim();

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFirst}_${safeLast}_OberContact.vcf`;
  a.click();

  URL.revokeObjectURL(url);
};

const ViewSoundlegendModal = ({
  submission,
  onClose,
  onStatusUpdate,
  onUpdateSubmission,
}) => {
  // ✅ derive ID safely (no early returns before hooks)
  const submissionId = submission?.id || null;

  const [selectedStatus, setSelectedStatus] = useState(submission?.status || 'New');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission?.history || []);
  const [projectId, setProjectId] = useState(submission?.projectId || null);
  const [fullSubmission, setFullSubmission] = useState(
    submission ? { ...submission, id: submission.id } : null
  );

  const { firstName, lastName, email, phone, artistBio, inspiration, submittedAt } =
    fullSubmission || submission || {};

  // Lock body scroll + ESC to close
  useEffect(() => {
    // If modal isn't open (no submission), don't do anything
    if (!submissionId) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [submissionId, onClose]);

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => console.log(`📋 Copied: ${text}`))
      .catch((err) => console.error('❌ Copy failed:', err));
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    if (!submissionId) return;

    setSelectedStatus(newStatus);

    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);

      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      const nextSubmission = {
        ...(fullSubmission || submission),
        id: submissionId,
        status: newStatus,
        overviewStatus,
        history: [...(history || []), historyEntry],
      };

      onUpdateSubmission?.(nextSubmission);
      onStatusUpdate?.(submissionId, newStatus);
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!submissionId) return;
    if (!notes.trim()) return;

    try {
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
      const timestamp = new Date().toISOString();
      const noteEntry = { type: 'note', value: notes.trim(), timestamp };

      await updateDoc(submissionRef, { history: arrayUnion(noteEntry) });

      setHistory((prev) => [...prev, noteEntry]);
      setNotes('');
    } catch (err) {
      console.error('❌ Failed to save note:', err);
    }
  };

  const createProject = async () => {
    if (!submissionId) return;

    const confirmCreation = window.confirm(
      `Create Project for ${firstName || ''} ${lastName || ''}?`
    );
    if (!confirmCreation) return;

    try {
      const projectData = {
        source: 'SoundLegend',
        submissionId,
        customerName: `${firstName || ''} ${lastName || ''}`.trim(),
        customer: {
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          email: email || '',
          phone: phone || '',
          address: { street: '', city: '', state: '', zip: '' },
        },
        artisanLine: 'SoundLegend',
        width: '14"',
        shellDepth: '8"',
        startDate: Timestamp.now(),
        currentPhase: 'Step 1. Wood Preparation',
        ...defaultStepData,
        ...defaultProjectFields,
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const newProjectId = projectRef.id;

      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
      const systemEntry = {
        type: 'system',
        value: `Project created: ${newProjectId}`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(submissionRef, {
        projectId: newProjectId,
        history: arrayUnion(systemEntry),
      });

      setProjectId(newProjectId);
      setHistory((prev) => [systemEntry, ...prev]);

      alert(`✅ Project created successfully!\n\nID: ${newProjectId}`);

      onUpdateSubmission?.({
        ...(fullSubmission || submission),
        id: submissionId,
        projectId: newProjectId,
        history: [systemEntry, ...(history || [])],
      });
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  // Fetch and validate submission + linked project
  useEffect(() => {
    if (!submissionId) return;

    const fetchAndValidateSubmission = async () => {
      try {
        const ref = doc(db, 'soundlegend_submissions', submissionId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn('❌ Submission no longer exists.');
          return;
        }

        const data = snap.data();
        let validProjectId = data.projectId || null;

        if (validProjectId) {
          const projectRef = doc(db, 'projects', validProjectId);
          const projectSnap = await getDoc(projectRef);
          if (!projectSnap.exists()) {
            console.warn(`❌ Linked project not found: ${validProjectId}`);
            validProjectId = null;
            await updateDoc(ref, { projectId: null });
          }
        }

        setFullSubmission({ ...data, id: submissionId });
        setProjectId(validProjectId);
        setHistory(data.history || []);
        setSelectedStatus(data.status || 'New');
      } catch (err) {
        console.error('❌ Error loading/validating submission:', err);
      }
    };

    fetchAndValidateSubmission();
  }, [submissionId]);

  // ✅ Now it's safe to return null (after hooks)
  if (!submissionId) return null;

  return ReactDOM.createPortal(
    <div
      className="slmodal__backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="slmodal light"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="slmodal__header">
          <h3>SoundLegend Submission</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="slmodal__body">
          <div className="ea-grid">
            <div className="ea-block">
              <h4>Status & Actions</h4>

              <div className="row">
                <span>Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  {STATUS_OPTIONS.soundlegend.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {projectId ? (
                <div className="row">
                  <span>Linked Project</span>
                  <div>
                    <a
                      href={`/projects/${projectId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      Open Project ↗
                    </a>
                    <button
                      className="icon-btn ml-8"
                      onClick={() => copyToClipboard(projectId)}
                      title="Copy Project ID"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn--sm" onClick={createProject}>
                  Create Project
                </button>
              )}

              <div className="row">
                <span>Contact Card</span>
                <button
                  className="btn btn--sm"
                  onClick={() =>
                    generateAndDownloadVCard({ firstName, lastName, email, phone })
                  }
                >
                  Download .vcf
                </button>
              </div>
            </div>

            <div className="ea-block">
              <h4>Contact</h4>

              <div className="row">
                <span>Name</span>
                <div>
                  <span className="text-box">
                    {firstName} {lastName}
                  </span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() => copyToClipboard(`${firstName} ${lastName}`)}
                    title="Copy name"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="row">
                <span>Email</span>
                <div>
                  <span className="text-box">{email}</span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() => copyToClipboard(email)}
                    title="Copy email"
                  >
                    📋
                  </button>
                </div>
              </div>

              {phone && (
                <div className="row">
                  <span>Phone</span>
                  <span className="text-box">{phone}</span>
                </div>
              )}

              {submittedAt?.seconds && (
                <div className="row">
                  <span>Submitted</span>
                  <span className="muted">
                    {new Date(submittedAt.seconds * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {artistBio && (
              <div className="ea-block col-span-2">
                <h4>Artist Bio</h4>
                <div className="text-box">{artistBio}</div>
              </div>
            )}

            {inspiration && (
              <div className="ea-block col-span-2">
                <h4>Inspiration</h4>
                <div className="text-box">{inspiration}</div>
              </div>
            )}

            <div className="ea-block col-span-2">
              <h4>Add Note</h4>
              <textarea
                rows={3}
                placeholder="Write an internal note…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="right">
                <button
                  className="btn btn--sm"
                  onClick={handleNoteSubmit}
                  disabled={!notes.trim()}
                >
                  Save Note
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setNotes('')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="ea-block col-span-2">
              <h4>History</h4>
              {history.length === 0 ? (
                <div className="muted">No history yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="ea-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry, i) => (
                        <tr key={`${entry.timestamp}-${i}`}>
                          <td>{entry.type === 'status' ? 'Status' : entry.type}</td>
                          <td className="pre">{entry.value}</td>
                          <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="slmodal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewSoundlegendModal;