import {
  FIELD_STATUS,
  WRITING_MODE,
  SOURCE_TYPE,
  CHAPTER_KEYS,
  STORY_SECTIONS,
  REVIEW_REASON,
  ENGINE_FLAGS,
  CONFIDENCE_BANDS,
} from './storyEngineSchema';

/* =========================================================
   FIELD GROUPS
   ========================================================= */

export const CORE_TRUTH_FIELDS = [
  'buildIdentity.projectName',
  'buildIdentity.artistName',
  'buildIdentity.primaryUseCase',
  'buildIdentity.styleOfPlaying',
  'buildIdentity.size.diameter',
  'buildIdentity.size.depth',
  'buildIdentity.preferredSizeDirection',
  'globalProfile.playerContext.genreContext',
  'globalProfile.playerContext.desiredOutcome',
  'globalProfile.playerContext.currentPainPoints',
  'globalProfile.playerContext.influenceReferences',
  'globalProfile.playerContext.responsePriorities',
  'globalProfile.playerContext.tonalGoals',
  'globalProfile.playerContext.consultationContactMethod',
];

export const BUILD_CRITICAL_FIELDS = [
  'buildSpec.shellConstruction',
  'buildSpec.primaryWood',
  'buildSpec.bearingEdge',
  'buildSpec.snareBed',
  'buildSpec.hoopType',
  'buildSpec.lugCount',
  'buildSpec.tuningApproach',
];

export const STORY_SENSITIVE_FIELDS = [
  'globalProfile.playerContext.influenceReferences',
  'globalProfile.aestheticIntent.visualMood',
  'globalProfile.playerContext.desiredOutcome',
  'globalProfile.playerContext.currentPainPoints',
];

/* =========================================================
   SOURCE WEIGHTS
   ========================================================= */

export const SOURCE_WEIGHTS = {
  [SOURCE_TYPE.MANUAL_OVERRIDE]: 1.0,
  [SOURCE_TYPE.CONSULTATION]: 0.96,
  [SOURCE_TYPE.QUESTIONNAIRE]: 0.9,
  [SOURCE_TYPE.ADMIN_NOTE]: 0.82,
  [SOURCE_TYPE.USER_PROFILE]: 0.76,
  [SOURCE_TYPE.BUILD_RULE]: 0.72,
  [SOURCE_TYPE.RESEARCH]: 0.68,
};

/* =========================================================
   CONFIDENCE HELPERS
   ========================================================= */

export function getConfidenceBand(score = 0) {
  if (score >= CONFIDENCE_BANDS.HIGH.min) return CONFIDENCE_BANDS.HIGH.label;
  if (score >= CONFIDENCE_BANDS.MEDIUM.min) {
    return CONFIDENCE_BANDS.MEDIUM.label;
  }
  if (score >= CONFIDENCE_BANDS.LOW.min) return CONFIDENCE_BANDS.LOW.label;
  return CONFIDENCE_BANDS.VERY_LOW.label;
}

export function calculateConfidenceFromSources(sourceTypes = []) {
  if (!Array.isArray(sourceTypes) || sourceTypes.length === 0) return 0;

  const weighted =
    sourceTypes.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0.4), 0) /
    sourceTypes.length;

  return Math.max(0, Math.min(weighted, 1));
}

export function applyConflictPenalty(score = 0, hasConflict = false) {
  if (!hasConflict) return score;
  return Math.max(0, score - 0.22);
}

export function applyManualLockBoost(score = 0, manualLock = false) {
  if (!manualLock) return score;
  return Math.max(score, 0.95);
}

export function calculateFieldConfidence({
  sourceTypes = [],
  hasConflict = false,
  manualLock = false,
  observedStrength = 0,
  derivedStrength = 0,
  recommendationStrength = 0,
}) {
  let score = calculateConfidenceFromSources(sourceTypes);

  score += observedStrength;
  score += derivedStrength;
  score += recommendationStrength;

  score = applyConflictPenalty(score, hasConflict);
  score = applyManualLockBoost(score, manualLock);

  return Math.max(0, Math.min(score, 1));
}

