import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewSoundlegendModal from './ViewSoundlegendModal';
import { getOverviewStatus } from '../utils/statusConfig';
import './ManageSoundlegendRequests.css';

const ManageSoundlegendRequests = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideClosed, setHideClosed] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const submissionsRef = collection(db, 'soundlegend_submissions');
        const querySnapshot = await getDocs(submissionsRef);

        const submissionsList = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const rawStatus = data.status || 'New';
            const overviewStatus = getOverviewStatus('soundlegend', rawStatus);

            return {
              id: doc.id,
              ...data,
              status: rawStatus,
              overviewStatus,
            };
          })
          .sort((a, b) => {
            const aTime = a.submittedAt?.seconds || 0;
            const bTime = b.submittedAt?.seconds || 0;
            return bTime - aTime;
          });

        setSubmissions(submissionsList);
      } catch (error) {
        console.error('❌ Error fetching SoundLegend submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
      });

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId
            ? { ...submission, status: newStatus, overviewStatus }
            : submission
        )
      );
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const handleCheckboxChange = async (submissionId, field, value) => {
  try {
    const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
    await updateDoc(submissionRef, { [field]: value });

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, [field]: value } : s
      )
    );
  } catch (error) {
    console.error(`❌ Error updating ${field}:`, error);
  }
};

  const filteredSubmissions = hideClosed
    ? submissions.filter((s) => s.overviewStatus !== 'completed')
    : submissions;

  const handleRowClick = (submission) => {
    setSelectedSubmission(submission);
  };

  const closeModal = () => {
    setSelectedSubmission(null);
  };

  const getBadgeClass = (status) => {
    const lower = status.toLowerCase();
    if (lower === 'prospecting') return 'badge-yellow';
    if (lower.startsWith('closed')) return 'badge-gray';
    return 'badge-green';
  };

  return (
    <div className="soundlegend-container">
      <h1>Manage SoundLegend Submissions</h1>

      <label className="hide-closed-filter">
        <input
          type="checkbox"
          checked={hideClosed}
          onChange={() => setHideClosed(!hideClosed)}
        />
        Hide Closed Requests
      </label>

      {loading ? (
        <p>Loading SoundLegend Submissions...</p>
      ) : filteredSubmissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <table className="submissions-table">
<thead>
  <tr>
    <th>Status</th>
    <th>Submitted At</th>
    <th>Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Email Sent</th>
    <th>Text Sent</th>
  </tr>
</thead>
<tbody>
  {filteredSubmissions.map((submission) => (
    <tr
      key={submission.id}
      className="submission-row"
      onClick={() => handleRowClick(submission)}
    >
      <td>
        <span className={`status-badge ${getBadgeClass(submission.status)}`}>
          {submission.status}
        </span>
      </td>
      <td>
        {submission.submittedAt?.seconds
          ? new Date(submission.submittedAt.seconds * 1000).toLocaleString()
          : 'N/A'}
      </td>
      <td>{submission.firstName} {submission.lastName}</td>
      <td>{submission.email}</td>
      <td>{submission.phone || 'N/A'}</td>
      <td>
        <input
          type="checkbox"
          checked={submission.emailed || false}
          onChange={(e) => handleCheckboxChange(submission.id, 'emailed', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={submission.texted || false}
          onChange={(e) => handleCheckboxChange(submission.id, 'texted', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
    </tr>
  ))}
</tbody>
        </table>
      )}

      {selectedSubmission && (
        <ViewSoundlegendModal
          submission={selectedSubmission}
          onClose={closeModal}
          onUpdateSubmission={(updatedSubmission) => {
            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === updatedSubmission.id ? { ...s, ...updatedSubmission } : s
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default ManageSoundlegendRequests;