// src/utils/storyEngineDrafting.js

import { CHAPTER_KEYS, STORY_SECTIONS, WRITING_MODE, ENGINE_FLAGS } from './storyEngineSchema';
import {
  buildStorySectionPrompt,
  buildUniqueBuildTraitsPrompt,
  getChapterPromptProfile,
} from './storyEnginePrompts';
import {
  buildStorySectionInput,
  createChapterDraftPayload,
  createFullDraftPayload,
  cloneStoryEngineRecord,
  saveStoryText,
  setByPath,
  uniq,
  clamp,
} from './storyEngineHelpers';

/* =========================================================
   LABELS / FIELD FORMATTERS
   ========================================================= */

export const FIELD_LABELS = {
  'buildIdentity.projectName': 'project name',
  'buildIdentity.artistName': 'artist name',
  'buildIdentity.primaryUseCase': 'primary use case',
  'buildIdentity.styleOfPlaying': 'style of playing',
  'buildIdentity.size.diameter': 'diameter',
  'buildIdentity.size.depth': 'depth',

  'globalProfile.playerContext.genreContext': 'genre context',
  'globalProfile.playerContext.desiredOutcome': 'desired outcome',
  'globalProfile.playerContext.currentPainPoints': 'current pain points',
  'globalProfile.playerContext.influenceReferences': 'influence references',
  'globalProfile.playerContext.recordingUse': 'recording use',
  'globalProfile.playerContext.liveUse': 'live use',
  'globalProfile.playerContext.venueType': 'venue type',

  'globalProfile.aestheticIntent.visualMood': 'visual mood',
  'globalProfile.aestheticIntent.finishDirection': 'finish direction',
  'globalProfile.aestheticIntent.woodPreference': 'wood preference',
  'globalProfile.aestheticIntent.hardwareFinish': 'hardware finish',
  'globalProfile.aestheticIntent.badgeDirection': 'badge direction',

  'globalProfile.sonicIntent.attack': 'attack',
  'globalProfile.sonicIntent.body': 'body',
  'globalProfile.sonicIntent.sensitivity': 'sensitivity',
  'globalProfile.sonicIntent.sustain': 'sustain',
  'globalProfile.sonicIntent.projection': 'projection',
  'globalProfile.sonicIntent.tuningRange': 'tuning range',
  'globalProfile.sonicIntent.articulation': 'articulation',
  'globalProfile.sonicIntent.feel': 'feel',

  'buildSpec.shellConstruction': 'shell construction',
  'buildSpec.primaryWood': 'primary wood',
  'buildSpec.secondaryWood': 'secondary wood',
  'buildSpec.shellThicknessStrategy': 'shell thickness strategy',
  'buildSpec.reinforcementRings': 'reinforcement rings',
  'buildSpec.bearingEdge': 'bearing edge',
  'buildSpec.snareBed': 'snare bed',
  'buildSpec.hoopType': 'hoop type',
  'buildSpec.lugType': 'lug type',
  'buildSpec.lugCount': 'lug count',
  'buildSpec.headPairingDirection': 'head pairing direction',
  'buildSpec.wireDirection': 'wire direction',
  'buildSpec.finishSystem': 'finish system',
  'buildSpec.tuningApproach': 'tuning approach',

  'recommendations.shellConstruction': 'recommended shell construction',
  'recommendations.primaryWood': 'recommended primary wood',
  'recommendations.secondaryWood': 'recommended secondary wood',
  'recommendations.bearingEdge': 'recommended bearing edge',
  'recommendations.hoopType': 'recommended hoop type',
  'recommendations.lugCount': 'recommended lug count',
  'recommendations.tuningApproach': 'recommended tuning approach',
  'recommendations.finishSystem': 'recommended finish system',
};

export function getFieldLabel(fieldPath = '') {
  return FIELD_LABELS[fieldPath] || fieldPath.split('.').slice(-1)[0] || fieldPath;
}

export function stringifyValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
}

export function sentenceCase(value = '') {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function joinNatural(items = []) {
  const clean = (items || []).map((item) => String(item).trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}

export function compactFacts(facts = []) {
  return (facts || []).filter((fact) => {
    const value = fact?.value;
    if (value == null) return false;
    if (typeof value === 'string' && !value.trim()) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}

/* =========================================================
   FACT ACCESS HELPERS
   ========================================================= */

export function getFactValue(facts = [], fieldPath = '') {
  const match = (facts || []).find((fact) => fact.fieldPath === fieldPath);
  return match?.value ?? null;
}

export function getFactValues(facts = [], fieldPaths = []) {
  return fieldPaths
    .map((path) => getFactValue(facts, path))
    .map((value) => stringifyValue(value))
    .filter(Boolean);
}

export function getIdentitySummary(facts = []) {
  const artistName = stringifyValue(getFactValue(facts, 'buildIdentity.artistName'));
  const projectName = stringifyValue(getFactValue(facts, 'buildIdentity.projectName'));
  const useCase = stringifyValue(getFactValue(facts, 'buildIdentity.primaryUseCase'));
  const style = stringifyValue(getFactValue(facts, 'buildIdentity.styleOfPlaying'));
  const genre = stringifyValue(
    getFactValue(facts, 'globalProfile.playerContext.genreContext')
  );
  const outcome = stringifyValue(
    getFactValue(facts, 'globalProfile.playerContext.desiredOutcome')
  );

  return {
    artistName,
    projectName,
    useCase,
    style,
    genre,
    outcome,
  };
}

export function getSizeSummary(facts = []) {
  const diameter = stringifyValue(getFactValue(facts, 'buildIdentity.size.diameter'));
  const depth = stringifyValue(getFactValue(facts, 'buildIdentity.size.depth'));

  if (diameter && depth) return `${diameter}" x ${depth}"`;
  if (diameter) return `${diameter}" diameter`;
  if (depth) return `${depth}" depth`;
  return '';
}

export function getBuildSummary(facts = []) {
  return {
    shellConstruction: stringifyValue(getFactValue(facts, 'buildSpec.shellConstruction')),
    primaryWood: stringifyValue(getFactValue(facts, 'buildSpec.primaryWood')),
    secondaryWood: stringifyValue(getFactValue(facts, 'buildSpec.secondaryWood')),
    bearingEdge: stringifyValue(getFactValue(facts, 'buildSpec.bearingEdge')),
    hoopType: stringifyValue(getFactValue(facts, 'buildSpec.hoopType')),
    lugCount: stringifyValue(getFactValue(facts, 'buildSpec.lugCount')),
    finishSystem: stringifyValue(getFactValue(facts, 'buildSpec.finishSystem')),
    tuningApproach: stringifyValue(getFactValue(facts, 'buildSpec.tuningApproach')),
  };
}

export function getSonicSummary(facts = []) {
  return {
    attack: stringifyValue(getFactValue(facts, 'globalProfile.sonicIntent.attack')),
    body: stringifyValue(getFactValue(facts, 'globalProfile.sonicIntent.body')),
    sensitivity: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.sensitivity')
    ),
    sustain: stringifyValue(getFactValue(facts, 'globalProfile.sonicIntent.sustain')),
    projection: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.projection')
    ),
    tuningRange: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.tuningRange')
    ),
    articulation: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.articulation')
    ),
    feel: stringifyValue(getFactValue(facts, 'globalProfile.sonicIntent.feel')),
  };
}

export function getAestheticSummary(facts = []) {
  return {
    visualMood: stringifyValue(
      getFactValue(facts, 'globalProfile.aestheticIntent.visualMood')
    ),
    finishDirection: stringifyValue(
      getFactValue(facts, 'globalProfile.aestheticIntent.finishDirection')
    ),
    woodPreference: stringifyValue(
      getFactValue(facts, 'globalProfile.aestheticIntent.woodPreference')
    ),
    hardwareFinish: stringifyValue(
      getFactValue(facts, 'globalProfile.aestheticIntent.hardwareFinish')
    ),
  };
}

/* =========================================================
   LANGUAGE BUILDING BLOCKS
   ========================================================= */

export function buildFocusPhrase(facts = []) {
  const identity = getIdentitySummary(facts);
  const size = getSizeSummary(facts);
  const sonic = getSonicSummary(facts);

  const pieces = [];

  if (identity.useCase) pieces.push(identity.useCase);
  if (identity.style) pieces.push(identity.style);
  if (identity.genre) pieces.push(identity.genre);
  if (size) pieces.push(size);

  const tonalPieces = [sonic.attack, sonic.body, sonic.articulation, sonic.feel].filter(Boolean);

  if (tonalPieces.length) {
    pieces.push(`a voice that feels ${joinNatural(tonalPieces.slice(0, 3))}`);
  }

  return joinNatural(pieces);
}

export function buildMaterialPhrase(facts = []) {
  const build = getBuildSummary(facts);
  const pieces = [];

  if (build.shellConstruction) pieces.push(build.shellConstruction);
  if (build.primaryWood) pieces.push(build.primaryWood);
  if (build.secondaryWood) pieces.push(build.secondaryWood);

  return joinNatural(pieces);
}

export function buildAestheticPhrase(facts = []) {
  const aesthetic = getAestheticSummary(facts);
  const pieces = [];

  if (aesthetic.visualMood) pieces.push(aesthetic.visualMood);
  if (aesthetic.finishDirection) pieces.push(aesthetic.finishDirection);
  if (aesthetic.hardwareFinish) pieces.push(aesthetic.hardwareFinish);

  return joinNatural(pieces);
}

export function buildNeedPhrase(facts = []) {
  const identity = getIdentitySummary(facts);
  const sonic = getSonicSummary(facts);

  const pieces = [
    identity.outcome,
    sonic.attack,
    sonic.body,
    sonic.sensitivity,
    sonic.projection,
    sonic.tuningRange,
  ].filter(Boolean);

  return joinNatural(pieces.slice(0, 4));
}

export function shouldUseRecommendationLanguage(writingMode) {
  return writingMode === WRITING_MODE.TRUTH_PLUS_RECOMMENDATION;
}

/* =========================================================
   FALLBACK DRAFT COMPOSERS
   ========================================================= */

export function composeFallbackOverview(sectionInput, chapterProfile) {
  const facts = compactFacts(sectionInput?.resolvedFacts || []);
  const identity = getIdentitySummary(facts);
  const build = getBuildSummary(facts);
  const size = getSizeSummary(facts);
  const focusPhrase = buildFocusPhrase(facts);
  const materialPhrase = buildMaterialPhrase(facts);
  const needPhrase = buildNeedPhrase(facts);

  const chapterName = chapterProfile?.chapterLabel || 'This chapter';

  const sentence1Parts = [];
  sentence1Parts.push(`${chapterName} centers on`);

  if (focusPhrase) {
    sentence1Parts.push(focusPhrase);
  } else if (needPhrase) {
    sentence1Parts.push(needPhrase);
  } else {
    sentence1Parts.push('the clearest priorities currently supported by the build profile');
  }

  let text = `${sentenceCase(sentence1Parts.join(' '))}.`;

  const sentence2Segments = [];

  if (materialPhrase) {
    sentence2Segments.push(`At this stage, the build begins to align around ${materialPhrase}`);
  } else if (build.tuningApproach || build.bearingEdge || build.finishSystem) {
    sentence2Segments.push(
      `At this stage, the build begins to align around ${joinNatural(
        [build.tuningApproach, build.bearingEdge, build.finishSystem].filter(Boolean)
      )}`
    );
  } else {
    sentence2Segments.push(
      'At this stage, the build needs to preserve a clear through-line between feel, response, and identity'
    );
  }

  if (size) {
    sentence2Segments.push(`within a ${size} format`);
  }

  text += ` ${sentenceCase(sentence2Segments.join(' '))}.`;

  if (identity.outcome) {
    text += ` What matters most here is keeping the drum pointed toward ${identity.outcome}.`;
  } else if (identity.useCase || identity.style) {
    text += ` What matters most here is protecting the qualities that make this drum right for how it will actually be played.`;
  } else {
    text += ` What matters most here is protecting the strongest supported direction without overstating what has not yet been confirmed.`;
  }

  return normalizeDraftLength(text, sectionInput?.lengthTarget);
}

