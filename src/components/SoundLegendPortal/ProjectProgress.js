import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import { STAGES, STAGE_TEMPLATES } from '../../utils/workflowDefinitions';
import { PROJECT_STAGE_EDU } from '../../utils/projectStageEducation';
import './ProjectProgress.css';

const FALLBACK_VIDEO = '/craft_in_motion/craftinmotion1080p.mp4';

const STAGE_MEDIA_BASENAMES = {
  discoveryDesign: 'stage-discovery-design',
  commitmentPortal: 'stage-commitment-portal',
  woodVisionLockIn: 'stage-wood-vision-lock-in',
  rawShellCreation: 'stage-build-raw-shell-creation',
  shellTrueingTorchTune: 'stage-build-shell-trueing-torch-tune',
  exteriorArtFinish: 'stage-build-exterior-art-finish',
  edgesSnareBeds: 'stage-build-edges-snare-beds',
  hardwareAssembly: 'stage-build-hardware-assembly',
  legacyTuningMedia: 'stage-legacy-tuning-media',
  finalQAPackagingDelivery: 'stage-final-qa-packaging-delivery',
};

const STAGE_MEDIA_STATE = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
};

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
    avgDays: edu.avgDays || '—',
    mantra: edu.value || '',

    storageKeys: [s.stageKey],
  };
});

const STEP_DEFS = STEPS.reduce((acc, s) => {
  acc[s.key] = s;
  return acc;
}, {});

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

const STAGEKEY_TO_CANONICAL_STEPKEY = {
  discoveryDesign: 'discoveryDesign',
  commitmentPortal: 'commitmentPortal',

  woodVision: 'woodVisionLockIn',
  rawShell: 'rawShellCreation',
  shellTrueingTorch: 'shellTrueingTorchTune',
  exteriorArt: 'exteriorArtFinish',
  edgesBeds: 'edgesSnareBeds',
  legacyMedia: 'legacyTuningMedia',
  finalQa: 'finalQAPackagingDelivery',

  woodVisionLockIn: 'woodVisionLockIn',
  rawShellCreation: 'rawShellCreation',
  shellTrueingTorchTune: 'shellTrueingTorchTune',
  exteriorArtFinish: 'exteriorArtFinish',
  edgesSnareBeds: 'edgesSnareBeds',
  hardwareAssembly: 'hardwareAssembly',
  legacyTuningMedia: 'legacyTuningMedia',
  finalQAPackagingDelivery: 'finalQAPackagingDelivery',
};

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
  const MIN_UNLOCKED = 2;

  if (!project) return MIN_UNLOCKED;

  for (let i = 0; i < STEPS.length; i += 1) {
    const status = getStepStatus(project, STEPS[i]).status;
    if (status !== 'Completed') {
      return Math.max(MIN_UNLOCKED, i);
    }
  }

  return STEPS.length - 1;
}

function canonicalKeyForStage(stageKey) {
  return STAGEKEY_TO_CANONICAL_STEPKEY[stageKey] || stageKey;
}

function getExistingPhaseKey(project, canonicalKey) {
  if (!project || !canonicalKey) return null;

  const canonicalValue = project?.[canonicalKey];
  if (
    canonicalValue &&
    typeof canonicalValue === 'object' &&
    Array.isArray(canonicalValue.checklist)
  ) {
    return canonicalKey;
  }

  const fallbacks = LEGACY_STEPKEY_FALLBACKS[canonicalKey] || [];
  for (const k of fallbacks) {
    const fallbackValue = project?.[k];
    if (
      fallbackValue &&
      typeof fallbackValue === 'object' &&
      Array.isArray(fallbackValue.checklist)
    ) {
      return k;
    }
  }

  return canonicalKey;
}

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

const WEEKEND_WORK_HOURS_PER_DAY = 8;
const WEEKEND_DAY_INDEXES = new Set([0, 6]);

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

