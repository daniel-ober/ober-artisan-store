// src/utils/calculateProjectProgress.js

/**
 * calculateProjectProgress(project)
 *
 * Returns an integer 0–100 representing overall progress.
 *
 * ✅ Correct model for your system:
 * - Each of the 10 project steps has its own WEIGHT
 * - Each step’s completion is based on SUB-STEP checkpoint progress (not just “substep completed”)
 *   - Each checklist item (sub-step) contains checkpointStates: boolean[]
 *   - Step completion = (total checkpoints completed) / (total checkpoints)
 *   - If an item has no checkpointStates array, it falls back to item.completed as a single checkpoint.
 * - Overall progress = weighted average across steps
 *
 * ❌ We intentionally DO NOT time-weight progress.
 * Timers/totalSeconds are for "time spent" displays, not for % complete.
 *
 * Supports BOTH:
 * 1) Legacy schema keys (woodPreparation, shellConstruction, ... qualityCheck)
 * 2) NEW 10-step schema keys (discoveryDesign, commitmentPortal, ... finalQAPackagingDelivery)
 */

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/**
 * NEW 10-step key -> possible keys that might exist in Firestore (new OR legacy)
 * (This keeps your app compatible with older projects.)
 */
const STEP_ALIASES_NEW = {
  discoveryDesign: ["discoveryDesign", "woodPreparation"],
  commitmentPortal: ["commitmentPortal", "shellConstruction"],
  woodVisionLockIn: ["woodVisionLockIn", "fineTuning", "woodVision"],
  rawShellCreation: ["rawShellCreation", "shellExteriorFinish"],
  shellTrueingTorchTune: ["shellTrueingTorchTune", "bearingEdges"],
  exteriorArtFinish: ["exteriorArtFinish", "snareBedCutting"],
  edgesSnareBeds: ["edgesSnareBeds", "hardwareDrilling"],
  hardwareAssembly: ["hardwareAssembly"],
  legacyTuningMedia: ["legacyTuningMedia", "tuningAndDetailing", "tuningDetailing"],
  finalQAPackagingDelivery: ["finalQAPackagingDelivery", "qualityCheck"],
};

const STEP_ORDER_NEW = [
  "discoveryDesign",
  "commitmentPortal",
  "woodVisionLockIn",
  "rawShellCreation",
  "shellTrueingTorchTune",
  "exteriorArtFinish",
  "edgesSnareBeds",
  "hardwareAssembly",
  "legacyTuningMedia",
  "finalQAPackagingDelivery",
];

/**
 * Default weights
 * (These can be overridden by project.stepWeights or project.progressWeights if present)
 *
 * NOTE: weights do NOT need to sum to 100 — we normalize by totalWeight.
 */
const DEFAULT_STEP_WEIGHTS = {
  discoveryDesign: 6,
  commitmentPortal: 6,
  woodVisionLockIn: 8,
  rawShellCreation: 16,
  shellTrueingTorchTune: 14,
  exteriorArtFinish: 14,
  edgesSnareBeds: 10,
  hardwareAssembly: 10,
  legacyTuningMedia: 8,
  finalQAPackagingDelivery: 8,
};

function getStepWeights(project) {
  const candidates = [project?.stepWeights, project?.progressWeights];

  for (const obj of candidates) {
    if (!isPlainObject(obj)) continue;

    // Only accept if it has at least one known key with a finite number
    let ok = false;
    for (const k of STEP_ORDER_NEW) {
      const n = Number(obj[k]);
      if (Number.isFinite(n)) {
        ok = true;
        break;
      }
    }
    if (ok) return obj;
  }

  return DEFAULT_STEP_WEIGHTS;
}

function normalizeProjectForProgress(data) {
  if (!data) return data;
  const out = { ...data };

  const pickFirst = (keys) => {
    for (const k of keys) {
      const v = out[k];
      if (isPlainObject(v)) return v;
    }
    return null;
  };

  // Ensure NEW keys exist by pulling from either new or legacy keys
  Object.entries(STEP_ALIASES_NEW).forEach(([newKey, keys]) => {
    const stepObj = pickFirst(keys);
    if (!stepObj) return;
    if (!isPlainObject(out[newKey])) out[newKey] = stepObj;
  });

  // Map NEW -> legacy keys (so any older UI stays consistent)
  if (isPlainObject(out.discoveryDesign)) out.woodPreparation = out.discoveryDesign;
  if (isPlainObject(out.commitmentPortal)) out.shellConstruction = out.commitmentPortal;
  if (isPlainObject(out.woodVisionLockIn)) out.fineTuning = out.woodVisionLockIn;
  if (isPlainObject(out.rawShellCreation)) out.shellExteriorFinish = out.rawShellCreation;
  if (isPlainObject(out.shellTrueingTorchTune)) out.bearingEdges = out.shellTrueingTorchTune;
  if (isPlainObject(out.exteriorArtFinish)) out.snareBedCutting = out.exteriorArtFinish;
  if (isPlainObject(out.edgesSnareBeds)) out.hardwareDrilling = out.edgesSnareBeds;
  if (isPlainObject(out.legacyTuningMedia)) out.tuningAndDetailing = out.legacyTuningMedia;
  if (isPlainObject(out.finalQAPackagingDelivery)) out.qualityCheck = out.finalQAPackagingDelivery;

  return out;
}

function getStepChecklist(stepObj) {
  const checklist = stepObj?.checklist;
  return Array.isArray(checklist) ? checklist : [];
}

/**
 * We treat progress as checkpoint-based:
 * - If item.checkpointStates is a non-empty array:
 *     - each boolean is a checkpoint (true = complete)
 * - Else:
 *     - fall back to item.completed as a single checkpoint
 *
 * This is the key fix for your screenshots:
 * checking individual tasks (checkboxes) updates checkpointStates,
 * so overall progress must reflect partial completion within a sub-step.
 */
function getChecklistItemCheckpointStats(item) {
  if (!item || typeof item !== "object") return { done: 0, total: 0 };

  const cs = item.checkpointStates;

  if (Array.isArray(cs) && cs.length > 0) {
    let done = 0;
    for (const v of cs) if (v === true) done += 1;
    return { done, total: cs.length };
  }

  // fallback: treat item.completed as a single checkpoint
  const completed = item.completed === true || item.completed === "true";
  return { done: completed ? 1 : 0, total: 1 };
}

/**
 * Step completion: (completed checkpoints across all substeps) / (total checkpoints across all substeps)
 * Returns 0..1
 */
function computeStepCompletionPct(stepObj) {
  const checklist = getStepChecklist(stepObj);
  if (!checklist.length) return 0;

  let done = 0;
  let total = 0;

  for (const item of checklist) {
    const s = getChecklistItemCheckpointStats(item);
    done += s.done;
    total += s.total;
  }

  if (!total) return 0;
  return done / total;
}

/**
 * Overall progress: weighted average of step completion.
 * Only includes steps that exist as objects on the project and have a positive weight.
 */
function computeWeightedProgressPct(normalized) {
  const weights = getStepWeights(normalized);

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const stepKey of STEP_ORDER_NEW) {
    const stepObj = normalized?.[stepKey];
    if (!isPlainObject(stepObj)) continue;

    const stepWeightRaw = Number(weights?.[stepKey]);
    const stepWeight = Number.isFinite(stepWeightRaw) ? stepWeightRaw : 0;
    if (stepWeight <= 0) continue;

    const stepCompletion = computeStepCompletionPct(stepObj); // 0..1

    totalWeight += stepWeight;
    earnedWeight += stepWeight * stepCompletion;
  }

  if (!totalWeight) return 0;

  const pct = Math.round((earnedWeight / totalWeight) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Public API
 */
export function calculateProjectProgress(project) {
  const normalized = normalizeProjectForProgress(project || {});
  return computeWeightedProgressPct(normalized);
}

export default calculateProjectProgress;