/* =========================================================
   WRITING MODE RULES
   ========================================================= */

export function resolveWritingMode({
  confidence = 0,
  hasObservedCore = false,
  hasRecommendation = false,
  storyRisk = false,
}) {
  if (storyRisk || confidence < 0.45) {
    return WRITING_MODE.HOLD_FOR_REVIEW;
  }

  if (hasObservedCore && confidence >= 0.85) {
    return WRITING_MODE.TRUTH_ONLY;
  }

  if (hasObservedCore && confidence >= 0.65) {
    return WRITING_MODE.TRUTH_PLUS_INFERENCE;
  }

  if (hasRecommendation && confidence >= 0.55) {
    return WRITING_MODE.TRUTH_PLUS_RECOMMENDATION;
  }

  return WRITING_MODE.HOLD_FOR_REVIEW;
}

/* =========================================================
   STORY LENGTH POLICY
   ========================================================= */

export const STORY_LENGTH_POLICY = {
  [STORY_SECTIONS.CHAPTER_OVERVIEW]: {
    minWords: 55,
    idealWords: 85,
    maxWords: 120,
  },
  [STORY_SECTIONS.BUILD_NOTES_STORY]: {
    minWords: 70,
    idealWords: 100,
    maxWords: 135,
  },
  bullets: {
    minItems: 3,
    idealItems: 4,
    maxItems: 5,
    maxWordsPerBullet: 22,
  },
};

/* =========================================================
   CHAPTER FIELD MAP
   ========================================================= */

