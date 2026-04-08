export const FIELD_STATUS = {
  OBSERVED: 'observed',
  DERIVED: 'derived',
  RECOMMENDED: 'recommended',
  UNKNOWN: 'unknown',
};

export const CONFIDENCE_BANDS = {
  HIGH: { min: 0.85, label: 'high' },
  MEDIUM: { min: 0.65, label: 'medium' },
  LOW: { min: 0.45, label: 'low' },
  VERY_LOW: { min: 0, label: 'very_low' },
};

export const WRITING_MODE = {
  TRUTH_ONLY: 'truth_only',
  TRUTH_PLUS_INFERENCE: 'truth_plus_inference',
  TRUTH_PLUS_RECOMMENDATION: 'truth_plus_recommendation',
  HOLD_FOR_REVIEW: 'hold_for_review',
};

export const SOURCE_TYPE = {
  CONSULTATION: 'consultation',
  QUESTIONNAIRE: 'questionnaire',
  ADMIN_NOTE: 'admin_note',
  BUILD_RULE: 'build_rule',
  RESEARCH: 'research',
  USER_PROFILE: 'user_profile',
  MANUAL_OVERRIDE: 'manual_override',
};

export const CHAPTER_KEYS = {
  DISCOVERY_DESIGN: 'discoveryDesign',
  COMMITMENT_PORTAL: 'commitmentPortal',
  WOOD_VISION_LOCK_IN: 'woodVisionLockIn',
  RAW_SHELL_CREATION: 'rawShellCreation',
  SHELL_TRUEING_TORCH_TUNE: 'shellTrueingTorchTune',
  EXTERIOR_ART_FINISH: 'exteriorArtFinish',
  EDGES_SNARE_BEDS: 'edgesSnareBeds',
  HARDWARE_ASSEMBLY: 'hardwareAssembly',
  LEGACY_TUNING_MEDIA: 'legacyTuningMedia',
  FINAL_QA_PACKAGING_DELIVERY: 'finalQAPackagingDelivery',
};

export const STORY_SECTIONS = {
  CHAPTER_OVERVIEW: 'chapterOverview',
  BUILD_NOTES_STORY: 'buildNotesStory',
};

export const REVIEW_REASON = {
  NOT_ENOUGH_DATA: 'not_enough_data',
  CONFLICTING_INPUT: 'conflicting_input',
  HIGH_VARIANCE_FIELD: 'high_variance_field',
  STORY_RISK: 'story_risk',
  BUILD_RISK: 'build_risk',
  RESEARCH_NEEDED: 'research_needed',
};

export const ENGINE_FLAGS = {
  SAFE_TO_AUTODRAFT: 'safe_to_autodraft',
  REVIEW_BEFORE_DRAFT: 'review_before_draft',
  REQUIRES_HUMAN_CONFIRMATION: 'requires_human_confirmation',
};

