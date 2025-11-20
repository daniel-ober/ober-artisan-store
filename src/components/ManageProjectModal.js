// src/components/ManageProjectModal.js
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import StepComponentTemplate from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import defaultStepData from '../utils/defaultStepData';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';
import { Snackbar } from '@mui/material';
import './ManageProjectModal.css';

/* ----------------------------------------------------------------------------
 * CORE STEP KEYS (match Firestore + defaultStepData)
 * -------------------------------------------------------------------------- */
const STEP_KEYS = [
  'discoveryDesign',
  'commitmentPortal',
  'woodVisionLockIn',
  'rawShellCreation',
  'shellTrueingTorchTune',
  'exteriorArtFinish',
  'edgesSnareBeds',
  'hardwareAssembly',
  'legacyTuningMedia',
  'finalQAPackagingDelivery',
];

/* ----------------------------------------------------------------------------
 * STEP META: labels + phase metadata (phaseId is only for logic, not UI)
 * -------------------------------------------------------------------------- */
const STEP_META = {
  discoveryDesign: {
    label: '1. Discovery & Design',
    phaseId: 'phase1',
  },
  commitmentPortal: {
    label: '2. Commitment & Portal Setup',
    phaseId: 'phase1',
  },
  woodVisionLockIn: {
    label: '3. Wood & Vision Lock-In',
    phaseId: 'phase1',
  },
  rawShellCreation: {
    label: '4. Raw Shell Creation',
    phaseId: 'phase2',
  },
  shellTrueingTorchTune: {
    label: '5. Shell Trueing & Torch Tune',
    phaseId: 'phase2',
  },
  exteriorArtFinish: {
    label: '6. Exterior Art & Finish',
    phaseId: 'phase2',
  },
  edgesSnareBeds: {
    label: '7. Edges & Snare Beds',
    phaseId: 'phase2',
  },
  hardwareAssembly: {
    label: '8. Hardware & Assembly',
    phaseId: 'phase2',
  },
  legacyTuningMedia: {
    label: '9. Legacy Tuning & Media',
    phaseId: 'phase3',
  },
  finalQAPackagingDelivery: {
    label: '10. Final QA, Packaging & Delivery',
    phaseId: 'phase3',
  },
};

const buildPhases = STEP_KEYS.map((key) => ({
  key,
  label: STEP_META[key]?.label || key,
  phaseId: STEP_META[key]?.phaseId || null,
}));

/* ----- date + progress helpers --------------------------------------------------- */
const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate(); // Firestore Timestamp
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

/**
 * Patch the data before sending to calculateProjectProgress.
 * That util still expects the old step names, so we alias.
 */
const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  const patched = {
    ...data,
    woodPreparation: data.discoveryDesign,
    shellConstruction: data.commitmentPortal,
    fineTuning: data.woodVisionLockIn,
    shellExteriorFinish: data.rawShellCreation,
    bearingEdges: data.shellTrueingTorchTune,
    snareBedCutting: data.exteriorArtFinish,
    hardwareDrilling: data.edgesSnareBeds,
    hardwareAssembly: data.hardwareAssembly,
    tuningAndDetailing: data.legacyTuningMedia,
    qualityCheck: data.finalQAPackagingDelivery,
  };

  return calculateProjectProgress(patched);
};

/** Compare actual progress vs time elapsed (with buffer) to produce a schedule chip. */
const scheduleStatus = ({
  startDate,
  targetDate, // unbuffered target
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
  if (delta >= 10) return { label: 'Ahead', code: 'ahead' };
  if (delta >= -10) return { label: 'On Pace', code: 'onpace' };
  if (delta >= -25) return { label: 'Slightly Behind', code: 'slightly' };
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

/**
 * Ensure each of the 10 core steps has a checklist matching defaultStepData.
 * If a project document is missing a step or is missing items, we hydrate/merge it.
 */
const ensureChecklistStructure = (data) => {
  const fixed = { ...data };

  // Hydrate from defaultStepData (canonical 10 steps)
  for (const [stepKey, stepValue] of Object.entries(defaultStepData)) {
    const current = fixed[stepKey];
    if (!current || typeof current !== 'object') {
      fixed[stepKey] = stepValue;
    } else if (!Array.isArray(current.checklist)) {
      fixed[stepKey].checklist = stepValue.checklist;
    } else {
      const existingTasks = current.checklist.map((i) => i.task);
      const merged = [...current.checklist];
      stepValue.checklist.forEach((def) => {
        if (!existingTasks.includes(def.task)) merged.push(def);
      });
      fixed[stepKey].checklist = merged;
    }
  }

  // Normalize checklist items
  buildPhases.forEach((phase) => {
    const current = fixed[phase.key] || {};
    let cl = Array.isArray(current.checklist) ? current.checklist : [];

    if (cl.length === 0) {
      cl = [
        {
          id: `${phase.key}_1`,
          label: `${phase.label} — Step 1`,
          completed: false,
          totalSeconds: 0,
        },
        {
          id: `${phase.key}_2`,
          label: `${phase.label} — Step 2`,
          completed: false,
          totalSeconds: 0,
        },
        {
          id: `${phase.key}_3`,
          label: `${phase.label} — Step 3`,
          completed: false,
          totalSeconds: 0,
        },
      ];
    } else {
      cl = cl.map((item, idx) => ({
        ...item,
        label: item.label ?? item.task ?? `${phase.label} — Step ${idx + 1}`,
        completed: !!item.completed,
        totalSeconds: Number.isFinite(item.totalSeconds)
          ? item.totalSeconds
          : 0,
        // keep any existing checkpointStates array if present
        checkpointStates: Array.isArray(item.checkpointStates)
          ? item.checkpointStates
          : [],
      }));
    }

    fixed[phase.key] = {
      ...current,
      checklist: cl,
    };
  });

  return fixed;
};

/* ----------------------------------------------------------------------------
 * LIFECYCLE PANEL (Stage → Step → Checkpoint)
 * -------------------------------------------------------------------------- */

const LifecyclePanel = ({ lifecycle, onToggleCheckpoint }) => {
  const stages = lifecycle?.stages || {};
  const stageIds = Object.keys(stages).sort((a, b) => {
    const aOrder = stages[a]?.order ?? 0;
    const bOrder = stages[b]?.order ?? 0;
    return aOrder - bOrder;
  });

  if (!stageIds.length) {
    return (
      <div className="mpm-lifecycle-card">
        <h3 className="mpm-lifecycle-title">Lifecycle Checkpoints</h3>
        <p className="mpm-lifecycle-hint">
          No lifecycle data found for this project. New projects will populate
          this automatically as you define stages, steps, and checkpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="mpm-lifecycle-card">
      <h3 className="mpm-lifecycle-title">Lifecycle Checkpoints</h3>
      <p className="mpm-lifecycle-hint">
        This is your Stage → Step → Checkpoint map. Toggle checkpoints as you
        complete them. Stage and Step completion will auto-roll up.
      </p>

      {stageIds.map((stageId) => {
        const stage = stages[stageId] || {};
        const steps = stage.steps || {};
        const stepIds = Object.keys(steps).sort((a, b) => {
          const aOrder = steps[a]?.order ?? 0;
          const bOrder = steps[b]?.order ?? 0;
          return aOrder - bOrder;
        });
        const stageDone = !!stage.completed;

        return (
          <div key={stageId} className="mpm-lifecycle-stage">
            <div className="mpm-lifecycle-stage-header">
              <span className="mpm-lifecycle-stage-title">
                {stageDone ? '✅ ' : ''}
                {stage.label || stageId}
              </span>
            </div>

            {stepIds.map((stepId) => {
              const step = steps[stepId] || {};
              const checkpoints = step.checkpoints || {};
              const checkpointIds = Object.keys(checkpoints);
              const stepDone = !!step.completed;

              if (!checkpointIds.length) return null;

              return (
                <div key={stepId} className="mpm-lifecycle-step">
                  <div className="mpm-lifecycle-step-title">
                    {stepDone ? '✅ ' : ''}
                    {step.label || stepId}
                  </div>

                  <ul className="mpm-lifecycle-ck-list">
                    {checkpointIds.map((cpId) => {
                      const cp = checkpoints[cpId] || {};
                      return (
                        <li key={cpId} className="mpm-lifecycle-ck-item">
                          <label className="mpm-lifecycle-ck-label-wrap">
                            <input
                              type="checkbox"
                              checked={!!cp.completed}
                              onChange={(e) =>
                                onToggleCheckpoint(
                                  stageId,
                                  stepId,
                                  cpId,
                                  e.target.checked
                                )
                              }
                            />
                            <span className="mpm-lifecycle-ck-label">
                              {cp.label || cpId}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const [selectedTab, setSelectedTab] = useState('details'); // 'details' or stepKey
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // which step is expanded in sidebar, and which sub-step is selected
  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const determineOverallStatus = (data = editableData) => {
    const all = buildPhases.flatMap((p) => data[p.key]?.checklist || []);
    const total = all.length;
    const done = all.filter((t) => t.completed).length;
    if (done === 0) return 'Initial Planning';
    if (done === total) return 'Finished';
    return 'In Production';
  };

const determineCurrentPhase = (data = editableData) => {
  if (!data) return 'Unknown';

  let lastTouchedLabel = null;

  for (const phase of buildPhases) {
    const stepData = data[phase.key] || {};
    const checklist = Array.isArray(stepData.checklist)
      ? stepData.checklist
      : [];

    if (!checklist.length) continue;

    const label = STEP_META[phase.key]?.label || phase.label || phase.key;

    const anyTouched = checklist.some((item) => {
      const hasCompleted = !!item.completed;
      const hasCheckpoint =
        Array.isArray(item.checkpointStates) &&
        item.checkpointStates.some(Boolean);
      return hasCompleted || hasCheckpoint;
    });

    const allDone =
      checklist.length > 0 && checklist.every((item) => !!item.completed);

    if (anyTouched && !allDone) {
      // This is the first "in progress" phase → current step
      return label;
    }

    if (anyTouched) {
      // Keep track of the last phase where *something* happened
      lastTouchedLabel = label;
    }
  }

  // If we get here, then either nothing has started or all are finished.
  if (lastTouchedLabel) return lastTouchedLabel;

  // Fallback to the very first phase label
  const first = buildPhases[0];
  return (
    (first && (STEP_META[first.key]?.label || first.label || first.key)) ||
    'Unknown'
  );
};

useEffect(() => {
  if (!projectData) return;

  const hydrated = ensureChecklistStructure(projectData);
  setEditableData(hydrated);
  setOriginalData(hydrated);
  setStatus(determineOverallStatus(hydrated));
}, [projectData]);

useEffect(() => {
  if (!isOpen) return;

  // When the modal is opened, start on Overview / Step 1
  setSelectedTab('details');
  setSelectedStepKey(null);
  setSelectedSubIndex(0);

  const firstKey = buildPhases[0]?.key || null;
  setExpandedStepKey(firstKey);

  setIsEditing(false);
}, [isOpen]);

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

  const saveToFirestore = async (updatedPartial = {}) => {
    try {
      const merged = { ...editableData, ...updatedPartial };
      const totalTimeSeconds = calculateProjectTotalTime(merged);
      const newStatus = determineOverallStatus(merged);
      const currentPhase = determineCurrentPhase(merged);

      const dataToSave = {
        ...merged,
        totalTimeSeconds,
        status: newStatus,
        currentPhase,
      };
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

  /**
   * NEW: persist per-sub-step checkpoint checkbox state.
   * checkpointStates is an array of booleans on the checklist item.
   */
  const handleCheckpointStatesChange = (stepKey, itemIndex, checkpointStates) => {
    const step = editableData[stepKey] || { checklist: [] };
    const updatedChecklist = (step.checklist || []).map((item, idx) =>
      idx === itemIndex ? { ...item, checkpointStates } : item
    );
    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };
    const merged = { ...editableData, ...update };

    setEditableData(merged);
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });

    // We only need to merge the step; saveToFirestore will recalc status/time.
    saveToFirestore(update);
  };

  /**
   * Toggle a lifecycle checkpoint and roll up completion to step + stage.
   * This works against the nested:
   * lifecycle.stages[stageId].steps[stepId].checkpoints[checkpointId]
   */
  const handleLifecycleCheckpointToggle = (
    stageId,
    stepId,
    checkpointId,
    newCompleted
  ) => {
    const prev = editableData || {};
    const lifecycle = prev.lifecycle || {};
    const stages = { ...(lifecycle.stages || {}) };

    const stage = { ...(stages[stageId] || { steps: {} }) };
    const steps = { ...(stage.steps || {}) };
    const step = { ...(steps[stepId] || { checkpoints: {} }) };
    const checkpoints = { ...(step.checkpoints || {}) };
    const cp = { ...(checkpoints[checkpointId] || {}) };

    cp.completed = newCompleted;
    cp.timestamp = newCompleted ? new Date().toISOString() : null;
    checkpoints[checkpointId] = cp;

    // Recompute step.completed
    const checkpointList = Object.values(checkpoints);
    step.checkpoints = checkpoints;
    step.completed =
      checkpointList.length > 0 && checkpointList.every((c) => c.completed);

    steps[stepId] = step;

    // Recompute stage.completed
    const stepList = Object.values(steps);
    stage.steps = steps;
    stage.completed =
      stepList.length > 0 && stepList.every((s) => s.completed);

    stages[stageId] = stage;

    const updatedLifecycle = {
      ...lifecycle,
      stages,
    };

    const updated = {
      ...prev,
      lifecycle: updatedLifecycle,
    };

    setEditableData(updated);

    // Persist only the lifecycle field; saveToFirestore will also
    // recalc status/currentPhase from the 10-step checklist.
    saveToFirestore({ lifecycle: updatedLifecycle });
  };

  const getCurrentStepProgress = () => {
    const currentKey = buildPhases.find(
      (p) =>
        (STEP_META[p.key]?.label || p.label) ===
        determineCurrentPhase(editableData)
    )?.key;

    const cl = editableData?.[currentKey]?.checklist || [];
    const done = cl.filter((t) => t.completed).length;
    const total = cl.length || 1;
    return Math.round((done / total) * 100);
  };

  const getStepProgressClass = () => {
    const pct = getCurrentStepProgress();
    if (pct === 0) return 'mpm-step-chip mpm-step-0';
    if (pct < 35) return 'mpm-step-chip mpm-step-25';
    if (pct < 65) return 'mpm-step-chip mpm-step-50';
    if (pct < 100) return 'mpm-step-chip mpm-step-75';
    return 'mpm-step-chip mpm-step-100';
  };

  const currentPhaseLabel = determineCurrentPhase(editableData);
  const selectedStepLabel =
    selectedTab === 'details'
      ? currentPhaseLabel
      : buildPhases.find((p) => p.key === selectedTab)?.label ||
        currentPhaseLabel;

  const parentOrderId =
    projectData?.parentOrderId || projectData?.orderId || '';
  const idText = projectData?.id || '—';
  const weightedProgress = getWeightedProgressPct(editableData);

  // Resolve current sub-step label for main header
  const currentChecklist =
    selectedStepKey && editableData[selectedStepKey]
      ? editableData[selectedStepKey].checklist || []
      : [];
  const currentSub =
    selectedSubIndex !== null && currentChecklist[selectedSubIndex]
      ? currentChecklist[selectedSubIndex]
      : null;
  const currentSubLabel =
    currentSub?.label ?? currentSub?.task ?? selectedStepLabel;

  // ----- helper: current value for mobile dropdown -----
  const getMobileSelectValue = () => {
    if (!selectedStepKey || selectedTab === 'details') return 'details';
    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${selectedStepKey}::${idx}`;
  };

  return (
    <div className="manage-project-modal-overlay mpm-overlay" onClick={onClose}>
      <div
        className="manage-project-modal-content mpm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mpm-header">
          <h2 id="admin-project-view-title" className="mpm-title">
            Admin Project View
          </h2>

          {/* Build status (from checklist completion) */}
          <div
            className={`mpm-status-chip ${status
              .toLowerCase()
              .replace(/\s+/g, '-')}`}
          >
            Build Status: {status}
          </div>

          {/* Overall time-weighted progress chip */}
          <div className="mpm-overall-progress-chip">
            Overall Progress: {weightedProgress}%
          </div>

          {/* Schedule status chip (progress vs time elapsed with buffer) */}
          {(() => {
            const sch = scheduleStatus({
              startDate: projectData?.startDate,
              targetDate: projectData?.targetCompletion,
              bufferDays: 14,
              progressPct: weightedProgress,
            });
            return (
              <div className={`mpm-sched-chip ${sch.code}`}>
                Schedule: {sch.label} ({weightedProgress}%)
              </div>
            );
          })()}

          {/* Target + 2-week buffer callout */}
          <div className="mpm-target-chip">
            Target: {fmtMDY(projectData?.targetCompletion)} &rarr;{' '}
            {projectData?.targetCompletion
              ? fmtMDY(
                  new Date(
                    toDate(projectData.targetCompletion).getTime() +
                      14 * 86400000
                  )
                )
              : '—'}{' '}
            <span className="mpm-target-sub">(2-week buffer)</span>
          </div>

          {/* Current step progress chip */}
          <div className={getStepProgressClass()}>
            Current Step: {currentPhaseLabel}
          </div>

          {/* Total time */}
          <div className="mpm-total-time-wrapper">
            <span className="mpm-total-time-label">Total Time Spent:</span>
            <span className="mpm-total-time-value">
              {formatFullTime(calculateProjectTotalTime())}
            </span>
          </div>

          {/* close button */}
          <button
            type="button"
            aria-label="Close modal"
            className="mpm-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* Identifier / order row */}
        <div
          className="mpm-id-strip"
          style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}
        >
          <div className="mpm-identifier-top">
            {projectData?.artisanLine && (
              <span className="mpm-identifier-chip">
                <strong>ID</strong> {projectData.artisanLine}
              </span>
            )}
            {projectData?.customerName && (
              <span className="mpm-identifier-chip">
                👤 {projectData.customerName}
              </span>
            )}
            <span className="mpm-identifier-chip mpm-mono-id">
              ID: {idText}
            </span>
          </div>
          <div className="mpm-id-row" style={{ marginTop: 6 }}>
            <span className="mpm-mono-id">{idText}</span>
            <button
              className="mpm-copy-btn"
              onClick={() => navigator.clipboard?.writeText(String(idText))}
            >
              Copy ID
            </button>
            {parentOrderId && (
              <>
                <span style={{ opacity: 0.6 }}>·</span>
                <span>Order:</span>
                <a
                  className="mpm-mono-id"
                  href={`/orders/${parentOrderId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {parentOrderId}
                </a>
                <button
                  className="mpm-copy-btn"
                  onClick={() =>
                    navigator.clipboard?.writeText(String(parentOrderId))
                  }
                >
                  Copy
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mpm-body">
          {/* Mobile selector (step + sub-step) */}
          <div className="mpm-mobile-phase-selector-wrapper">
            <select
              className="mpm-phase-selector-dropdown"
              value={getMobileSelectValue()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'details') {
                  setSelectedTab('details');
                  setSelectedStepKey(null);
                  setSelectedSubIndex(0);
                  return;
                }
                const [stepKey, idxStr] = val.split('::');
                const idx = Number(idxStr) || 0;
                setSelectedTab(stepKey);
                setExpandedStepKey(stepKey);
                setSelectedStepKey(stepKey);
                setSelectedSubIndex(idx);
              }}
            >
              <option value="details">📝 Overview</option>

              {buildPhases.map((phase) => {
                const cl = editableData[phase.key]?.checklist || [];
                if (!cl.length) return null;

                return (
                  <optgroup key={phase.key} label={phase.label}>
                    {cl.map((item, idx) => {
                      const label = item.label ?? item.task ?? '';
                      const optionValue = `${phase.key}::${idx}`;
                      const done = !!item.completed;
                      return (
                        <option key={optionValue} value={optionValue}>
                          {done ? '✅ ' : ''}
                          {label}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Sidebar: Overview + 10 steps, each expandable to show sub-steps */}
          <aside className="mpm-sidebar">
            <button
              className={`mpm-sidebar-overview-btn ${
                selectedTab === 'details' ? 'active' : ''
              }`}
              onClick={() => {
                setSelectedTab('details');
                setSelectedStepKey(null);
                setSelectedSubIndex(0);
              }}
            >
              📝 Overview
            </button>

            <div className="mpm-sidebar-step-list">
              {buildPhases.map((step) => {
                const isExpanded = expandedStepKey === step.key;
                const checklist = editableData[step.key]?.checklist || [];
                const allDone =
                  checklist.length > 0 && checklist.every((i) => i.completed);

                return (
                  <div key={step.key} className="mpm-sidebar-step-block">
                    <button
                      className={`mpm-sidebar-step-root ${
                        selectedTab === step.key ? 'active' : ''
                      }`}
                      onClick={() => {
                        setExpandedStepKey(step.key);
                        setSelectedTab(step.key);
                        setSelectedStepKey(step.key);
                        setSelectedSubIndex(0);
                      }}
                    >
                      {allDone ? '✅ ' : ''}
                      {step.label}
                    </button>

                    {isExpanded && checklist.length > 0 && (
                      <div className="mpm-sidebar-substep-list">
                        {checklist.map((item, idx) => {
                          const label = item.label ?? item.task ?? '';
                          const isActiveSub =
                            selectedStepKey === step.key &&
                            selectedSubIndex === idx;

                          return (
                            <button
                              key={item.id || idx}
                              className={`mpm-sidebar-substep-btn ${
                                isActiveSub ? 'active' : ''
                              }`}
                              type="button"
                              onClick={() => {
                                setSelectedStepKey(step.key);
                                setSelectedSubIndex(idx);
                                setSelectedTab(step.key);
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="mpm-main">
            {selectedTab === 'details' ? (
              <>
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
                  onSave={() => {
                    saveToFirestore(editableData);
                    setIsEditing(false);
                    setShowSnackbar(true);
                  }}
                  onCancel={() => {
                    setEditableData(originalData);
                    setIsEditing(false);
                  }}
                />

                {/* NEW: Lifecycle Stage → Step → Checkpoint view */}
                <LifecyclePanel
                  lifecycle={editableData.lifecycle}
                  onToggleCheckpoint={handleLifecycleCheckpointToggle}
                />
              </>
            ) : (
              <StepComponentTemplate
                stepKey={selectedStepKey}
                stepLabel={currentSubLabel}
                stepData={editableData[selectedStepKey] || { checklist: [] }}
                onToggleChecklist={(index, completed, seconds) =>
                  handleChecklistToggle(
                    selectedStepKey,
                    index,
                    completed,
                    seconds
                  )
                }
                onUpdateCheckpointStates={(itemIndex, states) =>
                  handleCheckpointStatesChange(
                    selectedStepKey,
                    itemIndex,
                    states
                  )
                }
                isLocked={false}
                showCheckbox={false}
                activeIndex={selectedSubIndex}
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