export const CHAPTER_FIELD_MAP = {
  [CHAPTER_KEYS.DISCOVERY_DESIGN]: {
    chapterOverview: [
      'buildIdentity.primaryUseCase',
      'buildIdentity.styleOfPlaying',
      'buildIdentity.preferredSizeDirection',
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.playerContext.consultationContactMethod',
      'globalProfile.playerContext.genreContext',
      'globalProfile.playerContext.desiredOutcome',
      'globalProfile.playerContext.currentPainPoints',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.influenceReferences',
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'buildIdentity.preferredSizeDirection',
      'globalProfile.aestheticIntent.visualMood',
      'globalProfile.aestheticIntent.finishDirection',
      'globalProfile.sonicIntent.attack',
      'globalProfile.sonicIntent.body',
      'globalProfile.sonicIntent.feel',
    ],
    critical: ['buildIdentity.primaryUseCase', 'buildIdentity.styleOfPlaying'],
  },

  [CHAPTER_KEYS.COMMITMENT_PORTAL]: {
    chapterOverview: [
      'buildIdentity.projectName',
      'buildIdentity.artistName',
      'buildIdentity.preferredSizeDirection',
      'globalProfile.playerContext.desiredOutcome',
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.playerContext.consultationContactMethod',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.currentPainPoints',
      'globalProfile.playerContext.influenceReferences',
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.aestheticIntent.visualMood',
    ],
    critical: ['buildIdentity.projectName', 'buildIdentity.artistName'],
  },

  [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]: {
    chapterOverview: [
      'buildSpec.shellConstruction',
      'buildSpec.primaryWood',
      'buildSpec.secondaryWood',
      'recommendations.shellConstruction',
      'recommendations.primaryWood',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.sonicIntent.attack',
      'globalProfile.sonicIntent.body',
      'globalProfile.sonicIntent.sustain',
      'globalProfile.aestheticIntent.woodPreference',
      'buildIdentity.preferredSizeDirection',
    ],
    critical: ['buildSpec.shellConstruction', 'buildSpec.primaryWood'],
  },

  [CHAPTER_KEYS.RAW_SHELL_CREATION]: {
    chapterOverview: [
      'buildSpec.shellConstruction',
      'buildSpec.shellThicknessStrategy',
      'buildSpec.reinforcementRings',
      'recommendations.shellConstruction',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.sonicIntent.body',
      'globalProfile.sonicIntent.projection',
      'globalProfile.sonicIntent.feel',
    ],
    critical: ['buildSpec.shellConstruction'],
  },

  [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]: {
    chapterOverview: [
      'buildSpec.shellThicknessStrategy',
      'buildSpec.reinforcementRings',
      'buildSpec.tuningApproach',
      'recommendations.tuningApproach',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.sonicIntent.tuningRange',
      'globalProfile.sonicIntent.sensitivity',
      'globalProfile.sonicIntent.articulation',
    ],
    critical: ['buildSpec.tuningApproach'],
  },

  [CHAPTER_KEYS.EXTERIOR_ART_FINISH]: {
    chapterOverview: [
      'buildSpec.finishSystem',
      'recommendations.finishSystem',
      'globalProfile.aestheticIntent.finishDirection',
      'globalProfile.aestheticIntent.visualMood',
      'globalProfile.aestheticIntent.hardwareFinish',
    ],
    buildNotesStory: [
      'globalProfile.aestheticIntent.visualMood',
      'globalProfile.aestheticIntent.finishDirection',
      'globalProfile.aestheticIntent.woodPreference',
      'globalProfile.playerContext.influenceReferences',
    ],
    critical: ['buildSpec.finishSystem'],
  },

  [CHAPTER_KEYS.EDGES_SNARE_BEDS]: {
    chapterOverview: [
      'buildSpec.bearingEdge',
      'buildSpec.snareBed',
      'recommendations.bearingEdge',
      'recommendations.snareBed',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
      'globalProfile.sonicIntent.sensitivity',
      'globalProfile.sonicIntent.articulation',
      'globalProfile.sonicIntent.tuningRange',
    ],
    critical: ['buildSpec.bearingEdge', 'buildSpec.snareBed'],
  },

  [CHAPTER_KEYS.HARDWARE_ASSEMBLY]: {
    chapterOverview: [
      'buildSpec.hoopType',
      'buildSpec.lugType',
      'buildSpec.lugCount',
      'recommendations.hoopType',
      'recommendations.lugCount',
      'globalProfile.aestheticIntent.hardwareFinish',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.sonicIntent.projection',
      'globalProfile.sonicIntent.feel',
      'globalProfile.aestheticIntent.hardwareFinish',
    ],
    critical: ['buildSpec.hoopType', 'buildSpec.lugCount'],
  },

  [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]: {
    chapterOverview: [
      'buildSpec.tuningApproach',
      'recommendations.tuningApproach',
      'globalProfile.playerContext.liveUse',
      'globalProfile.playerContext.recordingUse',
      'globalProfile.playerContext.desiredOutcome',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.desiredOutcome',
      'globalProfile.sonicIntent.attack',
      'globalProfile.sonicIntent.body',
      'globalProfile.sonicIntent.sensitivity',
    ],
    critical: ['buildSpec.tuningApproach'],
  },

  [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]: {
    chapterOverview: [
      'buildIdentity.projectName',
      'buildIdentity.artistName',
      'globalProfile.playerContext.desiredOutcome',
      'buildIdentity.preferredSizeDirection',
    ],
    buildNotesStory: [
      'globalProfile.playerContext.desiredOutcome',
      'globalProfile.playerContext.influenceReferences',
      'globalProfile.playerContext.responsePriorities',
      'globalProfile.playerContext.tonalGoals',
    ],
    critical: ['buildIdentity.projectName', 'buildIdentity.artistName'],
  },
};

/* =========================================================
   INFERENCE RULES
   ========================================================= */

