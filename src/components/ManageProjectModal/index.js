import React, { useState, useEffect } from 'react';
import IntakeDirectionSection from './IntakeDirectionSection';
import StoryStudioSection from './StoryStudioSection';
import BuildWorkflowSection from './BuildWorkflowSection';
import OutstandingHelpOverlay from './OutstandingHelpOverlay';
import CraftsmanMasterToolSection from './CraftsmanMasterToolSection';

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
import { db, app, storage } from '../../firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { CHECKPOINTS_BY_ITEM_ID } from '../StepComponentTemplate';
import { defaultStepData } from '../../utils/buildWorkflow';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import { Snackbar } from '@mui/material';
import { useImpersonation } from '../../context/ImpersonationContext';

import {
  createEmptyStoryEngineRecord,
  SOURCE_TYPE,
} from '../../utils/storyEngineSchema';

import {
  createSourceEntry,
  registerSource,
  applyObservedFields,
  createAdminFieldMapFromConsultation,
  createAdminFieldMapFromQuestionnaire,
  runStoryEngine,
} from '../../utils/storyEngineHelpers';

import { runStoryDraftPipeline } from '../../utils/storyEngineDrafting';

import {
  STORY_ENGINE_FIELD_CONFIG,
  STORY_ENGINE_BUILD_SPEC_FIELDS,
} from '../../utils/storyEngineFieldConfig';

import {
  getMappedFieldSuggestion,
  getBuildSpecSuggestion,
  formatSuggestionConfidence,
} from '../../utils/storyEngineSuggestionHelpers';

import './index.css';
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
  PROJECT_DETAILS: 'projectDetails',
  BUILD_SCOPE: 'buildScope',
  MEDIA_FILES: 'mediaFiles',
  INTAKE: 'intake',
  CRAFTSMAN_TOOL: 'craftsmanTool',
  VENEER_DESIGNER: 'veneerDesigner',
  STORY_STUDIO: 'storyStudio',
  BUILD: 'build',
};

const ADMIN_NAV_GROUPS = [
  {
    id: 'project',
    label: 'Project',
    items: [
      { key: ADMIN_SECTIONS.PROJECT_DETAILS, label: 'Project Details' },
      { key: ADMIN_SECTIONS.BUILD_SCOPE, label: 'Build Scope' },
      { key: ADMIN_SECTIONS.MEDIA_FILES, label: 'Media & Files' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { key: ADMIN_SECTIONS.INTAKE, label: 'Intake & Direction' },
      { key: ADMIN_SECTIONS.CRAFTSMAN_TOOL, label: 'Craftsman Master Tool' },
      { key: ADMIN_SECTIONS.VENEER_DESIGNER, label: 'Ober Veneer Designer' },
      { key: ADMIN_SECTIONS.STORY_STUDIO, label: 'Story Studio' },
    ],
  },
];

const MEDIA_FILE_SECTIONS = [
  { key: 'buildProposal', label: 'Build Proposal' },
  { key: 'woodSelection', label: 'Wood Selection' },
  { key: 'earlyMockups', label: 'Early Mockups' },
  {
    key: 'staveConstructionPreMilling',
    label: 'Stave Construction (Pre-Milling)',
  },
  {
    key: 'staveConstructionPostMilling',
    label: 'Stave Construction (Post-Milling)',
  },
  { key: 'finalMockups', label: 'Final Mockups' },
  { key: 'mediaFiles', label: 'Media Files' },
  { key: 'other', label: 'Other' },
];

const MEDIA_FILE_SECTION_LABELS = Object.fromEntries(
  MEDIA_FILE_SECTIONS.map((section) => [section.key, section.label])
);

const BUILD_WORKFLOW_REQUIRED_DECISION_COUNT = 9;

const REQUIRED_BUILD_SPEC_KEYS = [
  'shellConstruction',
  'primaryWood',
  'bearingEdge',
  'finishSystem',
  'lugCount',
  'hoopType',
  'snareBed',
];

const DEFAULT_CRAFTSMAN_TOOL_STATE = {
  decisions: {},
  history: [],
  notes: '',
  customDraft: '',
  currentSelection: '',
  lastUpdatedAt: null,
};

const getCraftsmanToolState = (editableData = {}, projectData = {}) =>
  editableData?.craftsmanMasterTool ||
  projectData?.craftsmanMasterTool ||
  DEFAULT_CRAFTSMAN_TOOL_STATE;

const getCraftsmanTrackedDecisionCount = (
  toolState = {},
  engineRecord = {}
) => {
  const decisions = toolState?.decisions || {};
  const buildSpec = engineRecord?.buildSpec || {};

  const requiredPairs = [
    ['protectFirst', null],
    ['sizeDirectionConfidence', null],
    ['shellConstruction', 'shellConstruction'],
    ['primaryWood', 'primaryWood'],
    ['hardwareFinishCommitment', 'hardwareFinish'],
    ['finishDirection', 'finishSystem'],
    ['bearingEdgeDirection', 'bearingEdge'],
    ['tuningApproach', 'tuningApproach'],
    ['lugCountDirection', 'lugCount'],
  ];

  return requiredPairs.filter(([decisionKey, buildSpecKey]) => {
    const decisionValue = String(decisions?.[decisionKey]?.value || '').trim();
    const buildSpecValue = buildSpecKey
      ? String(buildSpec?.[buildSpecKey]?.value || '').trim()
      : '';

    return !!decisionValue || !!buildSpecValue;
  }).length;
};

const getCraftsmanStaleDecisionCount = (toolState = {}) => {
  const decisions = toolState?.decisions || {};
  return Object.values(decisions).filter((decision) => !!decision?.stale)
    .length;
};

const CRAFTSMAN_DECISION_TO_BUILDSPEC = {
  shellConstruction: 'shellConstruction',
  primaryWood: 'primaryWood',
  hardwareFinishCommitment: 'hardwareFinish',
  finishDirection: 'finishSystem',
  bearingEdgeDirection: 'bearingEdge',
  tuningApproach: 'tuningApproach',
  lugCountDirection: 'lugCount',
};

const getMissingCraftsmanDecisionIds = (toolState = {}, engineRecord = {}) => {
  const decisions = toolState?.decisions || {};
  const buildSpec = engineRecord?.buildSpec || {};

  const requiredIds = [
    'protectFirst',
    'sizeDirectionConfidence',
    'shellConstruction',
    'primaryWood',
    'hardwareFinishCommitment',
    'finishDirection',
    'bearingEdgeDirection',
    'tuningApproach',
    'lugCountDirection',
  ];

  return requiredIds.filter((id) => {
    const decisionValue = String(decisions?.[id]?.value || '').trim();
    const buildSpecKey = CRAFTSMAN_DECISION_TO_BUILDSPEC[id];
    const buildSpecValue = buildSpecKey
      ? String(buildSpec?.[buildSpecKey]?.value || '').trim()
      : '';

    return !decisionValue && !buildSpecValue;
  });
};

const BUILD_SPEC_TO_CRAFTSMAN_KEY = {
  shellConstruction: 'shellConstruction',
  primaryWood: 'primaryWood',
  hardwareFinish: 'hardwareFinishCommitment',
  finishSystem: 'finishDirection',
  bearingEdge: 'bearingEdgeDirection',
  tuningApproach: 'tuningApproach',
  lugCount: 'lugCountDirection',
};

const getMissingBuildSpecKeys = (
  engineRecord = {},
  craftsmanToolState = {}
) => {
  const buildSpec = engineRecord?.buildSpec || {};
  const craftsmanDecisions = craftsmanToolState?.decisions || {};

  return REQUIRED_BUILD_SPEC_KEYS.filter((key) => {
    const buildSpecValue = String(buildSpec?.[key]?.value || '').trim();

    const craftsmanKey = BUILD_SPEC_TO_CRAFTSMAN_KEY[key];
    const craftsmanDecision = craftsmanDecisions?.[craftsmanKey];
    const craftsmanValue = String(craftsmanDecision?.value || '').trim();
    const craftsmanIsUsable = !!craftsmanValue && !craftsmanDecision?.stale;

    return !buildSpecValue && !craftsmanIsUsable;
  });
};

const hasMeaningfulConsultationSummary = (storyEngineData = {}) => {
  const summary = String(storyEngineData?.consultationSummary || '').trim();
  return !!summary;
};

const hasConsultationTranscript = (storyEngineData = {}) => {
  return !!String(storyEngineData?.consultationTranscript || '').trim();
};

const hasQuestionnaireRaw = (storyEngineData = {}) => {
  return !!String(storyEngineData?.questionnaireRaw || '').trim();
};

const getBuildWorkflowUnlocked = ({ storyEngineData, craftsmanToolState }) => {
  const engineRecord = storyEngineData?.engineRecord || {};
  const trackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const staleCount = getCraftsmanStaleDecisionCount(craftsmanToolState);
  const missingBuildSpecs = getMissingBuildSpecKeys(
    engineRecord,
    craftsmanToolState
  );

  return (
    trackedCount >= BUILD_WORKFLOW_REQUIRED_DECISION_COUNT &&
    staleCount === 0 &&
    missingBuildSpecs.length === 0
  );
};

const getPortalExposureState = ({
  storyEngineData,
  craftsmanToolState,
  linkedUser,
}) => {
  const engineRecord = storyEngineData?.engineRecord || {};
  const hasTranscript = hasConsultationTranscript(storyEngineData);
  const hasSummary = hasMeaningfulConsultationSummary(storyEngineData);
  const hasQuestionnaire = hasQuestionnaireRaw(storyEngineData);

  const trackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const staleCount = getCraftsmanStaleDecisionCount(craftsmanToolState);
  const draftReadiness =
    engineRecord?.engineMeta?.draftReadiness || 'not_ready';

  const internalReady =
    hasQuestionnaire &&
    hasSummary &&
    trackedCount >= BUILD_WORKFLOW_REQUIRED_DECISION_COUNT &&
    staleCount === 0;

  const softShareReady = internalReady && draftReadiness !== 'not_ready';
  const portalReady = softShareReady && hasTranscript && !!linkedUser;

  return {
    internalReady,
    softShareReady,
    portalReady,
  };
};

const getProjectReadinessState = ({
  editableData,
  projectData,
  storyEngineData,
  linkedUser,
}) => {
  const craftsmanToolState = getCraftsmanToolState(editableData, projectData);

  const mergedProjectForReadiness = {
    ...(projectData || {}),
    ...(editableData || {}),
  };

  const hasRecordBasics =
    !!deriveCustomerName(mergedProjectForReadiness) &&
    !!deriveCustomerEmail(mergedProjectForReadiness) &&
    !!(
      mergedProjectForReadiness?.artisanLine ||
      mergedProjectForReadiness?.series ||
      mergedProjectForReadiness?.line
    );

  const hasQuestionnaire = hasQuestionnaireRaw(storyEngineData);
  const hasSummary = hasMeaningfulConsultationSummary(storyEngineData);
  const hasTranscript = hasConsultationTranscript(storyEngineData);

  const engineRecord = storyEngineData?.engineRecord || {};

  const craftsmanTrackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const craftsmanStaleCount =
    getCraftsmanStaleDecisionCount(craftsmanToolState);
  const missingCraftsmanDecisionIds = getMissingCraftsmanDecisionIds(
    craftsmanToolState,
    engineRecord
  );

  const missingBuildSpecKeys = getMissingBuildSpecKeys(
    engineRecord,
    craftsmanToolState
  );

  const storyReadiness =
    engineRecord?.engineMeta?.draftReadiness || 'not_ready';

  const buildWorkflowUnlocked = getBuildWorkflowUnlocked({
    storyEngineData,
    craftsmanToolState,
  });

  const portalExposure = getPortalExposureState({
    storyEngineData,
    craftsmanToolState,
    linkedUser,
  });

  const blockers = [];

  if (!hasRecordBasics) blockers.push('Complete project record basics');
  if (!hasQuestionnaire) blockers.push('Add questionnaire intake');
  if (!hasSummary) blockers.push('Add consultation summary');
  if (missingCraftsmanDecisionIds.length) {
    blockers.push(
      `Complete Craftsman decision path (${missingCraftsmanDecisionIds.length} remaining)`
    );
  }
  if (craftsmanStaleCount > 0) {
    blockers.push(
      `Review downstream Craftsman decisions (${craftsmanStaleCount} stale)`
    );
  }

  let nextBestAction = 'Continue project setup';

  if (!hasQuestionnaire) {
    nextBestAction = 'Add questionnaire intake';
  } else if (!hasSummary) {
    nextBestAction = 'Write consultation summary';
  } else if (missingCraftsmanDecisionIds.length) {
    nextBestAction = 'Continue Craftsman decision flow';
  } else if (craftsmanStaleCount > 0) {
    nextBestAction = 'Review stale Craftsman decisions';
  } else if (missingBuildSpecKeys.length) {
    nextBestAction = 'Return to Craftsman Master Tool';
  } else if (!buildWorkflowUnlocked) {
    nextBestAction = 'Review build direction before unlocking workflow';
  } else {
    nextBestAction = 'Build workflow is ready to begin';
  }
  return {
    hasRecordBasics,
    hasQuestionnaire,
    hasSummary,
    hasTranscript,
    craftsmanTrackedCount,
    craftsmanStaleCount,
    missingCraftsmanDecisionIds,
    missingBuildSpecKeys,
    storyReadiness,
    buildWorkflowUnlocked,
    portalExposure,
    blockers,
    nextBestAction,
  };
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

  const wholePhraseEmptyPatterns = [
    /^i['’]m not sure$/i,
    /^im not sure$/i,
    /^not sure$/i,
    /^not sure\s*[—-]\s*guide me$/i,
    /^i trust your recommendation$/i,
    /^guide me$/i,
    /^[-—]+\s*guide me$/i,
    /^unsure$/i,
    /^i don['’]t know$/i,
    /^idk$/i,
  ];

  if (wholePhraseEmptyPatterns.some((pattern) => pattern.test(text))) {
    return '';
  }

  text = text
    .replace(/--+\s*already told you.*$/i, '')
    .replace(/\balready told you.*$/i, '')
    .replace(/\basked and answered.*$/i, '')
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

const sanitizeFileName = (name = '') =>
  String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');

const buildProjectFileStoragePath = ({
  projectId,
  sectionKey,
  originalName,
}) => {
  const safeName = sanitizeFileName(originalName || 'file');
  const stamp = Date.now();
  return `projects/${projectId}/project-files/${sectionKey}/${stamp}-${safeName}`;
};

const getProjectFileExtension = (name = '') => {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getProjectFileKind = (name = '', contentType = '') => {
  const ext = getProjectFileExtension(name);
  const mime = String(contentType || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  ) {
    return 'image';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'webm', 'm4v'].includes(ext)
  ) {
    return 'video';
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)
  ) {
    return 'audio';
  }

  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }

  return 'document';
};

const getProjectFileUrl = (file = {}) =>
  file?.url ||
  file?.downloadURL ||
  file?.downloadUrl ||
  file?.fileUrl ||
  file?.src ||
  file?.previewUrl ||
  '';

const normalizeProjectFileRecord = (file = {}, fallbackSection = 'other') => {
  const fileName =
    file?.name || file?.fileName || file?.originalFileName || 'Untitled file';

  const url = getProjectFileUrl(file);

  return {
    id:
      file?.id ||
      `file_${fallbackSection}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    name: fileName,
    fileName: fileName,
    displayName: file?.displayName || file?.portalName || fileName,
    originalFileName: file?.originalFileName || fileName,
    section:
      file?.section || file?.category || file?.subCategory || fallbackSection,
    category:
      file?.category || file?.section || file?.subCategory || fallbackSection,
    subCategory:
      file?.subCategory || file?.section || file?.category || fallbackSection,
    sortOrder: Number.isFinite(file?.sortOrder) ? file.sortOrder : 0,
    hiddenFromCustomer:
      typeof file?.hiddenFromCustomer === 'boolean'
        ? file.hiddenFromCustomer
        : !!file?.hidden,
    hidden:
      typeof file?.hidden === 'boolean'
        ? file.hidden
        : !!file?.hiddenFromCustomer,
    url,
    downloadURL: url,
    thumbnailUrl: file?.thumbnailUrl || url,
    contentType: file?.contentType || file?.mimeType || '',
    size: Number(file?.size || 0),
    kind: file?.kind || getProjectFileKind(fileName, file?.contentType || ''),
    storagePath: file?.storagePath || '',
    uploadedAt: file?.uploadedAt || new Date().toISOString(),
    uploadedBy: file?.uploadedBy || 'admin',
  };
};

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  const [selectedTab, setSelectedTab] = useState(ADMIN_SECTIONS.INTAKE);
  const [editableData, setEditableData] = useState({});
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const [pendingProjectFile, setPendingProjectFile] = useState(null);
  const [pendingProjectFileSection, setPendingProjectFileSection] =
    useState('other');
  const [pendingProjectFileHidden, setPendingProjectFileHidden] =
    useState(true);
  const [isUploadingProjectFile, setIsUploadingProjectFile] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);

  const [mediaFilterSection, setMediaFilterSection] = useState('all');
  const [mediaFilterVisibility, setMediaFilterVisibility] = useState('all');
  const [mediaFilterKind, setMediaFilterKind] = useState('all');
  const [mediaSortMode, setMediaSortMode] = useState('custom');

  const [linkedUser, setLinkedUser] = useState(null);
  const [outstandingHelpItem, setOutstandingHelpItem] = useState(null);

  const [expandedSidebarGroup, setExpandedSidebarGroup] = useState('project');

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
      buildClarity: '',
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
    discoveryWorkspace: {
      intake: {
        completed: false,
        completedAt: null,
      },
      consult: {
        completed: false,
        completedAt: null,
        rows: {},
      },
      summary: {
        generated: false,
        generatedAt: null,
        editableText: '',
        structured: null,
      },
    },
    engineRecord: createEmptyStoryEngineRecord(),
    draftPreview: null,
  });

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

    const resolvedQuestionnaireRaw =
      typeof se?.sources?.questionnaireRaw === 'string' &&
      se.sources.questionnaireRaw.trim()
        ? se.sources.questionnaireRaw
        : se?.sources?.questionnaireRaw
          ? JSON.stringify(se.sources.questionnaireRaw, null, 2)
          : buildQuestionnaireRawFromProject(projectData);

    const seededQuestionnaireMapped = sanitizeStoryFieldGroup({
      ...extractQuestionnaireMappedFields({
        questionnaireRaw: resolvedQuestionnaireRaw,
        existing: se?.sources?.questionnaireMapped || {},
      }),
      artistName:
        deriveCustomerName(projectData) ||
        se?.sources?.questionnaireMapped?.artistName ||
        se?.sources?.consultationMapped?.artistName ||
        '',
    });

    const seededConsultationMapped = sanitizeStoryFieldGroup({
      ...extractConsultationMappedFields({
        transcript: se?.sources?.consultationTranscript || '',
        summary: se?.sources?.consultationSummary || '',
        adminNotes: se?.sources?.adminNotes || '',
        projectData,
        existing: {
          ...(se?.sources?.consultationMapped || {}),
          artistName:
            deriveCustomerName(projectData) ||
            se?.sources?.consultationMapped?.artistName ||
            seededQuestionnaireMapped?.artistName ||
            '',
          projectName:
            se?.sources?.consultationMapped?.projectName ||
            deriveBestProjectName(projectData) ||
            '',
        },
      }),

      desiredOutcome:
        se?.sources?.consultationMapped?.desiredOutcome ||
        seededQuestionnaireMapped?.desiredOutcome ||
        '',

      genreContext:
        se?.sources?.consultationMapped?.genreContext ||
        seededQuestionnaireMapped?.genreContext ||
        '',

      influenceReferences:
        se?.sources?.consultationMapped?.influenceReferences ||
        seededQuestionnaireMapped?.influenceReferences ||
        '',

      finishDirection:
        se?.sources?.consultationMapped?.finishDirection ||
        seededQuestionnaireMapped?.finishDirection ||
        '',

      woodPreference:
        se?.sources?.consultationMapped?.woodPreference ||
        seededQuestionnaireMapped?.woodPreference ||
        '',

      responsePriorities:
        se?.sources?.consultationMapped?.responsePriorities ||
        seededQuestionnaireMapped?.responsePriorities ||
        '',

      tonalGoals:
        se?.sources?.consultationMapped?.tonalGoals ||
        seededQuestionnaireMapped?.tonalGoals ||
        '',

      preferredSizeDirection:
        se?.sources?.consultationMapped?.preferredSizeDirection ||
        seededQuestionnaireMapped?.preferredSizeDirection ||
        '',

      primaryUseCase:
        se?.sources?.consultationMapped?.primaryUseCase ||
        (seededQuestionnaireMapped?.recordingUse === 'yes' &&
        seededQuestionnaireMapped?.liveUse === 'yes'
          ? 'both'
          : seededQuestionnaireMapped?.recordingUse === 'yes'
            ? 'studio'
            : seededQuestionnaireMapped?.liveUse === 'yes'
              ? 'live performance'
              : ''),
    });

    setStoryEngineData({
      consultationTranscript: se?.sources?.consultationTranscript || '',
      consultationSummary: se?.sources?.consultationSummary || '',
      adminNotes: se?.sources?.adminNotes || '',
      questionnaireRaw: resolvedQuestionnaireRaw,
      questionnaireMapped: seededQuestionnaireMapped,
      consultationMapped: seededConsultationMapped,
      discoveryWorkspace: {
        intake: {
          completed: !!se?.sources?.discoveryWorkspace?.intake?.completed,
          completedAt:
            se?.sources?.discoveryWorkspace?.intake?.completedAt || null,
        },
        consult: {
          completed: !!se?.sources?.discoveryWorkspace?.consult?.completed,
          completedAt:
            se?.sources?.discoveryWorkspace?.consult?.completedAt || null,
          rows: se?.sources?.discoveryWorkspace?.consult?.rows || {},
        },
        summary: {
          generated: !!se?.sources?.discoveryWorkspace?.summary?.generated,
          generatedAt:
            se?.sources?.discoveryWorkspace?.summary?.generatedAt || null,
          editableText:
            se?.sources?.discoveryWorkspace?.summary?.editableText || '',
          structured:
            se?.sources?.discoveryWorkspace?.summary?.structured || null,
        },
      },
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

    setSelectedTab(ADMIN_SECTIONS.PROJECT_DETAILS);
    setExpandedSidebarGroup('project');
    setSelectedStepKey(buildPhases[0]?.key || null);
    setSelectedSubIndex(0);
    setExpandedStepKey(buildPhases[0]?.key || null);
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

  const handleProjectFileUpload = async () => {
    try {
      if (!pendingProjectFile) return;

      const projectId =
        projectData?.id ||
        projectData?.projectId ||
        projectData?.docId ||
        projectData?.projectID;

      if (!projectId) {
        console.warn('[ManageProjectModal] Missing project id for upload');
        return;
      }

      setIsUploadingProjectFile(true);

      const sectionKey = pendingProjectFileSection || 'other';
      const file = pendingProjectFile;

      const path = buildProjectFileStoragePath({
        projectId,
        sectionKey,
        originalName: file.name,
      });

      const fileRef = storageRef(storage, path);

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);

        task.on(
          'state_changed',
          () => {},
          (err) => reject(err),
          async () => {
            resolve();
          }
        );
      });

      const downloadURL = await getDownloadURL(fileRef);

      const existingProjectFiles = Array.isArray(editableData?.projectFiles)
        ? editableData.projectFiles
        : Array.isArray(projectData?.projectFiles)
          ? projectData.projectFiles
          : [];

      const normalizedExistingProjectFiles = existingProjectFiles.map((item) =>
        normalizeProjectFileRecord(item)
      );

      const existingInSectionCount = normalizedExistingProjectFiles.filter(
        (item) => {
          const itemSection =
            item?.section || item?.category || item?.subCategory || 'other';
          return itemSection === sectionKey;
        }
      ).length;

      const fileKind = getProjectFileKind(file.name, file.type || '');

      const nextFile = normalizeProjectFileRecord({
        id: `file_${sectionKey}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: file.name,
        displayName: file.name,
        originalFileName: file.name,
        section: sectionKey,
        category: sectionKey,
        subCategory: sectionKey,
        sortOrder: existingInSectionCount,
        hiddenFromCustomer: pendingProjectFileHidden,
        hidden: pendingProjectFileHidden,
        url: downloadURL,
        downloadURL,
        thumbnailUrl: fileKind === 'image' ? downloadURL : '',
        contentType: file.type || '',
        size: file.size || 0,
        kind: fileKind,
        storagePath: path,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
      });

      const nextProjectFiles = [...normalizedExistingProjectFiles, nextFile];

      const nextAttachments = syncAttachmentsFromProjectFiles(nextProjectFiles);

      setEditableData((prev) => ({
        ...prev,
        projectFiles: nextProjectFiles,
        attachments: nextAttachments,
      }));

      await saveToFirestore({
        projectFiles: nextProjectFiles,
        attachments: nextAttachments,
      });

      setPendingProjectFile(null);
      setPendingProjectFileSection('other');
      setPendingProjectFileHidden(true);
    } catch (err) {
      console.error('[ManageProjectModal] Project file upload failed:', err);
    } finally {
      setIsUploadingProjectFile(false);
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

  const currentPhaseLabel = determineCurrentPhase(editableData);
  const idText = projectData?.id || '—';
  const linkedUserStatus = getLinkedUserStatusLabel(linkedUser);

  const projectReadiness = getProjectReadinessState({
    editableData,
    projectData,
    storyEngineData,
    linkedUser,
  });

  const artistNameForHeader =
    storyEngineData.consultationMapped.artistName ||
    storyEngineData.questionnaireMapped.artistName ||
    deriveCustomerName(projectData) ||
    'Unassigned Artist';

  const compactProjectLabel =
    getIdentifier({
      ...(projectData || {}),
      ...(editableData || {}),
    }) || '—';

  const topbarPortalLabel = projectReadiness.portalExposure.portalReady
    ? 'Artist Portal Ready'
    : projectReadiness.portalExposure.softShareReady
      ? 'Portal Preview'
      : 'Portal Locked';

  const renderVeneerDesignerPlaceholder = () => (
    <section className="mpm-surface mpm-tab-shell">
      <div className="mpm-tab-section-header">
        <div>
          <div className="mpm-tab-kicker">Ober Veneer Designer</div>
          <h3 className="mpm-tab-title">Resin Accent Generator</h3>
          <p className="mpm-tab-subtitle">
            This workspace will house veneer direction, resin accent concepting,
            and future mockup planning that feeds build direction and story
            work.
          </p>
        </div>
      </div>

      <div className="mpm-grid-2">
        <div className="mpm-surface">
          <div className="mpm-tab-kicker">Planned Use</div>
          <h4 className="mpm-tab-title">Visual direction workspace</h4>
          <p className="mpm-tab-subtitle">
            Use this later for veneer selection, resin accent planning, finish
            exploration, and concept alignment before final story drafting.
          </p>
        </div>

        <div className="mpm-surface">
          <div className="mpm-tab-kicker">Future Output</div>
          <h4 className="mpm-tab-title">Feeds Story Studio + Build Specs</h4>
          <p className="mpm-tab-subtitle">
            Final veneer and resin decisions will eventually support chapter
            language, build notes, and shell finish direction.
          </p>
        </div>
      </div>

      <div className="mpm-surface">
        <div className="mpm-tab-kicker">Status</div>
        <h4 className="mpm-tab-title">Placeholder only</h4>
        <p className="mpm-tab-subtitle">
          No live controls yet. This is just the reserved workspace slot so the
          modal structure is ready for the feature when you build it.
        </p>
      </div>
    </section>
  );

  const renderProjectDetailsPlaceholder = () => {
    const customerName =
      deriveCustomerName({
        ...(projectData || {}),
        ...(editableData || {}),
      }) || '—';

    const customerEmail =
      deriveCustomerEmail({
        ...(projectData || {}),
        ...(editableData || {}),
      }) || '—';

    const customerPhone =
      val(
        editableData?.customerPhone,
        projectData?.customerPhone,
        editableData?.phone,
        projectData?.phone,
        editableData?.customerInfo?.phone,
        projectData?.customerInfo?.phone
      ) || '—';

    const shippingAddressParts = [
      val(
        editableData?.shippingAddress?.line1,
        projectData?.shippingAddress?.line1,
        editableData?.addressLine1,
        projectData?.addressLine1,
        editableData?.customerInfo?.addressLine1,
        projectData?.customerInfo?.addressLine1
      ),
      val(
        editableData?.shippingAddress?.line2,
        projectData?.shippingAddress?.line2,
        editableData?.addressLine2,
        projectData?.addressLine2,
        editableData?.customerInfo?.addressLine2,
        projectData?.customerInfo?.addressLine2
      ),
      val(
        editableData?.shippingAddress?.city,
        projectData?.shippingAddress?.city,
        editableData?.city,
        projectData?.city,
        editableData?.customerInfo?.city,
        projectData?.customerInfo?.city
      ),
      val(
        editableData?.shippingAddress?.state,
        projectData?.shippingAddress?.state,
        editableData?.state,
        projectData?.state,
        editableData?.customerInfo?.state,
        projectData?.customerInfo?.state
      ),
      val(
        editableData?.shippingAddress?.postalCode,
        projectData?.shippingAddress?.postalCode,
        editableData?.zip,
        projectData?.zip,
        editableData?.postalCode,
        projectData?.postalCode,
        editableData?.customerInfo?.postalCode,
        projectData?.customerInfo?.postalCode
      ),
      val(
        editableData?.shippingAddress?.country,
        projectData?.shippingAddress?.country,
        editableData?.country,
        projectData?.country,
        editableData?.customerInfo?.country,
        projectData?.customerInfo?.country
      ),
    ].filter(Boolean);

    const shippingAddress = shippingAddressParts.length
      ? shippingAddressParts.join(', ')
      : '—';

    const contactPreference =
      val(
        storyEngineData?.questionnaireMapped?.consultationContactMethod,
        editableData?.consultationContactMethod,
        projectData?.consultationContactMethod,
        editableData?.preferredContactMethod,
        projectData?.preferredContactMethod
      ) || '—';

    const projectSummaryItems = [
      {
        label: 'Project ID',
        value: projectData?.id || '—',
      },
      {
        label: 'Artisan Line',
        value:
          val(
            editableData?.artisanLine,
            projectData?.artisanLine,
            editableData?.series,
            projectData?.series,
            editableData?.line,
            projectData?.line
          ) || '—',
      },
      {
        label: 'Serial',
        value:
          val(
            editableData?.lineSerial,
            projectData?.lineSerial,
            editableData?.serial,
            projectData?.serial,
            editableData?.serialNumber,
            projectData?.serialNumber
          ) || '—',
      },
      {
        label: 'Status',
        value: status || '—',
      },
      {
        label: 'Current Chapter',
        value: currentPhaseLabel || '—',
      },
      {
        label: 'Progress',
        value: `${weightedProgress || 0}%`,
      },
      {
        label: 'Workflow Readiness',
        value: projectReadiness.buildWorkflowUnlocked ? 'Ready' : 'Locked',
      },
      {
        label: 'Portal Status',
        value: topbarPortalLabel || '—',
      },
      {
        label: 'Total Logged Time',
        value: formatFullTime(calculateProjectTotalTime(editableData)),
      },
    ];

    const customerDetailItems = [
      {
        label: 'Customer Name',
        value: customerName,
      },
      {
        label: 'Customer Email',
        value: customerEmail,
      },
      {
        label: 'Phone',
        value: customerPhone,
      },
      {
        label: 'Contact Preference',
        value: contactPreference,
      },
      {
        label: 'Linked User',
        value: linkedUserStatus || 'Not linked',
      },
      {
        label: 'Shipping Address',
        value: shippingAddress,
        wide: true,
      },
    ];

    return (
      <section className="mpm-surface mpm-tab-shell mpm-project-details-shell">
        <div className="mpm-tab-section-header mpm-project-details-header">
          <div>
            <div className="mpm-tab-kicker">Project Details</div>
            <h3 className="mpm-tab-title">Project and customer overview</h3>
            <p className="mpm-tab-subtitle">
              Keep project status and build-facing details separate from
              customer identity and contact information.
            </p>
          </div>
        </div>

        <div className="mpm-project-details-grid">
          <div className="mpm-project-details-panel">
            <div className="mpm-project-details-panel-head">
              <div className="mpm-project-details-panel-kicker">
                Project Summary
              </div>
              <h4 className="mpm-project-details-panel-title">
                Build and workflow details
              </h4>
              <p className="mpm-project-details-panel-copy">
                Core project identity, status, progress, and portal readiness.
              </p>
            </div>

            <div className="mpm-project-details-stats-grid">
              {projectSummaryItems.map((item) => (
                <div
                  key={item.label}
                  className={`mpm-project-stat-card ${
                    item.wide ? 'mpm-project-stat-card-wide' : ''
                  }`}
                >
                  <span className="mpm-project-stat-label">{item.label}</span>
                  <strong className="mpm-project-stat-value">
                    {item.value || '—'}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mpm-project-details-panel">
            <div className="mpm-project-details-panel-head">
              <div className="mpm-project-details-panel-kicker">
                Customer Details
              </div>
              <h4 className="mpm-project-details-panel-title">
                Contact and portal access
              </h4>
              <p className="mpm-project-details-panel-copy">
                Customer-facing identity, contact details, and linked account
                info.
              </p>
            </div>

            <div className="mpm-project-details-stats-grid mpm-project-details-stats-grid-customer">
              {customerDetailItems.map((item) => (
                <div
                  key={item.label}
                  className={`mpm-project-stat-card ${
                    item.wide ? 'mpm-project-stat-card-wide' : ''
                  }`}
                >
                  <span className="mpm-project-stat-label">{item.label}</span>
                  <strong className="mpm-project-stat-value">
                    {item.value || '—'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!!projectReadiness.blockers.length && (
          <div className="mpm-project-details-blockers">
            <div className="mpm-tab-kicker">Current Blockers</div>
            <h4 className="mpm-tab-title">What still needs attention</h4>
            <div className="mpm-build-locked-list" style={{ marginTop: 12 }}>
              {projectReadiness.blockers.map((blocker) => (
                <div key={blocker} className="mpm-build-locked-item">
                  {blocker}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderBuildScopePlaceholder = () => {
    const buildSpec = storyEngineData?.engineRecord?.buildSpec || {};

    const formatBuildScopeValue = (fieldKey, value) => {
      const text = String(value || '').trim();
      if (!text) return '—';

      const normalized = text.toLowerCase();

      if (fieldKey === 'lugCount') {
        if (normalized.includes('10')) return '10 lug';
        if (normalized.includes('8')) return '8 lug';
        if (normalized.includes('6')) return '6 lug';
      }

      if (fieldKey === 'hardwareFinish') {
        if (normalized.includes('brass') || normalized.includes('gold')) {
          return 'Brass / Gold';
        }
        if (normalized.includes('black nickel')) return 'Black Nickel';
        if (normalized.includes('chrome')) return 'Chrome';
      }

      if (fieldKey === 'bearingEdge') {
        if (
          normalized.includes('sensitive') ||
          normalized.includes('balanced edge')
        ) {
          return 'Sensitive / Balanced';
        }
      }

      if (fieldKey === 'tuningApproach') {
        if (
          normalized.includes('studio-friendly flexibility') ||
          normalized.includes('broad studio')
        ) {
          return 'Studio-Friendly Flexibility';
        }
      }

      if (fieldKey === 'finishSystem') {
        if (
          normalized.includes('custom visual direction') ||
          normalized.includes('after consultation')
        ) {
          return 'Custom Visual Direction';
        }
      }

      if (fieldKey === 'hoopType') {
        if (normalized.includes('triple-flanged')) {
          return 'Triple-Flanged Hoops';
        }
        if (normalized.includes('die-cast')) return 'Die-Cast Hoops';
      }

      return text;
    };

    const getBuildValue = (key, ...fallbacks) => {
      const rawValue = val(buildSpec?.[key]?.value, ...fallbacks);
      return formatBuildScopeValue(key, rawValue);
    };

    const sizeDiameter = val(
      buildSpec?.diameter?.value,
      editableData?.width,
      projectData?.width,
      editableData?.diameter,
      projectData?.diameter
    );

    const sizeDepth = val(
      buildSpec?.depth?.value,
      editableData?.shellDepth,
      projectData?.shellDepth,
      editableData?.depth,
      projectData?.depth
    );

    const workflowItems = [
      {
        label: 'Progress',
        value: `${weightedProgress || 0}%`,
      },
      {
        label: 'Current Chapter',
        value: currentPhaseLabel || '—',
      },
    ];

    const coreBuildItems = [
      {
        label: 'Artisan Line',
        value:
          val(
            editableData?.artisanLine,
            projectData?.artisanLine,
            editableData?.series,
            projectData?.series,
            editableData?.line,
            projectData?.line
          ) || '—',
      },
      {
        label: 'Serial',
        value:
          val(
            editableData?.lineSerial,
            projectData?.lineSerial,
            editableData?.serial,
            projectData?.serial,
            editableData?.serialNumber,
            projectData?.serialNumber
          ) || '—',
      },
      {
        label: 'Size',
        value:
          sizeDiameter && sizeDepth ? `${sizeDiameter}" × ${sizeDepth}"` : '—',
      },
    ];

    const shellItems = [
      {
        label: 'Shell Construction',
        value: getBuildValue(
          'shellConstruction',
          editableData?.shellConstruction,
          projectData?.shellConstruction
        ),
      },
      {
        label: 'Primary Wood',
        value: getBuildValue(
          'primaryWood',
          editableData?.primaryWood,
          projectData?.primaryWood
        ),
      },
      {
        label: 'Secondary Wood',
        value: getBuildValue(
          'secondaryWood',
          editableData?.secondaryWood,
          projectData?.secondaryWood
        ),
      },
      {
        label: 'Stave Count',
        value: getBuildValue(
          'staveCount',
          editableData?.staveCount,
          projectData?.staveCount
        ),
      },
      {
        label: 'Bearing Edge',
        value: getBuildValue(
          'bearingEdge',
          editableData?.bearingEdge,
          projectData?.bearingEdge
        ),
      },
      {
        label: 'Snare Bed',
        value: getBuildValue(
          'snareBed',
          editableData?.snareBed,
          projectData?.snareBed
        ),
      },
      {
        label: 'Snare Bed Depth',
        value: getBuildValue(
          'snareBedDepth',
          editableData?.snareBedDepth,
          projectData?.snareBedDepth
        ),
      },
      {
        label: 'Finish System',
        value: getBuildValue(
          'finishSystem',
          editableData?.finishSystem,
          projectData?.finishSystem
        ),
      },
    ];

    const hardwareVoicingItems = [
      {
        label: 'Lug Count',
        value: getBuildValue(
          'lugCount',
          editableData?.lugCount,
          projectData?.lugCount
        ),
      },
      {
        label: 'Hoop Type',
        value: getBuildValue(
          'hoopType',
          editableData?.hoopType,
          projectData?.hoopType,
          editableData?.rimType,
          projectData?.rimType
        ),
      },
      {
        label: 'Hardware Finish',
        value: getBuildValue(
          'hardwareFinish',
          editableData?.hardwareFinish,
          projectData?.hardwareFinish
        ),
      },
      {
        label: 'Head Type',
        value: getBuildValue(
          'headType',
          editableData?.headType,
          projectData?.headType
        ),
      },
      {
        label: 'Tuning Approach',
        value: getBuildValue(
          'tuningApproach',
          editableData?.tuningApproach,
          projectData?.tuningApproach
        ),
      },
    ];

    const renderScopeGroup = (kicker, title, copy, items) => (
      <div className="mpm-buildscope-group">
        <div className="mpm-buildscope-group-head">
          <div className="mpm-buildscope-group-kicker">{kicker}</div>
          <h4 className="mpm-buildscope-group-title">{title}</h4>
          <p className="mpm-buildscope-group-copy">{copy}</p>
        </div>

        <div className="mpm-buildscope-grid">
          {items.map((item) => (
            <div
              key={item.label}
              className={`mpm-buildscope-card ${item.wide ? 'mpm-buildscope-card-wide' : ''}`}
            >
              <span className="mpm-buildscope-label">{item.label}</span>
              <strong className="mpm-buildscope-value">
                {item.value || '—'}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <section className="mpm-surface mpm-tab-shell mpm-buildscope-shell">
        <div className="mpm-tab-section-header mpm-buildscope-header">
          <div>
            <div className="mpm-tab-kicker">Build Scope</div>
            <h3 className="mpm-tab-title">Build specs and configuration</h3>
            <p className="mpm-tab-subtitle">
              Builder-facing scope of work, progress, and confirmed build
              components for this project.
            </p>
          </div>
        </div>

        <div className="mpm-buildscope-stack">
          {renderScopeGroup(
            'Core Build',
            'Project identity',
            'The high-level build reference points.',
            coreBuildItems
          )}

          {renderScopeGroup(
            'Shell Architecture',
            'Shell and structure',
            'Core shell decisions that shape feel, response, and construction.',
            shellItems
          )}

          {renderScopeGroup(
            'Hardware + Voicing',
            'Performance components',
            'Hardware and tuning-related decisions that affect response and setup.',
            hardwareVoicingItems
          )}
        </div>
      </section>
    );
  };

  const FILE_SECTION_KEYS = MEDIA_FILE_SECTIONS.map((section) => section.key);

  const FILE_SECTION_LABELS = MEDIA_FILE_SECTION_LABELS;

  const getProjectFiles = () => {
    const flatFiles = Array.isArray(editableData?.projectFiles)
      ? editableData.projectFiles
      : Array.isArray(projectData?.projectFiles)
        ? projectData.projectFiles
        : Array.isArray(editableData?.files)
          ? editableData.files
          : Array.isArray(projectData?.files)
            ? projectData.files
            : [];

    const attachmentsSource =
      editableData?.attachments && typeof editableData.attachments === 'object'
        ? editableData.attachments
        : projectData?.attachments &&
            typeof projectData.attachments === 'object'
          ? projectData.attachments
          : {};

    const attachmentFiles = Object.entries(attachmentsSource).flatMap(
      ([sectionKey, arr]) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((file) => normalizeProjectFileRecord(file, sectionKey));
      }
    );

    const normalizedFlatFiles = flatFiles.map((file) =>
      normalizeProjectFileRecord(file)
    );

    const byId = new Map();

    [...normalizedFlatFiles, ...attachmentFiles].forEach((file) => {
      const key =
        file?.id ||
        `${file?.section || 'other'}::${file?.name || ''}::${file?.storagePath || ''}`;

      const existing = byId.get(key);

      if (!existing) {
        byId.set(key, file);
        return;
      }

      byId.set(key, {
        ...existing,
        ...file,
        url: getProjectFileUrl(file) || getProjectFileUrl(existing) || '',
        downloadURL:
          file?.downloadURL ||
          existing?.downloadURL ||
          getProjectFileUrl(file) ||
          getProjectFileUrl(existing) ||
          '',
        storagePath: file?.storagePath || existing?.storagePath || '',
        contentType: file?.contentType || existing?.contentType || '',
        kind: file?.kind || existing?.kind || '',
        section: file?.section || existing?.section || 'other',
        category: file?.category || existing?.category || 'other',
        subCategory: file?.subCategory || existing?.subCategory || 'other',
      });
    });

    return Array.from(byId.values());
  };

  const syncAttachmentsFromProjectFiles = (projectFiles = []) => {
    const grouped = {};

    MEDIA_FILE_SECTIONS.forEach((section) => {
      grouped[section.key] = [];
    });

    (projectFiles || []).forEach((file) => {
      const normalized = normalizeProjectFileRecord(file);
      const sectionKey =
        normalized.section ||
        normalized.category ||
        normalized.subCategory ||
        'other';

      if (!grouped[sectionKey]) grouped[sectionKey] = [];

      grouped[sectionKey].push({
        id: normalized.id,
        title: normalized.displayName || normalized.name,
        name: normalized.name,
        displayName: normalized.displayName || normalized.name,
        fileName: normalized.fileName,
        originalFileName: normalized.originalFileName,
        url: normalized.url,
        downloadURL: normalized.downloadURL,
        thumbnailUrl: normalized.thumbnailUrl,
        contentType: normalized.contentType,
        mimeType: normalized.contentType,
        size: normalized.size,
        kind: normalized.kind,
        hidden: normalized.hidden,
        hiddenFromCustomer: normalized.hiddenFromCustomer,
        category: sectionKey,
        section: sectionKey,
        subCategory: sectionKey,
        sortOrder: normalized.sortOrder,
        storagePath: normalized.storagePath,
        uploadedAt: normalized.uploadedAt,
        createdAt: normalized.uploadedAt,
        uploadedBy: normalized.uploadedBy,
      });
    });

    Object.keys(grouped).forEach((sectionKey) => {
      grouped[sectionKey] = grouped[sectionKey].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
    });

    return grouped;
  };

  const normalizeSortOrdersForSection = (projectFiles = [], sectionKey) => {
    const sectionFiles = projectFiles
      .filter((file) => {
        const section =
          file?.section || file?.category || file?.subCategory || 'other';
        return section === sectionKey;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((file, index) => ({
        ...file,
        section: sectionKey,
        category: sectionKey,
        subCategory: sectionKey,
        sortOrder: index,
      }));

    const otherFiles = projectFiles.filter((file) => {
      const section =
        file?.section || file?.category || file?.subCategory || 'other';
      return section !== sectionKey;
    });

    return [...otherFiles, ...sectionFiles];
  };

  const handleUpdateProjectFile = async (fileId, updates = {}) => {
    const existingFiles = getProjectFiles().map((file) =>
      normalizeProjectFileRecord(file)
    );

    let nextFiles = existingFiles.map((file) => {
      if (file.id !== fileId) return file;

      const nextSection =
        updates.section ||
        updates.category ||
        updates.subCategory ||
        file.section;

      return normalizeProjectFileRecord(
        {
          ...file,
          ...updates,
          section: nextSection,
          category: nextSection,
          subCategory: nextSection,
          hidden:
            typeof updates.hiddenFromCustomer === 'boolean'
              ? updates.hiddenFromCustomer
              : typeof updates.hidden === 'boolean'
                ? updates.hidden
                : file.hidden,
          hiddenFromCustomer:
            typeof updates.hiddenFromCustomer === 'boolean'
              ? updates.hiddenFromCustomer
              : typeof updates.hidden === 'boolean'
                ? updates.hidden
                : file.hiddenFromCustomer,
        },
        nextSection
      );
    });

    const touchedSections = new Set(
      nextFiles.map(
        (file) => file.section || file.category || file.subCategory || 'other'
      )
    );

    touchedSections.forEach((sectionKey) => {
      nextFiles = normalizeSortOrdersForSection(nextFiles, sectionKey);
    });

    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });
  };

  const handleMoveProjectFile = async (fileId, direction) => {
    const existingFiles = getProjectFiles().map((file) =>
      normalizeProjectFileRecord(file)
    );

    const target = existingFiles.find((file) => file.id === fileId);
    if (!target) return;

    const sectionKey =
      target.section || target.category || target.subCategory || 'other';

    const sectionFiles = existingFiles
      .filter((file) => {
        const section =
          file.section || file.category || file.subCategory || 'other';
        return section === sectionKey;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const currentIndex = sectionFiles.findIndex((file) => file.id === fileId);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= sectionFiles.length) return;

    const reordered = [...sectionFiles];
    [reordered[currentIndex], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[currentIndex],
    ];

    const reorderedWithSort = reordered.map((file, index) => ({
      ...file,
      sortOrder: index,
    }));

    const otherFiles = existingFiles.filter((file) => {
      const section =
        file.section || file.category || file.subCategory || 'other';
      return section !== sectionKey;
    });

    const nextFiles = [...otherFiles, ...reorderedWithSort];
    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });
  };

  const handleDeleteProjectFile = async (fileId) => {
    const existingFiles = getProjectFiles().map((file) =>
      normalizeProjectFileRecord(file)
    );

    const target = existingFiles.find((file) => file.id === fileId);
    if (!target) return;

    const confirmed = window.confirm(
      `Delete "${target.displayName || target.name}"?`
    );

    if (!confirmed) return;

    const sectionKey =
      target.section || target.category || target.subCategory || 'other';

    let nextFiles = existingFiles.filter((file) => file.id !== fileId);
    nextFiles = normalizeSortOrdersForSection(nextFiles, sectionKey);

    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });

    if (target.storagePath) {
      try {
        const objectRef = storageRef(storage, target.storagePath);
        await deleteObject(objectRef);
      } catch (err) {
        console.warn(
          '[ManageProjectModal] Storage delete failed, Firestore record already removed:',
          err
        );
      }
    }
  };

  const renderMediaFilesSection = () => {
    const files = getProjectFiles().map((file) =>
      normalizeProjectFileRecord(file)
    );

    const filteredFiles = files.filter((file) => {
      const section =
        file.section || file.category || file.subCategory || 'other';
      const visibility =
        file.hiddenFromCustomer || file.hidden ? 'hidden' : 'visible';
      const kind = file.kind || 'document';

      if (mediaFilterSection !== 'all' && section !== mediaFilterSection) {
        return false;
      }

      if (
        mediaFilterVisibility !== 'all' &&
        visibility !== mediaFilterVisibility
      ) {
        return false;
      }

      if (mediaFilterKind !== 'all' && kind !== mediaFilterKind) {
        return false;
      }

      return true;
    });

    const sortFiles = (arr = []) => {
      const copied = [...arr];

      if (mediaSortMode === 'nameAsc') {
        return copied.sort((a, b) =>
          String(a.displayName || a.name || '').localeCompare(
            String(b.displayName || b.name || '')
          )
        );
      }

      if (mediaSortMode === 'nameDesc') {
        return copied.sort((a, b) =>
          String(b.displayName || b.name || '').localeCompare(
            String(a.displayName || a.name || '')
          )
        );
      }

      if (mediaSortMode === 'newest') {
        return copied.sort(
          (a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
        );
      }

      if (mediaSortMode === 'oldest') {
        return copied.sort(
          (a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0)
        );
      }

      return copied.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    };

    const filesBySection = FILE_SECTION_KEYS.reduce((acc, key) => {
      acc[key] = sortFiles(
        filteredFiles.filter((file) => {
          const category =
            file?.section || file?.category || file?.subCategory || 'other';
          return category === key;
        })
      );
      return acc;
    }, {});

    return (
      <section className="mpm-surface mpm-tab-shell">
        <div className="mpm-tab-section-header">
          <div>
            <div className="mpm-tab-kicker">Media & Files</div>
            <h3 className="mpm-tab-title">
              Uploads, previews, and asset management
            </h3>
            <p className="mpm-tab-subtitle">
              Reference images, proposals, build captures, customer-visible
              files, and internal-only project assets.
            </p>
          </div>
        </div>

        <div className="mpm-surface" style={{ marginBottom: 18 }}>
          <div className="mpm-tab-kicker">Upload</div>
          <h4 className="mpm-tab-title">Add project files</h4>
          <p className="mpm-tab-subtitle">
            Upload reference images, proposals, build captures, and
            customer-facing or internal-only assets for this project.
          </p>

          <div className="mpm-media-upload-grid">
            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Choose File</label>
              <input
                type="file"
                className="mpm-media-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPendingProjectFile(file);
                }}
              />
            </div>

            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">File Section</label>
              <select
                className="mpm-phase-selector-dropdown"
                value={pendingProjectFileSection}
                onChange={(e) => setPendingProjectFileSection(e.target.value)}
              >
                {MEDIA_FILE_SECTIONS.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Visibility</label>
              <label className="mpm-media-visibility-toggle">
                <input
                  type="checkbox"
                  checked={pendingProjectFileHidden}
                  onChange={(e) =>
                    setPendingProjectFileHidden(e.target.checked)
                  }
                />
                <span>
                  {pendingProjectFileHidden
                    ? 'Hidden from customer portal'
                    : 'Visible in customer portal'}
                </span>
              </label>
            </div>
          </div>

          <div className="mpm-media-upload-actions">
            <button
              type="button"
              className="mpm-bulk-btn"
              onClick={handleProjectFileUpload}
              disabled={!pendingProjectFile || isUploadingProjectFile}
            >
              {isUploadingProjectFile ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>

        <div className="mpm-surface" style={{ marginBottom: 18 }}>
          <div className="mpm-tab-kicker">View Controls</div>
          <h4 className="mpm-tab-title">Filter and sort</h4>

          <div className="mpm-media-upload-grid">
            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Section</label>
              <select
                className="mpm-phase-selector-dropdown"
                value={mediaFilterSection}
                onChange={(e) => setMediaFilterSection(e.target.value)}
              >
                <option value="all">All Sections</option>
                {MEDIA_FILE_SECTIONS.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Visibility</label>
              <select
                className="mpm-phase-selector-dropdown"
                value={mediaFilterVisibility}
                onChange={(e) => setMediaFilterVisibility(e.target.value)}
              >
                <option value="all">All</option>
                <option value="hidden">Hidden</option>
                <option value="visible">Visible</option>
              </select>
            </div>

            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Type</label>
              <select
                className="mpm-phase-selector-dropdown"
                value={mediaFilterKind}
                onChange={(e) => setMediaFilterKind(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDFs</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
            </div>

            <div className="mpm-media-upload-field">
              <label className="mpm-intake-field-label">Sort</label>
              <select
                className="mpm-phase-selector-dropdown"
                value={mediaSortMode}
                onChange={(e) => setMediaSortMode(e.target.value)}
              >
                <option value="custom">Custom Order</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="nameAsc">Name A–Z</option>
                <option value="nameDesc">Name Z–A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mpm-media-section-stack">
          {FILE_SECTION_KEYS.map((sectionKey) => {
            const sectionFiles = filesBySection[sectionKey] || [];

            return (
              <div
                key={sectionKey}
                className="mpm-surface mpm-media-section-card"
              >
                <div className="mpm-media-section-header">
                  <div>
                    <div className="mpm-tab-kicker">File Section</div>
                    <h4 className="mpm-tab-title">
                      {FILE_SECTION_LABELS[sectionKey]}
                    </h4>
                  </div>
                  <span className="mpm-media-count-badge">
                    {sectionFiles.length}
                  </span>
                </div>

                {sectionFiles.length === 0 ? (
                  <div className="mpm-media-empty-state">
                    No files in this section yet.
                  </div>
                ) : (
                  <div className="mpm-media-file-list">
                    {sectionFiles.map((file, idx) => {
                      const url = getProjectFileUrl(file);
                      const isImage = file?.kind === 'image';
                      const canMoveUp = mediaSortMode === 'custom' && idx > 0;
                      const canMoveDown =
                        mediaSortMode === 'custom' &&
                        idx < sectionFiles.length - 1;

                      return (
                        <div
                          key={file?.id || file?.name || `${sectionKey}-${idx}`}
                          className="mpm-media-file-row"
                        >
                          <div
                            style={{
                              width: 88,
                              minWidth: 88,
                              height: 88,
                              borderRadius: 14,
                              overflow: 'hidden',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isImage && url ? (
                              <img
                                src={file.thumbnailUrl || url}
                                alt={file.displayName || file.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, opacity: 0.65 }}>
                                {String(file.kind || 'file').toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div
                            className="mpm-media-file-main"
                            style={{ flex: 1, minWidth: 0 }}
                          >
                            <div
                              className="mpm-media-file-name"
                              style={{ marginBottom: 8 }}
                            >
                              <input
                                type="text"
                                value={file.displayName || file.name || ''}
                                onChange={(e) =>
                                  handleUpdateProjectFile(file.id, {
                                    displayName: e.target.value,
                                  })
                                }
                                className="mpm-phase-selector-dropdown"
                                style={{ width: '100%' }}
                              />
                            </div>

                            <div
                              className="mpm-media-file-meta"
                              style={{ marginBottom: 10 }}
                            >
                              Original:{' '}
                              {file.originalFileName || file.name || '—'}
                              <br />
                              {file.hiddenFromCustomer || file.hidden
                                ? 'Hidden from customer'
                                : 'Visible to customer'}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  'repeat(2, minmax(0, 220px))',
                                gap: 10,
                              }}
                            >
                              <select
                                className="mpm-phase-selector-dropdown"
                                value={
                                  file.section ||
                                  file.category ||
                                  file.subCategory ||
                                  'other'
                                }
                                onChange={(e) =>
                                  handleUpdateProjectFile(file.id, {
                                    section: e.target.value,
                                  })
                                }
                              >
                                {MEDIA_FILE_SECTIONS.map((section) => (
                                  <option key={section.key} value={section.key}>
                                    {section.label}
                                  </option>
                                ))}
                              </select>

                              <label className="mpm-media-visibility-toggle">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!(file.hiddenFromCustomer || file.hidden)
                                  }
                                  onChange={(e) =>
                                    handleUpdateProjectFile(file.id, {
                                      hiddenFromCustomer: e.target.checked,
                                    })
                                  }
                                />
                                <span>
                                  {file.hiddenFromCustomer || file.hidden
                                    ? 'Hidden from customer portal'
                                    : 'Visible in customer portal'}
                                </span>
                              </label>
                            </div>
                          </div>

                          <div
                            className="mpm-media-file-actions"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, auto)',
                              gap: 8,
                              alignSelf: 'start',
                            }}
                          >
                            <button
                              type="button"
                              className="mpm-bulk-btn"
                              onClick={() => {
                                if (!url) return;
                                setPreviewFile(file);
                              }}
                              disabled={!url}
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn"
                              onClick={() => {
                                if (!url) return;
                                window.open(
                                  url,
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }}
                              disabled={!url}
                            >
                              Download
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn"
                              onClick={() =>
                                handleMoveProjectFile(file.id, 'up')
                              }
                              disabled={!canMoveUp}
                            >
                              Move Up
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn"
                              onClick={() =>
                                handleMoveProjectFile(file.id, 'down')
                              }
                              disabled={!canMoveDown}
                            >
                              Move Down
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn"
                              onClick={() => handleDeleteProjectFile(file.id)}
                              style={{ gridColumn: '1 / -1' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

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
    if (selectedTab === ADMIN_SECTIONS.BUILD) {
      return ADMIN_SECTIONS.BUILD;
    }

    return selectedTab;
  };

  const getMobileBuildSelectValue = () => {
    if (!selectedStepKey) return buildPhases[0]?.key || '';
    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${selectedStepKey}::${idx}`;
  };

  const artistDisplayName =
    storyEngineData?.consultationMapped?.artistName ||
    storyEngineData?.questionnaireMapped?.artistName ||
    deriveCustomerName(projectData) ||
    'Artist';

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
            discoveryWorkspace: storyEngineData.discoveryWorkspace,
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

  const handleGenerateConsultationSummary = async () => {
    const rawTranscript = String(
      storyEngineData?.consultationTranscript || ''
    ).trim();

    if (!rawTranscript) return;

    try {
      setIsNormalizingTranscript(true);

      const resolvedArtistName =
        storyEngineData?.consultationMapped?.artistName ||
        storyEngineData?.questionnaireMapped?.artistName ||
        deriveCustomerName(projectData) ||
        '';

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

      const transcriptTextForSummary = mergedTurns
        .map((turn) => `${turn.speaker}: ${turn.text}`)
        .join('\n');

      const summaryPrompt = `
Write a builder-facing consultation summary for a custom snare drum project.

Return plain text only.
Do not return JSON.
Do not return markdown headings.

Write 6 to 10 short bullet-style lines or short sentences that capture:
- overall consultation takeaway
- artist special asks
- hard no's / dislikes
- any changes from questionnaire assumptions
- pain points with current drums or setup
- preferences that now feel confirmed
- details that still feel open
- accommodations, constraints, or follow-up concerns

Tone:
- builder-facing
- practical
- direct
- concise
- not marketing language

Artist name:
${resolvedArtistName || 'Artist'}

Consultation transcript:
${transcriptTextForSummary}

Private admin notes:
${String(storyEngineData?.adminNotes || '').trim()}

Questionnaire context:
${String(storyEngineData?.questionnaireRaw || '').trim()}
    `.trim();

      const hybridResult = await callHybridChapter({
        chapterKey: 'commitmentPortal',
        sectionKey: 'chapterOverview',
        payload: {
          projectId: projectData?.id || '',
          chapterKey: 'commitmentPortal',
          chapterLabel: 'Commitment & Portal Setup',
          artistName: resolvedArtistName || '',
          projectName: deriveBestProjectName(projectData) || '',
          consultationMapped: storyEngineData?.consultationMapped || {},
          questionnaireMapped: storyEngineData?.questionnaireMapped || {},
          buildSpec: storyEngineData?.engineRecord?.buildSpec || {},
          recommendations: storyEngineData?.engineRecord?.recommendations || {},
          engineMeta: storyEngineData?.engineRecord?.engineMeta || {},
        },
        prompts: {
          chapterOverview: summaryPrompt,
        },
      });

      const cleanedSummary = String(hybridResult?.chapterOverview || '').trim();

      const refreshedQuestionnaireMapped = sanitizeStoryFieldGroup(
        extractQuestionnaireMappedFields({
          questionnaireRaw: storyEngineData?.questionnaireRaw || '',
          existing: {},
        })
      );

      const refreshedConsultationMapped = sanitizeStoryFieldGroup(
        extractConsultationMappedFields({
          transcript: rawTranscript,
          summary: cleanedSummary,
          adminNotes: storyEngineData?.adminNotes || '',
          projectData,
          existing: {},
        })
      );

      const nextStoryEngineData = {
        ...storyEngineData,
        consultationTranscript: rawTranscript,
        consultationSummary: cleanedSummary,
        questionnaireMapped: {
          ...refreshedQuestionnaireMapped,
          artistName:
            deriveCustomerName(projectData) ||
            refreshedQuestionnaireMapped.artistName ||
            '',
        },
        consultationMapped: {
          ...refreshedConsultationMapped,
          artistName:
            deriveCustomerName(projectData) ||
            refreshedConsultationMapped.artistName ||
            '',
          projectName:
            refreshedConsultationMapped.projectName ||
            deriveBestProjectName(projectData) ||
            '',
        },
      };

      setNormalizedTranscriptTurns(mergedTurns);
      setStoryEngineData(nextStoryEngineData);

      await saveToFirestore({
        storyEngine: {
          sources: {
            consultationTranscript: rawTranscript,
            consultationTranscriptTurns: mergedTurns,
            consultationSummary: cleanedSummary,
            adminNotes: nextStoryEngineData.adminNotes,
            questionnaireRaw: nextStoryEngineData.questionnaireRaw,
            questionnaireMapped: nextStoryEngineData.questionnaireMapped,
            consultationMapped: nextStoryEngineData.consultationMapped,
            discoveryWorkspace: storyEngineData.discoveryWorkspace,
          },
          record: nextStoryEngineData.engineRecord,
          draftPreview: nextStoryEngineData.draftPreview,
          lastUpdatedAt: new Date().toISOString(),
        },
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error(
        '[ManageProjectModal] Consultation summary generation failed:',
        err
      );

      window.alert(
        `Call summarization failed:\n\n${err?.message || 'Unknown error'}`
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
        discoveryWorkspace: storyEngineData.discoveryWorkspace,
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
        discoveryWorkspace: storyEngineData.discoveryWorkspace,
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
          discoveryWorkspace: storyEngineData.discoveryWorkspace,
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

    const playSettingsArray = Array.isArray(playingWorld?.playSettings)
      ? playingWorld.playSettings
      : [];

    const playSettings = playSettingsArray.join(', ');

    const shellDirectionsArray = Array.isArray(
      buildDirection?.shellDirectionsOpenTo
    )
      ? buildDirection.shellDirectionsOpenTo
      : [];

    const shellDirectionsRaw = shellDirectionsArray.join(', ');

    const visualDirectionRaw = Array.isArray(buildDirection?.visualDirection)
      ? buildDirection.visualDirection
      : [buildDirection?.visualDirection].filter(Boolean);

    const visualDirection = visualDirectionRaw
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(', ');

    const responsePriorities = Array.isArray(soundGoals?.responsePriorities)
      ? soundGoals.responsePriorities.join(', ')
      : '';

    const tonalGoals = Array.isArray(soundGoals?.tonalGoals)
      ? soundGoals.tonalGoals.join(', ')
      : '';

    const lowerPlaySettings = playSettingsArray.map((v) =>
      String(v || '').toLowerCase()
    );

    const hasLive = lowerPlaySettings.some(
      (v) => v.includes('live') || v.includes('show') || v.includes('worship')
    );

    const hasStudio = lowerPlaySettings.some(
      (v) => v.includes('studio') || v.includes('record')
    );

    const normalizeQuestionnaireOpenText = (value, fallback = '') => {
      const raw = String(value || '').trim();
      const lower = raw.toLowerCase();

      if (!raw) return fallback;

      if (
        lower === "i'm not sure" ||
        lower === 'im not sure' ||
        lower === 'not sure' ||
        lower === 'unsure' ||
        lower === 'i trust your recommendation'
      ) {
        return 'Still open / needs consult validation';
      }

      return raw;
    };

    return {
      artistName: existing.artistName || '',

      styleOfPlaying:
        sanitizeFreeformStoryValue(playingWorld?.playerProfile || '') ||
        existing.styleOfPlaying ||
        '',

      desiredOutcome:
        sanitizeFreeformStoryValue(soundGoals?.primaryGoal || '') ||
        existing.desiredOutcome ||
        '',

      genreContext:
        sanitizeCommaSeparatedStoryValue(genres) || existing.genreContext || '',

      recordingUse: hasStudio ? 'yes' : existing.recordingUse || '',

      liveUse: hasLive ? 'yes' : existing.liveUse || '',

      influenceReferences:
        sanitizeFreeformStoryValue(playSettings) ||
        existing.influenceReferences ||
        '',

      hardwareFinish:
        normalizeQuestionnaireOpenText(
          buildDirection?.hardwareFinishPreference || '',
          ''
        ) ||
        existing.hardwareFinish ||
        '',

      woodPreference:
        normalizeQuestionnaireOpenText(shellDirectionsRaw, '') ||
        existing.woodPreference ||
        '',

      finishDirection: visualDirection || existing.finishDirection || '',

      responsePriorities:
        sanitizeFreeformStoryValue(responsePriorities) ||
        existing.responsePriorities ||
        '',

      tonalGoals:
        sanitizeFreeformStoryValue(tonalGoals) || existing.tonalGoals || '',

      preferredSizeDirection:
        sanitizeFreeformStoryValue(
          buildDirection?.preferredSizeDirection || ''
        ) ||
        existing.preferredSizeDirection ||
        '',

      consultationContactMethod:
        sanitizeFreeformStoryValue(
          consultPrep?.consultationContactMethod || ''
        ) ||
        existing.consultationContactMethod ||
        '',

      buildClarity:
        sanitizeFreeformStoryValue(buildDirection?.buildClarity || '') ||
        existing.buildClarity ||
        '',
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

      const fallbackTranscriptSummary = sanitizeFreeformStoryValue(
        storyEngineData.consultationTranscript
      )
        ? `Consultation notes captured: ${sanitizeFreeformStoryValue(
            storyEngineData.consultationTranscript
          )}`
        : '';

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
        ) ||
        fallbackTranscriptSummary;

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
          discoveryWorkspace: storyEngineData.discoveryWorkspace,
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

  const buildWorkflowLocked = !projectReadiness.buildWorkflowUnlocked;

  const craftsmanToolIssues = [
    ...projectReadiness.missingCraftsmanDecisionIds.map((id) => ({
      key: id,
      label: id,
      type: 'missing-decision',
    })),
    ...(projectReadiness.craftsmanStaleCount > 0
      ? [
          {
            key: 'stale-decisions',
            label: `${projectReadiness.craftsmanStaleCount} stale decision${
              projectReadiness.craftsmanStaleCount === 1 ? '' : 's'
            } need review`,
            type: 'stale',
          },
        ]
      : []),
  ];

  const intakeIssues = [
    ...(!projectReadiness.hasQuestionnaire
      ? [
          {
            key: 'questionnaire',
            label: 'Questionnaire intake is still missing',
          },
        ]
      : []),
    ...(!projectReadiness.hasSummary
      ? [
          {
            key: 'summary',
            label: 'Consultation summary is still missing',
          },
        ]
      : []),
    ...(!projectReadiness.hasTranscript
      ? [
          {
            key: 'transcript',
            label: 'Consultation transcript is still missing',
          },
        ]
      : []),
  ];

  const storyStudioIssues = [
    ...projectReadiness.missingBuildSpecKeys.map((key) => ({
      key,
      label: `Build spec still needs confirmation: ${key}`,
    })),
  ];

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

  const toggleSidebarGroup = (groupId) => {
    setExpandedSidebarGroup((prev) => (prev === groupId ? '' : groupId));
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
        <header className="mpm-header mpm-header-compact">
          <div className="mpm-header-topbar mpm-header-topbar-compact">
            <div className="mpm-header-topbar-left mpm-header-topbar-left-compact">
              <div className="mpm-header-kicker">SoundLegend Project</div>

              <div className="mpm-header-title-row">
                <h2 id="admin-project-view-title" className="mpm-title">
                  {artistNameForHeader}
                </h2>

                <span className="mpm-topbar-divider">•</span>

                <span className="mpm-header-project-inline">
                  {compactProjectLabel}
                </span>
              </div>

              <div className="mpm-header-meta-inline">
                <span className="mpm-header-inline-chip">
                  ID: {idText}
                  <button
                    type="button"
                    className="mpm-copy-icon-btn"
                    onClick={() =>
                      navigator.clipboard?.writeText(String(idText))
                    }
                    title="Copy project ID"
                    aria-label="Copy project ID"
                  >
                    ⧉
                  </button>
                </span>

                <span className="mpm-header-inline-chip">
                  Progress: {weightedProgress}%
                </span>

                <span className="mpm-header-inline-chip">
                  Chapter: {currentPhaseLabel}
                </span>

                <span className="mpm-header-inline-chip">
                  {projectReadiness.buildWorkflowUnlocked
                    ? 'Workflow Ready'
                    : 'Workflow Locked'}
                </span>
              </div>
            </div>

            <div className="mpm-header-topbar-actions">
              {projectData?.id ? (
                <button
                  type="button"
                  className="mpm-action-btn mpm-action-btn-compact"
                  onClick={handleViewAsCustomer}
                  disabled={!projectReadiness.portalExposure.softShareReady}
                  title={
                    projectReadiness.portalExposure.softShareReady
                      ? 'Open artist portal preview'
                      : 'Portal preview is locked until intake + direction are stronger'
                  }
                >
                  {topbarPortalLabel}
                </button>
              ) : null}

              <button
                type="button"
                aria-label="Close modal"
                className="mpm-close-btn"
                onClick={onClose}
              >
                ✕
              </button>
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
                  val === ADMIN_SECTIONS.PROJECT_DETAILS ||
                  val === ADMIN_SECTIONS.BUILD_SCOPE ||
                  val === ADMIN_SECTIONS.MEDIA_FILES ||
                  val === ADMIN_SECTIONS.INTAKE ||
                  val === ADMIN_SECTIONS.CRAFTSMAN_TOOL ||
                  val === ADMIN_SECTIONS.VENEER_DESIGNER ||
                  val === ADMIN_SECTIONS.STORY_STUDIO
                ) {
                  setSelectedTab(val);
                  return;
                }

                if (val === ADMIN_SECTIONS.BUILD) {
                  if (buildWorkflowLocked) return;

                  setSelectedTab(ADMIN_SECTIONS.BUILD);
                  setExpandedStepKey(
                    selectedStepKey || buildPhases[0]?.key || null
                  );
                  setSelectedStepKey(
                    selectedStepKey || buildPhases[0]?.key || null
                  );
                  setSelectedSubIndex(
                    Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0
                  );
                }
              }}
            >
              <option value={ADMIN_SECTIONS.PROJECT_DETAILS}>
                Project Details
              </option>
              <option value={ADMIN_SECTIONS.BUILD_SCOPE}>Build Scope</option>
              <option value={ADMIN_SECTIONS.MEDIA_FILES}>Media & Files</option>
              <option value={ADMIN_SECTIONS.INTAKE}>Intake & Direction</option>
              <option value={ADMIN_SECTIONS.CRAFTSMAN_TOOL}>
                Craftsman Master Tool
              </option>
              <option value={ADMIN_SECTIONS.VENEER_DESIGNER}>
                Ober Veneer Designer
              </option>
              <option value={ADMIN_SECTIONS.STORY_STUDIO}>Story Studio</option>
              <option
                value={ADMIN_SECTIONS.BUILD}
                disabled={buildWorkflowLocked}
              >
                {buildWorkflowLocked
                  ? 'Build Workflow (Locked)'
                  : 'Build Workflow'}
              </option>
            </select>

            {selectedTab === ADMIN_SECTIONS.BUILD && !buildWorkflowLocked ? (
              <select
                className="mpm-phase-selector-dropdown mpm-phase-selector-dropdown-secondary"
                value={getMobileBuildSelectValue()}
                onChange={(e) => {
                  const [stepKey, idxStr] = e.target.value.split('::');
                  const idx = Number(idxStr) || 0;

                  setExpandedStepKey(stepKey);
                  setSelectedStepKey(stepKey);
                  setSelectedSubIndex(idx);
                }}
              >
                {(Array.isArray(buildPhases) ? buildPhases : []).map(
                  (phase) => {
                    const cl = Array.isArray(
                      editableData?.[phase.key]?.checklist
                    )
                      ? editableData[phase.key].checklist
                      : [];

                    if (!cl.length) return null;

                    return (
                      <optgroup key={phase.key} label={phase.label}>
                        {cl.map((item, idx) => {
                          const label = String(
                            item?.task ?? item?.label ?? ''
                          ).trim();
                          return (
                            <option
                              key={`${phase.key}::${idx}`}
                              value={`${phase.key}::${idx}`}
                            >
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  }
                )}
              </select>
            ) : null}
          </div>

          <aside className="mpm-sidebar">
            {ADMIN_NAV_GROUPS.map((group) => {
              const isOpen = expandedSidebarGroup === group.id;

              return (
                <div
                  key={group.label}
                  className={`mpm-sidebar-group ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="mpm-sidebar-group-toggle"
                    onClick={() => toggleSidebarGroup(group.id)}
                  >
                    <span className="mpm-sidebar-group-label">
                      {group.label}
                    </span>
                    <span className="mpm-sidebar-group-toggle-icon">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="mpm-sidebar-group-buttons">
                      {group.items.map((item) => (
                        <button
                          key={item.key}
                          className={`mpm-sidebar-overview-btn ${
                            selectedTab === item.key ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSelectedTab(item.key);
                            setExpandedSidebarGroup(group.id);
                          }}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div
              className={`mpm-sidebar-group ${
                expandedSidebarGroup === 'build' ? 'is-open' : ''
              }`}
            >
              <button
                type="button"
                className="mpm-sidebar-group-toggle"
                onClick={() => toggleSidebarGroup('build')}
              >
                <span className="mpm-sidebar-group-label">Build Workflow</span>
                <span className="mpm-sidebar-group-toggle-icon">
                  {expandedSidebarGroup === 'build' ? '−' : '+'}
                </span>
              </button>

              {expandedSidebarGroup === 'build' ? (
                <div className="mpm-sidebar-step-list always-open">
                  {(Array.isArray(buildPhases) ? buildPhases : []).map(
                    (step) => {
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
                            } ${buildWorkflowLocked ? 'is-locked' : ''}`}
                            onClick={() => {
                              if (buildWorkflowLocked) return;

                              setSelectedTab(ADMIN_SECTIONS.BUILD);
                              setExpandedSidebarGroup('build');
                              setExpandedStepKey(step.key);
                              setSelectedStepKey(step.key);
                              setSelectedSubIndex(0);
                            }}
                            type="button"
                            disabled={buildWorkflowLocked}
                            title={
                              buildWorkflowLocked
                                ? 'Build Workflow is locked until intake, Craftsman direction, and story build-specs are ready'
                                : step.label
                            }
                          >
                            <StatusPip level="step" status={stepStatus} />
                            <span className="mpm-sidebar-step-text">
                              {step.label}
                            </span>
                            {buildWorkflowLocked ? (
                              <span className="mpm-sidebar-lock">Locked</span>
                            ) : null}
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
                                          if (buildWorkflowLocked) return;

                                          setSelectedTab(ADMIN_SECTIONS.BUILD);
                                          setExpandedSidebarGroup('build');
                                          setExpandedStepKey(step.key);
                                          setSelectedStepKey(step.key);
                                          setSelectedSubIndex(idx);
                                        }}
                                        disabled={buildWorkflowLocked}
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
                    }
                  )}
                </div>
              ) : null}
            </div>
          </aside>

          <main className="mpm-main">
            {selectedTab === ADMIN_SECTIONS.PROJECT_DETAILS ? (
              renderProjectDetailsPlaceholder()
            ) : selectedTab === ADMIN_SECTIONS.BUILD_SCOPE ? (
              renderBuildScopePlaceholder()
            ) : selectedTab === ADMIN_SECTIONS.MEDIA_FILES ? (
              renderMediaFilesSection()
            ) : selectedTab === ADMIN_SECTIONS.INTAKE ? (
              <IntakeDirectionSection
                storyEngineData={storyEngineData}
                setStoryEngineData={setStoryEngineData}
                handleGenerateConsultationSummary={
                  handleGenerateConsultationSummary
                }
                storyEngineRunning={storyEngineRunning}
                isNormalizingTranscript={isNormalizingTranscript}
                normalizedTranscriptTurns={normalizedTranscriptTurns}
                buildSmartTranscriptTurns={buildSmartTranscriptTurns}
                deriveCustomerName={deriveCustomerName}
                projectData={projectData}
                saveStoryEngineToProject={saveStoryEngineToProject}
              />
            ) : selectedTab === ADMIN_SECTIONS.CRAFTSMAN_TOOL ? (
              <CraftsmanMasterToolSection
                projectData={projectData}
                editableData={editableData}
                storyEngineData={storyEngineData}
                saveToFirestore={saveToFirestore}
                saveStoryEngineToProject={saveStoryEngineToProject}
                readinessItems={craftsmanToolIssues}
              />
            ) : selectedTab === ADMIN_SECTIONS.VENEER_DESIGNER ? (
              renderVeneerDesignerPlaceholder()
            ) : selectedTab === ADMIN_SECTIONS.STORY_STUDIO ? (
              <StoryStudioSection
                storyEngineData={storyEngineData}
                storyEngineRunning={storyEngineRunning}
                handleRunStoryEngine={handleRunStoryEngine}
                saveStoryEngineToProject={saveStoryEngineToProject}
                storyStudioSummaryStats={storyStudioSummaryStats}
                storyStudioOutstandingItems={storyStudioOutstandingItems}
                setOutstandingHelpItem={setOutstandingHelpItem}
                regenerateChapterSection={regenerateChapterSection}
                toggleChapterSectionLock={toggleChapterSectionLock}
                getChapterSectionData={getChapterSectionData}
                craftsmanMasterTool={
                  editableData?.craftsmanMasterTool ||
                  projectData?.craftsmanMasterTool ||
                  {}
                }
                readinessItems={storyStudioIssues}
              />
            ) : buildWorkflowLocked ? (
              <section className="mpm-build-locked-panel">
                <div className="mpm-build-locked-kicker">Build Workflow</div>
                <h3 className="mpm-build-locked-title">
                  Build workflow is still locked
                </h3>
                <p className="mpm-build-locked-copy">
                  Finish the project direction work first so the shop workflow
                  starts from a stable, believable build plan.
                </p>

                <div className="mpm-build-locked-list">
                  {projectReadiness.blockers.map((blocker) => (
                    <div key={blocker} className="mpm-build-locked-item">
                      {blocker}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <BuildWorkflowSection
                selectedStepKey={selectedStepKey}
                editableData={editableData}
                bulkUpdateStepCompletion={bulkUpdateStepCompletion}
                setSelectedStepKey={setSelectedStepKey}
                setExpandedStepKey={setExpandedStepKey}
                setSelectedSubIndex={setSelectedSubIndex}
                currentSubLabel={currentSubLabel}
                handleSubStepCompletionChange={handleSubStepCompletionChange}
                handleCheckpointStatesChange={handleCheckpointStatesChange}
                selectedSubIndex={selectedSubIndex}
              />
            )}
          </main>
        </div>

        {previewFile ? (
          <div
            className="mpm-file-preview-overlay"
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="mpm-file-preview-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mpm-file-preview-header">
                <div className="mpm-file-preview-title">
                  {previewFile?.name || previewFile?.fileName || 'File Preview'}
                </div>

                <button
                  type="button"
                  className="mpm-close-btn"
                  onClick={() => setPreviewFile(null)}
                >
                  ✕
                </button>
              </div>

              <div className="mpm-file-preview-body">
                {previewFile?.kind === 'image' ? (
                  <div>
                    <p>{getProjectFileUrl(previewFile)}</p>
                    <img
                      src={getProjectFileUrl(previewFile)}
                      alt={previewFile?.name || 'Preview'}
                      className="mpm-file-preview-image"
                      onLoad={() => console.log('image loaded')}
                      onError={(e) => console.error('image failed to load', e)}
                    />
                  </div>
                ) : previewFile?.kind === 'pdf' ? (
                  <iframe
                    src={getProjectFileUrl(previewFile)}
                    title={previewFile?.name || 'PDF Preview'}
                    className="mpm-file-preview-frame"
                  />
                ) : previewFile?.kind === 'video' ? (
                  <video
                    controls
                    className="mpm-file-preview-video"
                    src={getProjectFileUrl(previewFile)}
                  />
                ) : previewFile?.kind === 'audio' ? (
                  <audio
                    controls
                    className="mpm-file-preview-audio"
                    src={getProjectFileUrl(previewFile)}
                  />
                ) : (
                  <div className="mpm-file-preview-fallback">
                    <p>No inline preview available for this file type.</p>
                    <a
                      href={getProjectFileUrl(previewFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mpm-bulk-btn"
                    >
                      Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <OutstandingHelpOverlay
          outstandingHelpItem={outstandingHelpItem}
          setOutstandingHelpItem={setOutstandingHelpItem}
        />

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
