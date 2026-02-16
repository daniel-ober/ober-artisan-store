// src/components/ManageProjectModal.js
import React, { useState, useEffect } from 'react';
import { STAGE_TEMPLATES } from '../utils/workflowDefinitions';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import StepComponentTemplate, {
  CHECKPOINTS_BY_ITEM_ID,
} from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import { defaultStepData } from '../utils/buildWorkflow';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';
import { Snackbar } from '@mui/material';
import { useImpersonation } from '../context/ImpersonationContext';

import './ManageProjectModal.css';
// NOTE: StepComponentTemplate expects checkpointStates as boolean[]
// (tri-state objects make every checkbox "truthy"/checked).

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

// Small helper to build "SL-005 · SoundLegend · 14×8"
const val = (...c) =>
  c.find((v) => v !== undefined && v !== null && v !== '') ?? undefined;

// Mirror nested customer fields → top-level so ManageProjects table never shows N/A
const deriveCustomerName = (p = {}) =>
  val(
    p.customerName,
    p.customer?.name,
    p.customer?.displayName,
    p.publicPrefs?.displayName,
    p.customerInfo?.name,
    p.customerFullName
  ) || '';

const deriveCustomerEmail = (p = {}) =>
  val(
    p.customerEmail,
    p.customer?.email,
    p.customerEmailAddress,
    p.email,
    p.customerInfo?.email
  ) || '';

const getIdentifier = (p = {}) => {
  const serial =
    val(
      p.lineSerial, // canonical
      p.serial,
      p.serialNumber,
      p.projectSerial,
      p.snareSerial,
      p.serialId
    ) || '';

  const line =
    val(
      p.artisanLine, // canonical
      p.series,
      p.productLine,
      p.seriesLine,
      p.line
    ) || '';

  const dia = val(p.width, p.diameter); // canonical width = diameter
  const dep = val(p.shellDepth, p.depth); // canonical shellDepth = depth
  const size = dia && dep ? ` · ${dia}×${dep}"` : '';

  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial) return `${serial}${size}`;
  if (line) return `${line}${size}`;
  return size ? size.slice(3) : '—'; // strip leading " · "
};

const buildPhases = STEP_KEYS.map((key) => ({
  key,
  label: STEP_META[key]?.label || key,
  phaseId: STEP_META[key]?.phaseId || null,
}));

// Same mapping logic used by StepComponentTemplate
const STEPKEY_TO_CHECKPOINT_PREFIX = {
  discoveryDesign: 'discoveryDesign',
  commitmentPortal: 'commitmentPortal',
  woodVisionLockIn: 'woodVisionLockIn',
  rawShellCreation: 'rawShellCreation',
  shellTrueingTorchTune: 'shellTrueingTorchTune',
  exteriorArtFinish: 'exteriorArtFinish',
  edgesSnareBeds: 'edgesSnareBeds',
  hardwareAssembly: 'hardwareAssembly',
  legacyTuningMedia: 'legacyTuningMedia',
  finalQAPackagingDelivery: 'finalQAPackagingDelivery',

  // legacy aliases (if any old keys still exist in docs)
  woodPreparation: 'woodVisionLockIn',
  shellConstruction: 'rawShellCreation',
  fineTuning: 'shellTrueingTorchTune',
  shellExteriorFinish: 'exteriorArtFinish',
  bearingEdges: 'edgesSnareBeds',
  snareBedCutting: 'edgesSnareBeds',
  hardwareDrilling: 'hardwareAssembly',
  tuningDetailing: 'legacyTuningMedia',
  qualityCheck: 'finalQAPackagingDelivery',
};

// returns the checkpoint list for a given substep (prefers item.id, falls back to generated key)
const getCheckpointListForSubstep = (stepKey, itemIndex, item) => {
  const id = item?.id;
  if (id && Array.isArray(CHECKPOINTS_BY_ITEM_ID?.[id])) {
    return CHECKPOINTS_BY_ITEM_ID[id];
  }

  const prefix = STEPKEY_TO_CHECKPOINT_PREFIX[stepKey] || stepKey;
  const generatedKey = `${prefix}_${itemIndex + 1}`;
  if (Array.isArray(CHECKPOINTS_BY_ITEM_ID?.[generatedKey])) {
    return CHECKPOINTS_BY_ITEM_ID[generatedKey];
  }

  return [];
};

// Figure out how many checkpoints a given checklist item *should* have.
const getCheckpointCountForItem = (stepKey, itemIndex, item = {}) => {
  return getCheckpointListForSubstep(stepKey, itemIndex, item).length;
};

// Normalize checkpointStates into a boolean[] of the expected length.
// Supports legacy boolean[] and tri-state object[] ({ status: 'completed' | ... }).
const normalizeCheckpointBooleans = (states, expectedCount = 0) => {
  const arr = Array.isArray(states) ? states : [];

  const mapped = arr.map((c) => {
    if (typeof c === 'boolean') return c;
    if (c && typeof c === 'object') return c.status === 'completed';
    return false;
  });

  const padded = mapped.concat(
    new Array(Math.max(0, expectedCount - mapped.length)).fill(false)
  );

  return padded.slice(0, expectedCount);
};

const shortenCheckpointLabel = (s = '') => {
  const str = String(s).trim();
  if (!str) return 'Checkpoint';
  // keep it readable in the sidebar
  return str.length > 44 ? `${str.slice(0, 44).trim()}…` : str;
};

const getCheckpointLabelText = (cp) => {
  if (!cp) return '';

  // 1) Already a string
  if (typeof cp === 'string') return cp.trim();

  // 2) Object checkpoints (your cp() shape uses: ui, book, details)
  if (typeof cp === 'object') {
    // Prefer an explicit short field if you ever add one
    const short = typeof cp.short === 'string' ? cp.short.trim() : '';
    if (short) return short;

    // ✅ Prefer "book" as the sidebar short label (this is your short version)
    const book = typeof cp.book === 'string' ? cp.book.trim() : '';
    if (book) return book;

    // Fallback to UI (long)
    const ui = typeof cp.ui === 'string' ? cp.ui.trim() : '';
    if (ui) return ui;

    const label = typeof cp.label === 'string' ? cp.label.trim() : '';
    if (label) return label;

    const title = typeof cp.title === 'string' ? cp.title.trim() : '';
    if (title) return title;
  }

  return '';
};

const getSubstepLabelText = (item) => {
  if (!item) return 'Untitled';

  const candidates = [item.label, item.task, item.name, item.title];

  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }

  // If label/task accidentally became an object, try common nested keys
  const nested = [
    item.label?.task,
    item.label?.label,
    item.task?.task,
    item.task?.label,
  ];
  for (const v of nested) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }

  return 'Untitled';
};

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
/**
 * Ensure the canonical 10 steps exist and their checklist structure matches defaultStepData.
 * Fixes: duplicated / mis-ordered substeps, missing ids, broken time mapping.
 *
 * Rules:
 * - Only hydrate/merge STEP_KEYS (canonical 10 steps)
 * - Merge checklist items by stable `id` (NOT task/label)
 * - Preserve existing completed/totalSeconds/checkpointStates when present
 * - Normalize checkpointStates to boolean[]
 * - Do NOT auto-create 3 placeholder items (that corrupts reality)
 */
const ensureChecklistStructure = (data) => {
  const fixed = { ...(data || {}) };

  const deepClone = (obj) => {
    try {
      return typeof structuredClone === 'function'
        ? structuredClone(obj)
        : JSON.parse(JSON.stringify(obj));
    } catch {
      return JSON.parse(JSON.stringify(obj));
    }
  };

  STEP_KEYS.forEach((stepKey) => {
    const defStep = defaultStepData?.[stepKey];
    if (!defStep) return;

    const current = fixed?.[stepKey];

    // STEP MISSING → clone default
    if (!current) {
      fixed[stepKey] = deepClone(defStep);
      return;
    }

    const currentChecklist = Array.isArray(current.checklist)
      ? current.checklist
      : [];

    const defChecklist = defStep.checklist || [];

    // index legacy items by id
    const currentById = new Map();
    currentChecklist.forEach((item) => {
      if (item?.id) currentById.set(item.id, item);
    });

    // ✅ STRICT ALIGNMENT
    const mergedChecklist = defChecklist.map((defItem, idx) => {
      const existing = currentById.get(defItem.id);

      const expectedCount = getCheckpointCountForItem(stepKey, idx, defItem);

      return {
        // ALWAYS TRUST DEFAULT FOR STRUCTURE
        id: defItem.id,
        task: defItem.task,
        label: defItem.label ?? defItem.task,

        // ONLY copy SAFE runtime fields
        completed: !!existing?.completed,
        totalSeconds: Number.isFinite(existing?.totalSeconds)
          ? existing.totalSeconds
          : 0,

        checkpointStates: normalizeCheckpointBooleans(
          existing?.checkpointStates,
          expectedCount
        ),
      };
    });

    fixed[stepKey] = {
      ...current,
      checklist: mergedChecklist, // 🚨 replaces legacy items permanently
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
  // (Intentionally left simple for now; UI not requested here.)
  return null;
};

// ✅ Always returns the *one* active sub-step (first incomplete) while project < 100%
function getGlobalActivePointer(data) {
  if (!data) return null;

  for (const stepKey of STEP_KEYS) {
    const checklist = Array.isArray(data?.[stepKey]?.checklist)
      ? data[stepKey].checklist
      : [];

    for (let idx = 0; idx < checklist.length; idx += 1) {
      const item = checklist[idx] || {};
      const states = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const checkpointsDone = states.length > 0 && states.every(Boolean);

      const isDone = !!item.completed || checkpointsDone;
      if (!isDone) {
        return { stepKey, idx }; // FIRST incomplete sub-step across entire project
      }
    }
  }

  return null;
}

/* ----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const navigate = useNavigate(); // ✅ ADD THIS
  const { startImpersonation } = useImpersonation();

  const [selectedTab, setSelectedTab] = useState('details'); // 'details' or stepKey
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [mobileMetaOpen, setMobileMetaOpen] = useState(false);

  // which step is expanded in sidebar, and which sub-step is selected
  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  // linked customer user (for impersonation)
  const [linkedUser, setLinkedUser] = useState(null);

  const determineOverallStatus = (data = editableData) => {
    const all = buildPhases.flatMap((p) => data[p.key]?.checklist || []);
    const total = all.length;

    const done = all.filter((t) => {
      const states = Array.isArray(t?.checkpointStates)
        ? t.checkpointStates
        : [];
      const checkpointsDone = states.length > 0 && states.every(Boolean);
      return !!t.completed || checkpointsDone;
    }).length;

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
          item.checkpointStates.some((c) => c === true);

        return hasCompleted || hasCheckpoint;
      });

      const allDone =
        checklist.length > 0 && checklist.every((item) => !!item.completed);

      if (anyTouched && !allDone) return label;

      if (anyTouched) {
        // Keep track of the last phase where *something* happened
        lastTouchedLabel = label;
      }
    } // <-- CLOSE the for-loop

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
    if (!isOpen) return;

    const mq = window.matchMedia('(max-width: 920px)');
    const apply = () => setMobileMetaOpen(false); // collapsed by default on mobile

    if (mq.matches) apply();

    const onChange = (e) => {
      if (e.matches) setMobileMetaOpen(false);
    };

    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, [isOpen]);

  // hydrate project data
  useEffect(() => {
    if (!projectData) return;

    setEditableData((prev) => {
      // Merge remote data + local state so remote updates don't wipe local edits
      const merged = { ...(prev || {}), ...(projectData || {}) };
      return ensureChecklistStructure(merged);
    });

    setOriginalData((prev) => {
      const merged = { ...(prev || {}), ...(projectData || {}) };
      return ensureChecklistStructure(merged);
    });

    // status should be based on the merged structure too
    const mergedForStatus = ensureChecklistStructure({
      ...(editableData || {}),
      ...(projectData || {}),
    });
    setStatus(determineOverallStatus(mergedForStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectData]);

  // always open on Overview
  useEffect(() => {
    if (!isOpen) return;

    setSelectedTab('details');
    setSelectedStepKey(null);
    setSelectedSubIndex(0);

    const firstKey = buildPhases[0]?.key || null;
    setExpandedStepKey(firstKey);

    setIsEditing(false);
  }, [isOpen]);

  // 🔗 Link the project to a SoundLegend user for impersonation
  useEffect(() => {
    const linkUser = async () => {
      setLinkedUser(null);

      if (!projectData) return;

      try {
        /* 1) Try direct userId fields first (if you ever add these to projects) */
        const directUserId =
          projectData.customerUserId ||
          projectData.userId ||
          projectData.ownerUserId;

        if (directUserId) {
          console.log(
            '[ManageProjectModal] Trying to link user via direct id:',
            directUserId
          );
          const uRef = doc(db, 'users', directUserId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const uData = { id: uSnap.id, ...uSnap.data() };
            console.log('[ManageProjectModal] Linked user via id:', uData);
            setLinkedUser(uData);
            return;
          }
        }

        /* 2) Fallback: match on email (case/whitespace tolerant) */
        const rawEmail =
          projectData.customerEmail ||
          projectData.email ||
          projectData.customerEmailAddress;

        if (!rawEmail) {
          console.warn(
            '[ManageProjectModal] No customer email on project; cannot link user.'
          );
          return;
        }

        const candidates = Array.from(
          new Set(
            [rawEmail, rawEmail.trim(), rawEmail.trim().toLowerCase()].filter(
              Boolean
            )
          )
        );

        const usersCol = collection(db, 'users');

        for (const email of candidates) {
          console.log(
            '[ManageProjectModal] Trying to link user by email:',
            email
          );
          const q = query(usersCol, where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const uData = { id: docSnap.id, ...docSnap.data() };
            console.log('[ManageProjectModal] Linked user via email:', uData);
            setLinkedUser(uData);
            return;
          }
        }

        console.warn(
          '[ManageProjectModal] No user matched any candidate email for project',
          projectData.id,
          candidates
        );
      } catch (err) {
        console.error(
          '[ManageProjectModal] Failed to look up customer user for impersonation:',
          err
        );
      }
    };

    linkUser();
  }, [projectData]);

  if (!isOpen) return null;

