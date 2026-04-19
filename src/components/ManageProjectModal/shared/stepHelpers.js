import { CHECKPOINTS_BY_ITEM_ID } from '../../StepComponentTemplate';
import { defaultStepData } from '../../../utils/buildWorkflow';
import {
  STEP_KEYS,
  STEPKEY_TO_CHECKPOINT_PREFIX,
  STEP_META,
  buildPhases,
} from './constants';

export const val = (...candidates) =>
  candidates.find((v) => v !== undefined && v !== null && v !== '') ??
  undefined;

export const deriveCustomerName = (p = {}) =>
  val(
    p.customerName,
    p.customer?.name,
    p.customer?.displayName,
    p.publicPrefs?.displayName,
    p.customerInfo?.name,
    p.customerFullName
  ) || '';

export const deriveCustomerEmail = (p = {}) =>
  val(
    p.customerEmail,
    p.customer?.email,
    p.customerEmailAddress,
    p.email,
    p.customerInfo?.email
  ) || '';

export const getIdentifier = (p = {}) => {
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

export const getCheckpointListForSubstep = (stepKey, itemIndex, item) => {
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

export const getCheckpointCountForItem = (stepKey, itemIndex, item = {}) =>
  getCheckpointListForSubstep(stepKey, itemIndex, item).length;

export const normalizeCheckpointBooleans = (states, expectedCount = 0) => {
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

export const getSubstepLabelText = (item) => {
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

export const formatFullTime = (totalSeconds) => {
  const days = Math.floor(totalSeconds / 86400);
  const remainder = totalSeconds % 86400;
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return days > 0 ? `${days}d ${hh}h ${mm}m` : `${hh}h ${mm}m`;
};

export const ensureChecklistStructure = (data) => {
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

export function getGlobalActivePointer(data) {
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

      if (!isDone) return { stepKey, idx };
    }
  }

  return null;
}

export const determineOverallStatus = (data = {}) => {
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

export const determineCurrentPhase = (data = {}) => {
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