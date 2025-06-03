import React, { useState, useEffect } from 'react';
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ViewSoundlegendModal.css';
import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';

const generateAndDownloadVCard = ({ firstName, lastName, email, phone }) => {
  const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName}
FN:${firstName} ${lastName}
EMAIL:${email}
${phone ? `TEL;TYPE=CELL:${phone}` : ''}
END:VCARD
  `.trim();

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${firstName}_${lastName}_OberContact.vcf`;
  a.click();

  URL.revokeObjectURL(url);
};

const ViewSoundlegendModal = ({ submission, onClose, onStatusUpdate, onUpdateSubmission }) => {
  const [selectedStatus, setSelectedStatus] = useState(submission.status || '');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission.history || []);
  const [projectId, setProjectId] = useState(submission.projectId || null);
  const [fullSubmission, setFullSubmission] = useState({ ...submission, id: submission.id });

  if (!submission) return null;

  const {
    firstName,
    lastName,
    email,
    phone,
    artistBio,
    inspiration,
    submittedAt,
  } = fullSubmission;

  const defaultStepData = {
    woodPreparation: {
      checklist: [
        { task: "Select and inspect raw wood blanks", completed: false, totalSeconds: 0 },
        { task: "Cut wood to stave or segment shapes", completed: false, totalSeconds: 0 },
        { task: "Check moisture content (8–12%)", completed: false, totalSeconds: 0 },
        { task: "Bookmatch or orientation layout", completed: false, totalSeconds: 0 },
        { task: "Joint and plane each piece", completed: false, totalSeconds: 0 },
        { task: "Pre-glue test assembly", completed: false, totalSeconds: 0 }
      ]
    },
    shellConstruction: {
      checklist: [
        { task: "Glue-up and clamp process", completed: false, totalSeconds: 0 },
        { task: "Lathe or sand to round", completed: false, totalSeconds: 0 },
        { task: "Wall thickness verification", completed: false, totalSeconds: 0 },
        { task: "Interior surface prep", completed: false, totalSeconds: 0 },
        { task: "Reinforcement rings cut & glued (if applicable)", completed: false, totalSeconds: 0 },
        { task: "Initial bearing edge marking", completed: false, totalSeconds: 0 }
      ]
    },
    fineTuning: {
      checklist: [
        { task: "Check roundness tolerance", completed: false, totalSeconds: 0 },
        { task: "Verify wall uniformity", completed: false, totalSeconds: 0 },
        { task: "Tap test for frequency balance", completed: false, totalSeconds: 0 },
        { task: "Edge re-level if needed", completed: false, totalSeconds: 0 },
        { task: "Moisture re-check", completed: false, totalSeconds: 0 },
        { task: "Mark phase complete", completed: false, totalSeconds: 0 }
      ]
    },
    shellExteriorFinish: {
      checklist: [
        { task: "Sanding shell exterior (progressive grits)", completed: false, totalSeconds: 0 },
        { task: "Inspect for surface defects", completed: false, totalSeconds: 0 },
        { task: "Apply requested finish or stain", completed: false, totalSeconds: 0 },
        { task: "Cure/dry between coats", completed: false, totalSeconds: 0 },
        { task: "Final clear coat (oil, lacquer, etc.)", completed: false, totalSeconds: 0 },
        { task: "Buff/polish exterior surface", completed: false, totalSeconds: 0 }
      ]
    },
    bearingEdges: {
      checklist: [
        { task: "Confirm edge spec (45°, roundover, etc.)", completed: false, totalSeconds: 0 },
        { task: "Rout or cut bearing edges", completed: false, totalSeconds: 0 },
        { task: "Hand-sand edges smooth", completed: false, totalSeconds: 0 },
        { task: "Apply wax or edge treatment (if applicable)", completed: false, totalSeconds: 0 },
        { task: "Final edge inspection", completed: false, totalSeconds: 0 },
        { task: "Mark edges as complete", completed: false, totalSeconds: 0 }
      ]
    },
    snareBedCutting: {
      checklist: [
        { task: "Measure and mark snare bed location", completed: false, totalSeconds: 0 },
        { task: "Cut snare beds to spec", completed: false, totalSeconds: 0 },
        { task: "Check symmetry and depth", completed: false, totalSeconds: 0 },
        { task: "Test with snare wire fitment", completed: false, totalSeconds: 0 },
        { task: "Smooth and blend edges", completed: false, totalSeconds: 0 },
        { task: "Approve beds for hardware", completed: false, totalSeconds: 0 }
      ]
    },
    hardwareDrilling: {
      checklist: [
        { task: "Layout lugs and throwoff spacing", completed: false, totalSeconds: 0 },
        { task: "Center punch all holes", completed: false, totalSeconds: 0 },
        { task: "Drill pilot holes cleanly", completed: false, totalSeconds: 0 },
        { task: "Deburr all hardware holes", completed: false, totalSeconds: 0 },
        { task: "Confirm fit with hardware samples", completed: false, totalSeconds: 0 },
        { task: "Prep for final assembly", completed: false, totalSeconds: 0 }
      ]
    },
    hardwareAssembly: {
      checklist: [
        { task: "Install all lugs, throw, butt plate", completed: false, totalSeconds: 0 },
        { task: "Install air vent grommet", completed: false, totalSeconds: 0 },
        { task: "Verify hardware alignment", completed: false, totalSeconds: 0 },
        { task: "Torque hardware as needed", completed: false, totalSeconds: 0 },
        { task: "Attach badges / brand markings", completed: false, totalSeconds: 0 },
        { task: "Inspect for rattle or loose fit", completed: false, totalSeconds: 0 }
      ]
    },
    tuningDetailing: {
      checklist: [
        { task: "Seat heads and tune evenly", completed: false, totalSeconds: 0 },
        { task: "Adjust snare wire tension", completed: false, totalSeconds: 0 },
        { task: "Check for unwanted buzz or rattle", completed: false, totalSeconds: 0 },
        { task: "Play test: tonal and dynamic response", completed: false, totalSeconds: 0 },
        { task: "Detail clean shell and hardware", completed: false, totalSeconds: 0 },
        { task: "Confirm tuning stability", completed: false, totalSeconds: 0 }
      ]
    },
    qualityCheck: {
      checklist: [
        { task: "Final shell inspection (interior + exterior)", completed: false, totalSeconds: 0 },
        { task: "Check for visual defects or inconsistencies", completed: false, totalSeconds: 0 },
        { task: "Confirm bearing edge cleanliness and integrity", completed: false, totalSeconds: 0 },
        { task: "Inspect hardware tightness and alignment", completed: false, totalSeconds: 0 },
        { task: "Ensure snare wire response is consistent", completed: false, totalSeconds: 0 },
        { task: "Full test-play to confirm tonal balance", completed: false, totalSeconds: 0 },
        { task: "Clean and polish entire drum for delivery", completed: false, totalSeconds: 0 },
        { task: "Mark drum as production complete", completed: false, totalSeconds: 0 }
      ]
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setSelectedStatus(newStatus);
    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      if (onUpdateSubmission) {
        onUpdateSubmission({
          ...fullSubmission,
          status: newStatus,
          overviewStatus,
          history: [...history, historyEntry],
        });
      }

      if (onStatusUpdate) {
        onStatusUpdate(fullSubmission.id, newStatus);
      }
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!notes.trim()) return;
    try {
      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const timestamp = new Date().toISOString();
      const noteEntry = { type: 'note', value: notes.trim(), timestamp };

      await updateDoc(submissionRef, {
        history: arrayUnion(noteEntry),
      });

      setHistory((prev) => [...prev, noteEntry]);
      setNotes('');
    } catch (err) {
      console.error('❌ Failed to save note:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => console.log(`📋 Copied: ${text}`))
      .catch((err) => console.error('❌ Copy failed:', err));
  };

  const createProject = async () => {
    const confirmCreation = window.confirm(`Create Project for ${firstName} ${lastName}?`);
    if (!confirmCreation) return;

    try {
      const projectData = {
        source: 'SoundLegend',
        submissionId: fullSubmission.id,
        customerName: `${firstName} ${lastName}`,
        customer: {
          name: `${firstName} ${lastName}`,
          email,
          phone: phone || '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
          },
        },
        artisanLine: "SoundLegend",
        width: '14"',
        shellDepth: '8"',
        startDate: Timestamp.now(),
        currentPhase: 'Step 1. Wood Preparation',
        ...defaultStepData  // ⬅️ ADD THIS
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = projectRef.id;

      const submissionRef = doc(db, 'soundlegend_submissions', fullSubmission.id);
      const systemEntry = {
        type: 'system',
        value: `Project created: ${projectId}`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(submissionRef, {
        projectId,
        history: arrayUnion(systemEntry),
      });

      setProjectId(projectId);
      setHistory((prev) => [systemEntry, ...prev]);

      alert(`✅ Project created successfully!\n\nID: ${projectId}`);
      if (onUpdateSubmission) {
        onUpdateSubmission({
          ...fullSubmission,
          projectId,
          history: [systemEntry, ...history],
        });
      }
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAndValidateSubmission = async () => {
      try {
        const ref = doc(db, 'soundlegend_submissions', submission.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn('❌ Submission no longer exists.');
          return;
        }

        const data = snap.data();
        let validProjectId = data.projectId || null;

        if (validProjectId) {
          const projectRef = doc(db, 'projects', validProjectId);
          const projectSnap = await getDoc(projectRef);
          if (!projectSnap.exists()) {
            console.warn(`❌ Linked project not found: ${validProjectId}`);
            validProjectId = null;
            await updateDoc(ref, { projectId: null });
          }
        }

        setFullSubmission({ ...data, id: submission.id });
        setProjectId(validProjectId);
        setHistory(data.history || []);
        setSelectedStatus(data.status || 'New');
      } catch (err) {
        console.error('❌ Error loading/validating submission:', err);
      }
    };

    fetchAndValidateSubmission();
  }, [submission.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <h2 className="modal-title">SoundLegend Submission</h2>

        <div className="modal-status-update">
          <label><strong>Status:</strong></label>
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="status-select"
          >
            {STATUS_OPTIONS.soundlegend.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="compact-inquiry-details">
          <div className="detail-group">
            <strong>Name:</strong> {firstName} {lastName}
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(`${firstName} ${lastName}`)}
              title="Copy name"
            >
              📋
            </button>
          </div>
          <div className="detail-group">
            <strong>Email:</strong> {email}
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(email)}
              title="Copy email"
            >
              📋
            </button>
          </div>
          {phone && (
            <div className="detail-group">
              <strong>Phone:</strong> {phone}
            </div>
          )}
          {submittedAt?.seconds && (
            <div className="detail-group">
              <strong>Submitted:</strong> {new Date(submittedAt.seconds * 1000).toLocaleString()}
            </div>
          )}
          {projectId ? (
            <div className="detail-group">
              <strong>Linked Project:</strong>{' '}
              <a href={`/projects/${projectId}`} target="_blank" rel="noreferrer" className="project-link">
                Open Project ↗
              </a>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(projectId)}
                title="Copy Project ID"
              >
                📋
              </button>
            </div>
          ) : (
            <button className="create-project-btn" onClick={createProject}>
              Create Project
            </button>
          )}
          <button
            className="add-contact-btn"
            onClick={() =>
              generateAndDownloadVCard({ firstName, lastName, email, phone })
            }
          >
            Download Contact Card
          </button>
        </div>

        {artistBio && (
          <div className="modal-item">
            <strong>Artist Bio:</strong>
            <p>{artistBio}</p>
          </div>
        )}

        {inspiration && (
          <div className="modal-item">
            <strong>Inspiration:</strong>
            <p>{inspiration}</p>
          </div>
        )}

        <div className="modal-item">
          <label><strong>Add Note:</strong></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="note-input"
            placeholder="Write an internal note..."
            rows={3}
          />
          <button
            className="add-note-btn"
            onClick={handleNoteSubmit}
            disabled={!notes.trim()}
          >
            Save Note
          </button>
        </div>

        <div className="history-log">
          <h4>History</h4>
          {history.length === 0 ? (
            <p>No history available.</p>
          ) : (
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.type === 'status' ? 'Status' : entry.type}</td>
                    <td>{entry.value}</td>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button className="inquiry-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewSoundlegendModal;