// src/utils/lifecycleUpdater.js

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import defaultStepData from "./defaultStepData";

/**
 * Normalize a project document's step/checklist shape so that:
 *  - every core step from defaultStepData exists on the project
 *  - each step has a checklist that matches the template
 *  - existing completion/time values are preserved when possible
 */
export function ensureChecklistStructure(projectDoc = {}) {
  const next = { ...projectDoc };

  // Walk through every core build step from defaultStepData
  Object.values(defaultStepData).forEach((tmpl) => {
    const key = tmpl.key;
    if (!key) return;

    // If the project already has this block, preserve it
    const existingBlock =
      next[key] && typeof next[key] === "object" ? next[key] : {};

    const existingChecklist = Array.isArray(existingBlock.checklist)
      ? existingBlock.checklist
      : [];

    // Index existing checklist items by id so we can preserve completion + time
    const checklistById = new Map();
    existingChecklist.forEach((item) => {
      if (item && item.id) {
        checklistById.set(item.id, item);
      }
    });

    // Template checklist from defaultStepData (guarded so we never .forEach undefined)
    const templateChecklist = Array.isArray(tmpl.checklist)
      ? tmpl.checklist
      : [];

    const normalizedChecklist = templateChecklist.map((row) => {
      const prev = row.id ? checklistById.get(row.id) : null;
      return {
        ...row,
        completed: !!prev?.completed,
        totalSeconds:
          typeof prev?.totalSeconds === "number" ? prev.totalSeconds : 0,
      };
    });

    // Merge:
    //  - tmpl (key, label, phase, order, etc)
    //  - any existing custom fields on the project step (like hardwareAssembly.steps)
    //  - the normalized checklist
    next[key] = {
      ...tmpl,
      ...existingBlock,
      checklist: normalizedChecklist,
    };
  });

  return next;
}

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