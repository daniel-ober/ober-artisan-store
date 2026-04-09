import {
  CHAPTER_KEYS,
  STORY_SECTIONS,
  WRITING_MODE,
  ENGINE_FLAGS,
} from './storyEngineSchema';
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
  'buildIdentity.preferredSizeDirection': 'preferred size direction',

  'globalProfile.playerContext.responsePriorities': 'response priorities',
  'globalProfile.playerContext.tonalGoals': 'tonal goals',
  'globalProfile.playerContext.consultationContactMethod':
    'consultation contact method',
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
  return (
    FIELD_LABELS[fieldPath] || fieldPath.split('.').slice(-1)[0] || fieldPath
  );
}

export function stringifyValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
}

export function splitCommaString(value = '') {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listifyValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const str = stringifyValue(value);
  if (!str) return [];
  if (!str.includes(',')) return [str];

  return splitCommaString(str);
}

export function sentenceCase(value = '') {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeComparableText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeTextItems(items = []) {
  const seen = new Set();

  return (items || []).filter((item) => {
    const cleaned = String(item || '').trim();
    if (!cleaned) return false;

    const normalized = normalizeComparableText(cleaned);
    if (!normalized) return false;
    if (seen.has(normalized)) return false;

    seen.add(normalized);
    return true;
  });
}

export function joinNatural(items = []) {
  const clean = dedupeTextItems(items);

  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}

export function takeDistinct(items = [], limit = 3) {
  return dedupeTextItems(items).slice(0, limit);
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
   VOICING NARRATIVE HELPERS
   ========================================================= */

export function getVoicingNarrative(record = null) {
  return record?.engineMeta?.voicingNarrative || null;
}

export function getChapterSignal(record = null, chapterKey = '') {
  return getVoicingNarrative(record)?.chapterSignals?.[chapterKey] || null;
}

export function getSignalArray(signal, keys = []) {
  if (!signal || !Array.isArray(keys)) return [];

  for (const key of keys) {
    const value = signal?.[key];
    if (Array.isArray(value) && value.length) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
  }

  return [];
}

export function getSignalValue(signal, keys = []) {
  if (!signal || !Array.isArray(keys)) return '';

  for (const key of keys) {
    const value = signal?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

export function getSignalPrimaryDirection(signal) {
  return getSignalValue(signal, [
    'primaryDirection',
    'direction',
    'buildDirection',
    'chapterDirection',
    'focusDirection',
  ]);
}

export function getSignalResponseWords(signal) {
  return getSignalArray(signal, [
    'responseWords',
    'responseTargets',
    'responseProfile',
    'voiceWords',
    'responseDescriptors',
  ]);
}

export function getSignalMaterialWords(signal) {
  return getSignalArray(signal, [
    'materialWords',
    'materialDirection',
    'materialProfile',
    'shellDirection',
  ]);
}

export function getSignalVisualWords(signal) {
  return getSignalArray(signal, [
    'visualWords',
    'aestheticWords',
    'finishWords',
    'visualDirection',
  ]);
}

export function getSignalUseCaseWords(signal) {
  return getSignalArray(signal, [
    'useCaseWords',
    'useCases',
    'contextWords',
    'playerContexts',
  ]);
}

export function getSignalTensionWords(signal) {
  return getSignalArray(signal, [
    'tensionWords',
    'tradeoffWords',
    'priorityWords',
    'balancingWords',
  ]);
}

export function getSignalInfluenceWords(signal) {
  return getSignalArray(signal, [
    'influenceWords',
    'referenceWords',
    'influenceReferences',
  ]);
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
  const artistName = stringifyValue(
    getFactValue(facts, 'buildIdentity.artistName')
  );
  const projectName = stringifyValue(
    getFactValue(facts, 'buildIdentity.projectName')
  );
  const useCase = stringifyValue(
    getFactValue(facts, 'buildIdentity.primaryUseCase')
  );
  const style = stringifyValue(
    getFactValue(facts, 'buildIdentity.styleOfPlaying')
  );
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

export function getPlayerContextSummary(facts = []) {
  const responsePrioritiesRaw = getFactValue(
    facts,
    'globalProfile.playerContext.responsePriorities'
  );
  const tonalGoalsRaw = getFactValue(
    facts,
    'globalProfile.playerContext.tonalGoals'
  );

  return {
    responsePriorities: listifyValue(responsePrioritiesRaw),
    tonalGoals: listifyValue(tonalGoalsRaw),
    consultationContactMethod: stringifyValue(
      getFactValue(
        facts,
        'globalProfile.playerContext.consultationContactMethod'
      )
    ),
    preferredSizeDirection: stringifyValue(
      getFactValue(facts, 'buildIdentity.preferredSizeDirection')
    ),
  };
}

export function getSizeSummary(facts = []) {
  const diameter = stringifyValue(
    getFactValue(facts, 'buildIdentity.size.diameter')
  );
  const depth = stringifyValue(getFactValue(facts, 'buildIdentity.size.depth'));

  if (diameter && depth) return `${diameter}" x ${depth}"`;
  if (diameter) return `${diameter}" diameter`;
  if (depth) return `${depth}" depth`;
  return '';
}

export function getBuildSummary(facts = []) {
  return {
    shellConstruction: stringifyValue(
      getFactValue(facts, 'buildSpec.shellConstruction')
    ),
    primaryWood: stringifyValue(getFactValue(facts, 'buildSpec.primaryWood')),
    secondaryWood: stringifyValue(
      getFactValue(facts, 'buildSpec.secondaryWood')
    ),
    bearingEdge: stringifyValue(getFactValue(facts, 'buildSpec.bearingEdge')),
    hoopType: stringifyValue(getFactValue(facts, 'buildSpec.hoopType')),
    lugCount: stringifyValue(getFactValue(facts, 'buildSpec.lugCount')),
    finishSystem: stringifyValue(getFactValue(facts, 'buildSpec.finishSystem')),
    tuningApproach: stringifyValue(
      getFactValue(facts, 'buildSpec.tuningApproach')
    ),
  };
}

export function getSonicSummary(facts = []) {
  return {
    attack: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.attack')
    ),
    body: stringifyValue(getFactValue(facts, 'globalProfile.sonicIntent.body')),
    sensitivity: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.sensitivity')
    ),
    sustain: stringifyValue(
      getFactValue(facts, 'globalProfile.sonicIntent.sustain')
    ),
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
   CHAPTER COPY HELPERS
   ========================================================= */

export function formatSizeDirection(value = '') {
  const cleaned = stringifyValue(value);
  if (!cleaned) return '';

  if (/^\d+(\.\d+)?("?|-inch| inch|in)?$/i.test(cleaned)) {
    return `${cleaned.replace(/("|-inch| inch|in)$/i, '')}" format`;
  }

  if (/format$/i.test(cleaned) || /size$/i.test(cleaned)) {
    return cleaned;
  }

  return `${cleaned} direction`;
}

export function getChapterPurposeLine(chapterKey, summary = {}) {
  const outcome = summary.identity?.outcome || '';

  const map = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]: outcome
      ? `What matters most here is understanding what the drum has to do in order to become ${outcome}.`
      : 'What matters most here is getting clear about the real musical job this drum needs to do.',

    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      'What matters most here is turning a good direction into a committed one so later decisions stay aligned.',

    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      'What matters most here is choosing the shell direction that will shape the voice, feel, and identity of the instrument from this point forward.',

    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      'What matters most here is building a shell that gives the rest of the process something trustworthy to build on.',

    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      'What matters most here is refining the shell until its response is consistent, musical, and ready for the next layer of decisions.',

    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      'What matters most here is making the visual language feel intentional without disconnecting it from the instrument underneath.',

    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      'What matters most here is shaping the contact points that most directly affect sensitivity, articulation, and response.',

    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      'What matters most here is making sure the hardware supports the voice instead of fighting it.',

    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]: outcome
      ? `What matters most here is making sure the final tuning and presentation still point clearly toward ${outcome}.`
      : 'What matters most here is bringing the drum into a finished voice that is worth documenting and easy to understand.',

    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      'What matters most here is confirming that the finished drum sounds, feels, and presents the way it was meant to before it leaves the shop.',
  };

  return (
    map[chapterKey] ||
    'What matters most here is protecting the strongest supported direction without overstating what has not yet been confirmed.'
  );
}

export function buildChapterSummaryContext(facts = []) {
  return {
    identity: getIdentitySummary(facts),
    playerContext: getPlayerContextSummary(facts),
    build: getBuildSummary(facts),
    sonic: getSonicSummary(facts),
    aesthetic: getAestheticSummary(facts),
    size: getSizeSummary(facts),
  };
}

export function getChapterOverviewLead(chapterKey, summary = {}) {
  const { identity, playerContext, build, aesthetic, size } = summary;

  const sizeLabel = playerContext?.preferredSizeDirection
    ? formatSizeDirection(playerContext.preferredSizeDirection)
    : size;

  const responseFocus = joinNatural(
    takeDistinct(
      [
        ...playerContext.responsePriorities,
        ...playerContext.tonalGoals,
      ].filter(Boolean),
      3
    )
  );

  const materialFocus = joinNatural(
    takeDistinct(
      [
        build.shellConstruction,
        build.primaryWood,
        build.secondaryWood,
      ].filter(Boolean),
      3
    )
  );

  const visualFocus = joinNatural(
    takeDistinct(
      [
        build.finishSystem,
        aesthetic.visualMood,
        aesthetic.finishDirection,
      ].filter(Boolean),
      3
    )
  );

  const hardwareFocus = joinNatural(
    takeDistinct(
      [build.hoopType, build.lugCount, aesthetic.hardwareFinish].filter(
        Boolean
      ),
      3
    )
  );

  const byChapter = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]:
      responseFocus || identity.outcome || joinNatural(
        takeDistinct(
          [identity.useCase, identity.style, identity.genre].filter(Boolean),
          3
        )
      ),

    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      identity.outcome || responseFocus || sizeLabel,

    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      materialFocus,

    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      joinNatural(
        takeDistinct(
          [build.shellConstruction, build.primaryWood, sizeLabel].filter(Boolean),
          3
        )
      ),

    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      joinNatural(
        takeDistinct(
          [build.tuningApproach, build.bearingEdge, responseFocus].filter(
            Boolean
          ),
          3
        )
      ),

    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      visualFocus,

    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      joinNatural(
        takeDistinct([build.bearingEdge, build.snareBed, responseFocus].filter(Boolean), 3)
      ),

    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      hardwareFocus,

    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]:
      joinNatural(
        takeDistinct([build.tuningApproach, identity.outcome, responseFocus].filter(Boolean), 3)
      ),

    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      identity.outcome || joinNatural(
        takeDistinct([sizeLabel, responseFocus].filter(Boolean), 2)
      ),
  };

  return byChapter[chapterKey] || '';
}

/* =========================================================
   LANGUAGE BUILDING BLOCKS
   ========================================================= */

export function buildFocusPhrase(facts = []) {
  const identity = getIdentitySummary(facts);
  const size = getSizeSummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const pieces = [
    identity.useCase,
    identity.style,
    identity.genre,
    playerContext.preferredSizeDirection
      ? formatSizeDirection(playerContext.preferredSizeDirection)
      : size,
    ...takeDistinct(playerContext.tonalGoals, 2),
  ].filter(Boolean);

  return joinNatural(pieces);
}

export function buildMaterialPhrase(facts = []) {
  const build = getBuildSummary(facts);

  return joinNatural(
    takeDistinct(
      [build.shellConstruction, build.primaryWood, build.secondaryWood].filter(
        Boolean
      ),
      3
    )
  );
}

export function buildAestheticPhrase(facts = []) {
  const aesthetic = getAestheticSummary(facts);

  return joinNatural(
    takeDistinct(
      [
        aesthetic.visualMood,
        aesthetic.finishDirection,
        aesthetic.hardwareFinish,
      ].filter(Boolean),
      3
    )
  );
}

export function buildNeedPhrase(facts = []) {
  const identity = getIdentitySummary(facts);
  const sonic = getSonicSummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const pieces = [
    identity.outcome,
    ...takeDistinct(playerContext.responsePriorities, 2),
    ...takeDistinct(playerContext.tonalGoals, 2),
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

export function composeFallbackOverview(
  sectionInput,
  chapterProfile,
  record = null
) {
  const facts = compactFacts(sectionInput?.resolvedFacts || []);
  const summary = buildChapterSummaryContext(facts);

  const { playerContext, build, aesthetic, size } = summary;

  const signal = getChapterSignal(record, sectionInput?.chapterKey);
  const signalResponse = joinNatural(
    takeDistinct(getSignalResponseWords(signal), 3)
  );
  const signalUseCases = joinNatural(
    takeDistinct(getSignalUseCaseWords(signal), 3)
  );
  const signalTension = joinNatural(
    takeDistinct(getSignalTensionWords(signal), 2)
  );

  const chapterName = chapterProfile?.chapterLabel || 'This chapter';
  const chapterKey = sectionInput?.chapterKey;
  const overviewLead = getChapterOverviewLead(chapterKey, summary);

  const materialFocus = joinNatural(
    takeDistinct(
      [
        build.shellConstruction,
        build.primaryWood,
        build.secondaryWood,
        build.bearingEdge,
        build.tuningApproach,
        build.finishSystem,
      ].filter(Boolean),
      3
    )
  );

  const aestheticFocus = joinNatural(
    takeDistinct(
      [
        aesthetic.visualMood,
        aesthetic.finishDirection,
        aesthetic.hardwareFinish,
      ].filter(Boolean),
      2
    )
  );

  const sizeLabel = playerContext?.preferredSizeDirection
    ? formatSizeDirection(playerContext.preferredSizeDirection)
    : size;

  const stageLineMap = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]:
      'At this stage, the job is to translate priorities into a build direction that already feels believable.',
    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      'At this stage, the job is to stabilize the direction so the build can move forward without unnecessary drift.',
    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      materialFocus
        ? `At this stage, the shell direction starts to take real shape through ${materialFocus}.`
        : 'At this stage, the shell direction starts to take real shape through the clearest supported material choices.',
    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      materialFocus
        ? `At this stage, the physical shell begins to embody ${materialFocus}.`
        : 'At this stage, the physical shell begins to embody the strongest supported direction.',
    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      materialFocus
        ? `At this stage, the shell is refined so choices like ${materialFocus} translate into a more dependable response.`
        : 'At this stage, the shell is refined so the intended response becomes more dependable and repeatable.',
    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      materialFocus
        ? `At this stage, the visual treatment begins to lock in around ${materialFocus}.`
        : 'At this stage, the visual treatment begins to lock in around the strongest supported finish direction.',
    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      materialFocus
        ? `At this stage, the most response-sensitive details begin to lock in around ${materialFocus}.`
        : 'At this stage, the most response-sensitive details begin to lock in.',
    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      materialFocus
        ? `At this stage, the instrument begins to come together through choices like ${materialFocus}.`
        : 'At this stage, the instrument begins to come together in a more complete and testable form.',
    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]:
      materialFocus
        ? `At this stage, the finished voice is clarified through choices like ${materialFocus}.`
        : 'At this stage, the finished voice is clarified and made easier to hear on its own terms.',
    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      'At this stage, the build needs to prove that the finished instrument still reflects the direction established earlier.',
  };

  let text = '';

  if (overviewLead) {
    text += `${chapterName} centers on ${overviewLead}.`;
  } else {
    text += `${chapterName} centers on the clearest priorities currently supported by the build profile.`;
  }

  text += ` ${stageLineMap[chapterKey] || 'At this stage, the build needs to preserve a clear through-line between feel, response, and identity.'}`;

  if (sizeLabel) {
    text += ` The frame for that work is a ${sizeLabel}.`;
  } else if (signalUseCases) {
    text += ` The frame for that work points toward ${signalUseCases}.`;
  }

  if (signalTension) {
    text += ` What matters most here is protecting the balance between ${signalTension}.`;
  } else if (
    aestheticFocus &&
    chapterKey === CHAPTER_KEYS.EXTERIOR_ART_FINISH
  ) {
    text += ` It also needs to stay visually coherent in a direction that feels ${aestheticFocus}.`;
  } else {
    text += ` ${getChapterPurposeLine(chapterKey, summary)}`;
  }

  if (!materialFocus && signalResponse) {
    text += ` The response still needs to stay pointed toward ${signalResponse}.`;
  }

  return normalizeDraftLength(text, sectionInput?.lengthTarget);
}

export function composeFallbackBuildNotes(
  sectionInput,
  chapterProfile,
  record = null
) {
  const facts = compactFacts(sectionInput?.resolvedFacts || []);
  const summary = buildChapterSummaryContext(facts);

  const { identity, playerContext, build, sonic, aesthetic } = summary;

  const signal = getChapterSignal(record, sectionInput?.chapterKey);
  const signalDirection = getSignalPrimaryDirection(signal);
  const signalResponseWords = takeDistinct(getSignalResponseWords(signal), 3);
  const signalMaterialWords = takeDistinct(getSignalMaterialWords(signal), 2);
  const signalVisualWords = takeDistinct(getSignalVisualWords(signal), 2);
  const signalTensionWords = takeDistinct(getSignalTensionWords(signal), 2);

  const recommendationMode = shouldUseRecommendationLanguage(
    sectionInput?.writingMode
  );

  const chapterKey = sectionInput?.chapterKey;

  const primaryDecision = joinNatural(
    takeDistinct(
      [
        build.shellConstruction,
        build.primaryWood,
        build.bearingEdge,
        build.hoopType,
        build.tuningApproach,
        build.finishSystem,
      ].filter(Boolean),
      3
    )
  );

  const responseGoal = joinNatural(
    takeDistinct(
      [
        sonic.attack,
        sonic.body,
        sonic.sensitivity,
        sonic.articulation,
        sonic.feel,
        sonic.projection,
      ].filter(Boolean),
      3
    )
  );

  const playerPriorityGoal = joinNatural(
    takeDistinct(
      [
        ...playerContext.responsePriorities,
        ...playerContext.tonalGoals,
        playerContext.preferredSizeDirection
          ? formatSizeDirection(playerContext.preferredSizeDirection)
          : '',
      ].filter(Boolean),
      3
    )
  );

  const visualGoal = joinNatural(
    takeDistinct(
      [
        aesthetic.visualMood,
        aesthetic.finishDirection,
        aesthetic.hardwareFinish,
      ].filter(Boolean),
      2
    )
  );

  const signalResponseGoal = joinNatural(signalResponseWords);
  const signalVisualGoal = joinNatural(signalVisualWords);
  const signalMaterialGoal = joinNatural(signalMaterialWords);
  const signalTensionGoal = joinNatural(signalTensionWords);

  const openingMap = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]:
      'This chapter is where the build priorities stop being abstract and start becoming directional',
    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      'This chapter is where the direction gets firm enough to carry the rest of the process',
    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      recommendationMode && primaryDecision
        ? `The strongest current direction in this chapter is to commit to ${primaryDecision}`
        : `This chapter is where ${primaryDecision || 'the shell direction'} starts to define the drum in a more permanent way`,
    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      recommendationMode && primaryDecision
        ? `The strongest current direction in this chapter is to preserve ${primaryDecision}`
        : `This chapter is where ${primaryDecision || 'the shell direction'} becomes physical`,
    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      recommendationMode && primaryDecision
        ? `The strongest current direction in this chapter is to refine around ${primaryDecision}`
        : `This chapter is where consistency and control start to emerge through ${primaryDecision || 'the strongest supported refinements'}`,
    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      'This chapter is where the visual identity becomes deliberate',
    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      recommendationMode && primaryDecision
        ? `The strongest current direction in this chapter is to refine ${primaryDecision}`
        : `This chapter is where the most response-sensitive shaping work happens`,
    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      'This chapter is where fit, feel, and hardware choices start to define the finished instrument',
    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]:
      'This chapter is where the finished voice has to become undeniable',
    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      'This chapter is where the full instrument has to prove itself as a complete and finished build',
  };

  let text = openingMap[chapterKey];

  if (!text) {
    if (primaryDecision) {
      text = recommendationMode
        ? `The strongest current direction for this chapter is to lean into ${primaryDecision}`
        : `This chapter is where ${primaryDecision} starts to carry real weight in the build`;
    } else if (signalDirection) {
      text = recommendationMode
        ? `The strongest current direction for this chapter is to preserve ${signalDirection}`
        : `This chapter is where ${signalDirection} starts to become more intentional in the build`;
    } else {
      text = recommendationMode
        ? `The strongest current direction for this chapter is to preserve the clearest supported build priorities`
        : `This chapter is where the clearest supported priorities need to become more intentional`;
    }
  }

  if (
    ![
      CHAPTER_KEYS.EXTERIOR_ART_FINISH,
      CHAPTER_KEYS.HARDWARE_ASSEMBLY,
      CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY,
    ].includes(chapterKey)
  ) {
    if (responseGoal) {
      text += `, especially in service of a voice centered on ${responseGoal}`;
    } else if (playerPriorityGoal) {
      text += `, especially in service of priorities like ${playerPriorityGoal}`;
    } else if (signalResponseGoal) {
      text += `, especially in service of a voice centered on ${signalResponseGoal}`;
    }
  }

  text += '.';

  const supportLineMap = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]:
      identity.outcome
        ? `The decisions being clarified here should keep pointing toward ${identity.outcome}.`
        : 'The decisions being clarified here should stay tied to the actual musical role of the instrument.',

    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      'From here on out, clarity matters more than optionality, because later decisions will only be as strong as this commitment point.',

    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      'Once these material choices lock, they start influencing nearly every chapter that follows.',

    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      'If the shell is right here, later refinement has something honest to work with.',

    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      'Small adjustments here have an outsized effect on how the drum will tune, speak, and recover under the stick.',

    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      'The visual direction should elevate the instrument, not distract from what the build is trying to say.',

    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      'This is where subtle geometry choices start deciding how easily the drum speaks at low and medium dynamics.',

    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      'Nothing here should feel ornamental alone; each choice should support response, stability, or visual coherence.',

    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]:
      'By this point, the drum should not just sound good in isolation but sound recognizably like the build it set out to become.',

    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      'The standard here is not simply completion, but confidence that the finished build still holds together as one believable instrument.',
  };

  if (identity.outcome && playerPriorityGoal) {
    text += ` Every choice here should continue to support a drum that delivers ${identity.outcome} while protecting priorities like ${playerPriorityGoal}.`;
  } else if (identity.outcome) {
    text += ` Every choice here should continue to support a drum that serves ${identity.outcome}.`;
  } else if (signalTensionGoal) {
    text += ` Every choice here should continue to protect the balance between ${signalTensionGoal}.`;
  } else if (supportLineMap[chapterKey]) {
    text += ` ${supportLineMap[chapterKey]}`;
  } else if (identity.useCase || identity.style) {
    text += ` Every choice here should continue to support the way this instrument is actually meant to be used.`;
  }

  if (visualGoal) {
    text += ` Visually, the build should stay aligned with a direction that feels ${visualGoal}, so the final instrument reads as one complete idea rather than a collection of parts.`;
  } else if (signalVisualGoal) {
    text += ` Visually, the build should stay aligned with a direction that feels ${signalVisualGoal}, so the final instrument reads as one complete idea rather than a collection of parts.`;
  } else if (signalMaterialGoal) {
    text += ` Material-wise, the build should keep reinforcing ${signalMaterialGoal}, so the chapter decisions continue to support one believable voice.`;
  } else if (
    ![
      CHAPTER_KEYS.COMMITMENT_PORTAL,
      CHAPTER_KEYS.WOOD_VISION_LOCK_IN,
      CHAPTER_KEYS.RAW_SHELL_CREATION,
      CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE,
      CHAPTER_KEYS.EDGES_SNARE_BEDS,
      CHAPTER_KEYS.LEGACY_TUNING_MEDIA,
      CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY,
    ].includes(chapterKey)
  ) {
    text += ` The goal is not excess, but coherence, so the build decisions keep reinforcing one another as the drum takes shape.`;
  }

  return normalizeDraftLength(text, sectionInput?.lengthTarget);
}

