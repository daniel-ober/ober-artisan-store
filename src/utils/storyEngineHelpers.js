// src/utils/storyEngineHelpers.js

import {
  FIELD_STATUS,
  WRITING_MODE,
  REVIEW_REASON,
  ENGINE_FLAGS,
  SOURCE_TYPE,
  createEmptyStoryEngineRecord,
} from './storyEngineSchema';

import {
  CHAPTER_FIELD_MAP,
  INFERENCE_RULES,
  calculateFieldConfidence,
  resolveWritingMode,
  requiresManualReview,
  getReviewReasonsForField,
  evaluateChapterReadiness,
  generateMissingFieldPrompt,
  getFieldNode,
  getFieldValue,
  hasValue,
  getUnresolvedCriticalFields,
  getChapterCoverageScore,
  getChapterLengthTarget,
} from './storyEngineRules';

/* =========================================================
   BASIC PATH HELPERS
   ========================================================= */

export function cloneStoryEngineRecord(record = null) {
  const base = record || createEmptyStoryEngineRecord();
  return JSON.parse(JSON.stringify(base));
}

export function setByPath(obj, path, value) {
  if (!obj || !path) return obj;

  const keys = path.split('.');
  let cursor = obj;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return obj;
}

export function ensureField(record, fieldPath) {
  const existing = getFieldNode(record, fieldPath);
  if (existing) return existing;

  setByPath(record, fieldPath, {
    value: null,
    status: FIELD_STATUS.UNKNOWN,
    confidence: 0,
    rationale: [],
    sourceRefs: [],
    sourceTypes: [],
    reviewNeeded: false,
    reviewReasons: [],
    lastUpdatedBy: null,
    manualLock: false,
  });

  return getFieldNode(record, fieldPath);
}

/* =========================================================
   SOURCE REGISTRY
   ========================================================= */

