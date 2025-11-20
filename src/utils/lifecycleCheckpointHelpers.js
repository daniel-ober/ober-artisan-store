// src/utils/lifecycleCheckpointHelpers.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PROJECT_LIFECYCLE_DEFINITION } from './projectLifecycleConfig';

function getCheckpointLabel(stageKey, stepKey, checkpointId) {
  const stage = PROJECT_LIFECYCLE_DEFINITION.stages[stageKey];
  const step = stage?.steps?.[stepKey];
  const cp = (step?.checkpoints || []).find((c) => c.id === checkpointId);
  return cp?.label || checkpointId;
}

export async function toggleLifecycleCheckpoint({
  projectId,
  stageKey,
  stepKey,
  checkpointId,
  completed,
}) {
  if (!projectId || !stageKey || !stepKey || !checkpointId) return;

  const ref = doc(db, 'projects', projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() || {};
  const lifecycle = data.lifecycle || {};
  const stages = lifecycle.stages || {};

  const stage = stages[stageKey] || { steps: {} };
  const steps = stage.steps || {};
  const step = steps[stepKey] || { id: stepKey, label: stepKey, checkpoints: {} };
  const checkpoints = step.checkpoints || {};

  const label = getCheckpointLabel(stageKey, stepKey, checkpointId);

  const cp = checkpoints[checkpointId] || {
    id: checkpointId,
    label,
    completed: false,
    totalSeconds: 0,
    timestamp: null,
  };

  cp.completed = !!completed;
  cp.label = label;
  checkpoints[checkpointId] = cp;

  // recompute step.completed
  const cpList = Object.values(checkpoints);
  const allCpCompleted =
    cpList.length > 0 && cpList.every((c) => c.completed === true);
  step.completed = allCpCompleted;
  step.checkpoints = checkpoints;
  steps[stepKey] = step;

  // recompute stage.completed
  const stepList = Object.values(steps);
  const allStepsCompleted =
    stepList.length > 0 && stepList.every((s) => s.completed === true);
  stage.completed = allStepsCompleted;
  stage.steps = steps;
  stages[stageKey] = stage;

  await updateDoc(ref, {
    lifecycle: {
      ...lifecycle,
      stages,
    },
  });
}