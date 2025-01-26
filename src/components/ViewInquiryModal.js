import React, { useState } from 'react';
import { MdContentCopy } from 'react-icons/md'; // Copy icon
import { updateDoc, arrayUnion, doc } from 'firebase/firestore'; // Firestore utilities
import { db } from '../firebaseConfig';
import './ViewInquiryModal.css';

const ViewInquiryModal = ({ inquiry, onClose, onStatusChange }) => {
  const [note, setNote] = useState(''); // Input for adding a new note
  const [loading, setLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState(inquiry.internalNotes || []); // Notes history state

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Add internal note to Firestore and update the local state
  const handleAddNote = async () => {
    if (!note.trim()) return alert('Note cannot be empty.');
    setLoading(true);

    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);
      const newNote = {
        text: note,
        timestamp: new Date().toISOString(),
      };

      // Update Firestore
      await updateDoc(inquiryRef, {
        internalNotes: arrayUnion(newNote),
      });

      // Update local state
      setInternalNotes((prevNotes) => [...prevNotes, newNote]);
      setNote(''); // Clear input
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Inquiry Details</h3>

        {/* Inquiry Details */}
        <div className="modal-item">
          <strong>Date:</strong> <span>{inquiry.createdAt}</span>
        </div>
        <div className="modal-item">
          <strong>Category:</strong> <span>{inquiry.category}</span>
        </div>
        <div className="modal-item">
          <strong>Origin:</strong> <span>{inquiry.origin}</span>
        </div>
        <div className="modal-item">
          <strong>Name:</strong> <span>{inquiry.name}</span>
        </div>
        <div className="modal-item">
          <strong>Email:</strong>
          <span className="copyable-field">
            {inquiry.email}
            <MdContentCopy
              className="copy-icon"
              onClick={() => copyToClipboard(inquiry.email)}
              title="Copy Email"
            />
          </span>
        </div>
        <div className="modal-item">
          <strong>Message:</strong>
          <span className="copyable-field">
            {inquiry.message}
            <MdContentCopy
              className="copy-icon"
              onClick={() => copyToClipboard(inquiry.message)}
              title="Copy Message"
            />
          </span>
        </div>
        <div className="modal-item">
          <strong>Status:</strong>
          <select
            value={inquiry.status}
            onChange={(e) => onStatusChange(inquiry.id, e.target.value)}
            className="status-select"
          >
            <option value="New">New</option>
            <option value="Support - In Progress">Support - In Progress</option>
            <option value="Support - Closed">Support - Closed</option>
            <option value="Sales - Prospecting">Sales - Prospecting</option>
            <option value="Sales - Closed Won">Sales - Closed Won</option>
            <option value="Sales - Closed Lost">Sales - Closed Lost</option>
          </select>
        </div>

        {/* Internal Notes Section */}
        <div className="modal-item">
          <strong>Internal Notes:</strong>
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
        </div>

        {/* Notes History Section */}
        <div className="history-log">
          <h4>History Log</h4>
          <ul className="notes-history">
            {internalNotes.length > 0 ? (
              internalNotes.map((note, index) => (
                <li key={index}>
                  <span>{note.text}</span>{' '}
                  <em>({new Date(note.timestamp).toLocaleString()})</em>
                </li>
              ))
            ) : (
              <li>No notes available.</li>
            )}
          </ul>
        </div>

        {/* Close Button */}
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewInquiryModal;