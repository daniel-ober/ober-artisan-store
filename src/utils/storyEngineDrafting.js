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
      ? `${playerContext.preferredSizeDirection} direction`
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
   CHAPTER-SPECIFIC HELPERS
   ========================================================= */

export function getChapterAnchor(sectionInput, facts = []) {
  const chapterKey = sectionInput?.chapterKey;
  const identity = getIdentitySummary(facts);
  const build = getBuildSummary(facts);
  const aesthetic = getAestheticSummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const tonalFocus = joinNatural(
    takeDistinct(
      [...playerContext.responsePriorities, ...playerContext.tonalGoals].filter(
        Boolean
      ),
      3
    )
  );

  switch (chapterKey) {
    case CHAPTER_KEYS.DISCOVERY_DESIGN:
      return (
        tonalFocus ||
        joinNatural(
          takeDistinct(
            [identity.useCase, identity.style, identity.genre].filter(Boolean),
            3
          )
        ) ||
        identity.outcome
      );

    case CHAPTER_KEYS.COMMITMENT_PORTAL:
      return (
        identity.outcome ||
        tonalFocus ||
        joinNatural(
          takeDistinct(
            [identity.projectName, identity.artistName].filter(Boolean),
            2
          )
        )
      );

    case CHAPTER_KEYS.WOOD_VISION_LOCK_IN:
      return (
        joinNatural(
          takeDistinct(
            [build.shellConstruction, build.primaryWood, build.secondaryWood].filter(
              Boolean
            ),
            3
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.RAW_SHELL_CREATION:
      return (
        joinNatural(
          takeDistinct(
            [build.shellConstruction, build.primaryWood].filter(Boolean),
            2
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE:
      return (
        joinNatural(
          takeDistinct(
            [build.tuningApproach, build.bearingEdge].filter(Boolean),
            2
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.EXTERIOR_ART_FINISH:
      return (
        joinNatural(
          takeDistinct(
            [
              build.finishSystem,
              aesthetic.visualMood,
              aesthetic.finishDirection,
            ].filter(Boolean),
            3
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.EDGES_SNARE_BEDS:
      return (
        joinNatural(
          takeDistinct(
            [build.bearingEdge, build.snareBed].filter(Boolean),
            2
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.HARDWARE_ASSEMBLY:
      return (
        joinNatural(
          takeDistinct(
            [build.hoopType, build.lugCount, aesthetic.hardwareFinish].filter(
              Boolean
            ),
            3
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.LEGACY_TUNING_MEDIA:
      return (
        joinNatural(
          takeDistinct(
            [build.tuningApproach, identity.outcome].filter(Boolean),
            2
          )
        ) || tonalFocus
      );

    case CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY:
      return identity.outcome || tonalFocus || identity.projectName;

    default:
      return tonalFocus || identity.outcome;
  }
}

export function getChapterWhyItMatters(sectionInput, facts = [], record = null) {
  const chapterKey = sectionInput?.chapterKey;
  const identity = getIdentitySummary(facts);
  const size = getSizeSummary(facts);
  const playerContext = getPlayerContextSummary(facts);
  const signal = getChapterSignal(record, chapterKey);
  const signalTension = joinNatural(
    takeDistinct(getSignalTensionWords(signal), 2)
  );

  switch (chapterKey) {
    case CHAPTER_KEYS.DISCOVERY_DESIGN:
      return identity.outcome
        ? `What matters most here is defining the build around ${identity.outcome}.`
        : 'What matters most here is turning the player’s priorities into a usable build direction.';

    case CHAPTER_KEYS.COMMITMENT_PORTAL:
      return 'What matters most here is locking the direction tightly enough that the rest of the build can stay coherent.';

    case CHAPTER_KEYS.WOOD_VISION_LOCK_IN:
      return 'What matters most here is choosing the shell direction that will carry the feel and voice of the drum the rest of the way.';

    case CHAPTER_KEYS.RAW_SHELL_CREATION:
      return 'What matters most here is giving the shell a physical foundation that supports the intended response before the finer details begin.';

    case CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE:
      return 'What matters most here is shaping consistency, touch, and usable tuning behavior before cosmetics or hardware start masking problems.';

    case CHAPTER_KEYS.EXTERIOR_ART_FINISH:
      return 'What matters most here is making the visual statement feel intentional without breaking the identity of the instrument.';

    case CHAPTER_KEYS.EDGES_SNARE_BEDS:
      return 'What matters most here is preserving sensitivity, articulation, and feel at the points where the drumhead and wires actually interact with the shell.';

    case CHAPTER_KEYS.HARDWARE_ASSEMBLY:
      return 'What matters most here is matching feel, control, and visual finish so the instrument behaves like one complete idea.';

    case CHAPTER_KEYS.LEGACY_TUNING_MEDIA:
      return identity.outcome
        ? `What matters most here is making sure the final tuning and presentation still serve ${identity.outcome}.`
        : 'What matters most here is making sure the drum sounds and presents the way the build promised it would.';

    case CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY:
      return size
        ? `What matters most here is verifying that the final ${size} instrument arrives with the same intent it was designed around.`
        : 'What matters most here is verifying that the finished instrument arrives sounding, feeling, and presenting the way it should.';

    default:
      if (signalTension) {
        return `What matters most here is protecting the balance between ${signalTension}.`;
      }
      if (playerContext.preferredSizeDirection) {
        return `What matters most here is protecting the intended ${playerContext.preferredSizeDirection} direction without drifting away from the player profile.`;
      }
      return 'What matters most here is protecting the strongest supported direction without overstating what has not yet been confirmed.';
  }
}

export function getChapterVisualSentence(sectionInput, facts = []) {
  const chapterKey = sectionInput?.chapterKey;
  const aesthetic = getAestheticSummary(facts);

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

  if (!visualGoal) return '';

  const appliesToVisualChapters = [
    CHAPTER_KEYS.DISCOVERY_DESIGN,
    CHAPTER_KEYS.COMMITMENT_PORTAL,
    CHAPTER_KEYS.EXTERIOR_ART_FINISH,
    CHAPTER_KEYS.HARDWARE_ASSEMBLY,
  ];

  if (!appliesToVisualChapters.includes(chapterKey)) return '';

  return ` Visually, the build should stay aligned with a direction that feels ${visualGoal}, so the final instrument reads as one complete idea rather than a collection of parts.`;
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
  const identity = getIdentitySummary(facts);
  const build = getBuildSummary(facts);
  const size = getSizeSummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const signal = getChapterSignal(record, sectionInput?.chapterKey);
  const signalDirection = getSignalPrimaryDirection(signal);
  const signalResponse = joinNatural(
    takeDistinct(getSignalResponseWords(signal), 3)
  );
  const signalUseCases = joinNatural(
    takeDistinct(getSignalUseCaseWords(signal), 3)
  );

  const chapterName = chapterProfile?.chapterLabel || 'This chapter';

  const anchor = getChapterAnchor(sectionInput, facts);
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

  let text = '';

  if (signalDirection) {
    text += `${chapterName} centers on ${signalDirection}.`;
  } else if (anchor) {
    text += `${chapterName} centers on ${anchor}.`;
  } else {
    text += `${chapterName} centers on the clearest priorities currently supported by the build profile.`;
  }

  if (materialFocus) {
    text += ` At this stage, the build begins to align around ${materialFocus}`;
  } else if (signalResponse) {
    text += ` At this stage, the build is being shaped toward a response that feels ${signalResponse}`;
  } else {
    text += ` At this stage, the build needs to preserve a clear through-line between feel, response, and identity`;
  }

  if (size) {
    text += ` within a ${size} format.`;
  } else if (playerContext.preferredSizeDirection) {
    text += ` within a ${playerContext.preferredSizeDirection} direction.`;
  } else if (signalUseCases) {
    text += ` for a role that points toward ${signalUseCases}.`;
  } else {
    text += `.`;
  }

  text += ` ${getChapterWhyItMatters(sectionInput, facts, record)}`;

  if (!identity.outcome && !materialFocus && !signalResponse && !signalUseCases) {
    text +=
      ' The goal is to protect the strongest supported direction without overstating what has not yet been confirmed.';
  }

  return normalizeDraftLength(text, sectionInput?.lengthTarget);
}

export function composeFallbackBuildNotes(
  sectionInput,
  chapterProfile,
  record = null
) {
  const facts = compactFacts(sectionInput?.resolvedFacts || []);
  const sonic = getSonicSummary(facts);
  const build = getBuildSummary(facts);
  const identity = getIdentitySummary(facts);
  const playerContext = getPlayerContextSummary(facts);

  const signal = getChapterSignal(record, sectionInput?.chapterKey);
  const signalDirection = getSignalPrimaryDirection(signal);
  const signalResponseWords = takeDistinct(getSignalResponseWords(signal), 3);
  const signalMaterialWords = takeDistinct(getSignalMaterialWords(signal), 2);
  const signalVisualWords = takeDistinct(getSignalVisualWords(signal), 2);
  const signalTensionWords = takeDistinct(getSignalTensionWords(signal), 2);

  const recommendationMode = shouldUseRecommendationLanguage(
    sectionInput?.writingMode
  );

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
          ? `${playerContext.preferredSizeDirection} direction`
          : '',
      ].filter(Boolean),
      3
    )
  );

  const signalResponseGoal = joinNatural(signalResponseWords);
  const signalVisualGoal = joinNatural(signalVisualWords);
  const signalMaterialGoal = joinNatural(signalMaterialWords);
  const signalTensionGoal = joinNatural(signalTensionWords);

  let text = '';

  if (primaryDecision) {
    text += recommendationMode
      ? `The strongest current direction for this chapter is to lean into ${primaryDecision}`
      : `This chapter is where ${primaryDecision} starts to carry real weight in the build`;
  } else if (signalDirection) {
    text += recommendationMode
      ? `The strongest current direction for this chapter is to preserve ${signalDirection}`
      : `This chapter is where ${signalDirection} starts to become more intentional in the build`;
  } else {
    text += recommendationMode
      ? `The strongest current direction for this chapter is to preserve the clearest supported build priorities`
      : `This chapter is where the clearest supported priorities need to become more intentional`;
  }

  if (responseGoal) {
    text += `, especially in service of a voice centered on ${responseGoal}`;
  } else if (playerPriorityGoal) {
    text += `, especially in service of priorities like ${playerPriorityGoal}`;
  } else if (signalResponseGoal) {
    text += `, especially in service of a voice centered on ${signalResponseGoal}`;
  }

  text += '.';

  if (identity.outcome && playerPriorityGoal) {
    text += ` Every choice here should continue to support a drum that delivers ${identity.outcome} while protecting priorities like ${playerPriorityGoal}.`;
  } else if (identity.outcome) {
    text += ` Every choice here should continue to support a drum that lands in the direction of ${identity.outcome}.`;
  } else if (signalTensionGoal) {
    text += ` Every choice here should continue to protect the balance between ${signalTensionGoal}.`;
  } else if (identity.useCase || identity.style) {
    text += ` Every choice here should continue to support the way this instrument is actually meant to be used.`;
  }

  text += getChapterVisualSentence(sectionInput, facts);

  if (!getChapterVisualSentence(sectionInput, facts)) {
    if (signalVisualGoal) {
      text += ` Visually, the build should stay aligned with a direction that feels ${signalVisualGoal}, so the final instrument reads as one complete idea rather than a collection of parts.`;
    } else if (signalMaterialGoal) {
      text += ` Material-wise, the build should keep reinforcing ${signalMaterialGoal}, so the chapter decisions continue to support one believable voice.`;
    } else {
      text += ` The goal is not excess, but coherence, so the build decisions keep reinforcing one another as the drum takes shape.`;
    }
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
                ? `${playerContext.preferredSizeDirection} direction`
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