import {
  BUILD_SPEC_TO_CRAFTSMAN_KEY,
  BUILD_WORKFLOW_REQUIRED_DECISION_COUNT,
  CRAFTSMAN_DECISION_TO_BUILDSPEC,
  DEFAULT_CRAFTSMAN_TOOL_STATE,
  REQUIRED_BUILD_SPEC_KEYS,
} from './constants';
import {
  deriveCustomerEmail,
  deriveCustomerName,
} from './stepHelpers';

export const getCraftsmanToolState = (editableData = {}, projectData = {}) =>
  editableData?.craftsmanMasterTool ||
  projectData?.craftsmanMasterTool ||
  DEFAULT_CRAFTSMAN_TOOL_STATE;

export const getCraftsmanTrackedDecisionCount = (
  toolState = {},
  engineRecord = {}
) => {
  const decisions = toolState?.decisions || {};
  const buildSpec = engineRecord?.buildSpec || {};

  const requiredPairs = [
    ['protectFirst', null],
    ['sizeDirectionConfidence', null],
    ['shellConstruction', 'shellConstruction'],
    ['primaryWood', 'primaryWood'],
    ['hardwareFinishCommitment', 'hardwareFinish'],
    ['finishDirection', 'finishSystem'],
    ['bearingEdgeDirection', 'bearingEdge'],
    ['tuningApproach', 'tuningApproach'],
    ['lugCountDirection', 'lugCount'],
  ];

  return requiredPairs.filter(([decisionKey, buildSpecKey]) => {
    const decisionValue = String(decisions?.[decisionKey]?.value || '').trim();
    const buildSpecValue = buildSpecKey
      ? String(buildSpec?.[buildSpecKey]?.value || '').trim()
      : '';

    return !!decisionValue || !!buildSpecValue;
  }).length;
};

export const getCraftsmanStaleDecisionCount = (toolState = {}) => {
  const decisions = toolState?.decisions || {};
  return Object.values(decisions).filter((decision) => !!decision?.stale)
    .length;
};

export const getMissingCraftsmanDecisionIds = (
  toolState = {},
  engineRecord = {}
) => {
  const decisions = toolState?.decisions || {};
  const buildSpec = engineRecord?.buildSpec || {};

  const requiredIds = [
    'protectFirst',
    'sizeDirectionConfidence',
    'shellConstruction',
    'primaryWood',
    'hardwareFinishCommitment',
    'finishDirection',
    'bearingEdgeDirection',
    'tuningApproach',
    'lugCountDirection',
  ];

  return requiredIds.filter((id) => {
    const decisionValue = String(decisions?.[id]?.value || '').trim();
    const buildSpecKey = CRAFTSMAN_DECISION_TO_BUILDSPEC[id];
    const buildSpecValue = buildSpecKey
      ? String(buildSpec?.[buildSpecKey]?.value || '').trim()
      : '';

    return !decisionValue && !buildSpecValue;
  });
};

export const getMissingBuildSpecKeys = (
  engineRecord = {},
  craftsmanToolState = {}
) => {
  const buildSpec = engineRecord?.buildSpec || {};
  const craftsmanDecisions = craftsmanToolState?.decisions || {};

  return REQUIRED_BUILD_SPEC_KEYS.filter((key) => {
    const buildSpecValue = String(buildSpec?.[key]?.value || '').trim();

    const craftsmanKey = BUILD_SPEC_TO_CRAFTSMAN_KEY[key];
    const craftsmanDecision = craftsmanDecisions?.[craftsmanKey];
    const craftsmanValue = String(craftsmanDecision?.value || '').trim();
    const craftsmanIsUsable = !!craftsmanValue && !craftsmanDecision?.stale;

    return !buildSpecValue && !craftsmanIsUsable;
  });
};

export const hasMeaningfulConsultationSummary = (storyEngineData = {}) =>
  !!String(storyEngineData?.consultationSummary || '').trim();

export const hasConsultationTranscript = (storyEngineData = {}) =>
  !!String(storyEngineData?.consultationTranscript || '').trim();

export const hasQuestionnaireRaw = (storyEngineData = {}) =>
  !!String(storyEngineData?.questionnaireRaw || '').trim();

export const getBuildWorkflowUnlocked = ({
  storyEngineData,
  craftsmanToolState,
}) => {
  const engineRecord = storyEngineData?.engineRecord || {};
  const trackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const staleCount = getCraftsmanStaleDecisionCount(craftsmanToolState);
  const missingBuildSpecs = getMissingBuildSpecKeys(
    engineRecord,
    craftsmanToolState
  );

  return (
    trackedCount >= BUILD_WORKFLOW_REQUIRED_DECISION_COUNT &&
    staleCount === 0 &&
    missingBuildSpecs.length === 0
  );
};

