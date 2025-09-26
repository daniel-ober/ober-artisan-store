// src/utils/calculateProjectProgress.js

// Named step weights (your customer/admin UIs already use these)
const STEP_WEIGHTS = {
  woodPreparation: 0.05,
  shellConstruction: 0.20,
  fineTuning: 0.10,
  shellExteriorFinish: 0.20,
  bearingEdges: 0.10,
  snareBedCutting: 0.10,
  hardwareDrilling: 0.10,
  hardwareAssembly: 0.05,
  tuningAndDetailing: 0.05,
  qualityCheck: 0.05,
};

// Collect step objects from both schemas:
// 1) Named keys (woodPreparation, shellConstruction, ...)
// 2) Generic keys (step1, step2, ... step10)
function collectSteps(project) {
  const named = Object.keys(STEP_WEIGHTS)
    .filter(k => project?.[k])
    .map(k => ({ key: k, weight: STEP_WEIGHTS[k], step: project[k] }));

  const generics = Object.entries(project || {})
    .filter(([k]) => /^step\d+$/i.test(k))
    .map(([k, v]) => ({ key: k, weight: 0, step: v }));

  // Prefer named if present; include generics that aren’t duplicated
  const namedKeys = new Set(named.map(s => s.key));
  const extras = generics.filter(g => !namedKeys.has(g.key));

  return [...named, ...extras];
}

export function calculateProjectProgress(project) {
  if (!project) return 0;

  // Hard overrides → always 100%
  const forceDone =
    (project.status && String(project.status).toLowerCase() === 'finished') ||
    project.allStepsComplete === true ||
    project.currentStep === 'All Steps Complete' ||
    project.currentPhase === 'All Steps Complete';

  if (forceDone) return 100;

  const steps = collectSteps(project);

  // If every step object says completed: true → 100%
  if (steps.length > 0 && steps.every(s => s.step?.completed === true)) {
    return 100;
  }

  // If we have any named steps, use weighted math across the steps that exist.
  const usingWeights = steps.some(s => s.weight > 0);

  if (usingWeights) {
    let totalWeight = 0;
    let earned = 0;

    steps.forEach(({ step, weight }) => {
      // Only weight named steps; generic steps (weight 0) won’t affect result here.
      if (weight <= 0) return;

      const list = Array.isArray(step?.checklist) ? step.checklist : [];

      // A step with no checklist but marked completed counts fully
      if (list.length === 0) {
        if (step?.completed === true) {
          earned += weight;
          totalWeight += weight;
        } else {
          // step exists but no measurable items yet; ignore in denominator
        }
        return;
      }

      const enabled = list.filter(i => i?.enabled !== false);
      if (enabled.length === 0) return; // nothing to count

      const done = enabled.filter(i => i?.completed).length;
      earned += (done / enabled.length) * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0) return 0;
    return Math.round((earned / totalWeight) * 100);
  }

  // Fallback: no named weights present → simple ratio over all enabled items
  let total = 0;
  let done = 0;

  steps.forEach(({ step }) => {
    const list = Array.isArray(step?.checklist) ? step.checklist : [];

    if (list.length === 0) {
      // Treat "completed:true" with no checklist as 1 completed item
      if (step?.completed === true) {
        total += 1;
        done += 1;
      }
      return;
    }

    list.forEach(item => {
      const enabled = item?.enabled !== false;
      if (!enabled) return;
      total += 1;
      if (item?.completed) done += 1;
    });
  });

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}