export function createSourceEntry({
  id,
  type = SOURCE_TYPE.ADMIN_NOTE,
  label = '',
  content = '',
  createdAt = null,
  createdBy = null,
  meta = {},
}) {
  return {
    id:
      id ||
      `src_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    type,
    label,
    content,
    createdAt,
    createdBy,
    meta,
  };
}

export function registerSource(record, sourceEntry) {
  const next = cloneStoryEngineRecord(record);

  if (!sourceEntry?.id) return next;

  const exists = (next.sourceRegistry || []).some((s) => s.id === sourceEntry.id);
  if (!exists) {
    next.sourceRegistry = [...(next.sourceRegistry || []), sourceEntry];
  }

  return next;
}

/* =========================================================
   FIELD WRITES
   ========================================================= */

export function writeField(record, fieldPath, updates = {}) {
  const next = cloneStoryEngineRecord(record);
  const field = ensureField(next, fieldPath);

  const mergedSourceRefs = uniq([...(field.sourceRefs || []), ...(updates.sourceRefs || [])]);
  const mergedSourceTypes = uniq([
    ...(field.sourceTypes || []),
    ...(updates.sourceTypes || []),
  ]);
  const mergedRationale = uniq([
    ...(field.rationale || []),
    ...(updates.rationale || []),
  ]);

  const manualLock =
    typeof updates.manualLock === 'boolean' ? updates.manualLock : !!field.manualLock;

  const confidence =
    typeof updates.confidence === 'number'
      ? updates.confidence
      : calculateFieldConfidence({
          sourceTypes: mergedSourceTypes,
          manualLock,
          hasConflict: !!updates.hasConflict,
          observedStrength: updates.status === FIELD_STATUS.OBSERVED ? 0.08 : 0,
          derivedStrength: updates.status === FIELD_STATUS.DERIVED ? 0.04 : 0,
          recommendationStrength:
            updates.status === FIELD_STATUS.RECOMMENDED ? 0.03 : 0,
        });

  const reviewNeeded =
    typeof updates.reviewNeeded === 'boolean'
      ? updates.reviewNeeded
      : requiresManualReview(fieldPath, confidence);

  const reviewReasons = uniq([
    ...(field.reviewReasons || []),
    ...(updates.reviewReasons || []),
    ...getReviewReasonsForField(fieldPath, confidence),
  ]);

  const finalValue =
    Object.prototype.hasOwnProperty.call(updates, 'value') ? updates.value : field.value;

  field.value = finalValue;
  field.status = updates.status || field.status || FIELD_STATUS.UNKNOWN;
  field.confidence = confidence;
  field.rationale = mergedRationale;
  field.sourceRefs = mergedSourceRefs;
  field.sourceTypes = mergedSourceTypes;
  field.reviewNeeded = reviewNeeded;
  field.reviewReasons = reviewReasons;
  field.lastUpdatedBy = updates.lastUpdatedBy || field.lastUpdatedBy || null;
  field.manualLock = manualLock;

  return next;
}

export function setObservedField(record, fieldPath, options = {}) {
  return writeField(record, fieldPath, {
    ...options,
    status: FIELD_STATUS.OBSERVED,
  });
}

export function setDerivedField(record, fieldPath, options = {}) {
  return writeField(record, fieldPath, {
    ...options,
    status: FIELD_STATUS.DERIVED,
  });
}

export function setRecommendedField(record, fieldPath, options = {}) {
  return writeField(record, fieldPath, {
    ...options,
    status: FIELD_STATUS.RECOMMENDED,
  });
}

export function lockField(record, fieldPath, lastUpdatedBy = 'admin') {
  return writeField(record, fieldPath, {
    manualLock: true,
    lastUpdatedBy,
    confidence: 0.95,
  });
}

export function unlockField(record, fieldPath, lastUpdatedBy = 'admin') {
  const next = cloneStoryEngineRecord(record);
  const field = ensureField(next, fieldPath);
  field.manualLock = false;
  field.lastUpdatedBy = lastUpdatedBy;
  return next;
}

/* =========================================================
   BULK INGEST
   ========================================================= */

export function applyObservedFields(record, fieldMap = {}, source = {}) {
  let next = cloneStoryEngineRecord(record);

  Object.entries(fieldMap).forEach(([fieldPath, value]) => {
    const hasMeaningfulValue =
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '');

    if (!hasMeaningfulValue) return;

    next = setObservedField(next, fieldPath, {
      value,
      sourceRefs: source.id ? [source.id] : [],
      sourceTypes: source.type ? [source.type] : [],
      rationale: source.label
        ? [`Observed from ${source.label}`]
        : ['Observed from intake source'],
      lastUpdatedBy: source.createdBy || 'system',
    });
  });

  return next;
}

/* =========================================================
   RECOMMENDATION WRITES
   ========================================================= */

export function writeRecommendation(
  record,
  recommendationPath,
  {
    primaryValue = null,
    primaryConfidence = 0,
    primaryRationale = [],
    primarySourceRefs = [],
    primarySourceTypes = [],
    secondaryValue = null,
    secondaryConfidence = 0,
    secondaryRationale = [],
    secondarySourceRefs = [],
    secondarySourceTypes = [],
    rejected = [],
    reviewNeeded = false,
    reviewReasons = [],
  } = {}
) {
  const next = cloneStoryEngineRecord(record);

  setByPath(next, recommendationPath, {
    primary: {
      value: primaryValue,
      confidence: primaryConfidence,
      rationale: uniq(primaryRationale),
      sourceRefs: uniq(primarySourceRefs),
      sourceTypes: uniq(primarySourceTypes),
    },
    secondary: {
      value: secondaryValue,
      confidence: secondaryConfidence,
      rationale: uniq(secondaryRationale),
      sourceRefs: uniq(secondarySourceRefs),
      sourceTypes: uniq(secondarySourceTypes),
    },
    rejected: rejected || [],
    reviewNeeded,
    reviewReasons: uniq(reviewReasons),
  });

  return next;
}

export function getRecommendationNode(record, recommendationPath) {
  return getFieldNode(record, recommendationPath);
}

/* =========================================================
   INFERENCE ENGINE
   ========================================================= */

export function runInferenceForRecommendation(record, recommendationKey) {
  const rules = INFERENCE_RULES[recommendationKey] || [];
  if (!rules.length) return cloneStoryEngineRecord(record);

  const matches = rules
    .filter((rule) => {
      try {
        return typeof rule.when === 'function' ? rule.when(record) : false;
      } catch (err) {
        return false;
      }
    })
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  if (!matches.length) return cloneStoryEngineRecord(record);

  const primary = matches[0] || null;
  const secondary = matches[1] || null;

  return writeRecommendation(record, `recommendations.${recommendationKey}`, {
    primaryValue: primary?.suggest || null,
    primaryConfidence: primary?.confidence || 0,
    primaryRationale: primary?.rationale || [],
    primarySourceTypes: [SOURCE_TYPE.BUILD_RULE],
    secondaryValue: secondary?.suggest || null,
    secondaryConfidence: secondary?.confidence || 0,
    secondaryRationale: secondary?.rationale || [],
    secondarySourceTypes: secondary ? [SOURCE_TYPE.BUILD_RULE] : [],
    rejected: matches.slice(2).map((item) => ({
      id: item.id,
      value: item.suggest,
      confidence: item.confidence || 0,
      rationale: item.rationale || [],
    })),
    reviewNeeded: (primary?.confidence || 0) < 0.7,
    reviewReasons:
      (primary?.confidence || 0) < 0.7 ? [REVIEW_REASON.BUILD_RISK] : [],
  });
}

export function runAllRecommendationInference(record) {
  let next = cloneStoryEngineRecord(record);

  Object.keys(INFERENCE_RULES).forEach((recommendationKey) => {
    next = runInferenceForRecommendation(next, recommendationKey);
  });

  return next;
}

/* =========================================================
   APPLY RECOMMENDATIONS TO EMPTY BUILD FIELDS
   ========================================================= */

export const RECOMMENDATION_TO_BUILD_FIELD_MAP = {
  shellConstruction: 'buildSpec.shellConstruction',
  primaryWood: 'buildSpec.primaryWood',
  secondaryWood: 'buildSpec.secondaryWood',
  bearingEdge: 'buildSpec.bearingEdge',
  hoopType: 'buildSpec.hoopType',
  lugCount: 'buildSpec.lugCount',
  tuningApproach: 'buildSpec.tuningApproach',
  finishSystem: 'buildSpec.finishSystem',
};

export function applyRecommendationsToMissingBuildFields(record) {
  let next = cloneStoryEngineRecord(record);

  Object.entries(RECOMMENDATION_TO_BUILD_FIELD_MAP).forEach(
    ([recommendationKey, fieldPath]) => {
      if (hasValue(next, fieldPath)) return;

      const recommendation = getRecommendationNode(
        next,
        `recommendations.${recommendationKey}`
      );

      const primary = recommendation?.primary;
      if (!primary?.value) return;

      next = setRecommendedField(next, fieldPath, {
        value: primary.value,
        confidence: primary.confidence || 0,
        rationale: primary.rationale || ['Recommended by story engine'],
        sourceRefs: primary.sourceRefs || [],
        sourceTypes: primary.sourceTypes || [SOURCE_TYPE.BUILD_RULE],
        reviewNeeded: (primary.confidence || 0) < 0.72,
        reviewReasons:
          (primary.confidence || 0) < 0.72 ? [REVIEW_REASON.BUILD_RISK] : [],
        lastUpdatedBy: 'story_engine',
      });
    }
  );

  return next;
}

/* =========================================================
   CHAPTER INPUT RESOLUTION
   ========================================================= */

export function getChapterFieldPaths(chapterKey, sectionKey = null) {
  const config = CHAPTER_FIELD_MAP[chapterKey];
  if (!config) return [];

  if (!sectionKey) {
    return uniq([
      ...(config.chapterOverview || []),
      ...(config.buildNotesStory || []),
      ...(config.critical || []),
    ]);
  }

  return config[sectionKey] || [];
}

export function collectChapterFacts(record, chapterKey, sectionKey) {
  const fieldPaths = getChapterFieldPaths(chapterKey, sectionKey);

  return fieldPaths.map((path) => {
    const node =
      path.startsWith('recommendations.')
        ? getRecommendationNode(record, path)
        : getFieldNode(record, path);

    if (!node) {
      return {
        fieldPath: path,
        value: null,
        status: 'missing',
        confidence: 0,
        reviewNeeded: true,
      };
    }

    if (path.startsWith('recommendations.')) {
      return {
        fieldPath: path,
        value: node?.primary?.value ?? null,
        status: node?.primary?.value ? 'recommended' : 'missing',
        confidence: node?.primary?.confidence || 0,
        reviewNeeded: !!node?.reviewNeeded,
        reviewReasons: node?.reviewReasons || [],
        rationale: node?.primary?.rationale || [],
        sourceTypes: node?.primary?.sourceTypes || [],
        sourceRefs: node?.primary?.sourceRefs || [],
      };
    }

    return {
      fieldPath: path,
      value: node.value,
      status: node.status,
      confidence: node.confidence || 0,
      reviewNeeded: !!node.reviewNeeded,
      reviewReasons: node.reviewReasons || [],
      rationale: node.rationale || [],
      sourceTypes: node.sourceTypes || [],
      sourceRefs: node.sourceRefs || [],
      manualLock: !!node.manualLock,
    };
  });
}

export function getResolvedFactsOnly(facts = []) {
  return facts.filter((fact) => {
    if (fact.value == null) return false;
    if (typeof fact.value === 'string' && !fact.value.trim()) return false;
    if (Array.isArray(fact.value) && fact.value.length === 0) return false;
    return true;
  });
}

export function getReviewFacts(facts = []) {
  return facts.filter((fact) => fact.reviewNeeded);
}

/* =========================================================
   STORY SECTION BUILDER INPUTS
   ========================================================= */

export function buildStorySectionInput(record, chapterKey, sectionKey) {
  const facts = collectChapterFacts(record, chapterKey, sectionKey);
  const resolvedFacts = getResolvedFactsOnly(facts);
  const reviewFacts = getReviewFacts(facts);

  const avgConfidence = resolvedFacts.length
    ? resolvedFacts.reduce((sum, item) => sum + (item.confidence || 0), 0) /
      resolvedFacts.length
    : 0;

  const hasObservedCore = resolvedFacts.some(
    (item) => item.status === FIELD_STATUS.OBSERVED
  );

  const hasRecommendation = resolvedFacts.some(
    (item) => item.status === FIELD_STATUS.RECOMMENDED || item.status === 'recommended'
  );

  const storyRisk = reviewFacts.some((fact) =>
    (fact.reviewReasons || []).includes(REVIEW_REASON.STORY_RISK)
  );

  const writingMode = resolveWritingMode({
    confidence: avgConfidence,
    hasObservedCore,
    hasRecommendation,
    storyRisk,
  });

  const lengthTarget = getChapterLengthTarget(sectionKey);

  return {
    chapterKey,
    sectionKey,
    facts,
    resolvedFacts,
    reviewFacts,
    confidence: clamp(avgConfidence),
    writingMode,
    lengthTarget,
    basedOnStatuses: uniq(resolvedFacts.map((item) => item.status).filter(Boolean)),
    basedOnFieldKeys: uniq(resolvedFacts.map((item) => item.fieldPath)),
    reviewNeeded:
      writingMode === WRITING_MODE.HOLD_FOR_REVIEW || reviewFacts.length > 0,
    reviewReasons: uniq(
      reviewFacts.flatMap((item) => item.reviewReasons || [])
    ),
  };
}

export function saveStorySectionInput(record, chapterKey, sectionKey, sectionInput) {
  const next = cloneStoryEngineRecord(record);

  setByPath(next, `chapters.${chapterKey}.storySections.${sectionKey}`, {
    text: '',
    writingMode: sectionInput.writingMode,
    confidence: clamp(sectionInput.confidence),
    basedOnStatuses: sectionInput.basedOnStatuses || [],
    basedOnFieldKeys: sectionInput.basedOnFieldKeys || [],
    reviewNeeded: !!sectionInput.reviewNeeded,
    reviewReasons:
      sectionInput.reviewReasons?.length > 0
        ? uniq(sectionInput.reviewReasons)
        : sectionInput.reviewNeeded
        ? [REVIEW_REASON.NOT_ENOUGH_DATA]
        : [],
    maxLengthTarget: sectionInput.lengthTarget,
  });

  return next;
}

export function saveStoryText(
  record,
  chapterKey,
  sectionKey,
  {
    text = '',
    writingMode = WRITING_MODE.HOLD_FOR_REVIEW,
    confidence = 0,
    basedOnStatuses = [],
    basedOnFieldKeys = [],
    reviewNeeded = true,
    reviewReasons = [REVIEW_REASON.NOT_ENOUGH_DATA],
  } = {}
) {
  const next = cloneStoryEngineRecord(record);
  const lengthTarget = getChapterLengthTarget(sectionKey);

  setByPath(next, `chapters.${chapterKey}.storySections.${sectionKey}`, {
    text,
    writingMode,
    confidence: clamp(confidence),
    basedOnStatuses: uniq(basedOnStatuses),
    basedOnFieldKeys: uniq(basedOnFieldKeys),
    reviewNeeded,
    reviewReasons: uniq(reviewReasons),
    maxLengthTarget: lengthTarget,
  });

  return next;
}

/* =========================================================
   CHAPTER CONFIDENCE / FLAGS
   ========================================================= */

export function calculateChapterConfidence(record, chapterKey) {
  const overviewInput = buildStorySectionInput(
    record,
    chapterKey,
    'chapterOverview'
  );
  const buildNotesInput = buildStorySectionInput(
    record,
    chapterKey,
    'buildNotesStory'
  );
  const coverageScore = getChapterCoverageScore(record, chapterKey);

  const confidence =
    overviewInput.confidence * 0.4 +
    buildNotesInput.confidence * 0.4 +
    coverageScore * 0.2;

  return clamp(confidence);
}

export function updateChapterMeta(record, chapterKey) {
  const next = cloneStoryEngineRecord(record);
  const unresolvedCriticalFields = getUnresolvedCriticalFields(next, chapterKey);
  const confidenceScore = calculateChapterConfidence(next, chapterKey);
  const readiness = evaluateChapterReadiness({
    confidenceScore,
    unresolvedCriticalFields,
  });

  setByPath(next, `chapters.${chapterKey}.unresolvedCriticalFields`, [
    ...unresolvedCriticalFields,
  ]);
  setByPath(next, `chapters.${chapterKey}.confidenceScore`, confidenceScore);
  setByPath(next, `chapters.${chapterKey}.flags`, [readiness.flag]);

  return next;
}

export function updateAllChapterMeta(record) {
  let next = cloneStoryEngineRecord(record);

  Object.keys(next.chapters || {}).forEach((chapterKey) => {
    next = updateChapterMeta(next, chapterKey);
  });

  return next;
}

/* =========================================================
   ENGINE META
   ========================================================= */

export function collectEngineUnresolvedQuestions(record) {
  const prompts = [];
  const seen = new Set();

  Object.keys(record.chapters || {}).forEach((chapterKey) => {
    const unresolved = record?.chapters?.[chapterKey]?.unresolvedCriticalFields || [];
    unresolved.forEach((fieldKey) => {
      if (seen.has(fieldKey)) return;
      seen.add(fieldKey);
      prompts.push(generateMissingFieldPrompt(fieldKey));
    });
  });

  return prompts;
}

export function calculateOverallEngineConfidence(record) {
  const chapterKeys = Object.keys(record.chapters || {});
  if (!chapterKeys.length) return 0;

  const sum = chapterKeys.reduce((total, chapterKey) => {
    return total + (record?.chapters?.[chapterKey]?.confidenceScore || 0);
  }, 0);

  return clamp(sum / chapterKeys.length);
}

export function resolveDraftReadiness(record) {
  const chapterFlags = Object.values(record.chapters || {}).flatMap(
    (chapter) => chapter.flags || []
  );

  if (chapterFlags.includes(ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION)) {
    return ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION;
  }

  if (chapterFlags.includes(ENGINE_FLAGS.REVIEW_BEFORE_DRAFT)) {
    return ENGINE_FLAGS.REVIEW_BEFORE_DRAFT;
  }

  return ENGINE_FLAGS.SAFE_TO_AUTODRAFT;
}

export function updateEngineMeta(record, meta = {}) {
  const next = cloneStoryEngineRecord(record);

  const unresolvedQuestions = collectEngineUnresolvedQuestions(next);
  const overallConfidence = calculateOverallEngineConfidence(next);
  const draftReadiness = resolveDraftReadiness(next);

  next.engineMeta = {
    ...(next.engineMeta || {}),
    overallConfidence,
    draftReadiness,
    unresolvedQuestions,
    adminPrompts: unresolvedQuestions,
    lastEngineRunAt: meta.lastEngineRunAt || new Date().toISOString(),
    lastReviewedAt:
      Object.prototype.hasOwnProperty.call(meta, 'lastReviewedAt')
        ? meta.lastReviewedAt
        : next.engineMeta?.lastReviewedAt || null,
    lastReviewedBy:
      Object.prototype.hasOwnProperty.call(meta, 'lastReviewedBy')
        ? meta.lastReviewedBy
        : next.engineMeta?.lastReviewedBy || null,
  };

  return next;
}

/* =========================================================
   MAIN PIPELINE
   ========================================================= */

export function prepareChapterStoryInputs(record) {
  let next = cloneStoryEngineRecord(record);

  Object.keys(next.chapters || {}).forEach((chapterKey) => {
    const overviewInput = buildStorySectionInput(
      next,
      chapterKey,
      'chapterOverview'
    );
    const buildNotesInput = buildStorySectionInput(
      next,
      chapterKey,
      'buildNotesStory'
    );

    next = saveStorySectionInput(
      next,
      chapterKey,
      'chapterOverview',
      overviewInput
    );

    next = saveStorySectionInput(
      next,
      chapterKey,
      'buildNotesStory',
      buildNotesInput
    );
  });

  return next;
}

export function runStoryEngine(record, options = {}) {
  let next = cloneStoryEngineRecord(record);

  if (Array.isArray(options.sourcesToRegister)) {
    options.sourcesToRegister.forEach((source) => {
      next = registerSource(next, source);
    });
  }

  if (options.applyRecommendationInference !== false) {
    next = runAllRecommendationInference(next);
  }

  if (options.applyRecommendationsToMissing !== false) {
    next = applyRecommendationsToMissingBuildFields(next);
  }

  next = prepareChapterStoryInputs(next);
  next = updateAllChapterMeta(next);
  next = updateEngineMeta(next, {
    lastEngineRunAt: new Date().toISOString(),
  });

  return next;
}

/* =========================================================
   ADMIN INTAKE HELPERS
   ========================================================= */

export function createAdminFieldMapFromConsultation({
  artistName = '',
  projectName = '',
  primaryUseCase = '',
  styleOfPlaying = '',
  diameter = '',
  depth = '',
  genreContext = '',
  desiredOutcome = '',
  currentPainPoints = '',
  influenceReferences = '',
  visualMood = '',
  finishDirection = '',
  woodPreference = '',
  attack = '',
  body = '',
  sensitivity = '',
  sustain = '',
  projection = '',
  tuningRange = '',
  articulation = '',
  feel = '',
} = {}) {
  return {
    'buildIdentity.artistName': artistName,
    'buildIdentity.projectName': projectName,
    'buildIdentity.primaryUseCase': primaryUseCase,
    'buildIdentity.styleOfPlaying': styleOfPlaying,
    'buildIdentity.size.diameter': diameter,
    'buildIdentity.size.depth': depth,
    'globalProfile.playerContext.genreContext': genreContext,
    'globalProfile.playerContext.desiredOutcome': desiredOutcome,
    'globalProfile.playerContext.currentPainPoints': currentPainPoints,
    'globalProfile.playerContext.influenceReferences': influenceReferences,
    'globalProfile.aestheticIntent.visualMood': visualMood,
    'globalProfile.aestheticIntent.finishDirection': finishDirection,
    'globalProfile.aestheticIntent.woodPreference': woodPreference,
    'globalProfile.sonicIntent.attack': attack,
    'globalProfile.sonicIntent.body': body,
    'globalProfile.sonicIntent.sensitivity': sensitivity,
    'globalProfile.sonicIntent.sustain': sustain,
    'globalProfile.sonicIntent.projection': projection,
    'globalProfile.sonicIntent.tuningRange': tuningRange,
    'globalProfile.sonicIntent.articulation': articulation,
    'globalProfile.sonicIntent.feel': feel,
  };
}

export function createAdminFieldMapFromQuestionnaire({
  artistName = '',
  styleOfPlaying = '',
  desiredOutcome = '',
  genreContext = '',
  recordingUse = '',
  liveUse = '',
  influenceReferences = '',
  hardwareFinish = '',
  woodPreference = '',
  finishDirection = '',
} = {}) {
  return {
    'buildIdentity.artistName': artistName,
    'buildIdentity.styleOfPlaying': styleOfPlaying,
    'globalProfile.playerContext.desiredOutcome': desiredOutcome,
    'globalProfile.playerContext.genreContext': genreContext,
    'globalProfile.playerContext.recordingUse': recordingUse,
    'globalProfile.playerContext.liveUse': liveUse,
    'globalProfile.playerContext.influenceReferences': influenceReferences,
    'globalProfile.aestheticIntent.hardwareFinish': hardwareFinish,
    'globalProfile.aestheticIntent.woodPreference': woodPreference,
    'globalProfile.aestheticIntent.finishDirection': finishDirection,
  };
}

/* =========================================================
   DRAFT PAYLOAD HELPERS
   ========================================================= */

export function createChapterDraftPayload(record, chapterKey) {
  const chapter = record?.chapters?.[chapterKey] || {};
  const overview = buildStorySectionInput(record, chapterKey, 'chapterOverview');
  const buildNotes = buildStorySectionInput(record, chapterKey, 'buildNotesStory');

  return {
    chapterKey,
    confidenceScore: chapter.confidenceScore || 0,
    unresolvedCriticalFields: chapter.unresolvedCriticalFields || [],
    flags: chapter.flags || [ENGINE_FLAGS.REVIEW_BEFORE_DRAFT],
    sectionInputs: {
      chapterOverview: overview,
      buildNotesStory: buildNotes,
    },
    buildIdentity: record.buildIdentity,
    globalProfile: record.globalProfile,
    buildSpec: record.buildSpec,
    recommendations: record.recommendations,
  };
}

export function createFullDraftPayload(record) {
  return {
    projectId: record.projectId || null,
    artistId: record.artistId || null,
    engineMeta: record.engineMeta || {},
    buildIdentity: record.buildIdentity,
    globalProfile: record.globalProfile,
    buildSpec: record.buildSpec,
    recommendations: record.recommendations,
    chapters: Object.keys(record.chapters || {}).reduce((acc, chapterKey) => {
      acc[chapterKey] = createChapterDraftPayload(record, chapterKey);
      return acc;
    }, {}),
  };
}

/* =========================================================
   SMALL UTILS
   ========================================================= */

export function uniq(arr = []) {
  return [...new Set((arr || []).filter(Boolean))];
}

export function clamp(value, min = 0, max = 1) {
  const num = Number(value || 0);
  return Math.max(min, Math.min(max, num));
}