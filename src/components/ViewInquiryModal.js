import React, { useEffect, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ViewInquiryModal.css';

const ViewInquiryModal = ({ inquiry, onClose, onStatusChange, onCategoryChange }) => {
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
          setInternalNotes(data.internalNotes?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []);
          setSystemHistory(data.systemHistory?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };

    fetchDetails();
  }, [inquiry.id]);

  const handleAddNote = async () => {
    if (!note.trim()) return alert('Note cannot be empty.');
    setLoading(true);

    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);
      const newNote = {
        text: note,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        internalNotes: arrayUnion(newNote),
      });

      setInternalNotes((prevNotes) => [newNote, ...prevNotes]);
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);
      const statusChangeEvent = {
        event: `Status changed to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        status: newStatus,
        systemHistory: arrayUnion(statusChangeEvent),
      });

      setSystemHistory((prevHistory) => [statusChangeEvent, ...prevHistory]);
      onStatusChange(inquiry.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleCategoryChange = async (newCategory) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiry.id);
      const categoryChangeEvent = {
        event: `Category changed to "${newCategory}"`,
        timestamp: new Date().toISOString(),
      };
  
      // Update Firestore document with the new category
      await updateDoc(inquiryRef, {
        category: newCategory,
        systemHistory: arrayUnion(categoryChangeEvent),
      });
  
      // Update local state for the System History
      setSystemHistory((prevHistory) => [categoryChangeEvent, ...prevHistory]);
  
      // Call the parent-provided function to update the category in the parent state
      if (onCategoryChange) {
        onCategoryChange(inquiry.id, newCategory);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please check your network connection or try again later.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
              <option value="New">New</option>
              <option value="Support - In Progress">Support - In Progress</option>
              <option value="Support - Closed">Support - Closed</option>
              <option value="Sales - Prospecting">Sales - Prospecting</option>
              <option value="Sales - Closed Won">Sales - Closed Won</option>
              <option value="Sales - Closed Lost">Sales - Closed Lost</option>
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

        <div className="modal-item">
          <strong>Name:</strong> {inquiry.name}
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

        <div className="history-log">
          <h4>Notes History</h4>
          {internalNotes.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {internalNotes.map((note, index) => (
                  <tr key={index}>
                    <td>{note.text}</td>
                    <td>{new Date(note.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No notes available.</p>
          )}

          <h4>System History</h4>
          {systemHistory.length > 0 ? (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {systemHistory.map((event, index) => (
                  <tr key={index}>
                    <td>{event.event}</td>
                    <td>{new Date(event.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No system history available.</p>
          )}
        </div>

        <button className="inquiry-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewInquiryModal;