import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewInquiryModal from './ViewInquiryModal'; // Assume there's a modal component to view inquiry details
import './ManageInquiries.css';

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const inquiriesCollection = collection(db, 'inquiries');
        const inquirySnapshot = await getDocs(inquiriesCollection);
        const inquiriesList = inquirySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id, // Firestore document ID for delete functionality
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'No date available',
            status: data.status || 'No status available',
            category: data.category || 'No category available',
            name: data.name || 'No name available',
            email: data.email || 'No email available',
            subject: data.subject || 'No subject available',
            message: data.message || 'No message available',
          };
        });
        setInquiries(inquiriesList);
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        setError('Error fetching inquiries: ' + error.message);
      }
    };

    fetchInquiries();
  }, []);

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInquiry(null);
  };

  const handleDeleteInquiry = async (inquiryId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryId));
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      setError('Error deleting inquiry: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="manage-inquiries">
      <h2>Manage Inquiries</h2>
      <table className="manage-inquiries-table">
        <thead>
          <tr>
            <th>Created At</th>
            <th>Status</th>
            <th>Category</th>
            <th>Name</th>
            <th>Email</th>
            <th>Subject</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.length === 0 ? (
            <tr>
              <td colSpan="7">No inquiries available</td>
            </tr>
          ) : (
            inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>{inquiry.createdAt}</td>
                <td>{inquiry.status}</td>
                <td>{inquiry.category}</td>
                <td>{inquiry.name}</td>
                <td>{inquiry.email}</td>
                <td>{inquiry.subject}</td>
                <td>
                  <button className="view-btn" onClick={() => handleViewInquiry(inquiry)}>View</button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteInquiry(inquiry.id)} 
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && selectedInquiry && (
        <ViewInquiryModal inquiry={selectedInquiry} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ManageInquiries;
