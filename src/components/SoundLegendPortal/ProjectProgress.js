// src/components/SoundLegendPortal/ProjectProgress.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import {
  STEPS,
  STEP_DEFS,
  STAGE_TEMPLATES,
} from '../../utils/workflowDefinitions';

import './ProjectProgress.css';

const CRAFT_VIDEO = '/craft_in_motion/craftinmotion1080p.mp4';

/** Normalized time weights (kept for reference if needed later) */
const STEP_WEIGHTS = {
  discoveryDesign: 0.0317,
  commitmentPortal: 0.0076,
  woodVision: 0.0382,
  rawShell: 0.1332,
  shellTrueingTorch: 0.2162,
  exteriorArt: 0.2838,
  edgesBeds: 0.0349,
  hardwareAssembly: 0.0775,
  legacyMedia: 0.1616,
  finalQa: 0.0153,
};

const STAGE_DAY_ESTIMATES = {
  discoveryDesign: 2,
  commitmentPortal: 1,
  woodVision: 3,
  rawShell: 4,
  shellTrueingTorch: 4,
  exteriorArt: 9,
  edgesBeds: 1,
  hardwareAssembly: 2,
  legacyMedia: 5,
  finalQa: 2,
};

/**
 * For storageKeys that are shared across multiple steps (like woodPreparation),
 * only the first step that uses that key will show extra internal checklist
 * items, to avoid repetition.
 */
const PRIMARY_BY_STORAGE_KEY = (() => {
  const map = {};
  STEPS.forEach((step) => {
    (step.storageKeys || []).forEach((key) => {
      if (!map[key]) {
        map[key] = step.key;
      }
    });
  });
  return map;
})();

/* =========================================================
   HELPERS
   ========================================================= */

const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  const patched = {
    ...data,
    woodPreparation: data.woodPreparation || data.discoveryDesign,
    shellConstruction: data.shellConstruction || data.commitmentPortal,
    fineTuning: data.fineTuning || data.woodVisionLockIn,
    shellExteriorFinish: data.shellExteriorFinish || data.rawShellCreation,
    bearingEdges: data.bearingEdges || data.shellTrueingTorchTune,
    snareBedCutting: data.snareBedCutting || data.exteriorArtFinish,
    hardwareDrilling: data.hardwareDrilling || data.edgesSnareBeds,
    hardwareAssembly: data.hardwareAssembly,
    tuningAndDetailing:
      data.tuningAndDetailing || data.legacyTuningMedia || data.tuningDetailing,
    qualityCheck: data.qualityCheck || data.finalQAPackagingDelivery,
  };

  return calculateProjectProgress(patched);
};

export function computeStageStatus(step) {
  if (!step || !Array.isArray(step.checklist)) {
    return 'not_started';
  }
  const items = step.checklist;
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
  const keys = stepDef.storageKeys || [];
  const items = [];
  keys.forEach((key) => {
    const section = project[key];
    if (section?.checklist && Array.isArray(section.checklist)) {
      section.checklist.forEach((i) => items.push(i));
    }
  });
  return items;
}

/** Determine status of a step based on its combined checklist */
function getStepStatus(project, stepDef) {
  const list = getCombinedChecklist(project, stepDef);
  if (!list.length) return { status: 'Not Started', done: 0, total: 0 };

  const done = list.filter((i) => i && i.completed).length;

  if (done === 0) return { status: 'Not Started', done: 0, total: list.length };
  if (done === list.length)
    return { status: 'Completed', done, total: list.length };
  return { status: 'In Progress', done, total: list.length };
}

/** Any extra checklist items that aren’t part of the curated weighted list */
function getExtraChecklistItems(project, stepDef) {
  const checklist = getCombinedChecklist(project, stepDef);
  if (!checklist.length) return [];

  const isPrimaryForAnyKey = (stepDef.storageKeys || []).some(
    (key) => PRIMARY_BY_STORAGE_KEY[key] === stepDef.key
  );
  if (!isPrimaryForAnyKey) return [];

  const cpSlugs = new Set(
    (stepDef.checkpoints || []).map((cp) => slugify(cp.label))
  );

  return checklist.filter((item) => {
    const taskSlug = slugify(item.label || item.task || '');
    return !cpSlugs.has(taskSlug);
  });
}

/** Percentage completion using the admin util (with key patching) */
function getOverallProgress(project) {
  if (!project) return 0;
  try {
    // 🔁 Make sure we feed the *patched* object into calculateProjectProgress,
    // so it matches what ManageProjects.js is doing.
    return Math.round(getWeightedProgressPct(project));
  } catch (e) {
    console.error('calculateProjectProgress failed; defaulting to 0', e);
    return 0;
  }
}

function normalizeProjectChecklistsToTemplates(project) {
  if (!project) return { next: project, changed: false };

  let changed = false;
  const next = { ...project };

  STEPS.forEach(({ key: stageKey }) => {
    const tpl = STAGE_TEMPLATES?.[stageKey];
    const def = STEP_DEFS?.[stageKey];
    const phaseKey = def?.storageKeys?.[0];

    if (!tpl?.steps?.length || !phaseKey) return;

    const phase =
      next[phaseKey] && typeof next[phaseKey] === 'object'
        ? next[phaseKey]
        : {};
    const existing = Array.isArray(phase.checklist) ? [...phase.checklist] : [];

    const normalized = tpl.steps.map((tplStep, idx) => {
      const cpCount = Array.isArray(tplStep.checkpoints)
        ? tplStep.checkpoints.length
        : 0;

      const prev =
        existing[idx] && typeof existing[idx] === 'object'
          ? { ...existing[idx] }
          : {};

      // Ensure checkpointStates length matches template
      const prevStates = Array.isArray(prev.checkpointStates)
        ? [...prev.checkpointStates]
        : [];
      const nextStates = Array.from(
        { length: cpCount },
        (_, i) => !!prevStates[i]
      );

      const done = nextStates.filter(Boolean).length;
      const isFullyComplete = cpCount > 0 && done === cpCount;

      // Preserve duration if present, but never invent it
      const durationMinutes = Number(prev.durationMinutes || 0);
      const totalSeconds = Number.isFinite(prev.totalSeconds)
        ? Number(prev.totalSeconds)
        : durationMinutes > 0
          ? durationMinutes * 60
          : 0;

      const out = {
        ...prev,
        // optional: keep a stable label if you want; otherwise omit
        label: prev.label || tplStep.label,
        checkpointStates: nextStates,
        completed: isFullyComplete,
        durationMinutes,
        totalSeconds,
      };

      // Detect whether we changed anything
      const prevJson = JSON.stringify({
        checkpointStates: prev.checkpointStates,
        completed: prev.completed,
        durationMinutes: prev.durationMinutes,
        totalSeconds: prev.totalSeconds,
        label: prev.label,
      });

      const outJson = JSON.stringify({
        checkpointStates: out.checkpointStates,
        completed: out.completed,
        durationMinutes: out.durationMinutes,
        totalSeconds: out.totalSeconds,
        label: out.label,
      });

      if (prevJson !== outJson) changed = true;

      return out;
    });

    next[phaseKey] = { ...phase, checklist: normalized };
  });

  return { next, changed };
}

// ✅ Global active sub-step pointer:
// Ensures exactly ONE sub-step is "IN PROGRESS" whenever project is not 100% complete.
function getGlobalActiveSubStep(project) {
  if (!project) return null;

  for (let s = 0; s < STEPS.length; s += 1) {
    const stageKey = STEPS[s].key;
    const tpl = STAGE_TEMPLATES?.[stageKey];
    const phaseKey = (STEP_DEFS?.[stageKey]?.storageKeys || [])[0];

    if (!tpl || !phaseKey) continue;

    const phase = project?.[phaseKey] || {};
    const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
    const stepsArr = tpl.steps || [];
    if (!stepsArr.length) continue;

    // Is the stage fully complete?
    const stageComplete = stepsArr.every((_, idx) => {
      const item = checklist[idx] || {};
      const states = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const total = states.length;
      const done = states.filter(Boolean).length;

      // If we have checkpointStates, use them. Otherwise fallback to item.completed.
      return total > 0 ? done === total : !!item.completed;
    });

    if (stageComplete) continue;

    // Pick the first incomplete sub-step in this stage
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

    // If stage isn't "complete" but we can't detect a sub-step, force step 0
    return { stageKey, stepIdx: 0 };
  }

  return null;
}

