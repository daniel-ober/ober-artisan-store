import React, { useState, useEffect } from 'react';
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
import './ViewSoundlegendModal.css';
import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';
import defaultProjectFields from '../utils/defaultProjectFields';
import defaultStepData from '../utils/defaultStepData';

const generateAndDownloadVCard = ({ firstName, lastName, email, phone }) => {
  const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName}
FN:${firstName} ${lastName}
EMAIL:${email}
${phone ? `TEL;TYPE=CELL:${phone}` : ''}
END:VCARD
  `.trim();

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${firstName}_${lastName}_OberContact.vcf`;
  a.click();

  URL.revokeObjectURL(url);
};

const ViewSoundlegendModal = ({ submission, onClose, onStatusUpdate, onUpdateSubmission }) => {
  const [selectedStatus, setSelectedStatus] = useState(submission.status || '');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission.history || []);
  const [projectId, setProjectId] = useState(submission.projectId || null);
  const [fullSubmission, setFullSubmission] = useState({ ...submission, id: submission.id });

  if (!submission) return null;

  const {
    firstName,
    lastName,
    email,
    phone,
    artistBio,
    inspiration,
    submittedAt,
  } = fullSubmission;

  const handleStatusUpdate = async (newStatus) => {
    setSelectedStatus(newStatus);
    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      if (onUpdateSubmission) {
        onUpdateSubmission({
          ...fullSubmission,
          status: newStatus,
          overviewStatus,
          history: [...history, historyEntry],
        });
      }

      if (onStatusUpdate) {
        onStatusUpdate(fullSubmission.id, newStatus);
      }
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!notes.trim()) return;
    try {
      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const timestamp = new Date().toISOString();
      const noteEntry = { type: 'note', value: notes.trim(), timestamp };

      await updateDoc(submissionRef, {
        history: arrayUnion(noteEntry),
      });

      setHistory((prev) => [...prev, noteEntry]);
      setNotes('');
    } catch (err) {
      console.error('❌ Failed to save note:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => console.log(`📋 Copied: ${text}`))
      .catch((err) => console.error('❌ Copy failed:', err));
  };

  const createProject = async () => {
    const confirmCreation = window.confirm(`Create Project for ${firstName} ${lastName}?`);
    if (!confirmCreation) return;

    try {
      const projectData = {
        source: 'SoundLegend',
        submissionId: fullSubmission.id,
        customerName: `${firstName} ${lastName}`,
        customer: {
          name: `${firstName} ${lastName}`,
          email,
          phone: phone || '',
          address: { street: '', city: '', state: '', zip: '' },
        },
        artisanLine: "SoundLegend",
        width: '14"',
        shellDepth: '8"',
        startDate: Timestamp.now(),
        currentPhase: 'Step 1. Wood Preparation',
        ...defaultStepData,         // ✅ workflow
        ...defaultProjectFields     // ✅ proposal specs
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = projectRef.id;

      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const systemEntry = {
        type: 'system',
        value: `Project created: ${projectId}`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(submissionRef, {
        projectId,
        history: arrayUnion(systemEntry),
      });

      setProjectId(projectId);
      setHistory((prev) => [systemEntry, ...prev]);

      alert(`✅ Project created successfully!\n\nID: ${projectId}`);
      if (onUpdateSubmission) {
        onUpdateSubmission({
          ...fullSubmission,
          projectId,
          history: [systemEntry, ...history],
        });
      }
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAndValidateSubmission = async () => {
      try {
        const ref = doc(db, 'soundlegend_submissions', submission.id);
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

        setFullSubmission({ ...data, id: submission.id });
        setProjectId(validProjectId);
        setHistory(data.history || []);
        setSelectedStatus(data.status || 'New');
      } catch (err) {
        console.error('❌ Error loading/validating submission:', err);
      }
    };

    fetchAndValidateSubmission();
  }, [submission.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <h2 className="modal-title">SoundLegend Submission</h2>

        <div className="modal-status-update">
          <label><strong>Status:</strong></label>
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="status-select"
          >
            {STATUS_OPTIONS.soundlegend.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="compact-inquiry-details">
          <div className="detail-group">
            <strong>Name:</strong> {firstName} {lastName}
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(`${firstName} ${lastName}`)}
              title="Copy name"
            >
              📋
            </button>
          </div>
          <div className="detail-group">
            <strong>Email:</strong> {email}
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(email)}
              title="Copy email"
            >
              📋
            </button>
          </div>
          {phone && (
            <div className="detail-group">
              <strong>Phone:</strong> {phone}
            </div>
          )}
          {submittedAt?.seconds && (
            <div className="detail-group">
              <strong>Submitted:</strong> {new Date(submittedAt.seconds * 1000).toLocaleString()}
            </div>
          )}
          {projectId ? (
            <div className="detail-group">
              <strong>Linked Project:</strong>{' '}
              <a href={`/projects/${projectId}`} target="_blank" rel="noreferrer" className="project-link">
                Open Project ↗
              </a>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(projectId)}
                title="Copy Project ID"
              >
                📋
              </button>
            </div>
          ) : (
            <button className="create-project-btn" onClick={createProject}>
              Create Project
            </button>
          )}
          <button
            className="add-contact-btn"
            onClick={() =>
              generateAndDownloadVCard({ firstName, lastName, email, phone })
            }
          >
            Download Contact Card
          </button>
        </div>

        {artistBio && (
          <div className="modal-item">
            <strong>Artist Bio:</strong>
            <p>{artistBio}</p>
          </div>
        )}

        {inspiration && (
          <div className="modal-item">
            <strong>Inspiration:</strong>
            <p>{inspiration}</p>
          </div>
        )}

        <div className="modal-item">
          <label><strong>Add Note:</strong></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="note-input"
            placeholder="Write an internal note..."
            rows={3}
          />
          <button
            className="add-note-btn"
            onClick={handleNoteSubmit}
            disabled={!notes.trim()}
          >
            Save Note
          </button>
        </div>

        <div className="history-log">
          <h4>History</h4>
          {history.length === 0 ? (
            <p>No history available.</p>
          ) : (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.type === 'status' ? 'Status' : entry.type}</td>
                    <td>{entry.value}</td>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button className="inquiry-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewSoundlegendModal;