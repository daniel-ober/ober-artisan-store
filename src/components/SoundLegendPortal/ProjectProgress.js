// src/components/SoundLegendPortal/ProjectProgress.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  getDownloadURL,
  listAll,
} from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import {
  STAGES,
  STAGE_DEFS,
  STAGE_TEMPLATES,
  resolveStageKey,
} from '../../utils/workflowDefinitions';
import { PROJECT_STAGE_EDU } from '../../utils/projectStageEducation';
import './ProjectProgress.css';

const FALLBACK_VIDEO = '/craft_in_motion/craftinmotion1080p.mp4';

const STAGE_VIDEO_FILENAMES = {
  discoveryDesign: 'stage-discovery-design.mp4',
  commitmentPortal: 'stage-commitment-portal.mp4',
  woodVisionLockIn: 'stage-wood-vision-lock-in.mp4',
  rawShellCreation: 'stage-build-raw-shell-creation.mp4',
  shellTrueingTorchTune: 'stage-build-shell-trueing-torch-tune.mp4',
  exteriorArtFinish: 'stage-build-exterior-art-finish.mp4',
  edgesSnareBeds: 'stage-build-edges-snare-beds.mp4',
  hardwareAssembly: 'stage-build-hardware-assembly.mp4',
  legacyTuningMedia: 'stage-legacy-tuning-media.mp4',
  finalQAPackagingDelivery: 'stage-final-qa-packaging-delivery.mp4',
};

// ✅ TEMP ALIASES so the rest of this file compiles without a massive refactor yet.
// This file expects "STEPS" to mean "stages in order".
const STEPS = STAGES.map((s) => {
  const edu = PROJECT_STAGE_EDU[s.stageKey] || {};

  const time = edu.time || {};
  const estHours =
    typeof time.min === 'number' && typeof time.max === 'number'
      ? time.min === time.max
        ? `${time.min} hrs`
        : `${time.min}–${time.max} hrs`
      : '—';

  return {
    key: s.stageKey,
    label: s.adminMainTitle?.replace(/^\d+\.\s*/, '') || s.adminMainTitle,
    adminMainTitle: s.adminMainTitle,
    adminLeftShort: s.adminLeftShort,

    what: edu.what || '',
    why: edu.why || '',
    techniques: Array.isArray(edu.techniques) ? edu.techniques : [],
    tools: Array.isArray(edu.tools) ? edu.tools : [],
    estHours,
    avgDays: '—',
    mantra: edu.value || '',

    storageKeys: [s.stageKey],
  };
});

// ✅ This file also expects a STEP_DEFS map keyed by `key`
const STEP_DEFS = STEPS.reduce((acc, s) => {
  acc[s.key] = s;
  return acc;
}, {});

/**
 * ✅ CANONICAL STORAGE KEYS (Admin Project View source of truth)
 * These must match ManageProjectModal STEP_KEYS exactly.
 */
const CANONICAL_STEP_KEYS = [
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

/**
 * ✅ Map portal workflowDefinitions stage keys -> canonical admin step keys
 * (This is the drift fix.)
 */
const STAGEKEY_TO_CANONICAL_STEPKEY = {
  // likely identical
  discoveryDesign: 'discoveryDesign',
  commitmentPortal: 'commitmentPortal',

  // portal shorthand -> canonical
  woodVision: 'woodVisionLockIn',
  rawShell: 'rawShellCreation',
  shellTrueingTorch: 'shellTrueingTorchTune',
  exteriorArt: 'exteriorArtFinish',
  edgesBeds: 'edgesSnareBeds',
  legacyMedia: 'legacyTuningMedia',
  finalQa: 'finalQAPackagingDelivery',

  // if any portal already uses canonical names, pass-through
  woodVisionLockIn: 'woodVisionLockIn',
  rawShellCreation: 'rawShellCreation',
  shellTrueingTorchTune: 'shellTrueingTorchTune',
  exteriorArtFinish: 'exteriorArtFinish',
  edgesSnareBeds: 'edgesSnareBeds',
  legacyTuningMedia: 'legacyTuningMedia',
  finalQAPackagingDelivery: 'finalQAPackagingDelivery',
};

/**
 * Legacy aliases (if any old project docs still contain these)
 * We READ these only as fallback, but we WRITE ONLY to canonical.
 */
const LEGACY_STEPKEY_FALLBACKS = {
  discoveryDesign: ['woodPreparation'],
  commitmentPortal: ['shellConstruction'],
  woodVisionLockIn: ['fineTuning', 'woodVision'],
  rawShellCreation: ['shellExteriorFinish', 'rawShell'],
  shellTrueingTorchTune: ['bearingEdges', 'shellTrueingTorch'],
  exteriorArtFinish: ['snareBedCutting', 'exteriorArt'],
  edgesSnareBeds: ['hardwareDrilling', 'edgesBeds'],
  hardwareAssembly: ['hardwareAssembly'],
  legacyTuningMedia: ['tuningAndDetailing', 'tuningDetailing', 'legacyMedia'],
  finalQAPackagingDelivery: ['qualityCheck', 'finalQa'],
};

/* =========================================================
   HELPERS
   ========================================================= */

function isChecklistItemComplete(item) {
  if (!item) return false;

  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : null;
  if (states && states.length > 0) {
    return states.every(Boolean);
  }

  return !!item.completed;
}

function isChecklistItemTouched(item) {
  if (!item) return false;

  if (item.completed) return true;

  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : null;
  if (states && states.length > 0) {
    return states.some(Boolean);
  }

  return (item.totalSeconds ?? 0) > 0;
}

function getUnlockMaxStageIndex(project) {
  // Always allow Stage 1–3
  const MIN_UNLOCKED = 2; // index 2 == Stage 3

  if (!project) return MIN_UNLOCKED;

  // Find the FIRST stage that is not completed.
  // Everything up to that stage should be unlocked.
  for (let i = 0; i < STEPS.length; i += 1) {
    const status = getStepStatus(project, STEPS[i]).status; // "Completed" | "In Progress" | "Not Started"
    if (status !== 'Completed') {
      return Math.max(MIN_UNLOCKED, i);
    }
  }

  // If all completed, unlock all
  return STEPS.length - 1;
}

function canonicalKeyForStage(stageKey) {
  return STAGEKEY_TO_CANONICAL_STEPKEY[stageKey] || stageKey;
}

function getExistingPhaseKey(project, canonicalKey) {
  if (!project || !canonicalKey) return null;

  // 1) Prefer canonical if present
  const v = project?.[canonicalKey];
  if (v && typeof v === 'object' && Array.isArray(v.checklist))
    return canonicalKey;

  // 2) Try legacy fallbacks
  const fallbacks = LEGACY_STEPKEY_FALLBACKS[canonicalKey] || [];
  for (const k of fallbacks) {
    const vv = project?.[k];
    if (vv && typeof vv === 'object' && Array.isArray(vv.checklist)) return k;
  }

  // 3) If none exist, still return canonical (we’ll create/fill safely in writers)
  return canonicalKey;
}

const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  /**
   * ✅ Match Admin Project View patching exactly:
   * calculateProjectProgress expects old keys, so we alias from CANONICAL.
   * (No “woodPreparation || discoveryDesign” ambiguity here.)
   */
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

export function computeStageStatus(step) {
  if (!step || !Array.isArray(step.checklist)) return 'not_started';

  const items = step.checklist.filter(Boolean);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const anyProgress =
    items.some((i) => i.completed) ||
    items.some((i) => (i.totalSeconds ?? 0) > 0);

  if (completedCount === totalCount && totalCount > 0) return 'completed';
  if (anyProgress) return 'in_progress';
  return 'not_started';
}

function displayStatus(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'completed') return 'Completed';
  if (s === 'in_progress' || s === 'in progress') return 'In Progress';
  if (s === 'not_started' || s === 'not started') return 'Not Started';

  return 'Not Started';
}

