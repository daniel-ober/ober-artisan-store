// src/utils/generateStageStorypoints.js

import {
  getProjectStageStoryFramework,
  STORYPOINT_KEYS,
} from './projectStageStoryFramework';
import { buildConsultationIntakeDefaults } from './consultationIntakeSchema';

/* -------------------------------------------------------
   BASIC HELPERS
------------------------------------------------------- */

function cleanString(value = '') {
  return String(value || '').trim();
}

function sentence(value = '') {
  const text = cleanString(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function normalizeDelimitedText(value = '') {
  return String(value || '')
    .split(/\n|•|;|\|/g)
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function toArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  return normalizeDelimitedText(value);
}

function joinList(items = []) {
  const clean = items.map(cleanString).filter(Boolean);
  if (!clean.length) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}

function uniqueStrings(items = []) {
  const seen = new Set();

  return items
    .map((item) => cleanString(item))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isGenericOther(value = '') {
  return cleanString(value).toLowerCase() === 'other';
}

function removeGenericOther(items = []) {
  return items.filter((item) => !isGenericOther(item));
}

function normalizeBuilderGuidance(value = '') {
  const text = cleanString(value).toLowerCase();

  if (!text) return '';
  if (text === 'yes fully') return 'highly open to builder guidance';
  if (text === 'yes with guardrails') {
    return 'open to builder guidance within a few clear guardrails';
  }
  if (text === 'somewhat') return 'somewhat open to builder guidance';
  if (text === 'no, wants exact specs') return 'looking for tighter spec control';

  return cleanString(value);
}

function normalizePrimaryGenre(value = '') {
  const text = cleanString(value);
  if (!text || isGenericOther(text)) return '';
  return text;
}

function normalizeHardwareFinish(value = '') {
  const text = cleanString(value);
  if (!text) return '';
  if (text.toLowerCase() === 'gold / brass') return 'gold';
  return text;
}

function normalizePhraseList(items = []) {
  return uniqueStrings(removeGenericOther(items));
}

function normalizeSentenceList(items = []) {
  return uniqueStrings(
    items
      .map((item) => cleanString(item))
      .filter(Boolean)
      .filter((item) => !isGenericOther(item))
  );
}

function scaleLabel(value) {
  const num = Number(value);
  if (num <= 1) return 'low';
  if (num === 2) return 'slight';
  if (num === 3) return 'moderate';
  if (num === 4) return 'high';
  if (num >= 5) return 'essential';
  return '';
}

function pickTruthy(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (typeof value === 'string' && cleanString(value)) return cleanString(value);
    if (value) return value;
  }
  return '';
}

function normalizeIntake(intake = {}) {
  const defaults = buildConsultationIntakeDefaults();
  const merged = { ...defaults };

  Object.keys(defaults).forEach((sectionKey) => {
    merged[sectionKey] = {
      ...defaults[sectionKey],
      ...(intake?.[sectionKey] || {}),
    };
  });

  return merged;
}

function stripLeadingArticle(value = '') {
  return cleanString(value).replace(/^(a|an|the)\s+/i, '').trim();
}

function normalizeWantsToBecome(value = '') {
  const text = cleanString(value);
  if (!text) return '';

  return text
    .replace(/^this drum wants to become\s*/i, '')
    .replace(/^this wants to become\s*/i, '')
    .trim();
}

function formatWantsToBecomePhrase(value = '') {
  let text = stripLeadingArticle(normalizeWantsToBecome(value));
  if (!text) return '';

  text = text
    .replace(/\binstrument\b/gi, '')
    .replace(/\bdrum\b/gi, '')
    .replace(/\s+—/g, ' —')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text;
}

function deriveGenreFallback(artist = {}, transcript = {}) {
  const combined = [
    cleanString(artist.whatTheyLikeNow),
    cleanString(artist.whatFeelsMissing),
    cleanString(transcript.cleanedTranscript),
    cleanString(transcript.rawTranscript),
  ]
    .join(' ')
    .toLowerCase();

  if (combined.includes('regional mexican')) return 'Regional Mexican';
  if (combined.includes('mexican music')) return 'Regional Mexican';
  if (combined.includes('mexican')) return 'Regional Mexican';
  if (combined.includes('latin')) return 'Latin';
  if (combined.includes('country')) return 'Country';
  if (combined.includes('rock')) return 'Rock';

  return '';
}

function includesStageWord(stageKey = '', candidates = []) {
  return candidates.includes(stageKey);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }
  return '';
}

function dedupeAgainstText(items = [], body = '') {
  const bodyKey = cleanString(body).toLowerCase();
  return items.filter((item) => {
    const key = cleanString(item).toLowerCase();
    return key && key !== bodyKey;
  });
}

function buildShellSize(signals, projectContext) {
  const dia = cleanString(signals.desiredDiameter || projectContext.diameter);
  const dep = cleanString(signals.desiredDepth || projectContext.depth);
  if (!dia && !dep) return '';
  if (dia && dep) return `${dia}x${dep}`;
  return dia || dep;
}

function normalizeInfluenceReference(value = '') {
  const text = cleanString(value);
  if (!text) return '';
  if (text.toLowerCase() === 'latin') return 'Regional Mexican and Latin live playing';
  return text;
}

function normalizeWoodSpeciesValue(value) {
  if (!value) return '';

  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(item))
      .filter(Boolean)
      .join(' + ');
  }

  if (typeof value === 'object') {
    return cleanString(
      value.label ||
        value.name ||
        value.species ||
        value.value ||
        value.primary ||
        value.secondary
    );
  }

  return cleanString(value);
}

function getStageNarrativeLens(stageKey = '') {
  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return {
      materialFocusLabel: 'Early material instincts',
      buildFocusLabel: 'Possible build direction',
      toolsLabel: 'Early build anchors',
      voiceFocusLabel: 'What this chapter protects',
    };
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return {
      materialFocusLabel: 'Material strategy',
      buildFocusLabel: 'What is locking in',
      toolsLabel: 'Material and visual anchors',
      voiceFocusLabel: 'What this chapter sets in motion',
    };
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return {
      materialFocusLabel: 'Structural direction',
      buildFocusLabel: 'What is taking physical form',
      toolsLabel: 'Core materials in play',
      voiceFocusLabel: 'What this chapter starts shaping',
    };
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return {
      materialFocusLabel: 'Precision priorities',
      buildFocusLabel: 'What is being refined',
      toolsLabel: 'Refinement factors',
      voiceFocusLabel: 'What this chapter protects',
    };
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return {
      materialFocusLabel: 'Visual material strategy',
      buildFocusLabel: 'What is being expressed visually',
      toolsLabel: 'Visual ingredients',
      voiceFocusLabel: 'What this chapter reinforces',
    };
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return {
      materialFocusLabel: 'Cut strategy',
      buildFocusLabel: 'What is being shaped',
      toolsLabel: 'Response-defining factors',
      voiceFocusLabel: 'What this chapter unlocks',
    };
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return {
      materialFocusLabel: 'Component strategy',
      buildFocusLabel: 'What is coming together',
      toolsLabel: 'Assembly components',
      voiceFocusLabel: 'What this chapter confirms',
    };
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return {
      materialFocusLabel: 'Final voice priorities',
      buildFocusLabel: 'What is being revealed',
      toolsLabel: 'Final presentation anchors',
      voiceFocusLabel: 'What this chapter reveals',
    };
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return {
      materialFocusLabel: 'Final release priorities',
      buildFocusLabel: 'What is being finalized',
      toolsLabel: 'Handoff elements',
      voiceFocusLabel: 'What this chapter preserves',
    };
  }

  return {
    materialFocusLabel: 'Material strategy',
    buildFocusLabel: 'What is happening',
    toolsLabel: 'Tools involved',
    voiceFocusLabel: 'Why this chapter matters',
  };
}

/* -------------------------------------------------------
   INTAKE EXTRACTION
------------------------------------------------------- */

function extractProjectContext(project = {}) {
  const shellWood = normalizeWoodSpeciesValue(
    pickTruthy(
      project.woodType,
      project.woodSpecies,
      project.primaryWood,
      project.shellWood,
      project.primarySpecies,
      project.shellSpecies,
      project.woodSpeciesPrimary,
      project.primaryWoodSpecies,
      project.shellRecipePrimary
    )
  );

  const secondaryWood = normalizeWoodSpeciesValue(
    pickTruthy(
      project.secondaryWood,
      project.secondarySpecies,
      project.secondaryWoodSpecies,
      project.secondaryShellWood,
      project.woodSpeciesSecondary,
      project.secondaryWoodType,
      project.secondaryWoodSpeciesName,
      project.shellRecipeSecondary
    )
  );

  const shellRecipe = joinList([shellWood, secondaryWood].filter(Boolean));

  return {
    artistName: pickTruthy(
      project.artistName,
      project.customerName,
      project.clientName,
      project.name
    ),
    shellSize: pickTruthy(
      project.size,
      project.shellSize,
      project.snareSize,
      project.dimensions
    ),
    diameter: pickTruthy(project.diameter, project.width),
    depth: pickTruthy(project.depth, project.shellDepth),
    hardwareFinish: pickTruthy(
      project.hardwareFinish,
      project.hardwareColor,
      project.finishHardware
    ),
    shellConstruction: pickTruthy(
      project.shellConstruction,
      project.construction,
      project.buildType
    ),
    shellWood,
    secondaryWood,
    shellRecipe,
    staveCount: pickTruthy(project.staveCount, project.staves),
    projectSerial: pickTruthy(
      project.serial,
      project.serialNumber,
      project.lineSerial,
      project.snareSerial
    ),
  };
}

function extractStageSignals(intake, projectContext) {
  const artist = intake.artistMusicalContext || {};
  const tonal = intake.tonalDirection || {};
  const feel = intake.feelPlayingExperience || {};
  const visual = intake.visualDirection || {};
  const build = intake.buildDirection || {};
  const story = intake.inspirationStoryIdentity || {};
  const priorities = intake.prioritiesTradeoffs || {};
  const interpretation = intake.builderInterpretation || {};
  const call = intake.consultationRecord || {};
  const transcript = intake.callTranscriptionSourceNotes || {};

  return {
    artistLocation: cleanString(artist.artistLocation),
    primaryGenre:
      normalizePrimaryGenre(artist.primaryGenre) ||
      deriveGenreFallback(artist, transcript),
    secondaryGenres: normalizePhraseList(toArray(artist.secondaryGenres)),
    performanceContexts: normalizePhraseList(toArray(artist.performanceContexts)),
    currentReferences: normalizeSentenceList([
      artist.currentSnareReferences,
      artist.existingBrandReferences,
      tonal.closestSoundReference,
    ]),
    whatWorksNow: cleanString(artist.whatTheyLikeNow),
    whatFeelsMissing: cleanString(artist.whatFeelsMissing),

    tonalCharacter: normalizePhraseList(toArray(tonal.desiredTonalCharacter)),
    tuningRange: cleanString(tonal.desiredTuningRange),
    responsePriorities: normalizePhraseList(toArray(tonal.responsePriorities)),
    tonalAvoid: cleanString(tonal.whatItShouldNotSoundLike),

    articulationImportance: tonal.articulationImportance,
    bodyImportance: tonal.bodyFullnessImportance,
    projectionImportance: tonal.projectionImportance,
    sensitivityImportance: tonal.sensitivityImportance,
    rimResponseImportance: tonal.rimResponseImportance,
    warmthImportance: tonal.warmthImportance,
    cutImportance: tonal.cutAttackImportance,
    versatilityImportance: tonal.versatilityImportance,
    controlImportance: tonal.controlFocusImportance,

    feelDescriptors: normalizePhraseList(toArray(feel.desiredFeelDescriptors)),
    techniques: normalizePhraseList(toArray(feel.mostUsedTechniques)),
    reliableFeelNeed: cleanString(feel.whatMustFeelReliable),
    playingExperiencePriority: cleanString(feel.mostImportantPlayingExperience),

    visualStyle: normalizePhraseList(toArray(visual.visualStyle)),
    finishDirection: normalizePhraseList(toArray(visual.finishDirection)),
    visualReferences: cleanString(visual.visualReferences),
    visualAvoid: cleanString(visual.whatItShouldNotLookLike),
    hardwareFinish: normalizeHardwareFinish(
      visual.hardwareFinish || projectContext.hardwareFinish
    ),
    hoopPreference: cleanString(visual.hoopPreference),
    shouldPairWith: cleanString(visual.shouldPairWith),
    colorsToComplement: cleanString(visual.colorsOrMaterialsToComplement),

    desiredDiameter: cleanString(build.desiredDiameter || projectContext.diameter),
    desiredDepth: cleanString(build.desiredDepth || projectContext.depth),
    shellDepthFeel: cleanString(build.shellDepthFeel),
    woodPreferences: cleanString(build.woodPreferencesDiscussed),
    woodsToAvoid: cleanString(build.woodsToAvoid),
    constructionInterest: cleanString(
      build.constructionInterest || projectContext.shellConstruction
    ),
    hardwarePreferencesDiscussed: cleanString(build.hardwarePreferencesDiscussed),
    edgePreferences: cleanString(build.edgeOrSnareBedPreferences),
    drynessPreference: cleanString(build.drynessOrDampeningPreference),
    builderGuidanceLevel: normalizeBuilderGuidance(build.builderGuidanceLevel),
    specClarity: cleanString(build.specClarity),
    builderConfidence: cleanString(build.builderConfidence),
    initialShellConcept: cleanString(build.initialShellConcept),
    likelyFinalDirection: cleanString(build.likelyFinalDirection),

    inspiration: cleanString(story.whatIsInspiringThisBuild),
    carriedFeeling: cleanString(story.whatFeelingShouldItCarry),
    milestoneConnection: cleanString(story.milestoneOrSeasonConnection),
    personalMeaning: cleanString(story.whatMakesItPersonal),
    identityWords: normalizePhraseList(toArray(story.identityWords)),
    moodReference: cleanString(story.recordSceneMood),
    symbolicElements: cleanString(story.symbolicElements),

    topThreePriorities: cleanString(priorities.topThreePriorities),
    biggestConcern: cleanString(priorities.biggestConcern),
    biggestUnknown: cleanString(priorities.biggestUnknown),
    builderGuideArea: cleanString(priorities.whereBuilderShouldGuideMost),
    dontOvercomplicate: cleanString(priorities.whereNotToOvercomplicate),
    priorityRanking: normalizePhraseList(toArray(priorities.priorityRanking)),
    looksImportance: priorities.looksImportance,
    toneImportance: priorities.toneImportance,
    feelImportance: priorities.feelImportance,
    uniquenessImportance: priorities.uniquenessPriorityImportance,
    budgetSensitivity: priorities.budgetSensitivityImportance,
    timelineUrgency: priorities.timelineUrgencyImportance,

    firstReadOnBuild: cleanString(interpretation.firstReadOnBuild),
    mostImportantMusically: cleanString(
      interpretation.whatSeemsMostImportantMusically
    ),
    mostImportantVisually: cleanString(
      interpretation.whatSeemsMostImportantVisually
    ),
    whatTheDrumWantsToBecome: normalizeWantsToBecome(
      interpretation.whatTheDrumWantsToBecome
    ),
    earlyShellInstinct: cleanString(interpretation.earlyShellInstinct),
    earlyRisks: cleanString(interpretation.earlyRisksOrConcerns),
    protectNoMatterWhat: cleanString(interpretation.whatShouldBeProtected),
    strongestRecommendation: cleanString(
      interpretation.strongestRecommendationRightNow
    ),
    futureFollowUp: cleanString(interpretation.futureFollowUpNotes),

    consultationDate: cleanString(call.consultationDate),
    callType: cleanString(call.callType),
    consultationDurationMinutes: call.consultationDurationMinutes,
    leadSource: cleanString(call.leadSource),
    quoteStatus: cleanString(call.quoteStatus),
    followUpNeeded: !!call.followUpNeeded,
    rawCallNotes: cleanString(call.rawCallNotes),
    referenceLinks: cleanString(call.referenceLinks),

    transcriptSource: cleanString(transcript.transcriptSource),
    transcriptStatus: cleanString(transcript.transcriptStatus),
    rawTranscript: cleanString(transcript.rawTranscript),
    cleanedTranscript: cleanString(transcript.cleanedTranscript),
    keyQuotesMoments: cleanString(transcript.keyQuotesMoments),
    linkedTranscriptDoc: cleanString(transcript.linkedTranscriptDoc),
    useTranscriptForGeneration: !!transcript.useTranscriptForGeneration,
  };
}

/* -------------------------------------------------------
   SIGNAL BUILDERS
------------------------------------------------------- */

function buildIdentitySummary(signals, projectContext) {
  const bits = [];

  if (signals.whatTheDrumWantsToBecome) {
    bits.push(
      `a drum that feels ${formatWantsToBecomePhrase(
        signals.whatTheDrumWantsToBecome
      )}`
    );
  }

  if (signals.primaryGenre) {
    bits.push(`${signals.primaryGenre.toLowerCase()}-rooted playing`);
  }

  if (signals.responsePriorities.length) {
    bits.push(
      `${joinList(signals.responsePriorities).toLowerCase()} as important response cues`
    );
  }

  if (signals.hardwareFinish) {
    bits.push(`${signals.hardwareFinish.toLowerCase()} hardware as a visual anchor`);
  }

  const shellSize = buildShellSize(signals, projectContext);
  if (shellSize) {
    bits.push(`a shell direction around ${shellSize}`);
  }

  return bits;
}

function buildPriorityHighlights(signals) {
  const highlights = [];

  const importancePairs = [
    ['tone', signals.toneImportance],
    ['feel', signals.feelImportance],
    ['looks', signals.looksImportance],
    ['uniqueness', signals.uniquenessImportance],
    ['budget control', signals.budgetSensitivity],
    ['timeline urgency', signals.timelineUrgency],
    ['rim response', signals.rimResponseImportance],
    ['articulation', signals.articulationImportance],
    ['body', signals.bodyImportance],
    ['sensitivity', signals.sensitivityImportance],
  ];

  importancePairs.forEach(([label, value]) => {
    if (Number(value) >= 4) {
      highlights.push(`${label} carries ${scaleLabel(value)} importance`);
    }
  });

  return uniqueStrings(highlights);
}

function buildStageTailoredVision(stageKey, signals, projectContext) {
  const size = buildShellSize(signals, projectContext);
  const becoming = formatWantsToBecomePhrase(signals.whatTheDrumWantsToBecome);

  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return sentence(
      [
        becoming
          ? `In this build, the earliest discovery work is already pointing toward a drum that feels ${becoming}`
          : '',
        signals.primaryGenre
          ? `The musical world around it is rooted in ${signals.primaryGenre.toLowerCase()} playing`
          : '',
        signals.hardwareFinish || signals.finishDirection.length
          ? `and the visual lane is already taking shape through ${joinList(
              [
                signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
                ...signals.finishDirection,
              ].filter(Boolean)
            ).toLowerCase()}`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return sentence(
      [
        size ? `This is where the ${size} direction starts becoming materially specific` : '',
        projectContext.shellRecipe
          ? `with the shell recipe locking in around ${projectContext.shellRecipe.toLowerCase()}`
          : '',
        signals.constructionInterest
          ? `and ${signals.constructionInterest.toLowerCase()} construction gaining weight`
          : '',
        signals.finishDirection.length
          ? `while the exterior identity sharpens around ${joinList(
              signals.finishDirection
            ).toLowerCase()}`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return sentence(
      [
        size ? `This chapter is about giving the ${size} shell real physical authority` : '',
        projectContext.shellRecipe
          ? `using a ${projectContext.shellRecipe.toLowerCase()} shell recipe`
          : '',
        signals.responsePriorities.length
          ? `so ${joinList(signals.responsePriorities).toLowerCase()} can be supported structurally`
          : '',
        becoming ? `while preserving the sense that it should feel ${becoming}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return sentence(
      [
        `This build needs the shell refined in a way that protects tuning honesty and repeatable feel`,
        signals.responsePriorities.length
          ? `especially around ${joinList(signals.responsePriorities).toLowerCase()}`
          : '',
        signals.whatFeelsMissing
          ? `because the goal is to solve for ${signals.whatFeelsMissing.toLowerCase()}`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return sentence(
      [
        `This chapter is where the visual identity has to earn its place`,
        signals.hardwareFinish
          ? `through ${signals.hardwareFinish.toLowerCase()} hardware pairing`
          : '',
        signals.finishDirection.length
          ? `and a finish direction centered on ${joinList(signals.finishDirection).toLowerCase()}`
          : '',
        becoming ? `without losing the sense that the drum should feel ${becoming}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return sentence(
      [
        `This chapter is being shaped around contact points that make the drum feel trustworthy under the hands`,
        signals.responsePriorities.length
          ? `with special attention to ${joinList(signals.responsePriorities).toLowerCase()}`
          : '',
        signals.playingExperiencePriority
          ? `and a response that stays aligned with ${signals.playingExperiencePriority.toLowerCase()}`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return sentence(
      [
        `This is where the component choices have to feel fully coherent`,
        signals.hardwareFinish
          ? `${signals.hardwareFinish.toLowerCase()} hardware needs to look intentional`
          : '',
        signals.hoopPreference
          ? `and ${signals.hoopPreference.toLowerCase()} hoops need to support the voice and feel`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return sentence(
      [
        `This chapter is about revealing the drum in a way that feels true to the player`,
        signals.responsePriorities.length
          ? `with the final tuning honoring ${joinList(signals.responsePriorities).toLowerCase()}`
          : '',
        becoming ? `and presenting it as something that feels ${becoming}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return sentence(
      [
        `This final chapter protects everything the build was aiming to become`,
        becoming ? `so the handoff still feels ${becoming}` : '',
        `when it leaves the bench and enters the artist’s world`,
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  const fallbackBits = [];

  if (becoming) {
    fallbackBits.push(
      `In this build, the chapter bends toward a drum that feels ${becoming}`
    );
  }

  if (signals.primaryGenre || signals.responsePriorities.length) {
    const musicalBits = [];
    if (signals.primaryGenre) {
      musicalBits.push(`${signals.primaryGenre.toLowerCase()} influence`);
    }
    if (signals.responsePriorities.length) {
      musicalBits.push(
        `${joinList(signals.responsePriorities).toLowerCase()} as key response priorities`
      );
    }
    fallbackBits.push(
      sentence(`The musical context points toward ${joinList(musicalBits)}`)
    );
  }

  if (signals.hardwareFinish || signals.visualStyle.length || signals.finishDirection.length) {
    fallbackBits.push(
      sentence(
        `Visually, the direction is being anchored by ${joinList(
          [
            signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
            ...signals.visualStyle,
            ...signals.finishDirection,
          ].filter(Boolean)
        ).toLowerCase()}`
      )
    );
  }

  if (signals.builderGuidanceLevel) {
    fallbackBits.push(
      sentence(
        `The build is currently leaning ${signals.builderGuidanceLevel.toLowerCase()}, which shapes how much interpretation and recommendation the process can carry`
      )
    );
  }

  return fallbackBits.filter(Boolean).join(' ');
}

function buildArtistIntent(signals) {
  const parts = [];

  if (signals.primaryGenre) {
    parts.push(
      `The musical center of gravity sits around ${signals.primaryGenre.toLowerCase()}-rooted playing`
    );
  }

  if (signals.currentReferences.length) {
    parts.push(`reference points include ${joinList(signals.currentReferences)}`);
  }

  if (signals.whatFeelsMissing) {
    parts.push(`the biggest gap to solve is ${signals.whatFeelsMissing}`);
  }

  return sentence(parts.join(', '));
}

function buildUseCaseSummary(signals) {
  const contexts = signals.performanceContexts.filter(
    (item) => cleanString(item).toLowerCase() !== 'other'
  );
  if (contexts.length) {
    return contexts;
  }

  return [];
}

function buildArtistResponseBody(signals) {
  return sentence(
    firstNonEmpty(
      signals.playingExperiencePriority,
      signals.reliableFeelNeed,
      signals.whatFeelsMissing,
      'The desired response for this build will be clarified here through touch, feel, and musical need.'
    )
  );
}

function buildCraftsmanMaterialStrategy(stageKey, signals, projectContext) {
  const size = buildShellSize(signals, projectContext);
  const construction = cleanString(signals.constructionInterest);
  const hardware = cleanString(signals.hardwareFinish);
  const finishDirection = joinList(signals.finishDirection).toLowerCase();

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    const parts = [];
    if (size) parts.push(`The ${size} format is now being matched with the right material direction`);
    if (projectContext.shellRecipe) {
      parts.push(`the shell recipe is locking in around ${projectContext.shellRecipe}`);
    }
    if (construction) {
      parts.push(`${construction.toLowerCase()} construction remains the strongest fit`);
    }
    if (finishDirection) {
      parts.push(`and the exterior is being shaped around ${finishDirection}`);
    }
    return sentence(parts.join(', '));
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    const parts = [];
    if (size) parts.push(`The ${size} shell is now being formed with structure and proportion in mind`);
    if (projectContext.shellRecipe) {
      parts.push(`using a ${projectContext.shellRecipe} shell recipe`);
    }
    if (construction) {
      parts.push(`${construction.toLowerCase()} remains the right construction lane for this build`);
    }
    if (signals.responsePriorities.length) {
      parts.push(`because it supports ${joinList(signals.responsePriorities).toLowerCase()}`);
    }
    return sentence(parts.join(', '));
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return sentence(
      [
        `The shell geometry now has to be refined around consistency and control`,
        signals.edgePreferences
          ? `with later edge decisions still pointing toward ${signals.edgePreferences.toLowerCase()}`
          : '',
        signals.drynessPreference
          ? `and an overall response that stays ${signals.drynessPreference.toLowerCase()}`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return sentence(
      [
        `The finish strategy is being built around visual cohesion rather than flash for its own sake`,
        hardware ? `${hardware.toLowerCase()} hardware is a key anchor` : '',
        finishDirection ? `and the surface language leans ${finishDirection}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return sentence(
      [
        `The cut strategy here has to protect feel and response more than spectacle`,
        signals.edgePreferences
          ? `Current edge thinking points toward ${signals.edgePreferences.toLowerCase()}`
          : '',
        signals.responsePriorities.length
          ? `with ${joinList(signals.responsePriorities).toLowerCase()} sitting high on the priority list`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return sentence(
      [
        `Component choices now need to confirm the direction established earlier`,
        hardware ? `${hardware.toLowerCase()} hardware is central to that cohesion` : '',
        signals.hoopPreference
          ? `and ${signals.hoopPreference.toLowerCase()} hoops remain part of the intended feel`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return sentence(
      [
        `Final tuning choices need to respect what the shell naturally wants to do`,
        signals.responsePriorities.length
          ? `while highlighting ${joinList(signals.responsePriorities).toLowerCase()}`
          : '',
        signals.tonalCharacter.length
          ? `and preserving a ${joinList(signals.tonalCharacter).toLowerCase()} character`
          : '',
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  const materialBits = uniqueStrings([
    cleanString(construction),
    cleanString(projectContext.shellRecipe),
    cleanString(projectContext.shellWood),
    cleanString(projectContext.secondaryWood),
  ]).filter((item) => cleanString(item).toLowerCase() !== 'other');

  if (materialBits.length) {
    return sentence(
      `Material direction is centering around ${joinList(materialBits)}`
    );
  }

  return 'Material and process choices in this chapter are being guided by what best serves the instrument rather than what is merely possible.';
}

function buildCustomChoices(stageKey, signals, projectContext) {
  const items = [];

  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return uniqueStrings([
      signals.initialShellConcept,
      signals.likelyFinalDirection,
      signals.builderGuideArea,
      signals.whatFeelsMissing,
      signals.mostImportantVisually,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return uniqueStrings([
      signals.likelyFinalDirection,
      projectContext.shellRecipe
        ? `Shell recipe is locking in around ${projectContext.shellRecipe}`
        : '',
      signals.woodPreferences,
      signals.hardwarePreferencesDiscussed,
      signals.mostImportantVisually,
      signals.builderGuideArea,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return uniqueStrings([
      signals.initialShellConcept,
      signals.likelyFinalDirection,
      sizeSummaryForCustomization(signals, projectContext),
      projectContext.shellRecipe
        ? `Shell recipe in play: ${projectContext.shellRecipe}`
        : '',
      signals.mostImportantMusically,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return uniqueStrings([
      signals.mostImportantMusically,
      signals.edgePreferences,
      signals.drynessPreference,
      signals.whatFeelsMissing,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return uniqueStrings([
      signals.mostImportantVisually,
      signals.visualReferences,
      signals.colorsToComplement,
      signals.shouldPairWith,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return uniqueStrings([
      signals.edgePreferences,
      signals.reliableFeelNeed,
      signals.playingExperiencePriority,
      signals.responsePriorities.length
        ? `Response priorities include ${joinList(signals.responsePriorities)}`
        : '',
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return uniqueStrings([
      signals.hardwarePreferencesDiscussed,
      signals.hoopPreference,
      signals.reliableFeelNeed,
      signals.mostImportantVisually,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return uniqueStrings([
      signals.playingExperiencePriority,
      signals.reliableFeelNeed,
      signals.whatWorksNow,
      signals.mostImportantMusically,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return uniqueStrings([
      signals.protectNoMatterWhat,
      signals.futureFollowUp,
      signals.whatTheDrumWantsToBecome
        ? `Final handoff should preserve a drum that feels ${formatWantsToBecomePhrase(
            signals.whatTheDrumWantsToBecome
          )}`
        : '',
    ]).filter(Boolean);
  }

  if (signals.initialShellConcept) items.push(signals.initialShellConcept);
  if (signals.likelyFinalDirection) items.push(signals.likelyFinalDirection);
  if (signals.builderGuideArea) items.push(signals.builderGuideArea);
  if (signals.mostImportantMusically) items.push(signals.mostImportantMusically);
  if (signals.mostImportantVisually) items.push(signals.mostImportantVisually);

  return uniqueStrings(items);
}

function sizeSummaryForCustomization(signals, projectContext) {
  const size = buildShellSize(signals, projectContext);
  if (!size) return '';
  return `${size} shell format remains central to the build direction`;
}

function buildBuildBody(stageKey, signals, projectContext) {
  const size = buildShellSize(signals, projectContext);
  const construction = cleanString(signals.constructionInterest);
  const finalDirection = cleanString(signals.likelyFinalDirection);
  const initialConcept = cleanString(signals.initialShellConcept);

  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return sentence(
      firstNonEmpty(
        initialConcept,
        finalDirection,
        `The build is still being framed through artist need, likely shell direction${
          size ? `, and a ${size} format` : ''
        } before anything permanent is locked in`
      )
    );
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return sentence(
      firstNonEmpty(
        finalDirection,
        initialConcept,
        `This chapter is about locking the material and visual direction${
          size ? ` for a ${size} shell` : ''
        }${
          projectContext.shellRecipe
            ? ` around a ${projectContext.shellRecipe} shell recipe`
            : ''
        }${
          construction
            ? ` using ${construction.toLowerCase()} construction as the leading lane`
            : ''
        }`
      )
    );
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return sentence(
      firstNonEmpty(
        initialConcept,
        `This chapter is where the shell itself begins taking physical form${
          size ? ` in a ${size} format` : ''
        }${
          projectContext.shellRecipe
            ? ` using a ${projectContext.shellRecipe} shell recipe`
            : ''
        }${construction ? ` through ${construction.toLowerCase()} construction` : ''}`
      )
    );
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return sentence(
      `This chapter is focused on refining the shell so it behaves consistently under tension, tunes honestly, and supports the feel the player is expecting`
    );
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return sentence(
      `This chapter is focused on translating the build’s visual language onto the shell in a way that feels deliberate, elevated, and coherent with the hardware and finish direction`
    );
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return sentence(
      `This chapter is about shaping the contact points that will control head seating, snare response, and the overall honesty of the drum under the hands`
    );
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return sentence(
      `This chapter is where the shell, hardware, heads, and wires finally begin operating as one complete instrument`
    );
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return sentence(
      `This chapter is about arriving at the drum’s playable voice and capturing it in a way that feels truthful to the instrument and the artist`
    );
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return sentence(
      `This chapter closes the build with final inspection, protection, and handoff preparation so the instrument leaves the bench ready for real life`
    );
  }

  return sentence(
    firstNonEmpty(
      initialConcept,
      finalDirection,
      'This chapter explains what is physically happening in the build during this phase.'
    )
  );
}

function buildTechniqueItems(stageKey, signals) {
  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return dedupeAgainstText(
      uniqueStrings([
        signals.specClarity,
        signals.builderGuidanceLevel,
        signals.topThreePriorities,
      ]),
      ''
    );
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return uniqueStrings([
      signals.woodPreferences,
      signals.hardwarePreferencesDiscussed,
      signals.shellDepthFeel,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return uniqueStrings([
      signals.shellDepthFeel,
      signals.constructionInterest,
      signals.builderGuidanceLevel,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return uniqueStrings([
      signals.edgePreferences,
      signals.drynessPreference,
      signals.shellDepthFeel,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return uniqueStrings([
      ...signals.finishDirection,
      ...signals.visualStyle,
      signals.colorsToComplement,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return uniqueStrings([
      signals.edgePreferences,
      signals.reliableFeelNeed,
      signals.responsePriorities.length
        ? `Response priorities include ${joinList(signals.responsePriorities)}`
        : '',
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return uniqueStrings([
      signals.hoopPreference,
      signals.hardwarePreferencesDiscussed,
      signals.reliableFeelNeed,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return uniqueStrings([
      signals.tuningRange,
      ...signals.tonalCharacter,
      signals.playingExperiencePriority,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return uniqueStrings([
      signals.protectNoMatterWhat,
      signals.biggestConcern,
      signals.futureFollowUp,
    ]).filter(Boolean);
  }

  return uniqueStrings([
    signals.edgePreferences,
    signals.drynessPreference,
    signals.shellDepthFeel,
  ]).filter(Boolean);
}

function buildToolItems(stageKey, signals, projectContext) {
  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return uniqueStrings([
      buildShellSize(signals, projectContext),
      signals.constructionInterest,
      signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware direction` : '',
      signals.hoopPreference,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return uniqueStrings([
      projectContext.shellRecipe,
      signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
      ...signals.finishDirection,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return uniqueStrings([
      projectContext.shellRecipe,
      signals.constructionInterest,
      buildShellSize(signals, projectContext),
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return uniqueStrings([
      buildShellSize(signals, projectContext),
      signals.responsePriorities.length
        ? `Priority response areas: ${joinList(signals.responsePriorities)}`
        : '',
      signals.shellDepthFeel,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return uniqueStrings([
      signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
      ...signals.finishDirection,
      ...signals.visualStyle,
      signals.colorsToComplement,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return uniqueStrings([
      signals.edgePreferences,
      signals.responsePriorities.length
        ? `Response priorities: ${joinList(signals.responsePriorities)}`
        : '',
      signals.reliableFeelNeed,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return uniqueStrings([
      signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
      signals.hoopPreference,
      signals.hardwarePreferencesDiscussed,
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return uniqueStrings([
      ...signals.tonalCharacter,
      signals.tuningRange,
      signals.performanceContexts.length
        ? `Primary use: ${joinList(signals.performanceContexts)}`
        : '',
    ]).filter(Boolean);
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return uniqueStrings([
      projectContext.projectSerial,
      signals.quoteStatus,
      signals.followUpNeeded ? 'Follow-up still needed' : '',
    ]).filter(Boolean);
  }

  return uniqueStrings([
    projectContext.shellRecipe,
    projectContext.shellWood,
    projectContext.secondaryWood,
    signals.hardwareFinish ? `${signals.hardwareFinish.toLowerCase()} hardware` : '',
    signals.hoopPreference,
  ]).filter(Boolean);
}

function buildVoiceWhyBody(stageKey, signals) {
  if (includesStageWord(stageKey, ['discoveryDesign'])) {
    return sentence(
      firstNonEmpty(
        signals.whatFeelsMissing,
        signals.playingExperiencePriority,
        'This chapter matters because it prevents the build from drifting toward something impressive but personally off-target.'
      )
    );
  }

  if (includesStageWord(stageKey, ['woodVisionLockIn'])) {
    return sentence(
      `This chapter matters because the material and visual direction start deciding what kind of instrument this can honestly become`
    );
  }

  if (includesStageWord(stageKey, ['rawShellCreation'])) {
    return sentence(
      `This chapter matters because the shell structure starts determining how much body, control, and authority the instrument can actually carry`
    );
  }

  if (includesStageWord(stageKey, ['shellTrueingTorchTune'])) {
    return sentence(
      `This chapter matters because small structural inaccuracies here can turn into big frustrations later in tuning, feel, and consistency`
    );
  }

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return sentence(
      `This chapter matters because the drum’s visual identity has to feel worthy of the voice and story it is carrying`
    );
  }

  if (includesStageWord(stageKey, ['edgesSnareBeds'])) {
    return sentence(
      `This chapter matters because these tiny contact points have an outsized impact on sensitivity, seating, attack, and overall honesty under tension`
    );
  }

  if (includesStageWord(stageKey, ['hardwareAssembly'])) {
    return sentence(
      `This chapter matters because separate choices now have to coexist cleanly as one instrument under real tension and real use`
    );
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return sentence(
      `This chapter matters because the drum is no longer only being finished here — it is being voiced, heard, and introduced`
    );
  }

  if (includesStageWord(stageKey, ['finalQAPackagingDelivery'])) {
    return sentence(
      `This chapter matters because the final handoff should protect everything the build has worked to become`
    );
  }

  return sentence(
    firstNonEmpty(
      signals.whatFeelsMissing,
      signals.playingExperiencePriority,
      signals.reliableFeelNeed,
      signals.mostImportantMusically
    )
  );
}

function buildVoiceAffects(stageKey, signals) {
  const common = uniqueStrings([
    ...signals.responsePriorities,
    ...signals.tonalCharacter,
    ...signals.feelDescriptors,
    signals.tuningRange,
  ]).filter((item) => cleanString(item).toLowerCase() !== 'other');

  if (includesStageWord(stageKey, ['exteriorArtFinish'])) {
    return uniqueStrings([
      'Perceived character',
      'Visual identity',
      'Emotional presence',
      ...common.slice(0, 4),
    ]);
  }

  if (includesStageWord(stageKey, ['legacyTuningMedia'])) {
    return uniqueStrings([
      'Final voice',
      'Player feel',
      'Recorded impression',
      ...common,
    ]);
  }

  return common;
}

/* -------------------------------------------------------
   COPY BUILDERS
------------------------------------------------------- */

function generateOverview(framework, signals, projectContext) {
  const chapterStory = framework.chapterStoryCore || framework.chapterPurpose || '';
  const oberVision =
    framework.oberVisionCore || framework.overview?.oberVisionPrompt || '';
  const identitySummary = buildIdentitySummary(signals, projectContext);
  const priorityHighlights = buildPriorityHighlights(signals);

  return {
    title: 'Chapter Story',
    intro: chapterStory,
    body: chapterStory,
    chapterStory,
    oberVision,
    tailoredVision: buildStageTailoredVision(framework.stageKey, signals, projectContext),
    sections: [
      {
        label: 'Identity Signals',
        items:
          identitySummary.length > 0
            ? identitySummary
            : ['The core identity of this build continues to take shape here.'],
      },
      {
        label: 'Priority Signals',
        items:
          priorityHighlights.length > 0
            ? priorityHighlights
            : [
                'The strongest priorities for this build will be reflected here as they become clearer.',
              ],
      },
    ],
  };
}

function generateArtistDirection(framework, signals) {
  const intro =
    buildArtistIntent(signals) ||
    'This chapter translates the artist’s musical world, references, and response priorities into chapter-specific direction.';

  const influences = uniqueStrings([
    ...signals.currentReferences,
    ...signals.secondaryGenres.map(normalizeInfluenceReference),
    signals.moodReference,
    signals.inspiration,
  ]);

  const emotionalTarget = uniqueStrings([
    signals.carriedFeeling,
    signals.personalMeaning,
    ...signals.identityWords,
  ]);

  const useCase = buildUseCaseSummary(signals);
  const responseLine = buildArtistResponseBody(signals);

  return {
    title: 'Artist Direction',
    intro,
    sections: [
      {
        label: 'Influences',
        items:
          influences.length > 0
            ? influences
            : [
                'Musical and aesthetic influences will be reflected here as the build direction sharpens.',
              ],
      },
      {
        label: 'Emotional Target',
        items:
          emotionalTarget.length > 0
            ? emotionalTarget
            : [
                'The instrument is being shaped around a specific emotional and expressive target, not just technical specs.',
              ],
      },
      {
        label: 'How the artist wants it to respond',
        body: responseLine,
      },
      {
        label: 'Use Case',
        items:
          useCase.length > 0
            ? useCase
            : [
                'This chapter will reflect how the instrument is meant to live in the artist’s real musical world.',
              ],
      },
    ],
  };
}

function generateCraftsmanDirection(framework, signals, projectContext) {
  const interpretation =
    signals.firstReadOnBuild ||
    (signals.whatTheDrumWantsToBecome
      ? `This build reads like a drum that should feel ${formatWantsToBecomePhrase(
          signals.whatTheDrumWantsToBecome
        )}`
      : '') ||
    framework.craftsmanDirection?.focus ||
    'This chapter translates artistic intent into physical and technical decisions.';

  const foundational = uniqueStrings([
    signals.protectNoMatterWhat,
    signals.strongestRecommendation,
    'Core tolerances and repeatable craftsmanship remain non-negotiable.',
  ]).filter(Boolean);

  const customChoices = buildCustomChoices(
    framework.stageKey,
    signals,
    projectContext
  );

  return {
    title: 'Craftsman Direction',
    intro: sentence(interpretation),
    sections: [
      {
        label: getStageNarrativeLens(framework.stageKey).materialFocusLabel,
        body: buildCraftsmanMaterialStrategy(
          framework.stageKey,
          signals,
          projectContext
        ),
      },
      {
        label: 'What remains foundational',
        items:
          foundational.length > 0
            ? foundational
            : [
                'Core standards, tolerances, and process discipline remain stable through this chapter.',
              ],
      },
      {
        label: 'What is being customized in this chapter',
        items:
          customChoices.length > 0
            ? customChoices
            : ['This chapter adapts the process to what this particular instrument most needs.'],
      },
    ],
  };
}

function generateBuildDirection(framework, signals, projectContext) {
  const lens = getStageNarrativeLens(framework.stageKey);
  const buildBody = buildBuildBody(framework.stageKey, signals, projectContext);
  const techniques = buildTechniqueItems(framework.stageKey, signals);
  const tools = buildToolItems(framework.stageKey, signals, projectContext);

  return {
    title: 'Build',
    intro: buildBody,
    sections: [
      {
        label: lens.buildFocusLabel,
        body: buildBody,
      },
      {
        label: 'Techniques Used',
        items:
          techniques.length > 0
            ? techniques
            : ['The chapter-specific techniques guiding this phase will appear here.'],
      },
      {
        label: lens.toolsLabel,
        items:
          tools.length > 0
            ? tools
            : ['The tools, materials, and components shaping this chapter will appear here.'],
      },
    ],
  };
}

function generateVoiceDirection(framework, signals) {
  const lens = getStageNarrativeLens(framework.stageKey);

  const guidingLine =
    signals.whatTheDrumWantsToBecome
      ? `A drum that feels ${formatWantsToBecomePhrase(signals.whatTheDrumWantsToBecome)}`
      : signals.strongestRecommendation ||
        framework.chapterTheme ||
        'Every choice in this chapter shapes how the instrument speaks back.';

  const whyBody =
    buildVoiceWhyBody(framework.stageKey, signals) ||
    framework.voice?.focus ||
    'This chapter shapes how the instrument responds, feels, and speaks.';

  const affects = buildVoiceAffects(framework.stageKey, signals);

  return {
    title: 'Voice',
    intro: whyBody,
    sections: [
      {
        label: lens.voiceFocusLabel,
        body: whyBody,
      },
      {
        label: 'What this affects',
        items:
          affects.length > 0
            ? affects
            : ['Sound', 'Feel', 'Response', 'Identity'],
      },
      {
        label: 'Guiding line',
        body: sentence(guidingLine),
      },
    ],
  };
}

function generateArchiveDirection(framework, signals, projectContext) {
  const items = uniqueStrings([
    signals.consultationDate &&
      `consultation date: ${signals.consultationDate}`,
    signals.callType && `call type: ${signals.callType}`,
    signals.leadSource && `lead source: ${signals.leadSource}`,
    signals.quoteStatus && `quote status: ${signals.quoteStatus}`,
    signals.referenceLinks && `reference links recorded`,
    signals.rawCallNotes && `raw call notes captured`,
    signals.transcriptStatus &&
      cleanString(signals.transcriptStatus).toLowerCase() !== 'not added' &&
      `transcript status: ${signals.transcriptStatus}`,
    signals.linkedTranscriptDoc && `linked transcript document available`,
    projectContext.projectSerial &&
      `project serial: ${projectContext.projectSerial}`,
  ]).filter(Boolean);

  const intro =
    items.length > 0
      ? sentence(joinList(items.slice(0, 3)))
      : framework.archive?.focus ||
        'Documentation, notes, transcript material, and chapter artifacts are stored here.';

  return {
    title: 'Archive',
    intro,
    sections: [
      {
        label: 'Stored context',
        items:
          items.length > 0
            ? items
            : [
                'Call details, notes, transcript material, and related chapter artifacts will appear here.',
              ],
      },
      {
        label: 'Builder notes',
        body:
          firstNonEmpty(signals.futureFollowUp, signals.earlyRisks) ||
          'Builder-side context and follow-up notes will be reflected here as the project develops.',
      },
    ],
  };
}

/* -------------------------------------------------------
   CLEANUP
------------------------------------------------------- */

function cleanStoryText(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\bother-rooted\b/gi, 'artist-rooted')
    .replace(/\bother influence\b/gi, 'artist influence')
    .replace(/\bgold hardware hardware\b/gi, 'gold hardware')
    .replace(/\bthis wants to become\b/gi, 'this drum wants to become')
    .replace(/\ba drum that feels a a\b/gi, 'a drum that feels a')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\.\./g, '.')
    .trim();
}

function cleanStoryList(items = []) {
  return uniqueStrings(
    (Array.isArray(items) ? items : [items])
      .map((item) => cleanStoryText(item))
      .filter(Boolean)
      .filter((item) => item.toLowerCase() !== 'other')
      .filter((item) => item.toLowerCase() !== 'other-rooted playing')
  );
}

function cleanGeneratedStorypoint(storypoint = {}) {
  const cleanedSections = Array.isArray(storypoint.sections)
    ? storypoint.sections
        .map((section) => {
          const body = cleanStoryText(section.body || '');
          const items = cleanStoryList(section.items || []);

          if (!body && !items.length) return null;

          return {
            ...section,
            ...(body ? { body } : {}),
            ...(items.length ? { items } : {}),
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...storypoint,
    intro: cleanStoryText(storypoint.intro || ''),
    body: cleanStoryText(storypoint.body || ''),
    chapterStory: cleanStoryText(storypoint.chapterStory || ''),
    oberVision: cleanStoryText(storypoint.oberVision || ''),
    tailoredVision: cleanStoryText(storypoint.tailoredVision || ''),
    sections: cleanedSections,
  };
}

/* -------------------------------------------------------
   PUBLIC API
------------------------------------------------------- */

export function generateStageStorypoints({
  stageKey,
  project = {},
  consultationIntake = {},
} = {}) {
  const framework = getProjectStageStoryFramework(stageKey);
  if (!framework) return null;

  const normalizedIntake = normalizeIntake(consultationIntake);
  const projectContext = extractProjectContext(project);
  const signals = extractStageSignals(normalizedIntake, projectContext);

  const overview = generateOverview(framework, signals, projectContext);
  const artistDirection = generateArtistDirection(framework, signals);
  const craftsmanDirection = generateCraftsmanDirection(
    framework,
    signals,
    projectContext
  );
  const build = generateBuildDirection(framework, signals, projectContext);
  const voice = generateVoiceDirection(framework, signals);
  const archive = generateArchiveDirection(framework, signals, projectContext);

  const storypoints = {
    overview: cleanGeneratedStorypoint(overview),
    artistDirection: cleanGeneratedStorypoint(artistDirection),
    craftsmanDirection: cleanGeneratedStorypoint(craftsmanDirection),
    build: cleanGeneratedStorypoint(build),
    voice: cleanGeneratedStorypoint(voice),
    archive: cleanGeneratedStorypoint(archive),
  };

  return {
    stageKey,
    framework,
    projectContext,
    signals,
    storypoints,
  };
}

export function generateAllStageStorypoints({
  project = {},
  consultationIntake = {},
  stageKeys = [],
} = {}) {
  const keys = Array.isArray(stageKeys) ? stageKeys.filter(Boolean) : [];

  return keys.reduce((acc, currentStageKey) => {
    const generated = generateStageStorypoints({
      stageKey: currentStageKey,
      project,
      consultationIntake,
    });

    if (generated) {
      acc[currentStageKey] = generated;
    }

    return acc;
  }, {});
}

export function getGeneratedStorypointByKey({
  stageKey,
  storypointKey,
  project = {},
  consultationIntake = {},
} = {}) {
  if (!STORYPOINT_KEYS.includes(storypointKey)) return null;

  const generated = generateStageStorypoints({
    stageKey,
    project,
    consultationIntake,
  });

  return generated?.storypoints?.[storypointKey] || null;
}