import React, { useEffect, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ViewRiskDetailModal.css';
import './AdminModalTheme.css';


const ViewRiskDetailModal = ({ risk, isOpen, onClose, onStatusChange }) => {
  const [note, setNote] = useState('');
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(risk?.status || 'New');

  useEffect(() => {
    if (!risk?.id) return;

    const fetchDetails = async () => {
      try {
        const ref = doc(db, 'risk_notifications', risk.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setInternalNotes(
            (data.internalNotes || []).sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
          );
          setSystemHistory(
            (data.systemHistory || []).sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
          );
          setStatus(data.status || 'New');
        }
      } catch (err) {
        console.error('Failed to fetch risk details:', err);
      }
    };

    fetchDetails();
  }, [risk?.id]);

  const handleAddNote = async () => {
    if (!note.trim()) return alert('Note cannot be empty.');
    setLoading(true);
    try {
      const ref = doc(db, 'risk_notifications', risk.id);
      const newNote = { text: note.trim(), timestamp: new Date().toISOString() };
      await updateDoc(ref, { internalNotes: arrayUnion(newNote) });
      setInternalNotes((prev) => [newNote, ...prev]);
      setNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert stored status into the pretty dropdown label
  const normalizeStatusForDropdown = (s) => {
    const cleaned = (s || '').toLowerCase().trim().replace(/\s+/g, '');
    if (cleaned === 'inprogress') return 'In Progress';
    if (cleaned === 'resolved' || cleaned === 'completed') return 'Completed';
    if (cleaned === 'dismissed') return 'Dismissed';
    return 'New';
  };

  // Map dropdown label back to stored status + derived overviewStatus
  const handleStatusChange = async (display) => {
    try {
      const ref = doc(db, 'risk_notifications', risk.id);

      const normalized = display.toLowerCase();
      const overviewStatus =
        normalized === 'in progress'
          ? 'inProgress'
          : normalized === 'completed' || normalized === 'dismissed'
          ? 'completed'
          : 'new';

      const statusChangeEvent = {
        event: `Status changed to "${display}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(ref, {
        status: display,
        overviewStatus,
        systemHistory: arrayUnion(statusChangeEvent),
      });

      setSystemHistory((prev) => [statusChangeEvent, ...prev]);
      setStatus(display);
      onStatusChange?.(risk.id, display);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!isOpen || !risk) return null;

  return (
    <div className="modal-overlay riskmodal" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button onClick={onClose} className="modal-close icon-btn" aria-label="Close">✕</button>
        <h3 className="modal-title">Risk Detail</h3>

        <div className="compact-risk-details">
          <div className="detail-group"><strong>Date:</strong> <span>{risk.timestamp?.toLocaleString?.() || String(risk.timestamp)}</span></div>
          <div className="detail-group"><strong>Score:</strong> <span>{Number(risk.score ?? 0).toFixed(2)}</span></div>
          <div className="detail-group"><strong>Severity:</strong> <span>{risk.severity}</span></div>
          <div className="detail-group"><strong>Type:</strong> <span>{risk.type}</span></div>
          <div className="detail-group">
            <strong>Status:</strong>
            <select
              value={normalizeStatusForDropdown(status)}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="info-block">
          <div className="row">
            <strong>Email:</strong>
            <span className="copyable-field">
              {risk.email || 'N/A'}
              {risk.email && (
                <MdContentCopy
                  className="copy-icon"
                  onClick={() => copyToClipboard(risk.email)}
                  title="Copy Email"
                />
              )}
            </span>
          </div>
          <div className="row">
            <strong>Source:</strong> <span>{risk.source || 'N/A'}</span>
          </div>
        </div>

        <h3 className="section-title">Add Note</h3>
        <textarea
          className="note-input"
          placeholder="Add a new internal note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="add-note-btn" onClick={handleAddNote} disabled={loading}>
          {loading ? 'Adding...' : 'Add Note'}
        </button>

        <div className="history-log">
          <h3 className="section-title">Internal Notes</h3>
          {internalNotes.length ? (
            <table className="notes-table">
              <thead>
                <tr><th>Note</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {internalNotes.map((n, i) => (
                  <tr key={i}><td>{n.text}</td><td>{new Date(n.timestamp).toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No internal notes.</p>
          )}

          <h3 className="section-title">System History</h3>
          {systemHistory.length ? (
            <table className="notes-table">
              <thead>
                <tr><th>Event</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {systemHistory.map((e, i) => (
                  <tr key={i}><td>{e.event}</td><td>{new Date(e.timestamp).toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No system history available.</p>
          )}
        </div>

        <button className="risk-close-btn btn--ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ViewRiskDetailModal;