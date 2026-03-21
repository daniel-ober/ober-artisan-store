import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import { STAGES, STAGE_TEMPLATES } from '../../utils/workflowDefinitions';
import { PROJECT_STAGE_EDU } from '../../utils/projectStageEducation';
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
      eyebrow: 'Stage Completed',
      pill: 'Completed',
      helper: 'This phase is complete and now part of your build archive.',
    };
  }

  if (state === STAGE_MEDIA_STATE.CURRENT) {
    return {
      eyebrow: 'Stage In Progress',
      pill: 'In Progress',
      helper: 'This is the current active phase of your drum’s build.',
    };
  }

  if (state === STAGE_MEDIA_STATE.NEXT) {
    return {
      eyebrow: "A peek inside of what's up next",
      pill: 'Up Next',
      helper: 'This phase is coming next once the current stage is completed.',
    };
  }

  return {
    eyebrow: 'Future Stage (Locked)',
    pill: 'Locked',
    helper: 'This phase will unlock later in the build journey.',
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
                      <div className="pp-compact-desc">
                        {step.checkpoints?.[0]?.details?.[0] ||
                          step.checkpoints?.[0]?.label ||
                          'Checkpoint details will appear here.'}
                      </div>
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
    case 'progress':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <circle
            cx="12"
            cy="12"
            r="8.25"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.9"
          />
          <path
            d="M12 12 L16.5 9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      );

    case 'build':
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

function getStorypointsForStep(step, project = null) {
  if (!step) return [];

  const stageNumber = STAGE_MEDIA?.[step?.key]?.stageNumber || 0;
  const stageResources = getStageResourceItems(project, stageNumber);

  const resourceItems = [];

  if (stageResources.items.length) {
    resourceItems.push(
      `${stageResources.items.length} stage resource${
        stageResources.items.length === 1 ? '' : 's'
      } available`
    );
  }

  if (stageResources.signatureLink) {
    resourceItems.push('Document ready for signature');
  }

  if (stageResources.paymentLink) {
    resourceItems.push('Payment link available');
  }

  return [
    {
      id: 'progress',
      icon: 'progress',
      shortLabel: 'Progress',
      title: 'Chapter progress',
      body: 'Track where this chapter stands right now, including completion progress, estimated focused hours, target timing, and checkpoint status.',
    },
    {
      id: 'build',
      icon: 'build',
      shortLabel: 'Build',
      title: 'What happens in this chapter',
      body:
        step.what ||
        'This section explains what is physically happening in the build during this chapter.',
      data: {
        summary:
          step.what ||
          'This section explains what is physically happening in the build during this chapter.',
        techniques:
          Array.isArray(step.techniques) && step.techniques.length
            ? step.techniques
            : [],
        tools: Array.isArray(step.tools) && step.tools.length ? step.tools : [],
      },
    },
    {
      id: 'voice',
      icon: 'voice',
      shortLabel: 'Voice',
      title: 'Why it matters',
      body:
        step.why ||
        'This section explains how this chapter shapes the sound, feel, response, and identity of your drum.',
      data: {
        summary:
          step.why ||
          'This section explains how this chapter shapes the sound, feel, response, and identity of your drum.',
        affects: ['Sound', 'Feel', 'Response', 'Identity'],
        mantra:
          step.mantra ||
          'Every step in this process shapes the instrument’s final voice.',
      },
    },
    {
      id: 'archive',
      icon: 'archive',
      shortLabel: 'Archive',
      title: 'Media, documents, and chapter records',
      body:
        resourceItems.length > 0
          ? resourceItems.join(' • ')
          : 'Photos, videos, documents, approvals, and other chapter records will appear here as they are added.',
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
      const isStarted = checkpointDone > 0 || !!item.completed;
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

function StageResourceViewerModal({ item, onClose }) {
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

  const embedUrl = item.type === 'video' ? getVideoEmbedUrl(item.url) : null;
  const isImage = item.type === 'image';
  const isVideo = item.type === 'video';
  const isAudio = item.type === 'audio';
  const isPdf = item.type === 'document' && isPdfUrl(item.url);

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
              {formatResourceTypeLabel(item.type)}
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

          {item.type === 'document' ? (
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
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

const ProjectProgress = ({ project: initialProject, isAdmin = false }) => {
  const [project, setProject] = useState(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [activeKey, setActiveKey] = useState(STEPS[0].key);

  const [displayedStageKey, setDisplayedStageKey] = useState(STEPS[0].key);
  const [displayedOverlayStageKey, setDisplayedOverlayStageKey] = useState(
    STEPS[0].key
  );
  const [selectedStageMediaCache, setSelectedStageMediaCache] = useState({});

  const [hoveredStorypointId, sethoveredStorypointId] = useState(null);
  const [pinnedStorypointId, setpinnedStorypointId] = useState(null);
  const [activeInteractiveStepId, setActiveInteractiveStepId] = useState(null);

  const [carouselAnimating, setCarouselAnimating] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const [allStageMediaReady, setAllStageMediaReady] = useState(false);
  const [loadedAssetCount, setLoadedAssetCount] = useState(0);
  const [totalAssetCount, setTotalAssetCount] = useState(STEPS.length * 2);

  const [selectedResourceItem, setSelectedResourceItem] = useState(null);

  const [sharedSmokeVideoUrl, setSharedSmokeVideoUrl] = useState('');

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const eduPanelCloseTimerRef = useRef(null);

  const eduPanelRef = useRef(null);
  const storypointRailRef = useRef(null);

  const transitionLockRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDeltaXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [displayTitleText, setDisplayTitleText] = useState(
    (STEPS[0]?.label || '').toUpperCase()
  );
  const [incomingTitleText, setIncomingTitleText] = useState('');
  const [titleTransitioning, setTitleTransitioning] = useState(false);

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
    setActiveInteractiveStepId(null);
  }, [activeKey]);

  useEffect(() => {
    setSelectedResourceItem(null);
  }, [activeKey]);

  useEffect(() => {
    let cancelled = false;

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

  useEffect(() => {
    if (!project?.id) return;
    const def = STEPS[currentStepIndex] || STEPS[0];
    setActiveKey(def.key);

    if (!transitionLockRef.current) {
      setDisplayedStageKey(def.key);
      setDisplayedOverlayStageKey(def.key);
    }
  }, [project, currentStepIndex]);

  const openStorypoint = (id) => {
    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
      eduPanelCloseTimerRef.current = null;
    }
    sethoveredStorypointId(id);
  };

  const scheduleCloseStorypoint = () => {
    if (isTouchDevice || pinnedStorypointId) return;

    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
    }

    eduPanelCloseTimerRef.current = setTimeout(() => {
      sethoveredStorypointId(null);
    }, 180);
  };

  const closeStorypointNow = () => {
    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
      eduPanelCloseTimerRef.current = null;
    }
    sethoveredStorypointId(null);
    setpinnedStorypointId(null);
  };

  const togglePinnedStorypoint = (id) => {
    if (eduPanelCloseTimerRef.current) {
      clearTimeout(eduPanelCloseTimerRef.current);
      eduPanelCloseTimerRef.current = null;
    }

    setpinnedStorypointId((prev) => (prev === id ? null : id));
    sethoveredStorypointId(id);
  };

  useEffect(() => {
    const handlePointerDownOutside = (event) => {
      if (!pinnedStorypointId) return;

      const target = event.target;

      const clickedInsidePanel =
        eduPanelRef.current && eduPanelRef.current.contains(target);

      const clickedInsidestorypoints =
        storypointRailRef.current && storypointRailRef.current.contains(target);

      if (clickedInsidePanel || clickedInsidestorypoints) return;

      closeStorypointNow();
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [pinnedStorypointId]);

  const { stageLabel: currentStageLabel, stepLabel: currentStepLabel } =
    useMemo(() => getCurrentStageAndStepLabels(project), [project]);

  const activeStep = STEPS.find((s) => s.key === activeKey) || STEPS[0];
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  const chapterLabel = `Chapter ${toRomanChapter(activeIndex + 1)}`;

  const currentStageStorypoints = useMemo(
    () => getStorypointsForStep(activeStep, project),
    [activeStep, project]
  );

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
    if (!project || !currentStageTemplate) return [];

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
  }, [project, currentStageTemplate, activeStep.key]);

  const resolvedStorypointId = pinnedStorypointId || hoveredStorypointId;

  const activeStorypoint =
    currentStageStorypoints.find((item) => item.id === resolvedStorypointId) ||
    null;

  const stageResourceItems = useMemo(
    () => getStageResourceItems(project, activeIndex + 1),
    [project, activeIndex]
  );

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

  const prevStep = activeIndex > 0 ? STEPS[activeIndex - 1] : null;
  const nextStep =
    activeIndex < STEPS.length - 1 ? STEPS[activeIndex + 1] : null;

  const currentStageStatus = getSelectedStageMediaState(
    activeIndex,
    currentStepIndex
  );

  const stageStatePresentation = getStageStatePresentation(
    activeIndex,
    currentStepIndex
  );

  const isSelectedStageLocked = currentStageStatus === STAGE_MEDIA_STATE.FUTURE;

  const showStageStorypoints =
    currentStageStatus === STAGE_MEDIA_STATE.COMPLETED ||
    currentStageStatus === STAGE_MEDIA_STATE.CURRENT ||
    currentStageStatus === STAGE_MEDIA_STATE.NEXT;

  useEffect(() => {
    sethoveredStorypointId(null);
    setpinnedStorypointId(null);
  }, [activeKey, showStageStorypoints]);

  const displayedOverlayStageIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === displayedOverlayStageKey)
  );

  const displayedStageStatus = getSelectedStageMediaState(
    displayedOverlayStageIndex,
    currentStepIndex
  );

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

  const smokeOverlayOpacity =
    SMOKE_OPACITY_BY_STAGE_STATE[displayedStageStatus] ?? 0.6;

  const lockedStageVeilOpacity =
    VEIL_OPACITY_BY_STAGE_STATE[displayedStageStatus] ?? 0;

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

  const stageTarget = useMemo(
    () => getStageTargetDate(project, activeStep.key),
    [project, activeStep.key]
  );

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

  const getStageMediaForIndex = (stageIndex) => {
    if (stageIndex < 0 || stageIndex >= STEPS.length) return null;

    const step = STEPS[stageIndex];
    const mediaState = getSelectedStageMediaState(stageIndex, currentStepIndex);
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
    };
  };

  const allRenderableStageLayers = useMemo(() => {
    return STEPS.map((step, index) => {
      const media = getStageMediaForIndex(index);

      return {
        stageKey: step.key,
        baseImageUrl: media?.baseImageUrl || '',
        mediaState: media?.mediaState || STAGE_MEDIA_STATE.FUTURE,
        isVisible: displayedStageKey === step.key,
        label: step.label,
      };
    }).filter((layer) => !!layer.baseImageUrl);
  }, [displayedStageKey, selectedStageMediaCache, currentStepIndex]);

  const navigateToStageIndex = (targetIndex) => {
    if (transitionLockRef.current) return;
    if (targetIndex < 0 || targetIndex >= STEPS.length) return;
    if (targetIndex === activeIndex) return;

    const targetStep = STEPS[targetIndex];
    if (!targetStep) return;

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
    navigateToStageIndex(activeIndex - 1);
  };

  const goNextStage = () => {
    if (!canGoNext) return;
    navigateToStageIndex(activeIndex + 1);
  };

  const beginDrag = (clientX) => {
    if (carouselAnimating) return;
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragDeltaXRef.current = 0;
  };

  const updateDrag = (clientX) => {
    if (!isDraggingRef.current || carouselAnimating) return;

    const delta = clientX - dragStartXRef.current;
    dragDeltaXRef.current = delta;
    const clamped = Math.max(-120, Math.min(120, delta));
    setDragOffsetX(clamped);
  };

  const endDrag = () => {
    if (!isDraggingRef.current || carouselAnimating) return;

    const delta = dragDeltaXRef.current;
    const threshold = 70;

    isDraggingRef.current = false;
    setDragOffsetX(0);

    if (delta <= -threshold && canGoNext) {
      goNextStage();
      return;
    }

    if (delta >= threshold && canGoPrev) {
      goPrevStage();
      return;
    }

    dragDeltaXRef.current = 0;
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

  if (!project) {
    return (
      <div className="sl-progress sl-progress--empty">
        <p>Project not found.</p>
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
        <div className="sl-progress-build-summary-stage">
          <div className="sl-progress-build-summary-stage-top">
            <div className="sl-progress-build-summary-stage-copy">
              <div className="sl-progress-build-summary-stage-kicker">
                Build Roadmap
              </div>
              <div className="sl-progress-build-summary-stage-title">
                {currentStageLabel}
              </div>
              <div className="sl-progress-build-summary-stage-subtitle">
                Follow your drum’s build journey from concept to final
                delivery.{' '}
              </div>
            </div>

            <div className="sl-progress-build-summary-stage-percent">
              <div className="sl-progress-build-summary-stage-percent-value">
                {overallPct}%
              </div>
              <div className="sl-progress-build-summary-stage-percent-label">
                Progress
              </div>
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
        </div>

        <div className="sl-progress-build-summary-metrics">
          <div className="sl-progress-build-summary-metric is-featured">
            <div className="sl-progress-build-summary-metric-label">
              Current Chapter
            </div>
            <div className="sl-progress-build-summary-metric-value">
              {currentStageLabel}
            </div>
          </div>

          <div className="sl-progress-build-summary-metric">
            <div className="sl-progress-build-summary-metric-label">
              Current Chapter Step
            </div>
            <div className="sl-progress-build-summary-metric-value">
              {currentStepLabel}
            </div>
          </div>

          <div className="sl-progress-build-summary-metric">
            <div className="sl-progress-build-summary-metric-label">
              Project Target Completion Window
            </div>
            <div className="sl-progress-build-summary-metric-value">
              {targetWindow || 'TBD'}
            </div>
          </div>
        </div>
      </section>

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
          className="sl-progress-hero-carousel-window"
          onMouseDown={(e) => beginDrag(e.clientX)}
          onMouseMove={(e) => updateDrag(e.clientX)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => beginDrag(e.touches[0].clientX)}
          onTouchMove={(e) => updateDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
        >
          <div
            className="sl-progress-hero-carousel-stage-rail is-single-panel"
            style={{ transform: `translateX(${dragOffsetX * 0.08}px)` }}
          >
            <div className="sl-progress-hero-carousel-center-slot">
              <div className="sl-progress-hero-carousel-media sl-progress-stage-card-media">
                {allRenderableStageLayers.length > 0 ? (
                  <div className="sl-progress-stage-image-stack">
                    {allRenderableStageLayers.map((layer) => (
                      <img
                        key={layer.stageKey}
                        className={[
                          'sl-progress-stage-card-base-image',
                          'sl-progress-stage-card-base-image--stacked',
                          layer.isVisible ? 'is-visible' : 'is-hidden',
                        ].join(' ')}
                        src={layer.baseImageUrl}
                        alt={layer.isVisible ? `${layer.label} hero` : ''}
                        aria-hidden={!layer.isVisible}
                        loading="eager"
                        decoding="sync"
                        draggable={false}
                        style={{
                          filter:
                            layer.mediaState === STAGE_MEDIA_STATE.COMPLETED
                              ? 'grayscale(0.42) saturate(0.82) contrast(1.02) brightness(0.9)'
                              : layer.mediaState === STAGE_MEDIA_STATE.CURRENT
                                ? 'brightness(1.06) saturate(1.08)'
                                : 'none',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="sl-progress-hero-side-preview-fallback" />
                )}

                {activeStorypoint ? (
                  <div
                    ref={eduPanelRef}
                    className={`sl-progress-stage-edu-panel ${
                      activeStorypoint ? 'is-visible' : ''
                    }`}
                    onMouseEnter={() => {
                      if (
                        !isTouchDevice &&
                        activeStorypoint?.id &&
                        !pinnedStorypointId
                      ) {
                        openStorypoint(activeStorypoint.id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchDevice) scheduleCloseStorypoint();
                    }}
                  >
                    <div className="sl-progress-stage-edu-panel-inner">
                      <div
                        className="sl-progress-stage-edu-grain"
                        aria-hidden="true"
                      />

                      <div className="sl-progress-stage-edu-header">
                        <div className="sl-progress-stage-edu-kicker">
                          From the workshop
                        </div>

                        <button
                          type="button"
                          className="sl-progress-stage-edu-close"
                          onClick={closeStorypointNow}
                        >
                          Close
                        </button>
                      </div>

                      {activeStorypoint.id === 'progress' ? (
                        <div className="sl-progress-storypoint-progress">
                          <div className="sl-progress-storypoint-progress-grid">
                            <div className="sl-progress-storypoint-stat">
                              <div className="sl-progress-storypoint-stat-label">
                                Chapter status
                              </div>
                              <div className="sl-progress-storypoint-stat-value">
                                {currentChapterProgressData.status}
                              </div>
                            </div>

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
                                Est. focused hours
                              </div>
                              <div className="sl-progress-storypoint-stat-value">
                                {currentChapterProgressData.estHours}
                              </div>
                            </div>

                            <div className="sl-progress-storypoint-stat">
                              <div className="sl-progress-storypoint-stat-label">
                                Avg. turnaround
                              </div>
                              <div className="sl-progress-storypoint-stat-value">
                                {currentChapterProgressData.avgDays}
                              </div>
                            </div>

                            <div className="sl-progress-storypoint-stat">
                              <div className="sl-progress-storypoint-stat-label">
                                Current sub-step
                              </div>
                              <div className="sl-progress-storypoint-stat-value">
                                {currentChapterProgressData.currentSubStep}
                              </div>
                            </div>

                            <div className="sl-progress-storypoint-stat">
                              <div className="sl-progress-storypoint-stat-label">
                                Stage completion target
                              </div>
                              <div className="sl-progress-storypoint-stat-value">
                                {currentChapterProgressData.targetDate}
                              </div>
                            </div>
                          </div>

                          <div className="sl-progress-storypoint-checkpoints">
                            <div className="sl-progress-storypoint-checkpoints-header">
                              <div className="sl-progress-storypoint-checkpoints-label">
                                Workshop checkpoints
                              </div>
                              <div className="sl-progress-storypoint-checkpoints-count">
                                {
                                  currentChapterProgressData.completedCheckpoints
                                }
                                /{currentChapterProgressData.totalCheckpoints}{' '}
                                completed
                              </div>
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
                        </div>
                      ) : (
                        <p className="sl-progress-stage-edu-body">
                          {/* {activeStorypoint.body} */}
                        </p>
                      )}

                      {activeStorypoint.id === 'build' ? (
                        <div className="sl-progress-stage-storypoint-data-grid">
                          <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
                            <div className="sl-progress-stage-storypoint-data-label">
                              Chapter Summary
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
                              {activeStorypoint.data?.summary ||
                                'No build summary available yet.'}
                            </div>
                          </div>

                          <div className="sl-progress-stage-storypoint-data-card">
                            <div className="sl-progress-stage-storypoint-data-label">
                              Techniques Used
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--stack">
                              {activeStorypoint.data?.techniques?.length ? (
                                activeStorypoint.data.techniques.map(
                                  (item, index) => (
                                    <span
                                      key={`${item}-${index}`}
                                      className="sl-progress-stage-storypoint-tag"
                                    >
                                      {item}
                                    </span>
                                  )
                                )
                              ) : (
                                <span>No techniques added yet.</span>
                              )}
                            </div>
                          </div>

                          <div className="sl-progress-stage-storypoint-data-card">
                            <div className="sl-progress-stage-storypoint-data-label">
                              Tools Involved
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--stack">
                              {activeStorypoint.data?.tools?.length ? (
                                activeStorypoint.data.tools.map(
                                  (item, index) => (
                                    <span
                                      key={`${item}-${index}`}
                                      className="sl-progress-stage-storypoint-tag"
                                    >
                                      {item}
                                    </span>
                                  )
                                )
                              ) : (
                                <span>No tools added yet.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeStorypoint.id === 'voice' ? (
                        <div className="sl-progress-stage-storypoint-data-grid">
                          <div className="sl-progress-stage-storypoint-data-card sl-progress-stage-storypoint-data-card--full">
                            <div className="sl-progress-stage-storypoint-data-label">
                              Why this chapter matters
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
                              {activeStorypoint.data?.summary ||
                                'No stage impact summary available yet.'}
                            </div>
                          </div>

                          <div className="sl-progress-stage-storypoint-data-card">
                            <div className="sl-progress-stage-storypoint-data-label">
                              What this affects
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--stack">
                              {activeStorypoint.data?.affects?.length ? (
                                activeStorypoint.data.affects.map(
                                  (item, index) => (
                                    <span
                                      key={`${item}-${index}`}
                                      className="sl-progress-stage-storypoint-tag"
                                    >
                                      {item}
                                    </span>
                                  )
                                )
                              ) : (
                                <span>No impact categories added yet.</span>
                              )}
                            </div>
                          </div>

                          <div className="sl-progress-stage-storypoint-data-card">
                            <div className="sl-progress-stage-storypoint-data-label">
                              Stage mantra
                            </div>
                            <div className="sl-progress-stage-storypoint-data-value sl-progress-stage-storypoint-data-value--body">
                              {activeStorypoint.data?.mantra ||
                                'Every step in this process shapes the instrument’s final voice.'}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeStorypoint.id === 'archive' ? (
                        <div className="sl-progress-stage-edu-resource-list">
                          {stageResourceItems.items.length ? (
                            <div className="sl-progress-stage-edu-resource-grid">
                              {stageResourceItems.items.map((item, index) => {
                                const isImage = item.type === 'image';
                                const isVideo = item.type === 'video';

                                return (
                                  <button
                                    key={item.id || item.url || index}
                                    type="button"
                                    className={`sl-progress-stage-edu-resource-card is-${item.type}`}
                                    onClick={() =>
                                      setSelectedResourceItem(item)
                                    }
                                  >
                                    <div className="sl-progress-stage-edu-resource-thumb">
                                      {isImage ? (
                                        <img
                                          src={item.url}
                                          alt={
                                            item.title ||
                                            `Stage resource ${index + 1}`
                                          }
                                          className="sl-progress-stage-edu-resource-image"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="sl-progress-stage-edu-resource-filetype">
                                          {isVideo
                                            ? 'VIDEO'
                                            : item.type === 'audio'
                                              ? 'AUDIO'
                                              : 'DOC'}
                                        </div>
                                      )}
                                    </div>

                                    <div className="sl-progress-stage-edu-resource-meta">
                                      <div className="sl-progress-stage-edu-resource-title">
                                        {item.title || `Resource ${index + 1}`}
                                      </div>
                                      <div className="sl-progress-stage-edu-resource-subtitle">
                                        {item.category
                                          ? String(item.category).replace(
                                              /_/g,
                                              ' '
                                            )
                                          : item.type}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="sl-progress-stage-edu-resource-empty">
                              No media or stage-specific files have been added
                              for this chapter yet.
                            </div>
                          )}

                          {stageResourceItems.signatureLink ? (
                            <a
                              href={stageResourceItems.signatureLink}
                              target="_blank"
                              rel="noreferrer"
                              className="sl-progress-stage-edu-resource-link is-primary"
                            >
                              Review / sign document
                            </a>
                          ) : null}

                          {stageResourceItems.paymentLink ? (
                            <a
                              href={stageResourceItems.paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="sl-progress-stage-edu-resource-link is-primary"
                            >
                              Complete payment
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {(() => {
                  const activeInteractiveStep =
                    currentStageInteractiveSteps.find(
                      (step) => step.id === activeInteractiveStepId
                    ) || null;

                  if (!activeInteractiveStep) return null;

                  return (
                    <div className="sl-progress-stage-checkpoint-detail-card">
                      <div className="sl-progress-stage-storypoint-card-eyebrow">
                        Build checkpoint
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
                    onClick={goPrevStage}
                    disabled={carouselAnimating}
                    aria-label={`View previous stage: ${prevStep?.label || 'Previous stage'}`}
                  >
                    <span
                      className="sl-progress-carousel-arrow-glyph"
                      aria-hidden="true"
                    />
                  </button>
                ) : null}

                {canGoNext ? (
                  <button
                    type="button"
                    className="sl-progress-carousel-arrow sl-progress-carousel-arrow--right"
                    onClick={goNextStage}
                    disabled={carouselAnimating}
                    aria-label={`View next stage: ${nextStep?.label || 'Next stage'}`}
                  >
                    <span
                      className="sl-progress-carousel-arrow-glyph is-right"
                      aria-hidden="true"
                    />
                  </button>
                ) : null}

                <div className="sl-progress-hero-overlay sl-progress-hero-overlay--center">
                  <div className="sl-progress-stage-hero-status-caption">
                    {currentStageStatus === STAGE_MEDIA_STATE.COMPLETED
                      ? 'Chapter complete'
                      : currentStageStatus === STAGE_MEDIA_STATE.CURRENT
                        ? 'Chapter in progress'
                        : currentStageStatus === STAGE_MEDIA_STATE.NEXT
                          ? 'Next chapter ahead'
                          : 'Chapter unwritten'}
                  </div>

                  <div className="sl-progress-stage-title-anchor">
                    <div className="sl-progress-stage-chapter-label">
                      {chapterLabel}
                    </div>

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
                  </div>
                  {showStageStorypoints &&
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
                            resolvedStorypointId === item.id ? 'is-active' : ''
                          }`}
                          onMouseEnter={() => {
                            if (!isTouchDevice && !pinnedStorypointId)
                              openStorypoint(item.id);
                          }}
                          onMouseLeave={() => {
                            if (!isTouchDevice && !pinnedStorypointId)
                              scheduleCloseStorypoint();
                          }}
                          onFocus={() => {
                            if (!pinnedStorypointId) openStorypoint(item.id);
                          }}
                          onBlur={() => {
                            if (!isTouchDevice && !pinnedStorypointId)
                              scheduleCloseStorypoint();
                          }}
                          onClick={() => togglePinnedStorypoint(item.id)}
                          aria-pressed={pinnedStorypointId === item.id}
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
      <StageResourceViewerModal
        item={selectedResourceItem}
        onClose={() => setSelectedResourceItem(null)}
      />
    </div>
  );
};

export default ProjectProgress;
