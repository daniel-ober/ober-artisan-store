import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./ManageSoundlegendRequests.css";

const statusOptions = [
  "New",
  "Prospecting",
  "Closed - Won",
  "Closed - Lost",
  "Closed - Incomplete Form",
  "Closed - No Response"
];

const ManageSoundlegendRequests = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log("📥 Fetching SoundLegend Submissions...");
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

  // Function to update status in Firestore
  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      const submissionRef = doc(db, "soundlegend_submissions", submissionId);
      await updateDoc(submissionRef, { status: newStatus });

      // Update state to reflect the change
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId ? { ...submission, status: newStatus } : submission
        )
      );
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading SoundLegend Requests...</div>;
  }

  return (
    <div className="soundlegend-container">
      <h1>SoundLegend Submissions</h1>
      {submissions.length === 0 ? (
        <p>No SoundLegend submissions found.</p>
      ) : (
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Shell Construction</th>
              <th>Size</th>
              <th>Depth</th>
              <th>Snare Bed</th>
              <th>Wood Species</th>
              <th>Submitted At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.firstName} {submission.lastName}</td>
                <td>{submission.email}</td>
                <td>{submission.phone}</td>
                <td>{submission.shellConstruction}</td>
                <td>{submission.size}”</td>
                <td>{submission.depth}”</td>
                <td>{submission.snareBedDepth}</td>
                <td>{submission.woodSpecies}</td>
                <td>{new Date(submission.submittedAt?.seconds * 1000).toLocaleString()}</td>
                <td>
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
    </div>
  );
};

export default ManageSoundlegendRequests;