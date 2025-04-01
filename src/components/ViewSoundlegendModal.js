import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ViewSoundlegendModal.css';

const statusOptions = [
  'New',
  'Prospecting',
  'Closed - Won',
  'Closed - Lost',
  'Closed - Incomplete Form',
  'Closed - No Response',
];

const ViewSoundlegendModal = ({ submission, onClose, onStatusUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(submission.status || '');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission.history || []);

  if (!submission) return null;

  const {
    id,
    firstName,
    lastName,
    email,
    phone,
    artistBio,
    inspiration,
    submittedAt
  } = submission;

  const handleStatusUpdate = async (newStatus) => {
    setSelectedStatus(newStatus);
    try {
      const submissionRef = doc(db, 'soundlegend_submissions', id);
      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      if (onStatusUpdate) {
        onStatusUpdate(id, newStatus);
      }
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!notes.trim()) return;
    try {
      const submissionRef = doc(db, 'soundlegend_submissions', id);
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
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="compact-inquiry-details">
          <div className="detail-group"><strong>Name:</strong> {firstName} {lastName}</div>
          <div className="detail-group"><strong>Email:</strong> {email}</div>
          {phone && <div className="detail-group"><strong>Phone:</strong> {phone}</div>}
          {submittedAt?.seconds && (
            <div className="detail-group"><strong>Submitted:</strong> {new Date(submittedAt.seconds * 1000).toLocaleString()}</div>
          )}
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
          <button className="add-note-btn" onClick={handleNoteSubmit} disabled={!notes.trim()}>
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
                    <td>{entry.type === 'status' ? 'Status' : 'Note'}</td>
                    <td>{entry.value}</td>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button className="inquiry-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ViewSoundlegendModal;