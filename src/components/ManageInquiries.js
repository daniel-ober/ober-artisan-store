import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewInquiryModal from './ViewInquiryModal';
import './ManageInquiries.css';

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClosedItems, setShowClosedItems] = useState(false); // Toggle for showing closed items

  // Fetch inquiries from Firestore
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
          systemHistory: data.systemHistory || [],
          category: data.category || 'General',
          origin: data.origin || 'Contact Form',
          name: `${data.first_name || ''} ${data.last_name || ''}`,
          email: data.email || 'N/A',
          message: data.message || '',
        };
      });

      setInquiries(inquiriesList);
      filterInquiries(inquiriesList, showClosedItems); // Filter based on the toggle state
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries(inquiries, showClosedItems);
  }, [showClosedItems, inquiries]);

  const filterInquiries = (inquiriesList, showClosed) => {
    if (showClosed) {
      setFilteredInquiries(inquiriesList);
    } else {
      setFilteredInquiries(
        inquiriesList.filter(
          (inquiry) =>
            inquiry.status !== 'Support - Closed' &&
            inquiry.status !== 'Sales - Closed Won' &&
            inquiry.status !== 'Sales - Closed Lost'
        )
      );
    }
  };

  // Update inquiry status
  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      const statusChangeEvent = {
        event: `Status changed to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        status: newStatus,
        systemHistory: arrayUnion(statusChangeEvent),
      });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      );

      setInquiries(updatedInquiries);

      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry((prev) => ({
          ...prev,
          status: newStatus,
          systemHistory: [statusChangeEvent, ...prev.systemHistory],
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Update inquiry category
  const handleCategoryUpdate = async (inquiryId, newCategory) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      const categoryChangeEvent = {
        event: `Category changed to "${newCategory}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        category: newCategory,
        systemHistory: arrayUnion(categoryChangeEvent),
      });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, category: newCategory } : inquiry
      );

      setInquiries(updatedInquiries);

      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry((prev) => ({
          ...prev,
          category: newCategory,
          systemHistory: [categoryChangeEvent, ...prev.systemHistory],
        }));
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  return (
    <div className="manage-inquiries">
      <h2>Manage Inquiries</h2>
      <label>
        <input
          type="checkbox"
          checked={showClosedItems}
          onChange={(e) => setShowClosedItems(e.target.checked)}
        />
        Show Closed Items
      </label>
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
          onCategoryChange={handleCategoryUpdate}
        />
      )}
    </div>
  );
};

export default ManageInquiries;