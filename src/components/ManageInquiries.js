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
  const [hideClosedItems, setHideClosedItems] = useState(true); // ✅ renamed + default checked

  const fetchInquiries = async () => {
    try {
      const inquiriesCollection = collection(db, 'inquiries');
      const inquirySnapshot = await getDocs(inquiriesCollection);
      const inquiriesList = inquirySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const statusRaw = (data.status || '').toLowerCase();
        let overviewStatus = 'new';
        if (statusRaw.includes('progress')) overviewStatus = 'inProgress';
        else if (statusRaw.includes('closed')) overviewStatus = 'completed';

        return {
          id: docSnapshot.id,
          overviewStatus,
          createdAt: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : 'No date',
          status: data.status || 'New',
          notes: data.internalNotes || [],
          systemHistory: data.systemHistory || [],
          category: data.category || 'General',
          origin: data.origin || 'Contact Form',
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email || 'N/A',
          message: data.message || '',
        };
      });

      setInquiries(inquiriesList);
      filterInquiries(inquiriesList, hideClosedItems);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries(inquiries, hideClosedItems);
  }, [hideClosedItems, inquiries]);

  const filterInquiries = (inquiriesList, hideClosed) => {
    const filtered = hideClosed
      ? inquiriesList.filter((inquiry) => inquiry.overviewStatus !== 'completed')
      : inquiriesList;
    setFilteredInquiries(filtered);
  };

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

      const updated = inquiries.map((i) =>
        i.id === inquiryId ? { ...i, status: newStatus } : i
      );
      setInquiries(updated);

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

  const handleCategoryUpdate = async (inquiryId, newCategory) => {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      const changeEvent = {
        event: `Category changed to "${newCategory}"`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(inquiryRef, {
        category: newCategory,
        systemHistory: arrayUnion(changeEvent),
      });

      const updated = inquiries.map((i) =>
        i.id === inquiryId ? { ...i, category: newCategory } : i
      );
      setInquiries(updated);

      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry((prev) => ({
          ...prev,
          category: newCategory,
          systemHistory: [changeEvent, ...prev.systemHistory],
        }));
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  return (
    <div className="manage-inquiries">
      <h2>Manage Inquiries</h2>

      <label className="toggle-low">
        <input
          type="checkbox"
          checked={hideClosedItems}
          onChange={(e) => setHideClosedItems(e.target.checked)}
        />
        Hide Closed Items
      </label>

      <div className="inquiries-table-wrapper">
        <table className="inquiries-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Created At</th>
              <th>Name</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map((inq) => (
              <tr
                key={inq.id}
                onClick={() => {
                  setSelectedInquiry(inq);
                  setIsModalOpen(true);
                }}
                className="clickable-row"
              >
                <td>
                  <span
                    className={`status-badge ${
                      inq.status.toLowerCase().includes('prospecting') ||
                      inq.status.toLowerCase().includes('in progress')
                        ? 'in-progress'
                        : inq.status.toLowerCase().includes('closed')
                        ? 'closed'
                        : 'new'
                    }`}
                  >
                    {inq.status}
                  </span>
                </td>
                <td>{inq.createdAt}</td>
                <td>{inq.name}</td>
                <td>{inq.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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