// --------------------------------------------------------------------------
// SAVE → Firestore (single canonical save)  ✅ FIXED: robust project id + logging
// --------------------------------------------------------------------------
const saveToFirestore = async (partialUpdate = {}) => {
  try {
    const projectId =
      projectData?.id ||
      projectData?.projectId ||
      projectData?.docId ||
      projectData?.projectID;

    if (!projectId) {
      console.warn(
        '[ManageProjectModal] saveToFirestore: missing project id',
        { projectData, partialUpdate }
      );
      return;
    }

    // Merge update into current local state so we can derive status safely
    const merged = {
      ...(editableData || {}),
      ...(partialUpdate || {}),
    };

    const nextStatus = determineOverallStatus(merged);
    const nextPhase = determineCurrentPhase(merged);

    const projectRef = doc(db, 'projects', projectId);

    await setDoc(
      projectRef,
      {
        ...partialUpdate,

        // Keep these fields in sync for dashboard + tables
        status: nextStatus,
        currentPhase: nextPhase,

        // Normalize top-level customer fields so tables don’t show N/A
        customerName: deriveCustomerName({
          ...(projectData || {}),
          ...(merged || {}),
        }),
        customerEmail: deriveCustomerEmail({
          ...(projectData || {}),
          ...(merged || {}),
        }),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setStatus(nextStatus);

    onProjectUpdate?.({
      id: projectId,
      ...partialUpdate,
      status: nextStatus,
      currentPhase: nextPhase,
    });

    setShowSnackbar(true);
  } catch (err) {
    console.error('[ManageProjectModal] saveToFirestore failed:', err);
  }
};

  const calculateProjectTotalTime = (data = editableData) => {
    let total = 0;
    STEP_KEYS.forEach((k) => {
      const cl = data?.[k]?.checklist || [];
      cl.forEach((item) => {
        if (Number.isFinite(item.totalSeconds)) total += item.totalSeconds;
      });
    });
    return total;
  };

  // --- STATUS HELPERS (Step / Substep / Checkpoint) ---

  const getStepStatus = (stepKey, data) => {
    const checklist = Array.isArray(data?.[stepKey]?.checklist)
      ? data[stepKey].checklist
      : [];
    if (!checklist.length) return 'todo';

    const allDone = checklist.every((it) => {
      const states = Array.isArray(it?.checkpointStates)
        ? it.checkpointStates
        : [];
      const checkpointsDone = states.length > 0 && states.every(Boolean);
      return !!it.completed || checkpointsDone;
    });

    if (allDone) return 'done';

    // if this step contains the global active pointer, stage = doing
    if (activePtr?.stepKey === stepKey) return 'doing';

    // otherwise not started
    return 'todo';
  };

  const getCheckpointStatus = (
    stepKey,
    subIdx,
    substepItem,
    checkpointIndex
  ) => {
    const states = Array.isArray(substepItem?.checkpointStates)
      ? substepItem.checkpointStates
      : [];

    const isDone = states[checkpointIndex] === true;
    if (isDone) return 'done';

    const isGlobalActive =
      !!activePtr && activePtr.stepKey === stepKey && activePtr.idx === subIdx;

    if (isGlobalActive) {
      const firstIncompleteIdx = states.findIndex((v) => v !== true);
      if (firstIncompleteIdx === checkpointIndex) return 'doing';
    }

    return 'todo';
  };

  const StatusPip = ({ level, status }) => {
    if (status === 'done') {
      // Stage-level: keep the green pill check (your current look)
      if (level === 'step') {
        return (
          <span
            className={[
              'mpm-pip',
              `mpm-pip-${level}`,
              'mpm-pip-done-check',
            ].join(' ')}
            aria-hidden="true"
          >
            ✓
          </span>
        );
      }

      // Step-level: green check ONLY (no background)
      if (level === 'substep') {
        return (
          <span
            className={[
              'mpm-pip',
              `mpm-pip-${level}`,
              'mpm-pip-done-green',
            ].join(' ')}
            aria-hidden="true"
          >
            ✓
          </span>
        );
      }

      // Task-level: small WHITE check ONLY
      if (level === 'task') {
        return (
          <span
            className={[
              'mpm-pip',
              `mpm-pip-${level}`,
              'mpm-pip-done-white',
            ].join(' ')}
            aria-hidden="true"
          >
            ✓
          </span>
        );
      }
    }

    return (
      <span
        className={['mpm-pip', `mpm-pip-${level}`, `mpm-pip-${status}`].join(
          ' '
        )}
        aria-hidden="true"
      />
    );
  };

  /* --------------------------------------------------------------------------
   * 🔵 UPDATED: COMPLETION HELPERS (FIXED ARGUMENTS)
   * ------------------------------------------------------------------------ */

  // Helper: toggle completion on a single checklist item.
  // By default this does NOT touch checkpointStates.
  // We only sync all checkpointStates when explicitly requested (bulk actions).
  const applyCompletionToItem = (
    stepKey,
    itemIndex,
    item,
    complete,
    { touchCheckpoints = false } = {}
  ) => {
    const base = {
      ...item,
      completed: !!complete,
    };

    if (!touchCheckpoints) return base;

    const expectedCount = getCheckpointCountForItem(stepKey, itemIndex, item);
    if (expectedCount <= 0) return base;

    return {
      ...base,
      checkpointStates: new Array(expectedCount).fill(!!complete),
    };
  };

  // Mark all sub-steps in a single stage (e.g. "4. Raw Shell Creation")
  // Also mark all checkpoints/measurement points for those sub-steps.
  const bulkUpdateStepCompletion = (stepKey, complete) => {
    if (!stepKey) return;
    const step = editableData[stepKey];
    if (!step || !Array.isArray(step.checklist)) return;

    const updatedStep = {
      ...step,
      checklist: step.checklist.map((item, idx) =>
        applyCompletionToItem(stepKey, idx, item, complete, {
          touchCheckpoints: true,
        })
      ),
    };

    const update = { [stepKey]: updatedStep };
    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
    saveToFirestore(update);
  };

  // Mark all stages in the project complete / incomplete.
  // Also mark all checkpoints/measurement points across the project.
  const bulkUpdateAllStepsCompletion = (complete) => {
    const update = {};

    STEP_KEYS.forEach((key) => {
      const step = editableData[key];
      if (step && Array.isArray(step.checklist)) {
        update[key] = {
          ...step,
          checklist: step.checklist.map((item, idx) =>
            applyCompletionToItem(key, idx, item, complete, {
              touchCheckpoints: true,
            })
          ),
        };
      }
    });

    if (Object.keys(update).length === 0) return;

    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, ...update });
    saveToFirestore(update);
  };

  /**
   * Persist per-sub-step checkpoint checkbox state.
   * checkpointStates is an array of booleans on the checklist item.
   */
  const handleCheckpointStatesChange = (
    stepKey,
    itemIndex,
    checkpointStates
  ) => {
    const step = editableData[stepKey] || { checklist: [] };
    const item = step.checklist?.[itemIndex];

    const expectedCount = getCheckpointCountForItem(stepKey, itemIndex, item);
    const normalizedStates = normalizeCheckpointBooleans(
      checkpointStates,
      expectedCount
    );

    const allDone =
      normalizedStates.length > 0 && normalizedStates.every(Boolean);

    const updatedChecklist = (step.checklist || []).map((it, idx) => {
      if (idx !== itemIndex) return it;
      return {
        ...it,
        checkpointStates: normalizedStates,
        completed: allDone, // ✅ auto-rollup
      };
    });

    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };

    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
    saveToFirestore(update);
  };

  const handleSubStepCompletionChange = (
    stepKey,
    itemIndex,
    completed,
    seconds
  ) => {
    const step = editableData[stepKey] || { checklist: [] };

    const updatedChecklist = (step.checklist || []).map((item, idx) => {
      if (idx !== itemIndex) return item;

      const expectedCount = getCheckpointCountForItem(stepKey, idx, item);

      const nextSeconds =
        typeof seconds === 'number' && !Number.isNaN(seconds)
          ? seconds
          : Number.isFinite(item.totalSeconds)
            ? item.totalSeconds
            : 0;

      const nextCheckpointStates =
        expectedCount > 0
          ? completed
            ? new Array(expectedCount).fill(true)
            : normalizeCheckpointBooleans(item.checkpointStates, expectedCount)
          : item.checkpointStates;

      return {
        ...item,
        completed: !!completed,
        totalSeconds: nextSeconds,
        checkpointStates: nextCheckpointStates,
      };
    });

    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };

    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
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
    stage.completed = stepList.length > 0 && stepList.every((s) => s.completed);

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
  const parentOrderId =
    projectData?.parentOrderId || projectData?.orderId || '';
  const idText = projectData?.id || '—';
  const weightedProgress = getWeightedProgressPct(editableData);
  const activePtr =
    weightedProgress < 100 ? getGlobalActivePointer(editableData) : null;

  // Resolve current sub-step label for step views
  const selectedStepLabel =
    selectedTab === 'details'
      ? currentPhaseLabel
      : buildPhases.find((p) => p.key === selectedTab)?.label ||
        currentPhaseLabel;

  const currentChecklist =
    selectedStepKey && editableData[selectedStepKey]
      ? editableData[selectedStepKey].checklist || []
      : [];
  const currentSub =
    selectedSubIndex !== null && currentChecklist[selectedSubIndex]
      ? currentChecklist[selectedSubIndex]
      : null;
  const currentSubLabel =
    (currentSub ? getSubstepLabelText(currentSub) : '') || selectedStepLabel;

  // helper: current value for mobile dropdown
  const getMobileSelectValue = () => {
    if (!selectedStepKey || selectedTab === 'details') return 'details';
    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${selectedStepKey}::${idx}`;
  };

   // 🔐 Impersonate linked user (if available) and open their customer project view (SAME TAB)
  const handleViewAsCustomer = () => {
    const projectId = projectData?.id;

    if (!projectId) {
      console.warn(
        '[ManageProjectModal] Missing projectData.id for View as Customer'
      );
      return;
    }

    const uid = linkedUser?.id || linkedUser?.uid || '';
    const name =
      linkedUser?.fullName ||
      (linkedUser?.firstName || linkedUser?.lastName
        ? `${linkedUser?.firstName || ''} ${linkedUser?.lastName || ''}`.trim()
        : '') ||
      '';
    const email = linkedUser?.email || '';

    // Keep current-session impersonation behavior
    if (uid && typeof startImpersonation === 'function') {
      startImpersonation(uid);
    }

    // Build URL params (safe even if legacy page ignores some)
    const params = new URLSearchParams();
    params.set('projectId', projectId);

    if (uid) {
      params.set('impersonateUid', uid);
      if (name) params.set('impersonateName', name);
      if (email) params.set('impersonateEmail', email);
    }

    // ✅ NEW endpoint
    navigate(`/legacy?${params.toString()}`);
  };

  return (
    <div className="manage-project-modal-overlay mpm-overlay" onClick={onClose}>
      <div
        className="manage-project-modal-content mpm-modal mpm-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mpm-header">
          <div className="mpm-header-top">
            <h2 id="admin-project-view-title" className="mpm-title">
              Admin Project View
            </h2>

            <button
              type="button"
              aria-label="Close modal"
              className="mpm-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* ✅ Mobile condensed bar (always visible on mobile) */}
          <div className="mpm-mobile-meta-bar">
            <div className="mpm-mobile-meta-left">
              <span
                className={`mpm-mobile-status ${status.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {status}
              </span>
              <span className="mpm-mobile-progress">{weightedProgress}%</span>
            </div>

            <button
              type="button"
              className="mpm-mobile-meta-toggle"
              onClick={() => setMobileMetaOpen((v) => !v)}
            >
              {mobileMetaOpen ? 'Hide ▲' : 'Details ▼'}
            </button>
          </div>

          <div
            className={`mpm-meta-collapsible mpm-header-chips ${mobileMetaOpen ? 'open' : ''}`}
          >
            <div
              className={`mpm-status-chip ${status.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Build Status: {status}
            </div>

            <div className="mpm-overall-progress-chip">
              Overall Progress: {weightedProgress}%
            </div>

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

            <div className={getStepProgressClass()}>
              Current Step: {currentPhaseLabel}
            </div>

            <div className="mpm-total-time-wrapper">
              <span className="mpm-total-time-label">Total Time Spent:</span>
              <span className="mpm-total-time-value">
                {formatFullTime(calculateProjectTotalTime())}
              </span>
            </div>

            <div className="mpm-bulk-project-actions">
              <button
                type="button"
                className="mpm-bulk-btn"
                onClick={() => {
                  if (
                    window.confirm(
                      'Mark ALL stages and sub-steps in this project as complete?'
                    )
                  ) {
                    bulkUpdateAllStepsCompletion(true);
                  }
                }}
              >
                Mark entire project complete
              </button>

              <button
                type="button"
                className="mpm-bulk-btn mpm-bulk-btn-reset"
                onClick={() => {
                  if (
                    window.confirm(
                      'Reset ALL stages and sub-steps in this project to incomplete?'
                    )
                  ) {
                    bulkUpdateAllStepsCompletion(false);
                  }
                }}
              >
                Reset entire project
              </button>
            </div>
          </div>
        </header>

        {/* Project meta row (identifier, customer, IDs, impersonation link) */}
        <div
          className={`mpm-id-strip mpm-meta-collapsible ${mobileMetaOpen ? 'open' : ''}`}
        >
          {/* Left: drum identifier + customer name/email */}
          <div className="mpm-identifier-top">
            {/* SL-005 · SoundLegend · 14×8" */}
            {getIdentifier(projectData) && (
              <span className="mpm-identifier-chip mpm-identifier-primary">
                <span className="mpm-id-pill">ID</span>
                {getIdentifier(projectData)}
              </span>
            )}

            {/* 👤 Zenon D Lopez · email */}
            {projectData?.customerName && (
              <span className="mpm-identifier-chip">
                👤 {projectData.customerName}
                {projectData?.customerEmail && (
                  <span className="mpm-identifier-email">
                    {'  ·  '}
                    {projectData.customerEmail}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Right: IDs, order link, "View as Customer" */}
          <div className="mpm-id-row" style={{ marginTop: 6 }}>
            <span className="mpm-mono-id">Project ID: {idText}</span>
            <button
              className="mpm-copy-btn"
              onClick={() => navigator.clipboard?.writeText(String(idText))}
            >
              Copy
            </button>

            {parentOrderId && (
              <>
                <span style={{ opacity: 0.6, margin: '0 4px' }}>·</span>
                <span>Parent Order ID:</span>
                <a
                  className="mpm-mono-id"
                  href={`/orders/${parentOrderId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 4 }}
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

            {/* View as Customer: always visible; impersonates when possible */}
            {projectData?.id && (
              <>
                <span style={{ opacity: 0.6, margin: '0 4px' }}>·</span>
                <button
                  type="button"
                  className="mpm-view-as-link"
                  onClick={handleViewAsCustomer}
                >
                  <span className="mpm-view-as-label">View as Customer:</span>{' '}
                  <span className="mpm-view-as-anchor">
                    Open Project View ↗
                  </span>
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

              {(Array.isArray(buildPhases) ? buildPhases : []).map((phase) => {
                const cl = Array.isArray(editableData?.[phase.key]?.checklist)
                  ? editableData[phase.key].checklist
                  : [];

                if (!cl.length) return null;

                return (
                  <optgroup key={phase.key} label={phase.label}>
                    {cl.map((item, idx) => {
                      const label = String(
                        item?.task ?? item?.label ?? ''
                      ).trim();
                      const optionValue = `${phase.key}::${idx}`;
                      const done = !!item?.completed;

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
              {(Array.isArray(buildPhases) ? buildPhases : []).map((step) => {
                const isExpanded = expandedStepKey === step.key;

                const checklist = Array.isArray(
                  editableData?.[step.key]?.checklist
                )
                  ? editableData[step.key].checklist
                  : [];

                // ✅ compute step status here (valid JS, not JSX)
                const stepStatus = (() => {
                  const checklistInner = Array.isArray(
                    editableData?.[step.key]?.checklist
                  )
                    ? editableData[step.key].checklist
                    : [];

                  if (!checklistInner.length) return 'todo';

                  const allDone = checklistInner.every((it) => {
                    const states = Array.isArray(it?.checkpointStates)
                      ? it.checkpointStates
                      : [];
                    const checkpointsDone =
                      states.length > 0 && states.every(Boolean);
                    return !!it?.completed || checkpointsDone;
                  });

                  if (allDone) return 'done';

                  const containsActive =
                    !!activePtr && activePtr.stepKey === step.key;

                  return containsActive ? 'doing' : 'todo';
                })();

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
                      type="button"
                    >
                      <StatusPip level="step" status={stepStatus} />
                      <span className="mpm-sidebar-step-text">
                        {step.label}
                      </span>
                    </button>

                    {isExpanded && checklist.length > 0 && (
                      <div className="mpm-sidebar-substep-list">
                        {(Array.isArray(checklist) ? checklist : []).map(
                          (item, idx) => {
                            const label = item?.task ?? item?.label ?? '';
                            const isActiveSub =
                              selectedStepKey === step.key &&
                              selectedSubIndex === idx;

                            // ✅ compute substep status here (valid JS)
                            const states = Array.isArray(item?.checkpointStates)
                              ? item.checkpointStates
                              : [];
                            const checkpointsDone =
                              states.length > 0 && states.every(Boolean);
                            const isDone = !!item?.completed || checkpointsDone;

                            const isGlobalActive =
                              !!activePtr &&
                              activePtr.stepKey === step.key &&
                              activePtr.idx === idx;

                            // ✅ RULE: 1 active "doing" item if project < 100%
                            const subStatus = isDone
                              ? 'done'
                              : isGlobalActive
                                ? 'doing'
                                : 'todo';

                            return (
                              <div key={item?.id || idx}>
                                <button
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
                                  <StatusPip
                                    level="substep"
                                    status={subStatus}
                                  />
                                  <span className="mpm-sidebar-substep-text">
                                    {label}
                                  </span>
                                </button>

                                {/* ✅ Checkpoint task list (only under active substep) */}
                                {isActiveSub &&
                                  (() => {
                                    const checkpointLabels =
                                      getCheckpointListForSubstep(
                                        step.key,
                                        idx,
                                        item
                                      );

                                    const cpStates = Array.isArray(
                                      item?.checkpointStates
                                    )
                                      ? item.checkpointStates
                                      : [];

                                    if (!checkpointLabels?.length) return null;

                                    return (
                                      <div className="mpm-sidebar-task-list">
                                        {checkpointLabels.map(
                                          (taskLabel, cIdx) => {
                                            const taskStatus =
                                              getCheckpointStatus(
                                                step.key,
                                                idx,
                                                item,
                                                cIdx
                                              );

                                            return (
                                              <div
                                                key={`${item?.id || idx}-cp-${cIdx}`}
                                                className="mpm-sidebar-task-row"
                                              >
                                                <StatusPip
                                                  level="task"
                                                  status={taskStatus}
                                                />
                                                <span className="mpm-sidebar-task-text">
                                                  {shortenCheckpointLabel(
                                                    getCheckpointLabelText(
                                                      taskLabel
                                                    )
                                                  )}
                                                </span>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    );
                                  })()}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="mpm-main">
            {selectedTab === 'details' ? (
              <div className="mpm-surface mpm-overview-scope">
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
                    saveToFirestore({
                      projectOverview: editableData.projectOverview || {},
                    });
                    setIsEditing(false);
                    setShowSnackbar(true);
                  }}
                  onCancel={() => {
                    setEditableData(originalData);
                    setIsEditing(false);
                  }}
                />

                {/* Lifecycle Stage → Step → Checkpoint view */}
                <LifecyclePanel
                  lifecycle={editableData.lifecycle}
                  onToggleCheckpoint={handleLifecycleCheckpointToggle}
                />
              </div>
            ) : (
              <>
                {/* 🔵 Stage-level bulk actions */}
                <div className="mpm-bulk-step-actions">
                  <span className="mpm-bulk-step-label">
                    Bulk actions for this stage:
                  </span>

                  <button
                    type="button"
                    className="mpm-bulk-btn"
                    disabled={!selectedStepKey}
                    onClick={() => {
                      if (!selectedStepKey) return;
                      const count =
                        editableData[selectedStepKey]?.checklist?.length || 0;

                      if (
                        window.confirm(
                          `Mark all ${count} sub-steps in this stage as complete?`
                        )
                      ) {
                        bulkUpdateStepCompletion(selectedStepKey, true);
                      }
                    }}
                  >
                    Mark stage complete
                  </button>

                  <button
                    type="button"
                    className="mpm-bulk-btn mpm-bulk-btn-reset"
                    disabled={!selectedStepKey}
                    onClick={() => {
                      if (!selectedStepKey) return;
                      const count =
                        editableData[selectedStepKey]?.checklist?.length || 0;

                      if (
                        window.confirm(
                          `Reset all ${count} sub-steps in this stage to incomplete? Time tracking will be preserved.`
                        )
                      ) {
                        bulkUpdateStepCompletion(selectedStepKey, false);
                      }
                    }}
                  >
                    Reset stage
                  </button>
                </div>

                {/* 🔥 READABILITY SURFACE */}
                <div className="mpm-surface mpm-step-scope">
                  <StepComponentTemplate
                    stepKey={selectedStepKey}
                    stepLabel={currentSubLabel}
                    stepData={
                      editableData[selectedStepKey] || { checklist: [] }
                    }
                    onToggleChecklist={(index, completed, seconds) => {
                      const safeSeconds = Number.isFinite(seconds)
                        ? seconds
                        : undefined;

                      handleSubStepCompletionChange(
                        selectedStepKey,
                        index,
                        completed,
                        safeSeconds
                      );
                    }}
                    onUpdateCheckpointStates={(itemIndex, states) =>
                      handleCheckpointStatesChange(
                        selectedStepKey,
                        itemIndex,
                        states
                      )
                    }
                    isLocked={false}
                    showCheckbox={true}
                    activeIndex={selectedSubIndex}
                  />
                </div>
              </>
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