/** Derive current step index from currentPhase text if present */
function getCurrentStepIndex(project) {
  if (!project) return 0;

  // 1️⃣ Look at all steps and see if *anything* has been completed
  const stepSummaries = STEPS.map((s) => getStepStatus(project, s));
  const anyCompleted = stepSummaries.some(({ done }) => done > 0);

  // If NO checklist items are completed anywhere, treat this as a brand-new project
  // → force stage index 0 ("1. Discovery & Design")
  if (!anyCompleted) {
    return 0;
  }

  // 2️⃣ If we DO have some progress, try to honor currentPhase text first
  const phase = String(project.currentPhase || '').toLowerCase();
  if (phase) {
    const idx = STEPS.findIndex((s) =>
      phase.includes(String(s.label).split(' ')[0].toLowerCase())
    );
    if (idx >= 0) return idx;
  }

  // 3️⃣ Fallback: last step that has any completed checklist items
  let lastIdx = 0;
  STEPS.forEach((s, i) => {
    const { done } = getStepStatus(project, s);
    if (done > 0) lastIdx = i;
  });
  return lastIdx;
}

/** Stage completion target */
function getStageTargetDate(project, stepKey) {
  if (!project) return null;
  const stepDef = STEP_DEFS[stepKey];
  if (!stepDef) return null;

  const timestamps = [];
  for (const key of stepDef.storageKeys || []) {
    const step = project[key];
    if (!step || !Array.isArray(step.checklist)) continue;
    for (const item of step.checklist) {
      if (item.timestamp || item.completedAt) {
        timestamps.push(tsToMillis(item.timestamp || item.completedAt));
      }
    }
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

  Object.values(STEP_DEFS).forEach((stepDef) => {
    (stepDef.storageKeys || []).forEach((key) => {
      const step = project[key];
      if (!step || !Array.isArray(step.checklist)) return;
      step.checklist.forEach((item) => {
        if (item.timestamp || item.completedAt) {
          all.push(tsToMillis(item.timestamp || item.completedAt));
        }
      });
    });
  });

  if (all.length === 0) return null;
  const latest = Math.max(...all);
  const early = fmtDate(latest + 14 * DAY_MS);
  const late = fmtDate(latest + 28 * DAY_MS);
  return `${early} → ${late}`;
}

// 🔎 is this checklist item "touched" at all?
const isItemTouched = (item = {}) => {
  const done = !!item.completed;
  const hasCheckpoints =
    Array.isArray(item.checkpointStates) && item.checkpointStates.some(Boolean);
  return done || hasCheckpoints;
};

// 👉 figure out which checklist index is the "active" step
// for a given phase (e.g. 'rawShellCreation')
const getActiveStepIndexForPhase = (project, phaseKey) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length) return -1;

  // 1) first item with any checkpoints / completion but not fully done
  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i];
    const touched = isItemTouched(item);
    const done = !!item.completed;
    if (touched && !done) return i;
  }

  // 2) otherwise first incomplete item
  for (let i = 0; i < checklist.length; i += 1) {
    if (!checklist[i].completed) return i;
  }

  // 3) everything is done → no active step
  return -1;
};

// 🟢 derive a STATUS CODE for a specific step in a phase
// returns: 'completed' | 'inProgress' | 'notStarted'
const getStepStatusForPhase = (project, phaseKey, stepIndex) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length || stepIndex < 0 || stepIndex >= checklist.length) {
    return 'notStarted';
  }

  const item = checklist[stepIndex];
  const done = !!item.completed;
  const touched = isItemTouched(item);
  const activeIdx = getActiveStepIndexForPhase(project, phaseKey);

  if (done) return 'completed';
  if (stepIndex === activeIdx && touched) return 'inProgress';
  return 'notStarted';
};

// 🧮 how many checkpoints are completed for this step
const getCheckpointCountsForPhase = (project, phaseKey, stepIndex) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length || stepIndex < 0 || stepIndex >= checklist.length) {
    return { done: 0, total: 0 };
  }

  const item = checklist[stepIndex];
  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : [];

  const done = states.filter(Boolean).length;
  const total = states.length;
  return { done, total };
};

// Stage indexes: 0–2 = PRE-BUILD, 3–7 = BUILD, 8–9 = POST-BUILD
const PREBUILD_STAGE_INDEXES = [0, 1, 2];

