// src/utils/storyEngineVoicingNarrative.js

import { CHAPTER_KEYS } from './storyEngineSchema';
import { cloneStoryEngineRecord, setByPath, uniq, clamp } from './storyEngineHelpers';
import { getFieldValue, hasValue } from './storyEngineRules';

/* =========================================================
   SMALL VALUE HELPERS
   ========================================================= */

export function stringifyValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value).trim();
}

export function normalizeText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function normalizeTextArray(value = []) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|•|;|\|/g)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return [];
}

export function sentenceCase(value = '') {
  const clean = normalizeText(value);
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function joinNatural(items = []) {
  const clean = (items || []).map((item) => normalizeText(item)).filter(Boolean);

  if (!clean.length) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}

export function compact(arr = []) {
  return (arr || []).map((item) => normalizeText(item)).filter(Boolean);
}

export function dedupeStrings(arr = []) {
  return uniq(compact(arr));
}

/* =========================================================
   FIELD ACCESS
   ========================================================= */

export function readField(record, path) {
  return stringifyValue(getFieldValue(record, path));
}

export function readRecommendationPrimary(record, key) {
  return stringifyValue(record?.recommendations?.[key]?.primary?.value);
}

export function readRecommendationSecondary(record, key) {
  return stringifyValue(record?.recommendations?.[key]?.secondary?.value);
}

export function hasField(record, path) {
  return hasValue(record, path);
}

/* =========================================================
   CORE SUMMARIES
   ========================================================= */

export function getIdentitySummary(record = {}) {
  return {
    projectName: readField(record, 'buildIdentity.projectName'),
    artistName: readField(record, 'buildIdentity.artistName'),
    primaryUseCase: readField(record, 'buildIdentity.primaryUseCase'),
    styleOfPlaying: readField(record, 'buildIdentity.styleOfPlaying'),
    diameter: readField(record, 'buildIdentity.size.diameter'),
    depth: readField(record, 'buildIdentity.size.depth'),
  };
}

export function getPlayerContextSummary(record = {}) {
  return {
    genreContext: readField(record, 'globalProfile.playerContext.genreContext'),
    desiredOutcome: readField(record, 'globalProfile.playerContext.desiredOutcome'),
    currentPainPoints: readField(record, 'globalProfile.playerContext.currentPainPoints'),
    influenceReferences: readField(
      record,
      'globalProfile.playerContext.influenceReferences'
    ),
    recordingUse: readField(record, 'globalProfile.playerContext.recordingUse'),
    liveUse: readField(record, 'globalProfile.playerContext.liveUse'),
    venueType: readField(record, 'globalProfile.playerContext.venueType'),
  };
}

export function getSonicSummary(record = {}) {
  return {
    attack: readField(record, 'globalProfile.sonicIntent.attack'),
    body: readField(record, 'globalProfile.sonicIntent.body'),
    sensitivity: readField(record, 'globalProfile.sonicIntent.sensitivity'),
    sustain: readField(record, 'globalProfile.sonicIntent.sustain'),
    projection: readField(record, 'globalProfile.sonicIntent.projection'),
    tuningRange: readField(record, 'globalProfile.sonicIntent.tuningRange'),
    articulation: readField(record, 'globalProfile.sonicIntent.articulation'),
    feel: readField(record, 'globalProfile.sonicIntent.feel'),
  };
}

export function getAestheticSummary(record = {}) {
  return {
    visualMood: readField(record, 'globalProfile.aestheticIntent.visualMood'),
    finishDirection: readField(record, 'globalProfile.aestheticIntent.finishDirection'),
    woodPreference: readField(record, 'globalProfile.aestheticIntent.woodPreference'),
    hardwareFinish: readField(record, 'globalProfile.aestheticIntent.hardwareFinish'),
    badgeDirection: readField(record, 'globalProfile.aestheticIntent.badgeDirection'),
  };
}

export function getBuildSpecSummary(record = {}) {
  return {
    shellConstruction:
      readField(record, 'buildSpec.shellConstruction') ||
      readRecommendationPrimary(record, 'shellConstruction'),
    primaryWood:
      readField(record, 'buildSpec.primaryWood') ||
      readRecommendationPrimary(record, 'primaryWood'),
    secondaryWood:
      readField(record, 'buildSpec.secondaryWood') ||
      readRecommendationPrimary(record, 'secondaryWood'),
    shellThicknessStrategy: readField(record, 'buildSpec.shellThicknessStrategy'),
    reinforcementRings: readField(record, 'buildSpec.reinforcementRings'),
    bearingEdge:
      readField(record, 'buildSpec.bearingEdge') ||
      readRecommendationPrimary(record, 'bearingEdge'),
    snareBed: readField(record, 'buildSpec.snareBed'),
    hoopType:
      readField(record, 'buildSpec.hoopType') ||
      readRecommendationPrimary(record, 'hoopType'),
    lugType: readField(record, 'buildSpec.lugType'),
    lugCount:
      readField(record, 'buildSpec.lugCount') ||
      readRecommendationPrimary(record, 'lugCount'),
    finishSystem:
      readField(record, 'buildSpec.finishSystem') ||
      readRecommendationPrimary(record, 'finishSystem'),
    tuningApproach:
      readField(record, 'buildSpec.tuningApproach') ||
      readRecommendationPrimary(record, 'tuningApproach'),
  };
}

export function getSizeDisplay(record = {}) {
  const identity = getIdentitySummary(record);
  if (identity.diameter && identity.depth) {
    return `${identity.diameter}" x ${identity.depth}"`;
  }
  if (identity.diameter) return `${identity.diameter}" diameter`;
  if (identity.depth) return `${identity.depth}" depth`;
  return '';
}

/* =========================================================
   NARRATIVE PHRASES
   ========================================================= */

export function buildUseCasePhrase(record = {}) {
  const identity = getIdentitySummary(record);
  const context = getPlayerContextSummary(record);

  return joinNatural(
    [
      identity.primaryUseCase,
      identity.styleOfPlaying,
      context.genreContext,
      getSizeDisplay(record),
    ].filter(Boolean)
  );
}

export function buildSonicPhrase(record = {}) {
  const sonic = getSonicSummary(record);

  return joinNatural(
    [
      sonic.attack,
      sonic.body,
      sonic.sensitivity,
      sonic.articulation,
      sonic.feel,
    ].filter(Boolean).slice(0, 4)
  );
}

export function buildAestheticPhrase(record = {}) {
  const aesthetic = getAestheticSummary(record);

  return joinNatural(
    [
      aesthetic.visualMood,
      aesthetic.finishDirection,
      aesthetic.hardwareFinish,
    ].filter(Boolean).slice(0, 3)
  );
}

export function buildMaterialPhrase(record = {}) {
  const build = getBuildSpecSummary(record);

  return joinNatural(
    [
      build.shellConstruction,
      build.primaryWood,
      build.secondaryWood,
    ].filter(Boolean).slice(0, 3)
  );
}

export function buildControlPhrase(record = {}) {
  const build = getBuildSpecSummary(record);

  return joinNatural(
    [
      build.bearingEdge,
      build.hoopType,
      build.tuningApproach,
    ].filter(Boolean).slice(0, 3)
  );
}

export function buildOutcomePhrase(record = {}) {
  const context = getPlayerContextSummary(record);
  return joinNatural(
    [
      context.desiredOutcome,
      context.currentPainPoints,
    ].filter(Boolean).slice(0, 2)
  );
}

/* =========================================================
   PRIMARY / SECONDARY NARRATIVE
   ========================================================= */

export function composePrimaryNarrative(record = {}) {
  const useCase = buildUseCasePhrase(record);
  const sonic = buildSonicPhrase(record);
  const outcome = buildOutcomePhrase(record);

  if (useCase && sonic) {
    return normalizeText(`${useCase} with a voice that feels ${sonic}`);
  }

  if (sonic && outcome) {
    return normalizeText(`${sonic} in service of ${outcome}`);
  }

  if (useCase) return useCase;
  if (sonic) return sonic;
  if (outcome) return outcome;

  return '';
}

export function composeSecondaryNarrative(record = {}) {
  const material = buildMaterialPhrase(record);
  const control = buildControlPhrase(record);
  const aesthetic = buildAestheticPhrase(record);

  if (material && control) {
    return normalizeText(`${material} shaped by ${control}`);
  }

  if (material && aesthetic) {
    return normalizeText(`${material} carried through a ${aesthetic} direction`);
  }

  if (control && aesthetic) {
    return normalizeText(`${control} with a ${aesthetic} finish language`);
  }

  if (material) return material;
  if (control) return control;
  if (aesthetic) return aesthetic;

  return '';
}

/* =========================================================
   CHAPTER SIGNAL BUILDERS
   ========================================================= */

export function buildDiscoveryDesignSignal(record = {}) {
  const useCase = buildUseCasePhrase(record);
  const outcome = buildOutcomePhrase(record);
  const influences = readField(
    record,
    'globalProfile.playerContext.influenceReferences'
  );
  const sonic = buildSonicPhrase(record);

  const overview = useCase
    ? `This chapter centers on defining the real role of the instrument through ${useCase}.`
    : outcome
      ? `This chapter centers on clarifying the direction of the instrument around ${outcome}.`
      : `This chapter centers on identifying the strongest supported priorities for the build.`;

  const buildNotes = outcome
    ? `What matters most here is translating ${outcome} into a build direction that remains believable, playable, and specific to the artist.`
    : sonic
      ? `What matters most here is protecting the early sonic direction of ${sonic} without overstating what has not yet been confirmed.`
      : `What matters most here is separating signal from noise so the rest of the build has a truthful center.`;

  const uniqueBuildTraits = dedupeStrings([
    useCase ? `Build direction grounded in ${useCase}` : '',
    influences ? `Influences already pointing toward ${influences}` : '',
    sonic ? `Early voicing target suggests ${sonic}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildCommitmentPortalSignal(record = {}) {
  const identity = getIdentitySummary(record);
  const outcome = buildOutcomePhrase(record);
  const primaryNarrative = composePrimaryNarrative(record);

  const overview = identity.projectName || identity.artistName
    ? `This chapter is where the build direction becomes intentional enough to hold around ${joinNatural([identity.projectName, identity.artistName].filter(Boolean))}.`
    : primaryNarrative
      ? `This chapter is where the build direction becomes intentional enough to hold around ${primaryNarrative}.`
      : `This chapter is where the build direction begins to move from possibility into commitment.`;

  const buildNotes = outcome
    ? `The responsibility here is to keep later decisions aligned with ${outcome}, so the build does not drift once material and structural choices begin to lock in.`
    : `The responsibility here is to make sure the strongest supported direction is stable enough to guide every later chapter.`;

  const uniqueBuildTraits = dedupeStrings([
    primaryNarrative ? `Core direction stabilizing around ${primaryNarrative}` : '',
    outcome ? `Decisions now filtered through ${outcome}` : '',
    identity.projectName ? `Project identity beginning to hold as ${identity.projectName}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildWoodVisionSignal(record = {}) {
  const material = buildMaterialPhrase(record);
  const sonic = buildSonicPhrase(record);
  const aesthetic = buildAestheticPhrase(record);

  const overview = material
    ? `This chapter begins aligning the shell materially around ${material}.`
    : `This chapter begins aligning the shell materially around the strongest supported wood and construction direction.`;

  const buildNotes = sonic
    ? `Wood selection matters here because it needs to support a response that feels ${sonic}, while still staying honest to the visual and structural identity of the drum.`
    : aesthetic
      ? `Wood selection matters here because the material has to support both tone and a visual direction that feels ${aesthetic}.`
      : `Wood selection matters here because material choice begins shaping both personality and response in a way later chapters cannot fully undo.`;

  const uniqueBuildTraits = dedupeStrings([
    material ? `Material foundation forming around ${material}` : '',
    sonic ? `Wood direction chosen to support ${sonic}` : '',
    aesthetic ? `Material choice also reinforces a ${aesthetic} identity` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildRawShellSignal(record = {}) {
  const material = buildMaterialPhrase(record);
  const projection = readField(record, 'globalProfile.sonicIntent.projection');
  const body = readField(record, 'globalProfile.sonicIntent.body');
  const feel = readField(record, 'globalProfile.sonicIntent.feel');

  const overview = material
    ? `This chapter gives physical form to a shell direction rooted in ${material}.`
    : `This chapter gives physical form to the core shell identity of the instrument.`;

  const buildNotes = joinNatural([projection, body, feel].filter(Boolean))
    ? `The shell has to begin carrying authority in a way that supports ${joinNatural([projection, body, feel].filter(Boolean).slice(0, 3))}.`
    : `The shell has to begin carrying structural authority here, because later refinement only matters if the foundation already feels trustworthy.`;

  const uniqueBuildTraits = dedupeStrings([
    material ? `Shell structure taking shape through ${material}` : '',
    body ? `Construction choices aimed toward ${body}` : '',
    projection ? `Raw shell built to preserve ${projection}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildShellTrueingSignal(record = {}) {
  const tuningRange = readField(record, 'globalProfile.sonicIntent.tuningRange');
  const sensitivity = readField(record, 'globalProfile.sonicIntent.sensitivity');
  const articulation = readField(record, 'globalProfile.sonicIntent.articulation');
  const tuningApproach = readField(record, 'buildSpec.tuningApproach');

  const overview = tuningApproach || tuningRange
    ? `This chapter refines the shell so it can behave more honestly across ${joinNatural([tuningApproach, tuningRange].filter(Boolean))}.`
    : `This chapter refines the shell so it can behave more honestly under tension and respond with greater consistency.`;

  const buildNotes = joinNatural([sensitivity, articulation, tuningRange].filter(Boolean))
    ? `Precision matters here because small corrections start shaping whether the drum feels ${joinNatural([sensitivity, articulation, tuningRange].filter(Boolean).slice(0, 3))}.`
    : `Precision matters here because small inconsistencies at this stage become larger tuning and response frustrations later.`;

  const uniqueBuildTraits = dedupeStrings([
    tuningApproach ? `Trueing process supports ${tuningApproach}` : '',
    sensitivity ? `Refinement aimed at preserving ${sensitivity}` : '',
    articulation ? `Shell corrected to better support ${articulation}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildExteriorArtFinishSignal(record = {}) {
  const finishSystem = readField(record, 'buildSpec.finishSystem');
  const aesthetic = buildAestheticPhrase(record);
  const influences = readField(
    record,
    'globalProfile.playerContext.influenceReferences'
  );

  const overview = aesthetic
    ? `This chapter gives the instrument a visible identity that feels ${aesthetic}.`
    : finishSystem
      ? `This chapter gives the instrument a visible identity through ${finishSystem}.`
      : `This chapter gives the instrument a visible identity that needs to feel authored rather than generic.`;

  const buildNotes = influences
    ? `The finish direction needs to respect the references already shaping the build, especially ${influences}, without becoming costume or excess.`
    : `The finish direction needs to deepen the identity of the build without overpowering the voice and seriousness already established.`;

  const uniqueBuildTraits = dedupeStrings([
    finishSystem ? `Finish approach centered on ${finishSystem}` : '',
    aesthetic ? `Visual language held in a ${aesthetic} direction` : '',
    influences ? `Visual treatment influenced by ${influences}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildEdgesBedsSignal(record = {}) {
  const bearingEdge = readField(record, 'buildSpec.bearingEdge');
  const snareBed = readField(record, 'buildSpec.snareBed');
  const sensitivity = readField(record, 'globalProfile.sonicIntent.sensitivity');
  const articulation = readField(record, 'globalProfile.sonicIntent.articulation');
  const tuningRange = readField(record, 'globalProfile.sonicIntent.tuningRange');

  const overview = joinNatural([bearingEdge, snareBed].filter(Boolean))
    ? `This chapter sharpens the playable identity of the drum through ${joinNatural([bearingEdge, snareBed].filter(Boolean))}.`
    : `This chapter sharpens the playable identity of the drum through edge and snare-side geometry.`;

  const buildNotes = joinNatural([sensitivity, articulation, tuningRange].filter(Boolean))
    ? `These details matter because they directly affect whether the drum feels ${joinNatural([sensitivity, articulation, tuningRange].filter(Boolean).slice(0, 3))}.`
    : `These details matter because they directly affect head contact, snare response, and how naturally the instrument gives something back to the player.`;

  const uniqueBuildTraits = dedupeStrings([
    bearingEdge ? `Edge profile centered on ${bearingEdge}` : '',
    snareBed ? `Snare-side response shaped through ${snareBed}` : '',
    articulation ? `Geometry aimed to reinforce ${articulation}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildHardwareAssemblySignal(record = {}) {
  const hoopType = readField(record, 'buildSpec.hoopType');
  const lugCount = readField(record, 'buildSpec.lugCount');
  const hardwareFinish = readField(
    record,
    'globalProfile.aestheticIntent.hardwareFinish'
  );
  const projection = readField(record, 'globalProfile.sonicIntent.projection');
  const feel = readField(record, 'globalProfile.sonicIntent.feel');

  const overview = joinNatural([hoopType, lugCount, hardwareFinish].filter(Boolean))
    ? `This chapter brings the instrument into full working form through ${joinNatural([hoopType, lugCount, hardwareFinish].filter(Boolean).slice(0, 3))}.`
    : `This chapter brings the instrument into full working form, where function, tension, and visual completion finally meet.`;

  const buildNotes = joinNatural([projection, feel].filter(Boolean))
    ? `Assembly choices matter here because they influence whether the completed instrument feels ${joinNatural([projection, feel].filter(Boolean))} without losing cohesion.`
    : `Assembly choices matter here because the drum now has to feel complete, reliable, and coherent under real tension rather than only as a set of design intentions.`;

  const uniqueBuildTraits = dedupeStrings([
    hoopType ? `Hardware character anchored by ${hoopType}` : '',
    lugCount ? `Tension profile shaped around ${lugCount}` : '',
    hardwareFinish ? `Visual completion reinforced through ${hardwareFinish}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildLegacyTuningSignal(record = {}) {
  const tuningApproach = readField(record, 'buildSpec.tuningApproach');
  const attack = readField(record, 'globalProfile.sonicIntent.attack');
  const body = readField(record, 'globalProfile.sonicIntent.body');
  const sensitivity = readField(record, 'globalProfile.sonicIntent.sensitivity');
  const desiredOutcome = readField(
    record,
    'globalProfile.playerContext.desiredOutcome'
  );

  const overview = tuningApproach
    ? `This chapter reveals the finished voice of the drum through ${tuningApproach}.`
    : `This chapter reveals the finished voice of the drum and asks whether the build has delivered on its original promise.`;

  const buildNotes = joinNatural([attack, body, sensitivity].filter(Boolean))
    ? `Voicing decisions here should let the instrument speak with ${joinNatural([attack, body, sensitivity].filter(Boolean).slice(0, 3))}, while still staying true to the build as a whole.`
    : desiredOutcome
      ? `Voicing decisions here should let the instrument land in the direction of ${desiredOutcome} without forcing it into something artificial.`
      : `Voicing decisions here should reveal the strongest natural version of the instrument rather than impose a voice that the shell does not honestly support.`;

  const uniqueBuildTraits = dedupeStrings([
    tuningApproach ? `Final voicing guided by ${tuningApproach}` : '',
    desiredOutcome ? `Tuning pass evaluated against ${desiredOutcome}` : '',
    attack || body || sensitivity
      ? `Playable voice centered on ${joinNatural([attack, body, sensitivity].filter(Boolean).slice(0, 3))}`
      : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

export function buildFinalQASignal(record = {}) {
  const identity = getIdentitySummary(record);
  const desiredOutcome = readField(
    record,
    'globalProfile.playerContext.desiredOutcome'
  );

  const overview = identity.projectName || identity.artistName
    ? `This chapter confirms that the finished instrument is ready to leave the bench with integrity for ${joinNatural([identity.projectName, identity.artistName].filter(Boolean))}.`
    : `This chapter confirms that the finished instrument is ready to leave the bench with integrity.`;

  const buildNotes = desiredOutcome
    ? `Final review matters because the drum should arrive still aligned with ${desiredOutcome}, not just technically complete.`
    : `Final review matters because handoff is part of the craftsmanship, and the instrument should leave feeling finished rather than merely done.`;

  const uniqueBuildTraits = dedupeStrings([
    identity.projectName ? `Final handoff framed around ${identity.projectName}` : '',
    identity.artistName ? `Completion reviewed with ${identity.artistName} in mind` : '',
    desiredOutcome ? `Final checks measured against ${desiredOutcome}` : '',
  ]);

  return {
    chapterOverview: overview,
    buildNotesStory: buildNotes,
    uniqueBuildTraits,
  };
}

/* =========================================================
   CHAPTER SIGNAL MAP
   ========================================================= */

export const CHAPTER_SIGNAL_BUILDERS = {
  [CHAPTER_KEYS.DISCOVERY_DESIGN]: buildDiscoveryDesignSignal,
  [CHAPTER_KEYS.COMMITMENT_PORTAL]: buildCommitmentPortalSignal,
  [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]: buildWoodVisionSignal,
  [CHAPTER_KEYS.RAW_SHELL_CREATION]: buildRawShellSignal,
  [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]: buildShellTrueingSignal,
  [CHAPTER_KEYS.EXTERIOR_ART_FINISH]: buildExteriorArtFinishSignal,
  [CHAPTER_KEYS.EDGES_SNARE_BEDS]: buildEdgesBedsSignal,
  [CHAPTER_KEYS.HARDWARE_ASSEMBLY]: buildHardwareAssemblySignal,
  [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]: buildLegacyTuningSignal,
  [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]: buildFinalQASignal,
};

/* =========================================================
   CONFIDENCE
   ========================================================= */

export function calculateNarrativeConfidence(record = {}) {
  const signals = [
    hasField(record, 'buildIdentity.primaryUseCase'),
    hasField(record, 'buildIdentity.styleOfPlaying'),
    hasField(record, 'globalProfile.playerContext.desiredOutcome'),
    hasField(record, 'globalProfile.playerContext.genreContext'),
    hasField(record, 'globalProfile.sonicIntent.attack'),
    hasField(record, 'globalProfile.sonicIntent.body'),
    hasField(record, 'globalProfile.sonicIntent.sensitivity'),
    hasField(record, 'globalProfile.aestheticIntent.visualMood'),
    hasField(record, 'buildSpec.shellConstruction'),
    hasField(record, 'buildSpec.primaryWood'),
    hasField(record, 'buildSpec.bearingEdge'),
    hasField(record, 'buildSpec.hoopType'),
    hasField(record, 'buildSpec.tuningApproach'),
  ];

  const resolvedCount = signals.filter(Boolean).length;
  return clamp(resolvedCount / signals.length);
}

/* =========================================================
   MAIN BUILDERS
   ========================================================= */

export function createVoicingNarrative(record = {}) {
  const primary = composePrimaryNarrative(record);
  const secondary = composeSecondaryNarrative(record);

  const chapterSignals = Object.keys(CHAPTER_SIGNAL_BUILDERS).reduce(
    (acc, chapterKey) => {
      const builder = CHAPTER_SIGNAL_BUILDERS[chapterKey];
      acc[chapterKey] =
        typeof builder === 'function'
          ? builder(record)
          : {
              chapterOverview: '',
              buildNotesStory: '',
              uniqueBuildTraits: [],
            };
      return acc;
    },
    {}
  );

  return {
    primary,
    secondary,
    confidence: calculateNarrativeConfidence(record),
    chapterSignals,
    createdAt: new Date().toISOString(),
  };
}

export function saveVoicingNarrative(record = {}) {
  const next = cloneStoryEngineRecord(record);
  const voicingNarrative = createVoicingNarrative(next);

  setByPath(next, 'engineMeta.voicingNarrative', voicingNarrative);

  return next;
}

export function runVoicingNarrativePipeline(record = {}) {
  return saveVoicingNarrative(record);
}