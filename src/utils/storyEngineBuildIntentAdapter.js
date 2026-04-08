// src/utils/storyEngineBuildIntentAdapter.js

import {
  SOURCE_TYPE,
  createEmptyStoryEngineRecord,
} from './storyEngineSchema';

import {
  cloneStoryEngineRecord,
  createSourceEntry,
  registerSource,
  applyObservedFields,
  createAdminFieldMapFromConsultation,
  createAdminFieldMapFromQuestionnaire,
  runStoryEngine,
  uniq,
} from './storyEngineHelpers';

/* =========================================================
   SMALL HELPERS
   ========================================================= */

function cleanString(value = '') {
  if (value == null) return '';
  return String(value).trim();
}

function cleanLower(value = '') {
  return cleanString(value).toLowerCase();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  if (!value) return [];
  return [cleanString(value)].filter(Boolean);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return '';
}

function parseNumberLike(value) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return cleanString(value);
  return String(num);
}

function normalizeBooleanText(value, yesText = 'Yes', noText = 'No') {
  if (value === true) return yesText;
  if (value === false) return noText;
  return '';
}

function includesAny(value = '', terms = []) {
  const normalized = cleanLower(value);
  if (!normalized) return false;
  return terms.some((term) => normalized.includes(cleanLower(term)));
}

function normalizeArrayLike(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value)
    .split(/[,\n|;]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function includesAnyText(value, terms = []) {
  const haystack = normalizeArrayLike(value).join(' ').toLowerCase();
  if (!haystack) return false;

  return terms.some((term) =>
    haystack.includes(String(term).toLowerCase())
  );
}

/* =========================================================
   QUESTIONNAIRE NORMALIZATION
   ========================================================= */

export function normalizeQuestionnaireIntake(intake = {}) {
  const section = intake?.soundlegendVision || {};

  const buildClarity = cleanString(section.buildClarity);
  const primaryGoal = cleanString(section.primaryGoal);
  const tonalGoals = ensureArray(section.tonalGoals);
  const visualDirection = cleanString(section.visualDirection);
  const referenceNotes = cleanString(section.referenceNotes);
  const consultationContactMethod = cleanString(
    section.consultationContactMethod
  );
  const consultationDays = ensureArray(section.consultationDays);
  const consultationTimes = ensureArray(section.consultationTimes);

  return {
    buildClarity,
    primaryGoal,
    tonalGoals,
    visualDirection,
    referenceNotes,
    consultationContactMethod,
    consultationDays,
    consultationTimes,
  };
}

/* =========================================================
   QUESTIONNAIRE DERIVATION HELPERS
   ========================================================= */

function deriveStyleOfPlayingFromQuestionnaire(normalized = {}) {
  const goal = cleanLower(normalized.primaryGoal);
  const notes = cleanLower(normalized.referenceNotes);

  if (includesAny(goal, ['live-performance'])) return 'Live performance focused';
  if (includesAny(goal, ['studio', 'recording'])) return 'Studio focused';
  if (includesAny(goal, ['all-around', 'versatile'])) {
    return 'Versatile across multiple contexts';
  }

  if (includesAny(notes, ['ghost note', 'touch', 'dynamic'])) {
    return 'Dynamic and touch-sensitive playing';
  }

  return '';
}

function deriveDesiredOutcomeFromQuestionnaire(normalized = {}) {
  return firstNonEmpty(normalized.primaryGoal);
}

function deriveGenreContextFromQuestionnaire(normalized = {}) {
  return firstNonEmpty(normalized.referenceNotes);
}

function deriveInfluenceReferencesFromQuestionnaire(normalized = {}) {
  return firstNonEmpty(normalized.referenceNotes);
}

function deriveFinishDirectionFromQuestionnaire(normalized = {}) {
  return firstNonEmpty(normalized.visualDirection);
}

function deriveRecordingUseFromQuestionnaire(normalized = {}) {
  const combined = [
    normalized.primaryGoal,
    normalized.tonalGoals,
    normalized.referenceNotes,
  ].flatMap((item) => normalizeArrayLike(item));

  if (
    includesAnyText(combined, [
      'studio',
      'recording',
      'record',
      'session',
      'tracked',
      'tracking',
    ])
  ) {
    return 'Yes';
  }

  return '';
}

function deriveLiveUseFromQuestionnaire(normalized = {}) {
  const combined = [
    normalized.primaryGoal,
    normalized.tonalGoals,
    normalized.referenceNotes,
  ].flatMap((item) => normalizeArrayLike(item));

  if (
    includesAnyText(combined, [
      'live',
      'stage',
      'gig',
      'performance',
      'venue',
      'tour',
    ])
  ) {
    return 'Yes';
  }

  return '';
}

/* =========================================================
   MAPPERS: QUESTIONNAIRE -> ENGINE FIELDS
   ========================================================= */

export function deriveQuestionnaireFieldMap({
  submission = {},
  intake = {},
  project = {},
} = {}) {
  const normalized = normalizeQuestionnaireIntake(intake);

  const artistName = firstNonEmpty(
    submission.fullName,
    `${submission.firstName || ''} ${submission.lastName || ''}`.trim(),
    project.customerName,
    project.customer?.name
  );

  const styleOfPlaying = deriveStyleOfPlayingFromQuestionnaire(normalized);
  const desiredOutcome = deriveDesiredOutcomeFromQuestionnaire(normalized);
  const genreContext = deriveGenreContextFromQuestionnaire(normalized);
  const recordingUse = deriveRecordingUseFromQuestionnaire(normalized);
  const liveUse = deriveLiveUseFromQuestionnaire(normalized);
  const influenceReferences =
    deriveInfluenceReferencesFromQuestionnaire(normalized);
  const hardwareFinish = deriveHardwareFinishFromProject(project);
  const woodPreference = deriveWoodPreferenceFromProject(project);
  const finishDirection = deriveFinishDirectionFromQuestionnaire(normalized);

  return createAdminFieldMapFromQuestionnaire({
    artistName,
    styleOfPlaying,
    desiredOutcome,
    genreContext,
    recordingUse,
    liveUse,
    influenceReferences,
    hardwareFinish,
    woodPreference,
    finishDirection,
  });
}

/* =========================================================
   MAPPERS: CONSULT / PROJECT / ADMIN -> ENGINE FIELDS
   ========================================================= */

export function deriveConsultationFieldMap({
  submission = {},
  intake = {},
  project = {},
  adminNotes = {},
} = {}) {
  const normalized = normalizeQuestionnaireIntake(intake);

  const artistName = firstNonEmpty(
    submission.fullName,
    `${submission.firstName || ''} ${submission.lastName || ''}`.trim(),
    project.customerName,
    project.customer?.name
  );

  const projectName = firstNonEmpty(
    project.projectName,
    project.title,
    project.name,
    project.lineSerial
  );

  const primaryUseCase = derivePrimaryUseCase({
    normalized,
    project,
    adminNotes,
  });

  const styleOfPlaying = deriveStyleOfPlaying({
    normalized,
    project,
    adminNotes,
  });

  const diameter = firstNonEmpty(
    parseNumberLike(project.diameter),
    parseNumberLike(project.width)
  );

  const depth = firstNonEmpty(
    parseNumberLike(project.depth),
    parseNumberLike(project.shellDepth)
  );

  const genreContext = deriveGenreContext({
    normalized,
    adminNotes,
  });

  const desiredOutcome = deriveDesiredOutcome({
    normalized,
    adminNotes,
  });

  const currentPainPoints = deriveCurrentPainPoints({
    normalized,
    submission,
    adminNotes,
  });

  const influenceReferences = deriveInfluenceReferences({
    normalized,
    submission,
    adminNotes,
  });

  const visualMood = deriveVisualMood({
    normalized,
    project,
    adminNotes,
  });

  const finishDirection = deriveFinishDirection({
    normalized,
    project,
    adminNotes,
  });

  const woodPreference = deriveWoodPreference({
    normalized,
    project,
    adminNotes,
  });

  const sonicIntent = deriveSonicIntent({
    normalized,
    project,
    adminNotes,
  });

  return createAdminFieldMapFromConsultation({
    artistName,
    projectName,
    primaryUseCase,
    styleOfPlaying,
    diameter,
    depth,
    genreContext,
    desiredOutcome,
    currentPainPoints,
    influenceReferences,
    visualMood,
    finishDirection,
    woodPreference,
    attack: sonicIntent.attack,
    body: sonicIntent.body,
    sensitivity: sonicIntent.sensitivity,
    sustain: sonicIntent.sustain,
    projection: sonicIntent.projection,
    tuningRange: sonicIntent.tuningRange,
    articulation: sonicIntent.articulation,
    feel: sonicIntent.feel,
  });
}

/* =========================================================
   DIRECT BUILD SPEC MAP
   ========================================================= */

export function deriveProjectBuildSpecFieldMap(project = {}) {
  return {
    'buildSpec.shellConstruction': firstNonEmpty(
      project.shellConstruction,
      project.approvedCustomerScope?.shellConstructionName,
      project.adminBuildRecommendation?.shellConstruction
    ),
    'buildSpec.primaryWood': firstNonEmpty(
      project.primarySpecies,
      project.approvedCustomerScope?.primarySpecies,
      project.adminBuildRecommendation?.primarySpecies
    ),
    'buildSpec.secondaryWood': firstNonEmpty(
      project.secondarySpecies,
      project.approvedCustomerScope?.secondarySpecies,
      project.adminBuildRecommendation?.secondarySpecies
    ),
    'buildSpec.shellThicknessStrategy': firstNonEmpty(
      project.shellThicknessStrategy
    ),
    'buildSpec.reinforcementRings': firstNonEmpty(
      normalizeBooleanText(
        project.reinforcementRings,
        'Reinforcement rings included',
        'No reinforcement rings'
      ),
      project.approvedCustomerScope?.reinforcementRings,
      project.adminBuildRecommendation?.reinforcementRings
    ),
    'buildSpec.bearingEdge': firstNonEmpty(
      project.bearingEdge,
      project.approvedCustomerScope?.bearingEdge,
      project.adminBuildRecommendation?.bearingEdges
    ),
    'buildSpec.snareBed': firstNonEmpty(
      project.snareBedDepth,
      project.approvedCustomerScope?.snareBedDepth,
      project.adminBuildRecommendation?.snareBedDepth
    ),
    'buildSpec.hoopType': firstNonEmpty(
      project.hoops,
      project.approvedCustomerScope?.hoops,
      project.adminBuildRecommendation?.hoops
    ),
    'buildSpec.lugType': firstNonEmpty(
      project.lugType,
      project.approvedCustomerScope?.lugType,
      project.adminBuildRecommendation?.lugType
    ),
    'buildSpec.lugCount': firstNonEmpty(
      project.lugCount,
      project.approvedCustomerScope?.staveCount,
      project.adminBuildRecommendation?.staveCount
    ),
    'buildSpec.headPairingDirection': firstNonEmpty(project.headPairingDirection),
    'buildSpec.wireDirection': firstNonEmpty(
      project.snareWires,
      project.approvedCustomerScope?.snareWires,
      project.adminBuildRecommendation?.snareWires
    ),
    'buildSpec.finishSystem': firstNonEmpty(
      project.finishDetails,
      project.approvedCustomerScope?.exteriorFinish,
      project.adminBuildRecommendation?.exteriorFinish
    ),
    'buildSpec.tuningApproach': firstNonEmpty(
      project.tuningApproach,
      project.adminBuildRecommendation?.summary
    ),
  };
}

/* =========================================================
   PUBLIC ADAPTER API
   ========================================================= */

export function buildStoryEngineFromSources({
  existingRecord = null,
  submission = {},
  questionnaireDoc = {},
  project = {},
  adminNotes = {},
  createdBy = 'story_engine_adapter',
} = {}) {
  let record = cloneStoryEngineRecord(
    existingRecord || createEmptyStoryEngineRecord()
  );

  const intake =
    questionnaireDoc?.consultationIntake ||
    submission?.consultationIntake ||
    buildEmptyIntake();

  const questionnaireSource = createSourceEntry({
    id: questionnaireDoc?.id
      ? `questionnaire_${questionnaireDoc.id}`
      : `questionnaire_${Date.now()}`,
    type: SOURCE_TYPE.QUESTIONNAIRE,
    label: 'SoundLegend questionnaire',
    content: JSON.stringify(normalizeQuestionnaireIntake(intake)),
    createdAt:
      questionnaireDoc?.questionnaireCompletedAt ||
      questionnaireDoc?.consultationIntakeUpdatedAt ||
      questionnaireDoc?.updatedAt ||
      null,
    createdBy,
    meta: {
      questionnaireId: questionnaireDoc?.id || '',
      submissionId: submission?.id || '',
    },
  });

  const consultationSource = createSourceEntry({
    id: submission?.id
      ? `consultation_${submission.id}`
      : `consultation_${Date.now()}`,
    type: SOURCE_TYPE.CONSULTATION,
    label: 'SoundLegend consultation context',
    content: JSON.stringify({
      firstName: submission?.firstName || '',
      lastName: submission?.lastName || '',
      fullName: submission?.fullName || '',
      artistBio: submission?.artistBio || '',
      inspiration: submission?.inspiration || '',
      email: submission?.email || '',
    }),
    createdAt: submission?.submittedAt || submission?.updatedAt || null,
    createdBy,
    meta: {
      submissionId: submission?.id || '',
      projectId: project?.id || '',
    },
  });

  record = registerSource(record, questionnaireSource);
  record = registerSource(record, consultationSource);

  const questionnaireFieldMap = deriveQuestionnaireFieldMap({
    submission,
    intake,
    project,
  });

  const consultationFieldMap = deriveConsultationFieldMap({
    submission,
    intake,
    project,
    adminNotes,
  });

  const buildSpecFieldMap = deriveProjectBuildSpecFieldMap(project);

  record = applyObservedFields(record, questionnaireFieldMap, questionnaireSource);
  record = applyObservedFields(record, consultationFieldMap, consultationSource);

  if (Object.values(buildSpecFieldMap).some((value) => cleanString(value))) {
    const buildSpecSource = createSourceEntry({
      id: project?.id ? `project_${project.id}` : `project_${Date.now()}`,
      type: SOURCE_TYPE.ADMIN_NOTE,
      label: 'Project build spec',
      content: JSON.stringify(buildSpecFieldMap),
      createdAt: project?.updatedAt || null,
      createdBy,
      meta: {
        projectId: project?.id || '',
      },
    });

    record = registerSource(record, buildSpecSource);
    record = applyObservedFields(record, buildSpecFieldMap, buildSpecSource);
  }

  record.projectId = project?.id || record.projectId || null;
  record.artistId =
    submission?.linkedUserId ||
    project?.ownerUid ||
    record.artistId ||
    null;

  return runStoryEngine(record, {
    applyRecommendationInference: true,
    applyRecommendationsToMissing: true,
  });
}

/* =========================================================
   EMPTY INTAKE
   ========================================================= */

export function buildEmptyIntake() {
  return {
    soundlegendVision: {
      buildClarity: '',
      primaryGoal: '',
      tonalGoals: [],
      visualDirection: '',
      referenceNotes: '',
      consultationContactMethod: '',
      consultationDays: [],
      consultationTimes: [],
    },
  };
}

/* =========================================================
   DERIVATION HELPERS
   ========================================================= */

function derivePrimaryUseCase({ normalized, project, adminNotes }) {
  return firstNonEmpty(
    adminNotes.primaryUseCase,
    project.primaryUseCase,
    normalized.primaryGoal
  );
}

function deriveStyleOfPlaying({ normalized, project, adminNotes }) {
  return firstNonEmpty(
    adminNotes.styleOfPlaying,
    project.styleOfPlaying,
    deriveStyleOfPlayingFromQuestionnaire(normalized)
  );
}

function deriveGenreContext({ normalized, adminNotes }) {
  return firstNonEmpty(
    adminNotes.genreContext,
    deriveGenreContextFromQuestionnaire(normalized)
  );
}

function deriveDesiredOutcome({ normalized, adminNotes }) {
  return firstNonEmpty(
    adminNotes.desiredOutcome,
    deriveDesiredOutcomeFromQuestionnaire(normalized)
  );
}

function deriveCurrentPainPoints({ submission, adminNotes }) {
  return firstNonEmpty(
    adminNotes.currentPainPoints,
    submission.currentPainPoints,
    ''
  );
}

function deriveInfluenceReferences({ normalized, submission, adminNotes }) {
  return firstNonEmpty(
    adminNotes.influenceReferences,
    submission.inspiration,
    deriveInfluenceReferencesFromQuestionnaire(normalized)
  );
}

function deriveVisualMood({ normalized, project, adminNotes }) {
  return firstNonEmpty(
    adminNotes.visualMood,
    project.visualMood,
    normalized.visualDirection
  );
}

function deriveFinishDirection({ normalized, project, adminNotes }) {
  return firstNonEmpty(
    adminNotes.finishDirection,
    project.finishDetails,
    normalized.visualDirection
  );
}

function deriveWoodPreference({ project, adminNotes }) {
  return firstNonEmpty(
    adminNotes.woodPreference,
    project.primarySpecies,
    project.approvedCustomerScope?.primarySpecies,
    ''
  );
}

function deriveWoodPreferenceFromProject(project = {}) {
  return firstNonEmpty(
    project.primarySpecies,
    project.approvedCustomerScope?.primarySpecies,
    project.adminBuildRecommendation?.primarySpecies
  );
}

function deriveHardwareFinishFromProject(project = {}) {
  return firstNonEmpty(
    project.hardwareColor,
    project.hardwareFinish,
    project.approvedCustomerScope?.hardwareFinish
  );
}

function deriveSonicIntent({ normalized, project, adminNotes }) {
  const tonalGoals = ensureArray(normalized.tonalGoals).map((item) =>
    cleanLower(item)
  );

  const joinedGoals = tonalGoals.join(' | ');
  const notes = cleanLower(normalized.referenceNotes);

  const adminAttack = cleanString(adminNotes.attack);
  const adminBody = cleanString(adminNotes.body);
  const adminSensitivity = cleanString(adminNotes.sensitivity);
  const adminSustain = cleanString(adminNotes.sustain);
  const adminProjection = cleanString(adminNotes.projection);
  const adminTuningRange = cleanString(adminNotes.tuningRange);
  const adminArticulation = cleanString(adminNotes.articulation);
  const adminFeel = cleanString(adminNotes.feel);

  return {
    attack:
      adminAttack ||
      deriveAttack(joinedGoals, notes) ||
      cleanString(project.attack),
    body:
      adminBody ||
      deriveBody(joinedGoals, notes) ||
      cleanString(project.body),
    sensitivity:
      adminSensitivity ||
      deriveSensitivity(joinedGoals, notes) ||
      cleanString(project.sensitivity),
    sustain:
      adminSustain ||
      deriveSustain(joinedGoals, notes) ||
      cleanString(project.sustain),
    projection:
      adminProjection ||
      deriveProjection(joinedGoals, notes, normalized.primaryGoal) ||
      cleanString(project.projection),
    tuningRange:
      adminTuningRange ||
      deriveTuningRange(joinedGoals, normalized.primaryGoal) ||
      cleanString(project.tuningRange),
    articulation:
      adminArticulation ||
      deriveArticulation(joinedGoals, notes) ||
      cleanString(project.articulation),
    feel:
      adminFeel ||
      deriveFeel(joinedGoals, notes, normalized.primaryGoal) ||
      cleanString(project.feel),
  };
}

function deriveAttack(goals = '', notes = '') {
  if (includesAny(goals, ['crisp', 'bright / cutting', 'punchy'])) {
    return 'Clear, immediate attack';
  }
  if (includesAny(notes, ['crack', 'cut'])) {
    return 'Pronounced attack';
  }
  return '';
}

function deriveBody(goals = '', notes = '') {
  if (includesAny(goals, ['fat / full', 'warm', 'dark'])) {
    return 'Strong body and tonal weight';
  }
  if (includesAny(notes, ['fat', 'thick', 'full'])) {
    return 'Full-bodied voice';
  }
  return '';
}

function deriveSensitivity(goals = '', notes = '') {
  if (includesAny(goals, ['sensitive / ghost-note friendly'])) {
    return 'High sensitivity and low-dynamic response';
  }
  if (includesAny(notes, ['ghost', 'touch', 'sensitive'])) {
    return 'Touch-sensitive response';
  }
  return '';
}

function deriveSustain(goals = '', notes = '') {
  if (includesAny(goals, ['open / resonant'])) {
    return 'Longer, more open sustain';
  }
  if (includesAny(goals, ['dry / controlled'])) {
    return 'Shorter, more controlled decay';
  }
  if (includesAny(notes, ['dry'])) {
    return 'Controlled sustain';
  }
  return '';
}

function deriveProjection(goals = '', notes = '', primaryGoal = '') {
  const goal = cleanLower(primaryGoal);

  if (includesAny(goals, ['bright / cutting', 'punchy'])) {
    return 'Strong projection with presence';
  }
  if (includesAny(goal, ['live-performance'])) {
    return 'Stage-capable projection';
  }
  if (includesAny(notes, ['cut', 'project', 'loud'])) {
    return 'Forward projection';
  }
  return '';
}

function deriveTuningRange(goals = '', primaryGoal = '') {
  const goal = cleanLower(primaryGoal);

  if (includesAny(goal, ['versatile', 'all-around'])) {
    return 'Broad, usable tuning range';
  }

  if (includesAny(goals, ['balanced / versatile'])) {
    return 'Broad, flexible tuning window';
  }

  if (includesAny(goals, ['fat / full', 'dark'])) {
    return 'Comfortable in lower-to-medium tunings';
  }

  if (includesAny(goals, ['crisp', 'bright / cutting'])) {
    return 'Comfortable in medium-to-higher tunings';
  }

  return '';
}

function deriveArticulation(goals = '', notes = '') {
  if (includesAny(goals, ['crisp', 'balanced / versatile', 'punchy'])) {
    return 'Defined articulation with clean note shape';
  }
  if (includesAny(notes, ['articulate', 'defined', 'clear'])) {
    return 'Clear articulation';
  }
  return '';
}

function deriveFeel(goals = '', notes = '', primaryGoal = '') {
  const goal = cleanLower(primaryGoal);

  if (includesAny(goals, ['dry / controlled'])) {
    return 'Controlled and composed under the stick';
  }
  if (includesAny(goals, ['open / resonant'])) {
    return 'Alive and expressive under the stick';
  }
  if (includesAny(goal, ['statement / legacy piece'])) {
    return 'Intentional, authored, and character-rich';
  }
  if (includesAny(notes, ['easy', 'comfortable', 'responsive'])) {
    return 'Responsive and confidence-inspiring';
  }
  return '';
}