function normalizeAssetName(value = '') {
  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

function parseHourRangeText(estHoursText = '') {
  const source = String(estHoursText || '')
    .toLowerCase()
    .trim();
  if (!source || source === '—') return { min: 0, max: 0 };

  const matches = source.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return { min: 0, max: 0 };

  const nums = matches.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return { min: 0, max: 0 };

  if (nums.length === 1) return { min: nums[0], max: nums[0] };

  return {
    min: Math.min(nums[0], nums[1]),
    max: Math.max(nums[0], nums[1]),
  };
}

function weekendHoursToWorkdays(hours = 0) {
  if (!hours || hours <= 0) return 0;
  return Math.ceil(hours / WEEKEND_WORK_HOURS_PER_DAY);
}

function isWeekendDate(date) {
  return WEEKEND_DAY_INDEXES.has(date.getDay());
}

function getSchedulingBaseDate(project) {
  const loggedTimes = [];

  CANONICAL_STEP_KEYS.forEach((canonicalKey) => {
    const phaseKey = getExistingPhaseKey(project, canonicalKey);
    const step = project?.[phaseKey];

    if (!step || !Array.isArray(step.checklist)) return;

    step.checklist.filter(Boolean).forEach((item) => {
      const ts =
        item?.completedAt ||
        item?.timestamp ||
        item?.updatedAt ||
        item?.finishedAt ||
        null;

      const ms = tsToMillis(ts);
      if (ms) loggedTimes.push(ms);
    });
  });

  const latestLoggedMs = loggedTimes.length ? Math.max(...loggedTimes) : 0;
  const nowMs = Date.now();

  return new Date(Math.max(nowMs, latestLoggedMs || 0));
}

function advanceToNextWeekendWorkday(dateInput) {
  const d = new Date(dateInput);
  d.setHours(12, 0, 0, 0);

  while (!isWeekendDate(d)) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

function addWeekendWorkdays(startDateInput, workdaysNeeded = 0) {
  let remaining = Math.max(0, Math.ceil(workdaysNeeded));
  let cursor = advanceToNextWeekendWorkday(startDateInput);

  if (remaining === 0) return cursor;

  while (remaining > 1) {
    cursor.setDate(cursor.getDate() + 1);
    cursor = advanceToNextWeekendWorkday(cursor);
    remaining -= 1;
  }

  return cursor;
}

function getStepHourRange(step) {
  if (!step) return { min: 0, max: 0 };
  return parseHourRangeText(step.estHours);
}

function getRemainingStageHourRange(project, fromIndex, toIndex) {
  let minHours = 0;
  let maxHours = 0;

  for (let i = fromIndex; i <= toIndex; i += 1) {
    const step = STEPS[i];
    if (!step) continue;

    const status = getStepStatus(project, step).status;
    if (status === 'Completed') continue;

    const range = getStepHourRange(step);
    minHours += range.min;
    maxHours += range.max;
  }

  return { minHours, maxHours };
}

function getProjectedWeekendRangeFromHours(baseDate, minHours, maxHours) {
  if (minHours <= 0 && maxHours <= 0) {
    return { early: null, late: null };
  }

  const earlyWorkdays = weekendHoursToWorkdays(minHours);
  const lateWorkdays = weekendHoursToWorkdays(maxHours);

  const earlyDate = addWeekendWorkdays(baseDate, Math.max(earlyWorkdays, 1));
  const lateDate = addWeekendWorkdays(baseDate, Math.max(lateWorkdays, 1));

  return {
    early: fmtDate(earlyDate),
    late: fmtDate(lateDate),
  };
}

function getSelectedStageMediaState(selectedIndex, currentIndex) {
  if (selectedIndex < currentIndex) return STAGE_MEDIA_STATE.UNLOCKED;
  if (selectedIndex > currentIndex) return STAGE_MEDIA_STATE.LOCKED;
  return STAGE_MEDIA_STATE.ACTIVE;
}

function getStageAssetConfig(stageKey, mediaState) {
  const baseName = STAGE_MEDIA_BASENAMES[stageKey];
  if (!baseName) return null;

  if (mediaState === STAGE_MEDIA_STATE.ACTIVE) {
    return {
      type: 'video',
      folderPath: 'project-stage-media/active',
      fileName: `${baseName}-active.mp4`,
    };
  }

  if (mediaState === STAGE_MEDIA_STATE.LOCKED) {
    return {
      type: 'video',
      folderPath: 'project-stage-media/locked',
      fileName: `${baseName}-locked.mp4`,
    };
  }

  return {
    type: 'image',
    folderPath: 'project-stage-media/unlocked',
    fileName: `${baseName}-unlocked.png`,
  };
}

async function fetchStorageAssetUrl(folderPath, expectedFilename) {
  const folderRef = storageRef(storage, folderPath);
  const folderList = await listAll(folderRef);
  const normalizedExpected = normalizeAssetName(expectedFilename);

  const matchedItem = folderList.items.find(
    (item) => normalizeAssetName(item.name) === normalizedExpected
  );

  if (!matchedItem) return null;

  return getDownloadURL(matchedItem);
}

async function resolveStageMediaUrl(stageKey, mediaState) {
  if (!stageKey) return null;

  const assetConfig = getStageAssetConfig(stageKey, mediaState);
  if (!assetConfig) return null;

  const url = await fetchStorageAssetUrl(
    assetConfig.folderPath,
    assetConfig.fileName
  );

  if (!url) return null;

  return {
    type: assetConfig.type,
    url,
  };
}

function getStageSummary(step) {
  const source = step?.what || '';
  if (!source) return 'A refined look at this phase of your SoundLegend build.';

  const firstSentence = source.split('. ')[0]?.trim();
  if (!firstSentence) return source;

  return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;
}

function getStageViewerStateLabel(selectedIndex, currentIndex) {
  if (selectedIndex < currentIndex) return 'Completed milestone';
  if (selectedIndex > currentIndex) return 'Preview only';
  return 'Currently in progress';
}

function getStageViewerEyebrow(selectedIndex, currentIndex) {
  if (selectedIndex < currentIndex) return 'Stage Archive';
  if (selectedIndex > currentIndex) return 'Future Stage Preview';
  return 'Live Build Stage';
}

function getCombinedChecklist(project, stepDef) {
  if (!project || !stepDef) return [];

  const stageKey = stepDef.key || stepDef.stageKey;
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

function getOverallProgress(project) {
  if (!project) return 0;

  try {
    return Math.round(getWeightedProgressPct(project));
  } catch (e) {
    console.error('calculateProjectProgress failed; defaulting to 0', e);
    return 0;
  }
}

function getGlobalActiveSubStep(project) {
  if (!project) return null;

  for (let s = 0; s < STEPS.length; s += 1) {
    const stageKey = STEPS[s].key;
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

function getCurrentStepIndex(project) {
  if (!project) return 0;

  const activePtr = getGlobalActiveSubStep(project);
  if (activePtr?.stageKey) {
    const activeStageIndex = STEPS.findIndex(
      (step) => step.key === activePtr.stageKey
    );
    if (activeStageIndex >= 0) return activeStageIndex;
  }

  const summaries = STEPS.map((step) => getStepStatus(project, step));
  const allCompleted =
    summaries.length > 0 &&
    summaries.every(
      (s) => String(s.status || '').toLowerCase() === 'completed'
    );

  if (allCompleted) return STEPS.length - 1;

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

function getStageTargetDate(project, stageKey) {
  if (!project) return null;

  const selectedStageIndex = STEPS.findIndex((s) => s.key === stageKey);
  if (selectedStageIndex < 0) return null;

  const stageDef = STEPS[selectedStageIndex];
  const stageStatus = getStepStatus(project, stageDef).status;

  const canonical = canonicalKeyForStage(stageKey);
  const phaseKey = getExistingPhaseKey(project, canonical);
  const step = project?.[phaseKey];

  if (stageStatus === 'Completed') {
    if (step?.checklist && Array.isArray(step.checklist)) {
      const actualCompletionTimes = step.checklist
        .filter(Boolean)
        .map((item) =>
          tsToMillis(
            item?.completedAt ||
              item?.timestamp ||
              item?.updatedAt ||
              item?.finishedAt ||
              null
          )
        )
        .filter(Boolean);

      if (actualCompletionTimes.length > 0) {
        return fmtDate(Math.max(...actualCompletionTimes));
      }
    }

    return 'Completed';
  }

  const baseDate = getSchedulingBaseDate(project);
  if (!baseDate) return null;

  const time = PROJECT_STAGE_EDU?.[stageKey]?.time || {};
  const minHours = Number(time.min || 0);
  const maxHours = Number(time.max || 0);

  if (!maxHours) return null;

  const projected = getProjectedWeekendRangeFromHours(
    baseDate,
    minHours,
    maxHours
  );

  return projected.late || projected.early || null;
}

function getTargetWindow(project) {
  if (!project) return null;

  const currentStageIndex = getCurrentStepIndex(project);
  const lastStageIndex = STEPS.length - 1;

  const baseDate = getSchedulingBaseDate(project);
  const { minHours, maxHours } = getRemainingStageHourRange(
    project,
    currentStageIndex,
    lastStageIndex
  );

  if (!minHours && !maxHours) return null;

  const projected = getProjectedWeekendRangeFromHours(
    baseDate,
    minHours,
    maxHours
  );

  if (projected.early && projected.late && projected.early !== projected.late) {
    return `${projected.early} → ${projected.late}`;
  }

  return projected.early || projected.late || null;
}

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

  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i] || {};
    const touched = isItemTouched(item);
    const done = !!item.completed;
    if (touched && !done) return i;
  }

  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i] || {};
    if (!item.completed) return i;
  }

  return -1;
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

  const normalizedSteps = useMemo(() => {
    const tplSteps = template?.steps || [];

    const overallPct = getOverallProgress(project);
    const globalPtr = overallPct < 100 ? getGlobalActiveSubStep(project) : null;

    return tplSteps.map((tplStep, idx) => {
      const phaseItem = phaseChecklist[idx];

      const tplStepId =
        tplStep?.id || tplStep?.key || `${stageKey}_step_${idx}`;
      const tplStepLabel =
        tplStep?.adminMainTitle ||
        tplStep?.label ||
        tplStep?.adminLeftShort ||
        `Step ${idx + 1}`;

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
        label: cpObj?.ui || cpObj?.book || `Checkpoint ${cpIndex + 1}`,
        details: Array.isArray(cpObj?.details) ? cpObj.details : [],
        completed: !!checkpointStates[cpIndex],
      }));

      const total = checkpoints.length;
      const done = checkpoints.filter((c) => c.completed).length;
      const isComplete = total > 0 && done === total;

      const isGlobalActive =
        !!globalPtr &&
        globalPtr.stageKey === stageKey &&
        globalPtr.stepIdx === idx;

      let status = 'NOT STARTED';
      if (isComplete) status = 'COMPLETED';
      else if (isGlobalActive) status = 'IN PROGRESS';

      return {
        id: `${stageKey}_${tplStepId}`,
        label: tplStepLabel,
        order: idx + 1,
        checkpoints,
        total,
        done,
        status,
        durationMinutes: stepDurationMinutes,
      };
    });
  }, [template, stageKey, phaseChecklist, project]);

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

  const persistCheckpointToggle = async ({ stepIdx, cpIdx, completed }) => {
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

    checklist[stepIdx] = {
      ...stepItem,
      checkpointStates: states,
      completed: isFullyComplete,
      ...(isFullyComplete ? {} : { durationMinutes: 0, totalSeconds: 0 }),
    };

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

        return {
          ...prev,
          [canonical]: { ...prevPhase, checklist: prevChecklist },
        };
      });
    }

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

  if (!project || !template) return null;

  const HOURS_OPTIONS = Array.from({ length: 25 }, (_, i) => i);
  const MINUTES_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="pp-stage-card">
      <div className="pp-stage-card-header">
        <div>
          <div className="pp-section-eyebrow">Build Checkpoints</div>
          <h4 className="pp-section-title">Internal checkpoints</h4>
        </div>
      </div>

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
   COMPONENT HELPERS
   ========================================================= */

