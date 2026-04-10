import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProjectRecordSection from './ManageProjectModal/ProjectRecordSection';
import IntakeDirectionSection from './ManageProjectModal/IntakeDirectionSection';
import StoryStudioSection from './ManageProjectModal/StoryStudioSection';
import BuildWorkflowSection from './ManageProjectModal/BuildWorkflowSection';
import OutstandingHelpOverlay from './ManageProjectModal/OutstandingHelpOverlay';
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
import { db, app } from '../firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
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

const ADMIN_SECTIONS = {
  RECORD: 'record',
  INTAKE: 'intake',
  STORY_STUDIO: 'storyStudio',
  BUILD: 'build',
};

const ADMIN_NAV_GROUPS = [
  {
    label: 'Project',
    items: [
      { key: ADMIN_SECTIONS.RECORD, label: 'Project Record' },
      { key: ADMIN_SECTIONS.INTAKE, label: 'Intake & Direction' },
      { key: ADMIN_SECTIONS.STORY_STUDIO, label: 'Story Studio' },
    ],
  },
];

const getProjectHeaderTitle = (project = {}) => {
  const identifier = getIdentifier(project);
  const line =
    val(
      project.artisanLine,
      project.series,
      project.productLine,
      project.line
    ) || 'SoundLegend';

  return identifier !== '—' ? identifier : line;
};

const getProjectHeaderSubtitle = (project = {}) => {
  const customerName = deriveCustomerName(project);
  const customerEmail = deriveCustomerEmail(project);

  if (customerName && customerEmail)
    return `${customerName} • ${customerEmail}`;
  if (customerName) return customerName;
  if (customerEmail) return customerEmail;
  return 'No customer linked yet';
};

const getLinkedUserStatusLabel = (linkedUser) => {
  if (!linkedUser) return 'Not linked';
  return linkedUser.email ? `Linked • ${linkedUser.email}` : 'Linked';
};

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

const STORY_EMPTYISH_VALUES = [
  '',
  'n/a',
  'na',
  'none',
  'unknown',
  'not sure',
  'noot sure',
  'unsure',
  'tbd',
  'idk',
  'i don’t know',
  "i don't know",
  'not certain',
  'maybe',
];

const cleanStoryText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const isEmptyishStoryValue = (value) => {
  const normalized = cleanStoryText(value).toLowerCase();
  return STORY_EMPTYISH_VALUES.includes(normalized);
};

const sanitizeFreeformStoryValue = (value) => {
  let text = cleanStoryText(value);
  if (!text) return '';

  const lower = text.toLowerCase();
  if (STORY_EMPTYISH_VALUES.includes(lower)) return '';

  text = text
    .replace(/--+\s*already told you.*$/i, '')
    .replace(/\balready told you.*$/i, '')
    .replace(/\basked and answered.*$/i, '')
    .replace(/\bnot sure\b/gi, '')
    .replace(/\bnoot sure\b/gi, '')
    .replace(/\bunsure\b/gi, '')
    .replace(/\bidk\b/gi, '')
    .replace(/\bi don’t know\b/gi, '')
    .replace(/\bi don't know\b/gi, '')
    .replace(/\s+,/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!text) return '';
  if (isEmptyishStoryValue(text)) return '';

  return text;
};

const sanitizeCommaSeparatedStoryValue = (value) => {
  if (value === null || value === undefined) return '';

  const items = String(value)
    .split(',')
    .map((item) => sanitizeFreeformStoryValue(item))
    .filter(Boolean);

  return [...new Set(items)].join(', ');
};

const sanitizeStoryFieldValue = (fieldKey, value) => {
  const multiValueFields = [
    'genreContext',
    'influenceReferences',
    'responsePriorities',
    'tonalGoals',
    'woodPreference',
  ];

  const strictSingleSelectFields = [
    'styleOfPlaying',
    'desiredOutcome',
    'hardwareFinish',
    'preferredSizeDirection',
    'consultationContactMethod',
    'primaryUseCase',
    'attack',
    'body',
    'sensitivity',
    'projection',
    'tuningRange',
    'articulation',
    'feel',
  ];

  if (multiValueFields.includes(fieldKey)) {
    return sanitizeCommaSeparatedStoryValue(value);
  }

  if (strictSingleSelectFields.includes(fieldKey)) {
    return sanitizeFreeformStoryValue(value);
  }

  return sanitizeFreeformStoryValue(value);
};

const normalizeStoryDescriptor = (fieldKey, value) => {
  const v = sanitizeFreeformStoryValue(value).toLowerCase();

  if (!v) return '';

  if (fieldKey === 'attack') {
    if (v === 'controlled') return 'controlled attack';
    if (v === 'fast') return 'quick attack';
  }

  if (fieldKey === 'body') {
    if (v === 'full') return 'full-bodied response';
  }

  if (fieldKey === 'sensitivity') {
    if (v === 'high') return 'high sensitivity';
  }

  if (fieldKey === 'feel') {
    if (v === 'deep') return 'deeper feel';
  }

  if (fieldKey === 'projection') {
    if (v === 'medium') return 'balanced projection';
  }

  return sanitizeFreeformStoryValue(value);
};

const sanitizeStoryFieldGroup = (group = {}) => {
  const next = {};

  Object.entries(group || {}).forEach(([key, value]) => {
    next[key] = sanitizeStoryFieldValue(key, value);
  });

  return next;
};

const deriveBestProjectName = (project = {}) => {
  const identifier = getIdentifier(project);
  return (
    cleanStoryText(project?.projectName) ||
    cleanStoryText(project?.title) ||
    cleanStoryText(project?.name) ||
    cleanStoryText(project?.lineSerial) ||
    (identifier !== '—' ? identifier : '') ||
    cleanStoryText(project?.id) ||
    ''
  );
};

const deriveBestArtistName = (project = {}, storyEngineData = {}) => {
  return (
    cleanStoryText(
      storyEngineData?.consultationMapped?.artistName ||
        storyEngineData?.questionnaireMapped?.artistName
    ) ||
    cleanStoryText(project?.customerName) ||
    cleanStoryText(project?.customer?.name) ||
    cleanStoryText(project?.customer?.displayName) ||
    cleanStoryText(project?.customerInfo?.name) ||
    cleanStoryText(project?.customerFullName) ||
    cleanStoryText(project?.artistName) ||
    ''
  );
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

const buildQuestionnaireRawFromProject = (project = {}) => {
  const intake = project?.consultationIntake || {};

  const normalized = {
    playingWorld: intake?.playingWorld || {},
    soundGoals: intake?.soundGoals || {},
    buildDirection: intake?.buildDirection || {},
    consultPrep: intake?.consultPrep || {},
  };

  const hasAnyData = Object.values(normalized).some(
    (section) => section && Object.keys(section).length
  );

  if (!hasAnyData) return '';

  try {
    return JSON.stringify(normalized, null, 2);
  } catch {
    return '';
  }
};

const HYBRID_CHAPTER_PROMPTS = {
  chapterOverview: `
Write the chapter overview for this exact SoundLegend build.

This must read like a real builder's note in a custom build book.
It should feel plain, grounded, and written by hand after reviewing the project.

Requirements:
- 1 paragraph
- 40 to 60 words
- continue naturally from the previous chapter, but still work on its own
- say what currently feels real
- say what is leaning in a direction
- say what is still open
- stop cleanly without a concluding summary sentence

Voice:
- calm
- plain
- observant
- restrained
- human
- workshop-real

Write it like:
- a builder documenting where the project stands right now
- someone protecting the direction without forcing answers too early
- someone naming what looks right so far and what still needs to stay open

Use artistName only for the human/customer if a name is truly needed.
If artistName is missing, avoid naming the person directly.
Do NOT use SoundLegend, projectName, series name, or drum line as if it were the artist.

Hard rules:
- do not write like a summary
- do not write like product copy
- do not write like intake recap
- do not write like polished presentation language
- do not write from a bird's-eye narrator voice
- do not use "has emerged as"
- do not use "likely shell wood"
- do not use "the build is settling into"
- do not use "solid frame"
- do not use "not yet defined in all details"
- do not use "vintage touch"
- do not use "remain open and need further input"
- do not use "centers on"
- do not use "identity"
- do not use "concept"
- do not use "voice"
- do not use "at this stage"
- do not use "at this point"
- do not use "moving forward"
- do not use "the next steps"
- do not use genre lists
- do not stack multiple specs into one elegant sentence

Preferred shape:
- sentence 1: one thing that feels real now
- sentence 2: one thing leaning in a direction
- sentence 3: what is still open
- sentence 4: stop

Sentence rules:
- use short sentences
- prefer simple nouns and verbs
- keep each sentence focused on one idea
- if a detail is not confirmed, say "leaning toward", "keep open", or "not locked yet"
- the last sentence should feel like a working note, not a conclusion
- the last sentence should be 4 to 8 words max

For Commitment & Portal Setup:
- this should feel like the project is no longer just exploratory
- one or two directions can be named simply
- structural choices can still stay open
- the tone should stay steady, plain, and honest

Good example of tone:
"Maple still looks right here. Clear gloss makes sense if the figured grain stays central. Shell construction and edge details are not locked yet. Hardware can wait."

Follow that level of restraint and directness.
Do not copy the example directly.

Return only the paragraph text.
`.trim(),

  buildNotes: `
Write the build notes for this exact SoundLegend build.

These are private bench notes from the maker to himself.
They should feel like real workshop notes made during planning.

Requirements:
- return 4 to 6 bullet strings
- one short sentence per bullet
- each bullet should name a real direction, open question, caution, or thing to protect
- be specific where the data supports it
- be honest where the data does not support a firm decision yet

Tone:
- short
- direct
- useful
- plainspoken
- workshop-real

Prefer wording like:
- "Leaning toward"
- "Keep"
- "Not locked yet"
- "Still needs confirmation"
- "Hold off on"
- "Verify before moving on"
- "Do not finalize until"
- "Protect"

Use artistName only for the human/customer if a name is needed.
If artistName is missing, avoid naming the person directly.
Do NOT use SoundLegend, projectName, series name, or drum line as if it were the artist.

Avoid:
- presentation language
- brand language
- poetic language
- summary lines
- conclusion lines
- inflated wording
- uncertain details written as confirmed

Do not use:
- "aligns with"
- "supports"
- "concept"
- "identity"
- "signature snare"
- "broad response"
- "versatility"
- "aesthetic"
- "protect visual direction"
- "remain open for further input"
- "planned as"
- "set to"
- "locked in"
- "finalized"

Bullet rules:
- do not write a wrap-up bullet
- do not write a summary bullet
- do not write any bullet that reads like marketing copy
- do not write uncertain details as fixed
- prefer bullets that begin with "Leaning toward", "Keep", "Hold off on", "Verify", or "Do not finalize"
- each bullet should read like a usable shop note
- avoid combining too many decisions into one bullet
- if discussing hardware finish, keep it practical, like "Keep brass / gold hardware in play, but do not finalize yet"

Good examples of tone:
- "Leaning toward maple for the shell; keep construction format open."
- "Hold off on hoop choice until edge and feel are clearer."
- "Verify snare bed preference before cutting."
- "Keep brass / gold hardware in play, but do not finalize yet."

Follow that level of directness.
Do not copy the examples directly.

Return only an array of bullet strings.
`.trim(),
};

const STORY_MULTI_VALUE_DELIMITER = ', ';

const splitMultiValue = (value) =>
  String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const joinMultiValue = (values = []) =>
  [
    ...new Set((values || []).map((v) => String(v).trim()).filter(Boolean)),
  ].join(STORY_MULTI_VALUE_DELIMITER);

const getOtherValues = (selectedValues = [], allowedOptions = []) => {
  const allowed = new Set((allowedOptions || []).map((v) => String(v).trim()));
  return (selectedValues || []).filter((v) => !allowed.has(String(v).trim()));
};

const QUESTIONNAIRE_OPTION_SETS = {
  styleOfPlaying: [
    'Collector',
    'Gigging drummer',
    'Studio drummer',
    'Songwriter / producer',
    'Weekend player',
    'Worship drummer',
    'Educator',
    'Hobbyist',
  ],
  desiredOutcome: [
    'Something unique I cannot get off the shelf',
    'A better fit for my sound',
    'A more inspiring instrument',
    'A collectible / legacy piece',
    'A versatile all-around snare',
  ],
  genreContext: [
    'Rock',
    'Pop',
    'Country',
    'Americana',
    'Indie',
    'Singer-songwriter',
    'Worship',
    'Jazz',
    'Fusion',
    'Funk',
    'R&B',
    'Hip-hop',
    'Latin',
    'Metal',
    'Alternative',
  ],
  influenceReferences: [
    'Collecting',
    'Recording',
    'Live performance',
    'Worship',
    'Studio work',
    'Legacy / heirloom',
  ],
  hardwareFinish: ['Chrome', 'Black nickel', 'Brass / gold'],
  woodPreference: [
    'Feuzon (Hybrid)',
    'Stave',
    'Ply',
    'I trust your recommendation',
  ],
  finishDirection: [
    'Natural oil',
    'Satin clear',
    'High gloss clear',
    'Burst / fade',
    'Painted finish',
    'Resin-accented',
    'I trust your recommendation',
  ],
  responsePriorities: [
    'Brush sensitivity',
    'Consistent feel across tunings',
    'Easy to record',
    'Easy to mix live',
    'Clear ghost notes',
    'Smooth dynamic range',
    'Strong backbeat',
    'Wide tuning range',
  ],
  tonalGoals: [
    'Dry / controlled',
    'Sensitive / ghost-note friendly',
    'Crisp',
    'Fat / full',
    'Open / resonant',
    'Dark',
    'Bright',
    'Warm',
    'Articulate',
    'Punchy',
  ],
  preferredSizeDirection: [
    'Under 13"',
    '13"',
    '14"',
    'Over 14"',
    'Not sure yet',
  ],
  consultationContactMethod: ['Text message', 'Phone call', 'Email'],
  primaryUseCase: ['live performance', 'studio', 'both', 'collecting'],
  attack: ['quick attack', 'controlled attack', 'soft attack'],
  body: ['full-bodied response', 'balanced body', 'lean body'],
  sensitivity: ['high sensitivity', 'moderate sensitivity', 'low sensitivity'],
  projection: ['low', 'balanced projection', 'high'],
  tuningRange: ['low', 'medium', 'medium-to-medium-high', 'high', 'wide'],
  articulation: ['dry', 'balanced', 'mixed', 'crisp'],
  feel: ['deeper feel', 'balanced feel', 'tight feel'],
};

const prettyPrintQuestionnaireRaw = (raw) => {
  if (!raw) return '';

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return String(raw).trim();
  }
};

const normalizePersonName = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractFirstName = (value = '') => {
  const normalized = normalizePersonName(value);
  return normalized.split(' ')[0] || '';
};

const mapSpeakerLabelToRole = (label, artistName = '') => {
  const normalized = normalizePersonName(label);
  const artistFirst = extractFirstName(artistName);

  if (!normalized) return artistName || 'Artist';

  if (
    [
      'craftsman',
      'dan',
      'builder',
      'host',
      'maker',
      'ober',
      'ober artisan',
    ].includes(normalized)
  ) {
    return 'Ober Artisan';
  }

  if (['artist', 'customer', 'client', 'caller'].includes(normalized)) {
    return artistName || 'Artist';
  }

  if (artistFirst && normalized === artistFirst) {
    return artistName || 'Artist';
  }

  return artistName || 'Artist';
};

const buildSmartTranscriptTurns = (rawText, artistName = '') => {
  const text = String(rawText || '')
    .replace(/\r/g, '')
    .trim();

  if (!text) return [];

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const explicitSpeakerLines = lines.filter((line) =>
    /^[A-Za-z][A-Za-z\s'-]{1,40}:\s+/.test(line)
  );

  if (explicitSpeakerLines.length >= 2) {
    return explicitSpeakerLines.map((line, idx) => {
      const match = line.match(/^([A-Za-z][A-Za-z\s'-]{1,40}):\s+([\s\S]+)$/);
      const rawSpeaker = match?.[1] || '';
      const content = match?.[2] || line;

      return {
        id: `turn-${idx}`,
        speaker: mapSpeakerLabelToRole(rawSpeaker, artistName),
        text: content.trim(),
      };
    });
  }

  return [
    {
      id: 'turn-0',
      speaker: 'Ober Artisan',
      text,
    },
  ];
};

function splitTranscriptIntoChunks(text = '', maxChars = 3500) {
  const clean = String(text || '')
    .replace(/\r/g, '')
    .trim();
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if ((current + '\n\n' + paragraph).length <= maxChars) {
      current += `\n\n${paragraph}`;
    } else {
      chunks.push(current);
      current = paragraph;
    }
  }

  if (current) chunks.push(current);

  // fallback for giant single paragraph transcripts
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];

    const pieces = [];
    let start = 0;

    while (start < chunk.length) {
      pieces.push(chunk.slice(start, start + maxChars));
      start += maxChars;
    }

    return pieces;
  });
}

function mergeAdjacentTurns(turns = []) {
  const merged = [];

  turns.forEach((turn, idx) => {
    const speaker = String(turn?.speaker || '').trim();
    const text = String(turn?.text || '').trim();
    const uncertain = !!turn?.uncertain;

    if (!speaker || !text) return;

    const prev = merged[merged.length - 1];

    if (prev && prev.speaker === speaker) {
      prev.text = `${prev.text} ${text}`.trim();
      prev.uncertain = prev.uncertain || uncertain;
      return;
    }

    merged.push({
      id: `turn-${idx}`,
      speaker,
      text,
      uncertain,
    });
  });

  return merged.map((turn, idx) => ({
    ...turn,
    id: `turn-${idx}`,
  }));
}

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  const [selectedTab, setSelectedTab] = useState(ADMIN_SECTIONS.RECORD);
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});

  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const [linkedUser, setLinkedUser] = useState(null);

  const [outstandingHelpItem, setOutstandingHelpItem] = useState(null);

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
      responsePriorities: '',
      tonalGoals: '',
      preferredSizeDirection: '',
      consultationContactMethod: '',
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
      responsePriorities: '',
      tonalGoals: '',
      preferredSizeDirection: '',
    },
    engineRecord: createEmptyStoryEngineRecord(),
    draftPreview: null,
  });

  const [expandedIntakeSections, setExpandedIntakeSections] = useState({
    sources: true,
    consultation: false,
    questionnaire: false,
  });

  const toggleIntakeSection = (sectionKey) => {
    setExpandedIntakeSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const [storyEngineRunning, setStoryEngineRunning] = useState(false);
  const [normalizedTranscriptTurns, setNormalizedTranscriptTurns] = useState(
    []
  );
  const [isNormalizingTranscript, setIsNormalizingTranscript] = useState(false);
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

    const hydratedQuestionnaireMapped = sanitizeStoryFieldGroup({
      artistName:
        deriveCustomerName(projectData) ||
        se?.sources?.questionnaireMapped?.artistName ||
        se?.sources?.consultationMapped?.artistName ||
        '',
      styleOfPlaying: se?.sources?.questionnaireMapped?.styleOfPlaying || '',
      desiredOutcome: se?.sources?.questionnaireMapped?.desiredOutcome || '',
      genreContext: se?.sources?.questionnaireMapped?.genreContext || '',
      recordingUse: se?.sources?.questionnaireMapped?.recordingUse || '',
      liveUse: se?.sources?.questionnaireMapped?.liveUse || '',
      influenceReferences:
        se?.sources?.questionnaireMapped?.influenceReferences || '',
      hardwareFinish: se?.sources?.questionnaireMapped?.hardwareFinish || '',
      woodPreference: se?.sources?.questionnaireMapped?.woodPreference || '',
      finishDirection: se?.sources?.questionnaireMapped?.finishDirection || '',
      responsePriorities:
        se?.sources?.questionnaireMapped?.responsePriorities || '',
      tonalGoals: se?.sources?.questionnaireMapped?.tonalGoals || '',
      preferredSizeDirection:
        se?.sources?.questionnaireMapped?.preferredSizeDirection || '',
      consultationContactMethod:
        se?.sources?.questionnaireMapped?.consultationContactMethod || '',
    });

    const hydratedConsultationMapped = sanitizeStoryFieldGroup({
      artistName:
        deriveCustomerName(projectData) ||
        se?.sources?.consultationMapped?.artistName ||
        se?.sources?.questionnaireMapped?.artistName ||
        '',
      projectName:
        se?.sources?.consultationMapped?.projectName ||
        deriveBestProjectName(projectData) ||
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
      responsePriorities:
        se?.sources?.consultationMapped?.responsePriorities || '',
      tonalGoals: se?.sources?.consultationMapped?.tonalGoals || '',
      preferredSizeDirection:
        se?.sources?.consultationMapped?.preferredSizeDirection || '',
    });

    setStoryEngineData({
      consultationTranscript: se?.sources?.consultationTranscript || '',
      consultationSummary: se?.sources?.consultationSummary || '',
      adminNotes: se?.sources?.adminNotes || '',
      questionnaireRaw:
        typeof se?.sources?.questionnaireRaw === 'string' &&
        se.sources.questionnaireRaw.trim()
          ? se.sources.questionnaireRaw
          : se?.sources?.questionnaireRaw
            ? JSON.stringify(se.sources.questionnaireRaw, null, 2)
            : buildQuestionnaireRawFromProject(projectData),
      questionnaireMapped: hydratedQuestionnaireMapped,
      consultationMapped: hydratedConsultationMapped,
      engineRecord: se?.record || createEmptyStoryEngineRecord(),
      draftPreview: se?.draftPreview || null,
    });

    setNormalizedTranscriptTurns(
      Array.isArray(se?.sources?.consultationTranscriptTurns)
        ? se.sources.consultationTranscriptTurns
        : []
    );
  }, [projectData]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTab(ADMIN_SECTIONS.RECORD);
    setSelectedStepKey(buildPhases[0]?.key || null);
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
  const projectHeaderTitle = getProjectHeaderTitle(projectData);
  const projectHeaderSubtitle = getProjectHeaderSubtitle(projectData);
  const linkedUserStatus = getLinkedUserStatusLabel(linkedUser);

  const selectedStepLabel =
    selectedTab !== ADMIN_SECTIONS.BUILD
      ? currentPhaseLabel
      : buildPhases.find((p) => p.key === selectedStepKey)?.label ||
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
    if (selectedTab !== ADMIN_SECTIONS.BUILD) return selectedTab;
    if (!selectedStepKey) return ADMIN_SECTIONS.BUILD;

    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${ADMIN_SECTIONS.BUILD}::${selectedStepKey}::${idx}`;
  };

  const artistDisplayName =
    storyEngineData?.consultationMapped?.artistName ||
    storyEngineData?.questionnaireMapped?.artistName ||
    deriveCustomerName(projectData) ||
    'Artist';

  const formattedQuestionnaireRaw = prettyPrintQuestionnaireRaw(
    storyEngineData.questionnaireRaw
  );

  const smartTranscriptTurns =
    normalizedTranscriptTurns.length > 0
      ? normalizedTranscriptTurns
      : buildSmartTranscriptTurns(
          storyEngineData.consultationTranscript,
          artistDisplayName
        );

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

  const handleNormalizeTranscript = async () => {
    const rawTranscript = String(
      storyEngineData.consultationTranscript || ''
    ).trim();

    const resolvedArtistName =
      storyEngineData?.consultationMapped?.artistName ||
      storyEngineData?.questionnaireMapped?.artistName ||
      deriveCustomerName(projectData) ||
      '';

    if (!rawTranscript) return;

    try {
      setIsNormalizingTranscript(true);

      const chunks = splitTranscriptIntoChunks(rawTranscript, 3500);
      const allTurns = [];

      for (const chunk of chunks) {
        const turns = await normalizeConsultationTranscript({
          rawTranscript: chunk,
          artistName: resolvedArtistName,
        });

        const cleanedTurns = (Array.isArray(turns) ? turns : [])
          .map((turn) => ({
            speaker:
              turn?.speaker === 'Ober Artisan'
                ? 'Ober Artisan'
                : resolvedArtistName || 'Artist',
            text: String(turn?.text || '').trim(),
            uncertain: !!turn?.uncertain,
          }))
          .filter((turn) => turn.text);

        allTurns.push(...cleanedTurns);
      }

      const mergedTurns = mergeAdjacentTurns(allTurns);

      if (!mergedTurns.length) {
        throw new Error('Transcript normalization returned no usable turns');
      }

      setNormalizedTranscriptTurns(mergedTurns);

      await saveToFirestore({
        storyEngine: {
          sources: {
            consultationTranscript: storyEngineData.consultationTranscript,
            consultationTranscriptTurns: mergedTurns,
            consultationSummary: storyEngineData.consultationSummary,
            adminNotes: storyEngineData.adminNotes,
            questionnaireRaw: storyEngineData.questionnaireRaw,
            questionnaireMapped: storyEngineData.questionnaireMapped,
            consultationMapped: storyEngineData.consultationMapped,
          },
          record: storyEngineData.engineRecord,
          draftPreview: storyEngineData.draftPreview,
          lastUpdatedAt: new Date().toISOString(),
        },
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error(
        '[ManageProjectModal] Transcript normalization failed:',
        err?.message,
        err
      );

      window.alert(
        `Transcript formatting failed:\n\n${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsNormalizingTranscript(false);
    }
  };

  const updateStoryEngineField = (section, key, value) => {
    const sanitizedValue = sanitizeStoryFieldValue(key, value);

    setStoryEngineData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === 'object' && prev[section] !== null
          ? {
              ...prev[section],
              [key]: sanitizedValue,
            }
          : sanitizedValue,
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
        consultationTranscriptTurns: normalizedTranscriptTurns,
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

  const getChapterSectionData = (chapterKey, sectionKey) => {
    return (
      storyEngineData?.engineRecord?.chapters?.[chapterKey]?.storySections?.[
        sectionKey
      ] || {}
    );
  };

  const toggleChapterSectionLock = async ({
    chapterKey,
    sectionKey,
    locked,
  }) => {
    const currentRecord =
      storyEngineData.engineRecord || createEmptyStoryEngineRecord();

    const nextRecord = {
      ...currentRecord,
      chapters: {
        ...(currentRecord.chapters || {}),
        [chapterKey]: {
          ...(currentRecord.chapters?.[chapterKey] || {}),
          storySections: {
            ...(currentRecord.chapters?.[chapterKey]?.storySections || {}),
            [sectionKey]: {
              ...(currentRecord.chapters?.[chapterKey]?.storySections?.[
                sectionKey
              ] || {}),
              locked,
              lockedAt: locked ? new Date().toISOString() : null,
              lockedBy: locked ? 'admin' : '',
            },
          },
        },
      },
    };

    const nextDraftPreview = {
      ...(storyEngineData.draftPreview || {}),
      [chapterKey]: nextRecord?.chapters?.[chapterKey]?.storySections || {},
    };

    const nextState = {
      ...storyEngineData,
      engineRecord: nextRecord,
      draftPreview: nextDraftPreview,
    };

    setStoryEngineData(nextState);

    await saveStoryEngineToProject({
      sources: {
        consultationTranscript: nextState.consultationTranscript,
        consultationTranscriptTurns: normalizedTranscriptTurns,
        consultationSummary: nextState.consultationSummary,
        adminNotes: nextState.adminNotes,
        questionnaireRaw: nextState.questionnaireRaw,
        questionnaireMapped: nextState.questionnaireMapped,
        consultationMapped: nextState.consultationMapped,
      },
      record: nextRecord,
      draftPreview: nextDraftPreview,
      lastRunAt: new Date().toISOString(),
    });

    setShowSnackbar(true);
  };

  const regenerateChapterSection = async ({ chapterKey, sectionKey }) => {
    try {
      setStoryEngineRunning(true);

      const currentRecord =
        storyEngineData.engineRecord || createEmptyStoryEngineRecord();
      const chapter = currentRecord?.chapters?.[chapterKey];
      if (!chapter) return;

      const existingSection = chapter?.storySections?.[sectionKey] || {};

      if (existingSection?.locked) {
        console.warn(
          `[StoryEngine] ${chapterKey}.${sectionKey} is locked. Skipping regeneration.`
        );
        return;
      }

      const resolvedArtistName = deriveBestArtistName(
        projectData,
        storyEngineData
      );

      const payload = {
        projectId: projectData?.id || '',
        chapterKey,
        chapterLabel: chapter?.label || chapterKey,
        artistName: resolvedArtistName || '',
        projectName: deriveBestProjectName(projectData) || '',
        consultationMapped: storyEngineData.consultationMapped,
        questionnaireMapped: storyEngineData.questionnaireMapped,
        buildSpec: currentRecord?.buildSpec || {},
        recommendations: currentRecord?.recommendations || {},
        engineMeta: currentRecord?.engineMeta || {},
      };

      const prompts =
        sectionKey === 'chapterOverview'
          ? { chapterOverview: HYBRID_CHAPTER_PROMPTS.chapterOverview }
          : { buildNotes: HYBRID_CHAPTER_PROMPTS.buildNotes };

      const hybridResult = await callHybridChapter({
        chapterKey,
        sectionKey,
        payload,
        prompts,
      });

      const nextRecord = {
        ...currentRecord,
        chapters: {
          ...(currentRecord.chapters || {}),
          [chapterKey]: {
            ...(currentRecord.chapters?.[chapterKey] || {}),
            storySections: {
              ...(currentRecord.chapters?.[chapterKey]?.storySections || {}),
            },
          },
        },
      };

      if (sectionKey === 'chapterOverview' && hybridResult?.chapterOverview) {
        nextRecord.chapters[chapterKey].storySections.chapterOverview = {
          ...(nextRecord.chapters[chapterKey].storySections.chapterOverview ||
            {}),
          text: hybridResult.chapterOverview,
          lastGeneratedAt: new Date().toISOString(),
          lastGeneratedBy: 'admin',
        };
      }

      if (
        sectionKey === 'buildNotesStory' &&
        hybridResult?.buildNotes?.length
      ) {
        nextRecord.chapters[chapterKey].storySections.buildNotesStory = {
          ...(nextRecord.chapters[chapterKey].storySections.buildNotesStory ||
            {}),
          text: hybridResult.buildNotes.join('\n'),
          bulletItems: hybridResult.buildNotes,
          lastGeneratedAt: new Date().toISOString(),
          lastGeneratedBy: 'admin',
        };
      }

      const nextDraftPreview = {
        ...(storyEngineData.draftPreview || {}),
        [chapterKey]: nextRecord?.chapters?.[chapterKey]?.storySections || {},
      };

      const nextState = {
        ...storyEngineData,
        engineRecord: nextRecord,
        draftPreview: nextDraftPreview,
      };

      setStoryEngineData(nextState);

      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: nextState.consultationTranscript,
          consultationTranscriptTurns: normalizedTranscriptTurns,
          consultationSummary: nextState.consultationSummary,
          adminNotes: nextState.adminNotes,
          questionnaireRaw: nextState.questionnaireRaw,
          questionnaireMapped: nextState.questionnaireMapped,
          consultationMapped: nextState.consultationMapped,
        },
        record: nextRecord,
        draftPreview: nextDraftPreview,
        lastRunAt: new Date().toISOString(),
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error(
        `[StoryEngine] Failed regenerating ${chapterKey}.${sectionKey}:`,
        err
      );
    } finally {
      setStoryEngineRunning(false);
    }
  };

  const pickFirstMatch = (sourceText = '', patterns = []) => {
    const text = String(sourceText || '');
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  };

  const extractConsultationMappedFields = ({
    transcript = '',
    summary = '',
    adminNotes = '',
    projectData = {},
    existing = {},
  }) => {
    const sourceBlocks = [transcript, summary, adminNotes]
      .filter(Boolean)
      .map((v) => String(v));

    const combined = sourceBlocks.join('\n\n');
    const lower = combined.toLowerCase();

    const cleanExtract = (value) => {
      const cleaned = sanitizeFreeformStoryValue(value)
        .replace(/^(i'm|i am|it'?s|that'?s|we'?re|we are)\b[:\s-]*/i, '')
        .replace(/^(like|just|maybe|probably)\b[:\s-]*/i, '')
        .trim();

      if (!cleaned) return '';
      if (cleaned.length < 3) return '';
      if (/^(yes|no|okay|ok|cool|sure)$/i.test(cleaned)) return '';
      return cleaned;
    };

    const firstMatch = (...patterns) => {
      for (const pattern of patterns) {
        const match = combined.match(pattern);
        if (match?.[1]) {
          const cleaned = cleanExtract(match[1]);
          if (cleaned) return cleaned;
        }
      }
      return '';
    };

    const detectAny = (phrases = []) =>
      phrases.some((phrase) => lower.includes(String(phrase).toLowerCase()));

    const collectOptionsMentioned = (options = []) =>
      options.filter((option) => lower.includes(String(option).toLowerCase()));

    const genreMentions = collectOptionsMentioned([
      'rock',
      'pop',
      'country',
      'americana',
      'indie',
      'worship',
      'jazz',
      'fusion',
      'funk',
      'r&b',
      'hip-hop',
      'latin',
      'metal',
      'alternative',
    ]);

    const tonalMentions = collectOptionsMentioned([
      'dry / controlled',
      'sensitive / ghost-note friendly',
      'crisp',
      'fat / full',
      'open / resonant',
      'dark',
      'bright',
      'warm',
      'articulate',
      'punchy',
    ]);

    const responseMentions = collectOptionsMentioned([
      'brush sensitivity',
      'consistent feel across tunings',
      'easy to record',
      'easy to mix live',
      'clear ghost notes',
      'smooth dynamic range',
      'strong backbeat',
      'wide tuning range',
    ]);

    const finishMentions = collectOptionsMentioned([
      'natural oil',
      'satin clear',
      'high gloss clear',
      'burst / fade',
      'painted finish',
      'resin-accented',
      'mappa burl',
    ]);

    const hardwareMentions = collectOptionsMentioned([
      'chrome',
      'black nickel',
      'brass / gold',
      'brass',
      'gold',
    ]);

    const sizeDirection =
      firstMatch(
        /\b(?:size|diameter|preferred size|size direction)\s*[:\-]\s*([^\n.]+)/i,
        /\b(over 14"|14"|13"|under 13")\b/i
      ) || '';

    const desiredOutcome =
      firstMatch(
        /\b(?:goal|desired outcome|main goal|primary goal)\s*[:\-]\s*([^\n.]+)/i,
        /\blooking for\s+([^\n.]+)/i,
        /\bwant(?:ing)?\s+([^\n.]+)/i
      ) ||
      (detectAny(['off the shelf'])
        ? 'Something unique I cannot get off the shelf'
        : '');

    const currentPainPoints =
      firstMatch(
        /\b(?:pain point|pain points|frustration|problem|issue)\s*[:\-]\s*([^\n.]+)/i,
        /\btoo\s+dry\b([^.\n]*)/i
      ) || '';

    const influenceMentions = collectOptionsMentioned([
      'collecting',
      'recording',
      'live performance',
      'worship',
      'studio work',
      'legacy / heirloom',
      'metallica',
    ]);

    const visualMood =
      firstMatch(
        /\b(?:visual mood|visual direction|look|aesthetic)\s*[:\-]\s*([^\n.]+)/i
      ) || '';

    const finishDirection =
      firstMatch(
        /\b(?:finish direction|finish|surface direction)\s*[:\-]\s*([^\n.]+)/i
      ) || (finishMentions.length ? finishMentions.join(', ') : '');

    const woodPreference =
      firstMatch(
        /\b(?:wood preference|shell wood|wood)\s*[:\-]\s*([^\n.]+)/i
      ) || '';

    const styleOfPlaying =
      firstMatch(
        /\b(?:style of playing|playing style|player profile)\s*[:\-]\s*([^\n.]+)/i
      ) ||
      (detectAny(['ghost note', 'dynamic'])
        ? 'dynamic and touch-sensitive'
        : '');

    const primaryUseCase =
      firstMatch(/\b(?:primary use|use case)\s*[:\-]\s*([^\n.]+)/i) ||
      (detectAny(['live performance', 'playing live', 'live shows'])
        ? 'live performance'
        : detectAny(['studio', 'recording'])
          ? 'studio'
          : '');

    const attack = detectAny(['quick attack'])
      ? 'quick attack'
      : detectAny(['controlled attack', 'controlled'])
        ? 'controlled attack'
        : '';

    const body = detectAny([
      'fat / full',
      'full-bodied',
      'full body',
      'full-bodied response',
    ])
      ? 'full-bodied response'
      : '';

    const sensitivity = detectAny([
      'high sensitivity',
      'ghost-note friendly',
      'ghost notes',
    ])
      ? 'high sensitivity'
      : '';

    const projection = detectAny(['balanced projection'])
      ? 'balanced projection'
      : detectAny(['high projection'])
        ? 'high'
        : detectAny(['low projection'])
          ? 'low'
          : '';

    const tuningRange =
      firstMatch(
        /\b(?:tuning range)\s*[:\-]\s*([^\n.]+)/i,
        /\b(medium-to-medium-high|medium to medium high|wide|high|medium|low)\b/i
      ) || '';

    const articulation = detectAny(['mixed'])
      ? 'mixed'
      : detectAny(['crisp'])
        ? 'crisp'
        : detectAny(['dry'])
          ? 'dry'
          : '';

    const feel = detectAny(['deeper feel', 'deep feel'])
      ? 'deeper feel'
      : detectAny(['tight feel'])
        ? 'tight feel'
        : '';

    return {
      artistName: existing.artistName || deriveCustomerName(projectData) || '',

      projectName:
        existing.projectName || deriveBestProjectName(projectData) || '',

      primaryUseCase: existing.primaryUseCase || primaryUseCase,

      styleOfPlaying: existing.styleOfPlaying || styleOfPlaying,

      diameter:
        existing.diameter || projectData?.width || projectData?.diameter || '',

      depth:
        existing.depth || projectData?.shellDepth || projectData?.depth || '',

      genreContext:
        existing.genreContext ||
        (genreMentions.length ? genreMentions.join(', ') : ''),

      desiredOutcome: existing.desiredOutcome || desiredOutcome,

      currentPainPoints: existing.currentPainPoints || currentPainPoints,

      influenceReferences:
        existing.influenceReferences ||
        (influenceMentions.length ? influenceMentions.join(', ') : ''),

      visualMood: existing.visualMood || visualMood,

      finishDirection: existing.finishDirection || finishDirection,

      woodPreference: existing.woodPreference || woodPreference,

      attack: existing.attack || attack,

      body: existing.body || body,

      sensitivity: existing.sensitivity || sensitivity,

      sustain: existing.sustain || '',

      projection: existing.projection || projection,

      tuningRange: existing.tuningRange || tuningRange,

      articulation: existing.articulation || articulation,

      feel: existing.feel || feel,

      responsePriorities:
        existing.responsePriorities ||
        (responseMentions.length ? responseMentions.join(', ') : ''),

      tonalGoals:
        existing.tonalGoals ||
        (tonalMentions.length ? tonalMentions.join(', ') : ''),

      preferredSizeDirection: existing.preferredSizeDirection || sizeDirection,
    };
  };

  const extractQuestionnaireMappedFields = ({
    questionnaireRaw = '',
    existing = {},
  }) => {
    let parsed = null;

    try {
      parsed = questionnaireRaw ? JSON.parse(questionnaireRaw) : null;
    } catch {
      parsed = null;
    }

    const playingWorld = parsed?.playingWorld || {};
    const soundGoals = parsed?.soundGoals || {};
    const buildDirection = parsed?.buildDirection || {};
    const consultPrep = parsed?.consultPrep || {};

    const genres = Array.isArray(playingWorld?.genres)
      ? playingWorld.genres.join(', ')
      : '';

    const playSettings = Array.isArray(playingWorld?.playSettings)
      ? playingWorld.playSettings.join(', ')
      : '';

    const shellDirections = Array.isArray(buildDirection?.shellDirectionsOpenTo)
      ? buildDirection.shellDirectionsOpenTo.join(', ')
      : '';

    const visualDirectionRaw = Array.isArray(buildDirection?.visualDirection)
      ? buildDirection.visualDirection
      : [buildDirection?.visualDirection].filter(Boolean);

    const visualDirection = visualDirectionRaw
      .map((v) => sanitizeFreeformStoryValue(v))
      .filter(
        (v) =>
          v &&
          !["i'm not sure", 'im not sure', 'not sure', 'unsure'].includes(
            v.toLowerCase()
          )
      )
      .join(', ');

    const responsePriorities = Array.isArray(soundGoals?.responsePriorities)
      ? soundGoals.responsePriorities.join(', ')
      : '';

    const tonalGoals = Array.isArray(soundGoals?.tonalGoals)
      ? soundGoals.tonalGoals.join(', ')
      : '';

    return {
      artistName: existing.artistName || '',

      styleOfPlaying:
        existing.styleOfPlaying ||
        sanitizeFreeformStoryValue(playingWorld?.playerProfile || ''),

      desiredOutcome:
        existing.desiredOutcome ||
        sanitizeFreeformStoryValue(soundGoals?.primaryGoal || ''),

      genreContext:
        existing.genreContext || sanitizeCommaSeparatedStoryValue(genres),

      recordingUse:
        existing.recordingUse ||
        (Array.isArray(playingWorld?.playSettings) &&
        playingWorld.playSettings.some((v) =>
          String(v).toLowerCase().includes('record')
        )
          ? 'yes'
          : ''),

      liveUse:
        existing.liveUse ||
        (Array.isArray(playingWorld?.playSettings) &&
        playingWorld.playSettings.some((v) => {
          const lower = String(v).toLowerCase();
          return (
            lower.includes('live') ||
            lower.includes('show') ||
            lower.includes('church') ||
            lower.includes('worship')
          );
        })
          ? 'yes'
          : ''),

      influenceReferences:
        existing.influenceReferences ||
        sanitizeFreeformStoryValue(playSettings),

      hardwareFinish:
        existing.hardwareFinish ||
        sanitizeFreeformStoryValue(
          buildDirection?.hardwareFinishPreference || ''
        ),

      woodPreference:
        existing.woodPreference || sanitizeFreeformStoryValue(shellDirections),

      finishDirection: existing.finishDirection || visualDirection || '',

      responsePriorities:
        existing.responsePriorities ||
        sanitizeFreeformStoryValue(responsePriorities),

      tonalGoals: existing.tonalGoals || sanitizeFreeformStoryValue(tonalGoals),

      preferredSizeDirection:
        existing.preferredSizeDirection ||
        sanitizeFreeformStoryValue(
          buildDirection?.preferredSizeDirection || ''
        ),

      consultationContactMethod:
        existing.consultationContactMethod ||
        sanitizeFreeformStoryValue(
          consultPrep?.consultationContactMethod || ''
        ),
    };
  };

  const callHybridChapter = async ({
    chapterKey,
    sectionKey,
    payload,
    prompts,
    model = 'gpt-4.1-mini',
    timeoutMs = 45000,
  }) => {
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, 'generateHybridStoryChapter');

    // console.log('[StoryEngine] starting hybrid chapter:', {
    //   chapterKey,
    //   sectionKey,
    // });

    const result = await Promise.race([
      callable({
        chapterKey,
        sectionKey,
        payload,
        prompts,
        model,
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(
            new Error(
              `Hybrid callable timed out for ${chapterKey}.${sectionKey || 'unknown'}`
            )
          );
        }, timeoutMs)
      ),
    ]);

    // console.log('[StoryEngine] finished hybrid chapter:', {
    //   chapterKey,
    //   sectionKey,
    // });

    return result?.data?.result || null;
  };

  const normalizeConsultationTranscript = async ({
    rawTranscript,
    artistName,
    timeoutMs = 45000,
  }) => {
    const functions = getFunctions(app);
    const callable = httpsCallable(
      functions,
      'normalizeConsultationTranscript'
    );

    try {
      const result = await Promise.race([
        callable({
          rawTranscriptText: rawTranscript,
          artistName,
        }),
        new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error('Transcript normalization timed out'));
          }, timeoutMs)
        ),
      ]);

      const turns = result?.data?.result?.turns || result?.data?.turns || [];

      if (!Array.isArray(turns)) {
        throw new Error('Transcript normalization returned an invalid shape');
      }

      return turns;
    } catch (err) {
      const message =
        err?.details ||
        err?.message ||
        err?.customData?.message ||
        'Transcript normalization failed';

      throw new Error(message);
    }
  };

  const handleRunStoryEngine = async () => {
    try {
      setStoryEngineRunning(true);

      let record = createEmptyStoryEngineRecord();
      record.projectId = projectData?.id || null;

      const resolvedArtistName = deriveBestArtistName(
        projectData,
        storyEngineData
      );

      const autoConsultationMapped = sanitizeStoryFieldGroup({
        ...(storyEngineData.consultationMapped || {}),
        ...extractConsultationMappedFields({
          transcript: storyEngineData.consultationTranscript,
          summary: storyEngineData.consultationSummary,
          adminNotes: storyEngineData.adminNotes,
          projectData,
          existing: storyEngineData.consultationMapped || {},
        }),
      });

      const autoQuestionnaireMapped = sanitizeStoryFieldGroup({
        ...(storyEngineData.questionnaireMapped || {}),
        ...extractQuestionnaireMappedFields({
          questionnaireRaw: storyEngineData.questionnaireRaw,
          existing: storyEngineData.questionnaireMapped || {},
        }),
      });

      const questionnaireRawParsed = (() => {
        try {
          return storyEngineData.questionnaireRaw
            ? JSON.parse(storyEngineData.questionnaireRaw)
            : null;
        } catch {
          return null;
        }
      })();

      const tonalGoals = Array.isArray(
        questionnaireRawParsed?.soundGoals?.tonalGoals
      )
        ? questionnaireRawParsed.soundGoals.tonalGoals
        : [];

      const consultationBackfilledFromQuestionnaire = sanitizeStoryFieldGroup({
        ...autoConsultationMapped,

        primaryUseCase:
          autoConsultationMapped.primaryUseCase ||
          (autoQuestionnaireMapped.liveUse === 'yes'
            ? 'live performance'
            : autoQuestionnaireMapped.recordingUse === 'yes'
              ? 'studio'
              : ''),

        desiredOutcome:
          autoConsultationMapped.desiredOutcome ||
          autoQuestionnaireMapped.desiredOutcome ||
          '',

        influenceReferences:
          autoConsultationMapped.influenceReferences ||
          autoQuestionnaireMapped.influenceReferences ||
          '',

        finishDirection:
          autoConsultationMapped.finishDirection ||
          autoQuestionnaireMapped.finishDirection ||
          '',

        responsePriorities:
          autoConsultationMapped.responsePriorities ||
          autoQuestionnaireMapped.responsePriorities ||
          '',

        tonalGoals:
          autoConsultationMapped.tonalGoals ||
          autoQuestionnaireMapped.tonalGoals ||
          '',

        preferredSizeDirection:
          autoConsultationMapped.preferredSizeDirection ||
          autoQuestionnaireMapped.preferredSizeDirection ||
          '',

        styleOfPlaying:
          autoConsultationMapped.styleOfPlaying ||
          (tonalGoals.includes('Sensitive / ghost-note friendly')
            ? 'dynamic and touch-sensitive'
            : ''),

        attack: normalizeStoryDescriptor(
          'attack',
          autoConsultationMapped.attack ||
            (tonalGoals.includes('Warm') ? 'controlled' : '')
        ),

        body: normalizeStoryDescriptor(
          'body',
          autoConsultationMapped.body ||
            (tonalGoals.includes('Fat / full') ? 'full' : '')
        ),

        projection: normalizeStoryDescriptor(
          'projection',
          autoConsultationMapped.projection
        ),

        sensitivity: normalizeStoryDescriptor(
          'sensitivity',
          autoConsultationMapped.sensitivity ||
            (tonalGoals.includes('Sensitive / ghost-note friendly')
              ? 'high'
              : '')
        ),

        feel: normalizeStoryDescriptor('feel', autoConsultationMapped.feel),

        visualMood:
          autoConsultationMapped.visualMood ||
          autoQuestionnaireMapped.finishDirection ||
          '',
      });

      const sanitizedConsultationMapped = {
        ...consultationBackfilledFromQuestionnaire,
        artistName:
          resolvedArtistName ||
          consultationBackfilledFromQuestionnaire?.artistName ||
          '',
      };

      const sanitizedQuestionnaireMapped = {
        ...autoQuestionnaireMapped,
        artistName:
          resolvedArtistName || autoQuestionnaireMapped?.artistName || '',
      };

      const derivedConsultationSummary =
        sanitizeFreeformStoryValue(storyEngineData.consultationSummary) ||
        sanitizeFreeformStoryValue(
          [
            sanitizedConsultationMapped.primaryUseCase &&
              `Primary use: ${sanitizedConsultationMapped.primaryUseCase}.`,
            sanitizedConsultationMapped.desiredOutcome &&
              `Goal: ${sanitizedConsultationMapped.desiredOutcome}.`,
            sanitizedConsultationMapped.genreContext &&
              `Context: ${sanitizedConsultationMapped.genreContext}.`,
            sanitizedConsultationMapped.influenceReferences &&
              `References: ${sanitizedConsultationMapped.influenceReferences}.`,
            sanitizedConsultationMapped.finishDirection &&
              `Finish direction: ${sanitizedConsultationMapped.finishDirection}.`,
            sanitizedConsultationMapped.responsePriorities &&
              `Response priorities: ${sanitizedConsultationMapped.responsePriorities}.`,
            sanitizedConsultationMapped.tonalGoals &&
              `Tonal goals: ${sanitizedConsultationMapped.tonalGoals}.`,
            sanitizedConsultationMapped.currentPainPoints &&
              `Pain points: ${sanitizedConsultationMapped.currentPainPoints}.`,
          ]
            .filter(Boolean)
            .join(' ')
        );

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
        content: [derivedConsultationSummary, storyEngineData.adminNotes]
          .filter(Boolean)
          .join('\n\n'),
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      record = registerSource(record, consultationSource);
      record = registerSource(record, questionnaireSource);
      record = registerSource(record, adminNotesSource);

      const consultationFieldMap = createAdminFieldMapFromConsultation(
        sanitizedConsultationMapped
      );

      const questionnaireFieldMap = createAdminFieldMapFromQuestionnaire(
        sanitizedQuestionnaireMapped
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

      // DEBUG MODE: run only one chapter first until this is stable.
      const HYBRID_TEST_CHAPTERS = ['commitmentPortal'];

      for (const chapterKey of HYBRID_TEST_CHAPTERS) {
        const chapter = record?.chapters?.[chapterKey];
        if (!chapter) continue;

        const payload = {
          projectId: projectData?.id || '',
          chapterKey,
          chapterLabel: chapter?.label || chapterKey,
          artistName: resolvedArtistName || '',
          projectName: deriveBestProjectName(projectData) || '',
          consultationMapped: sanitizedConsultationMapped,
          questionnaireMapped: sanitizedQuestionnaireMapped,
          buildSpec: record?.buildSpec || {},
          recommendations: record?.recommendations || {},
          engineMeta: record?.engineMeta || {},
        };

        try {
          const hybridResult = await callHybridChapter({
            chapterKey,
            payload,
            prompts: HYBRID_CHAPTER_PROMPTS,
          });

          if (hybridResult?.chapterOverview) {
            record.chapters[chapterKey].storySections.chapterOverview = {
              ...record.chapters[chapterKey].storySections.chapterOverview,
              text: hybridResult.chapterOverview,
              locked:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.locked || false,
              lockedAt:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.lockedAt || null,
              lockedBy:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.lockedBy || '',
              lastGeneratedAt: new Date().toISOString(),
              lastGeneratedBy: 'admin',
            };
          }

          if (hybridResult?.buildNotes?.length) {
            record.chapters[chapterKey].storySections.buildNotesStory = {
              ...record.chapters[chapterKey].storySections.buildNotesStory,
              text: hybridResult.buildNotes.join('\n'),
              bulletItems: hybridResult.buildNotes,
              locked:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.locked || false,
              lockedAt:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.lockedAt || null,
              lockedBy:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.lockedBy || '',
              lastGeneratedAt: new Date().toISOString(),
              lastGeneratedBy: 'admin',
            };
          }
        } catch (err) {
          console.error(`Hybrid generation failed for ${chapterKey}:`, err);
        }
      }

      const draftPreview = {
        discoveryDesign: record?.chapters?.discoveryDesign?.storySections || {},
        commitmentPortal:
          record?.chapters?.commitmentPortal?.storySections || {},
        woodVisionLockIn:
          record?.chapters?.woodVisionLockIn?.storySections || {},
        rawShellCreation:
          record?.chapters?.rawShellCreation?.storySections || {},
        shellTrueingTorchTune:
          record?.chapters?.shellTrueingTorchTune?.storySections || {},
        exteriorArtFinish:
          record?.chapters?.exteriorArtFinish?.storySections || {},
        edgesSnareBeds: record?.chapters?.edgesSnareBeds?.storySections || {},
        hardwareAssembly:
          record?.chapters?.hardwareAssembly?.storySections || {},
        legacyTuningMedia:
          record?.chapters?.legacyTuningMedia?.storySections || {},
        finalQAPackagingDelivery:
          record?.chapters?.finalQAPackagingDelivery?.storySections || {},
      };

      const nextState = {
        ...storyEngineData,
        consultationSummary: derivedConsultationSummary,
        consultationMapped: sanitizedConsultationMapped,
        questionnaireMapped: sanitizedQuestionnaireMapped,
        engineRecord: record,
        draftPreview,
      };

      setStoryEngineData(nextState);

      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: nextState.consultationTranscript,
          consultationTranscriptTurns: normalizedTranscriptTurns,
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

  const BUILD_SPEC_FIELD_LABEL_MAP = Object.fromEntries(
    STORY_ENGINE_BUILD_SPEC_FIELDS.map((field) => [field.key, field.label])
  );

  const getOutstandingItemHelp = ({ id, type, fieldKey, prompt }) => {
    if (id === 'consultation-transcript') {
      return {
        resolutionTitle: 'How to resolve',
        resolutionSteps: [
          'Paste the full consultation call transcript into Intake & Direction.',
          'Open the Intake & Direction tab.',
          'Scroll to "Full Consultation Transcript".',
          'Paste the transcript, then click "Save Intake Inputs".',
        ],
        questionsToAsk: [
          'What is the drum mainly for: live, studio, or both?',
          'What kind of response are you chasing: dry, open, fat, articulate, sensitive?',
          'What references or existing drum sounds are closest to the goal?',
          'What visual direction already feels right?',
        ],
        whereToUpdate:
          'Admin → Project → Intake & Direction → Full Consultation Transcript',
      };
    }

    if (id === 'consultation-summary') {
      return {
        resolutionTitle: 'How to resolve',
        resolutionSteps: [
          'Write a short builder-facing summary of the consultation.',
          'Capture the main sound goals, build direction, open questions, and constraints.',
          'Save it in the Consultation Summary field.',
        ],
        questionsToAsk: [
          'What 2–3 takeaways matter most from the call?',
          'What decisions feel real already?',
          'What still needs confirmation before story drafting?',
        ],
        whereToUpdate:
          'Admin → Project → Intake & Direction → Consultation Summary',
      };
    }

    if (id === 'questionnaire-raw') {
      return {
        resolutionTitle: 'How to resolve',
        resolutionSteps: [
          'Paste the questionnaire payload or structured intake response into Questionnaire Raw.',
          'If the artist has not completed it yet, send or collect the intake first.',
          'Save the intake before rerunning Story Engine.',
        ],
        questionsToAsk: [
          'What genres or playing contexts matter most?',
          'What tonal goals matter most?',
          'What finish / hardware / shell directions are they open to?',
          'Is there a preferred size direction?',
        ],
        whereToUpdate:
          'Admin → Project → Intake & Direction → Questionnaire Raw',
      };
    }

    if (type === 'buildspec') {
      const prettyLabel =
        BUILD_SPEC_FIELD_LABEL_MAP[fieldKey] || 'Build Direction';

      const fieldSpecificQuestions = {
        shellConstruction: [
          'Are we leaning stave, ply, or hybrid?',
          'Is there a structural reason this choice best fits the sound target?',
        ],
        primaryWood: [
          'What wood feels most aligned with the tonal goal?',
          'Is this choice confirmed or still exploratory?',
        ],
        secondaryWood: [
          'Is a secondary wood actually part of the build?',
          'If yes, what role should it play visually or tonally?',
        ],
        lugCount: [
          'Does the artist want a more open feel or more tension points?',
          'Is lug count already decided from size / style preferences?',
        ],
        tuningApproach: [
          'Is the drum meant to sit low, medium, high, or across a wider range?',
          'Should tuning behavior favor control, openness, or flexibility?',
        ],
        finishSystem: [
          'Are we leaning gloss, satin, oil, lacquer, or another finish direction?',
          'Does the finish need to prioritize grain reveal, depth, durability, or restraint?',
        ],
        hardwareFinish: [
          'Chrome, black nickel, brass/gold, or something else?',
          'Is this visually locked or still in play?',
        ],
      };

      return {
        resolutionTitle: `How to confirm ${prettyLabel}`,
        resolutionSteps: [
          'Open Story Studio.',
          `Find "${prettyLabel}" in Build Direction Controls.`,
          'Choose or type the confirmed direction.',
          'Click "Save Studio State".',
          'Rerun Story Engine after confirming the field.',
        ],
        questionsToAsk: fieldSpecificQuestions[fieldKey] || [
          `What should the final direction be for ${prettyLabel}?`,
          'Is this truly confirmed, or still open?',
          'Does this choice affect the sound, feel, or visual direction in a meaningful way?',
        ],
        whereToUpdate: `Admin → Project → Story Studio → Build Direction Controls → ${prettyLabel}`,
      };
    }

    if (type === 'prompt') {
      return {
        resolutionTitle: 'How to resolve engine prompt',
        resolutionSteps: [
          'Read the prompt carefully and identify which field lacks support.',
          'Open Intake & Direction or Story Studio depending on the missing detail.',
          'Add stronger source material or manually confirm the field.',
          'Save changes and rerun Story Engine.',
        ],
        questionsToAsk: [
          'What evidence actually supports this direction?',
          'Was this stated by the artist, inferred from the call, or assumed by us?',
          'Do we need to ask a follow-up question before locking it?',
        ],
        whereToUpdate:
          'Usually Intake & Direction for source truth, or Story Studio for manual build confirmation',
      };
    }

    if (type === 'chapter') {
      return {
        resolutionTitle: 'How to resolve chapter output',
        resolutionSteps: [
          'Make sure intake inputs and build direction fields are complete first.',
          'Run Story Engine again.',
          'If needed, use the chapter Regenerate button once core inputs are stronger.',
          'Lock the section only after the output reads correctly.',
        ],
        questionsToAsk: [
          'Do we have enough real source material for this chapter?',
          'Is the build direction specific enough to avoid generic copy?',
          'What still needs confirmation before this chapter should be generated?',
        ],
        whereToUpdate: 'Admin → Project → Story Studio → Story Studio Chapters',
      };
    }

    return {
      resolutionTitle: 'How to resolve',
      resolutionSteps: [
        'Review the missing item.',
        'Add or confirm the supporting information.',
        'Save changes and rerun Story Engine.',
      ],
      questionsToAsk: [],
      whereToUpdate: 'Story Studio or Intake & Direction',
    };
  };

  const storyStudioOutstandingItems = (() => {
    const items = [];

    if (!storyEngineData?.consultationTranscript?.trim()) {
      items.push({
        id: 'consultation-transcript',
        label: 'Add consultation transcript',
        type: 'source',
        ...getOutstandingItemHelp({
          id: 'consultation-transcript',
          type: 'source',
        }),
      });
    }

    const effectiveConsultationSummary =
      sanitizeFreeformStoryValue(storyEngineData?.consultationSummary) ||
      sanitizeFreeformStoryValue(
        [
          storyEngineData?.consultationMapped?.primaryUseCase &&
            `Primary use: ${storyEngineData.consultationMapped.primaryUseCase}.`,
          storyEngineData?.consultationMapped?.desiredOutcome &&
            `Goal: ${storyEngineData.consultationMapped.desiredOutcome}.`,
          storyEngineData?.consultationMapped?.genreContext &&
            `Context: ${storyEngineData.consultationMapped.genreContext}.`,
          storyEngineData?.consultationMapped?.influenceReferences &&
            `References: ${storyEngineData.consultationMapped.influenceReferences}.`,
          storyEngineData?.consultationMapped?.finishDirection &&
            `Finish direction: ${storyEngineData.consultationMapped.finishDirection}.`,
          storyEngineData?.consultationMapped?.responsePriorities &&
            `Response priorities: ${storyEngineData.consultationMapped.responsePriorities}.`,
          storyEngineData?.consultationMapped?.tonalGoals &&
            `Tonal goals: ${storyEngineData.consultationMapped.tonalGoals}.`,
          storyEngineData?.consultationMapped?.currentPainPoints &&
            `Pain points: ${storyEngineData.consultationMapped.currentPainPoints}.`,
        ]
          .filter(Boolean)
          .join(' ')
      );

    if (!effectiveConsultationSummary) {
      items.push({
        id: 'consultation-summary',
        label: 'Add consultation summary',
        type: 'source',
        ...getOutstandingItemHelp({
          id: 'consultation-summary',
          type: 'source',
        }),
      });
    }

    if (!storyEngineData?.questionnaireRaw?.trim()) {
      items.push({
        id: 'questionnaire-raw',
        label: 'Add questionnaire raw intake',
        type: 'source',
        ...getOutstandingItemHelp({
          id: 'questionnaire-raw',
          type: 'source',
        }),
      });
    }

    STORY_ENGINE_BUILD_SPEC_FIELDS.forEach((field) => {
      const value =
        storyEngineData?.engineRecord?.buildSpec?.[field.key]?.value || '';

      if (!String(value).trim()) {
        items.push({
          id: `buildspec-${field.key}`,
          label: `Confirm build direction: ${field.label}`,
          type: 'buildspec',
          fieldKey: field.key,
          ...getOutstandingItemHelp({
            id: `buildspec-${field.key}`,
            type: 'buildspec',
            fieldKey: field.key,
          }),
        });
      }
    });

    const adminPrompts =
      storyEngineData?.engineRecord?.engineMeta?.adminPrompts || [];

    adminPrompts.forEach((prompt, idx) => {
      items.push({
        id: `prompt-${prompt?.fieldKey || idx}`,
        label:
          prompt?.fieldKey && prompt?.reason
            ? `${prompt.fieldKey}: ${prompt.reason}`
            : prompt?.suggestion || 'Resolve engine prompt',
        type: 'prompt',
        prompt,
        ...getOutstandingItemHelp({
          id: `prompt-${prompt?.fieldKey || idx}`,
          type: 'prompt',
          prompt,
        }),
      });
    });

    const chapters = storyEngineData?.engineRecord?.chapters || {};

    Object.entries(chapters).forEach(([chapterKey, chapterValue]) => {
      const overviewText =
        chapterValue?.storySections?.chapterOverview?.text || '';
      const notesText =
        chapterValue?.storySections?.buildNotesStory?.text || '';

      if (!String(overviewText).trim()) {
        items.push({
          id: `${chapterKey}-overview`,
          label: `${chapterValue?.label || chapterKey}: generate chapter overview`,
          type: 'chapter',
          ...getOutstandingItemHelp({
            id: `${chapterKey}-overview`,
            type: 'chapter',
          }),
        });
      }

      if (!String(notesText).trim()) {
        items.push({
          id: `${chapterKey}-notes`,
          label: `${chapterValue?.label || chapterKey}: generate build notes`,
          type: 'chapter',
          ...getOutstandingItemHelp({
            id: `${chapterKey}-notes`,
            type: 'chapter',
          }),
        });
      }
    });

    return items;
  })();

  const storyStudioSummaryStats = {
    outstandingCount: storyStudioOutstandingItems.length,
    chapterCount: Object.keys(storyEngineData?.engineRecord?.chapters || {})
      .length,
    readiness:
      storyEngineData?.engineRecord?.engineMeta?.draftReadiness || 'not_ready',
    confidence: Math.round(
      (storyEngineData?.engineRecord?.engineMeta?.overallConfidence || 0) * 100
    ),
  };

  const helpOverlayPortal =
    outstandingHelpItem && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="mpm-story-help-overlay"
            onClick={() => setOutstandingHelpItem(null)}
          >
            <div
              className="mpm-story-help-modal"
              role="dialog"
              aria-modal="true"
              aria-label={outstandingHelpItem.label}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mpm-story-help-modal-head">
                <h4>{outstandingHelpItem.label}</h4>

                <button
                  type="button"
                  className="mpm-story-help-close"
                  onClick={() => setOutstandingHelpItem(null)}
                  aria-label="Close help"
                >
                  ✕
                </button>
              </div>

              {!!outstandingHelpItem.whereToUpdate && (
                <div className="mpm-story-help-block">
                  <strong>Update here</strong>
                  <p>{outstandingHelpItem.whereToUpdate}</p>
                </div>
              )}

              {!!outstandingHelpItem.resolutionSteps?.length && (
                <div className="mpm-story-help-block">
                  <strong>How to resolve</strong>
                  <ul>
                    {outstandingHelpItem.resolutionSteps.map((step, idx) => (
                      <li key={`${outstandingHelpItem.id}-step-${idx}`}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!outstandingHelpItem.questionsToAsk?.length && (
                <div className="mpm-story-help-block">
                  <strong>Questions to ask the artist</strong>
                  <ul>
                    {outstandingHelpItem.questionsToAsk.map((question, idx) => (
                      <li key={`${outstandingHelpItem.id}-question-${idx}`}>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  const renderMappedFieldControl = ({ field, value, onChange }) => {
    const options = QUESTIONNAIRE_OPTION_SETS[field.key] || [];

    const multiFields = [
      'genreContext',
      'influenceReferences',
      'responsePriorities',
      'tonalGoals',
      'woodPreference',
    ];

    const noOtherFields = [
      'hardwareFinish',
      'consultationContactMethod',
      'attack',
      'body',
      'sensitivity',
      'projection',
      'tuningRange',
      'articulation',
      'feel',
    ];

    const isMulti = multiFields.includes(field.key);
    const supportsOther =
      options.length > 0 && !noOtherFields.includes(field.key);

    if (!options.length) {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    if (!isMulti) {
      const selectedValue = value || '';
      const normalizedSelectedValue = String(selectedValue || '').trim();
      const isOtherSelected =
        normalizedSelectedValue && !options.includes(normalizedSelectedValue);

      return (
        <>
          <select
            value={isOtherSelected ? '__other__' : selectedValue}
            onChange={(e) => {
              const next = e.target.value;

              if (next === '__other__') {
                onChange('__other__');
                return;
              }

              onChange(next);
            }}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {supportsOther ? <option value="__other__">Other</option> : null}
          </select>

          {supportsOther && isOtherSelected ? (
            <input
              type="text"
              placeholder="Enter other..."
              value={isOtherSelected ? selectedValue : ''}
              onChange={(e) => onChange(e.target.value)}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </>
      );
    }

    const selectedValues = splitMultiValue(value);
    const standardValues = selectedValues.filter((v) => options.includes(v));
    const otherValues = [...new Set(getOtherValues(selectedValues, options))];
    const hasOther = otherValues.length > 0;

    return (
      <>
        <div
          className="mpm-multi-check-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          {options.map((option) => {
            const checked = standardValues.includes(option);

            return (
              <label
                key={option}
                className="mpm-check-option"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.92rem',
                  color: 'var(--mpm-ink)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const nextStandardValues = e.target.checked
                      ? [...standardValues, option]
                      : standardValues.filter((v) => v !== option);

                    onChange(
                      joinMultiValue([...nextStandardValues, ...otherValues])
                    );
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}

          {supportsOther ? (
            <label
              className="mpm-check-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.92rem',
                color: 'var(--mpm-ink)',
              }}
            >
              <input
                type="checkbox"
                checked={hasOther}
                onChange={(e) => {
                  if (!e.target.checked) {
                    onChange(joinMultiValue(standardValues));
                    return;
                  }

                  if (!hasOther) {
                    onChange(joinMultiValue([...selectedValues, 'Other']));
                    return;
                  }

                  onChange(joinMultiValue(selectedValues));
                }}
              />
              <span>Other</span>
            </label>
          ) : null}
        </div>

        {supportsOther && hasOther ? (
          <input
            type="text"
            placeholder="Enter other..."
            value={otherValues.join(', ')}
            onChange={(e) => {
              const customValues = splitMultiValue(e.target.value).filter(
                (v) => v.toLowerCase() !== 'other'
              );

              onChange(
                joinMultiValue(
                  customValues.length
                    ? [...standardValues, ...customValues]
                    : standardValues
                )
              );
            }}
            style={{ marginTop: 10 }}
          />
        ) : null}
      </>
    );
  };

  return (
    <div className="manage-project-modal-overlay mpm-overlay" onClick={onClose}>
      <div
        className={`manage-project-modal-content mpm-modal mpm-light ${
          outstandingHelpItem ? 'mpm-help-open' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mpm-header">
          <div className="mpm-header-top">
            <div className="mpm-header-identity">
              <div className="mpm-header-kicker">SoundLegend Project</div>

              <div className="mpm-header-project-id-row">
                <span className="mpm-header-project-id-label">Project ID</span>
                <span className="mpm-header-project-id-value">{idText}</span>
                <button
                  type="button"
                  className="mpm-copy-icon-btn"
                  onClick={() => navigator.clipboard?.writeText(String(idText))}
                  title="Copy project ID"
                  aria-label="Copy project ID"
                >
                  ⧉
                </button>
              </div>

              <div className="mpm-header-primary-row">
                <h2 id="admin-project-view-title" className="mpm-title">
                  {storyEngineData.consultationMapped.artistName ||
                    storyEngineData.questionnaireMapped.artistName ||
                    deriveCustomerName(projectData) ||
                    'Unassigned Artist'}{' '}
                </h2>

                <button
                  type="button"
                  className="mpm-copy-icon-btn"
                  onClick={() =>
                    navigator.clipboard?.writeText(
                      deriveCustomerName(projectData) || ''
                    )
                  }
                  title="Copy artist name"
                  aria-label="Copy artist name"
                >
                  ⧉
                </button>
              </div>

              <div className="mpm-header-secondary-row">
                <span className="mpm-header-email">
                  {deriveCustomerEmail(projectData) || 'No email linked'}
                </span>

                {deriveCustomerEmail(projectData) ? (
                  <button
                    type="button"
                    className="mpm-copy-icon-btn"
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        deriveCustomerEmail(projectData) || ''
                      )
                    }
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    ⧉
                  </button>
                ) : null}
              </div>

              <div className="mpm-header-actions-row mpm-header-actions-row-compact">
                {projectData?.id ? (
                  <button
                    type="button"
                    className="mpm-action-btn mpm-action-btn-compact"
                    onClick={handleViewAsCustomer}
                  >
                    Artist Portal ↗
                  </button>
                ) : null}

                {/* {projectData?.id ? (
                  <a
                    className="mpm-action-btn mpm-action-btn-link mpm-action-btn-compact"
                    href={`/legacy?projectId=${projectData.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Admin ↗
                  </a>
                ) : null} */}
              </div>
            </div>

            <button
              type="button"
              aria-label="Close modal"
              className="mpm-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="mpm-header-quick-stats">
            <div className="mpm-header-quick-stat">
              <span className="mpm-header-quick-label">Status</span>
              <strong className="mpm-header-quick-value">{status}</strong>
            </div>

            <div className="mpm-header-quick-stat">
              <span className="mpm-header-quick-label">Progress</span>
              <strong className="mpm-header-quick-value">
                {weightedProgress}%
              </strong>
            </div>

            <div className="mpm-header-quick-stat mpm-header-quick-stat-wide">
              <span className="mpm-header-quick-label">Current Chapter</span>
              <strong className="mpm-header-quick-value">
                {currentPhaseLabel}
              </strong>
            </div>

            <div className="mpm-header-quick-stat">
              <span className="mpm-header-quick-label">Target</span>
              <strong className="mpm-header-quick-value">
                {fmtMDY(projectData?.targetCompletion)}
              </strong>
            </div>

            <div className="mpm-header-quick-stat">
              <span className="mpm-header-quick-label">Time Logged</span>
              <strong className="mpm-header-quick-value">
                {formatFullTime(calculateProjectTotalTime())}
              </strong>
            </div>
          </div>
        </header>
        <div className="mpm-body">
          <div className="mpm-mobile-phase-selector-wrapper">
            <select
              className="mpm-phase-selector-dropdown"
              value={getMobileSelectValue()}
              onChange={(e) => {
                const val = e.target.value;

                if (
                  val === ADMIN_SECTIONS.RECORD ||
                  val === ADMIN_SECTIONS.INTAKE ||
                  val === ADMIN_SECTIONS.STORY_STUDIO
                ) {
                  setSelectedTab(val);
                  return;
                }

                if (val === ADMIN_SECTIONS.BUILD) {
                  setSelectedTab(ADMIN_SECTIONS.BUILD);
                  setExpandedStepKey(buildPhases[0]?.key || null);
                  setSelectedStepKey(buildPhases[0]?.key || null);
                  setSelectedSubIndex(0);
                  return;
                }

                if (val.startsWith(`${ADMIN_SECTIONS.BUILD}::`)) {
                  const [, stepKey, idxStr] = val.split('::');
                  const idx = Number(idxStr) || 0;

                  setSelectedTab(ADMIN_SECTIONS.BUILD);
                  setExpandedStepKey(stepKey);
                  setSelectedStepKey(stepKey);
                  setSelectedSubIndex(idx);
                }
              }}
            >
              <option value={ADMIN_SECTIONS.RECORD}>Project Record</option>
              <option value={ADMIN_SECTIONS.INTAKE}>Intake & Direction</option>
              <option value={ADMIN_SECTIONS.STORY_STUDIO}>Story Studio</option>
              <option value={ADMIN_SECTIONS.BUILD}>Build Workflow</option>

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
                      const optionValue = `${ADMIN_SECTIONS.BUILD}::${phase.key}::${idx}`;

                      return (
                        <option key={optionValue} value={optionValue}>
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
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.label} className="mpm-sidebar-group">
                <div className="mpm-sidebar-group-label">{group.label}</div>

                <div className="mpm-sidebar-group-buttons">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      className={`mpm-sidebar-overview-btn ${
                        selectedTab === item.key ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedTab(item.key);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mpm-sidebar-group">
              <div className="mpm-sidebar-group-label">Build Workflow</div>

              <div className="mpm-sidebar-step-list always-open">
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
                          selectedTab === ADMIN_SECTIONS.BUILD &&
                          selectedStepKey === step.key
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedTab(ADMIN_SECTIONS.BUILD);
                          setExpandedStepKey(step.key);
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
                                selectedTab === ADMIN_SECTIONS.BUILD &&
                                selectedStepKey === step.key &&
                                selectedSubIndex === idx;

                              const states = Array.isArray(
                                item?.checkpointStates
                              )
                                ? item.checkpointStates
                                : [];

                              const checkpointsDone =
                                states.length > 0 && states.every(Boolean);

                              const isDone =
                                !!item?.completed || checkpointsDone;

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
                                      setSelectedTab(ADMIN_SECTIONS.BUILD);
                                      setExpandedStepKey(step.key);
                                      setSelectedStepKey(step.key);
                                      setSelectedSubIndex(idx);
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
            </div>
          </aside>

          <main className="mpm-main">
            {selectedTab === ADMIN_SECTIONS.RECORD ? (
              <div className="mpm-surface mpm-overview-scope">
                <div className="mpm-tab-shell">
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
              </div>
            ) : selectedTab === ADMIN_SECTIONS.INTAKE ? (
              <div className="mpm-surface mpm-overview-scope">
                <div className="mpm-tab-shell">
                  <div className="mpm-tab-section-header">
                    <div>
                      <div className="mpm-tab-kicker">Intake & Direction</div>
                      <h3 className="mpm-tab-title">Discovery inputs</h3>
                      <p className="mpm-tab-subtitle">
                        Consultation source material and mapped artistic /
                        technical direction for the build.
                      </p>
                    </div>

                    <div className="mpm-tab-actions">
                      <button
                        type="button"
                        className="mpm-bulk-btn"
                        onClick={handleNormalizeTranscript}
                        disabled={
                          storyEngineRunning ||
                          isNormalizingTranscript ||
                          !String(
                            storyEngineData.consultationTranscript || ''
                          ).trim()
                        }
                      >
                        {isNormalizingTranscript
                          ? 'Formatting…'
                          : 'Format Conversation'}
                      </button>

                      <button
                        type="button"
                        className="mpm-bulk-btn"
                        onClick={() => saveStoryEngineToProject()}
                        disabled={storyEngineRunning || isNormalizingTranscript}
                      >
                        Save Intake Inputs
                      </button>
                    </div>
                  </div>

                  <div className="mpm-intake-stack">
                    <section
                      className={`mpm-intake-section ${
                        expandedIntakeSections.questionnaire ? 'is-open' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="mpm-intake-section-toggle"
                        onClick={() => toggleIntakeSection('questionnaire')}
                      >
                        <div className="mpm-intake-section-toggle-copy">
                          <span className="mpm-intake-section-kicker">
                            Section 1
                          </span>
                          <h4>Questionnaire Direction</h4>
                          <p>
                            Structured artist preferences pulled from
                            questionnaire data.
                          </p>
                        </div>
                        <span className="mpm-intake-section-toggle-icon">
                          {expandedIntakeSections.questionnaire ? '−' : '+'}
                        </span>
                      </button>

                      {expandedIntakeSections.questionnaire && (
                        <div className="mpm-intake-section-body">
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
                                    <div className="mpm-story-field">
                                      <span className="mpm-story-field-label">
                                        {field.label}
                                      </span>

                                      {renderMappedFieldControl({
                                        field,
                                        value:
                                          storyEngineData.questionnaireMapped[
                                            field.key
                                          ] || '',
                                        onChange: (nextValue) =>
                                          updateStoryEngineField(
                                            'questionnaireMapped',
                                            field.key,
                                            nextValue
                                          ),
                                      })}
                                    </div>

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
                        </div>
                      )}
                    </section>

                    <section
                      className={`mpm-intake-section ${
                        expandedIntakeSections.consultation ? 'is-open' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="mpm-intake-section-toggle"
                        onClick={() => toggleIntakeSection('consultation')}
                      >
                        <div className="mpm-intake-section-toggle-copy">
                          <span className="mpm-intake-section-kicker">
                            Section 2
                          </span>
                          <h4>Consultation Direction</h4>
                          <p>
                            Builder-facing interpretation of the live
                            conversation and artistic needs.
                          </p>
                        </div>
                        <span className="mpm-intake-section-toggle-icon">
                          {expandedIntakeSections.consultation ? '−' : '+'}
                        </span>
                      </button>

                      {expandedIntakeSections.consultation && (
                        <div className="mpm-intake-section-body">
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
                                    <div className="mpm-story-field">
                                      <span className="mpm-story-field-label">
                                        {field.label}
                                      </span>

                                      {renderMappedFieldControl({
                                        field,
                                        value:
                                          storyEngineData.consultationMapped[
                                            field.key
                                          ] || '',
                                        onChange: (nextValue) =>
                                          updateStoryEngineField(
                                            'consultationMapped',
                                            field.key,
                                            nextValue
                                          ),
                                      })}
                                    </div>

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
                        </div>
                      )}
                    </section>

                    <section
                      className={`mpm-intake-section ${
                        expandedIntakeSections.sources ? 'is-open' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="mpm-intake-section-toggle"
                        onClick={() => toggleIntakeSection('sources')}
                      >
                        <div className="mpm-intake-section-toggle-copy">
                          <span className="mpm-intake-section-kicker">
                            Section 3
                          </span>
                          <h4>Source Material</h4>
                          <p>
                            Transcript, summary, notes, and questionnaire
                            source-of-truth.
                          </p>
                        </div>
                        <span className="mpm-intake-section-toggle-icon">
                          {expandedIntakeSections.sources ? '−' : '+'}
                        </span>
                      </button>

                      {expandedIntakeSections.sources && (
                        <div className="mpm-intake-section-body">
                          <div className="mpm-story-form-grid">
                            <div className="mpm-story-field mpm-story-field-full">
                              <span className="mpm-story-field-label">
                                Full Consultation Transcript
                              </span>

                              <div className="mpm-transcript-shell">
                                <div className="mpm-code-header">
                                  <span>Conversation View</span>
                                  <span className="mpm-code-header-meta">
                                    {smartTranscriptTurns.length} turns
                                  </span>
                                </div>

                                <div className="mpm-transcript-thread">
                                  {smartTranscriptTurns.length ? (
                                    smartTranscriptTurns.map((turn) => (
                                      <div
                                        key={turn.id}
                                        className={`mpm-transcript-line ${
                                          turn.speaker === 'Ober Artisan'
                                            ? 'mpm-transcript-line-craftsman'
                                            : 'mpm-transcript-line-artist'
                                        }`}
                                      >
                                        <div className="mpm-transcript-speaker">
                                          <span className="mpm-transcript-speaker-chip">
                                            {turn.speaker}
                                          </span>
                                        </div>

                                        <div className="mpm-transcript-bubble">
                                          {turn.text}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="mpm-code-empty">
                                      No transcript added yet.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <textarea
                                value={storyEngineData.consultationTranscript}
                                onChange={(e) => {
                                  const nextValue = e.target.value;

                                  setStoryEngineData((prev) => ({
                                    ...prev,
                                    consultationTranscript: nextValue,
                                  }));

                                  setNormalizedTranscriptTurns([]);
                                }}
                                rows={8}
                                className="mpm-transcript-raw-input"
                                placeholder="Paste raw consultation transcript here..."
                              />
                            </div>

                            <div className="mpm-story-field">
                              <span className="mpm-story-field-label">
                                Consultation Summary
                              </span>

                              <div className="mpm-summary-shell">
                                {String(
                                  storyEngineData.consultationSummary || ''
                                )
                                  .split(/(?:\r?\n)+|(?<=\.)\s+(?=[A-Z])/)
                                  .map((line) => line.trim())
                                  .filter(Boolean).length ? (
                                  <ul className="mpm-summary-list">
                                    {String(
                                      storyEngineData.consultationSummary || ''
                                    )
                                      .split(/(?:\r?\n)+|(?<=\.)\s+(?=[A-Z])/)
                                      .map((line) => line.trim())
                                      .filter(Boolean)
                                      .map((line, idx) => (
                                        <li key={`consultation-summary-${idx}`}>
                                          {line}
                                        </li>
                                      ))}
                                  </ul>
                                ) : (
                                  <div className="mpm-code-empty">
                                    No consultation summary yet.
                                  </div>
                                )}
                              </div>
                            </div>

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

                            <div className="mpm-story-field mpm-story-field-full">
                              <span className="mpm-story-field-label">
                                Questionnaire Raw
                              </span>

                              <div className="mpm-code-shell">
                                <div className="mpm-code-header">
                                  <span>JSON</span>
                                  <span className="mpm-code-header-meta">
                                    Read only
                                  </span>
                                </div>

                                <pre className="mpm-code-block">
                                  <code>
                                    {formattedQuestionnaireRaw ||
                                      '// No questionnaire data yet'}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            ) : selectedTab === ADMIN_SECTIONS.STORY_STUDIO ? (
              <div className="mpm-surface mpm-overview-scope">
                <div className="mpm-tab-shell">
                  <div className="mpm-story-studio-hero">
                    <div className="mpm-story-studio-hero-copy">
                      <div className="mpm-tab-kicker">Story Studio</div>
                      <h3 className="mpm-tab-title">
                        Story engine + chapter output
                      </h3>
                      <p className="mpm-tab-subtitle">
                        Lock build direction, run story generation, resolve
                        outstanding items, and review chapter output before
                        publishing downstream.
                      </p>
                    </div>

                    <div className="mpm-story-studio-hero-actions">
                      <button
                        type="button"
                        className="mpm-bulk-btn"
                        onClick={handleRunStoryEngine}
                        disabled={storyEngineRunning}
                      >
                        {storyEngineRunning ? 'Running…' : 'Run Story Engine'}
                      </button>

                      <button
                        type="button"
                        className="mpm-bulk-btn"
                        onClick={() => saveStoryEngineToProject()}
                        disabled={storyEngineRunning}
                      >
                        Save Studio State
                      </button>
                    </div>
                  </div>

                  <section className="mpm-story-studio-summary">
                    <div className="mpm-story-studio-summary-card">
                      <span className="mpm-story-studio-summary-label">
                        Outstanding
                      </span>
                      <strong className="mpm-story-studio-summary-value">
                        {storyStudioSummaryStats.outstandingCount}
                      </strong>
                    </div>

                    <div className="mpm-story-studio-summary-card">
                      <span className="mpm-story-studio-summary-label">
                        Chapters
                      </span>
                      <strong className="mpm-story-studio-summary-value">
                        {storyStudioSummaryStats.chapterCount}
                      </strong>
                    </div>

                    <div className="mpm-story-studio-summary-card">
                      <span className="mpm-story-studio-summary-label">
                        Readiness
                      </span>
                      <strong className="mpm-story-studio-summary-value">
                        {storyStudioSummaryStats.readiness}
                      </strong>
                    </div>

                    <div className="mpm-story-studio-summary-card">
                      <span className="mpm-story-studio-summary-label">
                        Confidence
                      </span>
                      <strong className="mpm-story-studio-summary-value">
                        {storyStudioSummaryStats.confidence}%
                      </strong>
                    </div>
                  </section>

                  <section className="mpm-story-studio-outstanding">
                    <div className="mpm-story-studio-outstanding-head">
                      <div>
                        <h4 className="mpm-story-studio-section-title">
                          Outstanding items
                        </h4>
                        <p className="mpm-story-studio-section-subtitle">
                          These are the items still blocking a fully complete
                          intake + story build.
                        </p>
                      </div>
                    </div>

                    {storyStudioOutstandingItems.length ? (
                      <div className="mpm-story-studio-outstanding-list">
                        {storyStudioOutstandingItems.map((item) => (
                          <div
                            key={item.id}
                            className={`mpm-story-studio-outstanding-item mpm-story-studio-outstanding-item-${item.type}`}
                          >
                            <div className="mpm-story-studio-outstanding-main">
                              <span className="mpm-story-studio-outstanding-dot" />
                              <span className="mpm-story-studio-outstanding-text">
                                {item.label}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="mpm-story-studio-info-btn"
                              onClick={() =>
                                setOutstandingHelpItem((prev) =>
                                  prev?.id === item.id ? null : item
                                )
                              }
                              aria-label={`How to resolve ${item.label}`}
                              title="How to resolve"
                            >
                              ?
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mpm-story-studio-outstanding-empty">
                        All core intake + story inputs are in place.
                      </div>
                    )}
                  </section>

                  <div className="mpm-story-layout">
                    <section className="mpm-story-panel">
                      <div className="mpm-story-panel-header">
                        <h3>Build Direction Controls</h3>
                        <p>
                          Accept recommended build direction or manually confirm
                          your own before rerunning Story Engine.
                        </p>
                      </div>

                      <div className="mpm-story-form-grid">
                        {STORY_ENGINE_BUILD_SPEC_FIELDS.map((field) => {
                          const buildSpecNode =
                            storyEngineData?.engineRecord?.buildSpec?.[
                              field.key
                            ] || {};

                          const currentValue = buildSpecNode?.value || '';

                          const suggestion = getBuildSpecSuggestion({
                            engineRecord: storyEngineData.engineRecord,
                            fieldKey: field.key,
                            recommendationKey: field.recommendationKey,
                          });

                          return (
                            <div
                              key={field.key}
                              className="mpm-story-field-wrap"
                            >
                              <div className="mpm-story-field">
                                <span className="mpm-story-field-label">
                                  {field.label}
                                </span>

                                {field.description ? (
                                  <span className="mpm-help">
                                    {field.description}
                                  </span>
                                ) : null}

                                <input
                                  type="text"
                                  value={currentValue}
                                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                                  onChange={(e) =>
                                    updateBuildSpecField(
                                      field.key,
                                      e.target.value,
                                      {
                                        status: e.target.value.trim()
                                          ? 'confirmed'
                                          : 'observed',
                                        lastUpdatedBy: 'admin',
                                        manualLock: !!e.target.value.trim(),
                                        confidence: e.target.value.trim()
                                          ? 1
                                          : buildSpecNode?.confidence || 0,
                                        rationale: e.target.value.trim()
                                          ? ['Confirmed manually by admin.']
                                          : [],
                                      }
                                    )
                                  }
                                />

                                <div className="mpm-story-buildspec-meta">
                                  <span className="mpm-story-buildspec-chip">
                                    Status:{' '}
                                    {buildSpecNode?.status || 'unconfirmed'}
                                  </span>

                                  <span className="mpm-story-buildspec-chip">
                                    Lock:{' '}
                                    {buildSpecNode?.manualLock
                                      ? 'Manual'
                                      : 'Open'}
                                  </span>

                                  <span className="mpm-story-buildspec-chip">
                                    Confidence:{' '}
                                    {Math.round(
                                      (buildSpecNode?.confidence || 0) * 100
                                    )}
                                    %
                                  </span>
                                </div>

                                <div className="mpm-story-buildspec-actions">
                                  <button
                                    type="button"
                                    className="mpm-bulk-btn"
                                    onClick={() =>
                                      updateBuildSpecField(
                                        field.key,
                                        currentValue,
                                        {
                                          status: currentValue.trim()
                                            ? 'confirmed'
                                            : 'observed',
                                          lastUpdatedBy: 'admin',
                                          manualLock: !!currentValue.trim(),
                                          confidence: currentValue.trim()
                                            ? 1
                                            : buildSpecNode?.confidence || 0,
                                          rationale: currentValue.trim()
                                            ? ['Confirmed manually by admin.']
                                            : [],
                                        }
                                      )
                                    }
                                    disabled={
                                      !String(currentValue || '').trim()
                                    }
                                  >
                                    Confirm
                                  </button>

                                  <button
                                    type="button"
                                    className="mpm-bulk-btn mpm-bulk-btn-reset"
                                    onClick={() =>
                                      updateBuildSpecField(field.key, '', {
                                        status: 'observed',
                                        lastUpdatedBy: 'admin',
                                        manualLock: false,
                                        confidence: 0,
                                        rationale: [],
                                      })
                                    }
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              {renderSuggestionCard({
                                ...suggestion,
                                onUseSuggestion: () =>
                                  updateBuildSpecField(
                                    field.key,
                                    suggestion?.suggestedValue || '',
                                    {
                                      status: suggestion?.suggestedValue
                                        ? 'confirmed'
                                        : 'observed',
                                      lastUpdatedBy: 'admin',
                                      manualLock: !!suggestion?.suggestedValue,
                                      confidence: suggestion?.confidence || 0,
                                      rationale: suggestion?.rationale || [],
                                    }
                                  ),
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="mpm-story-panel">
                      <div className="mpm-story-panel-header">
                        <h3>Engine Status</h3>
                        <p>
                          Review readiness, confidence, and unresolved prompts
                          before generating polished chapter output.
                        </p>
                      </div>

                      <div className="mpm-story-status-grid">
                        <div className="mpm-story-status-card">
                          <span className="mpm-story-status-kicker">
                            Draft readiness
                          </span>
                          <strong>
                            {storyEngineData?.engineRecord?.engineMeta
                              ?.draftReadiness || 'not_ready'}
                          </strong>
                        </div>

                        <div className="mpm-story-status-card">
                          <span className="mpm-story-status-kicker">
                            Overall confidence
                          </span>
                          <strong>
                            {Math.round(
                              (storyEngineData?.engineRecord?.engineMeta
                                ?.overallConfidence || 0) * 100
                            )}
                            %
                          </strong>
                        </div>
                      </div>

                      {!!storyEngineData?.engineRecord?.engineMeta?.adminPrompts
                        ?.length && (
                        <div className="mpm-story-review-list">
                          <div className="mpm-story-review-title">
                            Unresolved prompts
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

                    {!!storyEngineData?.engineRecord?.chapters && (
                      <section className="mpm-story-panel mpm-story-panel-wide">
                        <div className="mpm-story-panel-header">
                          <h3>Story Studio Chapters</h3>
                          <p>
                            Review chapter output, regenerate sections, and lock
                            approved sections.
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
                                <h4>{chapterValue?.label || chapterKey}</h4>
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
                                <div className="mpm-story-preview-label-row">
                                  <div className="mpm-story-preview-label">
                                    Chapter Overview
                                    {getChapterSectionData(
                                      chapterKey,
                                      'chapterOverview'
                                    )?.locked && (
                                      <span
                                        style={{ marginLeft: 8, opacity: 0.75 }}
                                      >
                                        (Locked)
                                      </span>
                                    )}
                                  </div>

                                  <div className="mpm-story-preview-actions">
                                    <button
                                      type="button"
                                      className="mpm-bulk-btn"
                                      disabled={
                                        storyEngineRunning ||
                                        !!getChapterSectionData(
                                          chapterKey,
                                          'chapterOverview'
                                        )?.locked
                                      }
                                      onClick={() =>
                                        regenerateChapterSection({
                                          chapterKey,
                                          sectionKey: 'chapterOverview',
                                        })
                                      }
                                    >
                                      Regenerate
                                    </button>

                                    <button
                                      type="button"
                                      className="mpm-bulk-btn"
                                      onClick={() =>
                                        toggleChapterSectionLock({
                                          chapterKey,
                                          sectionKey: 'chapterOverview',
                                          locked: !getChapterSectionData(
                                            chapterKey,
                                            'chapterOverview'
                                          )?.locked,
                                        })
                                      }
                                    >
                                      {getChapterSectionData(
                                        chapterKey,
                                        'chapterOverview'
                                      )?.locked
                                        ? 'Unlock'
                                        : 'Lock'}
                                    </button>
                                  </div>
                                </div>

                                <div className="mpm-story-preview-text">
                                  {chapterValue?.storySections?.chapterOverview
                                    ?.text || '—'}
                                </div>
                              </div>

                              <div className="mpm-story-preview-block">
                                <div className="mpm-story-preview-label-row">
                                  <div className="mpm-story-preview-label">
                                    Build Notes
                                    {getChapterSectionData(
                                      chapterKey,
                                      'buildNotesStory'
                                    )?.locked && (
                                      <span
                                        style={{ marginLeft: 8, opacity: 0.75 }}
                                      >
                                        (Locked)
                                      </span>
                                    )}
                                  </div>

                                  <div className="mpm-story-preview-actions">
                                    <button
                                      type="button"
                                      className="mpm-bulk-btn"
                                      disabled={
                                        storyEngineRunning ||
                                        !!getChapterSectionData(
                                          chapterKey,
                                          'buildNotesStory'
                                        )?.locked
                                      }
                                      onClick={() =>
                                        regenerateChapterSection({
                                          chapterKey,
                                          sectionKey: 'buildNotesStory',
                                        })
                                      }
                                    >
                                      Regenerate
                                    </button>

                                    <button
                                      type="button"
                                      className="mpm-bulk-btn"
                                      onClick={() =>
                                        toggleChapterSectionLock({
                                          chapterKey,
                                          sectionKey: 'buildNotesStory',
                                          locked: !getChapterSectionData(
                                            chapterKey,
                                            'buildNotesStory'
                                          )?.locked,
                                        })
                                      }
                                    >
                                      {getChapterSectionData(
                                        chapterKey,
                                        'buildNotesStory'
                                      )?.locked
                                        ? 'Unlock'
                                        : 'Lock'}
                                    </button>
                                  </div>
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

        {helpOverlayPortal}

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
