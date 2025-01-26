import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewInquiryModal from './ViewInquiryModal';
import './ManageInquiries.css';

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInquiries = async () => {
    try {
      const inquiriesCollection = collection(db, 'inquiries');
      const inquirySnapshot = await getDocs(inquiriesCollection);
      const inquiriesList = inquirySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          createdAt: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : 'No date',
          status: data.status || 'New',
          notes: data.internalNotes || [],
          category: data.category || 'General',
          origin: data.origin || 'Contact Form',
          name: `${data.first_name || ''} ${data.last_name || ''}`,
          email: data.email || 'N/A',
          message: data.message || '',
        };
      });

      setInquiries(inquiriesList);
      setFilteredInquiries(inquiriesList);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, { status: newStatus });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      );

      setInquiries(updatedInquiries);
      setFilteredInquiries(updatedInquiries);

      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="manage-inquiries">
      <h2>Manage Inquiries</h2>
      <table className="manage-inquiries-table">
        <thead>
          <tr>
            <th>Created At</th>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInquiries.map((inquiry) => (
            <tr key={inquiry.id}>
              <td>{inquiry.createdAt}</td>
              <td>{inquiry.name}</td>
              <td>{inquiry.category}</td>
              <td>{inquiry.status}</td>
              <td>
                <button
                  className="view-btn"
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    setIsModalOpen(true);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && selectedInquiry && (
        <ViewInquiryModal
          inquiry={selectedInquiry}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default ManageInquiries;