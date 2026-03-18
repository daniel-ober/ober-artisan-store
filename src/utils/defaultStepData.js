import { STAGE_TEMPLATES } from "./workflowDefinitions";

/**
 * This file should NEVER hardcode steps.
 * It derives from STAGE_TEMPLATES so your project seed
 * always matches the workflow source-of-truth.
 */

const make = (id, uiLabel, bookLabel) => ({
  id,
  label: uiLabel,            // admin + artist portal
  bookLabel: bookLabel || uiLabel,
  task: uiLabel,             // backwards compatibility
  completed: false,
  totalSeconds: 0,
  checkpointStates: [],
});

/**
 * Safely extract readable text from workflowDefinitions,
 * even if structure evolves later.
 */
const extractText = (value, fallback) => {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object") {
    const candidates = [
      value.adminMainTitle,
      value.adminLeftShort,
      value.label,
      value.title,
      value.name,
      value.ui,
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
  }

  return fallback;
};

const defaultStepData = Object.entries(STAGE_TEMPLATES).reduce(
  (acc, [stageKey, stage]) => {
    const stageLabel = extractText(stage.adminMainTitle, stageKey);

    acc[stageKey] = {
      stageLabel,
      checklist: (stage.steps || []).map((step, index) => {
        const uiLabel = extractText(
          step.adminMainTitle,
          `Step ${index + 1}`
        );

        const bookLabel = extractText(
          step.adminLeftShort,
          uiLabel
        );

        return make(
          step.id || `${stageKey}_${index + 1}`,
          uiLabel,
          bookLabel
        );
      }),
    };

    return acc;
  },
  {}
);

export default defaultStepData;