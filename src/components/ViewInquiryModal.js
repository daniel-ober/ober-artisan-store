import React from 'react';
import './ViewInquiryModal.css';

const ViewInquiryModal = ({ inquiry, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Inquiry Details</h3>
        <p><strong>Date:</strong> {inquiry.inquiryDate}</p>
        <p><strong>Name:</strong> {inquiry.name}</p>
        <p><strong>Email:</strong> {inquiry.email}</p>
        <p><strong>Subject:</strong> {inquiry.subject}</p>
        <p><strong>Message:</strong> {inquiry.message}</p>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ViewInquiryModal;