export const INFERENCE_RULES = {
  shellConstruction: [
    {
      id: 'hybrid-from-feuzon-direction',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.aestheticIntent.woodPreference'),
          ['feuzon', 'hybrid']
        ),
      suggest: 'Hybrid',
      rationale: [
        'Questionnaire points directly toward a Feuzon / Hybrid shell direction',
      ],
      confidence: 0.84,
    },
  ],

  primaryWood: [
    {
      id: 'maple-balanced-articulate',
      when: (record) =>
        hasValue(record, 'globalProfile.sonicIntent.attack') &&
        hasValue(record, 'globalProfile.sonicIntent.body'),
      suggest: 'Maple',
      rationale: [
        'Balanced platform when both articulation and body matter',
        'Reliable starting point when artist needs versatility',
      ],
      confidence: 0.66,
    },
    {
      id: 'maple-bright-cutting',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.playerContext.tonalGoals'),
          ['bright', 'crisp', 'cutting']
        ),
      suggest: 'Maple',
      rationale: [
        'Maple is a strong current fit for bright, crisp, more cutting response goals',
      ],
      confidence: 0.72,
    },
  ],

  hoopType: [
    {
      id: 'die-cast-controlled-focus',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.sonicIntent.articulation'),
          ['focused', 'controlled', 'tight', 'defined']
        ) ||
        includesAny(
          getFieldValue(record, 'globalProfile.playerContext.responsePriorities'),
          ['ghost', 'clear', 'defined']
        ),
      suggest: 'Die-cast hoops',
      rationale: ['Supports focused attack and more controlled response'],
      confidence: 0.74,
    },
  ],

  lugCount: [
    {
      id: 'size-based-lug-direction',
      when: (record) =>
        Number(getFieldValue(record, 'buildIdentity.size.diameter')) >= 14,
      suggest: '10 lug',
      rationale: ['Common stability direction for 14-inch shell formats'],
      confidence: 0.64,
    },
    {
      id: 'compact-size-lug-direction',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'buildIdentity.preferredSizeDirection'),
          ['13']
        ),
      suggest: '8 lug',
      rationale: ['13-inch direction commonly points toward an 8-lug layout'],
      confidence: 0.7,
    },
  ],

  bearingEdge: [
    {
      id: 'sensitivity-and-clarity-edge',
      when: (record) =>
        hasValue(record, 'globalProfile.sonicIntent.sensitivity') ||
        hasValue(record, 'globalProfile.sonicIntent.articulation') ||
        includesAny(
          getFieldValue(record, 'globalProfile.playerContext.responsePriorities'),
          ['ghost', 'clear', 'dynamic']
        ),
      suggest: '45-degree with softened outer round-over',
      rationale: ['Balances sensitivity with a musical feel'],
      confidence: 0.78,
    },
  ],

  tuningApproach: [
    {
      id: 'broad-usable-range',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.playerContext.desiredOutcome'),
          ['versatile', 'range', 'studio', 'live']
        ) ||
        includesAny(
          getFieldValue(record, 'buildIdentity.primaryUseCase'),
          ['live', 'performance']
        ),
      suggest: 'Medium-to-high tuning window with broad usable response',
      rationale: ['Supports flexible use across more than one setting'],
      confidence: 0.72,
    },
  ],

  finishSystem: [
    {
      id: 'gloss-elegant-artistic-finish',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.aestheticIntent.finishDirection'),
          ['elegant', 'artistic', 'bold']
        ) ||
        includesAny(
          getFieldValue(record, 'globalProfile.aestheticIntent.visualMood'),
          ['elegant', 'artistic', 'bold']
        ),
      suggest: 'Gloss clear finish over figured visual direction',
      rationale: [
        'Current visual direction points toward a finish that preserves figure while still feeling elevated',
      ],
      confidence: 0.74,
    },
  ],

  snareBed: [
    {
      id: 'ghost-note-sensitive-snare-bed',
      when: (record) =>
        includesAny(
          getFieldValue(record, 'globalProfile.playerContext.responsePriorities'),
          ['ghost', 'dynamic', 'smooth']
        ) ||
        includesAny(
          getFieldValue(record, 'globalProfile.sonicIntent.sensitivity'),
          ['high', 'sensitive']
        ),
      suggest: 'Moderate snare bed tuned for sensitivity and ghost-note response',
      rationale: [
        'Supported priorities point toward sensitivity without over-drying the drum',
      ],
      confidence: 0.76,
    },
  ],
};

/* =========================================================
   STORY GUARDRAILS
   ========================================================= */

export const STORY_GUARDRAILS = {
  forbiddenClaims: [
    'invented emotional backstory',
    'invented artist biography',
    'invented symbolic meaning',
    'invented preference',
    'invented performance history',
  ],
  safeInferenceTypes: [
    'build suitability',
    'material recommendation',
    'sonic tradeoff translation',
    'aesthetic alignment suggestion',
    'use-case recommendation',
  ],
  requiredRecommendationLanguage: [
    'best supported direction',
    'strongest current fit',
    'recommended unless the artist says otherwise',
    'based on the current profile and build goals',
  ],
};

/* =========================================================
   REVIEW / RISK RULES
   ========================================================= */

export function isStorySensitiveField(fieldPath = '') {
  return STORY_SENSITIVE_FIELDS.includes(fieldPath);
}

export function requiresManualReview(fieldPath = '', confidence = 0) {
  if (isStorySensitiveField(fieldPath) && confidence < 0.8) return true;
  if (BUILD_CRITICAL_FIELDS.includes(fieldPath) && confidence < 0.7) {
    return true;
  }
  return false;
}

export function getReviewReasonsForField(fieldPath = '', confidence = 0) {
  const reasons = [];

  if (confidence < 0.45) {
    reasons.push(REVIEW_REASON.NOT_ENOUGH_DATA);
  }

  if (BUILD_CRITICAL_FIELDS.includes(fieldPath) && confidence < 0.7) {
    reasons.push(REVIEW_REASON.BUILD_RISK);
  }

  if (isStorySensitiveField(fieldPath) && confidence < 0.8) {
    reasons.push(REVIEW_REASON.STORY_RISK);
  }

  return reasons;
}

/* =========================================================
   CHAPTER READINESS
   ========================================================= */

export function evaluateChapterReadiness({
  confidenceScore = 0,
  unresolvedCriticalFields = [],
}) {
  if (unresolvedCriticalFields.length > 0 || confidenceScore < 0.45) {
    return {
      flag: ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION,
      reviewNeeded: true,
    };
  }

  if (confidenceScore < 0.75) {
    return {
      flag: ENGINE_FLAGS.REVIEW_BEFORE_DRAFT,
      reviewNeeded: true,
    };
  }

  return {
    flag: ENGINE_FLAGS.SAFE_TO_AUTODRAFT,
    reviewNeeded: false,
  };
}

/* =========================================================
   ADMIN PROMPT RULES
   ========================================================= */

export function createAdminPrompt({
  fieldKey,
  reason,
  suggestion,
  priority = 'normal',
}) {
  return {
    fieldKey,
    reason,
    suggestion,
    priority,
  };
}

export function generateMissingFieldPrompt(fieldKey = '') {
  const promptMap = {
    'buildSpec.primaryWood': createAdminPrompt({
      fieldKey,
      reason: 'Primary wood is not yet supported strongly enough to lock.',
      suggestion:
        'Confirm whether the drum should lean warmer/fuller or quicker/more articulate before finalizing the shell material.',
      priority: 'high',
    }),

    'buildSpec.bearingEdge': createAdminPrompt({
      fieldKey,
      reason:
        'Bearing edge choice affects sensitivity, articulation, and feel.',
      suggestion:
        'Confirm whether the player values touch response, body, or maximum control most.',
      priority: 'high',
    }),

    'buildSpec.hoopType': createAdminPrompt({
      fieldKey,
      reason: 'Hoop type influences focus, feel, and tuning character.',
      suggestion:
        'Confirm whether the artist wants a tighter/focused response or a more open feel.',
      priority: 'normal',
    }),

    'buildSpec.shellConstruction': createAdminPrompt({
      fieldKey,
      reason:
        'Shell construction still needs confirmation before wood/voicing chapters can become specific.',
      suggestion:
        'Confirm whether this build should stay in the Feuzon / Hybrid lane or move to another shell format.',
      priority: 'high',
    }),

    'buildSpec.snareBed': createAdminPrompt({
      fieldKey,
      reason: 'Snare bed depth/shape affects sensitivity and ghost-note behavior.',
      suggestion:
        'Confirm whether the player wants maximum ghost-note ease, balanced versatility, or a drier/more controlled response.',
      priority: 'normal',
    }),

    'buildSpec.finishSystem': createAdminPrompt({
      fieldKey,
      reason:
        'Finish system is still too open, which keeps the finish chapter generic.',
      suggestion:
        'Confirm whether the look should stay more natural/transparent, high-gloss and elevated, or more muted and understated.',
      priority: 'normal',
    }),

    'globalProfile.playerContext.influenceReferences': createAdminPrompt({
      fieldKey,
      reason:
        'Influence references help ground the story in something authentic.',
      suggestion:
        'Capture 1–3 artists, records, tones, or visual references that represent the intended direction.',
      priority: 'normal',
    }),
  };

  return (
    promptMap[fieldKey] ||
    createAdminPrompt({
      fieldKey,
      reason: 'This field is not supported strongly enough yet.',
      suggestion:
        'Add a short admin note or confirm direction manually before drafting.',
      priority: 'normal',
    })
  );
}

/* =========================================================
   UTILS
   ========================================================= */

export function getFieldValue(obj, path) {
  if (!obj || !path) return null;

  return (
    path.split('.').reduce((acc, key) => {
      if (acc == null) return null;
      return acc[key];
    }, obj)?.value ?? null
  );
}

export function getFieldNode(obj, path) {
  if (!obj || !path) return null;

  return path.split('.').reduce((acc, key) => {
    if (acc == null) return null;
    return acc[key];
  }, obj);
}

export function hasValue(obj, path) {
  const value = getFieldValue(obj, path);

  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;

  return true;
}

export function includesAny(value, terms = []) {
  if (value == null) return false;

  const normalized = Array.isArray(value)
    ? value.join(' ').toLowerCase()
    : String(value).toLowerCase();

  return terms.some((term) =>
    normalized.includes(String(term).toLowerCase())
  );
}

export function countResolvedFields(record, fieldPaths = []) {
  return fieldPaths.filter((path) => hasValue(record, path)).length;
}

export function getUnresolvedCriticalFields(record, chapterKey) {
  const critical = CHAPTER_FIELD_MAP[chapterKey]?.critical || [];
  return critical.filter((path) => !hasValue(record, path));
}

export function getChapterCoverageScore(record, chapterKey) {
  const config = CHAPTER_FIELD_MAP[chapterKey];
  if (!config) return 0;

  const overviewPaths = Array.isArray(config.chapterOverview)
    ? config.chapterOverview
    : [];
  const storyPaths = Array.isArray(config.buildNotesStory)
    ? config.buildNotesStory
    : [];

  const overviewCount = countResolvedFields(record, overviewPaths);
  const storyCount = countResolvedFields(record, storyPaths);
  const total = overviewPaths.length + storyPaths.length;

  if (!total) return 0;

  return (overviewCount + storyCount) / total;
}

export function getChapterLengthTarget(sectionKey) {
  return (
    STORY_LENGTH_POLICY[sectionKey] ||
    STORY_LENGTH_POLICY[STORY_SECTIONS.CHAPTER_OVERVIEW]
  );
}