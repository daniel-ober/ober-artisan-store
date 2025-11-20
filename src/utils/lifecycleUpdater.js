// src/utils/lifecycleUpdater.js

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Toggle a single checkpoint and automatically recalc:
 *   - the parent step's `completed` field
 *   - the parent stage's `completed` field
 */
export async function toggleLifecycleCheckpoint({
  projectId,
  stageId,
  stepId,
  checkpointId,
  newValue,
  project,
}) {
  if (!projectId || !project || !project.lifecycle) {
    console.error("Missing lifecycle or project data");
    return;
  }

  // Clone lifecycle object so we can mutate safely
  const lifecycle = JSON.parse(JSON.stringify(project.lifecycle));

  const stage = lifecycle.stages?.[stageId];
  if (!stage) throw new Error(`Stage '${stageId}' not found.`);

  const step = stage.steps?.[stepId];
  if (!step) throw new Error(`Step '${stepId}' not found.`);

  const cp = step.checkpoints?.[checkpointId];
  if (!cp) throw new Error(`Checkpoint '${checkpointId}' not found.`);

  // 1. Update the checkpoint completion
  cp.completed = newValue;
  cp.timestamp = newValue ? new Date().toISOString() : null;

  // 2. Recompute step completion (all checkpoints must be true)
  const allCheckpointsComplete = Object.values(step.checkpoints).every(
    (c) => c.completed === true
  );
  step.completed = allCheckpointsComplete;

  // 3. Recompute stage completion (all steps must be true)
  const allStepsComplete = Object.values(stage.steps).every(
    (s) => s.completed === true
  );
  stage.completed = allStepsComplete;

  // Push the update to Firestore
  const ref = doc(db, "projects", projectId);

  await updateDoc(ref, {
    lifecycle,
  });

  return lifecycle;
}