export function composeFallbackBuildNotes(sectionInput, chapterProfile) {
  const facts = compactFacts(sectionInput?.resolvedFacts || []);
  const sonic = getSonicSummary(facts);
  const build = getBuildSummary(facts);
  const aesthetic = getAestheticSummary(facts);
  const identity = getIdentitySummary(facts);

  const recommendationMode = shouldUseRecommendationLanguage(sectionInput?.writingMode);

  const primaryDecision = joinNatural(
    [
      build.shellConstruction,
      build.primaryWood,
      build.bearingEdge,
      build.hoopType,
      build.tuningApproach,
      build.finishSystem,
    ].filter(Boolean).slice(0, 3)
  );

  const responseGoal = joinNatural(
    [sonic.attack, sonic.body, sonic.sensitivity, sonic.articulation, sonic.feel]
      .filter(Boolean)
      .slice(0, 3)
  );

  const visualGoal = joinNatural(
    [aesthetic.visualMood, aesthetic.finishDirection, aesthetic.hardwareFinish]
      .filter(Boolean)
      .slice(0, 2)
  );

  let text = '';

  if (primaryDecision) {
    text += recommendationMode
      ? `The strongest current direction for this chapter is to lean into ${primaryDecision}`
      : `This chapter is where ${primaryDecision} starts to carry real weight in the build`;
  } else {
    text += recommendationMode
      ? `The strongest current direction for this chapter is to preserve the clearest supported build priorities`
      : `This chapter is where the clearest supported priorities need to become more intentional`;
  }

  if (responseGoal) {
    text += `, especially in service of a response that feels ${responseGoal}`;
  }

  text += '.';

  if (identity.outcome) {
    text += ` Every choice here should continue to support a drum that lands in the direction of ${identity.outcome}.`;
  } else if (identity.useCase || identity.style) {
    text += ` Every choice here should continue to support the way this instrument is actually meant to be used.`;
  }

  if (visualGoal) {
    text += ` Visually, the build should stay aligned with a direction that feels ${visualGoal}, so the final instrument reads as one complete idea rather than a collection of parts.`;
  } else {
    text += ` The goal is not excess, but coherence, so the build decisions keep reinforcing one another as the drum takes shape.`;
  }

  return normalizeDraftLength(text, sectionInput?.lengthTarget);
}

/* =========================================================
   UNIQUE BUILD TRAITS
   ========================================================= */

export function composeFallbackUniqueTraits(chapterPayload = {}) {
  const overviewFacts = chapterPayload?.sectionInputs?.chapterOverview?.resolvedFacts || [];
  const buildNotesFacts = chapterPayload?.sectionInputs?.buildNotesStory?.resolvedFacts || [];
  const facts = compactFacts([...overviewFacts, ...buildNotesFacts]);

  const build = getBuildSummary(facts);
  const sonic = getSonicSummary(facts);
  const aesthetic = getAestheticSummary(facts);
  const identity = getIdentitySummary(facts);
  const size = getSizeSummary(facts);

  const traits = [];

  if (build.primaryWood || build.shellConstruction) {
    traits.push(
      trimTrait(
        `${joinNatural([build.shellConstruction, build.primaryWood].filter(Boolean))} foundation shaped to support the core voice of the drum`
      )
    );
  }

  if (sonic.attack || sonic.body || sonic.articulation) {
    traits.push(
      trimTrait(
        `Response aimed toward ${joinNatural(
          [sonic.attack, sonic.body, sonic.articulation].filter(Boolean).slice(0, 3)
        )}`
      )
    );
  }

  if (build.bearingEdge || build.hoopType || build.tuningApproach) {
    traits.push(
      trimTrait(
        `${joinNatural(
          [build.bearingEdge, build.hoopType, build.tuningApproach]
            .filter(Boolean)
            .slice(0, 2)
        )} chosen to reinforce feel and control`
      )
    );
  }

  if (aesthetic.visualMood || aesthetic.finishDirection || aesthetic.hardwareFinish) {
    traits.push(
      trimTrait(
        `Visual direction keeps the build grounded in ${joinNatural(
          [aesthetic.visualMood, aesthetic.finishDirection, aesthetic.hardwareFinish]
            .filter(Boolean)
            .slice(0, 2)
        )}`
      )
    );
  }

  if (identity.useCase || identity.style || size) {
    traits.push(
      trimTrait(
        `${joinNatural([size, identity.useCase, identity.style].filter(Boolean).slice(0, 3))} points to a very specific role for the instrument`
      )
    );
  }

  return uniq(traits).filter(Boolean).slice(0, 3);
}

export function trimTrait(text = '', maxWords = 22) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
}

/* =========================================================
   DRAFT NORMALIZATION
   ========================================================= */

export function wordCount(text = '') {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeDraftLength(text = '', lengthTarget = null) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!lengthTarget) return cleaned;

  const maxWords = lengthTarget?.maxWords || 140;
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return cleaned;
  return `${words.slice(0, maxWords).join(' ').replace(/[.,;:!?-]*$/, '')}.`;
}

/* =========================================================
   PROMPT PACKAGE BUILDERS
   ========================================================= */

export function createChapterPromptPackage(record, chapterKey) {
  const chapterPayload = createChapterDraftPayload(record, chapterKey);
  const chapterOverviewInput = buildStorySectionInput(
    record,
    chapterKey,
    STORY_SECTIONS.CHAPTER_OVERVIEW
  );
  const buildNotesInput = buildStorySectionInput(
    record,
    chapterKey,
    STORY_SECTIONS.BUILD_NOTES_STORY
  );

  const overviewPrompt = buildStorySectionPrompt({
    chapterKey,
    sectionKey: STORY_SECTIONS.CHAPTER_OVERVIEW,
    writingMode: chapterOverviewInput.writingMode,
    resolvedFacts: chapterOverviewInput.resolvedFacts,
    reviewFacts: chapterOverviewInput.reviewFacts,
    confidence: chapterOverviewInput.confidence,
    lengthTarget: chapterOverviewInput.lengthTarget,
  });

  const buildNotesPrompt = buildStorySectionPrompt({
    chapterKey,
    sectionKey: STORY_SECTIONS.BUILD_NOTES_STORY,
    writingMode: buildNotesInput.writingMode,
    resolvedFacts: buildNotesInput.resolvedFacts,
    reviewFacts: buildNotesInput.reviewFacts,
    confidence: buildNotesInput.confidence,
    lengthTarget: buildNotesInput.lengthTarget,
  });

  const uniqueTraitsPrompt = buildUniqueBuildTraitsPrompt({
    chapterKey,
    resolvedFacts: compactFacts([
      ...chapterOverviewInput.resolvedFacts,
      ...buildNotesInput.resolvedFacts,
    ]),
    recommendations: [],
  });

  return {
    ...chapterPayload,
    overviewPrompt,
    buildNotesPrompt,
    uniqueTraitsPrompt,
  };
}

/* =========================================================
   PREVIEW BUILDERS
   ========================================================= */

export function createChapterDraftPreview(record, chapterKey) {
  const promptPackage = createChapterPromptPackage(record, chapterKey);
  const chapterProfile = getChapterPromptProfile(chapterKey);

  const chapterOverview = composeFallbackOverview(
    promptPackage.sectionInputs.chapterOverview,
    chapterProfile
  );

  const buildNotesStory = composeFallbackBuildNotes(
    promptPackage.sectionInputs.buildNotesStory,
    chapterProfile
  );

  const uniqueBuildTraits = composeFallbackUniqueTraits(promptPackage);

  return {
    chapterKey,
    chapterLabel: promptPackage.overviewPrompt.chapterLabel,
    confidenceScore: clamp(promptPackage.confidenceScore || 0),
    flags: promptPackage.flags || [ENGINE_FLAGS.REVIEW_BEFORE_DRAFT],
    prompts: {
      chapterOverview: promptPackage.overviewPrompt,
      buildNotesStory: promptPackage.buildNotesPrompt,
      uniqueBuildTraits: promptPackage.uniqueTraitsPrompt,
    },
    fallbackDraft: {
      chapterOverview,
      buildNotesStory,
      uniqueBuildTraits,
    },
  };
}

export function createAllChapterDraftPreviews(record) {
  return Object.keys(record?.chapters || {}).reduce((acc, chapterKey) => {
    acc[chapterKey] = createChapterDraftPreview(record, chapterKey);
    return acc;
  }, {});
}

/* =========================================================
   WRITE DRAFTS BACK TO RECORD
   ========================================================= */

