import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ViewSoundlegendModal from "./ViewSoundlegendModal";
import "./ManageSoundlegendRequests.css";

const statusOptions = [
  "New",
  "Prospecting",
  "Closed - Won",
  "Closed - Lost",
  "Closed - Incomplete Form",
  "Closed - No Response",
];

const ManageSoundlegendRequests = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideClosed, setHideClosed] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const submissionsRef = collection(db, "soundlegend_submissions");
        const querySnapshot = await getDocs(submissionsRef);

        const submissionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSubmissions(submissionsList);
      } catch (error) {
        console.error("❌ Error fetching SoundLegend submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      const submissionRef = doc(db, "soundlegend_submissions", submissionId);
      await updateDoc(submissionRef, { status: newStatus });

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId
            ? { ...submission, status: newStatus }
            : submission
        )
      );
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  };

  const filteredSubmissions = hideClosed
    ? submissions.filter(
        (submission) => !submission.status?.toLowerCase().includes("closed")
      )
    : submissions;

  const handleRowClick = (submission) => {
    setSelectedSubmission(submission);
  };

  const closeModal = () => {
    setSelectedSubmission(null);
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
              <th>Submitted At</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
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
                  {submission.submittedAt?.seconds
                    ? new Date(submission.submittedAt.seconds * 1000).toLocaleString()
                    : "N/A"}
                </td>
                <td>{submission.firstName} {submission.lastName}</td>
                <td>{submission.email}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    value={submission.status || "New"}
                    onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedSubmission && (
        <ViewSoundlegendModal submission={selectedSubmission} onClose={closeModal} />
      )}
    </div>
  );
};

export default ManageSoundlegendRequests;