function getTemplateStepDisplayLabel(step) {
  if (!step) return 'No sub-step selected';

  return (
    step.adminMainTitle ||
    step.label ||
    step.adminLeftShort ||
    step.title ||
    'No sub-step selected'
  );
}

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
    const activeStepDef = stepsArr[activePtr.stepIdx];

    if (activeStepDef) {
      stepLabel = getTemplateStepDisplayLabel(activeStepDef);
    }
  }

  return { stageLabel, stepLabel };
}

/* =========================================================
   COMPONENT
   ========================================================= */

const ProjectProgress = ({ project: initialProject, isAdmin = false }) => {
  const [project, setProject] = useState(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [activeKey, setActiveKey] = useState(STEPS[0].key);

  const [heroVideoUrl, setHeroVideoUrl] = useState(FALLBACK_VIDEO);
  const [heroVideoCache, setHeroVideoCache] = useState({});

  const [selectedStageMedia, setSelectedStageMedia] = useState({
    type: null,
    url: '',
  });
  const [selectedStageMediaCache, setSelectedStageMediaCache] = useState({});
  const [adjacentStageMedia, setAdjacentStageMedia] = useState({
    prev: { type: null, url: '' },
    next: { type: null, url: '' },
  });
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

  const currentStageKey = useMemo(
    () => (STEPS[currentStepIndex] || STEPS[0]).key,
    [currentStepIndex]
  );

  const unlockedUntilIndex = useMemo(
    () => getUnlockMaxStageIndex(project),
    [project]
  );

  const { stageLabel: currentStageLabel, stepLabel: currentStepLabel } =
    useMemo(() => getCurrentStageAndStepLabels(project), [project]);

  useEffect(() => {
    if (!project?.id) return;
    const def = STEPS[currentStepIndex] || STEPS[0];
    setActiveKey(def.key);
  }, [project?.id, currentStepIndex]);

  const activeStep = STEPS.find((s) => s.key === activeKey) || STEPS[0];
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  const prevStep = activeIndex > 0 ? STEPS[activeIndex - 1] : null;
  const nextStep =
    activeIndex < STEPS.length - 1 ? STEPS[activeIndex + 1] : null;

  const currentStageStatus = getSelectedStageMediaState(
    activeIndex,
    currentStepIndex
  );

  useEffect(() => {
    let cancelled = false;

    const loadHeroVideo = async () => {
      const stageKey = activeStep?.key;

      if (!stageKey) {
        setHeroVideoUrl(FALLBACK_VIDEO);
        return;
      }

      if (heroVideoCache[stageKey]) {
        setHeroVideoUrl(heroVideoCache[stageKey]);
        return;
      }

      const assetConfig = getStageAssetConfig(
        stageKey,
        getSelectedStageMediaState(activeIndex, currentStepIndex)
      );

      if (!assetConfig) {
        setHeroVideoUrl(FALLBACK_VIDEO);
        return;
      }

      try {
        const url = await fetchStorageAssetUrl(
          assetConfig.folderPath,
          assetConfig.fileName
        );

        if (cancelled) return;

        if (!url) {
          console.error(
            `No hero media found for ${stageKey}. Expected: ${assetConfig.fileName}`
          );
          setHeroVideoUrl(FALLBACK_VIDEO);
          return;
        }

        setHeroVideoCache((prev) => ({
          ...prev,
          [stageKey]: url,
        }));
        setHeroVideoUrl(url);
      } catch (err) {
        console.error(`Failed loading hero media for ${stageKey}:`, err);
        if (!cancelled) setHeroVideoUrl(FALLBACK_VIDEO);
      }
    };

    loadHeroVideo();

    return () => {
      cancelled = true;
    };
  }, [activeStep, activeIndex, currentStepIndex, heroVideoCache]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedStageMedia = async () => {
      const selectedStageKey = activeStep?.key;

      if (!selectedStageKey) {
        setSelectedStageMedia({ type: null, url: '' });
        return;
      }

      const mediaState = getSelectedStageMediaState(
        activeIndex,
        currentStepIndex
      );

      const cacheKey = `${mediaState}:${selectedStageKey}`;

      if (selectedStageMediaCache[cacheKey]) {
        setSelectedStageMedia({
          type: mediaState === STAGE_MEDIA_STATE.UNLOCKED ? 'image' : 'video',
          url: selectedStageMediaCache[cacheKey],
        });
        return;
      }

      const assetConfig = getStageAssetConfig(selectedStageKey, mediaState);

      if (!assetConfig) {
        setSelectedStageMedia({ type: null, url: '' });
        return;
      }

      try {
        const url = await fetchStorageAssetUrl(
          assetConfig.folderPath,
          assetConfig.fileName
        );

        if (cancelled) return;

        if (!url) {
          console.error(
            `No ${mediaState} asset found for ${selectedStageKey}. Expected: ${assetConfig.fileName}`
          );
          setSelectedStageMedia({ type: null, url: '' });
          return;
        }

        setSelectedStageMediaCache((prev) => ({
          ...prev,
          [cacheKey]: url,
        }));

        setSelectedStageMedia({
          type: assetConfig.type,
          url,
        });
      } catch (err) {
        console.error(
          `Failed loading ${mediaState} media for ${selectedStageKey}:`,
          err
        );
        if (!cancelled) {
          setSelectedStageMedia({ type: null, url: '' });
        }
      }
    };

    loadSelectedStageMedia();

    return () => {
      cancelled = true;
    };
  }, [activeStep, activeIndex, currentStepIndex, selectedStageMediaCache]);

  useEffect(() => {
    let cancelled = false;

    const loadAdjacentMedia = async () => {
      try {
        const prevIndex = activeIndex - 1;
        const nextIndex = activeIndex + 1;

        const loadOne = async (index) => {
          if (index < 0 || index >= STEPS.length) {
            return { type: null, url: '' };
          }

          const step = STEPS[index];
          const mediaState = getSelectedStageMediaState(
            index,
            currentStepIndex
          );
          const cacheKey = `${mediaState}:${step.key}:adjacent`;

          if (selectedStageMediaCache[cacheKey]) {
            return {
              type:
                mediaState === STAGE_MEDIA_STATE.UNLOCKED ? 'image' : 'video',
              url: selectedStageMediaCache[cacheKey],
            };
          }

          const resolved = await resolveStageMediaUrl(step.key, mediaState);

          if (!resolved?.url) {
            return { type: null, url: '' };
          }

          setSelectedStageMediaCache((prev) => ({
            ...prev,
            [cacheKey]: resolved.url,
          }));

          return resolved;
        };

        const [prevMedia, nextMedia] = await Promise.all([
          loadOne(prevIndex),
          loadOne(nextIndex),
        ]);

        if (cancelled) return;

        setAdjacentStageMedia({
          prev: prevMedia,
          next: nextMedia,
        });
      } catch (err) {
        console.error('Failed loading adjacent stage media:', err);
        if (!cancelled) {
          setAdjacentStageMedia({
            prev: { type: null, url: '' },
            next: { type: null, url: '' },
          });
        }
      }
    };

    loadAdjacentMedia();

    return () => {
      cancelled = true;
    };
  }, [activeIndex, currentStepIndex, selectedStageMediaCache]);

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

  const isSelectedStageLocked = activeIndex > currentStepIndex;
  const showEducationAndCheckpoints = activeIndex <= currentStepIndex;
  const selectedStageThemeClass =
    activeStatus === 'completed'
      ? 'is-theme-completed'
      : activeStatus === 'in_progress'
        ? 'is-theme-live'
        : isSelectedStageLocked
          ? 'is-theme-locked'
          : 'is-theme-default';
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < STEPS.length - 1;

  const goPrevStage = () => {
    if (!canGoPrev) return;
    const prev = STEPS[activeIndex - 1];
    if (prev) setActiveKey(prev.key);
  };

  const goNextStage = () => {
    if (!canGoNext) return;
    const next = STEPS[activeIndex + 1];
    if (next) setActiveKey(next.key);
  };

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
      <section className="sl-progress-project-overview">
        <div className="sl-progress-project-overview-header">
          <div className="sl-progress-project-overview-eyebrow">
            Project Overview
          </div>
          <div className="sl-progress-project-overview-title">
            Your SoundLegend build at a glance
          </div>
        </div>

        <div className="sl-progress-metrics sl-progress-metrics--overview">
          <div className="sl-progress-metric">
            <div className="sl-progress-metric-label">Project completion</div>
            <div className="sl-progress-metric-value">
              {overallPct != null ? `${overallPct}%` : '—'}
            </div>
          </div>

          <div className="sl-progress-metric sl-progress-metric--featured">
            <div className="sl-progress-metric-label">
              Project current stage
            </div>
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
      </section>

      <section className="sl-progress-roadmap sl-progress-roadmap--premium">
        <div className="sl-progress-roadmap-header-row">
          <div className="sl-progress-roadmap-header-block">
            <div className="sl-progress-roadmap-header">Build roadmap</div>
            <div className="sl-progress-roadmap-subtitle">
              Track your drum’s progress from concept to completion
            </div>
          </div>

          <div className="sl-progress-roadmap-side">
            <div className="sl-progress-roadmap-percent">{overallPct}%</div>
            <div className="sl-progress-roadmap-caption">
              {currentStageLabel}
            </div>
          </div>
        </div>

        <div className="sl-progress-roadmap-track-shell">
          <div className="sl-progress-roadmap-track">
            <div
              className="sl-progress-roadmap-track-fill"
              style={{ width: `${overallPct}%` }}
            />
            <div
              className="sl-progress-roadmap-track-glow"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </section>

      <section
        className={[
          'sl-progress-hero-carousel-shell',
          selectedStageThemeClass,
        ].join(' ')}
      >
        <div className="sl-progress-hero-carousel-stage-rail">
          <button
            type="button"
            className={[
              'sl-progress-hero-side-preview',
              'is-prev',
              !canGoPrev ? 'is-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={goPrevStage}
            disabled={!canGoPrev}
            aria-label={
              prevStep
                ? `View previous stage: ${prevStep.label}`
                : 'No previous stage'
            }
          >
            <div className="sl-progress-hero-side-preview-media">
              {adjacentStageMedia.prev?.url ? (
                adjacentStageMedia.prev.type === 'image' ? (
                  <img
                    src={adjacentStageMedia.prev.url}
                    alt={prevStep ? prevStep.label : 'Previous stage'}
                  />
                ) : (
                  <video
                    key={adjacentStageMedia.prev.url}
                    src={adjacentStageMedia.prev.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )
              ) : (
                <div className="sl-progress-hero-side-preview-fallback" />
              )}
            </div>

            <div className="sl-progress-hero-side-preview-overlay" />
            <div className="sl-progress-hero-side-preview-copy">
              <div className="sl-progress-hero-side-preview-label">
                Previous
              </div>
              <div className="sl-progress-hero-side-preview-title">
                {prevStep ? `${activeIndex}. ${prevStep.label}` : '—'}
              </div>
            </div>
          </button>

          <div className="sl-progress-hero-carousel-media">
            {heroVideoUrl ? (
              currentStageStatus === STAGE_MEDIA_STATE.UNLOCKED ? (
                <img
                  className="sl-progress-hero-video"
                  src={heroVideoUrl}
                  alt={`${activeStep.label} hero`}
                />
              ) : (
                <video
                  key={heroVideoUrl}
                  className="sl-progress-hero-video"
                  src={heroVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )
            ) : null}

            <div className="sl-progress-hero-overlay">
              <div className="sl-progress-hero-kicker">
                {currentStageStatus === STAGE_MEDIA_STATE.ACTIVE
                  ? 'Currently in the workshop'
                  : currentStageStatus === STAGE_MEDIA_STATE.UNLOCKED
                    ? 'Completed stage archive'
                    : 'Future stage preview'}
              </div>
              <div className="sl-progress-hero-title">
                {activeIndex + 1}. {activeStep.label}
              </div>
            </div>

            <div className="sl-progress-hero-carousel-nav">
              <button
                type="button"
                className="sl-progress-carousel-arrow sl-progress-carousel-arrow--hero"
                onClick={goPrevStage}
                disabled={!canGoPrev}
                aria-label="Previous stage"
              >
                ‹
              </button>

              <button
                type="button"
                className="sl-progress-carousel-arrow sl-progress-carousel-arrow--hero"
                onClick={goNextStage}
                disabled={!canGoNext}
                aria-label="Next stage"
              >
                ›
              </button>
            </div>
          </div>

          <button
            type="button"
            className={[
              'sl-progress-hero-side-preview',
              'is-next',
              !canGoNext ? 'is-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={goNextStage}
            disabled={!canGoNext}
            aria-label={
              nextStep ? `View next stage: ${nextStep.label}` : 'No next stage'
            }
          >
            <div className="sl-progress-hero-side-preview-media">
              {adjacentStageMedia.next?.url ? (
                adjacentStageMedia.next.type === 'image' ? (
                  <img
                    src={adjacentStageMedia.next.url}
                    alt={nextStep ? nextStep.label : 'Next stage'}
                  />
                ) : (
                  <video
                    key={adjacentStageMedia.next.url}
                    src={adjacentStageMedia.next.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )
              ) : (
                <div className="sl-progress-hero-side-preview-fallback" />
              )}
            </div>

            <div className="sl-progress-hero-side-preview-overlay" />
            <div className="sl-progress-hero-side-preview-copy">
              <div className="sl-progress-hero-side-preview-label">Next</div>
              <div className="sl-progress-hero-side-preview-title">
                {nextStep ? `${activeIndex + 2}. ${nextStep.label}` : '—'}
              </div>
            </div>
          </button>
        </div>

        <div className="sl-progress-hero-carousel-bottom">
          <section className="sl-progress-intro">
            <p className="sl-progress-intro-text">
              Follow the evolution of your SoundLegend drum as each phase is
              completed, documented, and revealed.
            </p>
          </section>
        </div>
      </section>

      <section
        className={[
          'sl-progress-stage',
          selectedStageThemeClass,
          isSelectedStageLocked ? 'is-locked' : '',
          currentStageStatus === STAGE_MEDIA_STATE.ACTIVE
            ? 'is-live-stage'
            : '',
          currentStageStatus === STAGE_MEDIA_STATE.UNLOCKED
            ? 'is-archive-stage'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="sl-progress-stage-header sl-progress-stage-header--connected">
          <div className="sl-progress-stage-header-copy">
            <div className="sl-progress-stage-eyebrow">
              {getStageViewerEyebrow(activeIndex, currentStepIndex)}
            </div>

            <div className="sl-progress-stage-bridge-line">
              <span className="sl-progress-stage-bridge-label">
                {getStageViewerStateLabel(activeIndex, currentStepIndex)}
              </span>
              <span className="sl-progress-stage-bridge-dot" />
              <span className="sl-progress-stage-bridge-summary">
                {getStageSummary(activeStep)}
              </span>
            </div>
          </div>

          <div className="sl-progress-stage-header-side">
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
              {stageTarget ||
                (activeStatus === 'completed' ? 'Completed' : 'TBD')}
            </div>
          </div>
        </div>

        {showEducationAndCheckpoints ? (
          <>
            <div className="sl-progress-stage-education-header">
              <div className="sl-progress-stage-education-eyebrow">
                Stage Story
              </div>
              <div className="sl-progress-stage-education-title">
                What this phase means for your drum
              </div>
            </div>

            <div className="sl-progress-stage-body">
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
                    {(Array.isArray(activeStep?.tools)
                      ? activeStep.tools
                      : []
                    ).map((t, i) => (
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

              <div className="sl-progress-stage-col sl-progress-stage-col--checkpoints">
                <StageCheckpointsPanel
                  key={activeStep.key}
                  project={project}
                  setProject={setProject}
                  stageKey={activeStep.key}
                  isAdmin={isAdmin}
                />
              </div>
            </div>

            <footer className="sl-progress-stage-footer">
              <p className="sl-progress-stage-files">
                Files for this step will appear here as we add photos, audio,
                and PDFs.
              </p>
            </footer>
          </>
        ) : (
          <div className="sl-progress-stage-preview-lock">
            <div className="sl-progress-stage-preview-lock-card">
              <div className="sl-progress-stage-preview-lock-eyebrow">
                Future stage access
              </div>
              <h3 className="sl-progress-stage-preview-lock-title">
                Stage details remain locked for now
              </h3>
              <p className="sl-progress-stage-preview-lock-text">
                You can preview the cinematic media above, but the educational
                breakdown and milestone checklist will unlock only after all
                prior stages are completed.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectProgress;
