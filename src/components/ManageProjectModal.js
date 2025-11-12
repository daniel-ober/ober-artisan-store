import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import StepComponentTemplate from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import defaultStepData from '../utils/defaultStepData';
import { Snackbar } from '@mui/material';
import './ManageProjectModal.css';

const buildPhases = [
  { key: 'woodPreparation',   label: 'Step 1: Wood Preparation' },
  { key: 'shellConstruction', label: 'Step 2: Shell Construction' },
  { key: 'fineTuning',        label: 'Step 3: Fine-Tuning' },
  { key: 'shellExteriorFinish', label: 'Step 4: Shell Exterior Finish' },
  { key: 'bearingEdges',      label: 'Step 5: Bearing Edges' },
  { key: 'snareBedCutting',   label: 'Step 6: Snare Bed Cutting' },
  { key: 'hardwareDrilling',  label: 'Step 7: Hardware Drilling' },
  { key: 'hardwareAssembly',  label: 'Step 8: Hardware Assembly' },
  { key: 'tuningDetailing',   label: 'Step 9: Tuning and Detailing' },
  { key: 'qualityCheck',      label: 'Step 10: Quality Check' },
];

/* ----- date + progress helpers --------------------------------------------------- */
const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate();          // Firestore Timestamp
  if (v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(+d) ? null : d;
};

const fmtMDY = (v) =>
  v
    ? toDate(v)?.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const overallProgressPct = (data) => {
  const items = Object.values(data || {})
    .flatMap((s) => (s && Array.isArray(s.checklist) ? s.checklist : []));
  const total = items.length || 1;
  const done = items.filter((i) => i.completed).length;
  return Math.round((done / total) * 100);
};

/** Compare actual progress vs time elapsed (with buffer) to produce a schedule chip. */
const scheduleStatus = ({
  startDate,
  targetDate,       // unbuffered target
  bufferDays = 14,
  progressPct = 0,
  today = new Date(),
}) => {
  const s = toDate(startDate);
  const t = toDate(targetDate);
  if (!s || !t || t <= s) return { label: 'Unknown', code: 'unknown' };

  const bufferedTarget = new Date(t.getTime() + bufferDays * 86400000);
  const totalMs = bufferedTarget - s;
  const elapsedMs = Math.max(0, Math.min(totalMs, today - s));
  const expectedPct = Math.round((elapsedMs / totalMs) * 100);

  const delta = progressPct - expectedPct; // positive = ahead
  if (progressPct >= 100) return { label: 'Finished', code: 'finished' };
  if (delta >= 10)   return { label: 'Ahead',             code: 'ahead' };
  if (delta >= -10)  return { label: 'On Pace',           code: 'onpace' };
  if (delta >= -25)  return { label: 'Slightly Behind',   code: 'slightly' };
  return { label: 'At Risk', code: 'risk' };
};

/** HH:MM (no seconds), with units. e.g. "3d 02h 55m" or "02h 05m" */
const formatFullTime = (totalSeconds) => {
  const days = Math.floor(totalSeconds / 86400);
  const remainder = totalSeconds % 86400;
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return days > 0 ? `${days}d ${hh}h ${mm}m` : `${hh}h ${mm}m`;
};

const ensureChecklistStructure = (data) => {
  const fixed = { ...data };
  for (const [stepKey, stepValue] of Object.entries(defaultStepData)) {
    const current = fixed[stepKey];
    if (!current || typeof current !== 'object') fixed[stepKey] = stepValue;
    else if (!Array.isArray(current.checklist)) fixed[stepKey].checklist = stepValue.checklist;
    else {
      const existingTasks = current.checklist.map((i) => i.task);
      const merged = [...current.checklist];
      stepValue.checklist.forEach((def) => {
        if (!existingTasks.includes(def.task)) merged.push(def);
      });
      fixed[stepKey].checklist = merged;
    }
  }
  return fixed;
};

