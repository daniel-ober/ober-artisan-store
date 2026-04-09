import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewRiskDetailModal from './ViewRiskDetailModal'; // ✅ make sure this import is present
import './AdminRiskNotifications.css';

const getSeverity = (score) => {
  if (score >= 0.85) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
};

const AdminRiskNotifications = () => {
  const [risks, setRisks] = useState([]);
  const [showLow, setShowLow] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const normalizeStatusForDisplay = (status) => {
    const cleaned = status.toLowerCase().trim();
    if (cleaned === 'inprogress') return 'In Progress';
    if (cleaned === 'resolved' || cleaned === 'dismissed') return 'Completed';
    return 'New';
  };

  const normalizeStatus = (status) =>
    (status || '').toLowerCase().replace(/\s+/g, '');

  const handleStatusChange = (riskId, newStatus) => {
    setRisks((prev) =>
      prev.map((risk) =>
        risk.id === riskId
          ? {
              ...risk,
              status: newStatus,
              overviewStatus:
                newStatus.toLowerCase() === 'in progress'
                  ? 'inProgress'
                  : newStatus.toLowerCase() === 'completed'
                    ? 'completed'
                    : 'new',
            }
          : risk
      )
    );
  };

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const q = query(
          collection(db, 'risk_notifications'),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const riskData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const rawStatus = (data.status || '').toLowerCase().trim();
          const derivedStatus =
            rawStatus === 'in progress'
              ? 'inProgress'
              : rawStatus === 'completed' || rawStatus === 'resolved'
                ? 'completed'
                : 'new';

          return {
            id: doc.id,
            email: data.email || data.assessment?.email || 'N/A',
            type: data.type || 'Unknown',
            score: data.score || 0,
            timestamp: new Date(data.timestamp?.seconds * 1000 || 0),
            severity: getSeverity(data.score || 0),
            source: data.source || 'N/A',
            status: data.status || 'New',
            overviewStatus: derivedStatus,
          };
        });

        // Sort by severity then timestamp
        const severityRank = { High: 0, Medium: 1, Low: 2 };
        riskData.sort((a, b) => {
          const sA = severityRank[a.severity];
          const sB = severityRank[b.severity];
          return sA !== sB
            ? sA - sB
            : b.timestamp.getTime() - a.timestamp.getTime();
        });

        // ✅ Store all risks
        setRisks(riskData);

        // ✅ Count active ones for badge (optional - depends on export or state mgmt)
        const activeRiskCount = riskData.filter(
          (r) => r.overviewStatus === 'new' || r.overviewStatus === 'inProgress'
        ).length;

        // console.log('🔔 Active risk alerts:', activeRiskCount); // ← You can lift this up to context if needed
      } catch (err) {
        // console.error('❌ Failed to load risk notifications:', err);
      }
    };

    fetchRisks();
  }, []);

  const visibleRisks = showLow
    ? risks
    : risks.filter((r) => r.severity !== 'Low');

  return (
    <div className="admin-risk-notifications">
      <h2>Manage Risk Alerts</h2>
      <label className="toggle-low">
        <input
          type="checkbox"
          checked={showLow}
          onChange={() => setShowLow((s) => !s)}
        />
        Show Low Risk Items
      </label>

      {visibleRisks.length === 0 ? (
        <p>No risky login attempts detected.</p>
      ) : (
        <table className="risk-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Email</th>
              <th>Score</th>
              <th>Type</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {visibleRisks.map((risk) => (
              <tr
                key={risk.id}
                onClick={() => {
                  setSelectedRisk(risk);
                  setShowModal(true);
                }}
                className="clickable-row"
              >
                <td>
                  <span
                    className={`risk-status-badge ${
                      normalizeStatus(risk.overviewStatus) === 'new'
                        ? 'badge-green'
                        : normalizeStatus(risk.overviewStatus) === 'inprogress'
                          ? 'badge-yellow'
                          : 'badge-gray'
                    }`}
                  >
                    {risk.status}
                  </span>
                </td>
                <td>{risk.timestamp.toLocaleString()}</td>
                <td>{risk.email}</td>
                <td>{risk.score.toFixed(2)}</td>
                <td>{risk.type}</td>
                <td>
                  <span
                    className={`severity-badge severity-${risk.severity.toLowerCase()}`}
                  >
                    {risk.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ Modal rendering block */}
      {showModal && selectedRisk && (
        <ViewRiskDetailModal
          isOpen={true}
          onClose={() => {
            setShowModal(false);
            setSelectedRisk(null);
          }}
          risk={selectedRisk}
          onStatusChange={handleStatusChange} // ✅ NEW LINE
        />
      )}
    </div>
  );
};

export default AdminRiskNotifications;