function getProjectDocRef(project) {
  if (!project) return null;
  const id =
    project.id ||
    project.projectId ||
    project.docId ||
    project.serial ||
    project.snareSerial ||
    project.lineSerial;
  if (!id) return null;
  return doc(db, 'projects', id);
}

function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(v) {
  const ms = typeof v === 'number' ? v : tsToMillis(v);
  if (!ms) return null;
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Combine checklists across all underlying storage keys for a portal step */
function getCombinedChecklist(project, stepDef) {
  if (!project || !stepDef) return [];

  const stageKey = stepDef.key || stepDef.stageKey; // portal stage key
  const tpl = stageKey ? STAGE_TEMPLATES?.[stageKey] : null;
  const cap = Array.isArray(tpl?.steps) ? tpl.steps.length : null;

  const keys = stepDef.storageKeys || [];
  const items = [];

  keys.forEach((k) => {
    const canonical = canonicalKeyForStage(k);
    const phaseKey = getExistingPhaseKey(project, canonical);
    const section = project?.[phaseKey];

    if (section?.checklist && Array.isArray(section.checklist)) {
      const filtered = section.checklist.filter(Boolean);
      const capped = Number.isFinite(cap) ? filtered.slice(0, cap) : filtered;
      capped.forEach((i) => items.push(i));
    }
  });

  return items;
}

/** Determine status of a step based on its combined checklist */
function getStepStatus(project, stepOrDef) {
  const key = stepOrDef?.key;
  const def = key && STEP_DEFS?.[key] ? STEP_DEFS[key] : stepOrDef;

  const list = getCombinedChecklist(project, def);
  if (!list.length) return { status: 'Not Started', done: 0, total: 0 };

  const total = list.length;
  const done = list.filter(isChecklistItemComplete).length;

  if (done === 0) {
    const anyTouched = list.some(isChecklistItemTouched);
    return {
      status: anyTouched ? 'In Progress' : 'Not Started',
      done: 0,
      total,
    };
  }

  if (done === total) return { status: 'Completed', done, total };
  return { status: 'In Progress', done, total };
}

/** Any extra checklist items that aren’t part of the curated weighted list */
function getExtraChecklistItems(project, stepDef) {
  const checklist = getCombinedChecklist(project, stepDef);
  if (!checklist.length) return [];

  // Original behavior preserved
  const cpSlugs = new Set(
    (stepDef.checkpoints || []).map((cp) => slugify(cp.label))
  );

  return checklist.filter((item) => {
    const taskSlug = slugify(item.label || item.task || '');
    return !cpSlugs.has(taskSlug);
  });
}

/** Percentage completion using the admin util (with canonical key patching) */
function getOverallProgress(project) {
  if (!project) return 0;
  try {
    return Math.round(getWeightedProgressPct(project));
  } catch (e) {
    console.error('calculateProjectProgress failed; defaulting to 0', e);
    return 0;
  }
}

// ✅ Global active sub-step pointer (ONE "IN PROGRESS" across whole project)
function getGlobalActiveSubStep(project) {
  if (!project) return null;

  for (let s = 0; s < STEPS.length; s += 1) {
    const stageKey = STEPS[s].key; // portal key
    const tpl = STAGE_TEMPLATES?.[stageKey];
    const canonical = canonicalKeyForStage(stageKey);
    const phaseKey = getExistingPhaseKey(project, canonical);

    if (!tpl || !phaseKey) continue;

    const phase = project?.[phaseKey] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];
    const stepsArr = tpl.steps || [];
    if (!stepsArr.length) continue;

    // stage complete?
    const stageComplete = stepsArr.every((_, idx) => {
      const item = checklist[idx] || {};
      const states = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const total = states.length;
      const done = states.filter(Boolean).length;
      return total > 0 ? done === total : !!item.completed;
    });
    if (stageComplete) continue;

    // first incomplete sub-step
    for (let i = 0; i < stepsArr.length; i += 1) {
      const item = checklist[i] || {};
      const states = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const total = states.length;
      const done = states.filter(Boolean).length;
      const isComplete = total > 0 ? done === total : !!item.completed;
      if (!isComplete) return { stageKey, stepIdx: i };
    }

    return { stageKey, stepIdx: 0 };
  }

  return null;
}

/** Derive current step index from currentPhase text if present */
function getCurrentStepIndex(project) {
  if (!project) return 0;

  // 1) If there's an active global sub-step, use its stage first.
  // This is the most accurate source of truth for the current in-progress stage.
  const activePtr = getGlobalActiveSubStep(project);
  if (activePtr?.stageKey) {
    const activeStageIndex = STEPS.findIndex(
      (step) => step.key === activePtr.stageKey
    );
    if (activeStageIndex >= 0) return activeStageIndex;
  }

  // 2) If every stage is completed, show the last stage.
  const summaries = STEPS.map((step) => getStepStatus(project, step));
  const allCompleted =
    summaries.length > 0 &&
    summaries.every(
      (s) => String(s.status || '').toLowerCase() === 'completed'
    );

  if (allCompleted) {
    return STEPS.length - 1;
  }

  // 3) Otherwise fallback to the furthest completed/touched stage.
  let lastTouchedIndex = 0;

  summaries.forEach((summary, index) => {
    const status = String(summary.status || '').toLowerCase();
    const done = Number(summary.done || 0);

    if (status === 'completed' || status === 'in progress' || done > 0) {
      lastTouchedIndex = index;
    }
  });

  return lastTouchedIndex;
}

/** Stage completion target */
function getStageTargetDate(project, stageKey) {
  if (!project) return null;

  const canonical = canonicalKeyForStage(stageKey);
  const phaseKey = getExistingPhaseKey(project, canonical);
  const step = project?.[phaseKey];

  if (!step?.checklist || !Array.isArray(step.checklist)) return null;

  const timestamps = [];
  for (const item of step.checklist.filter(Boolean)) {
    const ts = item?.timestamp ?? item?.completedAt ?? null;
    if (ts) timestamps.push(tsToMillis(ts));
  }

  if (timestamps.length === 0) return null;
  const latest = Math.max(...timestamps);
  const projected = latest + 14 * DAY_MS;
  return fmtDate(projected);
}

/** Target completion window text */
function getTargetWindow(project) {
  if (!project) return null;

  const all = [];

  CANONICAL_STEP_KEYS.forEach((canonicalKey) => {
    const phaseKey = getExistingPhaseKey(project, canonicalKey);
    const step = project?.[phaseKey];
    if (!step || !Array.isArray(step.checklist)) return;

    step.checklist.filter(Boolean).forEach((item) => {
      if (item.timestamp || item.completedAt) {
        all.push(tsToMillis(item.timestamp || item.completedAt));
      }
    });
  });

  if (all.length === 0) return null;
  const latest = Math.max(...all);
  const early = fmtDate(latest + 14 * DAY_MS);
  const late = fmtDate(latest + 28 * DAY_MS);
  return `${early} → ${late}`;
}

// touched?
const isItemTouched = (item = {}) => {
  const done = !!item.completed;
  const hasCheckpoints =
    Array.isArray(item.checkpointStates) && item.checkpointStates.some(Boolean);
  return done || hasCheckpoints;
};

const getActiveStepIndexForPhase = (project, phaseKey) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? [...phase.checklist] : [];
  if (!checklist.length) return -1;

  // 1) touched but not done
  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i] || {};
    const touched = isItemTouched(item);
    const done = !!item.completed;
    if (touched && !done) return i;
  }

  // 2) first incomplete
  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i] || {};
    if (!item.completed) return i;
  }

  return -1;
};

const PREBUILD_STAGE_INDEXES = [0, 1, 2];

const getPhaseIndexForStep = (stepIndex) => {
  if (stepIndex <= 2) return 0;
  if (stepIndex <= 7) return 1;
  return 2;
};

const arePrebuildStagesComplete = (project) => {
  if (!project) return false;
  return PREBUILD_STAGE_INDEXES.every((i) => {
    const def = STEPS[i];
    if (!def) return false;
    return getStepStatus(project, def).status === 'Completed';
  });
};

/* =========================================================
   STAGE CHECKPOINTS PANEL
   ========================================================= */

