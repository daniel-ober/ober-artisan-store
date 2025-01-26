import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewInquiryModal from './ViewInquiryModal';
import './ManageInquiries.css';

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [loading, setLoading] = useState(false);

  const [showSupportClosed, setShowSupportClosed] = useState(false);
  const [showSalesClosedWon, setShowSalesClosedWon] = useState(false);
  const [showSalesClosedLost, setShowSalesClosedLost] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
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
          convertToSales: data.convertToSales || false,
          category: data.category || 'General',
          origin: data.origin || 'Contact Form',
          name: `${data.first_name || ''} ${data.last_name || ''}`,
          email: data.email || 'N/A',
          message: data.message || '',
        };
      });

      setInquiries(inquiriesList);
      applyFilters(inquiriesList);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    applyFilters(inquiries);
  }, [showSupportClosed, showSalesClosedWon, showSalesClosedLost]);

  const handleRefresh = () => {
    fetchInquiries();
  };

  const applyFilters = (inquiriesList) => {
    const filteredList = inquiriesList.filter((inquiry) => {
      if (!showSupportClosed && inquiry.status === 'Support - Closed') return false;
      if (!showSalesClosedWon && inquiry.status === 'Sales - Closed Won') return false;
      if (!showSalesClosedLost && inquiry.status === 'Sales - Closed Lost') return false;
      return true;
    });

    setFilteredInquiries(filteredList);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = '';
    }
    setSortConfig({ key, direction });

    const sortedList = direction
      ? [...filteredInquiries].sort((a, b) => {
          if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
          if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
          return 0;
        })
      : filteredInquiries;

    setFilteredInquiries(sortedList);
  };

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, { status: newStatus });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      );

      setInquiries(updatedInquiries);
      applyFilters(updatedInquiries);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this inquiry?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));

      const updatedInquiries = inquiries.filter((inquiry) => inquiry.id !== inquiryId);

      setInquiries(updatedInquiries);
      applyFilters(updatedInquiries);
    } catch (error) {
      console.error('Error deleting inquiry:', error);
    }
  };

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry); // Set the selected inquiry
    setIsModalOpen(true); // Open the modal
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'New':
        return 'status-new';
      case 'Support - In Progress':
        return 'status-in-progress';
      case 'Sales - Prospecting':
        return 'status-prospecting';
      default:
        return 'status-other';
    }
  };

  return (
    <div className="manage-inquiries">
      <div className="inquiries-header">
        <h2>Manage Inquiries</h2>
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="filters">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showSupportClosed}
            onChange={(e) => setShowSupportClosed(e.target.checked)}
          />
          Show Support - Closed
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showSalesClosedWon}
            onChange={(e) => setShowSalesClosedWon(e.target.checked)}
          />
          Show Sales - Closed Won
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showSalesClosedLost}
            onChange={(e) => setShowSalesClosedLost(e.target.checked)}
          />
          Show Sales - Closed Lost
        </label>
      </div>

      <table className="manage-inquiries-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('createdAt')}>Created At</th>
            <th>Name</th>
            <th>Category</th>
            <th onClick={() => handleSort('status')}>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInquiries.map((inquiry) => (
            <tr key={inquiry.id} className={getStatusClass(inquiry.status)}>
              <td>{inquiry.createdAt}</td>
              <td>{inquiry.name}</td>
              <td>{inquiry.category}</td>
              <td>
                <select
                  value={inquiry.status}
                  onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Support - In Progress">Support - In Progress</option>
                  <option value="Support - Closed">Support - Closed</option>
                  <option value="Sales - Prospecting">Sales - Prospecting</option>
                  <option value="Sales - Closed Won">Sales - Closed Won</option>
                  <option value="Sales - Closed Lost">Sales - Closed Lost</option>
                </select>
              </td>
              <td>
                <button className="view-btn" onClick={() => handleViewInquiry(inquiry)}>
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
        />
      )}
    </div>
  );
};

export default ManageInquiries;