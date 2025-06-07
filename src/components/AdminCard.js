import React, { useState, useEffect } from 'react';
import './AdminCard.css';
import AdminModal from './AdminModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { isAdmin } = useAuth();
  const [highSeverityCount, setHighSeverityCount] = useState(0);
  const [mediumSeverityCount, setMediumSeverityCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ green: 0, yellow: 0, red: 0 });

  const AdminCard = ({ title, icon, isSelected, onClick, badgeCounts }) => {

useEffect(() => {
  const fetchProjectStatuses = async () => {
    const q = query(collection(db, 'projects'));
    const snapshot = await getDocs(q);

    let green = 0, yellow = 0, red = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Extract status logic — mirror determineStatus()
      const createdAt = data.startDate?.seconds ? new Date(data.startDate.seconds * 1000) : null;
      const progress = calculateProgress(data);

      if (!createdAt) return;

      let target = data.targetCompletion?.seconds
        ? new Date(data.targetCompletion.seconds * 1000)
        : new Date(createdAt.setDate(createdAt.getDate() + 35));

      const buffer = new Date(target);
      buffer.setDate(buffer.getDate() + 14);

      const now = new Date();
      const elapsedDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const totalDays = (buffer - createdAt) / (1000 * 60 * 60 * 24);
      if (totalDays <= 0 || elapsedDays < 0) return;

      const expected = elapsedDays / totalDays;

      if (progress > expected + 0.15 || progress >= expected) green++;
      else if (progress >= expected - 0.1) yellow++;
      else red++;
    });

    setStatusCounts({ green, yellow, red });
  };

  if (title === 'Manage Projects') {
    fetchProjectStatuses();
  }
}, [title]);

const calculateProgress = (project) => {
  const weights = {
    woodPreparation: 0.05,
    shellConstruction: 0.2,
    fineTuning: 0.1,
    shellExteriorFinish: 0.2,
    bearingEdges: 0.1,
    snareBedCutting: 0.1,
    hardwareDrilling: 0.1,
    hardwareAssembly: 0.05,
    tuningAndDetailing: 0.05,
    qualityCheck: 0.05,
  };

  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const checklist = project[key]?.checklist;
    if (!checklist?.length) continue;
    const completed = checklist.filter((item) => item.completed).length;
    total += (completed / checklist.length) * weight;
  }
  return total;
};

  useEffect(() => {
    const fetchRiskCounts = async () => {
      try {
        const q = query(collection(db, 'risk_notifications'));
        const snapshot = await getDocs(q);

        let high = 0;
        let medium = 0;

        snapshot.forEach((doc) => {
          const score = doc.data().score || 0;
          if (score >= 0.85) high++;
          else if (score >= 0.5) medium++;
        });

        setHighSeverityCount(high);
        setMediumSeverityCount(medium);
      } catch (error) {
        console.error('Error fetching risk notification counts:', error);
      }
    };

    if (title === 'Risk Alerts') {
      fetchRiskCounts();
    }
  }, [title]);

  const handleAddClick = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
  };

  return (
<div
  className={`admin-card ${isSelected ? 'selected' : ''}`}
  role="button"
  tabIndex={0}
  aria-pressed={isSelected}
  onClick={onClick}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
      <div className="admin-card-icon">
        {icon}
        <div className="badge-wrapper">
  {title === 'Risk Alerts' && (
    <>
      {highSeverityCount > 0 && (
        <span className="notification-badge">{highSeverityCount}</span>
      )}
      {mediumSeverityCount > 0 && (
        <span className="notification-badge-secondary">{mediumSeverityCount}</span>
      )}
    </>
  )}
  {title === 'Manage Projects' && badgeCounts && (
  <>
    {badgeCounts.green > 0 && (
      <span className="project-badge green-badge">{badgeCounts.green}</span>
    )}
    {badgeCounts.yellow > 0 && (
      <span className="project-badge yellow-badge">{badgeCounts.yellow}</span>
    )}
    {badgeCounts.red > 0 && (
      <span className="project-badge red-badge">{badgeCounts.red}</span>
    )}
  </>
)}
</div>
      </div>
      <h2 className="admin-card-title">{title}</h2>

      {isAdmin && (
        <div className="admin-card-buttons">
          <button onClick={() => handleAddClick('user')}>Add User</button>
          <button onClick={() => handleAddClick('product')}>Add Product</button>
          <button onClick={() => handleAddClick('order')}>Add Order</button>
        </div>
      )}

      {isModalOpen && (
        <AdminModal type={modalType} onClose={closeModal} />
      )}
    </div>
  );
};

export default AdminCard;