const ManageProjectModal = ({ isOpen, onClose, projectData, onProjectUpdate }) => {
  const [selectedTab, setSelectedTab] = useState('details');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (!projectData) return;
    const hydrated = ensureChecklistStructure(projectData);
    setEditableData(hydrated);
    setOriginalData(hydrated);
    setStatus(determineOverallStatus(hydrated));
  }, [projectData]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calculateProjectTotalTime = (data = editableData) => {
    let total = 0;
    Object.keys(data || {}).forEach((k) => {
      const cl = data[k]?.checklist || [];
      cl.forEach((item) => {
        if (typeof item.totalSeconds === 'number') total += item.totalSeconds;
      });
    });
    return total;
  };

  const determineCurrentPhase = (data = editableData) => {
    for (const phase of buildPhases) {
      const checklist = data[phase.key]?.checklist;
      if (!checklist || checklist.some((i) => !i.completed)) return phase.label;
    }
    return 'All Steps Complete';
  };

  const determineOverallStatus = (data = editableData) => {
    const all = buildPhases.flatMap((p) => data[p.key]?.checklist || []);
    const total = all.length;
    const done = all.filter((t) => t.completed).length;
    if (done === 0) return 'Initial Planning';
    if (done === total) return 'Finished';
    return 'In Production';
  };

  const saveToFirestore = async (updatedPartial = {}) => {
    try {
      const merged = { ...editableData, ...updatedPartial };
      const totalTimeSeconds = calculateProjectTotalTime(merged);
      const newStatus = determineOverallStatus(merged);
      const currentPhase = determineCurrentPhase(merged);

      const dataToSave = { ...merged, totalTimeSeconds, status: newStatus, currentPhase };
      const ref = doc(db, 'projects', projectData.id);
      await setDoc(ref, dataToSave, { merge: true });

      const snap = await getDoc(ref);
      const rehydrated = ensureChecklistStructure(snap.data());
      setEditableData(rehydrated);
      setIsEditing(false);
      setShowSnackbar(true);
      setStatus(newStatus);
    } catch (err) {
      console.error('❌ Failed to save project data:', err);
    }
  };

  const handleChecklistToggle = (stepKey, index, completed, totalSeconds) => {
    const step = editableData[stepKey] || { checklist: [] };
    const updatedChecklist = step.checklist.map((item, i) =>
      i === index ? { ...item, completed, totalSeconds } : item
    );
    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };
    const merged = { ...editableData, ...update };

    setEditableData(merged);
    setStatus(determineOverallStatus(merged));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });

    saveToFirestore(update);
    setIsEditing(false);
    setShowSnackbar(true);
  };

  const getCurrentStepProgress = () => {
    const currentKey = buildPhases.find((p) => p.label === determineCurrentPhase(editableData))?.key;
    const cl = editableData?.[currentKey]?.checklist || [];
    const done = cl.filter((t) => t.completed).length;
    const total = cl.length || 1;
    return Math.round((done / total) * 100);
  };

  const getStepProgressClass = () => {
    const pct = getCurrentStepProgress();
    if (pct === 0) return 'step-chip step-0';
    if (pct < 35) return 'step-chip step-25';
    if (pct < 65) return 'step-chip step-50';
    if (pct < 100) return 'step-chip step-75';
    return 'step-chip step-100';
  };

  const currentStepName = determineCurrentPhase(editableData);
  const parentOrderId   = projectData?.parentOrderId || projectData?.orderId || '';
  const idText          = projectData?.id || '—';

  return (
    <div className="manage-project-modal-overlay" onClick={onClose}>
      <div
        className="manage-project-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="admin-project-view-title" className="modal-title">Admin Project View</h2>

          {/* Build status (from checklist completion) */}
          <div className={`status-chip ${status.toLowerCase().replace(/\s+/g, '-')}`}>
            Build Status: {status}
          </div>

          {/* Schedule status chip (progress vs time elapsed with buffer) */}
          {(() => {
            const prog = overallProgressPct(editableData);
            const sch = scheduleStatus({
              startDate: projectData?.startDate,
              targetDate: projectData?.targetCompletion,
              bufferDays: 14,
              progressPct: prog,
            });
            return <div className={`sched-chip ${sch.code}`}>Schedule: {sch.label} ({prog}%)</div>;
          })()}

          {/* Target + 2-week buffer callout */}
          <div className="target-chip">
            Target: {fmtMDY(projectData?.targetCompletion)} &rarr;{' '}
            {projectData?.targetCompletion
              ? fmtMDY(new Date(toDate(projectData.targetCompletion).getTime() + 14 * 86400000))
              : '—'}{' '}
            <span className="sub">(2-week buffer)</span>
          </div>

          {/* Current step progress chip */}
          <div className={getStepProgressClass()}>
            Current Step: {currentStepName}
          </div>

          {/* Total time */}
          <div className="total-time-wrapper">
            <span className="total-time-label">Total Time Spent:</span>
            <span className="total-time-value">{formatFullTime(calculateProjectTotalTime())}</span>
          </div>

          {/* close button (header has extra right padding so it never overlaps) */}
          <button type="button" aria-label="Close modal" className="modal-close-btn" onClick={onClose}>✕</button>
        </header>

        {/* Identifier / order row */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div className="identifier-top">
            {projectData?.artisanLine && (
              <span className="identifier-chip"><strong>ID</strong> {projectData.artisanLine}</span>
            )}
            {projectData?.customerName && (
              <span className="identifier-chip">👤 {projectData.customerName}</span>
            )}
            <span className="identifier-chip mono-id">ID: {idText}</span>
          </div>
          <div className="id-row" style={{ marginTop: 6 }}>
            <span className="mono-id">{idText}</span>
            <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(String(idText))}>Copy ID</button>
            {parentOrderId && (
              <>
                <span style={{ opacity: .6 }}>·</span>
                <span>Order:</span>
                <a className="mono-id" href={`/orders/${parentOrderId}`} target="_blank" rel="noreferrer">{parentOrderId}</a>
                <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(String(parentOrderId))}>Copy</button>
              </>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div className="mobile-phase-selector-wrapper">
            <select
              className="phase-selector-dropdown"
              value={selectedTab}
              onChange={(e) => setSelectedTab(e.target.value)}
            >
              <option value="details">📝 Overview</option>
              {buildPhases.map((phase, idx) => {
                const unlocked = buildPhases
                  .slice(0, idx)
                  .every((prev) => editableData[prev.key]?.checklist?.every((i) => i.completed));
                const allDone = editableData[phase.key]?.checklist?.every((i) => i.completed);
                return (
                  <option key={phase.key} value={phase.key} disabled={!unlocked}>
                    {allDone ? '✅ ' : !unlocked ? '🔒 ' : ''}{phase.label}
                  </option>
                );
              })}
            </select>
          </div>

          <aside className="sidebar">
            <button className={selectedTab === 'details' ? 'active' : ''} onClick={() => setSelectedTab('details')}>
              📝 Overview
            </button>
            {buildPhases.map((phase, idx) => {
              const unlocked = buildPhases
                .slice(0, idx)
                .every((prev) => editableData[prev.key]?.checklist?.every((i) => i.completed));
              const isActive = selectedTab === phase.key;
              const allDone = editableData[phase.key]?.checklist?.every((i) => i.completed);
              return (
                <button
                  key={phase.key}
                  className={`${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => unlocked && setSelectedTab(phase.key)}
                  title={!unlocked ? 'Complete the previous step to unlock' : ''}
                >
                  {allDone ? '✅ ' : !unlocked ? '🔒 ' : ''}{phase.label}
                </button>
              );
            })}
          </aside>

          <main>
            {selectedTab === 'details' ? (
              <ProjectOverview
                editableData={{ ...editableData, id: projectData.id }}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing((v) => !v)}
                handleChange={(path, value) => {
                  setEditableData((prev) => {
                    const updated = { ...prev };
                    const keys = path.split('.');
                    let cur = updated;
                    for (let i = 0; i < keys.length - 1; i++) {
                      if (!cur[keys[i]]) cur[keys[i]] = {};
                      cur = cur[keys[i]];
                    }
                    cur[keys[keys.length - 1]] = value;
                    return updated;
                  });
                }}
                onSave={() => { saveToFirestore(editableData); setIsEditing(false); setShowSnackbar(true); }}
                onCancel={() => { setEditableData(originalData); setIsEditing(false); }}
              />
            ) : (
              <StepComponentTemplate
                stepKey={selectedTab}
                stepLabel={buildPhases.find((p) => p.key === selectedTab)?.label || selectedTab}
                stepData={editableData[selectedTab]}
                onToggleChecklist={(index, completed, seconds) =>
                  handleChecklistToggle(selectedTab, index, completed, seconds)}
                isLocked={
                  selectedTab !== 'details' &&
                  buildPhases
                    .slice(0, buildPhases.findIndex((p) => p.key === selectedTab))
                    .some((prev) => !(editableData[prev.key]?.checklist || []).every((i) => i.completed))
                }
              />
            )}
          </main>
        </div>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={3000}
          onClose={() => setShowSnackbar(false)}
          message="Changes saved"
        />
      </div>
    </div>
  );
};

export default ManageProjectModal;