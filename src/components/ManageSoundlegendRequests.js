import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewSoundlegendModal from './ViewSoundlegendModal';
import { getOverviewStatus } from '../utils/statusConfig';
import './ManageSoundlegendRequests.css';

const ManageSoundlegendRequests = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideClosed, setHideClosed] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const resolveQuestionnaireToken = (submission = {}) =>
    submission.questionnaireToken ||
    submission.latestQuestionnaireToken ||
    submission.linkedQuestionnaireToken ||
    '';

  const hydrateSubmissionWithQuestionnaireStatus = async (submission) => {
    const questionnaireToken = resolveQuestionnaireToken(submission);

    if (!questionnaireToken) {
      return {
        ...submission,
        questionnaireCompleted: !!submission.questionnaireCompleted,
      };
    }

    try {
      const questionnaireRef = doc(
        db,
        'soundlegend_questionnaires',
        questionnaireToken
      );
      const questionnaireSnap = await getDoc(questionnaireRef);

      if (!questionnaireSnap.exists()) {
        return {
          ...submission,
          questionnaireCompleted: !!submission.questionnaireCompleted,
        };
      }

      const questionnaireData = questionnaireSnap.data() || {};
      const questionnaireCompleted = !!questionnaireData.questionnaireCompleted;

      if (submission.questionnaireCompleted !== questionnaireCompleted) {
        try {
          await updateDoc(doc(db, 'soundlegend_submissions', submission.id), {
            questionnaireCompleted,
          });
        } catch (syncErr) {
          console.error(
            '⚠️ Failed to sync questionnaireCompleted onto submission:',
            syncErr
          );
        }
      }

      return {
        ...submission,
        questionnaireCompleted,
      };
    } catch (error) {
      console.error(
        '❌ Error checking linked questionnaire completion:',
        error
      );
      return {
        ...submission,
        questionnaireCompleted: !!submission.questionnaireCompleted,
      };
    }
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const submissionsRef = collection(db, 'soundlegend_submissions');
        const querySnapshot = await getDocs(submissionsRef);

        const rawSubmissions = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          const rawStatus = data.status || 'New';
          const overviewStatus = getOverviewStatus('soundlegend', rawStatus);

          return {
            id: docSnap.id,
            ...data,
            status: rawStatus,
            overviewStatus,
          };
        });

        const hydratedSubmissions = await Promise.all(
          rawSubmissions.map((submission) =>
            hydrateSubmissionWithQuestionnaireStatus(submission)
          )
        );

        const submissionsList = hydratedSubmissions.sort((a, b) => {
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

      setSelectedSubmission((prev) =>
        prev?.id === submissionId
          ? { ...prev, status: newStatus, overviewStatus }
          : prev
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
        prev.map((s) => (s.id === submissionId ? { ...s, [field]: value } : s))
      );

      setSelectedSubmission((prev) =>
        prev?.id === submissionId ? { ...prev, [field]: value } : prev
      );
    } catch (error) {
      console.error(`❌ Error updating ${field}:`, error);
    }
  };

  const handleDeleteSubmission = async (submission, e) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Delete SoundLegend submission for ${submission.firstName || ''} ${
        submission.lastName || ''
      }?\n\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(submission.id);

      await deleteDoc(doc(db, 'soundlegend_submissions', submission.id));

      const questionnaireToken = resolveQuestionnaireToken(submission);

      if (questionnaireToken) {
        try {
          await deleteDoc(
            doc(db, 'soundlegend_questionnaires', questionnaireToken)
          );
        } catch (questionnaireErr) {
          console.error(
            '⚠️ Failed to delete linked questionnaire doc:',
            questionnaireErr
          );
        }
      }

      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));

      if (selectedSubmission?.id === submission.id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('❌ Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setDeletingId(null);
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
    const lower = (status || '').toLowerCase();
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
              <th>Questionnaire Complete</th>
              <th>Email Sent</th>
              <th>Text Sent</th>
              {/* <th>Delete</th> */}
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
                  <span
                    className={`status-badge ${getBadgeClass(submission.status)}`}
                  >
                    {submission.status}
                  </span>
                </td>
                <td>
                  {submission.submittedAt?.seconds
                    ? new Date(
                        submission.submittedAt.seconds * 1000
                      ).toLocaleString()
                    : 'N/A'}
                </td>
                <td>
                  {submission.firstName} {submission.lastName}
                </td>
                <td>{submission.email}</td>
                <td>{submission.phone || 'N/A'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={submission.questionnaireCompleted || false}
                    readOnly
                    disabled
                    title={
                      submission.questionnaireCompleted
                        ? 'Questionnaire completed'
                        : 'Questionnaire not completed'
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={submission.emailed || false}
                    onChange={(e) =>
                      handleCheckboxChange(
                        submission.id,
                        'emailed',
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={submission.texted || false}
                    onChange={(e) =>
                      handleCheckboxChange(
                        submission.id,
                        'texted',
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {/* <td>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={(e) => handleDeleteSubmission(submission, e)}
                    disabled={deletingId === submission.id}
                  >
                    {deletingId === submission.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedSubmission && (
        <ViewSoundlegendModal
          submission={selectedSubmission}
          onClose={closeModal}
          onStatusUpdate={handleStatusChange}
          onUpdateSubmission={(updatedSubmission) => {
            if (updatedSubmission?._deleted) {
              setSubmissions((prev) =>
                prev.filter((s) => s.id !== updatedSubmission.id)
              );
              setSelectedSubmission(null);
              return;
            }

            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === updatedSubmission.id
                  ? { ...s, ...updatedSubmission }
                  : s
              )
            );

            setSelectedSubmission((prev) =>
              prev?.id === updatedSubmission.id
                ? { ...prev, ...updatedSubmission }
                : prev
            );
          }}
        />
      )}
    </div>
  );
};

export default ManageSoundlegendRequests;