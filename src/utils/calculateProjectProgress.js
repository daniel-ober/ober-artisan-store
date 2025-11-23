// src/utils/calculateProjectProgress.js

/**
 * Project progress calculation
 *
 * Priority:
 *  1) If a `lifecycle` object exists on the project, we treat that as
 *     the source of truth (stages → steps → checkpoints).
 *  2) If no lifecycle is present, we fall back to the older
 *     task-weighted checklist method using your step/checklist fields.
 *
 * This keeps things stable and allows Stage 8 (Hardware & Assembly)
 * with substeps + checkpoints to be fully represented without
 * blowing progress back to 0 or throwing runtime errors.
 */

/* ------------------------------------------------------------------ */
/*  Where to look for checklist items (legacy step-based method)       */
/* ------------------------------------------------------------------ */

const STEP_KEYS = [
  'discoveryDesign',
  'commitmentPortal',
  'woodVision',
  'shellConstruction',
  'fineTuning',
  'shellExteriorFinish',
  'bearingEdges',
  'snareBedCutting',
  'hardwareDrilling',
  'hardwareAssembly',
  'tuningAndDetailing',
  'qualityCheck',
];

/* ------------------------------------------------------------------ */
/*  Per-TASK weights (legacy method)                                  */
/*  NOTE: these values are normalized and rounded to sum to ~100%.     */
/* ------------------------------------------------------------------ */

const TASK_WEIGHTS_PERCENT = {
  // 1. Discovery & Design
  'Initial consultation': 0.66,
  'Build proposal': 1.09,

  // 2. Commitment & Portal Setup
  'Payment processing': 0.33,
  'Portal access setup': 0.44,

  // 3. Wood & Vision Lock-In
  'Wood selection': 1.75,
  'Early mockups': 1.42,
  'Pre-build measuring & prep': 2.07,

  // 4. Raw Shell Creation
  'Cut stave blocks to size': 6.99,
  'Cut stave bevels': 2.84,
  'Pre-glue test (dry-fit)': 0.66,
  'Glue-up & clamping': 2.84,
  'Glue curing': 0.0, // still tracked, but 0 weight

  // 5. Shell Trueing & Torch Tune
  'Exterior milling setup': 2.84,
  'Mill exterior diameter': 2.07,
  'Outer bevel reinforcement': 0.98,
  'Sanding prep (for veneer + interior)': 2.84,

  'Interior milling setup': 2.84,
  'Mill interior thickness': 2.84,
  'Inner bevel reinforcement': 1.09,
  'Sanding prep (interior)': 2.84,

  'Original torch tune process': 3.28,

  // 6. Exterior Art & Finish
  'Veneer application': 6.0,
  'Under-spray aesthetic work': 1.42,
  'Pre-finish full shell inspection': 1.09,
  'Badge + logo work': 4.26,
  'Spray finishing': 10.34, // adjusted slightly so total = 100.00
  'Full de-gassing of chemicals': 0.0, // 0 weight
  'Final sanding': 3.17,
  Polishing: 2.07,

  // 7. Edges & Snare Beds
  'Bearing edges': 1.53,
  'Snare beds': 1.97,

  // 8. Hardware & Assembly
  'Hardware + head assembly': 7.75,

  // 9. Legacy Tuning & Media
  'Legacy resonance analysis': 0.66,
  'Legacy tuning': 2.84,
  'Professional photos': 6.24,
  'Studio Legacy audio': 6.09,

  // 10. Final QA, Packaging & Delivery
  'NTAG authentication': 0.33,
  'Final cleaning': 0.33,
  Packaging: 0.76,
  'Delivery confirmation': 0.44,
};

/**
 * Sum of all task weights (should be ~100.00).
 * We still normalize to be robust to any future tweaks.
 */
const TOTAL_WEIGHT = Object.values(TASK_WEIGHTS_PERCENT).reduce(
  (sum, v) => sum + v,
  0
);

/* ------------------------------------------------------------------ */
/*  Helpers (legacy step-based)                                       */
/* ------------------------------------------------------------------ */

/**
 * Safely grab a step object from the project data.
 */
function getStep(data, key) {
  if (!data) return null;
  return data[key] || null;
}

/**
 * Search across all steps to find a checklist item whose label/task
 * matches the given label string.
 */
function findChecklistItemByLabel(projectData, label) {
  if (!projectData) return null;

  for (const stepKey of STEP_KEYS) {
    const step = getStep(projectData, stepKey);
    if (!step || !Array.isArray(step.checklist)) continue;

    const item = step.checklist.find((it) => {
      const t = (it.task || '').trim();
      const l = (it.label || '').trim();
      const target = label.trim();
      return t === target || l === target;
    });

    if (item) return item;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle-based progress (preferred path)                          */
/* ------------------------------------------------------------------ */

/**
 * Calculate progress based on lifecycle (stages → steps → checkpoints).
 * Returns a number 0–100, plus some internal counters if needed later.
 */
function calculateLifecycleProgress(project) {
  const lifecycle = project?.lifecycle;
  if (!lifecycle || !lifecycle.stages) {
    return { percent: 0, checkpointsDone: 0, checkpointsTotal: 0 };
  }

  let checkpointsTotal = 0;
  let checkpointsDone = 0;

  Object.values(lifecycle.stages).forEach((stage) => {
    if (!stage || !stage.steps) return;

    Object.values(stage.steps).forEach((step) => {
      if (!step || !step.checkpoints) return;

      Object.values(step.checkpoints).forEach((cp) => {
        if (!cp) return;
        checkpointsTotal += 1;
        if (cp.completed) checkpointsDone += 1;
      });
    });
  });

  if (checkpointsTotal === 0) {
    return { percent: 0, checkpointsDone: 0, checkpointsTotal: 0 };
  }

  const pct = (checkpointsDone / checkpointsTotal) * 100;
  const clamped = Math.max(0, Math.min(100, pct));

  return {
    percent: Math.round(clamped),
    checkpointsDone,
    checkpointsTotal,
  };
}

/* ------------------------------------------------------------------ */
/*  Step completion ratio (legacy step/checklist)                      */
/* ------------------------------------------------------------------ */

/**
 * Calculate completion ratio (0–1) for a single *step*,
 * based on the weights of the tasks inside that step.
 *
 * This uses the legacy checklist method and is still handy
 * if you want pre-build / build / post-build breakdowns.
 */
export function calculateStepCompletionRatio(projectData, stepKey) {
  const step = getStep(projectData, stepKey);
  if (!step || !Array.isArray(step.checklist) || step.checklist.length === 0) {
    return 0;
  }

  let stepTotalWeight = 0;
  let stepDoneWeight = 0;

  step.checklist.forEach((item) => {
    const label = (item.label || item.task || '').trim();
    const w =
      TASK_WEIGHTS_PERCENT[label] !== undefined
        ? TASK_WEIGHTS_PERCENT[label]
        : 0;

    if (w <= 0) return; // ignore zero-weight tasks in ratio calc

    stepTotalWeight += w;
    if (item.completed) {
      stepDoneWeight += w;
    }
  });

  if (stepTotalWeight === 0) return 0;
  return stepDoneWeight / stepTotalWeight;
}

/* ------------------------------------------------------------------ */
/*  Overall project progress (0–100%)                                  */
/* ------------------------------------------------------------------ */

/**
 * calculateProjectProgress(projectData)
 *
 * If `projectData.lifecycle` exists:
 *   → uses lifecycle-based checkpoint completion (stages → steps → checkpoints).
 *
 * Else:
 *   → falls back to task-weighted checklist logic using TASK_WEIGHTS_PERCENT.
 */
export function calculateProjectProgress(projectData) {
  if (!projectData) return 0;

  // 1) Preferred: lifecycle-based progress
  if (projectData.lifecycle && projectData.lifecycle.stages) {
    const { percent } = calculateLifecycleProgress(projectData);
    return percent;
  }

  // 2) Fallback: old weighted checklist method
  if (TOTAL_WEIGHT <= 0) return 0;

  let completedWeight = 0;

  Object.entries(TASK_WEIGHTS_PERCENT).forEach(([label, weight]) => {
    const item = findChecklistItemByLabel(projectData, label);
    if (item && item.completed) {
      completedWeight += weight;
    }
  });

  const pct = (completedWeight / TOTAL_WEIGHT) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped);
}

/* ------------------------------------------------------------------ */
/*  Optional: per-task breakdown for debugging / UI (legacy)          */
/* ------------------------------------------------------------------ */

/**
 * Returns an object keyed by task label (legacy checklist-based):
 *
 * {
 *   "Cut stave blocks to size": {
 *      completed: true,
 *      weight: 6.99,
 *      contribution: 6.99  // % points toward the final 0–100
 *   },
 *   ...
 * }
 */
export function getProgressBreakdown(projectData) {
  const result = {};

  Object.entries(TASK_WEIGHTS_PERCENT).forEach(([label, weight]) => {
    const item = findChecklistItemByLabel(projectData, label);
    const completed = !!(item && item.completed);
    const contribution =
      weight > 0 && completed ? (weight * 100) / TOTAL_WEIGHT : 0;

    result[label] = {
      completed,
      weight,
      contribution,
    };
  });

  return result;
}

export default calculateProjectProgress;