const StageCheckpointsPanel = ({
  project,
  setProject,
  stageKey,
  isAdmin = false,
}) => {
  const [openStepId, setOpenStepId] = useState(null);
  const userToggledRef = useRef(false);

  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const template = STAGE_TEMPLATES?.[stageKey] || null;

  // ✅ Canonical phase key for this portal stage
  const canonical = useMemo(() => canonicalKeyForStage(stageKey), [stageKey]);
  const phaseKey = useMemo(
    () => getExistingPhaseKey(project, canonical),
    [project, canonical]
  );

  const phaseChecklist = useMemo(() => {
    const phase = phaseKey && project ? project?.[phaseKey] : null;
    return Array.isArray(phase?.checklist)
      ? phase.checklist.filter(Boolean)
      : [];
  }, [project, phaseKey]);

  const lifecycleSteps = useMemo(() => {
    const lifecycleStage = project?.lifecycle?.stages?.[stageKey];
    const stepsObj = lifecycleStage?.steps || null;
    return stepsObj ? Object.values(stepsObj) : [];
  }, [project, stageKey]);

  const normalizedSteps = useMemo(() => {
    const tplSteps = template?.steps || [];

    const overallPct = getOverallProgress(project);
    const globalPtr = overallPct < 100 ? getGlobalActiveSubStep(project) : null;

    return tplSteps.map((tplStep, idx) => {
      const phaseItem = phaseChecklist[idx];

      // ✅ New template shape support
      const tplStepId =
        tplStep?.id || tplStep?.key || `${stageKey}_step_${idx}`;
      const tplStepLabel =
        tplStep?.adminMainTitle ||
        tplStep?.label ||
        tplStep?.adminLeftShort ||
        `Step ${idx + 1}`;

      // checkpoints are cp objects now
      const checkpointDefs = Array.isArray(tplStep?.checkpoints)
        ? tplStep.checkpoints
        : [];

      let checkpointStates = [];
      let stepDurationMinutes = 0;

      if (phaseItem) {
        if (Array.isArray(phaseItem.checkpointStates)) {
          checkpointStates = phaseItem.checkpointStates;
        }

        stepDurationMinutes = Number(
          phaseItem.durationMinutes ??
            (Number.isFinite(phaseItem.totalSeconds)
              ? phaseItem.totalSeconds / 60
              : 0)
        );
      }

      const checkpoints = checkpointDefs.map((cpObj, cpIndex) => ({
        id: `${tplStepId}_cp_${cpIndex}`,
        // ✅ renderable string
        label: cpObj?.ui || cpObj?.book || `Checkpoint ${cpIndex + 1}`,
        // (optional: keep details available if you ever want to show them)
        details: Array.isArray(cpObj?.details) ? cpObj.details : [],
        completed: !!checkpointStates[cpIndex],
      }));

      const total = checkpoints.length;
      const done = checkpoints.filter((c) => c.completed).length;

      const isComplete = total > 0 && done === total;

      const overallPct = getOverallProgress(project);
      const globalPtr =
        overallPct < 100 ? getGlobalActiveSubStep(project) : null;

      const isGlobalActive =
        !!globalPtr &&
        globalPtr.stageKey === stageKey &&
        globalPtr.stepIdx === idx;

      let status = 'NOT STARTED';
      if (isComplete) status = 'COMPLETED';
      else if (isGlobalActive) status = 'IN PROGRESS';

      return {
        id: `${stageKey}_${tplStepId}`,
        // ✅ THIS is what will show "Player Interview", etc.
        label: tplStepLabel,
        order: idx + 1,
        checkpoints,
        total,
        done,
        status,
        durationMinutes: stepDurationMinutes,
      };
    });
  }, [template, stageKey, phaseChecklist, lifecycleSteps, project]);

  // auto-open best sub-step for current stage (unchanged behavior, now correct keys)
  useEffect(() => {
    if (!project || !normalizedSteps.length) {
      setOpenStepId(null);
      return;
    }

    const currentStageIndex = getCurrentStepIndex(project);
    const thisStageIndex = STEPS.findIndex((s) => s.key === stageKey);
    const isCurrentStage = thisStageIndex === currentStageIndex;

    if (!isCurrentStage) {
      setOpenStepId(null);
      userToggledRef.current = false;
      return;
    }

    setOpenStepId((prev) => {
      if (userToggledRef.current) return prev;
      if (prev && normalizedSteps.some((s) => s.id === prev)) return prev;

      let candidateIndex = -1;

      if (phaseKey) {
        const idx = getActiveStepIndexForPhase(project, phaseKey);
        if (idx >= 0 && idx < normalizedSteps.length) candidateIndex = idx;
      }

      if (candidateIndex < 0) {
        candidateIndex = normalizedSteps.findIndex(
          (s) => s.status === 'IN PROGRESS'
        );
      }
      if (candidateIndex < 0) {
        candidateIndex = normalizedSteps.findIndex(
          (s) => s.status === 'NOT STARTED'
        );
      }
      if (candidateIndex < 0) candidateIndex = 0;

      return normalizedSteps[candidateIndex]?.id ?? null;
    });
  }, [stageKey, project, phaseKey, normalizedSteps]);

  const statusClass = (status) => {
    if (status === 'COMPLETED') return 'pill-complete';
    if (status === 'IN PROGRESS') return 'pill-progress';
    return 'pill-pending';
  };

  const toggleStep = (stepId) => {
    userToggledRef.current = true;
    setOpenStepId((prev) => (prev === stepId ? null : stepId));
  };

  // ✅ Firestore update helper (WRITES CANONICAL ONLY)
  const persistCheckpointToggle = async ({ stepIdx, cpIdx, completed }) => {
    if (!project?.id || !phaseKey) return;

    const ref = doc(db, 'projects', project.id);

    // read freshest server state
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const server = { id: snap.id, ...snap.data() };
    const serverPhaseKey = getExistingPhaseKey(server, canonical);
    const phase = server?.[serverPhaseKey] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    while (checklist.length <= stepIdx) {
      checklist.push({
        checkpointStates: [],
        completed: false,
        durationMinutes: 0,
        totalSeconds: 0,
      });
    }

    const stepItemRaw = checklist[stepIdx] || {};
    const stepItem = { ...stepItemRaw };

    const cpCount =
      STAGE_TEMPLATES?.[stageKey]?.steps?.[stepIdx]?.checkpoints?.length ?? 0;

    const prevStates = Array.isArray(stepItem.checkpointStates)
      ? stepItem.checkpointStates
      : [];

    const states = Array.from({ length: cpCount }, (_, i) => !!prevStates[i]);

    if (cpIdx < 0 || cpIdx >= cpCount) return;

    states[cpIdx] = !!completed;

    const done = states.filter(Boolean).length;
    const isFullyComplete = cpCount > 0 && done === cpCount;

    // ✅ WRITE BACK into checklist (this was missing)
    checklist[stepIdx] = {
      ...stepItem,
      checkpointStates: states,
      completed: isFullyComplete,
      ...(isFullyComplete ? {} : { durationMinutes: 0, totalSeconds: 0 }),
    };

    // optimistic local update
    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;

        const localPhaseKey = getExistingPhaseKey(prev, canonical);
        const prevPhase = prev?.[localPhaseKey] || {};
        const prevChecklist = Array.isArray(prevPhase.checklist)
          ? [...prevPhase.checklist]
          : [];

        const prevStep = { ...(prevChecklist[stepIdx] || {}) };
        prevStep.checkpointStates = states;
        prevStep.completed = isFullyComplete;

        if (!isFullyComplete) {
          prevStep.durationMinutes = 0;
          prevStep.totalSeconds = 0;
        }

        prevChecklist[stepIdx] = prevStep;

        // ✅ always store into CANONICAL key in local state
        return {
          ...prev,
          [canonical]: { ...prevPhase, checklist: prevChecklist },
        };
      });
    }

    // ✅ write ONLY canonical object (full checklist to avoid partial overwrites)
    const canonicalPhase = server?.[canonical] || {};
    await updateDoc(ref, {
      [canonical]: {
        ...canonicalPhase,
        checklist,
      },
      updatedAt: serverTimestamp(),
      updatedBy: 'artistPortal',
    });
  };

  const persistMarkAllComplete = async ({ stepIdx }) => {
    if (!project?.id || !phaseKey) return;

    const ref = doc(db, 'projects', project.id);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const server = { id: snap.id, ...snap.data() };
    const serverPhaseKey = getExistingPhaseKey(server, canonical);
    const phase = server?.[serverPhaseKey] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    while (checklist.length <= stepIdx) {
      checklist.push({
        checkpointStates: [],
        completed: false,
        durationMinutes: 0,
        totalSeconds: 0,
      });
    }

    const cpCount =
      STAGE_TEMPLATES?.[stageKey]?.steps?.[stepIdx]?.checkpoints?.length ?? 0;

    const nextStates = Array.from({ length: cpCount }, () => true);
    checklist[stepIdx] = {
      ...(checklist[stepIdx] || {}),
      checkpointStates: nextStates,
      completed: cpCount > 0,
    };

    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;

        const prevPhase = prev?.[canonical] || {};
        const prevChecklist = Array.isArray(prevPhase.checklist)
          ? [...prevPhase.checklist]
          : [];

        prevChecklist[stepIdx] = {
          ...(prevChecklist[stepIdx] || {}),
          checkpointStates: nextStates,
          completed: cpCount > 0,
        };

        return {
          ...prev,
          [canonical]: { ...prevPhase, checklist: prevChecklist },
        };
      });
    }

    await updateDoc(ref, {
      [canonical]: { ...phase, checklist },
      updatedAt: serverTimestamp(),
      updatedBy: 'artistPortal',
    });
  };

  // ✅ Save duration at sub-step level (only after fully complete)
  const persistStepDuration = async ({ stepIdx, durationMinutes }) => {
    if (!project?.id || !phaseKey) return;

    const ref = doc(db, 'projects', project.id);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const server = { id: snap.id, ...snap.data() };
    const serverPhaseKey = getExistingPhaseKey(server, canonical);
    const phase = server?.[serverPhaseKey] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    const stepItemRaw = checklist[stepIdx] || {};
    const stepItem = { ...stepItemRaw };

    const cpCount =
      STAGE_TEMPLATES?.[stageKey]?.steps?.[stepIdx]?.checkpoints?.length ?? 0;

    const prevStates = Array.isArray(stepItem.checkpointStates)
      ? stepItem.checkpointStates
      : [];

    const states = Array.from({ length: cpCount }, (_, i) => !!prevStates[i]);

    const total = states.length;
    const done = states.filter(Boolean).length;
    const isFullyComplete = total > 0 && done === total;

    if (!isFullyComplete) return;

    const mins = Math.max(0, Number(durationMinutes || 0));
    const secs = mins * 60;

    // optimistic
    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;

        const prevPhase = prev?.[canonical] || {};
        const prevChecklist = Array.isArray(prevPhase.checklist)
          ? [...prevPhase.checklist]
          : [];

        const prevStep = { ...(prevChecklist[stepIdx] || {}) };
        prevStep.durationMinutes = mins;
        prevStep.totalSeconds = secs;

        prevChecklist[stepIdx] = prevStep;

        return {
          ...prev,
          [canonical]: { ...prevPhase, checklist: prevChecklist },
        };
      });
    }

    await updateDoc(ref, {
      [`${canonical}.checklist.${stepIdx}.durationMinutes`]: mins,
      [`${canonical}.checklist.${stepIdx}.totalSeconds`]: secs,
      updatedAt: serverTimestamp(),
      updatedBy: 'artistPortal',
    });
  };

  const handleMarkAllComplete = async ({ stepIdx }) => {
    if (!isAdmin) return;
    try {
      await persistMarkAllComplete({ stepIdx });
    } catch (e) {
      console.error('Failed marking all complete', e);
    }
  };

  const openDurationModal = ({ stepIdx }) => {
    setPending({ stepIdx });
    setHours(0);
    setMinutes(0);
    setDurationModalOpen(true);
  };

  const closeDurationModal = () => {
    setDurationModalOpen(false);
    setPending(null);
    setHours(0);
    setMinutes(0);
    setSaving(false);
  };

  const saveDurationAndComplete = async () => {
    if (pending?.stepIdx == null) return;

    const durMins = Number(hours) * 60 + Number(minutes);

    setSaving(true);
    try {
      await persistStepDuration({
        stepIdx: pending.stepIdx,
        durationMinutes: durMins,
      });
      closeDurationModal();
    } catch (e) {
      console.error('Failed saving step duration', e);
      setSaving(false);
    }
  };

  const handleToggleCheckpoint = async ({ stepIdx, cpIdx, nextChecked }) => {
    if (!isAdmin) return;

    try {
      await persistCheckpointToggle({
        stepIdx,
        cpIdx,
        completed: nextChecked,
      });
    } catch (e) {
      console.error('Failed toggling checkpoint', e);
    }
  };

  // ✅ Early return ONLY AFTER hooks are declared
  if (!project || !template) return null;

  const HOURS_OPTIONS = Array.from({ length: 25 }, (_, i) => i); // 0–24
  const MINUTES_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5); // 0–55

  return (
    <div className="pp-stage-card">
      <h4 className="pp-section-title">Internal checkpoints</h4>

      <div className="pp-step-list">
        {normalizedSteps.map((step, stepIdx) => {
          const { total, done, status } = step;
          const isOpen = openStepId === step.id;
          const canLogDuration = isAdmin && total > 0 && done === total;
          const hasLoggedDuration = (step.durationMinutes || 0) > 0;

          return (
            <div
              key={step.id}
              className={`pp-step-block step-${String(status)
                .toLowerCase()
                .replace(/\s+/g, '-')}`}
            >
              {isAdmin ? (
                <button
                  type="button"
                  className="pp-step-header slp-pp-step-header"
                  onClick={() => toggleStep(step.id)}
                >
                  <div className="pp-step-header-main">
                    <span className="pp-step-title">{step.label}</span>

                    <span className="pp-step-count">
                      {done === total
                        ? 'Fully completed'
                        : `${done}/${total} completed`}
                    </span>

                    {total > 0 && done < total && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="pp-step-markall-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllComplete({ stepIdx });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAllComplete({ stepIdx });
                          }
                        }}
                      >
                        Mark all complete
                      </span>
                    )}

                    {canLogDuration && (
                      <span className="pp-step-duration">
                        {hasLoggedDuration ? (
                          <>
                            {Math.floor((step.durationMinutes || 0) / 60)}h{' '}
                            {String((step.durationMinutes || 0) % 60).padStart(
                              2,
                              '0'
                            )}
                            m
                          </>
                        ) : (
                          <button
                            type="button"
                            className="pp-step-log-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDurationModal({ stepIdx });
                            }}
                          >
                            Log duration
                          </button>
                        )}
                      </span>
                    )}
                  </div>

                  <span
                    className={`pp-step-status pill ${statusClass(status)}`}
                  >
                    {status}
                  </span>

                  <span
                    className={`pp-step-chevron ${isOpen ? 'open' : ''}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
              ) : (
                <div className="pp-step-header slp-pp-step-header is-static">
                  <div className="pp-step-header-main">
                    <span className="pp-step-title">{step.label}</span>
                  </div>

                  <span
                    className={`pp-step-status pill ${statusClass(status)}`}
                  >
                    {status}
                  </span>
                </div>
              )}

              {isOpen && isAdmin && (
                <div className="pp-checkpoint-list grouped">
                  {step.checkpoints.map((cp, cpIdx) => (
                    <div
                      key={cp.id}
                      className="pp-checkpoint-row pp-checkpoint-row--admin"
                    >
                      <div className="pp-checkpoint-main">
                        <button
                          type="button"
                          className={`pp-checkpoint-icon pp-checkpoint-icon--button ${
                            cp.completed ? 'is-completed' : ''
                          }`}
                          aria-label={
                            cp.completed ? 'Mark incomplete' : 'Mark complete'
                          }
                          onClick={() =>
                            handleToggleCheckpoint({
                              stepIdx,
                              cpIdx,
                              nextChecked: !cp.completed,
                            })
                          }
                        >
                          {cp.completed ? '✓' : ''}
                        </button>

                        <span
                          className={`pp-checkpoint-label ${
                            cp.completed ? 'is-completed' : ''
                          }`}
                        >
                          {cp.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Duration modal (admin-only) */}
      {isAdmin && durationModalOpen && (
        <div className="slp-modal-overlay" role="dialog" aria-modal="true">
          <div className="slp-modal">
            <div className="slp-modal-header">
              <div className="slp-modal-title">Log duration</div>
              <div className="slp-modal-subtitle">
                How long did this checkpoint take?
              </div>
            </div>

            <div className="slp-modal-body">
              <div className="slp-modal-grid">
                <div className="slp-modal-field">
                  <label className="slp-modal-label">Hours</label>
                  <select
                    className="slp-modal-select"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  >
                    {HOURS_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="slp-modal-field">
                  <label className="slp-modal-label">Minutes</label>
                  <select
                    className="slp-modal-select"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  >
                    {MINUTES_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="slp-modal-hint">
                Minutes are logged in 5-minute increments.
              </div>
            </div>

            <div className="slp-modal-footer">
              <button
                type="button"
                className="slp-modal-btn slp-modal-btn--ghost"
                onClick={closeDurationModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="slp-modal-btn slp-modal-btn--primary"
                onClick={saveDurationAndComplete}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save & mark complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   COMPONENT
   ========================================================= */

// Derive the *project* current stage + current sub-step labels
function getCurrentStageAndStepLabels(project) {
  if (!project) {
    return { stageLabel: 'Not started', stepLabel: 'No sub-step selected' };
  }

  const stageIndex = getCurrentStepIndex(project);
  const stageDef = STEPS[stageIndex] || STEPS[0];
  const stageLabel = `${stageIndex + 1}. ${stageDef.label}`;

  let stepLabel = 'No sub-step selected';

  const overallPct = getOverallProgress(project);
  const activePtr = overallPct < 100 ? getGlobalActiveSubStep(project) : null;

  if (activePtr) {
    const tpl = STAGE_TEMPLATES?.[activePtr.stageKey];
    const stepsArr = tpl?.steps || [];
    if (stepsArr[activePtr.stepIdx])
      stepLabel = stepsArr[activePtr.stepIdx].label;
  }

  return { stageLabel, stepLabel };
}

const ProjectProgress = ({ project: initialProject, isAdmin = false }) => {
  const [project, setProject] = useState(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [activeKey, setActiveKey] = useState(STEPS[0].key);
  const [heroVideoUrl, setHeroVideoUrl] = useState(FALLBACK_VIDEO);
  const [videoUrlCache, setVideoUrlCache] = useState({});

  // ✅ Only seed from props when switching projects or when local is empty.
  useEffect(() => {
    if (!initialProject) return;

    setProject((prev) => {
      if (!prev) return initialProject;

      const incomingId =
        initialProject.id ||
        initialProject.projectId ||
        initialProject.docId ||
        initialProject.serial ||
        initialProject.snareSerial ||
        initialProject.lineSerial;

      if (incomingId && prev.id && incomingId !== prev.id) {
        return initialProject;
      }

      return prev;
    });
  }, [initialProject]);

  // ✅ Live sync from Firestore so admin + artist never drift
  useEffect(() => {
    const ref = getProjectDocRef(initialProject);
    if (!ref) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProject((prev) => {
            const incoming = { id: snap.id, ...snap.data() };
            if (prev && prev.id === incoming.id) {
              return { ...prev, ...incoming };
            }
            return incoming;
          });
        } else {
          setProject(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('ProjectProgress onSnapshot error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [initialProject]);

  const overallPct = useMemo(() => getOverallProgress(project), [project]);
  const targetWindow = useMemo(() => getTargetWindow(project), [project]);

  const currentStepIndex = useMemo(
    () => (overallPct === 0 ? 0 : getCurrentStepIndex(project)),
    [project, overallPct]
  );

  const currentStageKey = useMemo(() => {
    return (STEPS[currentStepIndex] || STEPS[0]).key;
  }, [currentStepIndex]);

  const currentStageDef = useMemo(() => {
    return STEPS[currentStepIndex] || STEPS[0];
  }, [currentStepIndex]);

  // ✅ Always allow Stage 1–3 to be viewable.
  // ✅ Also allow anything up to the current stage (in progress / reached).
  const unlockedUntilIndex = useMemo(
    () => getUnlockMaxStageIndex(project),
    [project]
  );

  const prebuildComplete = useMemo(
    () => arePrebuildStagesComplete(project),
    [project]
  );

  const { stageLabel: currentStageLabel, stepLabel: currentStepLabel } =
    useMemo(() => getCurrentStageAndStepLabels(project), [project]);

  useEffect(() => {
    if (!project?.id) return;
    const def = STEPS[currentStepIndex] || STEPS[0];
    setActiveKey(def.key);
  }, [project?.id]);

  const activeStep = STEPS.find((s) => s.key === activeKey) || STEPS[0];

useEffect(() => {
  let cancelled = false;

  const normalizeName = (value = '') =>
    String(value)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .toLowerCase();

  const loadStageVideo = async () => {
    const stageKey = currentStageKey;

    if (!stageKey) {
      setHeroVideoUrl(FALLBACK_VIDEO);
      return;
    }

    if (videoUrlCache[stageKey]) {
      setHeroVideoUrl(videoUrlCache[stageKey]);
      return;
    }

    const expectedFilename = STAGE_VIDEO_FILENAMES[stageKey];
    if (!expectedFilename) {
      console.warn('No filename mapped for stage key:', stageKey);
      setHeroVideoUrl(FALLBACK_VIDEO);
      return;
    }

    try {
      const folderRef = storageRef(storage, 'project-stage-media');
      const folderList = await listAll(folderRef);

      const normalizedExpected = normalizeName(expectedFilename);

      const availableNames = folderList.items.map((item) => item.name);
      console.log('CURRENT STAGE KEY:', stageKey);
      console.log('EXPECTED FILENAME:', expectedFilename);
      console.log('NORMALIZED EXPECTED:', normalizedExpected);
      console.log('AVAILABLE STAGE MEDIA FILES:', availableNames);

      const matchedItem = folderList.items.find((item) => {
        const normalizedItemName = normalizeName(item.name);
        return normalizedItemName === normalizedExpected;
      });

      if (!matchedItem) {
        console.error(
          `No matching file found in project-stage-media for ${stageKey}. Expected: ${expectedFilename}`
        );
        if (!cancelled) setHeroVideoUrl(FALLBACK_VIDEO);
        return;
      }

      console.log('MATCHED STORAGE ITEM:', matchedItem.name);

      const url = await getDownloadURL(matchedItem);

      if (cancelled) return;

      console.log('SUCCESS VIDEO URL:', url);

      setVideoUrlCache((prev) => ({
        ...prev,
        [stageKey]: url,
      }));
      setHeroVideoUrl(url);
    } catch (err) {
      console.error(`Failed loading current stage video for ${stageKey}:`, err);
      if (!cancelled) {
        setHeroVideoUrl(FALLBACK_VIDEO);
      }
    }
  };

  loadStageVideo();

  return () => {
    cancelled = true;
  };
}, [currentStageKey, videoUrlCache]);

  const activeStatus = useMemo(() => {
    if (!project || !activeStep) return 'not_started';

    const computed = String(getStepStatus(project, activeStep).status || '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (computed === 'completed') return 'completed';

    const activePtr = getGlobalActiveSubStep(project);
    if (activePtr?.stageKey === activeStep.key) {
      return 'in_progress';
    }

    return computed;
  }, [project, activeStep]);

  const stageTarget = useMemo(
    () => getStageTargetDate(project, activeStep.key),
    [project, activeStep.key]
  );

  const activeIndex = STEPS.indexOf(activeStep);

  // ✅ Stage is locked if it's beyond what’s unlocked for viewing
  const isStageLocked = activeIndex > unlockedUntilIndex;

  // ✅ Use the same rule for whether to show teaser vs checkpoints
  const isPhaseLockedByTeaser = isStageLocked;

  if (loading && !project) {
    return (
      <div className="sl-progress sl-progress--loading">
        <p>Loading project progress…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="sl-progress sl-progress--empty">
        <p>Project not found.</p>
      </div>
    );
  }

  return (
    <div className="sl-progress">
      {/* Hero media */}
      <div className="sl-progress-hero">
        <video
          key={heroVideoUrl}
          className="sl-progress-hero-video"
          src={heroVideoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <section className="sl-progress-intro">
        <p className="sl-progress-intro-text">
          A glimpse into the Ober Artisan process — you’ll see more
          behind-the-scenes clips and photos as your drum moves through each
          step.
        </p>
      </section>

      {/* Top metrics */}
      <div className="sl-progress-metrics">
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Project completion</div>
          <div className="sl-progress-metric-value">
            {overallPct != null ? `${overallPct}%` : '—'}
          </div>
        </div>

        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Project current stage</div>
          <div className="sl-progress-metric-value">{currentStageLabel}</div>
        </div>

        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Current stage step</div>
          <div className="sl-progress-metric-value">{currentStepLabel}</div>
        </div>

        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">
            Target completion window
          </div>
          <div className="sl-progress-metric-value">
            {targetWindow || 'TBD'}
          </div>
        </div>
      </div>

      <section className="sl-progress-roadmap">
        <div className="sl-progress-roadmap-header">Build Roadmap</div>

        <div className="sl-progress-roadmap-track">
          <div
            className="sl-progress-roadmap-track-fill"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {isStageLocked && (
          <div className="sl-progress-stage-locknote">
            Future stages unlock as we reach them — part of building this
            SoundLegend drum together, one focused step at a time.
          </div>
        )}
      </section>

      <section
        className={['sl-progress-stage', isStageLocked ? 'is-locked' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <header className="sl-progress-stage-header">
          <div className="sl-progress-stage-header-main">
            <h2 className="sl-progress-stage-title">
              {STEPS.indexOf(activeStep) + 1}. {activeStep.label}
            </h2>
            <div
              className={[
                'sl-progress-stage-status-pill',
                activeStatus === 'completed'
                  ? 'is-completed'
                  : activeStatus === 'in_progress'
                    ? 'is-inprogress'
                    : 'is-notstarted',
              ].join(' ')}
            >
              {displayStatus(activeStatus)}
            </div>
          </div>
        </header>

        {/* Stage roadmap steps (cards moved down here) */}
        <div className="sl-progress-roadmap-steps">
          {STEPS.map((step, index) => {
            const stepStatus = String(getStepStatus(project, step).status || '')
              .toLowerCase()
              .replace(/\s+/g, '_');

            const isCurrent = step.key === activeStep.key;
            const isCompleted =
              stepStatus === 'completed' || index < currentStepIndex;
            const isInProgress = stepStatus === 'in_progress';
            const isLocked = index > unlockedUntilIndex;

            const className = [
              'sl-progress-step-dot',
              isCurrent ? 'is-current' : '',
              isCompleted ? 'is-completed' : '',
              isInProgress ? 'is-inprogress' : '',
              isLocked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={step.key}
                type="button"
                className={className}
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return;
                  setActiveKey(step.key);
                }}
              >
                <span className="sl-progress-step-number">
                  {!isCompleted ? index + 1 : ''}
                </span>
                <span className="sl-progress-step-label">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stage stats row */}
        <div className="sl-progress-stage-stats">
          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Est. Time (focused hours)
            </div>
            <div className="sl-progress-stage-stat-value">
              {activeStep.estHours}
            </div>
          </div>

          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Avg. Turnaround (calendar days)
            </div>
            <div className="sl-progress-stage-stat-value">
              {activeStep.avgDays}
            </div>
          </div>

          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Stage Completion Target
            </div>
            <div className="sl-progress-stage-stat-value">
              {stageTarget || 'TBD'}
            </div>
          </div>
        </div>

        {/* Explainer + checkpoints */}
        <div className="sl-progress-stage-body">
          {/* LEFT: explainer content (always together) */}
          <div className="sl-progress-stage-col sl-progress-stage-col--explainer">
            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">
                What we do in this stage
              </h3>
              <p className="sl-progress-card-text">{activeStep.what}</p>
            </div>

            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">
                Why it matters for your drum
              </h3>
              <p className="sl-progress-card-text">{activeStep.why}</p>
            </div>

            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">Techniques used</h3>
              <div className="sl-progress-pill-row">
                {(Array.isArray(activeStep?.techniques)
                  ? activeStep.techniques
                  : []
                ).map((t, i) => (
                  <span key={`${t}-${i}`} className="sl-progress-pill">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">Tools involved</h3>
              <div className="sl-progress-pill-row">
                {(Array.isArray(activeStep?.tools) ? activeStep.tools : []).map(
                  (t, i) => (
                    <span key={`${t}-${i}`} className="sl-progress-pill">
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="sl-progress-card sl-progress-card--quote">
              <div className="sl-progress-quote-icon">★</div>
              <p className="sl-progress-quote-text">
                {activeStep.mantra ||
                  'This is the moment a stack of boards turns into a living, breathing shell.'}
              </p>
            </div>
          </div>

          {/* RIGHT: stage checkpoints */}
          <div className="sl-progress-stage-col sl-progress-stage-col--checkpoints">
            {isPhaseLockedByTeaser ? (
              <div className="pp-stage-card">
                <h4 className="pp-section-title">Stage checkpoints</h4>
                <p className="sl-progress-stage-locked-text">
                  Detailed, step-by-step checkpoints for the BUILD and
                  POST-BUILD phases unlock once we complete the full PRE-BUILD
                  phase together (Stages 1–3). For now, this view is a preview
                  of what the SoundLegend tracker will show as your drum moves
                  forward.
                </p>
              </div>
            ) : (
              <StageCheckpointsPanel
                key={activeStep.key}
                project={project}
                setProject={setProject}
                stageKey={activeStep.key}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>

        {/* Placeholder for “files for this step” */}
        <footer className="sl-progress-stage-footer">
          <p className="sl-progress-stage-files">
            Files for this step will appear here as we add photos, audio, and
            PDFs.
          </p>
        </footer>
      </section>
    </div>
  );
};

export default ProjectProgress;
