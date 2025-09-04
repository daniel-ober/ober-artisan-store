import React, { useEffect, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';
import './ViewInquiryModal.css';
import './AdminModalTheme.css';

const ViewInquiryModal = ({
  inquiry,
  onClose,
  onStatusChange,
  onCategoryChange,
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const inquiryRef = doc(db, 'inquiries', inquiry.id);
        const inquiryDoc = await getDoc(inquiryRef);
        if (inquiryDoc.exists()) {
          const data = inquiryDoc.data();
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
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };

    fetchDetails();
  }, [inquiry.id]);

  const handleAddNote = async () => {
    if (!note.trim()) {
      alert('Note cannot be empty.');
      return;
    }
    setLoading(true);

    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);
      const newNote = {
        text: note.trim(),
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        internalNotes: arrayUnion(newNote),
      });

      setInternalNotes((prev) => [newNote, ...prev]);
      setNote('');
    } catch (error) {
      console.error('🔥 Full error adding note:', error);
      alert(`Failed to add note:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const overviewStatus = getOverviewStatus('inquiry', newStatus);
      const inquiryRef = doc(db, 'inquiries', inquiry.id);

      const statusChangeEvent = {
        event: `Status changed to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        status: newStatus,
        overviewStatus,
        systemHistory: arrayUnion(statusChangeEvent),
      });

      setSystemHistory((prev) => [statusChangeEvent, ...prev]);
      onStatusChange?.(inquiry.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const Copyable = ({ text, label }) => (
  <span className="copyable-field">
    {text}
    <MdContentCopy
      className="copy-icon"
      onClick={() => copyToClipboard(text)}
      title={`Copy ${label}`}
    />
  </span>
);

  const handleCategoryChange = async (newCategory) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);

      const categoryChangeEvent = {
        event: `Category changed to "${newCategory}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        category: newCategory,
        systemHistory: arrayUnion(categoryChangeEvent),
      });

      setSystemHistory((prev) => [categoryChangeEvent, ...prev]);
      onCategoryChange?.(inquiry.id, newCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!inquiry) return null;

  return (
    <div className="modal-overlay inquirymodal light" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="modal-close icon-btn"
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="modal-title">Inquiry Details</h3>

        <div className="compact-inquiry-details">
          <div className="detail-group">
            <strong>Date:</strong> <span>{inquiry.createdAt}</span>
          </div>
          <div className="detail-group">
            <strong>Origin:</strong> <span>{inquiry.origin}</span>
          </div>
          <div className="detail-group">
            <strong>Status:</strong>
            <select
              value={inquiry.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
            >
              {STATUS_OPTIONS.inquiry.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-group">
            <strong>Category:</strong>
            <select
              value={inquiry.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="status-select"
            >
              <option value="Billing">Billing</option>
              <option value="Custom Shop">Custom Shop</option>
              <option value="Partner Relations">Partner Relations</option>
              <option value="Product Information">Product Information</option>
              <option value="Shipping & Delivery">Shipping & Delivery</option>
              <option value="Technical Assistance">Technical Assistance</option>
              <option value="Website Feedback">Website Feedback</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

<div className="info-block">
  <div className="row">
    <strong>Name:</strong> <Copyable text={inquiry.name} label="Name" />
  </div>
  <div className="row">
    <strong>Email:</strong> <Copyable text={inquiry.email} label="Email" />
  </div>
  <div className="row">
    <strong>Message:</strong> <Copyable text={inquiry.message} label="Message" />
  </div>
</div>

        <h3 className="section-title">Internal Notes</h3>
        <textarea
          className="note-input"
          placeholder="Add a new internal note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          className="add-note-btn"
          onClick={handleAddNote}
          disabled={loading}
        >
          {loading ? 'Adding Note...' : 'Add Note'}
        </button>

        <div className="history-log">
          <h3 className="section-title">Notes History</h3>
          {internalNotes.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {internalNotes.map((n, i) => (
                  <tr key={i}>
                    <td>{n.text}</td>
                    <td>{new Date(n.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No notes available.</p>
          )}

          <h3 className="section-title">System History</h3>
          {systemHistory.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {systemHistory.map((ev, i) => (
                  <tr key={i}>
                    <td>{ev.event}</td>
                    <td>{new Date(ev.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No system history available.</p>
          )}
        </div>

        <button className="inquiry-close-btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewInquiryModal;
