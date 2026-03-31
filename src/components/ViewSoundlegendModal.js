import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
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

import './AdminModalTheme.css';
import './ViewSoundlegendModal.css';

import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';
import defaultProjectFields from '../utils/defaultProjectFields';
import { defaultStepData } from '../utils/buildWorkflow';
import { buildConsultationIntakeDefaults } from '../utils/consultationIntakeSchema';

const generateAndDownloadVCard = ({ firstName, lastName, email, phone }) => {
  const safeFirst = firstName || 'Contact';
  const safeLast = lastName || 'Ober';

  const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${safeLast};${safeFirst}
FN:${safeFirst} ${safeLast}
EMAIL:${email || ''}
${phone ? `TEL;TYPE=CELL:${phone}` : ''}
END:VCARD
  `.trim();

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFirst}_${safeLast}_OberContact.vcf`;
  a.click();

  URL.revokeObjectURL(url);
};

const buildSoundLegendProtectedFields = () => ({
  consultationIntake: buildConsultationIntakeDefaults(),

  buildCommitment: {
    isCommitted: false,
    committedAt: null,
    commitmentSource: '',
    commitmentNote: '',
  },

  scopeVisibility: {
    customerCanViewApprovedScope: false,
    customerUnlockedAt: null,
    unlockSource: '',
  },

  storyVisibility: {
    customerCanViewStoryDetails: false,
    storyUnlockedAt: null,
    unlockSource: '',
  },

  adminBuildRecommendation: {
    status: 'draft',
    updatedAt: Timestamp.now(),
    summary: '',
    shellRecipe: '',
    shellConstruction: '',
    dimensions: '',
    staveCount: '',
    reinforcementRings: '',
    primarySpecies: '',
    secondarySpecies: '',
    veneer: '',
    bearingEdges: '',
    snareBedDepth: '',
    lugType: '',
    hardwareFinish: '',
    hoops: '',
    throwOff: '',
    snareWires: '',
    exteriorFinish: '',
    interiorFinish: '',
    resinAccent: '',
    additionalNotes: '',
  },

  approvedCustomerScope: {
    artisanLine: 'SoundLegend',
    lineSerial: '',
    dimensionsLabel: '',
    width: '',
    shellDepth: '',
    staveCount: '',
    shellConstructionName: '',
    reinforcementRings: '',
    primarySpecies: '',
    secondarySpecies: '',
    veneer: '',
    bearingEdge: '',
    snareBedDepth: '',
    lugType: '',
    hardwareFinish: '',
    hoops: '',
    snareThrowOff: '',
    snareWires: '',
    exteriorFinish: '',
    interiorFinish: '',
    resinAccent: '',
    additionalNotes: '',
    lastApprovedAt: null,
    approvedBy: '',
  },
});