export const DEFAULT_FIELD = () => ({
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

export const DEFAULT_RECOMMENDATION = () => ({
  primary: {
    value: null,
    confidence: 0,
    rationale: [],
    sourceRefs: [],
    sourceTypes: [],
  },
  secondary: {
    value: null,
    confidence: 0,
    rationale: [],
    sourceRefs: [],
    sourceTypes: [],
  },
  rejected: [],
  reviewNeeded: false,
  reviewReasons: [],
});

export const DEFAULT_STORY_SECTION = () => ({
  text: '',
  writingMode: WRITING_MODE.HOLD_FOR_REVIEW,
  confidence: 0,
  basedOnStatuses: [],
  basedOnFieldKeys: [],
  reviewNeeded: true,
  reviewReasons: [REVIEW_REASON.NOT_ENOUGH_DATA],
  maxLengthTarget: {
    minWords: 60,
    idealWords: 110,
    maxWords: 150,
  },
});

export const DEFAULT_CHAPTER = () => ({
  truth: {},
  inference: {},
  recommendation: {},
  storySections: {
    [STORY_SECTIONS.CHAPTER_OVERVIEW]: DEFAULT_STORY_SECTION(),
    [STORY_SECTIONS.BUILD_NOTES_STORY]: DEFAULT_STORY_SECTION(),
  },
  drafts: {
    chapterOverview: '',
    buildNotesStory: '',
    uniqueBuildTraits: [],
    lastDraftedAt: null,
    lastDraftedBy: null,
  },
  unresolvedCriticalFields: [],
  confidenceScore: 0,
  flags: [ENGINE_FLAGS.REVIEW_BEFORE_DRAFT],
});

export const createEmptyStoryEngineRecord = () => ({
  projectId: null,
  artistId: null,
  buildIdentity: {
    projectName: DEFAULT_FIELD(),
    artistName: DEFAULT_FIELD(),
    primaryUseCase: DEFAULT_FIELD(),
    styleOfPlaying: DEFAULT_FIELD(),
    preferredSizeDirection: DEFAULT_FIELD(),
    size: {
      diameter: DEFAULT_FIELD(),
      depth: DEFAULT_FIELD(),
      display: DEFAULT_FIELD(),
    },
  },

  sourceRegistry: [],

  globalProfile: {
    sonicIntent: {
      attack: DEFAULT_FIELD(),
      body: DEFAULT_FIELD(),
      sensitivity: DEFAULT_FIELD(),
      sustain: DEFAULT_FIELD(),
      projection: DEFAULT_FIELD(),
      tuningRange: DEFAULT_FIELD(),
      articulation: DEFAULT_FIELD(),
      feel: DEFAULT_FIELD(),
    },

    aestheticIntent: {
      finishDirection: DEFAULT_FIELD(),
      visualMood: DEFAULT_FIELD(),
      woodPreference: DEFAULT_FIELD(),
      hardwareFinish: DEFAULT_FIELD(),
      badgeDirection: DEFAULT_FIELD(),
    },

    playerContext: {
      venueType: DEFAULT_FIELD(),
      recordingUse: DEFAULT_FIELD(),
      liveUse: DEFAULT_FIELD(),
      genreContext: DEFAULT_FIELD(),
      influenceReferences: DEFAULT_FIELD(),
      currentPainPoints: DEFAULT_FIELD(),
      desiredOutcome: DEFAULT_FIELD(),
      responsePriorities: DEFAULT_FIELD(),
      tonalGoals: DEFAULT_FIELD(),
      consultationContactMethod: DEFAULT_FIELD(),
    },
  },

  buildSpec: {
    shellConstruction: DEFAULT_FIELD(),
    primaryWood: DEFAULT_FIELD(),
    secondaryWood: DEFAULT_FIELD(),
    shellThicknessStrategy: DEFAULT_FIELD(),
    reinforcementRings: DEFAULT_FIELD(),
    bearingEdge: DEFAULT_FIELD(),
    snareBed: DEFAULT_FIELD(),
    hoopType: DEFAULT_FIELD(),
    lugType: DEFAULT_FIELD(),
    lugCount: DEFAULT_FIELD(),
    headPairingDirection: DEFAULT_FIELD(),
    wireDirection: DEFAULT_FIELD(),
    finishSystem: DEFAULT_FIELD(),
    tuningApproach: DEFAULT_FIELD(),
  },

  recommendations: {
    shellConstruction: DEFAULT_RECOMMENDATION(),
    primaryWood: DEFAULT_RECOMMENDATION(),
    secondaryWood: DEFAULT_RECOMMENDATION(),
    bearingEdge: DEFAULT_RECOMMENDATION(),
    hoopType: DEFAULT_RECOMMENDATION(),
    lugCount: DEFAULT_RECOMMENDATION(),
    tuningApproach: DEFAULT_RECOMMENDATION(),
    finishSystem: DEFAULT_RECOMMENDATION(),
    snareBed: DEFAULT_RECOMMENDATION(),
  },

  chapters: {
    [CHAPTER_KEYS.DISCOVERY_DESIGN]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.COMMITMENT_PORTAL]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.RAW_SHELL_CREATION]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.EXTERIOR_ART_FINISH]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.EDGES_SNARE_BEDS]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.HARDWARE_ASSEMBLY]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]: DEFAULT_CHAPTER(),
    [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]: DEFAULT_CHAPTER(),
  },

  engineMeta: {
    overallConfidence: 0,
    draftReadiness: ENGINE_FLAGS.REVIEW_BEFORE_DRAFT,
    unresolvedQuestions: [],
    adminPrompts: [],
    lastEngineRunAt: null,
    lastReviewedAt: null,
    lastReviewedBy: null,
  },
});