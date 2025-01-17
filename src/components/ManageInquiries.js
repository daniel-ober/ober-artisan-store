import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewInquiryModal from './ViewInquiryModal';
import './ManageInquiries.css';

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [sortedInquiries, setSortedInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [loading, setLoading] = useState(false);

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
      setSortedInquiries(inquiriesList);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleRefresh = () => {
    fetchInquiries();
  };

  const applySorting = (list, key, direction) => {
    return [...list].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
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
      ? applySorting(inquiries, key, direction)
      : inquiries;

    setSortedInquiries(sortedList);
  };

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, { status: newStatus });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      );

      setInquiries(updatedInquiries);
      setSortedInquiries(updatedInquiries);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleConvertToLead = async (inquiryId) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, {
        convertToSales: true,
        status: 'Converted to Sales',
      });

      const updatedInquiries = inquiries.map((inquiry) =>
        inquiry.id === inquiryId
          ? { ...inquiry, convertToSales: true, status: 'Converted to Sales',  salesStage: 'Prospecting' }
          : inquiry
      );

      setInquiries(updatedInquiries);
      setSortedInquiries(updatedInquiries);
    } catch (error) {
      console.error('Error converting to sales lead:', error);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this inquiry?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));

      const updatedInquiries = inquiries.filter((inquiry) => inquiry.id !== inquiryId);

      setInquiries(updatedInquiries);
      setSortedInquiries(updatedInquiries);
    } catch (error) {
      console.error('Error deleting inquiry:', error);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'New':
        return 'status-new';
      case 'Converted to Sales':
        return 'status-converted';
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

      <table className="manage-inquiries-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('createdAt')}>Created At</th>
            <th>Name</th>
            <th>Category</th>
            {/* <th>Origin</th> */}
            <th onClick={() => handleSort('status')}>Status</th>
            {/* <th onClick={() => handleSort('email')}>Email</th> */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedInquiries.map((inquiry) => (
            <tr key={inquiry.id} className={getStatusClass(inquiry.status)}>
              <td>{inquiry.createdAt}</td>
              <td>{inquiry.name}</td>
              <td>{inquiry.category}</td>
              {/* <td>{inquiry.origin}</td> */}
              <td>
                <select
                  value={inquiry.status}
                  onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="In Progress - Artisan">In Progress</option>
                  <option value="Converted to Sales">Converted to Sales</option>
                  <option value="Closed">Closed</option>
                </select>
              </td>
              {/* <td>{inquiry.email}</td> */}
              <td>
                <button className="view-btn">View</button>
                {/* <button className="delete-btn" onClick={() => handleDeleteInquiry(inquiry.id)}>Delete</button> */}
                {/* <button
                  className="convert-btn"
                  onClick={() => handleConvertToLead(inquiry.id)}
                  disabled={inquiry.convertToSales}
                >
                  {inquiry.convertToSales ? 'CONVERTED' : 'Convert to Sales'}
                </button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageInquiries;