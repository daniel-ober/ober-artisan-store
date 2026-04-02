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
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import { STAGES, STAGE_TEMPLATES } from '../../utils/workflowDefinitions';
import { PROJECT_STAGE_EDU } from '../../utils/projectStageEducation';
import { PROJECT_STAGE_STORY } from '../../utils/projectStageStory';
import {
  ARCHIVE_VISIBILITY,
  getStageArchiveDefinition,
  getStageSuggestedCaptures,
  getStageAdminCaptureChecklist,
  getArchiveCaptureByKey,
} from '../../utils/projectStageArchiveDefinitions';
import { createPortal } from 'react-dom';
import './ProjectProgress.css';

const STAGE_MEDIA = {
  discoveryDesign: { stageNumber: 1 },
  commitmentPortal: { stageNumber: 2 },
  woodVisionLockIn: { stageNumber: 3 },
  rawShellCreation: { stageNumber: 4 },
  shellTrueingTorchTune: { stageNumber: 5 },
  exteriorArtFinish: { stageNumber: 6 },
  edgesSnareBeds: { stageNumber: 7 },
  hardwareAssembly: { stageNumber: 8 },
  legacyTuningMedia: { stageNumber: 9 },
  finalQAPackagingDelivery: { stageNumber: 10 },
};

const STAGE_MEDIA_STATE = {
  COMPLETED: 'completed',
  CURRENT: 'current',
  NEXT: 'next',
  FUTURE: 'future',
};

const GLOBAL_STAGE_ASSETS = {
  smokeOverlay: 'smoke-overlay.mp4',
  logoOverlay: 'logo-overlay.png',
  completedBadge: 'completed-badge.png',
};

const STAGE_MEDIA_PROMISE_CACHE = {};
const STAGE_IMAGE_PRELOAD_CACHE = {};

const PROJECT_PROGRESS_STAGE_MEDIA_CACHE_KEY =
  'projectProgressStageMediaCache:v1';

function readProjectProgressStageMediaCache() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(
      PROJECT_PROGRESS_STAGE_MEDIA_CACHE_KEY
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed reading stage media cache', err);
    return null;
  }
}

function writeProjectProgressStageMediaCache(cache) {
  if (typeof window === 'undefined') return;
  if (!cache) return;

  try {
    window.sessionStorage.setItem(
      PROJECT_PROGRESS_STAGE_MEDIA_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch (err) {
    console.warn('Failed writing stage media cache', err);
  }
}

const PROJECT_PROGRESS_CACHE_PREFIX = 'projectProgressCache:';

function getProjectProgressIdentity(projectLike) {
  return (
    projectLike?.id ||
    projectLike?.projectId ||
    projectLike?.docId ||
    projectLike?.serial ||
    projectLike?.snareSerial ||
    projectLike?.lineSerial ||
    ''
  );
}

function getProjectProgressCacheKey(projectLike) {
  const id = getProjectProgressIdentity(projectLike);
  return id ? `${PROJECT_PROGRESS_CACHE_PREFIX}${id}` : null;
}

function readProjectProgressCache(projectLike) {
  if (typeof window === 'undefined') return null;

  try {
    const key = getProjectProgressCacheKey(projectLike);
    if (!key) return null;

    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed reading project progress cache', err);
    return null;
  }
}

function writeProjectProgressCache(projectLike, data) {
  if (typeof window === 'undefined') return;
  if (!data) return;

  try {
    const key = getProjectProgressCacheKey(projectLike || data);
    if (!key) return;

    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed writing project progress cache', err);
  }
}

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

  if (states && states.length > 0) return states.every(Boolean);
  return !!item.completed;
}

function isChecklistItemTouched(item) {
  if (!item) return false;
  if (item.completed) return true;

  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : null;

  if (states && states.length > 0) return states.some(Boolean);
  return (item.totalSeconds ?? 0) > 0;
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

function toRomanChapter(value) {
  const numerals = [
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];

  let num = Number(value) || 1;
  let result = '';

  numerals.forEach(([symbol, amount]) => {
    while (num >= amount) {
      result += symbol;
      num -= amount;
    }
  });

  return result;
}

function getFileTypeFromUrl(url = '', explicitType = '') {
  const normalizedType = String(explicitType || '').toLowerCase();

  if (
    normalizedType === 'image' ||
    normalizedType === 'video' ||
    normalizedType === 'audio'
  ) {
    return normalizedType;
  }

  const lower = String(url || '').toLowerCase();

  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com')
  ) {
    return 'video';
  }

  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.m4v')
  ) {
    return 'video';
  }

  if (
    lower.endsWith('.mp3') ||
    lower.endsWith('.wav') ||
    lower.endsWith('.m4a') ||
    lower.endsWith('.aac') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.flac')
  ) {
    return 'audio';
  }

  if (
    lower.endsWith('.pdf') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.txt')
  ) {
    return 'document';
  }

  return 'document';
}

function getFileNameFromUrl(url = '') {
  try {
    const clean = String(url || '').split('?')[0];
    const last = clean.split('/').pop() || 'Resource';
    return decodeURIComponent(last);
  } catch {
    return 'Resource';
  }
}

function getResolvedVisualStageState({
  project,
  step,
  stageIndex,
  currentStepIndex,
  projectMarkedComplete = false,
}) {
  if (!step) return STAGE_MEDIA_STATE.FUTURE;

  if (step.key === 'soundlegendCover') {
    return STAGE_MEDIA_STATE.CURRENT;
  }

  if (step.key === 'soundlegendEpilogue') {
    return projectMarkedComplete
      ? STAGE_MEDIA_STATE.COMPLETED
      : STAGE_MEDIA_STATE.FUTURE;
  }

  const stepStatus = String(
    getStepStatus(project, step).status || ''
  ).toLowerCase();

  if (stepStatus === 'completed') {
    return STAGE_MEDIA_STATE.COMPLETED;
  }

  return getSelectedStageMediaState(stageIndex, currentStepIndex);
}

function getFileExtension(url = '') {
  try {
    const clean = String(url || '')
      .split('?')[0]
      .toLowerCase();
    const match = clean.match(/\.([a-z0-9]+)$/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function isPdfUrl(url = '') {
  return getFileExtension(url) === 'pdf';
}

function normalizeExternalUrl(url = '') {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function getYouTubeId(url = '') {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    const v = parsed.searchParams.get('v');
    if (v) return v;

    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/i);
    if (embedMatch) return embedMatch[1];
  } catch {
    return null;
  }

  return null;
}

function getVideoEmbedUrl(url = '') {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const ytId = getYouTubeId(normalized);
      return ytId ? `https://www.youtube.com/embed/${ytId}?rel=0` : null;
    }

    if (host.includes('vimeo.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function formatResourceTypeLabel(type = '') {
  if (type === 'image') return 'Image';
  if (type === 'video') return 'Video';
  if (type === 'audio') return 'Audio';
  return 'Document';
}

function normalizeStageResourceItem(item, fallback = {}) {
  if (!item?.url) return null;

  return {
    id:
      item.id ||
      `${fallback.source || 'resource'}-${fallback.category || 'misc'}-${fallback.index || 0}-${item.url}`,
    url: item.url,
    title:
      item.title || item.name || fallback.title || getFileNameFromUrl(item.url),
    type: getFileTypeFromUrl(item.url, item.type),
    stage:
      typeof item.stage === 'number'
        ? item.stage
        : typeof fallback.stage === 'number'
          ? fallback.stage
          : 0,
    category: item.category || fallback.category || 'resource',
    source: fallback.source || 'resource',
    hidden: !!item.hidden,
    uploadedAt: item.uploadedAt || item.createdAt || fallback.uploadedAt || '',
    createdAt: item.createdAt || item.uploadedAt || fallback.createdAt || '',
  };
}

function getStageResourceItems(project, selectedStageNumber) {
  if (!project) {
    return {
      items: [],
      paymentLink: '',
      signatureLink: '',
    };
  }

  const paymentLink =
    project?.paymentLink ||
    project?.stripeCheckoutUrl ||
    project?.checkoutUrl ||
    '';

  const signatureLink =
    project?.signatureLink ||
    project?.documentToSignUrl ||
    project?.esignUrl ||
    '';

  const normalizedItems = [];

  const mediaItems = Array.isArray(project?.media) ? project.media : [];
  mediaItems.forEach((item, index) => {
    const normalized = normalizeStageResourceItem(item, {
      source: 'media',
      category: item?.category || 'media',
      index,
      stage: item?.stage,
    });

    if (normalized && !normalized.hidden) {
      normalizedItems.push(normalized);
    }
  });

  const attachmentGroups =
    project?.attachments && typeof project.attachments === 'object'
      ? project.attachments
      : {};

  Object.entries(attachmentGroups).forEach(([categoryKey, arr]) => {
    if (!Array.isArray(arr)) return;

    arr.forEach((item, index) => {
      const normalized = normalizeStageResourceItem(item, {
        source: 'attachment',
        category: categoryKey,
        index,
        stage: item?.stage,
      });

      if (normalized && !normalized.hidden) {
        normalizedItems.push(normalized);
      }
    });
  });

  const stageItems = normalizedItems.filter((item) => {
    if (!selectedStageNumber) return false;
    return Number(item.stage || 0) === Number(selectedStageNumber);
  });

  stageItems.sort((a, b) => {
    const aTime = tsToMillis(a.uploadedAt || a.createdAt);
    const bTime = tsToMillis(b.uploadedAt || b.createdAt);
    return bTime - aTime;
  });

  return {
    items: stageItems,
    paymentLink,
    signatureLink,
  };
}

function preloadImage(url) {
  if (!url) return Promise.resolve('');

  if (STAGE_IMAGE_PRELOAD_CACHE[url]) {
    return STAGE_IMAGE_PRELOAD_CACHE[url];
  }

  STAGE_IMAGE_PRELOAD_CACHE[url] = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.loading = 'eager';

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch (err) {
        // harmless decode failures
      }
      resolve(url);
    };

    img.onerror = reject;
    img.src = url;
  });

  return STAGE_IMAGE_PRELOAD_CACHE[url];
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

function formatDateForInput(value) {
  const ms = tsToMillis(value);
  if (!ms) return '';

  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function fmtDate(v) {
  const ms = typeof v === 'number' ? v : tsToMillis(v);
  if (!ms) return null;

  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
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
  if (selectedIndex < currentIndex) return STAGE_MEDIA_STATE.COMPLETED;
  if (selectedIndex === currentIndex) return STAGE_MEDIA_STATE.CURRENT;
  if (selectedIndex === currentIndex + 1) return STAGE_MEDIA_STATE.NEXT;
  return STAGE_MEDIA_STATE.FUTURE;
}

function isStoryChapterAccessible({
  step,
  stageIndex,
  currentStepIndex,
  projectMarkedComplete,
  chapterTwoComplete = false,
}) {
  if (!step) return false;

  if (step.key === 'soundlegendCover') {
    return true;
  }

  if (step.key === 'soundlegendEpilogue') {
    return !!projectMarkedComplete;
  }

  if (typeof stageIndex !== 'number' || stageIndex < 0) {
    return false;
  }

  // Chapters I–III are always clickable.
  if (stageIndex <= 2) {
    return true;
  }

  // Once Chapter II is complete, all remaining chapters become clickable.
  if (chapterTwoComplete) {
    return true;
  }

  // Otherwise Chapters IV+ stay non-clickable.
  return false;
}

function getStageImageFilename(stageKey, variant = 'archived') {
  const stage = STAGE_MEDIA[stageKey];
  if (!stage?.stageNumber) return null;

  if (variant === 'current') {
    return `stage-${stage.stageNumber}-current.webp`;
  }

  return `stage-${stage.stageNumber}-archived.webp`;
}

function getSharedAssetFilename(assetKey) {
  return GLOBAL_STAGE_ASSETS[assetKey] || null;
}

async function fetchStorageAssetUrl(folderPath, filename) {
  if (!folderPath || !filename) return null;

  try {
    const fileRef = storageRef(storage, `${folderPath}/${filename}`);
    return await getDownloadURL(fileRef);
  } catch (err) {
    console.warn(`Missing storage asset: ${folderPath}/${filename}`, err);
    return null;
  }
}

function getStageMediaCacheKey(stageKey) {
  return `bundle:${stageKey}`;
}

async function resolveStageMediaBundle(stageKey) {
  if (!stageKey) return null;

  const cacheKey = getStageMediaCacheKey(stageKey);
  if (STAGE_MEDIA_PROMISE_CACHE[cacheKey]) {
    return STAGE_MEDIA_PROMISE_CACHE[cacheKey];
  }

  STAGE_MEDIA_PROMISE_CACHE[cacheKey] = (async () => {
    const archivedImageName = getStageImageFilename(stageKey, 'archived');
    const currentImageName = getStageImageFilename(stageKey, 'current');
    const smokeVideoName = getSharedAssetFilename('smokeOverlay');
    const logoOverlayName = getSharedAssetFilename('logoOverlay');
    const completedBadgeName = getSharedAssetFilename('completedBadge');
    const folderPath = 'project-stage-media';

    const [
      archivedImageUrl,
      currentImageUrl,
      smokeVideoUrl,
      logoOverlayUrl,
      completedBadgeUrl,
    ] = await Promise.all([
      archivedImageName
        ? fetchStorageAssetUrl(folderPath, archivedImageName)
        : Promise.resolve(null),
      currentImageName
        ? fetchStorageAssetUrl(folderPath, currentImageName)
        : Promise.resolve(null),
      smokeVideoName
        ? fetchStorageAssetUrl(folderPath, smokeVideoName)
        : Promise.resolve(null),
      logoOverlayName
        ? fetchStorageAssetUrl(folderPath, logoOverlayName)
        : Promise.resolve(null),
      completedBadgeName
        ? fetchStorageAssetUrl(folderPath, completedBadgeName)
        : Promise.resolve(null),
    ]);

    return {
      archivedImageUrl: archivedImageUrl || '',
      currentImageUrl: currentImageUrl || '',
      smokeVideoUrl: smokeVideoUrl || '',
      logoOverlayUrl: logoOverlayUrl || '',
      completedBadgeUrl: completedBadgeUrl || '',
    };
  })();

  return STAGE_MEDIA_PROMISE_CACHE[cacheKey];
}

function getStageSummary(step) {
  const source = step?.what || '';
  if (!source) return 'A refined look at this phase of your SoundLegend build.';

  const firstSentence = source.split('. ')[0]?.trim();
  if (!firstSentence) return source;
  return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;
}

function getStageStatePresentation(selectedIndex, currentIndex) {
  const state = getSelectedStageMediaState(selectedIndex, currentIndex);

  if (state === STAGE_MEDIA_STATE.COMPLETED) {
    return {
      eyebrow: 'Chapter Completed',
      pill: 'Completed',
      helper:
        'This chapter is complete and now lives as part of your build archive.',
    };
  }

  if (state === STAGE_MEDIA_STATE.CURRENT) {
    return {
      eyebrow: 'Chapter In Progress',
      pill: 'In Progress',
      helper: 'This is the current active chapter in your instrument’s story.',
    };
  }

  if (state === STAGE_MEDIA_STATE.NEXT) {
    return {
      eyebrow: "A look at what's coming next",
      pill: 'Up Next',
      helper:
        'This chapter is approaching and will open as the current stage closes.',
    };
  }

  return {
    eyebrow: 'Future Chapter',
    pill: 'Locked',
    helper: 'This chapter will unlock later in the build journey.',
  };
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

      if (!isComplete) {
        return { stageKey, stepIdx: i };
      }
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

function areAllStoryChaptersComplete(project) {
  if (!project) return false;

  return STEPS.every((step) => {
    const status = getStepStatus(project, step);
    return String(status?.status || '').toLowerCase() === 'completed';
  });
}

function getSoundLegendRevealState(project) {
  const reveal = project?.soundlegendReveal || {};

  return {
    enabled: !!reveal.enabled,
    deployedAt: reveal.deployedAt || null,
    deployedBy: reveal.deployedBy || '',
    shipmentConfirmed: !!reveal.shipmentConfirmed,
    coverMediaType: reveal.coverMediaType || 'image',
    coverMediaUrl: reveal.coverMediaUrl || '',
    coverMediaTitle: reveal.coverMediaTitle || '',
    coverTitle: reveal.coverTitle || 'Your SoundLegend Story',
    coverSubtitle:
      reveal.coverSubtitle ||
      'The completed journey of your custom instrument.',
    adminChecklist: {
      coverMediaSelected: !!reveal?.adminChecklist?.coverMediaSelected,
      chapterMediaReviewed: !!reveal?.adminChecklist?.chapterMediaReviewed,
      visibilityReviewed: !!reveal?.adminChecklist?.visibilityReviewed,
      customerStoryApproved: !!reveal?.adminChecklist?.customerStoryApproved,
      shipmentConfirmed: !!reveal?.adminChecklist?.shipmentConfirmed,
      finalReviewComplete: !!reveal?.adminChecklist?.finalReviewComplete,
    },
  };
}

function isSoundLegendRevealReady(project) {
  const reveal = getSoundLegendRevealState(project);
  const checklistValues = Object.values(reveal.adminChecklist || {});
  return checklistValues.length > 0 && checklistValues.every(Boolean);
}

function getLegacyChapterContent(project, isAdmin = false) {
  const reveal = project?.soundlegendReveal || {};
  const trackingNumber = reveal.trackingNumber || '';
  const shippingCarrier = reveal.shippingCarrier || '';
  const finalNote =
    reveal.finalAdminNote ||
    'Your instrument is complete, your story is now yours to carry forward, and we are honored to have built this chapter with you.';

  return {
    title: 'Legacy in Your Hands',
    eyebrow: 'Legacy Chapter',
    intro:
      'What began as an idea, a conversation, and a vision now lives as a real instrument in your hands. This drum is no longer part of our bench story alone — it now becomes part of your voice, your sessions, your stages, and your legacy.',
    gratitude:
      'Thank you for trusting Ober Artisan Drums with something this personal. Building a SoundLegend instrument is never just about wood, hardware, or finish — it is about helping create a vessel for expression, memory, identity, and art. Being invited into that process is something I do not take lightly, and I am deeply grateful to have been part of your story.',
    care: 'Treat your SoundLegend with the same intention it was built with. Keep it in a stable environment, avoid extreme shifts in heat or humidity, wipe it down gently after playing, and give it the respect due to an instrument made to travel with you for years to come.',
    guarantee:
      'This instrument carries the Ober Artisan standard of craftsmanship and care. If anything ever feels off, unexpected, or in need of attention, reach out directly. I stand behind the work, and I want this drum to continue serving you exactly as it was meant to.',
    encouragement:
      'Most importantly, make music with it. Let it collect songs, rehearsals, recordings, breakthroughs, hard seasons, beautiful seasons, and the kind of moments that cannot be manufactured — only lived. The build may be complete, but the real story begins now with you.',
    nextSteps: [
      'Inspect the instrument carefully upon arrival.',
      'Allow it to acclimate before making major tuning changes.',
      'Play it, record it, and let it become part of your voice.',
      'Reach out any time you need support, guidance, or care advice.',
    ],
    shippingCarrier,
    trackingNumber,
    finalNote,
    isAdmin,
  };
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
   STORY HELPERS
   ========================================================= */

function toSentenceCaseLabel(value = '') {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTextArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value)
    .split(/\n|•|;|\|/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getStageSpecificText(project, stageKey, keys = []) {
  if (!stageKey || !Array.isArray(keys)) return '';

  const canonical = canonicalKeyForStage(stageKey);
  const phaseKey = getExistingPhaseKey(project, canonical);

  const staticStageStoryBucket = PROJECT_STAGE_STORY?.[stageKey] || {};
  const projectStageStoryBucket = project?.stageStory?.[stageKey] || {};
  const stageBucket = project?.[stageKey] || {};
  const phaseBucket = project?.[phaseKey] || {};
  const storytellingBucket = project?.storytelling || {};
  const artistBucket = project?.artistDirection || {};
  const craftsmanBucket = project?.craftsmanDirection || {};

  const buckets = [
    projectStageStoryBucket,
    staticStageStoryBucket,
    stageBucket,
    phaseBucket,
    storytellingBucket,
    artistBucket,
    craftsmanBucket,
    project || {},
  ];

  for (const bucket of buckets) {
    for (const key of keys) {
      const value = bucket?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return '';
}

function getStageSpecificArray(project, stageKey, keys = []) {
  if (!stageKey || !Array.isArray(keys)) return [];

  const canonical = canonicalKeyForStage(stageKey);
  const phaseKey = getExistingPhaseKey(project, canonical);

  const staticStageStoryBucket = PROJECT_STAGE_STORY?.[stageKey] || {};
  const projectStageStoryBucket = project?.stageStory?.[stageKey] || {};
  const stageBucket = project?.[stageKey] || {};
  const phaseBucket = project?.[phaseKey] || {};
  const storytellingBucket = project?.storytelling || {};
  const artistBucket = project?.artistDirection || {};
  const craftsmanBucket = project?.craftsmanDirection || {};

  const buckets = [
    projectStageStoryBucket,
    staticStageStoryBucket,
    stageBucket,
    phaseBucket,
    storytellingBucket,
    artistBucket,
    craftsmanBucket,
    project || {},
  ];

  for (const bucket of buckets) {
    for (const key of keys) {
      const normalized = normalizeTextArray(bucket?.[key]);
      if (normalized.length) {
        return normalized;
      }
    }
  }

  return [];
}

function buildNarrativeSentences(step, project) {
  const stageKey = step?.key;
  const currentStageSummary = step?.what || '';
  const why = step?.why || '';
  const mantra = step?.mantra || '';

  const customNarrative = getStageSpecificText(project, stageKey, [
    'chapterNarrative',
    'storyIntro',
    'storySummary',
    'overviewNarrative',
    'narrative',
  ]);

  if (customNarrative) {
    return customNarrative
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  const chapterName = step?.label || 'This chapter';

  const sentenceOne =
    chapterName === 'Discovery & Design'
      ? 'This chapter defines the identity of the instrument before a single permanent move is made.'
      : 'This chapter moves the instrument deeper into its identity through intentional craft decisions.';

  const sentenceTwo = currentStageSummary
    ? currentStageSummary.endsWith('.')
      ? currentStageSummary
      : `${currentStageSummary}.`
    : 'What happens here is carefully chosen to serve the build as a whole.';

  const sentenceThree = why
    ? why.endsWith('.')
      ? why
      : `${why}.`
    : 'Each choice in this stage supports the feel, response, and emotional character of the final drum.';

  const sentenceFour = mantra
    ? mantra.endsWith('.')
      ? mantra
      : `${mantra}.`
    : 'This is where intention and execution begin to sound like the same thing.';

  return [sentenceOne, sentenceTwo, sentenceThree, sentenceFour].filter(
    Boolean
  );
}

function getChapterNarrative(step, project) {
  const sentences = buildNarrativeSentences(step, project);
  return {
    title: 'Chapter Story',
    summary: sentences.join(' '),
    sentences,
  };
}

function getArtistDirectionData(step, project) {
  const stageKey = step?.key;
  const influences = getStageSpecificArray(project, stageKey, [
    'artistInfluences',
    'influences',
    'referenceArtists',
    'referenceRecords',
    'records',
    'genres',
  ]);

  const emotionalTargets = getStageSpecificArray(project, stageKey, [
    'artistEmotionalTargets',
    'emotionalTargets',
    'feelTargets',
    'toneTargets',
    'desiredTraits',
  ]);

  const useCases = getStageSpecificArray(project, stageKey, [
    'artistUseCases',
    'useCases',
    'applications',
    'playingContexts',
  ]);

  const intent =
    getStageSpecificText(project, stageKey, [
      'artistIntent',
      'intent',
      'artistDirectionSummary',
      'artistSummary',
      'directionSummary',
    ]) ||
    'This chapter clarifies what the artist is truly chasing in the instrument — not just specs, but response, attitude, and emotional pull.';

  const listeningFor =
    getStageSpecificText(project, stageKey, [
      'listeningFor',
      'artistListeningFor',
      'desiredResponse',
      'targetResponse',
    ]) ||
    firstNonEmptyString(step?.why, step?.mantra) ||
    'We are listening for the balance between control, expression, and identity that the artist wants this drum to carry.';

  return {
    title: 'Artist Direction',
    intro: intent,
    sections: [
      {
        label: 'Intent',
        body: intent,
      },
      {
        label: 'Influences',
        items:
          influences.length > 0
            ? influences
            : [
                'The references, records, players, and sounds guiding this chapter will be documented here as the story develops.',
              ],
      },
      {
        label: 'Emotional Target',
        items:
          emotionalTargets.length > 0
            ? emotionalTargets
            : [
                'The goal is to shape the instrument around feel, identity, and emotional response — not just technical outcome.',
              ],
      },
      {
        label: 'How the artist wants it to respond',
        body: listeningFor,
      },
      {
        label: 'Use Case',
        items:
          useCases.length > 0
            ? useCases
            : [
                'This section will reflect where and how the instrument is meant to live — studio, stage, versatility, or a very specific sonic role.',
              ],
      },
    ],
  };
}

function getCraftsmanDirectionData(step, project) {
  const stageKey = step?.key;

  const customChoices = getStageSpecificArray(project, stageKey, [
    'craftsmanChoices',
    'customChoices',
    'customDecisions',
    'adaptations',
  ]);

  const standardFoundations = getStageSpecificArray(project, stageKey, [
    'standardFoundations',
    'standardProcess',
    'foundations',
    'nonNegotiables',
  ]);

  const materialStrategy =
    getStageSpecificText(project, stageKey, [
      'materialStrategy',
      'craftsmanMaterialStrategy',
      'woodStrategy',
      'selectionStrategy',
    ]) ||
    'Material, technique, and restraint are chosen here based on what best serves the instrument rather than what is merely possible.';

  const interpretation =
    getStageSpecificText(project, stageKey, [
      'craftsmanInterpretation',
      'interpretation',
      'craftsmanSummary',
      'buildInterpretation',
    ]) ||
    'This chapter is where the craftsman translates artistic intent into physical decisions, keeping the instrument honest to its purpose while shaping what makes it unique.';

  const chapterSpecificMove =
    getStageSpecificText(project, stageKey, [
      'chapterSpecificMove',
      'chapterSpecificFocus',
      'uniqueFocus',
      'stageSpecificApproach',
    ]) ||
    'What changes in this chapter is not the discipline of the process, but how that discipline is aimed to support this specific drum.';

  return {
    title: 'Craftsman Direction',
    intro: interpretation,
    sections: [
      {
        label: 'Interpretation',
        body: interpretation,
      },
      {
        label: 'Material Strategy',
        body: materialStrategy,
      },
      {
        label: 'What remains foundational',
        items:
          standardFoundations.length > 0
            ? standardFoundations
            : [
                'Core tolerances, structural discipline, and repeatable craftsmanship remain steady through every chapter.',
              ],
      },
      {
        label: 'What is being customized in this chapter',
        items: customChoices.length > 0 ? customChoices : [chapterSpecificMove],
      },
    ],
  };
}

function getBuildNotesSummary(step, project) {
  const stageKey = step?.key;

  const customSummary =
    getStageSpecificText(project, stageKey, [
      'buildNotesSummary',
      'chapterBuildSummary',
      'customBuildSummary',
      'buildSummary',
      'summary',
    ]) || '';

  if (customSummary) {
    return customSummary;
  }

  const artistIntent = getStageSpecificText(project, stageKey, [
    'artistIntent',
    'intent',
    'artistDirectionSummary',
    'artistSummary',
    'directionSummary',
  ]);

  const materialStrategy = getStageSpecificText(project, stageKey, [
    'materialStrategy',
    'craftsmanMaterialStrategy',
    'woodStrategy',
    'selectionStrategy',
  ]);

  const buildVision = getStageSpecificText(project, stageKey, [
    'craftsmanInterpretation',
    'interpretation',
    'craftsmanSummary',
    'buildInterpretation',
  ]);

  const emotionalTargets = getStageSpecificArray(project, stageKey, [
    'artistEmotionalTargets',
    'emotionalTargets',
    'feelTargets',
    'toneTargets',
  ]);

  const useCases = getStageSpecificArray(project, stageKey, [
    'artistUseCases',
    'useCases',
    'applications',
    'playingContexts',
  ]);

  const chapterLabel = step?.label || 'this chapter';

  const parts = [];

  if (artistIntent) {
    parts.push(
      `In ${chapterLabel}, the work is being shaped around a clear player goal: ${artistIntent}`
    );
  } else {
    parts.push(
      `In ${chapterLabel}, the goal is to make decisions that move this instrument closer to its specific identity rather than treating it like a generic build.`
    );
  }

  if (emotionalTargets.length) {
    parts.push(
      `The response we are protecting in this phase centers on ${emotionalTargets
        .slice(0, 4)
        .join(', ')}.`
    );
  }

  if (materialStrategy) {
    parts.push(materialStrategy.endsWith('.') ? materialStrategy : `${materialStrategy}.`);
  }

  if (buildVision) {
    parts.push(buildVision.endsWith('.') ? buildVision : `${buildVision}.`);
  }

  if (useCases.length) {
    parts.push(
      `Everything in this chapter is being filtered through the real use case of ${useCases
        .slice(0, 3)
        .join(', ')}.`
    );
  }

  return parts.join(' ');
}

function getBuildNotesUniquePoints(step, project) {
  const stageKey = step?.key;

  const explicitUniquePoints = getStageSpecificArray(project, stageKey, [
    'buildUniquePoints',
    'uniqueBuildPoints',
    'chapterUniquePoints',
    'uniquePoints',
    'customChoices',
    'customDecisions',
  ]);

  if (explicitUniquePoints.length) {
    return explicitUniquePoints;
  }

  const artistIntent = getStageSpecificText(project, stageKey, [
    'artistIntent',
    'intent',
    'artistDirectionSummary',
    'artistSummary',
  ]);

  const emotionalTargets = getStageSpecificArray(project, stageKey, [
    'artistEmotionalTargets',
    'emotionalTargets',
    'feelTargets',
    'toneTargets',
  ]);

  const customChoices = getStageSpecificArray(project, stageKey, [
    'craftsmanChoices',
    'customChoices',
    'customDecisions',
    'adaptations',
  ]);

  const useCases = getStageSpecificArray(project, stageKey, [
    'artistUseCases',
    'useCases',
    'applications',
    'playingContexts',
  ]);

  const points = [];

  if (artistIntent) {
    points.push(`Build is being guided by this player goal: ${artistIntent}`);
  }

  if (emotionalTargets.length) {
    points.push(
      `Primary feel/response targets: ${emotionalTargets.slice(0, 4).join(', ')}`
    );
  }

  if (customChoices.length) {
    points.push(
      `Chapter-specific custom decisions: ${customChoices.slice(0, 4).join(', ')}`
    );
  }

  if (useCases.length) {
    points.push(
      `This build is being aimed toward these real-world roles: ${useCases
        .slice(0, 3)
        .join(', ')}`
    );
  }

  return points.length
    ? points
    : [
        'This chapter is being shaped around the player rather than a generic recipe.',
        'Custom decisions here are meant to strengthen identity, response, and long-term cohesion.',
        'Each move in this phase is narrowing the instrument toward its specific voice.',
      ];
}

function getBuildNotesVisionData(step, project) {
  const stageKey = step?.key;

  const influences = getStageSpecificArray(project, stageKey, [
    'artistInfluences',
    'influences',
    'referenceArtists',
    'referenceRecords',
    'records',
    'genres',
  ]);

  const materialVision = getStageSpecificText(project, stageKey, [
    'materialStrategy',
    'craftsmanMaterialStrategy',
    'woodStrategy',
    'selectionStrategy',
    'materialVision',
  ]);

  const buildVision = getStageSpecificText(project, stageKey, [
    'craftsmanInterpretation',
    'interpretation',
    'craftsmanSummary',
    'buildInterpretation',
    'buildVision',
  ]);

  const influenceEffect = getStageSpecificText(project, stageKey, [
    'influenceEffect',
    'influencesAffectBuild',
    'howInfluenceAffectsBuild',
    'voiceSummary',
    'voiceNarrative',
    'impactSummary',
  ]);

  return {
    influences:
      influences.length > 0
        ? influences
        : ['Project influences will be surfaced here as this chapter is refined.'],
    materialVision:
      materialVision ||
      'Material choices in this chapter are being narrowed based on what best serves the final voice and physical feel of the drum.',
    buildVision:
      buildVision ||
      'The build approach here is focused on making disciplined decisions that support the specific identity of this instrument.',
    influenceEffect:
      influenceEffect ||
      'These influences are not being copied literally — they are being translated into choices that affect response, balance, feel, and tone.',
  };
}

function getBuildDirectionData(step) {
  return {
    title: 'Build',
    intro:
      step?.what ||
      'This chapter explains what is physically happening in the instrument during this phase of the journey.',
    sections: [
      {
        label: 'What is happening',
        body:
          step?.what ||
          'This section explains what is physically happening in the build during this chapter.',
      },
      {
        label: 'Techniques Used',
        items:
          Array.isArray(step?.techniques) && step.techniques.length
            ? step.techniques
            : ['Techniques for this chapter will appear here.'],
      },
      {
        label: 'Tools Involved',
        items:
          Array.isArray(step?.tools) && step.tools.length
            ? step.tools
            : ['Tools for this chapter will appear here.'],
      },
    ],
  };
}

function getVoiceDirectionData(step, project) {
  const stageKey = step?.key;

  const effects = getStageSpecificArray(project, stageKey, [
    'voiceEffects',
    'affects',
    'sonicEffects',
    'impactCategories',
  ]);

  const mantra =
    getStageSpecificText(project, stageKey, [
      'voiceMantra',
      'mantra',
      'value',
      'guidingPhrase',
    ]) ||
    step?.mantra ||
    'Every choice in this chapter shapes how the instrument speaks back.';

  const summary =
    getStageSpecificText(project, stageKey, [
      'voiceSummary',
      'voiceNarrative',
      'why',
      'impactSummary',
    ]) ||
    step?.why ||
    'This chapter shapes the sound, response, feel, and identity of the instrument in ways that continue to build on everything that came before it.';

  return {
    title: 'Voice',
    intro: summary,
    sections: [
      {
        label: 'Why this chapter matters',
        body: summary,
      },
      {
        label: 'What this affects',
        items:
          effects.length > 0
            ? effects
            : ['Sound', 'Feel', 'Response', 'Identity'],
      },
      {
        label: 'Guiding line',
        body: mantra,
      },
    ],
  };
}

function getArchiveDirectionData(step, project) {
  const stageNumber = STAGE_MEDIA?.[step?.key]?.stageNumber || 0;
  const stageResources = getStageResourceItems(project, stageNumber);

  const summaryBits = [];

  if (stageResources.items.length) {
    summaryBits.push(
      `${stageResources.items.length} chapter artifact${
        stageResources.items.length === 1 ? '' : 's'
      } currently available`
    );
  }

  if (stageResources.signatureLink) {
    summaryBits.push('signature item available');
  }

  if (stageResources.paymentLink) {
    summaryBits.push('payment item available');
  }

  return {
    title: 'Archive',
    intro:
      summaryBits.length > 0
        ? summaryBits.join(' • ')
        : 'Documents, links, approvals, media, and chapter artifacts will appear here as they are added.',
    stageResources,
  };
}

function slugifyArchivePart(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getArchiveMediaTypeFromFile(file) {
  if (!file) return 'other';

  const mime = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('sheet') ||
    mime.includes('text')
  ) {
    return 'document';
  }

  if (/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(name)) return 'image';
  if (/\.(mp4|mov|webm|m4v)$/i.test(name)) return 'video';
  if (/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) return 'audio';
  if (/\.(pdf|doc|docx|xls|xlsx|txt|rtf)$/i.test(name)) return 'document';

  return 'other';
}

function getArchiveVisibilityLabel(visibility) {
  if (visibility === ARCHIVE_VISIBILITY.PUBLIC) return 'Public';
  if (visibility === ARCHIVE_VISIBILITY.ADMIN) return 'Admin only';
  return 'Admin + Customer';
}

function getProjectArchiveItems(project, stageKey) {
  if (!project || !stageKey) return [];

  const stageNumber = STAGE_MEDIA?.[stageKey]?.stageNumber || 0;
  const items = [];

  const normalizeArchiveItem = (item, fallbackId) => {
    const inferredType = getArchiveMediaTypeFromFile({
      name:
        item?.originalFileName ||
        item?.fileName ||
        item?.title ||
        item?.url ||
        '',
      type: item?.mimeType || item?.contentType || '',
    });

    const resolvedType =
      item?.mediaType ||
      item?.type ||
      (inferredType !== 'other'
        ? inferredType
        : getFileTypeFromUrl(item?.url, item?.type));

    return {
      ...item,
      id: item?.id || fallbackId,
      mediaType: resolvedType,
      type: resolvedType,
      visibility: item?.visibility || ARCHIVE_VISIBILITY.ADMIN,
      captureKey: item?.captureKey || '',
      isSuggestedCapture: !!item?.captureKey,
      stageKey: item?.stageKey || stageKey,
      title:
        item?.title ||
        item?.name ||
        item?.originalFileName ||
        item?.fileName ||
        getFileNameFromUrl(item?.url),
      originalFileName:
        item?.originalFileName ||
        item?.fileName ||
        getFileNameFromUrl(item?.url),
    };
  };

  const mediaItems = Array.isArray(project?.media) ? project.media : [];
  mediaItems.forEach((item, index) => {
    if (!item?.url) return;
    if (item.stageKey && item.stageKey !== stageKey) return;
    if (!item.stageKey && Number(item.stage || 0) !== Number(stageNumber))
      return;

    items.push(normalizeArchiveItem(item, `media-${stageKey}-${index}`));
  });

  const attachmentGroups =
    project?.attachments && typeof project.attachments === 'object'
      ? project.attachments
      : {};

  Object.entries(attachmentGroups).forEach(([bucketKey, arr]) => {
    if (!Array.isArray(arr)) return;

    arr.forEach((item, index) => {
      if (!item?.url) return;
      if (item.stageKey && item.stageKey !== stageKey) return;
      if (!item.stageKey && Number(item.stage || 0) !== Number(stageNumber))
        return;

      items.push(
        normalizeArchiveItem(
          item,
          `attachment-${bucketKey}-${stageKey}-${index}`
        )
      );
    });
  });

  const stageArchiveGroups =
    project?.stageArchive && typeof project.stageArchive === 'object'
      ? project.stageArchive
      : {};

  const stageArchiveItems = Array.isArray(stageArchiveGroups?.[stageKey])
    ? stageArchiveGroups[stageKey]
    : [];

  stageArchiveItems.forEach((item, index) => {
    if (!item?.url) return;

    items.push(
      normalizeArchiveItem(item, `stage-archive-${stageKey}-${index}`)
    );
  });

  items.sort((a, b) => {
    const aTime = tsToMillis(a.uploadedAt || a.createdAt);
    const bTime = tsToMillis(b.uploadedAt || b.createdAt);
    return bTime - aTime;
  });

  return items;
}

function getStorypointsForStep(step, project = null) {
  if (!step) return [];

  const chapterNarrative = getChapterNarrative(step, project);
  const artistDirection = getArtistDirectionData(step, project);
  const craftsmanDirection = getCraftsmanDirectionData(step, project);
  const archiveDirection = getArchiveDirectionData(step, project);

  return [
    {
      id: 'overview',
      icon: 'overview',
      shortLabel: 'Overview',
      title: chapterNarrative.title,
      body: chapterNarrative.summary,
      data: chapterNarrative,
    },
    {
      id: 'build-notes',
      icon: 'craftsmanDirection',
      shortLabel: 'Build Notes',
      title: 'Build Notes',
      body: 'Artist needs and craftsman direction for this chapter.',
      data: {
        artistDirection,
        craftsmanDirection,
      },
    },
    {
      id: 'archive',
      icon: 'archive',
      shortLabel: 'Archive',
      title: archiveDirection.title,
      body: archiveDirection.intro,
      data: archiveDirection,
    },
  ];
}

function getChapterProgressData(step, project) {
  if (!step || !project) {
    return {
      status: 'Not Started',
      completionPct: 0,
      completedCheckpoints: 0,
      totalCheckpoints: 0,
      currentSubStep: 'No sub-step selected',
      estHours: '—',
      avgDays: '—',
      targetDate: 'TBD',
    };
  }

  const statusSummary = getStepStatus(project, step);
  const totalCheckpoints = Number(statusSummary?.total || 0);
  const completedCheckpoints = Number(statusSummary?.done || 0);

  const completionPct =
    totalCheckpoints > 0
      ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
      : 0;

  const canonical = canonicalKeyForStage(step.key);
  const phaseKey = getExistingPhaseKey(project, canonical);
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  const tpl = STAGE_TEMPLATES?.[step.key];
  const tplSteps = Array.isArray(tpl?.steps) ? tpl.steps : [];

  const selectedStageIndex = STEPS.findIndex((s) => s.key === step.key);
  const liveStageIndex = getCurrentStepIndex(project);
  const selectedStageState = getSelectedStageMediaState(
    selectedStageIndex,
    liveStageIndex
  );
  const isSelectedStageLive = selectedStageState === STAGE_MEDIA_STATE.CURRENT;
  const isSelectedStageCompleted =
    selectedStageState === STAGE_MEDIA_STATE.COMPLETED;

  let currentSubStep = 'No sub-step selected';

  if (isSelectedStageCompleted) {
    if (tplSteps.length > 0) {
      const lastStep = tplSteps[tplSteps.length - 1];
      currentSubStep =
        lastStep?.adminMainTitle ||
        lastStep?.label ||
        lastStep?.adminLeftShort ||
        `Step ${tplSteps.length}`;
    }
  } else if (isSelectedStageLive) {
    for (let i = 0; i < tplSteps.length; i += 1) {
      const tplStep = tplSteps[i];
      const item = checklist[i] || {};
      const checkpointStates = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];

      const checkpointCount = Array.isArray(tplStep?.checkpoints)
        ? tplStep.checkpoints.length
        : 0;

      const checkpointDone = checkpointStates.filter(Boolean).length;
      const isComplete =
        checkpointCount > 0
          ? checkpointDone === checkpointCount
          : !!item.completed;

      if (!isComplete) {
        currentSubStep =
          tplStep?.adminMainTitle ||
          tplStep?.label ||
          tplStep?.adminLeftShort ||
          `Step ${i + 1}`;
        break;
      }
    }

    if (
      currentSubStep === 'No sub-step selected' &&
      tplSteps.length > 0 &&
      completedCheckpoints === totalCheckpoints &&
      totalCheckpoints > 0
    ) {
      const lastStep = tplSteps[tplSteps.length - 1];
      currentSubStep =
        lastStep?.adminMainTitle ||
        lastStep?.label ||
        lastStep?.adminLeftShort ||
        `Step ${tplSteps.length}`;
    }
  } else {
    const firstStep = tplSteps[0];
    currentSubStep =
      firstStep?.adminMainTitle ||
      firstStep?.label ||
      firstStep?.adminLeftShort ||
      'Awaiting unlock';
  }

  const targetDate = getStageTargetDate(project, step.key) || 'TBD';

  return {
    status: isSelectedStageCompleted
      ? 'Completed'
      : isSelectedStageLive
        ? statusSummary?.status || 'Not Started'
        : selectedStageState === STAGE_MEDIA_STATE.NEXT
          ? 'Up Next'
          : 'Locked',
    completionPct:
      isSelectedStageLive || isSelectedStageCompleted ? completionPct : 0,
    completedCheckpoints:
      isSelectedStageLive || isSelectedStageCompleted
        ? completedCheckpoints
        : 0,
    totalCheckpoints,
    currentSubStep,
    estHours: step.estHours || '—',
    avgDays: step.avgDays || '—',
    targetDate,
  };
}

function getCheckpointStepStatus(item = {}, tplStep = {}) {
  const checkpointStates = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : [];

  const checkpointCount = Array.isArray(tplStep?.checkpoints)
    ? tplStep.checkpoints.length
    : 0;

  const checkpointDone = checkpointStates.filter(Boolean).length;

  const isComplete =
    checkpointCount > 0 ? checkpointDone === checkpointCount : !!item.completed;

  const isStarted =
    checkpointDone > 0 ||
    !!item.completed ||
    Number(item.totalSeconds || 0) > 0;

  const status = isComplete
    ? 'completed'
    : isStarted
      ? 'in_progress'
      : 'upcoming';

  return {
    status,
    done: checkpointDone,
    total: checkpointCount,
    isComplete,
    isStarted,
  };
}

function getChapterCheckpointTimeline(step, project) {
  if (!step || !project) return [];

  const canonical = canonicalKeyForStage(step.key);
  const phaseKey = getExistingPhaseKey(project, canonical);
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  const tpl = STAGE_TEMPLATES?.[step.key];
  const tplSteps = Array.isArray(tpl?.steps) ? tpl.steps : [];

  const selectedStageIndex = STEPS.findIndex((s) => s.key === step.key);
  const liveStageIndex = getCurrentStepIndex(project);
  const selectedStageState = getSelectedStageMediaState(
    selectedStageIndex,
    liveStageIndex
  );
  const isSelectedStageLive = selectedStageState === STAGE_MEDIA_STATE.CURRENT;
  const isSelectedStageCompleted =
    selectedStageState === STAGE_MEDIA_STATE.COMPLETED;

  return tplSteps.map((tplStep, index) => {
    const item = checklist[index] || {};
    const checkpointStates = Array.isArray(item.checkpointStates)
      ? item.checkpointStates
      : [];

    const checkpointCount = Array.isArray(tplStep?.checkpoints)
      ? tplStep.checkpoints.length
      : 0;

    const checkpointDone = checkpointStates.filter(Boolean).length;
    const isComplete =
      checkpointCount > 0
        ? checkpointDone === checkpointCount
        : !!item.completed;

    let status = 'upcoming';

    if (isSelectedStageCompleted) {
      status = 'completed';
    } else if (isSelectedStageLive) {
      const isStarted =
        checkpointDone > 0 ||
        !!item.completed ||
        Number(item.totalSeconds || 0) > 0;

      status = isComplete
        ? 'completed'
        : isStarted
          ? 'in_progress'
          : 'upcoming';
    }

    const firstCheckpoint = Array.isArray(tplStep?.checkpoints)
      ? tplStep.checkpoints[0]
      : null;

    const description =
      firstCheckpoint?.details?.[0] ||
      firstCheckpoint?.ui ||
      'Checkpoint details will appear here.';

    return {
      id: tplStep?.id || `${step.key}-timeline-${index}`,
      label:
        tplStep?.adminMainTitle ||
        tplStep?.label ||
        tplStep?.adminLeftShort ||
        `Step ${index + 1}`,
      description,
      status,
      done:
        isSelectedStageLive || isSelectedStageCompleted ? checkpointDone : 0,
      total: checkpointCount,
    };
  });
}

function renderStorypointSections(data) {
  if (!data?.sections?.length) return null;

  return (
    <div className="sl-progress-stage-storypoint-data-grid">
      {data.sections.map((section, index) => {
        const isFull = !!section.body && !section.items?.length;

        return (
          <div
            key={`${section.label}-${index}`}
            className={`sl-progress-stage-storypoint-data-card ${
              isFull ? 'sl-progress-stage-storypoint-data-card--full' : ''
            }`}
          >
            <div className="sl-progress-stage-storypoint-data-label">
              {section.label}
            </div>

            {section.body ? (
              <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
                {section.body}
              </div>
            ) : null}

            {section.items?.length ? (
              <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--stack">
                {section.items.map((item, itemIndex) => (
                  <span
                    key={`${section.label}-${item}-${itemIndex}`}
                    className="sl-progress-stage-storypoint-tag"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function renderActiveStorySection({
  activeStorypoint,
  chapterNarrative,
  currentChapterProgressData,
  activeStep,
  project,
  setProject,
  isAdmin,
  activeStageArchiveDefinition,
  activeStageArchiveItems,
  selectedArchiveCaptureKey,
  setSelectedArchiveCaptureKey,
  selectedArchiveCapture,
  archiveUploading,
  archiveUploadProgress,
  openArchiveFilePicker,
  getArchiveVisibilityLabel,
  setSelectedResourceItem,
}) {
  if (!activeStorypoint) return null;

  if (activeStorypoint.id === 'overview') {
    return (
      <>
        <div className="sl-progress-story-section-intro-card">
          <div className="sl-progress-story-section-label">
            Chapter Overview
          </div>
          <div className="sl-progress-story-section-body">
            {chapterNarrative.summary}
          </div>
        </div>

<div className="sl-progress-storypoint-progress-grid">
  <div className="sl-progress-storypoint-stat">
    <div className="sl-progress-storypoint-stat-label">
      Chapter completion
    </div>
    <div className="sl-progress-storypoint-stat-value">
      {currentChapterProgressData.completionPct}%
    </div>
  </div>

  <div className="sl-progress-storypoint-stat">
    <div className="sl-progress-storypoint-stat-label">
      Target chapter completion
    </div>
    <div className="sl-progress-storypoint-stat-value">
      {currentChapterProgressData.targetDate}
    </div>
  </div>

  <div className="sl-progress-storypoint-stat">
    <div className="sl-progress-storypoint-stat-label">
      Estimated working hours
    </div>
    <div className="sl-progress-storypoint-stat-value">
      {currentChapterProgressData.estHours}
    </div>
  </div>
</div>

        <div className="sl-progress-story-section-block sl-progress-story-section-block--spaced">
          <div className="sl-progress-story-section-label">
            Chapter Checklist
          </div>

          <StageCheckpointsPanel
            key={`progress-inline-${activeStep.key}-${isAdmin ? 'admin' : 'customer'}`}
            project={project}
            setProject={setProject}
            stageKey={activeStep.key}
            isAdmin={isAdmin}
            variant="compact"
            showHeader={false}
          />
        </div>
      </>
    );
  }

if (activeStorypoint.id === 'build-notes') {
  const buildNotesSummary = getBuildNotesSummary(activeStep, project);
  const uniquePoints = getBuildNotesUniquePoints(activeStep, project);
  const visionData = getBuildNotesVisionData(activeStep, project);

  return (
    <div className="sl-progress-build-notes-stack">
      <div className="sl-progress-story-section-intro-card sl-progress-story-section-intro-card--lighter sl-progress-story-section-intro-card--summary">
        <div className="sl-progress-story-section-label">
          Personalized Chapter Summary
        </div>
        <div className="sl-progress-story-section-body">
          {buildNotesSummary}
        </div>
      </div>

      <div className="sl-progress-story-section-intro-card sl-progress-story-section-intro-card--lighter">
        <div className="sl-progress-story-section-label">
          What Makes This Build Unique In This Chapter
        </div>

        <ul className="sl-progress-build-notes-bullets">
          {uniquePoints.map((point, index) => (
            <li key={`${point}-${index}`}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="sl-progress-story-section-intro-card sl-progress-story-section-intro-card--lighter">
        <div className="sl-progress-story-section-label">
          Influences + Build / Material Vision
        </div>

        <div className="sl-progress-build-notes-vision-grid">
          <div className="sl-progress-stage-storypoint-data-card">
            <div className="sl-progress-stage-storypoint-data-label">
              Influences
            </div>
            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--stack">
              {visionData.influences.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="sl-progress-stage-storypoint-tag"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
            <div className="sl-progress-stage-storypoint-data-label">
              Build Vision
            </div>
            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
              {visionData.buildVision}
            </div>
          </div>

          <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
            <div className="sl-progress-stage-storypoint-data-label">
              Material Vision
            </div>
            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
              {visionData.materialVision}
            </div>
          </div>

          <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
            <div className="sl-progress-stage-storypoint-data-label">
              How The Influences Affect The Build Approach
            </div>
            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
              {visionData.influenceEffect}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  if (activeStorypoint.id === 'archive') {
    return (
      <div className="sl-progress-story-section-block">
        {isAdmin && activeStageArchiveDefinition ? (
          <>
            <div className="sl-progress-stage-archive-admin-controls">
              <div className="sl-progress-stage-storypoint-data-label">
                Add archive item
              </div>

              <select
                className="sl-progress-stage-archive-select"
                value={selectedArchiveCaptureKey}
                onChange={(e) => setSelectedArchiveCaptureKey(e.target.value)}
              >
                <option value="">Choose a suggested capture…</option>

                {activeStageArchiveDefinition.suggestedCaptures.map(
                  (capture) => (
                    <option key={capture.key} value={capture.key}>
                      {capture.shortLabel || capture.label}
                    </option>
                  )
                )}

                <option value="other">Other / custom upload</option>
              </select>

              {selectedArchiveCapture ? (
                <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
                  <div className="sl-progress-stage-storypoint-data-label">
                    Suggested capture details
                  </div>
                  <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
                    <strong>{selectedArchiveCapture.label}</strong>
                    <br />
                    {selectedArchiveCapture.purpose}
                    <br />
                    Visibility:{' '}
                    {getArchiveVisibilityLabel(
                      selectedArchiveCapture.visibility
                    )}
                    {selectedArchiveCapture.angle ? (
                      <>
                        <br />
                        Angle: {selectedArchiveCapture.angle}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                className={`sl-progress-stage-edu-resource-link sl-progress-stage-upload-trigger is-primary ${
                  archiveUploading || !selectedArchiveCaptureKey
                    ? 'is-disabled'
                    : ''
                }`}
                onClick={() => {
                  if (archiveUploading || !selectedArchiveCaptureKey) return;
                  openArchiveFilePicker();
                }}
                disabled={archiveUploading || !selectedArchiveCaptureKey}
              >
                {archiveUploading
                  ? `Uploading… ${archiveUploadProgress}%`
                  : 'Upload archive item'}
              </button>
            </div>
          </>
        ) : null}

        {activeStageArchiveItems.length ? (
          <div className="sl-progress-stage-edu-resource-grid">
            {activeStageArchiveItems.map((item, index) => {
              const itemType =
                item.mediaType ||
                item.type ||
                getFileTypeFromUrl(item.url, item.type);
              const isImage = itemType === 'image';
              const isVideo = itemType === 'video';

              return (
                <button
                  key={item.id || `${item.url}-${index}`}
                  type="button"
                  className={`sl-progress-stage-edu-resource-card is-${itemType}`}
                  onClick={() =>
                    setSelectedResourceItem({ ...item, type: itemType })
                  }
                >
                  <div className="sl-progress-stage-edu-resource-thumb">
                    {isImage ? (
                      <img
                        src={item.url}
                        alt={item.title || `Archive item ${index + 1}`}
                        className="sl-progress-stage-edu-resource-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="sl-progress-stage-edu-resource-filetype">
                        {isVideo
                          ? 'VIDEO'
                          : itemType === 'audio'
                            ? 'AUDIO'
                            : itemType === 'document'
                              ? 'DOC'
                              : 'FILE'}
                      </div>
                    )}
                  </div>

                  <div className="sl-progress-stage-edu-resource-meta">
                    <div className="sl-progress-stage-edu-resource-title">
                      {item.title || `Archive item ${index + 1}`}
                    </div>
                    <div className="sl-progress-stage-edu-resource-subtitle">
                      {formatResourceTypeLabel(itemType)} •{' '}
                      {getArchiveVisibilityLabel(item.visibility)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="sl-progress-stage-edu-resource-empty">
            No archival chapter items yet.
          </div>
        )}
      </div>
    );
  }

  return null;
}

/* =========================================================
   STAGE CHECKPOINTS PANEL
   ========================================================= */

const StageCheckpointsPanel = ({
  project,
  setProject,
  stageKey,
  isAdmin = false,
  variant = 'default',
  showHeader = true,
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

        const localPhaseKey = getExistingPhaseKey(prev, canonical);
        const prevPhase = prev?.[localPhaseKey] || {};
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

    const total = states.length;
    const done = states.filter(Boolean).length;
    const isFullyComplete = total > 0 && done === total;

    if (!isFullyComplete) return;

    const mins = Math.max(0, Number(durationMinutes || 0));
    const secs = mins * 60;

    checklist[stepIdx] = {
      ...stepItem,
      checkpointStates: states,
      completed: true,
      durationMinutes: mins,
      totalSeconds: secs,
    };

    if (typeof setProject === 'function') {
      setProject((prev) => {
        if (!prev) return prev;

        const localPhaseKey = getExistingPhaseKey(prev, canonical);
        const prevPhase = prev?.[localPhaseKey] || {};
        const prevChecklist = Array.isArray(prevPhase.checklist)
          ? [...prevPhase.checklist]
          : [];

        while (prevChecklist.length <= stepIdx) {
          prevChecklist.push({
            checkpointStates: [],
            completed: false,
            durationMinutes: 0,
            totalSeconds: 0,
          });
        }

        prevChecklist[stepIdx] = {
          ...(prevChecklist[stepIdx] || {}),
          checkpointStates: states,
          completed: true,
          durationMinutes: mins,
          totalSeconds: secs,
        };

        return {
          ...prev,
          [canonical]: {
            ...prevPhase,
            checklist: prevChecklist,
          },
        };
      });
    }

    await updateDoc(ref, {
      [canonical]: {
        ...phase,
        checklist,
      },
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
    <div
      className={[
        'pp-stage-card',
        variant === 'compact' ? 'pp-stage-card--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showHeader && variant !== 'compact' && (
        <div className="pp-stage-card-header">
          <div>
            <div className="pp-section-eyebrow">Build Checkpoints</div>
            <h4 className="pp-section-title">Internal checkpoints</h4>
          </div>
        </div>
      )}

      {variant === 'compact' ? (
        <div className="pp-compact-list">
          {normalizedSteps.map((step, stepIdx) => {
            const { total, done, status } = step;
            const isOpen = openStepId === step.id;
            const canLogDuration = isAdmin && total > 0 && done === total;
            const hasLoggedDuration = (step.durationMinutes || 0) > 0;

            const compactStatusClass =
              status === 'COMPLETED'
                ? 'is-completed'
                : status === 'IN PROGRESS'
                  ? 'is-in-progress'
                  : 'is-upcoming';

            const statusLabel =
              status === 'COMPLETED'
                ? 'Completed'
                : status === 'IN PROGRESS'
                  ? 'In progress'
                  : 'Upcoming';

            return (
              <div
                key={step.id}
                className={`pp-compact-row ${compactStatusClass}`}
              >
                <div className="pp-compact-marker-rail">
                  {isAdmin ? (
                    <button
                      type="button"
                      className={`pp-compact-marker ${compactStatusClass}`}
                      onClick={() => toggleStep(step.id)}
                      aria-label={step.label}
                    >
                      {status === 'COMPLETED' ? '✓' : ''}
                    </button>
                  ) : (
                    <span
                      className={`pp-compact-marker ${compactStatusClass}`}
                      aria-hidden="true"
                    >
                      {status === 'COMPLETED' ? '✓' : ''}
                    </span>
                  )}

                  <span className="pp-compact-line" aria-hidden="true" />
                </div>

                <div className="pp-compact-copy">
                  <div className="pp-compact-title-row">
                    <div className="pp-compact-title-wrap">
                      <div className="pp-compact-title">{step.label}</div>

                      {isAdmin ? (
                        <div className="pp-compact-desc">
                          {step.checkpoints?.[0]?.details?.[0] ||
                            step.checkpoints?.[0]?.label ||
                            'Checkpoint details will appear here.'}
                        </div>
                      ) : null}
                    </div>

                    <div className="pp-compact-right">
                      {isAdmin ? (
                        <button
                          type="button"
                          className={`pp-compact-chevron ${isOpen ? 'open' : ''}`}
                          onClick={() => toggleStep(step.id)}
                          aria-label={isOpen ? 'Collapse step' : 'Expand step'}
                        >
                          ▾
                        </button>
                      ) : (
                        <span
                          className="pp-compact-chevron pp-compact-chevron--placeholder"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>

                  <div className="pp-compact-meta-row">
                    <div className={`pp-compact-status ${compactStatusClass}`}>
                      {statusLabel}
                    </div>

                    {isAdmin && total > 0 && done < total && (
                      <button
                        type="button"
                        className="pp-step-markall-btn"
                        onClick={() => handleMarkAllComplete({ stepIdx })}
                      >
                        Mark all complete
                      </button>
                    )}

                    {isAdmin && canLogDuration && (
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
                            onClick={() => openDurationModal({ stepIdx })}
                          >
                            Log duration
                          </button>
                        )}
                      </span>
                    )}
                  </div>

                  {isAdmin && isOpen && (
                    <div className="pp-compact-checkpoint-list">
                      {step.checkpoints.map((cp, cpIdx) => (
                        <div key={cp.id} className="pp-compact-checkpoint-row">
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
                              {String(
                                (step.durationMinutes || 0) % 60
                              ).padStart(2, '0')}
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
      )}

      {isAdmin &&
        durationModalOpen &&
        createPortal(
          <div
            className="slp-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target.classList.contains('slp-modal-overlay')) {
                closeDurationModal();
              }
            }}
          >
            <div className="slp-modal slp-duration-modal">
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
          </div>,
          document.body
        )}
    </div>
  );
};

function renderStorypointIcon(iconKey) {
  switch (iconKey) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M4.5 7.5h15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M4.5 12h10.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M4.5 16.5h8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.72"
          />
        </svg>
      );

    case 'artistDirection':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M12 4.8c2.9 0 5.2 2.1 5.2 4.8S14.9 14.4 12 14.4 6.8 12.3 6.8 9.6 9.1 4.8 12 4.8Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5.6 19.4c1.2-2.3 3.6-3.6 6.4-3.6s5.2 1.3 6.4 3.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16.7 6.3 19.4 4.7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'craftsmanDirection':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M14.8 5.2a3.2 3.2 0 0 0 4 4l-6.8 6.8-2-2 6.8-6.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8.4 14.4 5 17.8a1.6 1.6 0 1 0 2.2 2.2l3.4-3.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'build':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M6 18 18 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M8.5 6H18v9.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'voice':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M4 13c1.6-3.2 3.2-3.2 4.8 0s3.2 3.2 4.8 0 3.2-3.2 4.8 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 9.5c1.6-3.2 3.2-3.2 4.8 0s3.2 3.2 4.8 0 3.2-3.2 4.8 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      );

    case 'archive':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M5 7.5h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-11Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M4 7.5h16V5.8a1.3 1.3 0 0 0-1.3-1.3H5.3A1.3 1.3 0 0 0 4 5.8v1.7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 12h6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <circle
            cx="12"
            cy="12"
            r="7"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
  }
}

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
    return {
      stageLabel: 'Chapter I — Not started',
      stepLabel: 'No step selected',
    };
  }

  const stageIndex = getCurrentStepIndex(project);
  const stageDef = STEPS[stageIndex] || STEPS[0];
  const stageLabel = `Chapter ${toRomanChapter(stageIndex + 1)} • ${stageDef.label}`;

  const tpl = STAGE_TEMPLATES?.[stageDef.key];
  const stepsArr = Array.isArray(tpl?.steps) ? tpl.steps : [];
  const totalSteps = stepsArr.length;

  let activeStepIdx = 0;

  const overallPct = getOverallProgress(project);
  const activePtr = overallPct < 100 ? getGlobalActiveSubStep(project) : null;

  if (
    activePtr?.stageKey === stageDef.key &&
    Number.isInteger(activePtr.stepIdx)
  ) {
    activeStepIdx = activePtr.stepIdx;
  } else {
    const canonical = canonicalKeyForStage(stageDef.key);
    const phaseKey = getExistingPhaseKey(project, canonical);
    const fallbackIdx = getActiveStepIndexForPhase(project, phaseKey);

    if (fallbackIdx >= 0) {
      activeStepIdx = fallbackIdx;
    } else if (totalSteps > 0) {
      activeStepIdx = totalSteps - 1;
    }
  }

  const activeStepDef = stepsArr[activeStepIdx];
  const activeStepName = activeStepDef
    ? getTemplateStepDisplayLabel(activeStepDef)
    : 'No step selected';

  const stepLabel =
    totalSteps > 0
      ? `Step ${activeStepIdx + 1} of ${totalSteps} • ${activeStepName}`
      : activeStepName;

  return { stageLabel, stepLabel };
}

function StageResourceViewerModal({
  item,
  onClose,
  isAdmin = false,
  archiveEditorTitle = '',
  setArchiveEditorTitle,
  archiveEditorVisibility = ARCHIVE_VISIBILITY.ADMIN,
  setArchiveEditorVisibility,
  archiveEditorBusy = false,
  onSaveMeta,
  onDelete,
}) {
  useEffect(() => {
    if (!item) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const resolvedType =
    item.mediaType || item.type || getFileTypeFromUrl(item.url, item.type);

  const embedUrl = resolvedType === 'video' ? getVideoEmbedUrl(item.url) : null;
  const isImage = resolvedType === 'image';
  const isVideo = resolvedType === 'video';
  const isAudio = resolvedType === 'audio';
  const isPdf = resolvedType === 'document' && isPdfUrl(item.url);

  return (
    <div
      className="sl-resource-viewer-modal"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target.classList.contains('sl-resource-viewer-modal')) {
          onClose?.();
        }
      }}
    >
      <div className="sl-resource-viewer-modal-inner">
        <div className="sl-resource-viewer-modal-top">
          <div className="sl-resource-viewer-modal-meta">
            <div className="sl-resource-viewer-modal-kicker">
              {formatResourceTypeLabel(resolvedType)}
            </div>
            <div className="sl-resource-viewer-modal-title">
              {item.title || 'Stage resource'}
            </div>
            <div className="sl-resource-viewer-modal-subtitle">
              {item.category
                ? String(item.category).replace(/_/g, ' ')
                : 'Stage resource'}
            </div>
          </div>

          <div className="sl-resource-viewer-modal-actions">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="sl-resource-viewer-modal-btn"
            >
              Open
            </a>

            <button
              type="button"
              className="sl-resource-viewer-modal-btn sl-resource-viewer-modal-btn--close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="sl-resource-viewer-modal-body">
          {isImage ? (
            <div className="sl-resource-viewer-modal-image-wrap">
              <img
                src={item.url}
                alt={item.title || 'Stage resource'}
                className="sl-resource-viewer-modal-image"
              />
            </div>
          ) : null}

          {isVideo ? (
            <div className="sl-resource-viewer-modal-video-wrap">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={item.title || 'Stage video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="sl-resource-viewer-modal-video"
                />
              )}
            </div>
          ) : null}

          {isAudio ? (
            <div className="sl-resource-viewer-modal-audio-wrap">
              <div className="sl-resource-viewer-modal-audio-card">
                <div className="sl-resource-viewer-modal-audio-label">
                  Audio preview
                </div>
                <audio controls src={item.url} style={{ width: '100%' }} />
              </div>
            </div>
          ) : null}

          {resolvedType === 'document' ? (
            <div className="sl-resource-viewer-modal-doc-wrap">
              {isPdf ? (
                <iframe
                  title={item.title || 'Stage document'}
                  src={item.url}
                  className="sl-resource-viewer-modal-pdf"
                />
              ) : (
                <div className="sl-resource-viewer-modal-doc-card">
                  <div className="sl-resource-viewer-modal-doc-label">
                    Preview unavailable for this document type.
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="sl-resource-viewer-modal-btn"
                  >
                    Open document
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
        {isAdmin && item ? (
          <div className="sl-resource-viewer-admin-panel">
            <div className="sl-resource-viewer-admin-grid">
              <div className="sl-resource-viewer-admin-field">
                <label className="sl-resource-viewer-admin-label">
                  File name
                </label>
                <input
                  type="text"
                  className="sl-resource-viewer-admin-input"
                  value={archiveEditorTitle}
                  onChange={(e) => setArchiveEditorTitle?.(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>

              <div className="sl-resource-viewer-admin-field">
                <label className="sl-resource-viewer-admin-label">
                  Visibility
                </label>
                <select
                  className="sl-resource-viewer-admin-select"
                  value={archiveEditorVisibility}
                  onChange={(e) => setArchiveEditorVisibility?.(e.target.value)}
                >
                  <option value={ARCHIVE_VISIBILITY.ADMIN}>Admin only</option>
                  <option value={ARCHIVE_VISIBILITY.CUSTOMER}>
                    Admin + artist
                  </option>
                  <option value={ARCHIVE_VISIBILITY.PUBLIC}>Public</option>
                </select>
              </div>
            </div>

            <div className="sl-resource-viewer-admin-actions">
              <button
                type="button"
                className="sl-resource-viewer-modal-btn"
                onClick={onSaveMeta}
                disabled={archiveEditorBusy}
              >
                {archiveEditorBusy ? 'Saving…' : 'Save changes'}
              </button>

              <button
                type="button"
                className="sl-resource-viewer-modal-btn sl-resource-viewer-modal-btn--danger"
                onClick={onDelete}
                disabled={archiveEditorBusy}
              >
                {archiveEditorBusy ? 'Working…' : 'Delete file'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getProjectCoverMediaOptions(project) {
  if (!project) return [];

  const items = [];

  const pushIfValid = (item, source = 'project') => {
    if (!item?.url) return;

    const type = getFileTypeFromUrl(item.url, item.mediaType || item.type);
    if (type !== 'image' && type !== 'video') return;

    items.push({
      id:
        item.id ||
        `${source}-${item.stageKey || item.stage || 'misc'}-${item.url}`,
      url: item.url,
      title:
        item.title ||
        item.shortLabel ||
        item.originalFileName ||
        item.fileName ||
        'Untitled media',
      type,
      source,
      stageKey: item.stageKey || '',
      stage: item.stage || null,
      visibility: item.visibility || '',
      uploadedAt: item.uploadedAt || item.createdAt || '',
    });
  };

  const media = Array.isArray(project.media) ? project.media : [];
  media.forEach((item) => pushIfValid(item, 'media'));

  const stageArchive =
    project.stageArchive && typeof project.stageArchive === 'object'
      ? project.stageArchive
      : {};

  Object.entries(stageArchive).forEach(([stageKey, arr]) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((item) =>
      pushIfValid(
        {
          ...item,
          stageKey: item.stageKey || stageKey,
        },
        'stageArchive'
      )
    );
  });

  items.sort((a, b) => tsToMillis(b.uploadedAt) - tsToMillis(a.uploadedAt));

  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.url}__${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCoverPreviewEmbedUrl(url = '', type = '') {
  const resolvedType = getFileTypeFromUrl(url, type);
  if (resolvedType !== 'video') return null;
  return getVideoEmbedUrl(url);
}

function SoundLegendCoverHero({
  title,
  subtitle,
  mediaUrl,
  mediaType,
  mediaTitle,
  smokeVideoUrl,
  isPreview = false,
  brightness = 0.72,
  saturation = 1.02,
  blackFloor = 0.22,
  smokeOpacity = 0.28,
  positionX = 50,
  scale = 1,
}) {
  const resolvedType = getFileTypeFromUrl(mediaUrl, mediaType);
  const embedUrl =
    resolvedType === 'video'
      ? getCoverPreviewEmbedUrl(mediaUrl, mediaType)
      : null;

  return (
    <div
      className={`sl-progress-soundlegend-cover-hero ${
        isPreview ? 'is-preview' : 'is-live'
      }`}
    >
      <div className="sl-progress-soundlegend-cover-media">
        {mediaUrl ? (
          resolvedType === 'video' ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title="SoundLegend cover media"
                className="sl-progress-soundlegend-cover-asset"
                style={{
                  filter: `brightness(${brightness}) saturate(${saturation})`,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={mediaUrl}
                className="sl-progress-soundlegend-cover-asset"
                style={{
                  filter: `brightness(${brightness}) saturate(${saturation})`,
                }}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            )
          ) : (
            <img
              src={mediaUrl}
              alt={mediaTitle || title || 'SoundLegend cover'}
              className="sl-progress-soundlegend-cover-asset"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${positionX}% 50%`,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                filter: `brightness(${brightness}) saturate(${saturation})`,
              }}
            />
          )
        ) : (
          <div className="sl-progress-soundlegend-cover-empty">
            No cover media selected yet.
          </div>
        )}

        <div
          className="sl-progress-soundlegend-cover-background-crush"
          style={{
            opacity: blackFloor,
          }}
        />

        <div className="sl-progress-soundlegend-cover-dim" />

        {smokeVideoUrl ? (
          <video
            className="sl-progress-soundlegend-cover-smoke"
            src={smokeVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            style={{ opacity: smokeOpacity }}
          />
        ) : null}

        <div className="sl-progress-soundlegend-cover-overlay">
          {isPreview ? (
            <div className="sl-progress-stage-hero-status-caption">
              Revealed
            </div>
          ) : null}

          <div className="sl-progress-stage-title-anchor">
            <div className="sl-progress-hero-title-stack">
              <div className="sl-progress-hero-title sl-progress-hero-title--center is-visible">
                {(title || 'Your SoundLegend Story').toUpperCase()}
              </div>
            </div>

            <div className="sl-progress-stage-title-story">
              {subtitle || 'The completed journey of your custom instrument.'}
            </div>
          </div>
        </div>

        <div className="sl-progress-soundlegend-cover-badge">REVEALED</div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

const ProjectProgress = ({ project: initialProject, isAdmin = false }) => {
  const initialProjectId = useMemo(
    () => getProjectProgressIdentity(initialProject),
    [initialProject]
  );

  const cachedInitialProject = useMemo(() => {
    if (!initialProjectId) return null;
    return initialProject || readProjectProgressCache(initialProject);
  }, [initialProject, initialProjectId]);

  const [project, setProject] = useState(cachedInitialProject || null);
  const [loading, setLoading] = useState(
    !!initialProjectId && !cachedInitialProject
  );
  const [activeKey, setActiveKey] = useState('soundlegendCover');

  const [archiveEditorBusy, setArchiveEditorBusy] = useState(false);
  const [archiveEditorTitle, setArchiveEditorTitle] = useState('');
  const [archiveEditorVisibility, setArchiveEditorVisibility] = useState(
    ARCHIVE_VISIBILITY.ADMIN
  );

  const [revealPanelBusy, setRevealPanelBusy] = useState(false);

  const [revealCoverTitle, setRevealCoverTitle] = useState(
    'Your SoundLegend Story'
  );
  const [revealCoverSubtitle, setRevealCoverSubtitle] = useState(
    'The completed journey of your custom instrument.'
  );
  const [revealCoverMediaUrl, setRevealCoverMediaUrl] = useState('');
  const [revealCoverMediaTitle, setRevealCoverMediaTitle] = useState('');
  const [revealCoverMediaType, setRevealCoverMediaType] = useState('image');

  const [revealChecklist, setRevealChecklist] = useState({
    coverMediaSelected: false,
    chapterMediaReviewed: false,
    visibilityReviewed: false,
    customerStoryApproved: false,
    shipmentConfirmed: false,
    finalReviewComplete: false,
  });

  const DEFAULT_REVEAL_COVER_BRIGHTNESS = 0.72;
  const DEFAULT_REVEAL_COVER_SATURATION = 1.02;
  const DEFAULT_REVEAL_COVER_BLACK_FLOOR = 0.22;
  const DEFAULT_REVEAL_COVER_SMOKE_OPACITY = 0.28;

  const [revealCoverBrightness, setRevealCoverBrightness] = useState(
    DEFAULT_REVEAL_COVER_BRIGHTNESS
  );
  const [revealCoverSaturation, setRevealCoverSaturation] = useState(
    DEFAULT_REVEAL_COVER_SATURATION
  );
  const [revealCoverBlackFloor, setRevealCoverBlackFloor] = useState(
    DEFAULT_REVEAL_COVER_BLACK_FLOOR
  );
  const [revealCoverSmokeOpacity, setRevealCoverSmokeOpacity] = useState(
    DEFAULT_REVEAL_COVER_SMOKE_OPACITY
  );

  const [revealCoverDesktopPositionX, setRevealCoverDesktopPositionX] =
    useState(50);
  const [revealCoverMobilePositionX, setRevealCoverMobilePositionX] =
    useState(50);
  const [revealCoverDesktopScale, setRevealCoverDesktopScale] = useState(1);
  const [revealCoverMobileScale, setRevealCoverMobileScale] = useState(1.15);

  const [legacyShippingStatus, setLegacyShippingStatus] =
    useState('waiting_to_ship');
  const [legacyShippingCarrier, setLegacyShippingCarrier] = useState('');
  const [legacyTrackingNumber, setLegacyTrackingNumber] = useState('');
  const [legacyShippedAt, setLegacyShippedAt] = useState('');
  const [legacyDeliveredAt, setLegacyDeliveredAt] = useState('');
  const [legacyUndeliverableAt, setLegacyUndeliverableAt] = useState('');

  const [displayedStageKey, setDisplayedStageKey] =
    useState('soundlegendCover');
  const [displayedOverlayStageKey, setDisplayedOverlayStageKey] =
    useState('soundlegendCover');

  const cachedStageMedia = useMemo(
    () => readProjectProgressStageMediaCache(),
    []
  );

  const hasCachedStageMedia = useMemo(() => {
    if (!cachedStageMedia) return false;
    return STEPS.every(
      (step) => cachedStageMedia[getStageMediaCacheKey(step.key)]
    );
  }, [cachedStageMedia]);

  const [selectedStageMediaCache, setSelectedStageMediaCache] = useState(
    cachedStageMedia || {}
  );

  const [allStageMediaReady, setAllStageMediaReady] =
    useState(hasCachedStageMedia);
  const [loadedAssetCount, setLoadedAssetCount] = useState(
    hasCachedStageMedia ? STEPS.length * 2 : 0
  );
  const [totalAssetCount, setTotalAssetCount] = useState(STEPS.length * 2);

  const [activeStorySectionId, setActiveStorySectionId] = useState('overview');
  const [activeInteractiveStepId, setActiveInteractiveStepId] = useState(null);

  const [carouselAnimating, setCarouselAnimating] = useState(false);

  const [selectedResourceItem, setSelectedResourceItem] = useState(null);

  const [archiveUploading, setArchiveUploading] = useState(false);
  const [archiveUploadError, setArchiveUploadError] = useState('');
  const [selectedCaptureKey, setSelectedCaptureKey] = useState('');
  const [customArchiveTitle, setCustomArchiveTitle] = useState('');
  const [selectedArchiveVisibility, setSelectedArchiveVisibility] = useState(
    ARCHIVE_VISIBILITY.ADMIN
  );

  const [coverUploadBusy, setCoverUploadBusy] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [selectedExistingCoverId, setSelectedExistingCoverId] = useState('');
  const coverRevealFileInputRef = useRef(null);

  const initialChapterSelectionRef = useRef('');

  const [sharedSmokeVideoUrl, setSharedSmokeVideoUrl] = useState('');

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const eduPanelCloseTimerRef = useRef(null);

  const eduPanelRef = useRef(null);
  const storypointRailRef = useRef(null);
  const carouselWindowRef = useRef(null);

  const transitionLockRef = useRef(false);

  const archiveFileInputRef = useRef(null);

  const [selectedArchiveCaptureKey, setSelectedArchiveCaptureKey] =
    useState('');
  const [archiveIsDragging, setArchiveIsDragging] = useState(false);
  const [archiveUploadProgress, setArchiveUploadProgress] = useState(0);

  const [displayTitleText, setDisplayTitleText] = useState(
    (STEPS[0]?.label || '').toUpperCase()
  );
  const [incomingTitleText, setIncomingTitleText] = useState('');
  const [titleTransitioning, setTitleTransitioning] = useState(false);

  const projectCoverMediaOptions = useMemo(
    () => getProjectCoverMediaOptions(project),
    [project]
  );

  const selectedExistingCoverOption = useMemo(() => {
    return (
      projectCoverMediaOptions.find(
        (item) => item.id === selectedExistingCoverId
      ) || null
    );
  }, [projectCoverMediaOptions, selectedExistingCoverId]);

  const handleSelectExistingCoverMedia = (mediaId) => {
    setSelectedExistingCoverId(mediaId);

    const selected = projectCoverMediaOptions.find(
      (item) => item.id === mediaId
    );
    if (!selected) return;

    setRevealCoverMediaUrl(selected.url || '');
    setRevealCoverMediaType(selected.type || 'image');
    setRevealCoverMediaTitle(selected.title || '');
  };

  const handleResetRevealCoverAdjustments = () => {
    setRevealCoverBrightness(DEFAULT_REVEAL_COVER_BRIGHTNESS);
    setRevealCoverSaturation(DEFAULT_REVEAL_COVER_SATURATION);
    setRevealCoverBlackFloor(DEFAULT_REVEAL_COVER_BLACK_FLOOR);
    setRevealCoverSmokeOpacity(DEFAULT_REVEAL_COVER_SMOKE_OPACITY);

    setRevealCoverDesktopPositionX(50);
    setRevealCoverMobilePositionX(50);
    setRevealCoverDesktopScale(1);
    setRevealCoverMobileScale(1.15);
  };

  const openCoverRevealFilePicker = () => {
    if (!isAdmin || coverUploadBusy) return;
    const input = coverRevealFileInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  };

  const handleCoverRevealUpload = async (file) => {
    if (!file || !project?.id) return;

    try {
      setCoverUploadBusy(true);
      setCoverUploadError('');

      const mediaType = getArchiveMediaTypeFromFile(file);
      if (mediaType !== 'image' && mediaType !== 'video') {
        throw new Error(
          'Only image and video files are allowed for the cover.'
        );
      }

      const extension =
        getFileExtension(file.name) || file.name.split('.').pop() || 'bin';

      const safeBase = slugifyArchivePart(
        file.name.replace(/\.[^/.]+$/, '') || 'soundlegend-cover'
      );

      const fileName = `soundlegend-cover-${Date.now()}-${safeBase}.${extension}`;
      const path = `projects/${project.id}/soundlegendReveal/${fileName}`;
      const fileRef = storageRef(storage, path);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      setRevealCoverMediaUrl(url);
      setRevealCoverMediaType(mediaType);
      setRevealCoverMediaTitle(
        file.name.replace(/\.[^/.]+$/, '') || 'SoundLegend Cover Media'
      );
      setSelectedExistingCoverId('');
    } catch (err) {
      console.error('Failed uploading reveal cover media:', err);
      setCoverUploadError(err.message || 'Failed to upload cover media.');
    } finally {
      setCoverUploadBusy(false);
    }
  };

  const handleCoverRevealFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleCoverRevealUpload(file);
    event.target.value = '';
  };

  useEffect(() => {
    if (!initialProjectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setProject((prev) => {
      if (!prev) {
        return initialProject || readProjectProgressCache(initialProject);
      }

      const incomingId = getProjectProgressIdentity(initialProject);
      const prevId = getProjectProgressIdentity(prev);

      if (incomingId && prevId && incomingId !== prevId) {
        return initialProject;
      }

      return initialProject || prev;
    });
  }, [initialProject, initialProjectId]);

  useEffect(() => {
    setActiveInteractiveStepId(null);
  }, [activeKey]);

  useEffect(() => {
    setSelectedResourceItem(null);
    setArchiveUploadError('');
    setSelectedCaptureKey('');
    setCustomArchiveTitle('');
    setSelectedArchiveVisibility(ARCHIVE_VISIBILITY.ADMIN);
  }, [activeKey]);

  useEffect(() => {
    if (!selectedResourceItem) {
      setArchiveEditorTitle('');
      setArchiveEditorVisibility(ARCHIVE_VISIBILITY.ADMIN);
      return;
    }

    setArchiveEditorTitle(
      selectedResourceItem.title ||
        selectedResourceItem.shortLabel ||
        selectedResourceItem.originalFileName ||
        selectedResourceItem.fileName ||
        ''
    );

    setArchiveEditorVisibility(
      selectedResourceItem.visibility || ARCHIVE_VISIBILITY.ADMIN
    );
  }, [selectedResourceItem]);

  useEffect(() => {
    const reveal = project?.soundlegendReveal || {};

    setRevealCoverTitle(reveal.coverTitle || 'Your SoundLegend Story');
    setRevealCoverSubtitle(
      reveal.coverSubtitle || 'The completed journey of your custom instrument.'
    );
    setRevealCoverMediaUrl(reveal.coverMediaUrl || '');
    setRevealCoverMediaTitle(reveal.coverMediaTitle || '');
    setRevealCoverMediaType(reveal.coverMediaType || 'image');

    setRevealChecklist({
      coverMediaSelected: !!reveal.adminChecklist?.coverMediaSelected,
      chapterMediaReviewed: !!reveal.adminChecklist?.chapterMediaReviewed,
      visibilityReviewed: !!reveal.adminChecklist?.visibilityReviewed,
      customerStoryApproved: !!reveal.adminChecklist?.customerStoryApproved,
      shipmentConfirmed: !!reveal.adminChecklist?.shipmentConfirmed,
      finalReviewComplete: !!reveal.adminChecklist?.finalReviewComplete,
    });

    setLegacyShippingStatus(reveal.shippingStatus || 'waiting_to_ship');
    setLegacyShippingCarrier(reveal.shippingCarrier || '');
    setLegacyTrackingNumber(reveal.trackingNumber || '');
    setLegacyShippedAt(
      reveal.shippedAt ? formatDateForInput(reveal.shippedAt) : ''
    );
    setLegacyDeliveredAt(
      reveal.deliveredAt ? formatDateForInput(reveal.deliveredAt) : ''
    );
    setLegacyUndeliverableAt(
      reveal.undeliverableAt ? formatDateForInput(reveal.undeliverableAt) : ''
    );

    setRevealCoverBrightness(
      typeof reveal.coverBrightness === 'number'
        ? reveal.coverBrightness
        : DEFAULT_REVEAL_COVER_BRIGHTNESS
    );

    setRevealCoverSaturation(
      typeof reveal.coverSaturation === 'number'
        ? reveal.coverSaturation
        : DEFAULT_REVEAL_COVER_SATURATION
    );

    setRevealCoverBlackFloor(
      typeof reveal.coverBlackFloor === 'number'
        ? reveal.coverBlackFloor
        : DEFAULT_REVEAL_COVER_BLACK_FLOOR
    );

    setRevealCoverSmokeOpacity(
      typeof reveal.coverSmokeOpacity === 'number'
        ? reveal.coverSmokeOpacity
        : DEFAULT_REVEAL_COVER_SMOKE_OPACITY
    );
    setRevealCoverDesktopPositionX(
      typeof reveal.coverDesktopPositionX === 'number'
        ? reveal.coverDesktopPositionX
        : 50
    );

    setRevealCoverMobilePositionX(
      typeof reveal.coverMobilePositionX === 'number'
        ? reveal.coverMobilePositionX
        : 50
    );

    setRevealCoverDesktopScale(
      typeof reveal.coverDesktopScale === 'number'
        ? reveal.coverDesktopScale
        : 1
    );

    setRevealCoverMobileScale(
      typeof reveal.coverMobileScale === 'number'
        ? reveal.coverMobileScale
        : 1.15
    );
  }, [project]);

  useEffect(() => {
    let cancelled = false;

    const cached = readProjectProgressStageMediaCache();
    const hasCompleteCache =
      cached && STEPS.every((step) => cached[getStageMediaCacheKey(step.key)]);

    if (hasCompleteCache) {
      setSelectedStageMediaCache(cached);
      setLoadedAssetCount(STEPS.length * 2);
      setTotalAssetCount(STEPS.length * 2);
      setAllStageMediaReady(true);

      const cachedSmokeUrl =
        Object.values(cached).find((bundle) => bundle?.smokeVideoUrl)
          ?.smokeVideoUrl || '';

      if (cachedSmokeUrl) {
        setSharedSmokeVideoUrl(cachedSmokeUrl);
      }

      return;
    }

    const preloadAllStageMedia = async () => {
      try {
        setAllStageMediaReady(false);
        setLoadedAssetCount(0);
        setTotalAssetCount(STEPS.length * 2);

        const nextCache = {};
        const bundles = [];

        for (let i = 0; i < STEPS.length; i += 1) {
          const step = STEPS[i];
          const bundle = await resolveStageMediaBundle(step.key);
          bundles.push(bundle);
          nextCache[getStageMediaCacheKey(step.key)] = bundle || null;

          if (!cancelled && !sharedSmokeVideoUrl && bundle?.smokeVideoUrl) {
            setSharedSmokeVideoUrl(bundle.smokeVideoUrl);
          }

          if (!cancelled) {
            setSelectedStageMediaCache((prev) => ({
              ...prev,
              [getStageMediaCacheKey(step.key)]: bundle || null,
            }));
            setLoadedAssetCount(i + 1);
          }
        }

        if (cancelled) return;

        const imageUrls = [];
        bundles.forEach((bundle) => {
          [bundle?.archivedImageUrl, bundle?.currentImageUrl]
            .filter(Boolean)
            .forEach((url) => imageUrls.push(url));
        });

        const uniqueImageUrls = Array.from(new Set(imageUrls));

        for (let i = 0; i < uniqueImageUrls.length; i += 1) {
          try {
            await preloadImage(uniqueImageUrls[i]);
          } catch (err) {
            console.warn('Image preload failed:', uniqueImageUrls[i], err);
          } finally {
            if (!cancelled) {
              const phaseOneCount = STEPS.length;
              const phaseTwoProgress = Math.round(
                ((i + 1) / Math.max(uniqueImageUrls.length, 1)) * STEPS.length
              );
              setLoadedAssetCount(phaseOneCount + phaseTwoProgress);
            }
          }
        }

        if (!cancelled) {
          setSelectedStageMediaCache(nextCache);
          writeProjectProgressStageMediaCache(nextCache);
          setLoadedAssetCount(STEPS.length * 2);
          setAllStageMediaReady(true);
        }
      } catch (err) {
        console.error('Failed preloading all stage media bundles:', err);
        if (!cancelled) {
          setAllStageMediaReady(true);
        }
      }
    };

    preloadAllStageMedia();

    return () => {
      cancelled = true;
    };
  }, [sharedSmokeVideoUrl]);

  useEffect(() => {
    const updateTouchCapability = () => {
      const hasTouch =
        window.matchMedia('(hover: none)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;

      setIsTouchDevice(hasTouch);
    };

    updateTouchCapability();
    window.addEventListener('resize', updateTouchCapability);

    return () => {
      window.removeEventListener('resize', updateTouchCapability);
    };
  }, []);

  useEffect(() => {
    if (!initialProjectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    const ref = getProjectDocRef(initialProject);
    if (!ref) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProject((prev) => {
            const incoming = { id: snap.id, ...snap.data() };
            const prevId = getProjectProgressIdentity(prev);

            if (prev && prevId === incoming.id) {
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
        setProject(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [initialProject, initialProjectId]);

  useEffect(() => {
    const cacheTarget = initialProject || project;
    const cacheId = getProjectProgressIdentity(cacheTarget);

    if (!project || !cacheId) return;

    writeProjectProgressCache(cacheTarget, project);
  }, [project, initialProject]);

  const overallPct = useMemo(() => getOverallProgress(project), [project]);
  const targetWindow = useMemo(() => getTargetWindow(project), [project]);
  const projectMarkedComplete = overallPct >= 100;

  const chapterTwoComplete = useMemo(() => {
    const chapterTwoStep = STEPS[1];
    if (!chapterTwoStep) return false;

    const status = getStepStatus(project, chapterTwoStep);
    return String(status?.status || '').toLowerCase() === 'completed';
  }, [project]);

  const currentStepIndex = useMemo(
    () => (overallPct === 0 ? 0 : getCurrentStepIndex(project)),
    [project, overallPct]
  );

  const { stageLabel: currentStageLabel, stepLabel: currentStepLabel } =
    useMemo(() => getCurrentStageAndStepLabels(project), [project]);

  const revealData = project?.soundlegendReveal || {};
  const revealIsDeployed = !!revealData.revealDeployed;
  const revealIsReady = !!revealData.revealReady;

  const revealCoverIsAvailable = !!(
    revealCoverMediaUrl &&
    (revealCoverMediaType === 'image' || revealCoverMediaType === 'video')
  );

  const storyChapters = useMemo(() => {
    const chapters = [...STEPS];

    if (revealIsDeployed && revealCoverIsAvailable) {
      chapters.unshift({
        key: 'soundlegendCover',
        label: revealCoverTitle || 'SoundLegend Story',
        adminMainTitle: revealCoverTitle || 'SoundLegend Story',
        adminLeftShort: 'Cover',
        what:
          revealCoverSubtitle ||
          'The completed journey of your custom instrument.',
        why: '',
        techniques: [],
        tools: [],
        estHours: '—',
        avgDays: '—',
        mantra: '',
        storageKeys: [],
        isRevealCover: true,
        coverMediaUrl: revealCoverMediaUrl,
        coverMediaTitle: revealCoverMediaTitle,
        coverMediaType: revealCoverMediaType,
        brightness: revealCoverBrightness,
        saturation: revealCoverSaturation,
        blackFloor: revealCoverBlackFloor,
        smokeOpacity: revealCoverSmokeOpacity,
        desktopPositionX: revealCoverDesktopPositionX,
        mobilePositionX: revealCoverMobilePositionX,
        desktopScale: revealCoverDesktopScale,
        mobileScale: revealCoverMobileScale,
      });
    }

    if (overallPct >= 100) {
      chapters.push({
        key: 'soundlegendEpilogue',
        label: 'From Ober Artisan',
        adminMainTitle: 'From Ober Artisan',
        adminLeftShort: 'Finale',
        what: 'A final note of gratitude, care guidance, guarantee details, and next steps for life with your SoundLegend instrument.',
        why: '',
        techniques: [],
        tools: [],
        estHours: '—',
        avgDays: '—',
        mantra: 'Continue creating.',
        storageKeys: [],
        isFinaleChapter: true,
      });
    }

    return chapters;
  }, [
    overallPct,
    revealIsDeployed,
    revealCoverIsAvailable,
    revealCoverTitle,
    revealCoverSubtitle,
    revealCoverMediaUrl,
    revealCoverMediaTitle,
    revealCoverMediaType,
    revealCoverBrightness,
    revealCoverSaturation,
    revealCoverBlackFloor,
    revealCoverSmokeOpacity,
    revealCoverDesktopPositionX,
    revealCoverMobilePositionX,
    revealCoverDesktopScale,
    revealCoverMobileScale,
  ]);

  const defaultChapterKey = useMemo(() => {
    const reveal = project?.soundlegendReveal || {};

    const hasRevealCoverChapter = storyChapters.some(
      (chapter) => chapter.key === 'soundlegendCover'
    );

    const hasLegacyChapter = storyChapters.some(
      (chapter) => chapter.key === 'soundlegendEpilogue'
    );

    const projectIsComplete = overallPct >= 100;
    const revealIsLive = !!reveal.revealDeployed;
    const revealHasMedia = !!reveal.coverMediaUrl;

    if (projectIsComplete) {
      if (revealIsLive && revealHasMedia && hasRevealCoverChapter) {
        return 'soundlegendCover';
      }

      if (hasLegacyChapter) {
        return 'soundlegendEpilogue';
      }
    }

    return (STEPS[currentStepIndex] || STEPS[0])?.key || STEPS[0].key;
  }, [project, storyChapters, overallPct, currentStepIndex]);

  const chapterSelectorItems = useMemo(() => {
    const numberedStoryChapters = storyChapters.filter(
      (c) => c.key !== 'soundlegendCover' && c.key !== 'soundlegendEpilogue'
    );

    return storyChapters.map((chapter) => {
      const isCover = chapter.key === 'soundlegendCover';
      const isLegacy = chapter.key === 'soundlegendEpilogue';
      const isActive = chapter.key === activeKey;

      let visualState = 'default';
      let isClickable = false;
      let title = chapter.label;

      if (isCover) {
        visualState =
          revealIsDeployed && revealCoverIsAvailable ? 'revealed' : 'locked';
        isClickable = revealIsDeployed && revealCoverIsAvailable;
      } else if (isLegacy) {
        visualState = overallPct >= 100 ? 'revealed' : 'locked';
        isClickable = overallPct >= 100;
      } else {
        const canonicalStageIndex = STEPS.findIndex(
          (s) => s.key === chapter.key
        );

        const chapterNumberIndex = numberedStoryChapters.findIndex(
          (c) => c.key === chapter.key
        );

        const accessible = isStoryChapterAccessible({
          step: chapter,
          stageIndex: canonicalStageIndex,
          currentStepIndex,
          projectMarkedComplete,
          chapterTwoComplete,
        });

        const stepStatus = getResolvedVisualStageState({
          project,
          step: chapter,
          stageIndex: canonicalStageIndex,
          currentStepIndex,
          projectMarkedComplete,
        });

        const isPreviewChapter =
          chapterNumberIndex === 1 || chapterNumberIndex === 2;
        const isPostCommitmentChapter = chapterNumberIndex >= 3;

        if (!accessible) {
          if (isPreviewChapter) {
            visualState = 'preview';
            isClickable = true;
            title = `${chapter.label} — Preview available before commitment`;
          } else if (isPostCommitmentChapter) {
            visualState = 'locked';
            isClickable = false;
            title = `${chapter.label} — Unlocks after commitment/payment`;
          } else {
            visualState = 'locked';
            isClickable = false;
          }
        } else {
          isClickable = true;

          if (stepStatus === STAGE_MEDIA_STATE.COMPLETED) {
            visualState = 'completed';
          } else if (stepStatus === STAGE_MEDIA_STATE.CURRENT) {
            visualState = 'current';
          } else if (isPreviewChapter) {
            visualState = 'preview';
          } else {
            visualState = 'revealed';
          }
        }
      }

      return {
        key: chapter.key,
        label: isCover
          ? 'Cover'
          : isLegacy
            ? 'Legacy'
            : `${toRomanChapter(
                numberedStoryChapters.findIndex((c) => c.key === chapter.key) +
                  1
              )}`,
        title,
        isActive,
        isClickable,
        isLocked: !isClickable,
        visualState,
      };
    });
  }, [
    storyChapters,
    activeKey,
    revealIsDeployed,
    revealCoverIsAvailable,
    overallPct,
    project,
    currentStepIndex,
    projectMarkedComplete,
    chapterTwoComplete,
  ]);

  useEffect(() => {
    if (!project?.id) return;
    if (transitionLockRef.current) return;
    if (!defaultChapterKey) return;

    const activeChapter = storyChapters.find(
      (chapter) => chapter.key === activeKey
    );

    const activeKeyIsStillValid = !!activeChapter;

    const activeCanonicalStageIndex = STEPS.findIndex(
      (s) => s.key === activeChapter?.key
    );

    const activeIsAccessible = activeChapter
      ? isStoryChapterAccessible({
          step: activeChapter,
          stageIndex: activeCanonicalStageIndex,
          currentStepIndex,
          projectMarkedComplete,
          chapterTwoComplete,
        })
      : false;

    const initSignature = [
      project.id,
      defaultChapterKey,
      currentStepIndex,
      projectMarkedComplete ? 'complete' : 'active',
      storyChapters.map((chapter) => chapter.key).join('|'),
    ].join('::');

    if (initialChapterSelectionRef.current !== initSignature) {
      initialChapterSelectionRef.current = initSignature;
      setActiveKey(defaultChapterKey);
      setDisplayedStageKey(defaultChapterKey);
      setDisplayedOverlayStageKey(defaultChapterKey);
      return;
    }

    if (!activeKey || !activeKeyIsStillValid || !activeIsAccessible) {
      setActiveKey(defaultChapterKey);
      setDisplayedStageKey(defaultChapterKey);
      setDisplayedOverlayStageKey(defaultChapterKey);
    }
  }, [
    project?.id,
    defaultChapterKey,
    activeKey,
    storyChapters,
    currentStepIndex,
    projectMarkedComplete,
    chapterTwoComplete,
  ]);

  const activeStep =
    storyChapters.find((s) => s.key === activeKey) || storyChapters[0];
  const activeIndex = storyChapters.findIndex((s) => s.key === activeKey);

  const isRevealCoverChapter = activeStep?.key === 'soundlegendCover';
  const isLegacyChapter = activeStep?.key === 'soundlegendEpilogue';

  const isProjectComplete = overallPct >= 100;

  const formatDisplayDate = (value) => {
    if (!value) return '';
    const ms = tsToMillis(value);
    if (!ms) return '';
    return fmtDate(ms);
  };

  const shippingSummary = useMemo(() => {
    const reveal = project?.soundlegendReveal || {};

    const shippingStatus = String(
      reveal.shippingStatus || 'waiting_to_ship'
    ).trim();

    const carrier = String(reveal.shippingCarrier || '').trim();
    const tracking = String(reveal.trackingNumber || '').trim();

    const shippedDate = formatDisplayDate(reveal.shippedAt);
    const deliveredDate = formatDisplayDate(reveal.deliveredAt);
    const undeliverableDate = formatDisplayDate(reveal.undeliverableAt);

    let headline = 'Build Complete • Waiting to be Shipped';
    let deliveryStatus = 'Waiting to be Shipped';

    if (shippingStatus === 'shipped') {
      headline = 'Build Complete • Shipped';
      deliveryStatus = shippedDate ? `Shipped on ${shippedDate}` : 'Shipped';
    } else if (shippingStatus === 'delivered') {
      headline = 'Build Complete • Delivered';
      deliveryStatus = deliveredDate
        ? `Delivered on ${deliveredDate}`
        : 'Delivered';
    } else if (shippingStatus === 'undeliverable') {
      headline = 'Build Complete • Delivery Issue';
      deliveryStatus = undeliverableDate
        ? `Undeliverable on ${undeliverableDate}`
        : 'Undeliverable';
    }

    let carrierTracking = '—';
    if (carrier && tracking) {
      carrierTracking = `${carrier} • ${tracking}`;
    } else if (carrier) {
      carrierTracking = carrier;
    } else if (tracking) {
      carrierTracking = tracking;
    }

    return {
      shippingStatus,
      headline,
      deliveryStatus,
      carrierTracking,
    };
  }, [project]);

  const summaryHeadline = useMemo(() => {
    if (!isProjectComplete) {
      return isLegacyChapter
        ? 'Legacy Chapter • From Ober Artisan'
        : currentStageLabel;
    }

    return shippingSummary.headline;
  }, [isProjectComplete, isLegacyChapter, currentStageLabel, shippingSummary]);

  const summarySubtitle = useMemo(() => {
    if (!isProjectComplete) {
      return 'Follow your drum’s build journey from concept to final delivery.';
    }

    return 'This instrument is complete and has officially entered its legacy chapter.';
  }, [isProjectComplete]);

  const deliveryStatusLabel = useMemo(() => {
    if (!isProjectComplete) {
      return isLegacyChapter
        ? 'Final handoff • Story now belongs to the artist'
        : currentStepLabel;
    }

    return shippingSummary.deliveryStatus;
  }, [isProjectComplete, isLegacyChapter, currentStepLabel, shippingSummary]);

  const carrierTrackingLabel = useMemo(() => {
    if (!isProjectComplete) {
      return targetWindow || 'TBD';
    }

    return shippingSummary.carrierTracking;
  }, [isProjectComplete, targetWindow, shippingSummary]);

  const legacyChapterContent = useMemo(() => {
    return getLegacyChapterContent(project, isAdmin);
  }, [project, isAdmin]);

  const chapterLabel =
    activeStep?.key === 'soundlegendCover'
      ? 'Cover'
      : activeStep?.key === 'soundlegendEpilogue'
        ? 'Legacy Chapter'
        : `Chapter ${toRomanChapter(
            Math.max(
              1,
              storyChapters
                .filter(
                  (chapter) =>
                    chapter.key !== 'soundlegendCover' &&
                    chapter.key !== 'soundlegendEpilogue'
                )
                .findIndex((chapter) => chapter.key === activeStep?.key) + 1
            )
          )}`;

  const chapterNarrative = useMemo(() => {
    if (isLegacyChapter) {
      return {
        title: legacyChapterContent.title,
        summary:
          'Thank you for trusting me with something this personal. The build is complete. Now the story — and the sound — belong to you.',
        sentences: [
          'Thank you for trusting me with something this personal. The build is complete. Now the story — and the sound — belong to you.',
        ],
      };
    }

    if (isRevealCoverChapter) {
      return {
        title: revealCoverTitle || 'Your SoundLegend Story',
        summary:
          revealCoverSubtitle ||
          'The completed journey of your custom instrument.',
        sentences: [
          revealCoverSubtitle ||
            'The completed journey of your custom instrument.',
        ],
      };
    }

    return getChapterNarrative(activeStep, project);
  }, [
    activeStep,
    project,
    isLegacyChapter,
    isRevealCoverChapter,
    legacyChapterContent,
    revealCoverTitle,
    revealCoverSubtitle,
  ]);

  const currentStageStorypoints = useMemo(() => {
    if (isLegacyChapter || isRevealCoverChapter) {
      return [];
    }

    return getStorypointsForStep(activeStep, project);
  }, [activeStep, project, isLegacyChapter, isRevealCoverChapter]);

  const currentChapterProgressData = useMemo(
    () => getChapterProgressData(activeStep, project),
    [activeStep, project]
  );

  const currentChapterCheckpointTimeline = useMemo(
    () => getChapterCheckpointTimeline(activeStep, project),
    [activeStep, project]
  );

  const currentStageTemplate = STAGE_TEMPLATES?.[activeStep.key] || null;

  const currentStageInteractiveSteps = useMemo(() => {
    if (
      !project ||
      !currentStageTemplate ||
      activeStep?.key === 'soundlegendCover' ||
      activeStep?.key === 'soundlegendEpilogue'
    ) {
      return [];
    }

    const canonical = canonicalKeyForStage(activeStep.key);
    const phaseKey = getExistingPhaseKey(project, canonical);
    const phase = project?.[phaseKey] || {};
    const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
    const tplSteps = Array.isArray(currentStageTemplate.steps)
      ? currentStageTemplate.steps
      : [];

    return tplSteps.map((tplStep, idx) => {
      const item = checklist[idx] || {};
      const checkpointStates = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const checkpointCount = Array.isArray(tplStep?.checkpoints)
        ? tplStep.checkpoints.length
        : 0;
      const checkpointDone = checkpointStates.filter(Boolean).length;
      const isComplete =
        checkpointCount > 0 && checkpointDone === checkpointCount;

      let status = 'NOT STARTED';
      if (isComplete) status = 'COMPLETED';
      else if (checkpointDone > 0 || item.completed) status = 'IN PROGRESS';

      return {
        id: tplStep?.id || tplStep?.key || `${activeStep.key}-${idx}`,
        index: idx,
        label:
          tplStep?.adminMainTitle ||
          tplStep?.label ||
          tplStep?.adminLeftShort ||
          `Step ${idx + 1}`,
        status,
        done: checkpointDone,
        total: checkpointCount,
        body:
          Array.isArray(tplStep?.checkpoints) && tplStep.checkpoints.length
            ? tplStep.checkpoints
                .map((cp) => cp?.ui || cp?.book)
                .filter(Boolean)
                .join(' • ')
            : 'Checkpoint details will appear here.',
      };
    });
  }, [project, currentStageTemplate, activeStep]);
  const activeStorypoint =
    currentStageStorypoints.find((item) => item.id === activeStorySectionId) ||
    currentStageStorypoints[0] ||
    null;

  const stageResourceItems = useMemo(
    () => getStageResourceItems(project, activeIndex + 1),
    [project, activeIndex]
  );

  const activeStageArchiveDefinition = useMemo(
    () => getStageArchiveDefinition(activeStep?.key),
    [activeStep?.key]
  );

  const activeStageSuggestedCaptures = useMemo(
    () => getStageSuggestedCaptures(activeStep?.key),
    [activeStep?.key]
  );

  const activeStageAdminCaptureChecklist = useMemo(
    () => getStageAdminCaptureChecklist(activeStep?.key),
    [activeStep?.key]
  );

  const activeStageArchiveItems = useMemo(
    () => getProjectArchiveItems(project, activeStep?.key),
    [project, activeStep?.key]
  );

  const revealChecklistComplete = useMemo(() => {
    return Object.values(revealChecklist).every(Boolean);
  }, [revealChecklist]);

  const legacyTrackingText = project?.soundlegendReveal?.trackingNumber?.trim()
    ? `${project?.soundlegendReveal?.shippingCarrier || 'Carrier'} • ${
        project.soundlegendReveal.trackingNumber
      }`
    : 'Tracking details will become available in the next 24 hours.';

  const legacyFinalNoteText =
    project?.soundlegendReveal?.finalAdminNote?.trim() ||
    'Your instrument is complete, but the story continues every time you sit down to play.';

  const handleSaveLegacyChapterDetails = async () => {
    try {
      setRevealPanelBusy(true);

      await saveRevealSettings({
        shippingStatus: legacyShippingStatus,
        shippingCarrier: legacyShippingCarrier,
        trackingNumber: legacyTrackingNumber,
        shippedAt: legacyShippedAt || '',
        deliveredAt: legacyDeliveredAt || '',
        undeliverableAt: legacyUndeliverableAt || '',
        finalAdminNote: project?.soundlegendReveal?.finalAdminNote || '',
      });
    } catch (err) {
      console.error('Failed saving legacy chapter details:', err);
      alert('Failed to save legacy chapter details.');
    } finally {
      setRevealPanelBusy(false);
    }
  };

  useEffect(() => {
    const nextTitle = (activeStep?.label || '').toUpperCase();

    if (!nextTitle) return;
    if (nextTitle === displayTitleText) return;

    setIncomingTitleText(nextTitle);
    setTitleTransitioning(true);

    const swapTimer = window.setTimeout(() => {
      setDisplayTitleText(nextTitle);
      setIncomingTitleText('');
      setTitleTransitioning(false);
    }, 900);

    return () => window.clearTimeout(swapTimer);
  }, [activeStep?.label, displayTitleText]);

  const activeStepCompletionStatus =
    !isRevealCoverChapter && !isLegacyChapter && activeStep
      ? String(getStepStatus(project, activeStep).status || '').toLowerCase()
      : '';

  const currentStageStatus =
    activeStep?.key === 'soundlegendCover'
      ? STAGE_MEDIA_STATE.COMPLETED
      : activeStep?.key === 'soundlegendEpilogue'
        ? projectMarkedComplete
          ? STAGE_MEDIA_STATE.COMPLETED
          : STAGE_MEDIA_STATE.FUTURE
        : activeStepCompletionStatus === 'completed'
          ? STAGE_MEDIA_STATE.COMPLETED
          : getSelectedStageMediaState(
              STEPS.findIndex((s) => s.key === activeStep?.key),
              currentStepIndex
            );

  const canonicalActiveStageIndex = STEPS.findIndex(
    (s) => s.key === activeStep?.key
  );

  const stageStatePresentation = isLegacyChapter
    ? {
        eyebrow: '',
        pill: '',
        helper:
          'Your instrument is finished. This final chapter marks the handoff from maker to artist.',
      }
    : isRevealCoverChapter
      ? {
          eyebrow: 'SoundLegend Reveal',
          pill: 'Revealed',
          helper: 'This is the front cover of the completed SoundLegend story.',
        }
      : activeStepCompletionStatus === 'completed'
        ? {
            eyebrow: 'Chapter Completed',
            pill: 'Completed',
            helper:
              'This chapter is complete and now lives as part of your build archive.',
          }
        : getStageStatePresentation(
            canonicalActiveStageIndex,
            currentStepIndex
          );

  const isSelectedStageLocked = currentStageStatus === STAGE_MEDIA_STATE.FUTURE;

  const showStageStorypoints =
    currentStageStatus === STAGE_MEDIA_STATE.COMPLETED ||
    currentStageStatus === STAGE_MEDIA_STATE.CURRENT;

  const displayedOverlayStageIndex = Math.max(
    0,
    storyChapters.findIndex((s) => s.key === displayedOverlayStageKey)
  );

  const displayedStageStep =
    storyChapters.find((s) => s.key === displayedStageKey) || null;

  const displayedStageIndex = Math.max(
    0,
    storyChapters.findIndex((s) => s.key === displayedStageKey)
  );

  const displayedStageStatus = getResolvedVisualStageState({
    project,
    step: displayedStageStep,
    stageIndex: displayedStageIndex,
    currentStepIndex,
    projectMarkedComplete,
  });

  const SMOKE_OPACITY_BY_STAGE_STATE = {
    [STAGE_MEDIA_STATE.COMPLETED]: 0.0,
    [STAGE_MEDIA_STATE.CURRENT]: 0.48,
    [STAGE_MEDIA_STATE.NEXT]: 0.82,
    [STAGE_MEDIA_STATE.FUTURE]: 1.0,
  };

  const VEIL_OPACITY_BY_STAGE_STATE = {
    [STAGE_MEDIA_STATE.COMPLETED]: 0.0,
    [STAGE_MEDIA_STATE.CURRENT]: 0.14,
    [STAGE_MEDIA_STATE.NEXT]: 0.78,
    [STAGE_MEDIA_STATE.FUTURE]: 0.96,
  };

  const isLegacyStageVisible =
    displayedStageKey === 'soundlegendEpilogue' ||
    activeStep?.key === 'soundlegendEpilogue';

  const isCoverStageVisible =
    displayedStageKey === 'soundlegendCover' ||
    activeStep?.key === 'soundlegendCover';

  const activeStatus = useMemo(() => {
    if (!project || !activeStep) return 'not_started';

    const computed = String(getStepStatus(project, activeStep).status || '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (computed === 'completed') return 'completed';

    const activePtr = getGlobalActiveSubStep(project);
    if (activePtr?.stageKey === activeStep.key) return 'in_progress';

    return computed;
  }, [project, activeStep]);

  const showEducationAndCheckpoints = activeIndex <= currentStepIndex;
  const selectedStageThemeClass =
    activeStatus === 'completed'
      ? 'is-theme-completed'
      : activeStatus === 'in_progress'
        ? 'is-theme-live'
        : isSelectedStageLocked
          ? 'is-theme-locked'
          : 'is-theme-default';

  const accessibleStoryIndexes = useMemo(() => {
    return storyChapters
      .map((chapter, idx) => {
        const canonicalStageIndex = STEPS.findIndex(
          (s) => s.key === chapter.key
        );

        const accessible = isStoryChapterAccessible({
          step: chapter,
          stageIndex: canonicalStageIndex,
          currentStepIndex,
          projectMarkedComplete,
          chapterTwoComplete,
        });

        return accessible ? idx : null;
      })
      .filter((idx) => idx !== null);
  }, [
    storyChapters,
    currentStepIndex,
    projectMarkedComplete,
    chapterTwoComplete,
  ]);

  const prevAccessibleIndex = [...accessibleStoryIndexes]
    .reverse()
    .find((idx) => idx < activeIndex);

  const nextAccessibleIndex = accessibleStoryIndexes.find(
    (idx) => idx > activeIndex
  );

  const canGoPrev = typeof prevAccessibleIndex === 'number';
  const canGoNext = typeof nextAccessibleIndex === 'number';
  const prevStep = canGoPrev ? storyChapters[prevAccessibleIndex] : null;
  const nextStep = canGoNext ? storyChapters[nextAccessibleIndex] : null;

  const getStageMediaForStep = (step) => {
    if (!step?.key) return null;

    if (step.key === 'soundlegendCover') {
      const coverUrl =
        step.coverMediaUrl || project?.soundlegendReveal?.coverMediaUrl || '';

      const coverType =
        step.coverMediaType ||
        project?.soundlegendReveal?.coverMediaType ||
        getFileTypeFromUrl(coverUrl);

      if (!coverUrl) return null;

      const isMobileViewport =
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

      return {
        stageKey: step.key,
        stageLabel: step.label,
        mediaState: STAGE_MEDIA_STATE.CURRENT,
        baseImageUrl: coverType === 'image' ? coverUrl : '',
        coverMediaUrl: coverUrl,
        coverMediaType: coverType,
        isCoverMedia: true,
        brightness:
          typeof step.brightness === 'number' ? step.brightness : 0.72,
        saturation:
          typeof step.saturation === 'number' ? step.saturation : 1.02,
        blackFloor:
          typeof step.blackFloor === 'number' ? step.blackFloor : 0.22,
        smokeOpacity:
          typeof step.smokeOpacity === 'number' ? step.smokeOpacity : 0.28,
        positionX: isMobileViewport
          ? (step.mobilePositionX ?? 50)
          : (step.desktopPositionX ?? 50),
        scale: isMobileViewport
          ? (step.mobileScale ?? 1.15)
          : (step.desktopScale ?? 1),
      };
    }

    if (step.key === 'soundlegendEpilogue') {
      return null;
    }

    const canonicalStageIndex = STEPS.findIndex((s) => s.key === step.key);
    if (canonicalStageIndex < 0) return null;

    const mediaState = getResolvedVisualStageState({
      project,
      step,
      stageIndex: canonicalStageIndex,
      currentStepIndex,
      projectMarkedComplete,
    });

    const cacheKey = getStageMediaCacheKey(step.key);
    const bundle = selectedStageMediaCache[cacheKey];

    if (!bundle) return null;

    const isCompleted = mediaState === STAGE_MEDIA_STATE.COMPLETED;
    const isCurrent = mediaState === STAGE_MEDIA_STATE.CURRENT;
    const isNext = mediaState === STAGE_MEDIA_STATE.NEXT;
    const isFuture = mediaState === STAGE_MEDIA_STATE.FUTURE;

    let baseImageUrl = '';

    if (isCompleted || isCurrent) {
      baseImageUrl = bundle.currentImageUrl || bundle.archivedImageUrl || '';
    } else if (isNext) {
      baseImageUrl = bundle.archivedImageUrl || bundle.currentImageUrl || '';
    } else if (isFuture) {
      baseImageUrl = '';
    }

    return {
      stageKey: step.key,
      stageLabel: step.label,
      mediaState,
      baseImageUrl,
      coverMediaUrl: '',
      coverMediaType: '',
      isCoverMedia: false,
      brightness: 1,
      saturation: 1,
      blackFloor: 0,
      smokeOpacity: 0,
    };
  };

  const allRenderableStageLayers = useMemo(() => {
    return storyChapters
      .map((step) => {
        const media = getStageMediaForStep(step);

        return {
          stageKey: step.key,
          baseImageUrl: media?.baseImageUrl || '',
          coverMediaUrl: media?.coverMediaUrl || '',
          coverMediaType: media?.coverMediaType || '',
          isCoverMedia: !!media?.isCoverMedia,
          mediaState: media?.mediaState || STAGE_MEDIA_STATE.FUTURE,
          isVisible: displayedStageKey === step.key,
          label: step.label,
          brightness: media?.brightness ?? 1,
          saturation: media?.saturation ?? 1,
          blackFloor: media?.blackFloor ?? 0,
          smokeOpacity: media?.smokeOpacity ?? 0,
          positionX: media?.positionX ?? 50,
          scale: media?.scale ?? 1,
        };
      })
      .filter((layer) => !!layer.baseImageUrl || !!layer.coverMediaUrl);
  }, [
    storyChapters,
    displayedStageKey,
    selectedStageMediaCache,
    currentStepIndex,
    project,
    projectMarkedComplete,
  ]);

  const activeDisplayedLayer = allRenderableStageLayers.find(
    (layer) => layer.stageKey === displayedStageKey
  );

  const smokeOverlayOpacity = isLegacyStageVisible
    ? 0.48
    : isCoverStageVisible
      ? (activeDisplayedLayer?.smokeOpacity ?? revealCoverSmokeOpacity ?? 0.28)
      : (SMOKE_OPACITY_BY_STAGE_STATE[displayedStageStatus] ?? 0.6);

  const lockedStageVeilOpacity =
    isLegacyStageVisible || isCoverStageVisible
      ? 0
      : (VEIL_OPACITY_BY_STAGE_STATE[displayedStageStatus] ?? 0);

  const navigateToStageIndex = (targetIndex) => {
    if (transitionLockRef.current) return;
    if (targetIndex < 0 || targetIndex >= storyChapters.length) return;
    if (targetIndex === activeIndex) return;

    const targetStep = storyChapters[targetIndex];
    if (!targetStep) return;

    const canonicalStageIndex = STEPS.findIndex(
      (s) => s.key === targetStep.key
    );

    const isAccessible = isStoryChapterAccessible({
      step: targetStep,
      stageIndex: canonicalStageIndex,
      currentStepIndex,
      projectMarkedComplete,
      chapterTwoComplete,
    });

    if (!isAccessible) return;

    const previousStageKey = displayedStageKey;

    transitionLockRef.current = true;
    setCarouselAnimating(true);

    setActiveKey(targetStep.key);
    setDisplayedStageKey(targetStep.key);
    setDisplayedOverlayStageKey(previousStageKey);

    window.setTimeout(() => {
      setDisplayedOverlayStageKey(targetStep.key);
    }, 90);

    window.setTimeout(() => {
      setCarouselAnimating(false);
      transitionLockRef.current = false;
    }, 260);
  };

  const goPrevStage = () => {
    if (!canGoPrev) return;

    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
      eduPanelCloseTimerRef.current = null;
    }

    navigateToStageIndex(prevAccessibleIndex);
  };

  const goNextStage = () => {
    if (!canGoNext) return;

    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
      eduPanelCloseTimerRef.current = null;
    }

    navigateToStageIndex(nextAccessibleIndex);
  };

  const handleArchiveUpload = async (file) => {
    if (!file || !project?.id || !activeStep?.key) return;

    try {
      setArchiveUploading(true);
      setArchiveUploadError('');

      const captureDef =
        selectedCaptureKey && selectedCaptureKey !== 'other'
          ? getArchiveCaptureByKey(activeStep.key, selectedCaptureKey)
          : null;

      const mediaType =
        captureDef?.mediaType || getArchiveMediaTypeFromFile(file);

      const stageDef = getStageArchiveDefinition(activeStep.key);
      const filenamePrefix =
        stageDef?.filenamePrefix ||
        `chapter-${String(activeIndex + 1).padStart(2, '0')}`;

      const chosenLabel =
        selectedCaptureKey === 'other'
          ? customArchiveTitle || file.name
          : captureDef?.filenameLabel || captureDef?.label || file.name;

      const extension =
        getFileExtension(file.name) || file.name.split('.').pop() || 'bin';
      const safeLabel = slugifyArchivePart(chosenLabel);
      const stampedName = `${filenamePrefix}--${safeLabel || 'asset'}--${Date.now()}.${extension}`;

      const storagePath = `projects/${project.id}/archive/${activeStep.key}/${stampedName}`;
      const fileRef = storageRef(storage, storagePath);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const nextItem = {
        id: `${activeStep.key}-${Date.now()}`,
        url,
        title:
          selectedCaptureKey === 'other'
            ? customArchiveTitle || file.name
            : captureDef?.label || file.name,
        fileName: stampedName,
        originalFileName: file.name,
        stage: STAGE_MEDIA?.[activeStep.key]?.stageNumber || activeIndex + 1,
        stageKey: activeStep.key,
        captureKey:
          selectedCaptureKey && selectedCaptureKey !== 'other'
            ? selectedCaptureKey
            : '',
        isSuggestedCapture:
          !!selectedCaptureKey && selectedCaptureKey !== 'other',
        mediaType,
        type: mediaType,
        visibility:
          selectedCaptureKey === 'other'
            ? selectedArchiveVisibility
            : captureDef?.visibility || selectedArchiveVisibility,
        hidden:
          (selectedCaptureKey === 'other'
            ? selectedArchiveVisibility
            : captureDef?.visibility || selectedArchiveVisibility) ===
          ARCHIVE_VISIBILITY.ADMIN,
        category: 'archive',
        source: 'archive',
        purpose: captureDef?.purpose || '',
        angle: captureDef?.angle || '',
        details: Array.isArray(captureDef?.details) ? captureDef.details : [],
        adminTask: captureDef?.adminTask || '',
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        uploadedBy: isAdmin ? 'admin' : 'user',
      };

      const existingMedia = Array.isArray(project?.media) ? project.media : [];
      const nextMedia = [...existingMedia, nextItem];

      const projectRef = getProjectDocRef(project);
      if (!projectRef) {
        throw new Error('Missing project reference.');
      }

      await updateDoc(projectRef, {
        media: nextMedia,
        updatedAt: serverTimestamp(),
      });

      setProject((prev) => (prev ? { ...prev, media: nextMedia } : prev));

      setSelectedCaptureKey('');
      setCustomArchiveTitle('');
      setSelectedArchiveVisibility(ARCHIVE_VISIBILITY.ADMIN);
    } catch (err) {
      console.error('Archive upload failed:', err);
      setArchiveUploadError('Failed to upload archive item.');
    } finally {
      setArchiveUploading(false);
    }
  };

  const selectedArchiveCapture = useMemo(() => {
    if (selectedArchiveCaptureKey === 'other') {
      return {
        key: 'other',
        label: 'Custom Archive Upload',
        shortLabel: 'Custom upload',
        mediaType: 'other',
        purpose: 'Upload a custom archive item for this chapter.',
        visibility: ARCHIVE_VISIBILITY.ADMIN,
        filenameLabel: 'custom-archive-item',
        details: [],
        angle: '',
      };
    }

    return (
      getArchiveCaptureByKey(activeStep?.key, selectedArchiveCaptureKey) || null
    );
  }, [activeStep?.key, selectedArchiveCaptureKey]);

  const getArchiveVisibilityLabel = (visibility) => {
    if (visibility === ARCHIVE_VISIBILITY.ADMIN) return 'Admin only';
    if (visibility === ARCHIVE_VISIBILITY.PUBLIC) return 'Public';
    return 'Admin + customer';
  };

  const slugifyArchivePart = (value = '') =>
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getArchiveFileExtension = (fileName = '') => {
    const parts = String(fileName || '').split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const buildArchiveFilename = ({
    file,
    capture,
    stageDefinition,
    projectLike,
  }) => {
    const originalExt = getArchiveFileExtension(file?.name || '') || 'bin';
    const prefix =
      stageDefinition?.filenamePrefix || slugifyArchivePart(activeStep?.key);
    const serial =
      projectLike?.serial ||
      projectLike?.lineSerial ||
      projectLike?.snareSerial ||
      projectLike?.projectSerial ||
      projectLike?.id ||
      'project';

    const capturePart = slugifyArchivePart(
      capture?.filenameLabel ||
        capture?.shortLabel ||
        capture?.label ||
        'archive-item'
    );

    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);

    return `${prefix}__${slugifyArchivePart(serial)}__${capturePart}__${stamp}.${originalExt}`;
  };

  const openArchiveFilePicker = () => {
    if (!isAdmin) return;

    const input = archiveFileInputRef.current;
    if (!input) return;

    input.value = '';
    input.click();
  };

  const saveArchiveItemToProject = async (archiveItem) => {
    if (!project?.id || !archiveItem) return;

    const projectRef = doc(db, 'projects', project.id);
    const existingArchive = project?.stageArchive || {};
    const existingStageItems = Array.isArray(existingArchive?.[activeStep.key])
      ? existingArchive[activeStep.key]
      : [];

    const nextStageItems = [archiveItem, ...existingStageItems];

    await updateDoc(projectRef, {
      [`stageArchive.${activeStep.key}`]: nextStageItems,
      updatedAt: serverTimestamp(),
    });

    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stageArchive: {
          ...(prev.stageArchive || {}),
          [activeStep.key]: nextStageItems,
        },
      };
    });
  };

  const updateArchiveItemInProject = async (itemId, updates = {}) => {
    if (!project?.id || !itemId) return;

    const projectRef = doc(db, 'projects', project.id);
    const existingArchive = project?.stageArchive || {};
    const nextArchive = { ...existingArchive };

    Object.keys(nextArchive).forEach((stageKey) => {
      const arr = Array.isArray(nextArchive[stageKey])
        ? nextArchive[stageKey]
        : [];
      nextArchive[stageKey] = arr.map((item) => {
        if (item.id !== itemId) return item;

        const nextVisibility = updates.visibility ?? item.visibility;
        return {
          ...item,
          ...updates,
          visibility: nextVisibility,
          hidden: nextVisibility === ARCHIVE_VISIBILITY.ADMIN,
        };
      });
    });

    await updateDoc(projectRef, {
      stageArchive: nextArchive,
      updatedAt: serverTimestamp(),
    });

    setProject((prev) =>
      prev
        ? {
            ...prev,
            stageArchive: nextArchive,
          }
        : prev
    );

    setSelectedResourceItem((prev) => {
      if (!prev || prev.id !== itemId) return prev;
      const nextVisibility = updates.visibility ?? prev.visibility;
      return {
        ...prev,
        ...updates,
        visibility: nextVisibility,
        hidden: nextVisibility === ARCHIVE_VISIBILITY.ADMIN,
      };
    });
  };

  const deleteArchiveItemFromProject = async (itemId) => {
    if (!project?.id || !itemId) return;

    const projectRef = doc(db, 'projects', project.id);
    const existingArchive = project?.stageArchive || {};
    const nextArchive = {};

    Object.entries(existingArchive).forEach(([stageKey, arr]) => {
      const safeArr = Array.isArray(arr) ? arr : [];
      nextArchive[stageKey] = safeArr.filter((item) => item.id !== itemId);
    });

    await updateDoc(projectRef, {
      stageArchive: nextArchive,
      updatedAt: serverTimestamp(),
    });

    setProject((prev) =>
      prev
        ? {
            ...prev,
            stageArchive: nextArchive,
          }
        : prev
    );

    setSelectedResourceItem((prev) => (prev?.id === itemId ? null : prev));
  };

  const handleSaveArchiveItemMeta = async () => {
    if (!selectedResourceItem?.id) return;

    try {
      setArchiveEditorBusy(true);

      await updateArchiveItemInProject(selectedResourceItem.id, {
        title:
          archiveEditorTitle.trim() || selectedResourceItem.title || 'Untitled',
        shortLabel:
          archiveEditorTitle.trim() ||
          selectedResourceItem.shortLabel ||
          'Untitled',
        visibility: archiveEditorVisibility,
      });
    } catch (err) {
      console.error('Failed to update archive item metadata:', err);
      alert('Failed to save archive item changes.');
    } finally {
      setArchiveEditorBusy(false);
    }
  };

  const handleDeleteArchiveItem = async () => {
    if (!selectedResourceItem?.id) return;

    const confirmed = window.confirm(
      'Delete this archive item? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setArchiveEditorBusy(true);
      await deleteArchiveItemFromProject(selectedResourceItem.id);
    } catch (err) {
      console.error('Failed to delete archive item:', err);
      alert('Failed to delete archive item.');
    } finally {
      setArchiveEditorBusy(false);
    }
  };

  const saveRevealSettings = async (overrides = {}) => {
    if (!project?.id) return;

    const projectRef = doc(db, 'projects', project.id);

    const nextChecklist = overrides.checklist ?? revealChecklist;

    const nextReveal = {
      ...(project?.soundlegendReveal || {}),
      coverTitle: overrides.coverTitle ?? revealCoverTitle,
      coverSubtitle: overrides.coverSubtitle ?? revealCoverSubtitle,
      coverMediaUrl: overrides.coverMediaUrl ?? revealCoverMediaUrl,
      coverMediaTitle: overrides.coverMediaTitle ?? revealCoverMediaTitle,
      coverMediaType: overrides.coverMediaType ?? revealCoverMediaType,
      coverBrightness: overrides.coverBrightness ?? revealCoverBrightness,
      coverSaturation: overrides.coverSaturation ?? revealCoverSaturation,
      coverBlackFloor: overrides.coverBlackFloor ?? revealCoverBlackFloor,
      coverSmokeOpacity: overrides.coverSmokeOpacity ?? revealCoverSmokeOpacity,
      coverDesktopPositionX:
        overrides.coverDesktopPositionX ?? revealCoverDesktopPositionX,
      coverMobilePositionX:
        overrides.coverMobilePositionX ?? revealCoverMobilePositionX,
      coverDesktopScale: overrides.coverDesktopScale ?? revealCoverDesktopScale,
      coverMobileScale: overrides.coverMobileScale ?? revealCoverMobileScale,
      adminChecklist: nextChecklist,
      shippingStatus:
        overrides.shippingStatus ?? legacyShippingStatus ?? 'waiting_to_ship',
      shippingCarrier: overrides.shippingCarrier ?? legacyShippingCarrier ?? '',
      trackingNumber: overrides.trackingNumber ?? legacyTrackingNumber ?? '',
      shippedAt: overrides.shippedAt ?? legacyShippedAt ?? '',
      deliveredAt: overrides.deliveredAt ?? legacyDeliveredAt ?? '',
      undeliverableAt: overrides.undeliverableAt ?? legacyUndeliverableAt ?? '',
      finalAdminNote:
        overrides.finalAdminNote ??
        project?.soundlegendReveal?.finalAdminNote ??
        '',
      revealReady:
        overrides.revealReady ?? Object.values(nextChecklist).every(Boolean),
      revealDeployed:
        overrides.revealDeployed ??
        project?.soundlegendReveal?.revealDeployed ??
        false,
      deployedAt:
        overrides.deployedAt ?? project?.soundlegendReveal?.deployedAt ?? null,
    };

    await updateDoc(projectRef, {
      soundlegendReveal: nextReveal,
      updatedAt: serverTimestamp(),
    });

    setProject((prev) =>
      prev
        ? {
            ...prev,
            soundlegendReveal: nextReveal,
          }
        : prev
    );
  };

  const handleRevealChecklistToggle = async (key) => {
    const nextChecklist = {
      ...revealChecklist,
      [key]: !revealChecklist[key],
    };

    setRevealChecklist(nextChecklist);

    try {
      setRevealPanelBusy(true);
      await saveRevealSettings({ checklist: nextChecklist });
    } catch (err) {
      console.error('Failed to update reveal checklist:', err);
      alert('Failed to update reveal checklist.');
    } finally {
      setRevealPanelBusy(false);
    }
  };

  const handleSaveRevealPanel = async () => {
    try {
      setRevealPanelBusy(true);
      await saveRevealSettings();
    } catch (err) {
      console.error('Failed to save reveal settings:', err);
      alert('Failed to save reveal settings.');
    } finally {
      setRevealPanelBusy(false);
    }
  };

  const handleDeployReveal = async () => {
    if (!revealChecklistComplete) {
      alert('Complete all reveal checklist items before deploying.');
      return;
    }

    try {
      setRevealPanelBusy(true);

      await saveRevealSettings({
        revealReady: true,
        revealDeployed: true,
        deployedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to deploy reveal:', err);
      alert('Failed to deploy SoundLegend reveal.');
    } finally {
      setRevealPanelBusy(false);
    }
  };

  const handleHideReveal = async () => {
    try {
      setRevealPanelBusy(true);

      await saveRevealSettings({
        revealDeployed: false,
        // optional: also mark not-ready if you want to force re-review
        // revealReady: false,
        deployedAt: null,
      });
    } catch (err) {
      console.error('Failed to hide reveal:', err);
      alert('Failed to hide SoundLegend cover.');
    } finally {
      setRevealPanelBusy(false);
    }
  };

  const updateStageArchiveItemsForStage = async (stageKey, updater) => {
    if (!project?.id || !stageKey) return;

    const projectRef = doc(db, 'projects', project.id);

    const existingArchive =
      project?.stageArchive && typeof project.stageArchive === 'object'
        ? project.stageArchive
        : {};

    const existingStageItems = Array.isArray(existingArchive?.[stageKey])
      ? existingArchive[stageKey]
      : [];

    const nextStageItems = updater(existingStageItems);

    await updateDoc(projectRef, {
      [`stageArchive.${stageKey}`]: nextStageItems,
      updatedAt: serverTimestamp(),
    });

    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stageArchive: {
          ...(prev.stageArchive || {}),
          [stageKey]: nextStageItems,
        },
      };
    });

    return nextStageItems;
  };

  const handleArchiveRename = async (item, nextTitle) => {
    if (!item?.stageKey || !item?.id) return;
    const safeTitle = String(nextTitle || '').trim();
    if (!safeTitle) return;

    await updateStageArchiveItemsForStage(item.stageKey, (items) =>
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              title: safeTitle,
            }
          : entry
      )
    );

    setSelectedResourceItem((prev) =>
      prev && prev.id === item.id ? { ...prev, title: safeTitle } : prev
    );
  };

  const handleArchiveVisibilityChange = async (item, nextVisibility) => {
    if (!item?.stageKey || !item?.id) return;

    await updateStageArchiveItemsForStage(item.stageKey, (items) =>
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              visibility: nextVisibility,
              hidden: nextVisibility === ARCHIVE_VISIBILITY.ADMIN,
            }
          : entry
      )
    );

    setSelectedResourceItem((prev) =>
      prev && prev.id === item.id
        ? {
            ...prev,
            visibility: nextVisibility,
            hidden: nextVisibility === ARCHIVE_VISIBILITY.ADMIN,
          }
        : prev
    );
  };

  const handleArchiveDelete = async (item) => {
    if (!item?.stageKey || !item?.id) return;

    const confirmed = window.confirm(
      'Delete this archive file? This removes it from the project archive.'
    );
    if (!confirmed) return;

    await updateStageArchiveItemsForStage(item.stageKey, (items) =>
      items.filter((entry) => entry.id !== item.id)
    );

    setSelectedResourceItem((prev) =>
      prev && prev.id === item.id ? null : prev
    );
  };

  const paymentReceivedAt =
    project?.paymentReceivedAt ||
    project?.depositPaidAt ||
    project?.commitmentPaidAt ||
    null;

  const chapter2Complete =
    project?.commitmentPortal?.completed === true ||
    project?.chapter2Complete === true ||
    false;

  const shouldShowTargetWindow = !!paymentReceivedAt && chapter2Complete;

  const uploadArchiveFiles = async (fileList) => {
    if (!isAdmin) return;
    if (!project?.id) return;
    if (!fileList?.length) return;
    if (!selectedArchiveCapture) {
      alert('Please choose a suggested capture first.');
      return;
    }

    const stageDefinition = getStageArchiveDefinition(activeStep?.key);
    if (!stageDefinition) return;

    try {
      setArchiveUploading(true);
      setArchiveUploadProgress(0);

      for (const file of Array.from(fileList)) {
        const safeFileName = buildArchiveFilename({
          file,
          capture: selectedArchiveCapture,
          stageDefinition,
          projectLike: project,
        });

        const storagePath = [
          'projects',
          project.id,
          'stageArchive',
          activeStep.key,
          safeFileName,
        ].join('/');

        const fileRef = storageRef(storage, storagePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        const downloadUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = snapshot.totalBytes
                ? Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                  )
                : 0;
              setArchiveUploadProgress(pct);
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });

        const detectedMediaType =
          selectedArchiveCapture.key === 'other'
            ? getArchiveMediaTypeFromFile(file)
            : selectedArchiveCapture.mediaType ||
              getArchiveMediaTypeFromFile(file);

        const resolvedVisibility = isAdmin
          ? ARCHIVE_VISIBILITY.ADMIN
          : selectedArchiveCapture.visibility || ARCHIVE_VISIBILITY.CUSTOMER;

        const resolvedTitle =
          selectedArchiveCapture.key === 'other'
            ? file.name.replace(/\.[^/.]+$/, '')
            : selectedArchiveCapture.label;

        const archiveItem = {
          id: `${activeStep.key}-${selectedArchiveCapture.key}-${Date.now()}`,
          title: resolvedTitle,
          captureKey: selectedArchiveCapture.key,
          shortLabel:
            selectedArchiveCapture.shortLabel || selectedArchiveCapture.label,
          fileName: safeFileName,
          originalFileName: file.name,
          url: downloadUrl,
          type: detectedMediaType,
          mediaType: detectedMediaType,
          visibility: resolvedVisibility,
          hidden: resolvedVisibility === ARCHIVE_VISIBILITY.ADMIN,
          stage: activeIndex + 1,
          stageKey: activeStep.key,
          category: 'stageArchive',
          uploadedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          adminTask: selectedArchiveCapture.adminTask || '',
          purpose: selectedArchiveCapture.purpose || '',
          angle: selectedArchiveCapture.angle || '',
          details: selectedArchiveCapture.details || [],
        };

        await saveArchiveItemToProject(archiveItem);
        setSelectedResourceItem(archiveItem);
      }

      setArchiveUploadProgress(100);
    } catch (err) {
      console.error('Archive upload failed:', err);
      alert('Archive upload failed. Check console for details.');
    } finally {
      setTimeout(() => setArchiveUploadProgress(0), 600);
      setArchiveUploading(false);
    }
  };

  const handleArchiveFileInputChange = async (event) => {
    const files = event.target.files;
    await uploadArchiveFiles(files);
    event.target.value = '';
  };

  const handleArchiveDragOver = (event) => {
    if (!isAdmin) return;
    event.preventDefault();
    setArchiveIsDragging(true);
  };

  const handleArchiveDragLeave = (event) => {
    if (!isAdmin) return;
    event.preventDefault();
    setArchiveIsDragging(false);
  };

  const handleArchiveDrop = async (event) => {
    if (!isAdmin) return;
    event.preventDefault();
    setArchiveIsDragging(false);
    const files = event.dataTransfer?.files;
    await uploadArchiveFiles(files);
  };

  if (loading && !project) {
    return (
      <div className="sl-progress sl-progress--loading-screen">
        <div className="sl-progress-loading-shell">
          <div className="sl-progress-loading-spinner" />
          <div className="sl-progress-loading-title">
            Loading project stage data...
          </div>
          <div className="sl-progress-loading-text">
            Please wait while we prepare your stage timeline and media.
          </div>
        </div>
      </div>
    );
  }

  if (!project || !getProjectProgressIdentity(project)) {
    return (
      <div className="sl-progress sl-progress--empty">
        <div className="sl-progress-loading-shell">
          <div className="sl-progress-loading-title">
            Your build workspace is not available yet
          </div>
          <div className="sl-progress-loading-text">
            Once your SoundLegend project is officially created and assigned,
            your chapter timeline, build media, and project story will appear
            here.
          </div>
        </div>
      </div>
    );
  }

  if (!allStageMediaReady) {
    return (
      <div className="sl-progress sl-progress--loading-screen">
        <div className="sl-progress-loading-shell">
          <div className="sl-progress-loading-spinner" />
          <div className="sl-progress-loading-title">
            Loading project stage data...
          </div>
          <div className="sl-progress-loading-text">
            Please wait while we prepare your stage timeline and media.
          </div>
          <div className="sl-progress-loading-meta">
            {loadedAssetCount < STEPS.length
              ? `Fetching stage media references... ${loadedAssetCount}/${STEPS.length}`
              : loadedAssetCount < Math.max(totalAssetCount, 1)
                ? 'Preloading stage imagery...'
                : 'Finalizing experience...'}
          </div>

          <div className="sl-progress-loading-percent">
            {Math.min(
              100,
              Math.round(
                (loadedAssetCount / Math.max(totalAssetCount, 1)) * 100
              )
            )}
            %
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-progress">
      <section className="sl-progress-build-summary">
        <div className="sl-progress-main-shell">
          <div className="sl-progress-build-summary-stage sl-progress-build-summary-stage--hero">
            <div className="sl-progress-build-summary-stage-copy">
              <div className="sl-progress-build-summary-stage-kicker">
                {isProjectComplete ? 'Legacy Status' : 'Build Roadmap'}
              </div>

              <div className="sl-progress-build-summary-stage-title">
                {isProjectComplete
                  ? shippingSummary.headline
                  : isLegacyChapter
                    ? 'Legacy Chapter • From Ober Artisan'
                    : currentStageLabel}
              </div>

              <div className="sl-progress-build-summary-stage-subtitle">
                {isProjectComplete
                  ? shippingSummary.deliveryStatus
                  : isLegacyChapter
                    ? 'Final handoff • Story now belongs to the artist'
                    : currentStepLabel}
              </div>
            </div>

            <div className="sl-progress-build-summary-track-shell">
              <div className="sl-progress-build-summary-track">
                <div
                  className="sl-progress-build-summary-track-fill"
                  style={{ width: `${overallPct}%` }}
                />
                <div
                  className="sl-progress-build-summary-track-glow"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>

            <div className="sl-progress-build-summary-stage-footer">
              <div className="sl-progress-build-summary-stage-target">
                <div className="sl-progress-build-summary-stage-target-label">
                  {isProjectComplete
                    ? 'Final Chapter'
                    : 'Target Completion Window'}
                </div>
                <div className="sl-progress-build-summary-stage-target-value">
                  {isProjectComplete
                    ? 'Legacy Chapter • From Ober Artisan'
                    : shouldShowTargetWindow
                      ? targetWindow || 'TBD'
                      : 'TBD'}
                </div>
              </div>

              <div className="sl-progress-build-summary-stage-percent-inline">
                <div className="sl-progress-build-summary-stage-percent-inline-value">
                  {overallPct}%
                </div>
                <div className="sl-progress-build-summary-stage-percent-inline-label">
                  {isProjectComplete ? 'Complete' : 'Progress'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="sl-progress-stage-stack">
        <div className="sl-progress-chapter-selector-bar">
          <div
            className="sl-progress-chapter-selector"
            aria-label="Chapter selection"
          >
            <div className="sl-progress-chapter-selector-inner">
              <div className="sl-progress-chapter-selector-title">
                Chapter Selection
              </div>

              <div className="sl-progress-chapter-selector-list">
                {chapterSelectorItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={[
                      'sl-progress-chapter-selector-item',
                      `is-${item.visualState}`,
                      item.isActive ? 'is-active' : '',
                      item.isLocked ? 'is-locked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (!item.isClickable) return;

                      const targetIndex = storyChapters.findIndex(
                        (chapter) => chapter.key === item.key
                      );
                      if (targetIndex >= 0) {
                        navigateToStageIndex(targetIndex);
                      }
                    }}
                    aria-pressed={item.isActive}
                    aria-disabled={item.isLocked}
                    disabled={item.isLocked}
                    title={item.title}
                  >
                    <span className="sl-progress-chapter-selector-label">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className={[
          'sl-progress-hero-carousel-shell',
          'is-unified-stage-shell',
          selectedStageThemeClass,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          ref={carouselWindowRef}
          className="sl-progress-hero-carousel-window"
        >
          <div className="sl-progress-hero-carousel-stage-rail is-single-panel">
            <div className="sl-progress-hero-carousel-center-slot">
              <div className="sl-progress-hero-carousel-media sl-progress-stage-card-media">
                {allRenderableStageLayers.length > 0 ? (
                  <div className="sl-progress-stage-image-stack">
                    {allRenderableStageLayers.map((layer) => {
                      const layerClassName = [
                        'sl-progress-stage-card-base-image',
                        'sl-progress-stage-card-base-image--stacked',
                        layer.isVisible ? 'is-visible' : 'is-hidden',
                      ].join(' ');

                      if (
                        layer.isCoverMedia &&
                        layer.coverMediaType === 'video'
                      ) {
                        return (
                          <video
                            key={layer.stageKey}
                            className={layerClassName}
                            src={layer.coverMediaUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            aria-hidden={!layer.isVisible}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: `${(layer.scale ?? 1) * 100}%`,
                              height: `${(layer.scale ?? 1) * 100}%`,
                              objectFit: 'cover',
                              objectPosition: `${layer.positionX ?? 50}% 50%`,
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              filter: `brightness(${layer.brightness ?? 0.72}) saturate(${layer.saturation ?? 1.02})`,
                            }}
                          />
                        );
                      }

                      return (
                        <img
                          key={layer.stageKey}
                          className={layerClassName}
                          src={
                            layer.isCoverMedia
                              ? layer.coverMediaUrl
                              : layer.baseImageUrl
                          }
                          alt={layer.isVisible ? `${layer.label} hero` : ''}
                          aria-hidden={!layer.isVisible}
                          loading="eager"
                          decoding="sync"
                          draggable={false}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: layer.isCoverMedia
                              ? `${(layer.scale ?? 1) * 100}%`
                              : '100%',
                            height: layer.isCoverMedia
                              ? `${(layer.scale ?? 1) * 100}%`
                              : '100%',
                            objectFit: 'cover',
                            objectPosition: layer.isCoverMedia
                              ? `${layer.positionX ?? 50}% 50%`
                              : '50% 50%',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            transformOrigin: 'center center',
                            filter: layer.isCoverMedia
                              ? `brightness(${layer.brightness ?? 0.72}) saturate(${layer.saturation ?? 1.02})`
                              : layer.mediaState === STAGE_MEDIA_STATE.COMPLETED
                                ? 'grayscale(0.42) saturate(0.82) contrast(1.02) brightness(0.9)'
                                : layer.mediaState === STAGE_MEDIA_STATE.CURRENT
                                  ? 'brightness(1.06) saturate(1.08)'
                                  : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="sl-progress-hero-side-preview-fallback" />
                )}

                {isCoverStageVisible ? (
                  <div
                    className="sl-progress-soundlegend-cover-background-crush"
                    style={{
                      opacity:
                        activeDisplayedLayer?.blackFloor ??
                        revealCoverBlackFloor ??
                        0.22,
                    }}
                  />
                ) : null}

                {(() => {
                  const activeInteractiveStep =
                    currentStageInteractiveSteps.find(
                      (step) =>
                        step.id === activeInteractiveStepId ||
                        `${activeStep.key}-timeline-${step.index}` ===
                          activeInteractiveStepId
                    ) || null;

                  if (!activeInteractiveStep) return null;

                  return (
                    <div className="sl-progress-stage-checkpoint-detail-card">
                      <div className="sl-progress-stage-storypoint-card-eyebrow">
                        Chapter page
                      </div>

                      <div className="sl-progress-stage-storypoint-card-title">
                        {activeInteractiveStep.label}
                      </div>

                      <p className="sl-progress-stage-storypoint-card-body">
                        {activeInteractiveStep.body}
                      </p>

                      <div className="sl-progress-stage-storypoint-card-meta">
                        <span className="sl-progress-stage-storypoint-card-pill">
                          {activeInteractiveStep.status}
                        </span>
                        <span className="sl-progress-stage-storypoint-card-pill">
                          {activeInteractiveStep.done}/
                          {activeInteractiveStep.total || 0} complete
                        </span>
                      </div>

                      <button
                        type="button"
                        className="sl-progress-stage-storypoint-card-close"
                        onClick={() => setActiveInteractiveStepId(null)}
                      >
                        Close
                      </button>
                    </div>
                  );
                })()}

                {sharedSmokeVideoUrl ? (
                  <video
                    className="sl-progress-shared-smoke-overlay"
                    src={sharedSmokeVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    style={{ opacity: smokeOverlayOpacity }}
                  />
                ) : null}

                <div
                  className="sl-progress-locked-stage-veil"
                  aria-hidden="true"
                  style={{ opacity: lockedStageVeilOpacity }}
                />

                {!allStageMediaReady ? (
                  <div className="sl-progress-stage-image-loading-veil" />
                ) : null}

                {canGoPrev ? (
                  <button
                    type="button"
                    className="sl-progress-carousel-arrow sl-progress-carousel-arrow--left"
                    onMouseEnter={() => {
                      if (eduPanelCloseTimerRef.current) {
                        clearTimeout(eduPanelCloseTimerRef.current);
                        eduPanelCloseTimerRef.current = null;
                      }
                    }}
                    onClick={goPrevStage}
                    disabled={carouselAnimating}
                    aria-label={`View previous stage: ${prevStep?.label || 'Previous stage'}`}
                  />
                ) : null}

                {canGoNext ? (
                  <button
                    type="button"
                    className="sl-progress-carousel-arrow sl-progress-carousel-arrow--right"
                    onMouseEnter={() => {
                      if (eduPanelCloseTimerRef.current) {
                        clearTimeout(eduPanelCloseTimerRef.current);
                        eduPanelCloseTimerRef.current = null;
                      }
                    }}
                    onClick={goNextStage}
                    disabled={carouselAnimating}
                    aria-label={`View next stage: ${nextStep?.label || 'Next stage'}`}
                  />
                ) : null}

                <div
                  className={`sl-progress-hero-overlay sl-progress-hero-overlay--center ${
                    isLegacyChapter ? 'sl-progress-hero-overlay--legacy' : ''
                  }`}
                >
                  {!isRevealCoverChapter ? (
                    <div className="sl-progress-stage-hero-status-caption">
                      {stageStatePresentation.pill}
                    </div>
                  ) : null}

                  <div className="sl-progress-stage-title-anchor">
                    {!isRevealCoverChapter ? (
                      <div className="sl-progress-stage-chapter-label">
                        {chapterLabel.toUpperCase()}
                      </div>
                    ) : null}

                    <div
                      className={`sl-progress-hero-title-stack ${
                        titleTransitioning ? 'is-transitioning' : ''
                      }`}
                    >
                      <div
                        className={`sl-progress-hero-title sl-progress-hero-title--center sl-progress-hero-title-layer sl-progress-hero-title-layer--current ${
                          titleTransitioning ? 'is-outgoing' : 'is-visible'
                        }`}
                      >
                        {displayTitleText}
                      </div>

                      <div
                        className={`sl-progress-hero-title sl-progress-hero-title--center sl-progress-hero-title-layer sl-progress-hero-title-layer--incoming ${
                          titleTransitioning ? 'is-incoming-visible' : ''
                        }`}
                      >
                        {incomingTitleText}
                      </div>
                    </div>

                    {currentStageStatus !== STAGE_MEDIA_STATE.FUTURE ? (
                      <div className="sl-progress-stage-title-story">
                        {chapterNarrative.sentences?.[0] ||
                          getStageSummary(activeStep)}
                      </div>
                    ) : null}
                  </div>

                  {!isLegacyChapter &&
                  showStageStorypoints &&
                  currentStageStorypoints.length > 0 ? (
                    <div
                      ref={storypointRailRef}
                      className="sl-progress-stage-learning-rail sl-progress-stage-learning-rail--anchored"
                    >
                      {currentStageStorypoints.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`sl-progress-stage-learning-pill ${
                            activeStorySectionId === item.id ? 'is-active' : ''
                          }`}
                          onClick={() => setActiveStorySectionId(item.id)}
                          aria-pressed={activeStorySectionId === item.id}
                        >
                          <span className="sl-progress-stage-learning-pill-icon">
                            {renderStorypointIcon(item.icon)}
                          </span>
                          <span className="sl-progress-stage-learning-pill-label">
                            {item.shortLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isLegacyChapter &&
      !isRevealCoverChapter &&
      showStageStorypoints &&
      activeStorypoint ? (
        <section className="sl-progress-story-book-section">
          <div
  className="sl-progress-story-book-shell"
  style={{
    backgroundImage:
      "linear-gradient(180deg, rgba(248, 240, 224, 0.82), rgba(232, 220, 198, 0.86)), url('/story-pages/page2.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
  }}
>
        <div className="sl-progress-story-book-header">
  <div className="sl-progress-story-book-kicker">
    {chapterLabel}
  </div>
  <h3 className="sl-progress-story-book-title">
    {activeStorypoint.id === 'overview'
      ? 'Chapter Overview'
      : activeStorypoint.id === 'build-notes'
        ? 'Build Notes'
        : 'Archive'}
  </h3>
  <div className="sl-progress-story-book-subtitle">
    {activeStep?.label || activeStep?.adminMainTitle}
  </div>
</div>

            {renderActiveStorySection({
              activeStorypoint,
              chapterNarrative,
              currentChapterProgressData,
              activeStep,
              project,
              setProject,
              isAdmin,
              activeStageArchiveDefinition,
              activeStageArchiveItems,
              selectedArchiveCaptureKey,
              setSelectedArchiveCaptureKey,
              selectedArchiveCapture,
              archiveUploading,
              archiveUploadProgress,
              openArchiveFilePicker,
              getArchiveVisibilityLabel,
              setSelectedResourceItem,
            })}
          </div>
        </section>
      ) : null}

      {isLegacyChapter && isAdmin ? (
        <section className="sl-progress-legacy-admin-shell">
          <div className="sl-progress-legacy-admin-section-header">
            <div className="sl-progress-legacy-admin-section-kicker">
              Legacy Chapter Admin
            </div>
            <div className="sl-progress-legacy-admin-section-title">
              Final handoff controls
            </div>
            <div className="sl-progress-legacy-admin-section-subtitle">
              Manage post-build shipping details and the SoundLegend reveal
              experience from one unified admin section.
            </div>
          </div>

          <div className="sl-progress-legacy-admin-panels">
            <div className="sl-progress-legacy-admin-card">
              <div className="sl-progress-legacy-admin-eyebrow">
                Shipping & Delivery
              </div>

              <div className="sl-progress-legacy-admin-title">
                Control post-build shipping status
              </div>

              <div className="sl-progress-legacy-admin-body">
                These fields control the completed project summary shown to the
                customer once the build is finished.
              </div>

              <div className="sl-progress-legacy-admin-grid">
                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Shipping status
                  </label>
                  <select
                    className="sl-progress-legacy-admin-select"
                    value={legacyShippingStatus}
                    onChange={(e) => setLegacyShippingStatus(e.target.value)}
                  >
                    <option value="waiting_to_ship">
                      Waiting to be Shipped
                    </option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="undeliverable">Undeliverable</option>
                  </select>
                </div>

                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Carrier
                  </label>
                  <select
                    className="sl-progress-legacy-admin-select"
                    value={legacyShippingCarrier}
                    onChange={(e) => setLegacyShippingCarrier(e.target.value)}
                  >
                    <option value="">Select carrier</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--full">
                  <label className="sl-progress-legacy-admin-label">
                    Tracking number
                  </label>
                  <input
                    type="text"
                    className="sl-progress-legacy-admin-input"
                    value={legacyTrackingNumber}
                    onChange={(e) => setLegacyTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Shipped date
                  </label>
                  <input
                    type="date"
                    className="sl-progress-legacy-admin-input sl-progress-legacy-admin-input--date"
                    value={legacyShippedAt}
                    onChange={(e) => setLegacyShippedAt(e.target.value)}
                  />
                </div>

                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Delivered date
                  </label>
                  <input
                    type="date"
                    className="sl-progress-legacy-admin-input sl-progress-legacy-admin-input--date"
                    value={legacyDeliveredAt}
                    onChange={(e) => setLegacyDeliveredAt(e.target.value)}
                  />
                </div>

                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Undeliverable date
                  </label>
                  <input
                    type="date"
                    className="sl-progress-legacy-admin-input sl-progress-legacy-admin-input--date"
                    value={legacyUndeliverableAt}
                    onChange={(e) => setLegacyUndeliverableAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sl-progress-legacy-admin-card">
              <div className="sl-progress-legacy-admin-eyebrow">
                SoundLegend Reveal
              </div>

              <div className="sl-progress-legacy-admin-title">
                Deploy cover story before Chapter I
              </div>

              <div className="sl-progress-legacy-admin-body">
                When deployed, the SoundLegend cover becomes visible as the
                opening story panel before Chapter I for the customer.
              </div>

              <div className="sl-progress-legacy-admin-grid">
                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Cover title
                  </label>
                  <input
                    type="text"
                    className="sl-progress-legacy-admin-input"
                    value={revealCoverTitle}
                    onChange={(e) => setRevealCoverTitle(e.target.value)}
                    placeholder="Your SoundLegend Story"
                  />
                </div>

                <div className="sl-progress-legacy-admin-field">
                  <label className="sl-progress-legacy-admin-label">
                    Cover media type
                  </label>
                  <select
                    className="sl-progress-legacy-admin-select"
                    value={revealCoverMediaType}
                    onChange={(e) => setRevealCoverMediaType(e.target.value)}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--full">
                  <label className="sl-progress-legacy-admin-label">
                    Cover subtitle
                  </label>
                  <textarea
                    className="sl-progress-legacy-admin-textarea"
                    value={revealCoverSubtitle}
                    onChange={(e) => setRevealCoverSubtitle(e.target.value)}
                    placeholder="The completed journey of your custom instrument."
                    rows={3}
                  />
                </div>

                <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--full">
                  <label className="sl-progress-legacy-admin-label">
                    Select existing project media
                  </label>
                  <select
                    className="sl-progress-legacy-admin-select"
                    value={selectedExistingCoverId}
                    onChange={(e) =>
                      handleSelectExistingCoverMedia(e.target.value)
                    }
                  >
                    <option value="">Choose project media...</option>
                    {projectCoverMediaOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                        {item.stageKey
                          ? ` • ${toSentenceCaseLabel(item.stageKey)}`
                          : ''}
                        {item.type ? ` • ${item.type}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sl-progress-legacy-admin-actions">
                <button
                  type="button"
                  className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--ghost"
                  onClick={handleResetRevealCoverAdjustments}
                  disabled={revealPanelBusy}
                >
                  Reset image settings
                </button>

                <button
                  type="button"
                  className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--ghost"
                  onClick={handleSaveRevealPanel}
                  disabled={revealPanelBusy}
                >
                  {revealPanelBusy ? 'Saving…' : 'Save reveal settings'}
                </button>

                {revealData?.revealDeployed ? (
                  <button
                    type="button"
                    className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--ghost"
                    onClick={handleHideReveal}
                    disabled={revealPanelBusy}
                  >
                    {revealPanelBusy ? 'Updating…' : 'Hide SoundLegend cover'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--primary"
                    onClick={handleDeployReveal}
                    disabled={
                      revealPanelBusy ||
                      !revealCoverMediaUrl ||
                      !revealChecklistComplete
                    }
                  >
                    {revealPanelBusy
                      ? 'Deploying…'
                      : 'Deploy SoundLegend cover'}
                  </button>
                )}
              </div>

              {coverUploadError ? (
                <div className="sl-progress-legacy-admin-status sl-progress-legacy-admin-status--error">
                  {coverUploadError}
                </div>
              ) : null}

              <div className="sl-progress-legacy-admin-preview-grid">
                <div className="sl-progress-legacy-admin-preview">
                  <div className="sl-progress-legacy-admin-preview-label">
                    Desktop Preview
                  </div>
                  <SoundLegendCoverHero
                    title={revealCoverTitle}
                    subtitle={revealCoverSubtitle}
                    mediaUrl={revealCoverMediaUrl}
                    mediaType={revealCoverMediaType}
                    mediaTitle={revealCoverMediaTitle}
                    smokeVideoUrl={sharedSmokeVideoUrl}
                    isPreview={false}
                    brightness={revealCoverBrightness}
                    saturation={revealCoverSaturation}
                    blackFloor={revealCoverBlackFloor}
                    smokeOpacity={revealCoverSmokeOpacity}
                    positionX={revealCoverDesktopPositionX}
                    scale={revealCoverDesktopScale}
                  />
                </div>

                <div className="sl-progress-legacy-admin-preview sl-progress-legacy-admin-preview--mobile">
                  <div className="sl-progress-legacy-admin-preview-label">
                    Mobile Preview
                  </div>
                  <div className="sl-progress-legacy-admin-phone-shell">
                    <div className="sl-progress-legacy-admin-phone-island" />
                    <SoundLegendCoverHero
                      title={revealCoverTitle}
                      subtitle={revealCoverSubtitle}
                      mediaUrl={revealCoverMediaUrl}
                      mediaType={revealCoverMediaType}
                      mediaTitle={revealCoverMediaTitle}
                      smokeVideoUrl={sharedSmokeVideoUrl}
                      isPreview={false}
                      brightness={revealCoverBrightness}
                      saturation={revealCoverSaturation}
                      blackFloor={revealCoverBlackFloor}
                      smokeOpacity={revealCoverSmokeOpacity}
                      positionX={revealCoverMobilePositionX}
                      scale={revealCoverMobileScale}
                    />
                  </div>
                </div>
              </div>

              <div className="sl-progress-legacy-editor-tools">
                <div className="sl-progress-legacy-editor-group sl-progress-legacy-editor-group--image">
                  <div className="sl-progress-legacy-editor-group-header">
                    <div className="sl-progress-legacy-editor-group-kicker">
                      Image Treatment
                    </div>
                    <div className="sl-progress-legacy-editor-group-title">
                      Global cover look
                    </div>
                  </div>

                  <div className="sl-progress-legacy-editor-slider-grid">
                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Smoke Overlay
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverSmokeOpacity}
                        onChange={(e) =>
                          setRevealCoverSmokeOpacity(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverSmokeOpacity.toFixed(2)}
                      </div>
                    </div>

                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Brightness
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverBrightness}
                        onChange={(e) =>
                          setRevealCoverBrightness(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverBrightness.toFixed(2)}
                      </div>
                    </div>

                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Black Floor
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1.0"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverBlackFloor}
                        onChange={(e) =>
                          setRevealCoverBlackFloor(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverBlackFloor.toFixed(2)}
                      </div>
                    </div>

                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Saturation
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverSaturation}
                        onChange={(e) =>
                          setRevealCoverSaturation(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverSaturation.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sl-progress-legacy-editor-group sl-progress-legacy-editor-group--desktop">
                  <div className="sl-progress-legacy-editor-group-header">
                    <div className="sl-progress-legacy-editor-group-kicker">
                      Desktop Framing
                    </div>
                    <div className="sl-progress-legacy-editor-group-title">
                      Desktop preview position + zoom
                    </div>
                  </div>

                  <div className="sl-progress-legacy-editor-slider-grid sl-progress-legacy-editor-slider-grid--dual">
                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Desktop X Position
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverDesktopPositionX}
                        onChange={(e) =>
                          setRevealCoverDesktopPositionX(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverDesktopPositionX}%
                      </div>
                    </div>

                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Desktop Zoom
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="1.8"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverDesktopScale}
                        onChange={(e) =>
                          setRevealCoverDesktopScale(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverDesktopScale.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sl-progress-legacy-editor-group sl-progress-legacy-editor-group--mobile">
                  <div className="sl-progress-legacy-editor-group-header">
                    <div className="sl-progress-legacy-editor-group-kicker">
                      Mobile Framing
                    </div>
                    <div className="sl-progress-legacy-editor-group-title">
                      Mobile preview position + zoom
                    </div>
                  </div>

                  <div className="sl-progress-legacy-editor-slider-grid sl-progress-legacy-editor-slider-grid--dual">
                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Mobile X Position
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverMobilePositionX}
                        onChange={(e) =>
                          setRevealCoverMobilePositionX(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverMobilePositionX}%
                      </div>
                    </div>

                    <div className="sl-progress-legacy-admin-field sl-progress-legacy-admin-field--slider">
                      <label className="sl-progress-legacy-admin-label">
                        Mobile Zoom
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="1.8"
                        step="0.01"
                        className="sl-progress-legacy-admin-range"
                        value={revealCoverMobileScale}
                        onChange={(e) =>
                          setRevealCoverMobileScale(Number(e.target.value))
                        }
                      />
                      <div className="sl-progress-legacy-admin-range-value">
                        {revealCoverMobileScale.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sl-progress-legacy-admin-checklist">
                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.coverMediaSelected ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('coverMediaSelected')
                  }
                >
                  Cover media selected
                </button>

                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.chapterMediaReviewed ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('chapterMediaReviewed')
                  }
                >
                  Chapter media reviewed
                </button>

                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.visibilityReviewed ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('visibilityReviewed')
                  }
                >
                  Visibility reviewed
                </button>

                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.customerStoryApproved ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('customerStoryApproved')
                  }
                >
                  Customer story approved
                </button>

                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.shipmentConfirmed ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('shipmentConfirmed')
                  }
                >
                  Shipment confirmed
                </button>

                <button
                  type="button"
                  className={`sl-progress-legacy-check ${
                    revealChecklist.finalReviewComplete ? 'is-complete' : ''
                  }`}
                  onClick={() =>
                    handleRevealChecklistToggle('finalReviewComplete')
                  }
                >
                  Final review complete
                </button>
              </div>

              <div className="sl-progress-legacy-admin-actions">
                <button
                  type="button"
                  className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--ghost"
                  onClick={handleSaveRevealPanel}
                  disabled={revealPanelBusy}
                >
                  {revealPanelBusy ? 'Saving…' : 'Save reveal settings'}
                </button>

                {revealData?.revealDeployed ? (
                  <button
                    type="button"
                    className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--ghost"
                    onClick={handleHideReveal}
                    disabled={revealPanelBusy}
                  >
                    {revealPanelBusy ? 'Updating…' : 'Hide SoundLegend cover'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sl-progress-legacy-admin-btn sl-progress-legacy-admin-btn--primary"
                    onClick={handleDeployReveal}
                    disabled={
                      revealPanelBusy ||
                      !revealCoverMediaUrl ||
                      !revealChecklistComplete
                    }
                  >
                    {revealPanelBusy
                      ? 'Deploying…'
                      : 'Deploy SoundLegend cover'}
                  </button>
                )}
              </div>

              <div className="sl-progress-legacy-admin-status">
                {revealData?.revealDeployed
                  ? 'Cover reveal is live and will appear before Chapter I.'
                  : 'Cover reveal is currently hidden. Saved settings are preserved until you deploy it again.'}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <input
        id="stage-archive-file-input"
        ref={archiveFileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleArchiveFileInputChange}
      />

      <input
        ref={coverRevealFileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleCoverRevealFileInputChange}
      />

      <StageResourceViewerModal
        item={selectedResourceItem}
        onClose={() => setSelectedResourceItem(null)}
        isAdmin={isAdmin}
        archiveEditorTitle={archiveEditorTitle}
        setArchiveEditorTitle={setArchiveEditorTitle}
        archiveEditorVisibility={archiveEditorVisibility}
        setArchiveEditorVisibility={setArchiveEditorVisibility}
        archiveEditorBusy={archiveEditorBusy}
        onSaveMeta={handleSaveArchiveItemMeta}
        onDelete={handleDeleteArchiveItem}
      />
    </div>
  );
};

export default ProjectProgress;
