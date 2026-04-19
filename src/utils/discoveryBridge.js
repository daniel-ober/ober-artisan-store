export const DISCOVERY_BRIDGE_VERSION = 1;
export const DISCOVERY_BRIDGE_SCHEMA_VERSION = 1;
export const DISCOVERY_BRIDGE_PROMPT_VERSION = 1;

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  if (!value) return [];

  return [cleanText(value)].filter(Boolean);
}

function joinArray(value) {
  return ensureArray(value).join(', ');
}

function hasText(value) {
  return cleanText(value).length > 0;
}

function hasArrayItems(value) {
  return ensureArray(value).length > 0;
}

function normalizeTranscript(value) {
  return String(value || '').trim();
}

function buildSimpleSourceHash({
  consultationIntake = {},
  consultationTranscript = '',
  consultationSummary = '',
  adminNotes = '',
}) {
  const raw = JSON.stringify({
    consultationIntake,
    consultationTranscript,
    consultationSummary,
    adminNotes,
  });

  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `db_${Math.abs(hash)}`;
}

export function buildDeterministicDiscoveryFlags({
  consultationIntake = {},
  project = {},
  storyEngine = {},
}) {
  const purpose = consultationIntake?.purpose || {};
  const feel = consultationIntake?.feel || {};
  const voice = consultationIntake?.voice || {};
  const legacy = consultationIntake?.legacy || {};
  const consult = consultationIntake?.consult || {};

  const transcript = normalizeTranscript(
    storyEngine?.consultationTranscript || ''
  );
  const summary = normalizeTranscript(storyEngine?.consultationSummary || '');
  const adminNotes = normalizeTranscript(storyEngine?.adminNotes || '');

  return {
    questionnaireCompleted:
      Object.keys(consultationIntake || {}).length > 0,

    purposeKnown: {
      playerProfile: hasText(purpose.playerProfile),
      primaryGoal: hasText(purpose.primaryGoal),
      environments: hasArrayItems(purpose.environments),
      guidancePreference: hasText(purpose.guidancePreference),
    },

    feelKnown: {
      feelPriorities: hasArrayItems(feel.feelPriorities),
      snareLoveMost: hasArrayItems(feel.snareLoveMost),
      snareFrustrations: hasArrayItems(feel.snareFrustrations),
      dynamicFeel: hasText(feel.dynamicFeel),
    },

    voiceKnown: {
      genres: hasArrayItems(voice.genres),
      tonalGoals: hasArrayItems(voice.tonalGoals),
      responsePriorities: hasArrayItems(voice.responsePriorities),
      sizeDirection: hasText(voice.sizeDirection),
    },

    legacyKnown: {
      visualDirection: hasArrayItems(legacy.visualDirection),
      hardwareFinishPreference: hasText(legacy.hardwareFinishPreference),
      storyImportance: hasText(legacy.storyImportance),
      favoritePartOfPlaying: hasArrayItems(legacy.favoritePartOfPlaying),
      influenceReferences: hasText(legacy.influenceReferences),
      finalNotes: hasText(legacy.finalNotes),
    },

    consultKnown: {
      contactMethod: hasText(consult.consultationContactMethod),
      days: hasArrayItems(consult.consultationDays),
      times: hasArrayItems(consult.consultationTimes),
    },

    projectKnown: {
      width: hasText(project.width),
      shellDepth: hasText(project.shellDepth),
      shellConstruction: hasText(project.shellConstruction),
      staveCount: hasText(project.staveCount),
      hardwareFinish: hasText(project.hardwareFinish),
      hoops: hasText(project.hoops),
      lugType: hasText(project.lugType),
      woodSpecies: hasText(project.woodSpecies),
      currentPhase: hasText(project.currentPhase),
    },

    consultArtifactsKnown: {
      transcript: hasText(transcript),
      summary: hasText(summary),
      adminNotes: hasText(adminNotes),
    },

    derivedUnknowns: {
      currentReferenceSnareKnown: false,
      currentKitMatchRequirementKnown: false,
      timelineKnown: false,
      woodSpeciesPreferenceKnown: false,
      hoopTypePreferenceKnown: false,
      lugPreferenceKnown: false,
      shellConstructionPreferenceKnown: false,
      finishColorDirectionKnown: false,
      shellDepthResolved: hasText(project.shellDepth),
      diameterResolved: hasText(project.width) || hasText(voice.sizeDirection),
    },
  };
}

export function buildDiscoveryBridgeInput({
  project = {},
  consultationIntake = {},
  storyEngine = {},
}) {
  const purpose = consultationIntake?.purpose || {};
  const feel = consultationIntake?.feel || {};
  const voice = consultationIntake?.voice || {};
  const legacy = consultationIntake?.legacy || {};
  const consult = consultationIntake?.consult || {};

  const flags = buildDeterministicDiscoveryFlags({
    consultationIntake,
    project,
    storyEngine,
  });

  return {
    version: DISCOVERY_BRIDGE_VERSION,

    artist: {
      name: cleanText(
        project.customerName ||
          project.customer?.name ||
          storyEngine?.consultationMapped?.artistName ||
          ''
      ),
      email: cleanText(project.customerEmail || project.customer?.email || ''),
      projectId: cleanText(project.id || ''),
      artisanLine: cleanText(project.artisanLine || 'SoundLegend'),
    },

    questionnaire: {
      purpose: {
        playerProfile: cleanText(purpose.playerProfile),
        primaryGoal: cleanText(purpose.primaryGoal),
        environments: ensureArray(purpose.environments),
        guidancePreference: cleanText(purpose.guidancePreference),
      },

      feel: {
        feelPriorities: ensureArray(feel.feelPriorities),
        snareLoveMost: ensureArray(feel.snareLoveMost),
        snareFrustrations: ensureArray(feel.snareFrustrations),
        dynamicFeel: cleanText(feel.dynamicFeel),
      },

      voice: {
        genres: ensureArray(voice.genres),
        tonalGoals: ensureArray(voice.tonalGoals),
        responsePriorities: ensureArray(voice.responsePriorities),
        sizeDirection: cleanText(voice.sizeDirection),
      },

      legacy: {
        visualDirection: ensureArray(legacy.visualDirection),
        hardwareFinishPreference: cleanText(legacy.hardwareFinishPreference),
        storyImportance: cleanText(legacy.storyImportance),
        favoritePartOfPlaying: ensureArray(legacy.favoritePartOfPlaying),
        influenceReferences: cleanText(legacy.influenceReferences),
        finalNotes: cleanText(legacy.finalNotes),
      },

      consult: {
        consultationContactMethod: cleanText(
          consult.consultationContactMethod
        ),
        consultationDays: ensureArray(consult.consultationDays),
        consultationTimes: ensureArray(consult.consultationTimes),
      },
    },

    knownProjectData: {
      width: cleanText(project.width),
      shellDepth: cleanText(project.shellDepth),
      shellConstruction: cleanText(project.shellConstruction),
      staveCount: cleanText(project.staveCount),
      hardwareFinish: cleanText(project.hardwareFinish),
      hoops: cleanText(project.hoops),
      lugType: cleanText(project.lugType),
      woodSpecies: cleanText(project.woodSpecies),
      currentPhase: cleanText(project.currentPhase),
    },

    consultationArtifacts: {
      consultationTranscript: normalizeTranscript(
        storyEngine?.consultationTranscript || ''
      ),
      consultationSummary: normalizeTranscript(
        storyEngine?.consultationSummary || ''
      ),
      adminNotes: normalizeTranscript(storyEngine?.adminNotes || ''),
    },

    deterministicFlags: flags,

    compactSummary: {
      purpose: [
        cleanText(purpose.playerProfile),
        cleanText(purpose.primaryGoal),
        joinArray(purpose.environments),
        cleanText(purpose.guidancePreference),
      ].filter(Boolean),

      feel: [
        joinArray(feel.feelPriorities),
        joinArray(feel.snareLoveMost),
        joinArray(feel.snareFrustrations),
        cleanText(feel.dynamicFeel),
      ].filter(Boolean),

      voice: [
        joinArray(voice.genres),
        joinArray(voice.tonalGoals),
        joinArray(voice.responsePriorities),
        cleanText(voice.sizeDirection),
      ].filter(Boolean),

      legacy: [
        joinArray(legacy.visualDirection),
        cleanText(legacy.hardwareFinishPreference),
        cleanText(legacy.storyImportance),
        joinArray(legacy.favoritePartOfPlaying),
        cleanText(legacy.influenceReferences),
        cleanText(legacy.finalNotes),
      ].filter(Boolean),
    },
  };
}

export function buildDiscoveryBridgePrompt({
  discoveryBridgeInput,
}) {
  return {
    system: `
You are an internal craftsman decision assistant for Ober Artisan Drums.

Your job is not to sell, flatter, or summarize vaguely.
Your job is to help the craftsman bridge the gap between what is already known and what still must be clarified before moving toward a meaningful custom snare build.

You must analyze the intake through four truths:
- Purpose
- Feel
- Voice
- Legacy

Your output must:
- distinguish clearly between known signals and unresolved blockers
- identify assumptions the craftsman should avoid making
- prioritize follow-up questions by usefulness
- identify tensions, contradictions, and tradeoffs
- focus on what would help the craftsman make better build decisions
- avoid generic language
- avoid repeating raw answers unless interpreting them
- avoid inventing build decisions that are not actually supported
- never pretend a weak preference is a locked specification

Important:
- aesthetic unknowns are not always blockers; only escalate them if they materially affect build direction
- missing reference-drum context is often a serious blocker
- broad tonal language without prioritization is a blocker
- distinguish between low, medium, and high build readiness honestly
- prefer concise, human, premium internal language
- return only valid JSON matching the requested schema
    `.trim(),

    user: `
Analyze this SoundLegend discovery data and generate a craftsman decision bridge.

Focus on:
1. What the intake reliably tells us
2. What still blocks confident build direction
3. What assumptions should not yet be made
4. What questions should be asked next in consultation
5. What tradeoffs or tensions may exist
6. What is safe vs unsafe to proceed with right now

Treat this as an internal craftsman tool, not customer-facing copy.

Return JSON with this exact top-level shape:
{
  "overallBuildReadiness": "low",
  "globalBuildBlockers": [],
  "globalConsultPriorities": [],
  "truths": {
    "purpose": {
      "buildReadiness": "low",
      "signalsWeHave": [],
      "criticalUnknowns": [],
      "assumptionsToAvoid": [],
      "followupQuestions": [],
      "watchouts": [],
      "recommendationNotes": []
    },
    "feel": {
      "buildReadiness": "low",
      "signalsWeHave": [],
      "criticalUnknowns": [],
      "assumptionsToAvoid": [],
      "followupQuestions": [],
      "watchouts": [],
      "recommendationNotes": []
    },
    "voice": {
      "buildReadiness": "low",
      "signalsWeHave": [],
      "criticalUnknowns": [],
      "assumptionsToAvoid": [],
      "followupQuestions": [],
      "watchouts": [],
      "recommendationNotes": []
    },
    "legacy": {
      "buildReadiness": "low",
      "signalsWeHave": [],
      "criticalUnknowns": [],
      "assumptionsToAvoid": [],
      "followupQuestions": [],
      "watchouts": [],
      "recommendationNotes": []
    }
  },
  "proposedConsultFlow": [],
  "buildDirectionSnapshot": {
    "safeToSayNow": [],
    "unsafeToAssumeNow": [],
    "likelyDecisionAreasNext": []
  }
}

Use this input:
${JSON.stringify(discoveryBridgeInput, null, 2)}
    `.trim(),
  };
}

export function createEmptyDiscoveryBridge({
  consultationIntake = {},
  storyEngine = {},
} = {}) {
  return {
    version: DISCOVERY_BRIDGE_VERSION,
    schemaVersion: DISCOVERY_BRIDGE_SCHEMA_VERSION,
    promptVersion: DISCOVERY_BRIDGE_PROMPT_VERSION,
    generatedAt: null,
    generatedFrom: {
      questionnaireCompleted:
        Object.keys(consultationIntake || {}).length > 0,
      questionnaireUpdatedAt: null,
      consultationTranscriptIncluded: hasText(
        storyEngine?.consultationTranscript
      ),
      consultationSummaryIncluded: hasText(
        storyEngine?.consultationSummary
      ),
      adminNotesIncluded: hasText(storyEngine?.adminNotes),
      sourceHash: buildSimpleSourceHash({
        consultationIntake,
        consultationTranscript: storyEngine?.consultationTranscript || '',
        consultationSummary: storyEngine?.consultationSummary || '',
        adminNotes: storyEngine?.adminNotes || '',
      }),
    },
    overallBuildReadiness: 'low',
    globalBuildBlockers: [],
    globalConsultPriorities: [],
    truths: {
      purpose: {
        buildReadiness: 'low',
        signalsWeHave: [],
        criticalUnknowns: [],
        assumptionsToAvoid: [],
        followupQuestions: [],
        watchouts: [],
        recommendationNotes: [],
      },
      feel: {
        buildReadiness: 'low',
        signalsWeHave: [],
        criticalUnknowns: [],
        assumptionsToAvoid: [],
        followupQuestions: [],
        watchouts: [],
        recommendationNotes: [],
      },
      voice: {
        buildReadiness: 'low',
        signalsWeHave: [],
        criticalUnknowns: [],
        assumptionsToAvoid: [],
        followupQuestions: [],
        watchouts: [],
        recommendationNotes: [],
      },
      legacy: {
        buildReadiness: 'low',
        signalsWeHave: [],
        criticalUnknowns: [],
        assumptionsToAvoid: [],
        followupQuestions: [],
        watchouts: [],
        recommendationNotes: [],
      },
    },
    proposedConsultFlow: [],
    buildDirectionSnapshot: {
      safeToSayNow: [],
      unsafeToAssumeNow: [],
      likelyDecisionAreasNext: [],
    },
  };
}

export function normalizeDiscoveryBridgeResponse(raw = {}) {
  const empty = createEmptyDiscoveryBridge();

  return {
    ...empty,
    overallBuildReadiness: cleanText(raw.overallBuildReadiness) || 'low',
    globalBuildBlockers: Array.isArray(raw.globalBuildBlockers)
      ? raw.globalBuildBlockers
      : [],
    globalConsultPriorities: Array.isArray(raw.globalConsultPriorities)
      ? raw.globalConsultPriorities
      : [],
    truths: {
      purpose: {
        ...empty.truths.purpose,
        ...(raw.truths?.purpose || {}),
      },
      feel: {
        ...empty.truths.feel,
        ...(raw.truths?.feel || {}),
      },
      voice: {
        ...empty.truths.voice,
        ...(raw.truths?.voice || {}),
      },
      legacy: {
        ...empty.truths.legacy,
        ...(raw.truths?.legacy || {}),
      },
    },
    proposedConsultFlow: Array.isArray(raw.proposedConsultFlow)
      ? raw.proposedConsultFlow
      : [],
    buildDirectionSnapshot: {
      ...empty.buildDirectionSnapshot,
      ...(raw.buildDirectionSnapshot || {}),
    },
  };
}