/* =========================================================
   UNIQUE BUILD TRAITS
   ========================================================= */

export function composeFallbackUniqueTraits(chapterPayload = {}) {
  const overviewFacts =
    chapterPayload?.sectionInputs?.chapterOverview?.resolvedFacts || [];
  const buildNotesFacts =
    chapterPayload?.sectionInputs?.buildNotesStory?.resolvedFacts || [];
  const facts = compactFacts([...overviewFacts, ...buildNotesFacts]);

  const build = getBuildSummary(facts);
  const sonic = getSonicSummary(facts);
  const aesthetic = getAestheticSummary(facts);
  const identity = getIdentitySummary(facts);
  const size = getSizeSummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const record = chapterPayload?.record || null;
  const signal = getChapterSignal(record, chapterPayload?.chapterKey);
  const signalResponseWords = takeDistinct(getSignalResponseWords(signal), 3);
  const signalMaterialWords = takeDistinct(getSignalMaterialWords(signal), 2);
  const signalVisualWords = takeDistinct(getSignalVisualWords(signal), 2);
  const signalUseCases = takeDistinct(getSignalUseCaseWords(signal), 3);

  const traits = [];

  if (build.primaryWood || build.shellConstruction) {
    traits.push(
      trimTrait(
        `${joinNatural(
          takeDistinct(
            [build.shellConstruction, build.primaryWood].filter(Boolean),
            2
          )
        )} foundation shaped to support the core voice of the drum`
      )
    );
  } else if (signalMaterialWords.length) {
    traits.push(
      trimTrait(
        `${joinNatural(signalMaterialWords)} material direction supporting the core voice of the build`
      )
    );
  }

  if (sonic.attack || sonic.body || sonic.articulation) {
    traits.push(
      trimTrait(
        `Response aimed toward ${joinNatural(
          takeDistinct(
            [sonic.attack, sonic.body, sonic.articulation].filter(Boolean),
            3
          )
        )}`
      )
    );
  } else if (signalResponseWords.length) {
    traits.push(
      trimTrait(`Response aimed toward ${joinNatural(signalResponseWords)}`)
    );
  }

  if (build.bearingEdge || build.hoopType || build.tuningApproach) {
    traits.push(
      trimTrait(
        `${joinNatural(
          takeDistinct(
            [build.bearingEdge, build.hoopType, build.tuningApproach].filter(
              Boolean
            ),
            2
          )
        )} chosen to reinforce feel and control`
      )
    );
  }

  if (
    aesthetic.visualMood ||
    aesthetic.finishDirection ||
    aesthetic.hardwareFinish
  ) {
    traits.push(
      trimTrait(
        `Visual direction keeps the build grounded in ${joinNatural(
          takeDistinct(
            [
              aesthetic.visualMood,
              aesthetic.finishDirection,
              aesthetic.hardwareFinish,
            ].filter(Boolean),
            2
          )
        )}`
      )
    );
  } else if (signalVisualWords.length) {
    traits.push(
      trimTrait(
        `Visual direction stays grounded in ${joinNatural(signalVisualWords)}`
      )
    );
  }

  if (identity.useCase || identity.style || size) {
    traits.push(
      trimTrait(
        `${joinNatural(
          takeDistinct(
            [size, identity.useCase, identity.style].filter(Boolean),
            3
          )
        )} points to a very specific role for the instrument`
      )
    );
  } else if (signalUseCases.length) {
    traits.push(
      trimTrait(
        `${joinNatural(signalUseCases)} points to a very specific role for the instrument`
      )
    );
  }

  if (
    playerContext.responsePriorities.length ||
    playerContext.tonalGoals.length ||
    playerContext.preferredSizeDirection
  ) {
    traits.push(
      trimTrait(
        `${joinNatural(
          takeDistinct(
            [
              playerContext.preferredSizeDirection
                ? formatSizeDirection(playerContext.preferredSizeDirection)
                : '',
              ...playerContext.responsePriorities,
              ...playerContext.tonalGoals,
            ].filter(Boolean),
            3
          )
        )} defines what will make this build feel distinct`
      )
    );
  }

  return dedupeTextItems(traits).slice(0, 3);
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
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!lengthTarget) return cleaned;

  const maxWords = lengthTarget?.maxWords || 140;
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return cleaned;

  return `${words
    .slice(0, maxWords)
    .join(' ')
    .replace(/[.,;:!?-]*$/, '')}.`;
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
    record,
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
    chapterProfile,
    record
  );

  const buildNotesStory = composeFallbackBuildNotes(
    promptPackage.sectionInputs.buildNotesStory,
    chapterProfile,
    record
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

export function saveAllChapterDraftPreviews(
  record,
  draftedBy = 'story_engine'
) {
  let next = cloneStoryEngineRecord(record);
  const previews = createAllChapterDraftPreviews(next);

  Object.entries(previews).forEach(([chapterKey, preview]) => {
    next = saveChapterDraftPreview(next, chapterKey, preview, draftedBy);

    next = saveStoryText(next, chapterKey, STORY_SECTIONS.CHAPTER_OVERVIEW, {
      text: preview?.fallbackDraft?.chapterOverview || '',
      writingMode:
        preview?.prompts?.chapterOverview?.writingMode ||
        WRITING_MODE.HOLD_FOR_REVIEW,
      confidence: preview?.prompts?.chapterOverview?.confidence || 0,
      basedOnStatuses:
        preview?.prompts?.chapterOverview?.resolvedFacts?.map(
          (fact) => fact.status
        ) || [],
      basedOnFieldKeys:
        preview?.prompts?.chapterOverview?.resolvedFacts?.map(
          (fact) => fact.fieldPath
        ) || [],
      reviewNeeded:
        preview?.prompts?.chapterOverview?.reviewFacts?.length > 0 ||
        preview?.prompts?.chapterOverview?.writingMode ===
          WRITING_MODE.HOLD_FOR_REVIEW,
      reviewReasons:
        preview?.prompts?.chapterOverview?.reviewFacts?.flatMap(
          (fact) => fact.reviewReasons || []
        ) || [],
    });

    next = saveStoryText(next, chapterKey, STORY_SECTIONS.BUILD_NOTES_STORY, {
      text: preview?.fallbackDraft?.buildNotesStory || '',
      writingMode:
        preview?.prompts?.buildNotesStory?.writingMode ||
        WRITING_MODE.HOLD_FOR_REVIEW,
      confidence: preview?.prompts?.buildNotesStory?.confidence || 0,
      basedOnStatuses:
        preview?.prompts?.buildNotesStory?.resolvedFacts?.map(
          (fact) => fact.status
        ) || [],
      basedOnFieldKeys:
        preview?.prompts?.buildNotesStory?.resolvedFacts?.map(
          (fact) => fact.fieldPath
        ) || [],
      reviewNeeded:
        preview?.prompts?.buildNotesStory?.reviewFacts?.length > 0 ||
        preview?.prompts?.buildNotesStory?.writingMode ===
          WRITING_MODE.HOLD_FOR_REVIEW,
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