export const getPortalExposureState = ({
  storyEngineData,
  craftsmanToolState,
  linkedUser,
}) => {
  const engineRecord = storyEngineData?.engineRecord || {};
  const hasTranscript = hasConsultationTranscript(storyEngineData);
  const hasSummary = hasMeaningfulConsultationSummary(storyEngineData);
  const hasQuestionnaire = hasQuestionnaireRaw(storyEngineData);

  const trackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const staleCount = getCraftsmanStaleDecisionCount(craftsmanToolState);
  const draftReadiness =
    engineRecord?.engineMeta?.draftReadiness || 'not_ready';

  const internalReady =
    hasQuestionnaire &&
    hasSummary &&
    trackedCount >= BUILD_WORKFLOW_REQUIRED_DECISION_COUNT &&
    staleCount === 0;

  const softShareReady = internalReady && draftReadiness !== 'not_ready';
  const portalReady = softShareReady && hasTranscript && !!linkedUser;

  return {
    internalReady,
    softShareReady,
    portalReady,
  };
};

export const getProjectReadinessState = ({
  editableData,
  projectData,
  storyEngineData,
  linkedUser,
}) => {
  const craftsmanToolState = getCraftsmanToolState(editableData, projectData);

  const mergedProjectForReadiness = {
    ...(projectData || {}),
    ...(editableData || {}),
  };

  const hasRecordBasics =
    !!deriveCustomerName(mergedProjectForReadiness) &&
    !!deriveCustomerEmail(mergedProjectForReadiness) &&
    !!(
      mergedProjectForReadiness?.artisanLine ||
      mergedProjectForReadiness?.series ||
      mergedProjectForReadiness?.line
    );

  const hasQuestionnaire = hasQuestionnaireRaw(storyEngineData);
  const hasSummary = hasMeaningfulConsultationSummary(storyEngineData);
  const hasTranscript = hasConsultationTranscript(storyEngineData);

  const engineRecord = storyEngineData?.engineRecord || {};

  const craftsmanTrackedCount = getCraftsmanTrackedDecisionCount(
    craftsmanToolState,
    engineRecord
  );
  const craftsmanStaleCount =
    getCraftsmanStaleDecisionCount(craftsmanToolState);
  const missingCraftsmanDecisionIds = getMissingCraftsmanDecisionIds(
    craftsmanToolState,
    engineRecord
  );

  const missingBuildSpecKeys = getMissingBuildSpecKeys(
    engineRecord,
    craftsmanToolState
  );

  const storyReadiness =
    engineRecord?.engineMeta?.draftReadiness || 'not_ready';

  const buildWorkflowUnlocked = getBuildWorkflowUnlocked({
    storyEngineData,
    craftsmanToolState,
  });

  const portalExposure = getPortalExposureState({
    storyEngineData,
    craftsmanToolState,
    linkedUser,
  });

  const blockers = [];

  if (!hasRecordBasics) blockers.push('Complete project record basics');
  if (!hasQuestionnaire) blockers.push('Add questionnaire intake');
  if (!hasSummary) blockers.push('Add consultation summary');
  if (missingCraftsmanDecisionIds.length) {
    blockers.push(
      `Complete Craftsman decision path (${missingCraftsmanDecisionIds.length} remaining)`
    );
  }
  if (craftsmanStaleCount > 0) {
    blockers.push(
      `Review downstream Craftsman decisions (${craftsmanStaleCount} stale)`
    );
  }

  let nextBestAction = 'Continue project setup';

  if (!hasQuestionnaire) {
    nextBestAction = 'Add questionnaire intake';
  } else if (!hasSummary) {
    nextBestAction = 'Write consultation summary';
  } else if (missingCraftsmanDecisionIds.length) {
    nextBestAction = 'Continue Craftsman decision flow';
  } else if (craftsmanStaleCount > 0) {
    nextBestAction = 'Review stale Craftsman decisions';
  } else if (missingBuildSpecKeys.length) {
    nextBestAction = 'Return to Craftsman Master Tool';
  } else if (!buildWorkflowUnlocked) {
    nextBestAction = 'Review build direction before unlocking workflow';
  } else {
    nextBestAction = 'Build workflow is ready to begin';
  }

  return {
    hasRecordBasics,
    hasQuestionnaire,
    hasSummary,
    hasTranscript,
    craftsmanTrackedCount,
    craftsmanStaleCount,
    missingCraftsmanDecisionIds,
    missingBuildSpecKeys,
    storyReadiness,
    buildWorkflowUnlocked,
    portalExposure,
    blockers,
    nextBestAction,
  };
};

export const getLinkedUserStatusLabel = (linkedUser) => {
  if (!linkedUser) return 'Not linked';
  return linkedUser.email ? `Linked • ${linkedUser.email}` : 'Linked';
};