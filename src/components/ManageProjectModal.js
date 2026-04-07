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

import {
  createEmptyStoryEngineRecord,
  SOURCE_TYPE,
} from '../utils/storyEngineSchema';

import {
  createSourceEntry,
  registerSource,
  applyObservedFields,
  createAdminFieldMapFromConsultation,
  createAdminFieldMapFromQuestionnaire,
  runStoryEngine,
} from '../utils/storyEngineHelpers';

import { runStoryDraftPipeline } from '../utils/storyEngineDrafting';

import {
  STORY_ENGINE_FIELD_CONFIG,
  STORY_ENGINE_BUILD_SPEC_FIELDS,
} from '../utils/storyEngineFieldConfig';

import {
  getMappedFieldSuggestion,
  getBuildSpecSuggestion,
  formatSuggestionConfidence,
} from '../utils/storyEngineSuggestionHelpers';

import './ManageProjectModal.css';

/* ----------------------------------------------------------------------------
 * CORE STEP KEYS
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
 * STEP META
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

const val = (...c) =>
  c.find((v) => v !== undefined && v !== null && v !== '') ?? undefined;

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
      p.lineSerial,
      p.serial,
      p.serialNumber,
      p.projectSerial,
      p.snareSerial,
      p.serialId
    ) || '';

  const line =
    val(p.artisanLine, p.series, p.productLine, p.seriesLine, p.line) || '';

  const dia = val(p.width, p.diameter);
  const dep = val(p.shellDepth, p.depth);
  const size = dia && dep ? ` · ${dia}×${dep}"` : '';

  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial) return `${serial}${size}`;
  if (line) return `${line}${size}`;
  return size ? size.slice(3) : '—';
};

const buildPhases = STEP_KEYS.map((key) => ({
  key,
  label: STEP_META[key]?.label || key,
  phaseId: STEP_META[key]?.phaseId || null,
}));

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

const getCheckpointCountForItem = (stepKey, itemIndex, item = {}) => {
  return getCheckpointListForSubstep(stepKey, itemIndex, item).length;
};

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
  return str.length > 44 ? `${str.slice(0, 44).trim()}…` : str;
};

const getCheckpointLabelText = (cp) => {
  if (!cp) return '';
  if (typeof cp === 'string') return cp.trim();

  if (typeof cp === 'object') {
    const short = typeof cp.short === 'string' ? cp.short.trim() : '';
    if (short) return short;

    const book = typeof cp.book === 'string' ? cp.book.trim() : '';
    if (book) return book;

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

const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate();
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

const scheduleStatus = ({
  startDate,
  targetDate,
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

  const delta = progressPct - expectedPct;
  if (progressPct >= 100) return { label: 'Finished', code: 'finished' };
  if (delta >= 10) return { label: 'Ahead', code: 'ahead' };
  if (delta >= -10) return { label: 'On Pace', code: 'onpace' };
  if (delta >= -25) return { label: 'Slightly Behind', code: 'slightly' };
  return { label: 'At Risk', code: 'risk' };
};

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

    if (!current) {
      fixed[stepKey] = deepClone(defStep);
      return;
    }

    const currentChecklist = Array.isArray(current.checklist)
      ? current.checklist
      : [];

    const defChecklist = defStep.checklist || [];

    const currentById = new Map();
    currentChecklist.forEach((item) => {
      if (item?.id) currentById.set(item.id, item);
    });

    const mergedChecklist = defChecklist.map((defItem, idx) => {
      const existing = currentById.get(defItem.id);
      const expectedCount = getCheckpointCountForItem(stepKey, idx, defItem);

      return {
        id: defItem.id,
        task: defItem.task,
        label: defItem.label ?? defItem.task,
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
      checklist: mergedChecklist,
    };
  });

  return fixed;
};

const LifecyclePanel = () => {
  return null;
};

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
        return { stepKey, idx };
      }
    }
  }

  return null;
}

const StatusPip = ({ level, status }) => {
  if (status === 'done') {
    if (level === 'step') {
      return (
        <span
          className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-check'].join(
            ' '
          )}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    }

    if (level === 'substep') {
      return (
        <span
          className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-green'].join(
            ' '
          )}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    }

    if (level === 'task') {
      return (
        <span
          className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-white'].join(
            ' '
          )}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    }
  }

  return (
    <span
      className={['mpm-pip', `mpm-pip-${level}`, `mpm-pip-${status}`].join(' ')}
      aria-hidden="true"
    />
  );
};

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  const [selectedTab, setSelectedTab] = useState('details');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [mobileMetaOpen, setMobileMetaOpen] = useState(false);

  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const [linkedUser, setLinkedUser] = useState(null);

  const [storyEngineData, setStoryEngineData] = useState({
    consultationTranscript: '',
    consultationSummary: '',
    adminNotes: '',
    questionnaireRaw: '',
    questionnaireMapped: {
      artistName: '',
      styleOfPlaying: '',
      desiredOutcome: '',
      genreContext: '',
      recordingUse: '',
      liveUse: '',
      influenceReferences: '',
      hardwareFinish: '',
      woodPreference: '',
      finishDirection: '',
    },
    consultationMapped: {
      artistName: '',
      projectName: '',
      primaryUseCase: '',
      styleOfPlaying: '',
      diameter: '',
      depth: '',
      genreContext: '',
      desiredOutcome: '',
      currentPainPoints: '',
      influenceReferences: '',
      visualMood: '',
      finishDirection: '',
      woodPreference: '',
      attack: '',
      body: '',
      sensitivity: '',
      sustain: '',
      projection: '',
      tuningRange: '',
      articulation: '',
      feel: '',
    },
    engineRecord: createEmptyStoryEngineRecord(),
    draftPreview: null,
  });

  const [storyEngineRunning, setStoryEngineRunning] = useState(false);

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
      if (anyTouched) lastTouchedLabel = label;
    }

    if (lastTouchedLabel) return lastTouchedLabel;

    const first = buildPhases[0];
    return (
      (first && (STEP_META[first.key]?.label || first.label || first.key)) ||
      'Unknown'
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const mq = window.matchMedia('(max-width: 920px)');
    const apply = () => setMobileMetaOpen(false);

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

  useEffect(() => {
    if (!projectData) return;

    setEditableData((prev) => {
      const merged = { ...(prev || {}), ...(projectData || {}) };
      return ensureChecklistStructure(merged);
    });

    setOriginalData((prev) => {
      const merged = { ...(prev || {}), ...(projectData || {}) };
      return ensureChecklistStructure(merged);
    });

    const mergedForStatus = ensureChecklistStructure({
      ...(editableData || {}),
      ...(projectData || {}),
    });
    setStatus(determineOverallStatus(mergedForStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectData]);

  useEffect(() => {
    if (!projectData) return;

    const se = projectData.storyEngine || {};

    setStoryEngineData({
      consultationTranscript: se?.sources?.consultationTranscript || '',
      consultationSummary: se?.sources?.consultationSummary || '',
      adminNotes: se?.sources?.adminNotes || '',
      questionnaireRaw:
        typeof se?.sources?.questionnaireRaw === 'string'
          ? se.sources.questionnaireRaw
          : se?.sources?.questionnaireRaw
            ? JSON.stringify(se.sources.questionnaireRaw, null, 2)
            : '',
      questionnaireMapped: {
        artistName: se?.sources?.questionnaireMapped?.artistName || '',
        styleOfPlaying: se?.sources?.questionnaireMapped?.styleOfPlaying || '',
        desiredOutcome: se?.sources?.questionnaireMapped?.desiredOutcome || '',
        genreContext: se?.sources?.questionnaireMapped?.genreContext || '',
        recordingUse: se?.sources?.questionnaireMapped?.recordingUse || '',
        liveUse: se?.sources?.questionnaireMapped?.liveUse || '',
        influenceReferences:
          se?.sources?.questionnaireMapped?.influenceReferences || '',
        hardwareFinish: se?.sources?.questionnaireMapped?.hardwareFinish || '',
        woodPreference: se?.sources?.questionnaireMapped?.woodPreference || '',
        finishDirection:
          se?.sources?.questionnaireMapped?.finishDirection || '',
      },
      consultationMapped: {
        artistName:
          se?.sources?.consultationMapped?.artistName ||
          projectData?.customerName ||
          '',
        projectName:
          se?.sources?.consultationMapped?.projectName ||
          projectData?.lineSerial ||
          projectData?.id ||
          '',
        primaryUseCase: se?.sources?.consultationMapped?.primaryUseCase || '',
        styleOfPlaying: se?.sources?.consultationMapped?.styleOfPlaying || '',
        diameter:
          se?.sources?.consultationMapped?.diameter ||
          projectData?.width ||
          projectData?.diameter ||
          '',
        depth:
          se?.sources?.consultationMapped?.depth ||
          projectData?.shellDepth ||
          projectData?.depth ||
          '',
        genreContext: se?.sources?.consultationMapped?.genreContext || '',
        desiredOutcome: se?.sources?.consultationMapped?.desiredOutcome || '',
        currentPainPoints:
          se?.sources?.consultationMapped?.currentPainPoints || '',
        influenceReferences:
          se?.sources?.consultationMapped?.influenceReferences || '',
        visualMood: se?.sources?.consultationMapped?.visualMood || '',
        finishDirection: se?.sources?.consultationMapped?.finishDirection || '',
        woodPreference: se?.sources?.consultationMapped?.woodPreference || '',
        attack: se?.sources?.consultationMapped?.attack || '',
        body: se?.sources?.consultationMapped?.body || '',
        sensitivity: se?.sources?.consultationMapped?.sensitivity || '',
        sustain: se?.sources?.consultationMapped?.sustain || '',
        projection: se?.sources?.consultationMapped?.projection || '',
        tuningRange: se?.sources?.consultationMapped?.tuningRange || '',
        articulation: se?.sources?.consultationMapped?.articulation || '',
        feel: se?.sources?.consultationMapped?.feel || '',
      },
      engineRecord: se?.record || createEmptyStoryEngineRecord(),
      draftPreview: se?.draftPreview || null,
    });
  }, [projectData]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTab('details');
    setSelectedStepKey(null);
    setSelectedSubIndex(0);
    setExpandedStepKey(buildPhases[0]?.key || null);
    setIsEditing(false);
  }, [isOpen]);

  useEffect(() => {
    const linkUser = async () => {
      setLinkedUser(null);
      if (!projectData) return;

      try {
        const directUserId =
          projectData.customerUserId ||
          projectData.userId ||
          projectData.ownerUserId;

        if (directUserId) {
          const uRef = doc(db, 'users', directUserId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            setLinkedUser({ id: uSnap.id, ...uSnap.data() });
            return;
          }
        }

        const rawEmail =
          projectData.customerEmail ||
          projectData.email ||
          projectData.customerEmailAddress;

        if (!rawEmail) return;

        const candidates = Array.from(
          new Set(
            [rawEmail, rawEmail.trim(), rawEmail.trim().toLowerCase()].filter(
              Boolean
            )
          )
        );

        const usersCol = collection(db, 'users');

        for (const email of candidates) {
          const q = query(usersCol, where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            setLinkedUser({ id: docSnap.id, ...docSnap.data() });
            return;
          }
        }
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
          {
            projectData,
            partialUpdate,
          }
        );
        return;
      }

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
          status: nextStatus,
          currentPhase: nextPhase,
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

  const weightedProgress = getWeightedProgressPct(editableData);
  const activePtr =
    weightedProgress < 100 ? getGlobalActivePointer(editableData) : null;

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
        completed: allDone,
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

    const checkpointList = Object.values(checkpoints);
    step.checkpoints = checkpoints;
    step.completed =
      checkpointList.length > 0 && checkpointList.every((c) => c.completed);

    steps[stepId] = step;

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

  const selectedStepLabel =
    selectedTab === 'details' || selectedTab === 'storyEngine'
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

  const getMobileSelectValue = () => {
    if (selectedTab === 'details') return 'details';
    if (selectedTab === 'storyEngine') return 'storyEngine';
    if (!selectedStepKey) return 'details';
    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${selectedStepKey}::${idx}`;
  };

  const handleViewAsCustomer = () => {
    const projectId = projectData?.id;
    if (!projectId) return;

    const uid = linkedUser?.id || linkedUser?.uid || '';
    const name =
      linkedUser?.fullName ||
      (linkedUser?.firstName || linkedUser?.lastName
        ? `${linkedUser?.firstName || ''} ${linkedUser?.lastName || ''}`.trim()
        : '') ||
      '';
    const email = linkedUser?.email || '';

    if (uid && typeof startImpersonation === 'function') {
      startImpersonation(uid);
    }

    const params = new URLSearchParams();
    params.set('projectId', projectId);

    if (uid) {
      params.set('impersonateUid', uid);
      if (name) params.set('impersonateName', name);
      if (email) params.set('impersonateEmail', email);
    }

    navigate(`/legacy?${params.toString()}`);
  };

  const updateStoryEngineField = (section, key, value) => {
    setStoryEngineData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === 'object' && prev[section] !== null
          ? {
              ...prev[section],
              [key]: value,
            }
          : value,
    }));
  };

  const updateBuildSpecField = (fieldKey, value, meta = {}) => {
    setStoryEngineData((prev) => ({
      ...prev,
      engineRecord: {
        ...prev.engineRecord,
        buildSpec: {
          ...prev.engineRecord.buildSpec,
          [fieldKey]: {
            ...prev.engineRecord.buildSpec[fieldKey],
            value,
            status: meta.status || 'observed',
            lastUpdatedBy: meta.lastUpdatedBy || 'admin',
            manualLock:
              typeof meta.manualLock === 'boolean' ? meta.manualLock : true,
            confidence:
              typeof meta.confidence === 'number'
                ? meta.confidence
                : prev.engineRecord.buildSpec[fieldKey]?.confidence || 0,
            rationale:
              meta.rationale ||
              prev.engineRecord.buildSpec[fieldKey]?.rationale ||
              [],
          },
        },
      },
    }));
  };

  const saveStoryEngineToProject = async (payloadOverride = null) => {
    const payload = payloadOverride || {
      sources: {
        consultationTranscript: storyEngineData.consultationTranscript,
        consultationSummary: storyEngineData.consultationSummary,
        adminNotes: storyEngineData.adminNotes,
        questionnaireRaw: storyEngineData.questionnaireRaw,
        questionnaireMapped: storyEngineData.questionnaireMapped,
        consultationMapped: storyEngineData.consultationMapped,
      },
      record: storyEngineData.engineRecord,
      draftPreview: storyEngineData.draftPreview,
      lastUpdatedAt: new Date().toISOString(),
    };

    await saveToFirestore({
      storyEngine: payload,
    });
  };

  const handleRunStoryEngine = async () => {
    try {
      setStoryEngineRunning(true);

      let record = createEmptyStoryEngineRecord();
      record.projectId = projectData?.id || null;

      const consultationSource = createSourceEntry({
        type: SOURCE_TYPE.CONSULTATION,
        label: 'Consultation Transcript',
        content: storyEngineData.consultationTranscript || '',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      const questionnaireSource = createSourceEntry({
        type: SOURCE_TYPE.QUESTIONNAIRE,
        label: 'Questionnaire Intake',
        content: storyEngineData.questionnaireRaw || '',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      const adminNotesSource = createSourceEntry({
        type: SOURCE_TYPE.ADMIN_NOTE,
        label: 'Admin Notes',
        content: [
          storyEngineData.consultationSummary,
          storyEngineData.adminNotes,
        ]
          .filter(Boolean)
          .join('\n\n'),
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      record = registerSource(record, consultationSource);
      record = registerSource(record, questionnaireSource);
      record = registerSource(record, adminNotesSource);

      const consultationFieldMap = createAdminFieldMapFromConsultation(
        storyEngineData.consultationMapped
      );

      const questionnaireFieldMap = createAdminFieldMapFromQuestionnaire(
        storyEngineData.questionnaireMapped
      );

      record = applyObservedFields(
        record,
        consultationFieldMap,
        consultationSource
      );

      record = applyObservedFields(
        record,
        questionnaireFieldMap,
        questionnaireSource
      );

      const buildSpecKeys = Object.keys(
        storyEngineData.engineRecord?.buildSpec || {}
      );
      buildSpecKeys.forEach((fieldKey) => {
        const node = storyEngineData.engineRecord?.buildSpec?.[fieldKey];
        if (
          node?.value !== undefined &&
          node?.value !== null &&
          String(node.value).trim() !== ''
        ) {
          record.buildSpec[fieldKey] = {
            ...record.buildSpec[fieldKey],
            ...node,
          };
        }
      });

      record = runStoryEngine(record);
      record = runStoryDraftPipeline(record);

      const draftPreview = {
        discoveryDesign: record?.chapters?.discoveryDesign?.drafts || {},
        commitmentPortal: record?.chapters?.commitmentPortal?.drafts || {},
        woodVisionLockIn: record?.chapters?.woodVisionLockIn?.drafts || {},
        rawShellCreation: record?.chapters?.rawShellCreation?.drafts || {},
        shellTrueingTorchTune:
          record?.chapters?.shellTrueingTorchTune?.drafts || {},
        exteriorArtFinish: record?.chapters?.exteriorArtFinish?.drafts || {},
        edgesSnareBeds: record?.chapters?.edgesSnareBeds?.drafts || {},
        hardwareAssembly: record?.chapters?.hardwareAssembly?.drafts || {},
        legacyTuningMedia: record?.chapters?.legacyTuningMedia?.drafts || {},
        finalQAPackagingDelivery:
          record?.chapters?.finalQAPackagingDelivery?.drafts || {},
      };

      const nextState = {
        ...storyEngineData,
        engineRecord: record,
        draftPreview,
      };

      setStoryEngineData(nextState);

      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: nextState.consultationTranscript,
          consultationSummary: nextState.consultationSummary,
          adminNotes: nextState.adminNotes,
          questionnaireRaw: nextState.questionnaireRaw,
          questionnaireMapped: nextState.questionnaireMapped,
          consultationMapped: nextState.consultationMapped,
        },
        record,
        draftPreview,
        lastRunAt: new Date().toISOString(),
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error('Story engine run failed:', err);
    } finally {
      setStoryEngineRunning(false);
    }
  };

  const renderSuggestionCard = ({
    suggestedValue,
    confidence,
    rationale,
    onUseSuggestion,
  }) => {
    if (!suggestedValue) return null;

    return (
      <div className="mpm-story-suggestion-card">
        <div className="mpm-story-suggestion-top">
          <div className="mpm-story-suggestion-label">Suggested Direction</div>
          <div className="mpm-story-suggestion-confidence">
            {formatSuggestionConfidence(confidence)}
          </div>
        </div>

        <div className="mpm-story-suggestion-value">{suggestedValue}</div>

        {!!rationale?.length && (
          <ul className="mpm-story-suggestion-rationale">
            {rationale.map((item, idx) => (
              <li key={`${item}-${idx}`}>{item}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="mpm-bulk-btn"
          onClick={onUseSuggestion}
        >
          Use Suggestion
        </button>
      </div>
    );
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

        <div
          className={`mpm-id-strip mpm-meta-collapsible ${mobileMetaOpen ? 'open' : ''}`}
        >
          <div className="mpm-identifier-top">
            {getIdentifier(projectData) && (
              <span className="mpm-identifier-chip mpm-identifier-primary">
                <span className="mpm-id-pill">ID</span>
                {getIdentifier(projectData)}
              </span>
            )}

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
          <div className="mpm-mobile-phase-selector-wrapper">
            <select
              className="mpm-phase-selector-dropdown"
              value={getMobileSelectValue()}
              onChange={(e) => {
                const val = e.target.value;

                if (val === 'details' || val === 'storyEngine') {
                  setSelectedTab(val);
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
              <option value="storyEngine">✍️ Story Engine</option>

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

            <button
              className={`mpm-sidebar-overview-btn ${
                selectedTab === 'storyEngine' ? 'active' : ''
              }`}
              onClick={() => {
                setSelectedTab('storyEngine');
                setSelectedStepKey(null);
                setSelectedSubIndex(0);
              }}
            >
              ✍️ Story Engine
            </button>

            <div className="mpm-sidebar-step-list">
              {(Array.isArray(buildPhases) ? buildPhases : []).map((step) => {
                const isExpanded = expandedStepKey === step.key;

                const checklist = Array.isArray(
                  editableData?.[step.key]?.checklist
                )
                  ? editableData[step.key].checklist
                  : [];

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

                                {isActiveSub &&
                                  (() => {
                                    const checkpointLabels =
                                      getCheckpointListForSubstep(
                                        step.key,
                                        idx,
                                        item
                                      );

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

                      for (let i = 0; i < keys.length - 1; i += 1) {
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

                <LifecyclePanel
                  lifecycle={editableData.lifecycle}
                  onToggleCheckpoint={handleLifecycleCheckpointToggle}
                />
              </div>
            ) : selectedTab === 'storyEngine' ? (
              <div className="mpm-surface mpm-overview-scope">
                <div className="mpm-story-layout">
                  <section className="mpm-story-panel mpm-story-panel-wide">
                    <div className="mpm-story-panel-header">
                      <h3>Story Engine Sources</h3>
                      <p>
                        Store the full discovery inputs for this build, then run
                        the engine to generate chapter-specific story and build
                        direction.
                      </p>
                    </div>

                    <div className="mpm-story-form-grid">
                      <label className="mpm-story-field mpm-story-field-full">
                        <span className="mpm-story-field-label">
                          Full Consultation Transcript
                        </span>
                        <textarea
                          value={storyEngineData.consultationTranscript}
                          onChange={(e) =>
                            setStoryEngineData((prev) => ({
                              ...prev,
                              consultationTranscript: e.target.value,
                            }))
                          }
                          rows={8}
                        />
                      </label>

                      <label className="mpm-story-field">
                        <span className="mpm-story-field-label">
                          Consultation Summary
                        </span>
                        <textarea
                          value={storyEngineData.consultationSummary}
                          onChange={(e) =>
                            setStoryEngineData((prev) => ({
                              ...prev,
                              consultationSummary: e.target.value,
                            }))
                          }
                          rows={5}
                        />
                      </label>

                      <label className="mpm-story-field">
                        <span className="mpm-story-field-label">
                          Admin Notes
                        </span>
                        <textarea
                          value={storyEngineData.adminNotes}
                          onChange={(e) =>
                            setStoryEngineData((prev) => ({
                              ...prev,
                              adminNotes: e.target.value,
                            }))
                          }
                          rows={5}
                        />
                      </label>

                      <label className="mpm-story-field mpm-story-field-full">
                        <span className="mpm-story-field-label">
                          Questionnaire Raw
                        </span>
                        <textarea
                          value={storyEngineData.questionnaireRaw}
                          onChange={(e) =>
                            setStoryEngineData((prev) => ({
                              ...prev,
                              questionnaireRaw: e.target.value,
                            }))
                          }
                          rows={7}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="mpm-story-panel">
                    <div className="mpm-story-panel-header">
                      <h3>Mapped Consultation Fields</h3>
                      <p>
                        These are the grounded artist/build inputs that drive
                        the engine.
                      </p>
                    </div>

                    <div className="mpm-story-form-grid">
                      {STORY_ENGINE_FIELD_CONFIG.consultationMapped.map(
                        (field) => {
                          const suggestion = getMappedFieldSuggestion({
                            engineRecord: storyEngineData.engineRecord,
                            sectionKey: 'consultationMapped',
                            fieldKey: field.key,
                            recommendationKey: field.recommendationKey,
                          });

                          return (
                            <div
                              key={field.key}
                              className="mpm-story-field-wrap"
                            >
                              <label className="mpm-story-field">
                                <span className="mpm-story-field-label">
                                  {field.label}
                                </span>
                                <input
                                  type="text"
                                  value={
                                    storyEngineData.consultationMapped[
                                      field.key
                                    ] || ''
                                  }
                                  onChange={(e) =>
                                    updateStoryEngineField(
                                      'consultationMapped',
                                      field.key,
                                      e.target.value
                                    )
                                  }
                                />
                              </label>

                              {renderSuggestionCard({
                                ...suggestion,
                                onUseSuggestion: () =>
                                  updateStoryEngineField(
                                    'consultationMapped',
                                    field.key,
                                    suggestion.suggestedValue
                                  ),
                              })}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>

                  <section className="mpm-story-panel">
                    <div className="mpm-story-panel-header">
                      <h3>Mapped Questionnaire Fields</h3>
                      <p>
                        Use questionnaire data to reinforce the artist profile.
                      </p>
                    </div>

                    <div className="mpm-story-form-grid">
                      {STORY_ENGINE_FIELD_CONFIG.questionnaireMapped.map(
                        (field) => {
                          const suggestion = getMappedFieldSuggestion({
                            engineRecord: storyEngineData.engineRecord,
                            sectionKey: 'questionnaireMapped',
                            fieldKey: field.key,
                            recommendationKey: field.recommendationKey,
                          });

                          return (
                            <div
                              key={field.key}
                              className="mpm-story-field-wrap"
                            >
                              <label className="mpm-story-field">
                                <span className="mpm-story-field-label">
                                  {field.label}
                                </span>
                                <input
                                  type="text"
                                  value={
                                    storyEngineData.questionnaireMapped[
                                      field.key
                                    ] || ''
                                  }
                                  onChange={(e) =>
                                    updateStoryEngineField(
                                      'questionnaireMapped',
                                      field.key,
                                      e.target.value
                                    )
                                  }
                                />
                              </label>

                              {renderSuggestionCard({
                                ...suggestion,
                                onUseSuggestion: () =>
                                  updateStoryEngineField(
                                    'questionnaireMapped',
                                    field.key,
                                    suggestion.suggestedValue
                                  ),
                              })}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>

                  <section className="mpm-story-panel">
                    <div className="mpm-story-panel-header">
                      <h3>Suggested Build Directions</h3>
                      <p>
                        Lock in build decisions manually, or accept intelligent
                        recommendations.
                      </p>
                    </div>

                    <div className="mpm-story-form-grid">
                      {STORY_ENGINE_BUILD_SPEC_FIELDS.map((field) => {
                        const suggestion = getBuildSpecSuggestion(
                          storyEngineData.engineRecord,
                          field.recommendationKey
                        );

                        const currentValue =
                          storyEngineData.engineRecord?.buildSpec?.[field.key]
                            ?.value || '';

                        return (
                          <div key={field.key} className="mpm-story-field-wrap">
                            <label className="mpm-story-field">
                              <span className="mpm-story-field-label">
                                {field.label}
                              </span>

                              {field.inputType === 'select' ? (
                                <select
                                  value={currentValue}
                                  onChange={(e) =>
                                    updateBuildSpecField(
                                      field.key,
                                      e.target.value,
                                      {
                                        status: 'observed',
                                        lastUpdatedBy: 'admin',
                                        manualLock: true,
                                      }
                                    )
                                  }
                                >
                                  <option value="">Select...</option>
                                  {field.options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) =>
                                    updateBuildSpecField(
                                      field.key,
                                      e.target.value,
                                      {
                                        status: 'observed',
                                        lastUpdatedBy: 'admin',
                                        manualLock: true,
                                      }
                                    )
                                  }
                                />
                              )}
                            </label>

                            {renderSuggestionCard({
                              ...suggestion,
                              onUseSuggestion: () =>
                                updateBuildSpecField(
                                  field.key,
                                  suggestion.suggestedValue,
                                  {
                                    status: 'recommended',
                                    confidence: suggestion.confidence,
                                    rationale: suggestion.rationale,
                                    lastUpdatedBy: 'story_engine',
                                    manualLock: true,
                                  }
                                ),
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="mpm-story-toolbar">
                    <button
                      type="button"
                      className="mpm-bulk-btn"
                      onClick={() => saveStoryEngineToProject()}
                    >
                      Save Story Inputs
                    </button>

                    <button
                      type="button"
                      className="mpm-bulk-btn"
                      onClick={handleRunStoryEngine}
                      disabled={storyEngineRunning}
                    >
                      {storyEngineRunning ? 'Running...' : 'Run Story Engine'}
                    </button>
                  </section>

                  {!!storyEngineData?.engineRecord?.engineMeta && (
                    <section className="mpm-story-panel">
                      <div className="mpm-story-panel-header">
                        <h3>Engine Status</h3>
                      </div>

                      <div className="mpm-story-status-grid">
                        <div className="mpm-story-status-card">
                          <span className="mpm-story-status-kicker">
                            Draft readiness
                          </span>
                          <strong>
                            {
                              storyEngineData.engineRecord.engineMeta
                                .draftReadiness
                            }
                          </strong>
                        </div>

                        <div className="mpm-story-status-card">
                          <span className="mpm-story-status-kicker">
                            Overall confidence
                          </span>
                          <strong>
                            {Math.round(
                              (storyEngineData.engineRecord.engineMeta
                                .overallConfidence || 0) * 100
                            )}
                            %
                          </strong>
                        </div>
                      </div>

                      {!!storyEngineData.engineRecord.engineMeta.adminPrompts
                        ?.length && (
                        <div className="mpm-story-review-list">
                          <div className="mpm-story-review-title">
                            Unresolved Prompts
                          </div>
                          <ul>
                            {storyEngineData.engineRecord.engineMeta.adminPrompts.map(
                              (item, idx) => (
                                <li key={`${item.fieldKey}-${idx}`}>
                                  <strong>{item.fieldKey}</strong>:{' '}
                                  {item.reason} — {item.suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}

                  {!!storyEngineData?.engineRecord?.chapters && (
                    <section className="mpm-story-panel mpm-story-panel-wide">
                      <div className="mpm-story-panel-header">
                        <h3>Chapter Draft Preview</h3>
                        <p>
                          Review the current chapter output before using it
                          downstream.
                        </p>
                      </div>

                      <div className="mpm-story-preview-list">
                        {Object.entries(
                          storyEngineData.engineRecord.chapters
                        ).map(([chapterKey, chapterValue]) => (
                          <article
                            key={chapterKey}
                            className="mpm-story-preview-card"
                          >
                            <div className="mpm-story-preview-head">
                              <h4>{chapterKey}</h4>
                              <div className="mpm-story-preview-meta">
                                <span>
                                  Confidence:{' '}
                                  {Math.round(
                                    (chapterValue?.confidenceScore || 0) * 100
                                  )}
                                  %
                                </span>
                                <span>
                                  Flags:{' '}
                                  {(chapterValue?.flags || []).join(', ') ||
                                    '—'}
                                </span>
                              </div>
                            </div>

                            <div className="mpm-story-preview-block">
                              <div className="mpm-story-preview-label">
                                Chapter Overview
                              </div>
                              <div className="mpm-story-preview-text">
                                {chapterValue?.storySections?.chapterOverview
                                  ?.text || '—'}
                              </div>
                            </div>

                            <div className="mpm-story-preview-block">
                              <div className="mpm-story-preview-label">
                                Build Notes Story
                              </div>
                              <div className="mpm-story-preview-text">
                                {chapterValue?.storySections?.buildNotesStory
                                  ?.text || '—'}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <>
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
