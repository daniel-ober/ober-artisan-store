// src/utils/storyEngineStoryPayload.js

import { CHAPTER_KEYS } from './storyEngineSchema';
import { getChapterPromptProfile } from './storyEnginePrompts';

function clean(value = '') {
  if (value == null) return '';
  return String(value).trim();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (!value) return [];
  return [clean(value)].filter(Boolean);
}

function getFieldValue(node) {
  if (!node) return '';
  if (typeof node === 'object' && 'value' in node) return node.value || '';
  return node || '';
}

function getChapterNode(record, chapterKey) {
  return record?.chapters?.[chapterKey] || {};
}

function getStorySectionText(record, chapterKey, sectionKey) {
  return (
    record?.chapters?.[chapterKey]?.storySections?.[sectionKey]?.text || ''
  );
}

function formatSizeLabel({ diameter = '', depth = '', preferredSizeDirection = '' }) {
  const dia = clean(diameter);
  const dep = clean(depth);
  const preferred = clean(preferredSizeDirection);

  if (dia && dep) return `${dia}" x ${dep}"`;
  if (preferred) return preferred;
  return '';
}

function getChapterPurpose(chapterKey) {
  const map = {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]:
      'Clarify the real musical job of the drum and define the direction.',
    [CHAPTER_KEYS.COMMITMENT_PORTAL]:
      'Turn a promising direction into a committed build path.',
    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]:
      'Lock the shell recipe and material identity of the drum.',
    [CHAPTER_KEYS.RAW_SHELL_CREATION]:
      'Begin physically forming the shell that will carry the voice.',
    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]:
      'Refine shell behavior, consistency, and tuning response.',
    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]:
      'Establish the visual language and surface identity of the instrument.',
    [CHAPTER_KEYS.EDGES_SNARE_BEDS]:
      'Shape the contact points that most directly affect response and feel.',
    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]:
      'Bring the instrument into a complete playable form.',
    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]:
      'Reveal and document the finished voice of the drum.',
    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
      'Verify the finished instrument before it leaves the shop.',
  };

  return map[chapterKey] || '';
}

export function buildHybridStoryPayload(record, chapterKey) {
  const chapterNode = getChapterNode(record, chapterKey);
  const chapterProfile = getChapterPromptProfile(chapterKey);

  const buildIdentity = record?.buildIdentity || {};
  const globalProfile = record?.globalProfile || {};
  const buildSpec = record?.buildSpec || {};
  const engineMeta = record?.engineMeta || {};

  const playerContext = globalProfile?.playerContext || {};
  const aestheticIntent = globalProfile?.aestheticIntent || {};
  const sonicIntent = globalProfile?.sonicIntent || {};

  const artistName = clean(getFieldValue(buildIdentity.artistName));
  const splitName = artistName.split(' ').filter(Boolean);

  const diameter = clean(getFieldValue(buildIdentity?.size?.diameter));
  const depth = clean(getFieldValue(buildIdentity?.size?.depth));
  const preferredSizeDirection = clean(
    getFieldValue(buildIdentity.preferredSizeDirection)
  );

  return {
    projectId: record?.projectId || '',
    artistId: record?.artistId || '',
    generatedAt: new Date().toISOString(),
    generatedBy: 'story_engine_hybrid',

    artist: {
      name: artistName,
      firstName: splitName[0] || '',
      lastName: splitName.slice(1).join(' '),
      email: '',
      playerProfile: clean(getFieldValue(buildIdentity.styleOfPlaying)),
      genreContext: ensureArray(getFieldValue(playerContext.genreContext)),
      playSettings: ensureArray(getFieldValue(playerContext.influenceReferences)),
      styleOfPlaying: clean(getFieldValue(buildIdentity.styleOfPlaying)),
      desiredOutcome: clean(getFieldValue(playerContext.desiredOutcome)),
      influenceReferences: ensureArray(getFieldValue(playerContext.influenceReferences)),
      currentPainPoints: ensureArray(getFieldValue(playerContext.currentPainPoints)),
    },

    build: {
      projectName: clean(getFieldValue(buildIdentity.projectName)),
      artisanLine: 'SoundLegend',
      sizeLabel: formatSizeLabel({ diameter, depth, preferredSizeDirection }),
      diameter,
      depth,
      preferredSizeDirection,
      shellConstruction: clean(getFieldValue(buildSpec.shellConstruction)),
      primaryWood: clean(getFieldValue(buildSpec.primaryWood)),
      secondaryWood: clean(getFieldValue(buildSpec.secondaryWood)),
      bearingEdge: clean(getFieldValue(buildSpec.bearingEdge)),
      snareBed: clean(getFieldValue(buildSpec.snareBed)),
      hoopType: clean(getFieldValue(buildSpec.hoopType)),
      lugCount: clean(getFieldValue(buildSpec.lugCount)),
      tuningApproach: clean(getFieldValue(buildSpec.tuningApproach)),
      finishSystem: clean(getFieldValue(buildSpec.finishSystem)),
      hardwareFinish: clean(getFieldValue(aestheticIntent.hardwareFinish)),
      visualMood: ensureArray(getFieldValue(aestheticIntent.visualMood)),
      finishDirection: ensureArray(getFieldValue(aestheticIntent.finishDirection)),
    },

    soundProfile: {
      responsePriorities: ensureArray(getFieldValue(playerContext.responsePriorities)),
      tonalGoals: ensureArray(getFieldValue(playerContext.tonalGoals)),
      attack: clean(getFieldValue(sonicIntent.attack)),
      body: clean(getFieldValue(sonicIntent.body)),
      sensitivity: clean(getFieldValue(sonicIntent.sensitivity)),
      sustain: clean(getFieldValue(sonicIntent.sustain)),
      projection: clean(getFieldValue(sonicIntent.projection)),
      tuningRange: clean(getFieldValue(sonicIntent.tuningRange)),
      articulation: clean(getFieldValue(sonicIntent.articulation)),
      feel: clean(getFieldValue(sonicIntent.feel)),
    },

    consultation: {
      contactMethod: clean(getFieldValue(playerContext.consultationContactMethod)),
      availabilityDays: [],
      availabilityTimes: [],
      finalNotes: '',
      rawTranscript: '',
      summary: '',
      adminNotes: '',
    },

    metrics: {
      firstInteractionAt: '',
      projectCreatedAt: '',
      completedAt: '',
      daysSinceFirstInteraction: null,
      totalBenchHours: null,
      chapterCount: 10,
    },

    chapter: {
      key: chapterKey,
      label: chapterProfile?.chapterLabel || chapterKey,
      purpose: getChapterPurpose(chapterKey),
      stageStatus: chapterNode?.status || '',
      currentPhaseLabel: chapterProfile?.chapterLabel || '',
      whatChangedHere: [],
      confirmedFacts: [],
      recommendedFacts: [],
      unresolvedFacts: chapterNode?.unresolvedCriticalFields || [],
      media: [],
      existingOverview: getStorySectionText(record, chapterKey, 'chapterOverview'),
      existingBuildNotes: getStorySectionText(record, chapterKey, 'buildNotesStory'),
    },

    voicingNarrative: engineMeta?.voicingNarrative || null,
  };
}