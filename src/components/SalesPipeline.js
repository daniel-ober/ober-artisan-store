import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SalesPipeline = () => {
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      const inquiriesCollection = collection(db, 'inquiries');
      const inquirySnapshot = await getDocs(inquiriesCollection);
      const leadsList = inquirySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((inq) => ['Sales Lead: Qualified', 'Sales Lead: Non-Qualified'].includes(inq.category));
      setLeads(leadsList);
    };

    const fetchOrders = async () => {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const ordersList = orderSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersList);
    };

    fetchLeads();
    fetchOrders();
  }, []);

  return (
    <div className="sales-pipeline">
      <h2>Sales Pipeline</h2>
      <div className="pipeline-section">
        <h3>Qualified Leads</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Description</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="6">No leads available</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{new Date(lead.dateReceived).toLocaleDateString()}</td>
                  <td>{`${lead.firstName} ${lead.lastName}`}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</td>
                  <td>{lead.message.substring(0, 50)}...</td>
                  <td>{lead.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pipeline-section">
        <h3>Sales Orders</h3>
        {/* Similar to ManageOrders, display sales orders here */}
        {/* You can add a similar table structure as used in ManageOrders */}
      </div>
    </div>
  );
};

export default SalesPipeline;