export function saveChapterDraftPreview(
  record,
  chapterKey,
  draftPreview,
  draftedBy = 'story_engine'
) {
  const next = cloneStoryEngineRecord(record);
  const now = new Date().toISOString();

  setByPath(
    next,
    `chapters.${chapterKey}.drafts.chapterOverview`,
    draftPreview?.fallbackDraft?.chapterOverview || ''
  );

  setByPath(
    next,
    `chapters.${chapterKey}.drafts.buildNotesStory`,
    draftPreview?.fallbackDraft?.buildNotesStory || ''
  );

  setByPath(
    next,
    `chapters.${chapterKey}.drafts.uniqueBuildTraits`,
    draftPreview?.fallbackDraft?.uniqueBuildTraits || []
  );

  setByPath(next, `chapters.${chapterKey}.drafts.lastDraftedAt`, now);
  setByPath(next, `chapters.${chapterKey}.drafts.lastDraftedBy`, draftedBy);

  return next;
}

export function saveAllChapterDraftPreviews(record, draftedBy = 'story_engine') {
  let next = cloneStoryEngineRecord(record);
  const previews = createAllChapterDraftPreviews(next);

  Object.entries(previews).forEach(([chapterKey, preview]) => {
    next = saveChapterDraftPreview(next, chapterKey, preview, draftedBy);

    next = saveStoryText(next, chapterKey, STORY_SECTIONS.CHAPTER_OVERVIEW, {
      text: preview?.fallbackDraft?.chapterOverview || '',
      writingMode: preview?.prompts?.chapterOverview?.writingMode || WRITING_MODE.HOLD_FOR_REVIEW,
      confidence: preview?.prompts?.chapterOverview?.confidence || 0,
      basedOnStatuses:
        preview?.prompts?.chapterOverview?.resolvedFacts?.map((fact) => fact.status) || [],
      basedOnFieldKeys:
        preview?.prompts?.chapterOverview?.resolvedFacts?.map((fact) => fact.fieldPath) || [],
      reviewNeeded:
        preview?.prompts?.chapterOverview?.reviewFacts?.length > 0 ||
        preview?.prompts?.chapterOverview?.writingMode === WRITING_MODE.HOLD_FOR_REVIEW,
      reviewReasons:
        preview?.prompts?.chapterOverview?.reviewFacts?.flatMap(
          (fact) => fact.reviewReasons || []
        ) || [],
    });

    next = saveStoryText(next, chapterKey, STORY_SECTIONS.BUILD_NOTES_STORY, {
      text: preview?.fallbackDraft?.buildNotesStory || '',
      writingMode:
        preview?.prompts?.buildNotesStory?.writingMode || WRITING_MODE.HOLD_FOR_REVIEW,
      confidence: preview?.prompts?.buildNotesStory?.confidence || 0,
      basedOnStatuses:
        preview?.prompts?.buildNotesStory?.resolvedFacts?.map((fact) => fact.status) || [],
      basedOnFieldKeys:
        preview?.prompts?.buildNotesStory?.resolvedFacts?.map((fact) => fact.fieldPath) || [],
      reviewNeeded:
        preview?.prompts?.buildNotesStory?.reviewFacts?.length > 0 ||
        preview?.prompts?.buildNotesStory?.writingMode === WRITING_MODE.HOLD_FOR_REVIEW,
      reviewReasons:
        preview?.prompts?.buildNotesStory?.reviewFacts?.flatMap(
          (fact) => fact.reviewReasons || []
        ) || [],
    });
  });

  return next;
}

/* =========================================================
   HIGH-LEVEL PIPELINE
   ========================================================= */

export function runStoryDraftPipeline(record, draftedBy = 'story_engine') {
  return saveAllChapterDraftPreviews(record, draftedBy);
}

export function createFullDraftPreviewPayload(record) {
  const fullPayload = createFullDraftPayload(record);

  return {
    ...fullPayload,
    previews: createAllChapterDraftPreviews(record),
  };
}

/* =========================================================
   KNOWN CHAPTER ORDER
   ========================================================= */

export const CHAPTER_ORDER = [
  CHAPTER_KEYS.DISCOVERY_DESIGN,
  CHAPTER_KEYS.COMMITMENT_PORTAL,
  CHAPTER_KEYS.WOOD_VISION_LOCK_IN,
  CHAPTER_KEYS.RAW_SHELL_CREATION,
  CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE,
  CHAPTER_KEYS.EXTERIOR_ART_FINISH,
  CHAPTER_KEYS.EDGES_SNARE_BEDS,
  CHAPTER_KEYS.HARDWARE_ASSEMBLY,
  CHAPTER_KEYS.LEGACY_TUNING_MEDIA,
  CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY,
];