const getPhaseIndexForStep = (stepIndex) => {
  if (stepIndex <= 2) return 0; // PRE-BUILD (stages 1–3)
  if (stepIndex <= 7) return 1; // BUILD (stages 4–8)
  return 2; // POST-BUILD (stages 9–10)
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
  // ---------- single-open accordion state ----------
  const [openStepId, setOpenStepId] = useState(null);
  const userToggledRef = useRef(false);

  // ---------- duration modal state ----------
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const template = STAGE_TEMPLATES?.[stageKey] || null;

  // Map stageKey (e.g. 'rawShell') → phase key used in Firestore
  const stepMeta = STEP_DEFS?.[stageKey] || null;
  const phaseKey = stepMeta?.storageKeys?.[0] || null;

  const phaseChecklist = useMemo(() => {
    const phase = phaseKey && project ? project?.[phaseKey] : null;
    return Array.isArray(phase?.checklist) ? phase.checklist : [];
  }, [project, phaseKey]);

  const lifecycleSteps = useMemo(() => {
    const lifecycleStage = project?.lifecycle?.stages?.[stageKey];
    const stepsObj = lifecycleStage?.steps || null;
    return stepsObj ? Object.values(stepsObj) : [];
  }, [project, stageKey]);

  const normalizedSteps = useMemo(() => {
    const tplSteps = template?.steps || [];

    // ✅ Global active sub-step pointer (ONE "IN PROGRESS" across the whole project)
    const overallPct = getOverallProgress(project);
    const globalPtr = overallPct < 100 ? getGlobalActiveSubStep(project) : null;

    return tplSteps.map((tplStep, idx) => {
      const labels = tplStep.checkpoints || [];

      let checkpointStates = [];
      let completedFlag = false;
      let stepDurationMinutes = 0;

      // ---- 1) PRIMARY: top-level phase checklist ----
      const phaseItem = phaseChecklist[idx];
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

        completedFlag = !!phaseItem.completed;
      }

      // ---- 2) FALLBACK: lifecycle ----
      if (!checkpointStates.length && lifecycleSteps.length) {
        const tplSlug = slugify(tplStep.label);
        const dbStep =
          lifecycleSteps.find((s) => slugify(s.label || '') === tplSlug) ||
          lifecycleSteps[idx];

        if (dbStep) {
          const cpsObj = dbStep.checkpoints || {};
          const cpsArr = Object.values(cpsObj).sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          checkpointStates = cpsArr.map((c) => !!c.completed);
          completedFlag = completedFlag || !!dbStep.completed;
        }
      }

      const checkpoints = labels.map((cpLabel, cpIndex) => ({
        id: `${tplStep.key}_cp_${cpIndex}`,
        label: cpLabel,
        completed: !!checkpointStates[cpIndex],
      }));

      const total = checkpoints.length;
      const done = checkpoints.filter((c) => c.completed).length;

      const isComplete = total > 0 && (completedFlag || done === total);

      const isGlobalActive =
        !!globalPtr &&
        globalPtr.stageKey === stageKey &&
        globalPtr.stepIdx === idx;

      let status = 'NOT STARTED';
      if (isComplete) status = 'COMPLETED';
      else if (isGlobalActive) status = 'IN PROGRESS';

      return {
        id: `${stageKey}_${tplStep.key}`,
        label: tplStep.label,
        order: idx + 1,
        checkpoints,
        total,
        done,
        status,
        durationMinutes: stepDurationMinutes,
      };
    });
  }, [template, stageKey, phaseChecklist, lifecycleSteps, project, phaseKey]);

  // ✅ Normalize checklist shapes to match templates (and optionally persist for admins)
  useEffect(() => {
    if (!project) return;

    const { next, changed } = normalizeProjectChecklistsToTemplates(project);
    if (!changed) return;

    // Update local state so UI always has consistent checkpointStates lengths
    if (typeof setProject === 'function') {
      setProject(next);
    }

    // Optional: if admin, persist the repaired shapes to Firestore once
    if (isAdmin && next?.id) {
      const ref = doc(db, 'projects', next.id);

      const payload = {};
      STEPS.forEach(({ key: sKey }) => {
        const pk = STEP_DEFS?.[sKey]?.storageKeys?.[0];
        if (!pk) return;
        if (next?.[pk]?.checklist) {
          payload[`${pk}.checklist`] = next[pk].checklist;
        }
      });

      updateDoc(ref, payload).catch((e) =>
        console.error('Failed to persist normalized checklists', e)
      );
    }
  }, [project, isAdmin, setProject]);

  // ✅ Auto-open the best sub-step for the CURRENT stage
  useEffect(() => {
    if (!project || !normalizedSteps.length) {
      setOpenStepId(null);
      return;
    }

    const currentStageIndex = getCurrentStepIndex(project);
    const thisStageIndex = STEPS.findIndex((s) => s.key === stageKey);
    const isCurrentStage = thisStageIndex === currentStageIndex;

    // If not the current stage, don't auto-open anything
    if (!isCurrentStage) {
      setOpenStepId(null);
      userToggledRef.current = false; // reset when leaving stage
      return;
    }

    setOpenStepId((prev) => {
      // If user has interacted in this stage, respect their choice (including closing)
      if (userToggledRef.current) return prev;

      // If something is already open and still valid, keep it
      if (prev && normalizedSteps.some((s) => s.id === prev)) return prev;

      // Otherwise choose best candidate
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

  // ✅ Firestore update helper
  // ✅ 1) Toggle a checkpoint complete/incomplete (NO duration here)
  const persistCheckpointToggle = async ({
    phaseKeyArg,
    stepIdx,
    cpIdx,
    completed,
  }) => {
    if (!project?.id || !phaseKeyArg) return;

    const ref = doc(db, 'projects', project.id);

    const phase = project?.[phaseKeyArg] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    const stepItemRaw = checklist[stepIdx] || {};
    const stepItem = { ...stepItemRaw };

    const states = Array.isArray(stepItem.checkpointStates)
      ? [...stepItem.checkpointStates]
      : [];

    states[cpIdx] = !!completed;
    stepItem.checkpointStates = states;

    // ✅ recompute completion from checkpointStates
    const total = states.length;
    const done = states.filter(Boolean).length;
    const isFullyComplete = total > 0 && done === total;

    // ✅ IMPORTANT: keep stepItem.completed in sync with checkpoints
    stepItem.completed = isFullyComplete;

    // ✅ if not fully complete, clear duration (so "completed" doesn't imply time logged)
    if (!isFullyComplete) {
      stepItem.durationMinutes = 0;
      stepItem.totalSeconds = 0;
    }

    checklist[stepIdx] = stepItem;

    // patch local project
    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [phaseKeyArg]: {
            ...(prev[phaseKeyArg] || {}),
            checklist,
          },
        };
      });
    }

    await updateDoc(ref, {
      [`${phaseKeyArg}.checklist`]: checklist,
    });
  };

  // ✅ 3) Mark ALL checkpoints complete for a sub-step
  const persistMarkAllComplete = async ({ phaseKeyArg, stepIdx, total }) => {
    if (!project?.id || !phaseKeyArg) return;

    const ref = doc(db, 'projects', project.id);

    const phase = project?.[phaseKeyArg] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    const stepItemRaw = checklist[stepIdx] || {};
    const stepItem = { ...stepItemRaw };

    const totalCount = Number.isFinite(total) ? total : 0;

    // Ensure we have an array of the correct length
    const nextStates = Array.from({ length: totalCount }, () => true);

    stepItem.checkpointStates = nextStates;

    // ✅ completed MUST be true if we just set all checkpoints true
    stepItem.completed = totalCount > 0;

    // Do NOT auto-set duration; admin logs it explicitly
    stepItem.durationMinutes = Number(stepItem.durationMinutes || 0);
    stepItem.totalSeconds = Number(stepItem.totalSeconds || 0);

    checklist[stepIdx] = stepItem;

    // patch local state
    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [phaseKeyArg]: {
            ...(prev[phaseKeyArg] || {}),
            checklist,
          },
        };
      });
    }

    await updateDoc(ref, {
      [`${phaseKeyArg}.checklist`]: checklist,
    });
  };

  const handleMarkAllComplete = async ({ phaseKeyArg, stepIdx, total }) => {
    if (!isAdmin) return;
    try {
      await persistMarkAllComplete({ phaseKeyArg, stepIdx, total });
    } catch (e) {
      console.error('Failed marking all complete', e);
    }
  };

  // ✅ 2) Save duration at the SUB-STEP level (only after fully complete)
  const persistStepDuration = async ({
    phaseKeyArg,
    stepIdx,
    durationMinutes,
  }) => {
    if (!project?.id || !phaseKeyArg) return;

    const ref = doc(db, 'projects', project.id);

    const phase = project?.[phaseKeyArg] || {};
    const checklist = Array.isArray(phase.checklist)
      ? [...phase.checklist]
      : [];

    const stepItemRaw = checklist[stepIdx] || {};
    const stepItem = { ...stepItemRaw };

    const states = Array.isArray(stepItem.checkpointStates)
      ? [...stepItem.checkpointStates]
      : [];

    const total = states.length;
    const done = states.filter(Boolean).length;
    const isFullyComplete = total > 0 && done === total;

    // guard: only allow duration when fully completed
    if (!isFullyComplete) return;

    const mins = Math.max(0, Number(durationMinutes || 0));
    stepItem.durationMinutes = mins;
    stepItem.totalSeconds = mins * 60;

    checklist[stepIdx] = stepItem;

    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [phaseKeyArg]: {
            ...(prev[phaseKeyArg] || {}),
            checklist,
          },
        };
      });
    }

    await updateDoc(ref, {
      [`${phaseKeyArg}.checklist`]: checklist,
    });
  };

  const openDurationModal = ({ phaseKeyArg, stepIdx }) => {
    setPending({ phaseKey: phaseKeyArg, stepIdx });
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
    if (!pending?.phaseKey) return;

    const durMins = Number(hours) * 60 + Number(minutes);

    setSaving(true);
    try {
      await persistStepDuration({
        phaseKeyArg: pending.phaseKey,
        stepIdx: pending.stepIdx,
        durationMinutes: durMins,
      });
      closeDurationModal();
    } catch (e) {
      console.error('Failed saving step duration', e);
      setSaving(false);
    }
  };

  const handleToggleCheckpoint = async ({
    phaseKeyArg,
    stepIdx,
    cpIdx,
    nextChecked,
  }) => {
    if (!isAdmin) return;

    try {
      await persistCheckpointToggle({
        phaseKeyArg,
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
              className={`pp-step-block step-${String(status).toLowerCase().replace(/\s+/g, '-')}`}
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
                    {isAdmin && total > 0 && done < total && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="pp-step-markall-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ don't collapse accordion
                          handleMarkAllComplete({
                            phaseKeyArg: phaseKey,
                            stepIdx,
                            total,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAllComplete({
                              phaseKeyArg: phaseKey,
                              stepIdx,
                              total,
                            });
                          }
                        }}
                      >
                        Mark all complete
                      </span>
                    )}

                    {/* ✅ Sub-step duration (admin only) */}
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
                              e.stopPropagation(); // don't collapse accordion
                              openDurationModal({
                                phaseKeyArg: phaseKey,
                                stepIdx,
                              });
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
                    <span className="pp-step-count">
                      {done === total
                        ? 'Fully completed'
                        : `${done}/${total} completed`}
                    </span>
                  </div>

                  <span
                    className={`pp-step-status pill ${statusClass(status)}`}
                  >
                    {status}
                  </span>
                </div>
              )}

              {isOpen &&
                (isAdmin ? (
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
                                phaseKeyArg: phaseKey,
                                stepIdx,
                                cpIdx,
                                nextChecked: !cp.completed,
                              })
                            }
                          >
                            {cp.completed ? '✓' : ''}
                          </button>

                          <span
                            className={`pp-checkpoint-label ${cp.completed ? 'is-completed' : ''}`}
                          >
                            {cp.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="checkpoint-hidden-note">
                    Detailed internal checkpoints are workshop-only.
                  </div>
                ))}
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

  // ✅ define this (and only use it when not complete)
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

  // keep in sync if parent passes updated project
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  // fetch freshest data from Firestore if we can
  useEffect(() => {
    const ref = getProjectDocRef(initialProject);
    if (!ref) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const snap = await getDoc(ref);
        if (snap.exists() && isMounted) {
          setProject({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error('Failed to refresh project for ProjectProgress', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialProject]);

  const overallPct = useMemo(() => getOverallProgress(project), [project]);

  const targetWindow = useMemo(() => getTargetWindow(project), [project]);

  // If there is zero progress on the project, always treat it as being at Stage 1
  const currentStepIndex = useMemo(
    () => (overallPct === 0 ? 0 : getCurrentStepIndex(project)),
    [project, overallPct]
  );

  // Have we finished all PRE-BUILD stages (1–3)?
  const prebuildComplete = useMemo(
    () => arePrebuildStagesComplete(project),
    [project]
  );

  const { stageLabel: currentStageLabel, stepLabel: currentStepLabel } =
    useMemo(() => getCurrentStageAndStepLabels(project), [project]);
  // default active step = current step
  useEffect(() => {
    const def = STEPS[currentStepIndex] || STEPS[0];
    setActiveKey(def.key);
  }, [currentStepIndex]);

  const activeStep = STEPS.find((s) => s.key === activeKey) || STEPS[0];
  const activeStatusRaw = getStepStatus(project, activeStep).status; // "In Progress"
  const activeStatus = String(activeStatusRaw || '')
    .toLowerCase()
    .replace(/\s+/g, '_'); // "in_progress"

  const stageTarget = useMemo(
    () => getStageTargetDate(project, activeStep.key),
    [project, activeStep.key]
  );

  const activeIndex = STEPS.indexOf(activeStep);

  // "Future stage" lock (for the little note under the roadmap)
  const isStageFuture =
    activeStatus === 'not_started' && activeIndex > currentStepIndex;

  // For brand-new projects, let stages 1–3 behave as unlocked teaser stages
  const isStageLocked =
    isStageFuture && !(overallPct === 0 && activeIndex <= 2);

  // Phase-level lock: BUILD + POST-BUILD stay teaser-only until pre-build done
  const isPhaseLockedByTeaser =
    !prebuildComplete && getPhaseIndexForStep(activeIndex) > 0;

  const heroMedia = useMemo(() => ({ type: 'video', url: CRAFT_VIDEO }), []);

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
        {heroMedia.type === 'video' ? (
          <video
            className="sl-progress-hero-video"
            src={heroMedia.url}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : null}
        {/* <button className="sl-progress-hero-pill">Craft in Motion</button> */}
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
        {/* 1. Project completion */}
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Project completion</div>
          <div className="sl-progress-metric-value">
            {overallPct != null ? `${overallPct}%` : '—'}
          </div>
        </div>

        {/* 2. Project current stage (STAGE ONLY) */}
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Project current stage</div>
          <div className="sl-progress-metric-value">{currentStageLabel}</div>
        </div>

        {/* 3. Current stage step (SUB-STEP) */}
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Current stage step</div>
          <div className="sl-progress-metric-value">{currentStepLabel}</div>
        </div>

        {/* 4. Target completion window */}
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">
            Target completion window
          </div>
          <div className="sl-progress-metric-value">
            {targetWindow || 'TBD'}
          </div>
        </div>
      </div>

      {/* Roadmap timeline (progress bar stays here) */}
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

      {/* Active step details */}
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

            // Phase-level lock: any BUILD or POST-BUILD stage (index >= 3)
            // stays locked until all PRE-BUILD stages are completed.
            const phaseLocked =
              !prebuildComplete && getPhaseIndexForStep(index) > 0;

            // Default: future stages are locked until we reach them
            const futureLocked =
              stepStatus === 'not_started' && index > currentStepIndex;

            let isLocked = phaseLocked || futureLocked;

            // 🔓 Brand-new project teaser rule:
            // when overall progress is 0%, allow the first three stages (0–2)
            // to be clickable so the artist can explore pre-build.
            if (overallPct === 0 && index <= 2) {
              isLocked = false;
            }

            const className = [
              'sl-progress-step-dot',
              isCurrent ? 'is-current' : '',
              isCompleted ? 'is-completed' : '',
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
                <span className="sl-progress-step-number">{index + 1}</span>
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
    {(Array.isArray(activeStep?.techniques) ? activeStep.techniques : []).map(
      (t, i) => (
        <span key={`${t}-${i}`} className="sl-progress-pill">
          {t}
        </span>
      )
    )}
  </div>
</div>

<div className="sl-progress-card">
  <h3 className="sl-progress-card-title">Tools involved</h3>
  <div className="sl-progress-pill-row">
    {(Array.isArray(activeStep?.tools) ? activeStep.tools : []).map((t, i) => (
      <span key={`${t}-${i}`} className="sl-progress-pill">
        {t}
      </span>
    ))}
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
