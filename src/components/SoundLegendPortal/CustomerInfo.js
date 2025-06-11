import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './CustomerInfo.css';

const CustomerInfo = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const ref = doc(db, 'projects', projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  const customer = project?.customer || {};
  const address = customer?.address || {};
  const preferences = customer?.communicationPreference || {};

  if (loading) return <div className="scope-section">Loading...</div>;
  if (!project) return <div className="scope-section">Project not found.</div>;

  return (
    <div className="scope-section">
      <h2>Customer Info</h2>
      <p><strong>Name:</strong> {customer.name || 'N/A'}</p>
      <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
      <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
      <p>
        <strong>Address:</strong>{' '}
        {[address.street, address.city, address.state, address.zip].filter(Boolean).join(', ') || 'N/A'}
      </p>
      <div className="comm-pref">
        <p><strong>Communication Preference:</strong></p>
        <label>
          <input type="checkbox" checked={preferences.text === true} disabled /> Text
        </label>
        <label>
          <input type="checkbox" checked={preferences.email === true} disabled /> Email
        </label>
      </div>
    </div>
  );
};

export default CustomerInfo;