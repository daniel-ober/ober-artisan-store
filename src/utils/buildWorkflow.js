// src/utils/buildWorkflow.js

import defaultStepData from './defaultStepData';
import { CHECKPOINTS_BY_ITEM_ID } from '../components/StepComponentTemplate';

// ✅ Re-export shared roadmap definitions (single source of truth)
// (These exports will exist once you create/populate src/utils/workflowDefinitions.js)
export * from './workflowDefinitions';

export {
  defaultStepData,
  CHECKPOINTS_BY_ITEM_ID,
};