const formatTimestamp = (value) => {
  if (!value) return '—';
  try {
    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

const renderIntakeValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
};

const normalizeAvailabilityValue = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildSchedulingAvailabilityText = (intakeSection = {}) => {
  const days = normalizeAvailabilityValue(intakeSection.consultationDays);
  const times = normalizeAvailabilityValue(intakeSection.consultationTimes);

  if (days.length && times.length) {
    return `${days.join(', ')} • ${times.join(', ')}`;
  }

  if (days.length) return days.join(', ');
  if (times.length) return times.join(', ');

  return '—';
};

const ViewSoundlegendModal = ({
  submission,
  onClose,
  onStatusUpdate,
  onUpdateSubmission,
}) => {
  const submissionId = submission?.id || null;

  const [selectedStatus, setSelectedStatus] = useState(
    submission?.status || 'New'
  );
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission?.history || []);
  const [projectId, setProjectId] = useState(submission?.projectId || null);
  const [fullSubmission, setFullSubmission] = useState(
    submission ? { ...submission, id: submission.id } : null
  );

  const {
    firstName,
    lastName,
    email,
    phone,
    artistBio,
    inspiration,
    submittedAt,
    consultationIntake,
    questionnaireCompleted,
    questionnaireCompletedAt,
  } = fullSubmission || submission || {};

  useEffect(() => {
    if (!submissionId) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [submissionId, onClose]);

  const copyToClipboard = useCallback((text) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => console.log(`📋 Copied: ${text}`))
      .catch((err) => console.error('❌ Copy failed:', err));
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    if (!submissionId) return;

    setSelectedStatus(newStatus);

    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);

      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      const nextSubmission = {
        ...(fullSubmission || submission),
        id: submissionId,
        status: newStatus,
        overviewStatus,
        history: [...(history || []), historyEntry],
      };

      onUpdateSubmission?.(nextSubmission);
      onStatusUpdate?.(submissionId, newStatus);
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!submissionId || !notes.trim()) return;

    try {
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
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

  const createProject = async () => {
    if (!submissionId) return;

    const confirmCreation = window.confirm(
      `Create Project for ${firstName || ''} ${lastName || ''}?`
    );
    if (!confirmCreation) return;

    try {
      const protectedFields = buildSoundLegendProtectedFields();

      const projectData = {
        source: 'SoundLegend',
        submissionId,
        customerName: `${firstName || ''} ${lastName || ''}`.trim(),
        customerEmail: email || '',
        customerPhone: phone || '',
        ownerEmail: email || '',
        customer: {
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          email: email || '',
          phone: phone || '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
          },
        },
        artisanLine: 'SoundLegend',
        width: '',
        shellDepth: '',
        startDate: Timestamp.now(),
        currentPhase: '1. Discovery & Design',
        ...defaultStepData,
        ...defaultProjectFields,
        ...protectedFields,
        consultationIntake:
          consultationIntake || buildConsultationIntakeDefaults(),
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const newProjectId = projectRef.id;

      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
      const systemEntry = {
        type: 'system',
        value: `Project created: ${newProjectId}`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(submissionRef, {
        projectId: newProjectId,
        history: arrayUnion(systemEntry),
      });

      setProjectId(newProjectId);
      setHistory((prev) => [systemEntry, ...prev]);

      alert(`✅ Project created successfully!\n\nID: ${newProjectId}`);

      onUpdateSubmission?.({
        ...(fullSubmission || submission),
        id: submissionId,
        projectId: newProjectId,
        history: [systemEntry, ...(history || [])],
      });
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  useEffect(() => {
    if (!submissionId) return;

    const fetchAndValidateSubmission = async () => {
      try {
        const ref = doc(db, 'soundlegend_submissions', submissionId);
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

        setFullSubmission({ ...data, id: submissionId });
        setProjectId(validProjectId);
        setHistory(data.history || []);
        setSelectedStatus(data.status || 'New');
      } catch (err) {
        console.error('❌ Error loading/validating submission:', err);
      }
    };

    fetchAndValidateSubmission();
  }, [submissionId]);

  if (!submissionId) return null;

  const intakeSection =
    consultationIntake?.soundlegendVision ||
    buildConsultationIntakeDefaults().soundlegendVision;

  return ReactDOM.createPortal(
    <div
      className="slmodal__backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="slmodal light"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="slmodal__header">
          <h3>SoundLegend Submission</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="slmodal__body">
          <div className="ea-grid">
            <div className="ea-block">
              <h4>Status & Actions</h4>

              <div className="row">
                <span>Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  {STATUS_OPTIONS.soundlegend.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <span>Questionnaire</span>
                <span className="text-box">
                  {questionnaireCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>

              {questionnaireCompleted ? (
                <div className="row">
                  <span>Completed At</span>
                  <span className="muted">
                    {formatTimestamp(questionnaireCompletedAt)}
                  </span>
                </div>
              ) : null}

              {projectId ? (
                <div className="row">
                  <span>Linked Project</span>
                  <div>
                    <a
                      href={`/projects/${projectId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      Open Project ↗
                    </a>
                    <button
                      className="icon-btn ml-8"
                      onClick={() => copyToClipboard(projectId)}
                      title="Copy Project ID"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn--sm" onClick={createProject}>
                  Create Project
                </button>
              )}

              <div className="row">
                <span>Contact Card</span>
                <button
                  className="btn btn--sm"
                  onClick={() =>
                    generateAndDownloadVCard({
                      firstName,
                      lastName,
                      email,
                      phone,
                    })
                  }
                >
                  Download .vcf
                </button>
              </div>
            </div>

            <div className="ea-block">
              <h4>Contact</h4>

              <div className="row">
                <span>Name</span>
                <div>
                  <span className="text-box">
                    {firstName} {lastName}
                  </span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() =>
                      copyToClipboard(
                        `${firstName || ''} ${lastName || ''}`.trim()
                      )
                    }
                    title="Copy name"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="row">
                <span>Email</span>
                <div>
                  <span className="text-box">{email}</span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() => copyToClipboard(email)}
                    title="Copy email"
                  >
                    📋
                  </button>
                </div>
              </div>

              {phone && (
                <div className="row">
                  <span>Phone</span>
                  <span className="text-box">{phone}</span>
                </div>
              )}

              {submittedAt?.seconds && (
                <div className="row">
                  <span>Submitted</span>
                  <span className="muted">
                    {new Date(submittedAt.seconds * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="ea-block col-span-2">
              <h4>Questionnaire Details</h4>
              <div className="table-wrap">
                <table className="ea-table">
                  <tbody>
                    <tr>
                      <th>Vision clarity</th>
                      <td>{renderIntakeValue(intakeSection.buildClarity)}</td>
                    </tr>
                    <tr>
                      <th>Main goal</th>
                      <td>{renderIntakeValue(intakeSection.primaryGoal)}</td>
                    </tr>
                    <tr>
                      <th>Tonal direction</th>
                      <td>{renderIntakeValue(intakeSection.tonalGoals)}</td>
                    </tr>
                    <tr>
                      <th>Visual direction</th>
                      <td>{renderIntakeValue(intakeSection.visualDirection)}</td>
                    </tr>
                    <tr>
                      <th>Reference notes</th>
                      <td className="pre">
                        {renderIntakeValue(intakeSection.referenceNotes)}
                      </td>
                    </tr>
                    <tr>
                      <th>Scheduling contact method</th>
                      <td>
                        {renderIntakeValue(
                          intakeSection.consultationContactMethod
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Scheduling availability</th>
                      <td className="pre">
                        {buildSchedulingAvailabilityText(intakeSection)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {artistBio && (
              <div className="ea-block col-span-2">
                <h4>Artist Bio</h4>
                <div className="text-box">{artistBio}</div>
              </div>
            )}

            {inspiration && (
              <div className="ea-block col-span-2">
                <h4>Inspiration</h4>
                <div className="text-box">{inspiration}</div>
              </div>
            )}

            <div className="ea-block col-span-2">
              <h4>Add Note</h4>
              <textarea
                rows={3}
                placeholder="Write an internal note…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="right">
                <button
                  className="btn btn--sm"
                  onClick={handleNoteSubmit}
                  disabled={!notes.trim()}
                >
                  Save Note
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setNotes('')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="ea-block col-span-2">
              <h4>History</h4>
              {history.length === 0 ? (
                <div className="muted">No history yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="ea-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry, index) => (
                        <tr key={`${entry.timestamp}-${index}`}>
                          <td>
                            {entry.type === 'status' ? 'Status' : entry.type}
                          </td>
                          <td className="pre">{entry.value}</td>
                          <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="slmodal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewSoundlegendModal;