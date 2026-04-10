import React, { useEffect, useMemo, useState } from 'react';
import './CraftsmanMasterToolSection.css';

const val = (...values) =>
  values.find((v) => v !== undefined && v !== null && v !== '') ?? '';

const safeText = (value, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const safeArray = (value) => (Array.isArray(value) ? value : []);

const splitList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const getArtistName = (projectData = {}, storyEngineData = {}) =>
  val(
    storyEngineData?.consultationMapped?.artistName,
    storyEngineData?.questionnaireMapped?.artistName,
    projectData?.customerName,
    projectData?.customer?.name
  ) || 'Artist';

const getCurrentPhaseLabel = (editableData = {}) => {
  const phases = [
    { key: 'discoveryDesign', label: '1. Discovery & Design' },
    { key: 'commitmentPortal', label: '2. Commitment & Portal Setup' },
    { key: 'woodVisionLockIn', label: '3. Wood & Vision Lock-In' },
    { key: 'rawShellCreation', label: '4. Raw Shell Creation' },
    { key: 'shellTrueingTorchTune', label: '5. Shell Trueing & Torch Tune' },
    { key: 'exteriorArtFinish', label: '6. Exterior Art & Finish' },
    { key: 'edgesSnareBeds', label: '7. Edges & Snare Beds' },
    { key: 'hardwareAssembly', label: '8. Hardware & Assembly' },
    { key: 'legacyTuningMedia', label: '9. Legacy Tuning & Media' },
    {
      key: 'finalQAPackagingDelivery',
      label: '10. Final QA, Packaging & Delivery',
    },
  ];

  for (const phase of phases) {
    const checklist = Array.isArray(editableData?.[phase.key]?.checklist)
      ? editableData[phase.key].checklist
      : [];

    if (!checklist.length) return phase.label;

    const allDone = checklist.every((item) => {
      const states = Array.isArray(item?.checkpointStates)
        ? item.checkpointStates
        : [];
      const checkpointsDone = states.length > 0 && states.every(Boolean);
      return !!item?.completed || checkpointsDone;
    });

    if (!allDone) return phase.label;
  }

  return 'Completed';
};

const getProjectStatus = (editableData = {}) => {
  const allChecklistItems = [
    'discoveryDesign',
    'commitmentPortal',
    'woodVisionLockIn',
    'rawShellCreation',
    'shellTrueingTorchTune',
    'exteriorArtFinish',
    'edgesSnareBeds',
    'hardwareAssembly',
    'legacyTuningMedia',
    'finalQAPackagingDelivery',
  ].flatMap((key) =>
    Array.isArray(editableData?.[key]?.checklist)
      ? editableData[key].checklist
      : []
  );

  if (!allChecklistItems.length) return 'Initial Planning';

  const completedCount = allChecklistItems.filter((item) => {
    const states = Array.isArray(item?.checkpointStates)
      ? item.checkpointStates
      : [];
    const checkpointsDone = states.length > 0 && states.every(Boolean);
    return !!item?.completed || checkpointsDone;
  }).length;

  if (completedCount === 0) return 'Initial Planning';
  if (completedCount === allChecklistItems.length) return 'Finished';
  return 'In Production';
};

const DEFAULT_TOOL_DATA = {
  decisions: {},
  history: [],
  customDraft: '',
  currentSelection: '',
  lastUpdatedAt: null,
};

const DECISION_FLOW = [
  {
    id: 'decisionPathLogic',
    question: 'Which decision path logic should guide this build first?',
    subtitle:
      'Start by choosing the lens this tool should use. That keeps every later recommendation anchored to the same decision path instead of drifting between different kinds of logic.',
    nextLabel: 'What should this build protect first?',
  },
  {
    id: 'protectFirst',
    question: 'What should this build protect first?',
    subtitle:
      'Start with the strongest real requirement before making material decisions.',
    nextLabel: 'How firm is the size direction right now?',
  },
  {
    id: 'sizeDirectionConfidence',
    question: 'How firm is the size direction right now?',
    subtitle:
      'A 12" note is present, but the tool should decide whether that is a lock or just an early signal.',
    nextLabel: 'Which shell construction path best supports that requirement?',
  },
  {
    id: 'shellConstruction',
    question: 'Which shell construction path looks strongest right now?',
    subtitle:
      'This should follow the response target and use case, not just what sounds exciting.',
    nextLabel: 'What primary wood direction looks strongest right now?',
  },
  {
    id: 'primaryWood',
    question: 'What primary wood direction looks strongest right now?',
    subtitle:
      'Wood should follow the response target, shell format, and size direction already chosen.',
    nextLabel: 'How committed should we be to brass / gold hardware?',
  },
  {
    id: 'hardwareFinishCommitment',
    question: 'How committed should we be to brass / gold hardware?',
    subtitle:
      'The questionnaire shows a preference. This step decides whether it is a lock, a lean, or still open.',
    nextLabel: 'What finish direction should stay in play next?',
  },
  {
    id: 'finishDirection',
    question: 'What finish direction should stay in play next?',
    subtitle:
      'Because visual direction is still open, this should stay broad and useful rather than overly specific.',
    nextLabel: 'What hoop type makes the most sense?',
  },
  {
    id: 'hoopTypeDirection',
    question: 'What hoop type makes the most sense?',
    subtitle:
      'Hoop selection should be decided here as part of the build-direction logic, not deferred to Story Studio.',
    nextLabel: 'What bearing-edge family best fits the early target?',
  },
  {
    id: 'bearingEdgeDirection',
    question: 'What bearing-edge family best fits the early target?',
    subtitle:
      'Edge direction should support sensitivity and low-volume response before anything else.',
    nextLabel: 'What tuning behavior should this build favor?',
  },
  {
    id: 'tuningApproach',
    question: 'What tuning behavior should this build favor?',
    subtitle:
      'This should translate the player’s use case into a practical setup direction.',
    nextLabel: 'What lug-count direction makes the most sense?',
  },
  {
    id: 'lugCountDirection',
    question: 'What lug-count direction makes the most sense?',
    subtitle:
      'This should follow shell size, tuning flexibility, and how controlled the response should feel.',
    nextLabel: 'Core discovery direction is now tracked.',
  },
];

const DECISION_DEPENDENCIES = {
  decisionPathLogic: [],
  protectFirst: ['decisionPathLogic'],
  sizeDirectionConfidence: ['decisionPathLogic', 'protectFirst'],
  shellConstruction: [
    'decisionPathLogic',
    'protectFirst',
    'sizeDirectionConfidence',
  ],
  primaryWood: [
    'decisionPathLogic',
    'protectFirst',
    'sizeDirectionConfidence',
    'shellConstruction',
  ],
  hardwareFinishCommitment: ['decisionPathLogic', 'primaryWood'],
  finishDirection: [
    'decisionPathLogic',
    'primaryWood',
    'hardwareFinishCommitment',
  ],
  hoopTypeDirection: [
    'decisionPathLogic',
    'sizeDirectionConfidence',
    'shellConstruction',
    'finishDirection',
  ],
  bearingEdgeDirection: [
    'decisionPathLogic',
    'protectFirst',
    'shellConstruction',
    'primaryWood',
    'hoopTypeDirection',
  ],
  tuningApproach: [
    'decisionPathLogic',
    'protectFirst',
    'sizeDirectionConfidence',
    'shellConstruction',
    'hoopTypeDirection',
  ],
  lugCountDirection: [
    'decisionPathLogic',
    'sizeDirectionConfidence',
    'tuningApproach',
    'hoopTypeDirection',
  ],
};

const CRAFTSMAN_TO_BUILD_SPEC_KEY = {
  shellConstruction: 'shellConstruction',
  primaryWood: 'primaryWood',
  hardwareFinishCommitment: 'hardwareFinish',
  finishDirection: 'finishSystem',
  hoopTypeDirection: 'hoopType',
  bearingEdgeDirection: 'bearingEdge',
  tuningApproach: 'tuningApproach',
  lugCountDirection: 'lugCount',
};

const getRawQuestionnairePayload = (projectData = {}, storyEngineData = {}) => {
  if (projectData?.consultationIntake) {
    return projectData.consultationIntake;
  }

  const raw = storyEngineData?.questionnaireRaw;

  if (raw && typeof raw === 'object') return raw;

  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return {};
};

const getQuestionnaireSnapshot = (storyEngineData = {}, projectData = {}) => {
  const q = storyEngineData?.questionnaireMapped || {};
  const consultation = storyEngineData?.consultationMapped || {};
  const raw = getRawQuestionnairePayload(projectData, storyEngineData);

  const playingWorld = raw?.playingWorld || {};
  const soundGoals = raw?.soundGoals || {};
  const buildDirection = raw?.buildDirection || {};
  const consultPrep = raw?.consultPrep || {};

  return {
    playerProfile: val(
      q.styleOfPlaying,
      playingWorld?.playerProfile,
      consultation.styleOfPlaying,
      ''
    ),
    playSettings: safeArray(
      splitList(q.influenceReferences).length
        ? splitList(q.influenceReferences)
        : playingWorld?.playSettings
    ),
    genres: safeArray(
      splitList(q.genreContext).length
        ? splitList(q.genreContext)
        : playingWorld?.genres
    ),
    primaryGoal: val(
      q.desiredOutcome,
      soundGoals?.primaryGoal,
      consultation.desiredOutcome,
      ''
    ),
    responsePriorities: safeArray(
      splitList(val(q.responsePriorities, consultation.responsePriorities))
        .length
        ? splitList(val(q.responsePriorities, consultation.responsePriorities))
        : soundGoals?.responsePriorities
    ),
    tonalGoals: safeArray(
      splitList(val(q.tonalGoals, consultation.tonalGoals)).length
        ? splitList(val(q.tonalGoals, consultation.tonalGoals))
        : soundGoals?.tonalGoals
    ),
    preferredSizeDirection: val(
      q.preferredSizeDirection,
      buildDirection?.preferredSizeDirection,
      consultation.preferredSizeDirection,
      consultation.diameter,
      ''
    ),
    hardwareFinishPreference: val(
      q.hardwareFinish,
      buildDirection?.hardwareFinishPreference,
      consultation.hardwareFinish,
      ''
    ),
    shellDirectionsOpenTo: safeArray(
      splitList(val(q.woodPreference, consultation.woodPreference)).length
        ? splitList(val(q.woodPreference, consultation.woodPreference))
        : buildDirection?.shellDirectionsOpenTo
    ),
    buildClarity: val(buildDirection?.buildClarity, ''),
    consultationContactMethod: val(
      q.consultationContactMethod,
      consultPrep?.consultationContactMethod,
      ''
    ),
    primaryUseCase: val(consultation.primaryUseCase, ''),
    currentPainPoints: val(consultation.currentPainPoints, ''),
  };
};

const getAllDependentDecisionIds = (sourceStepId) => {
  const found = new Set();

  const visit = (stepId) => {
    Object.entries(DECISION_DEPENDENCIES).forEach(([candidateId, deps]) => {
      if (deps.includes(stepId) && !found.has(candidateId)) {
        found.add(candidateId);
        visit(candidateId);
      }
    });
  };

  visit(sourceStepId);
  return [...found];
};

const buildRecommendationsForStep = (stepId, snapshot, decisions = {}) => {
  const responsePriorities = snapshot.responsePriorities.map(normalize);
  const shellDirections = snapshot.shellDirectionsOpenTo.map(normalize);
  const tonalGoals = snapshot.tonalGoals.map(normalize);
  const sizeDirection = String(snapshot.preferredSizeDirection || '');
  const hardwareFinish = String(snapshot.hardwareFinishPreference || '');
  const playerProfile = String(snapshot.playerProfile || '');
  const primaryGoal = String(snapshot.primaryGoal || '');
  const primaryUseCase = String(snapshot.primaryUseCase || '');
  const selectedLogicPath = normalize(
    decisions?.decisionPathLogic?.value || ''
  );

  const includesFastLowVolume = responsePriorities.some((item) =>
    item.includes('fast response at low volume')
  );
  const includesTrustRecommendation = shellDirections.some((item) =>
    item.includes('trust your recommendation')
  );
  const includesRecording =
    normalize(playerProfile).includes('recording') ||
    normalize(primaryUseCase).includes('studio');
  const sizeIs12 = sizeDirection.includes('12');
  const brassPreferred = normalize(hardwareFinish).includes('brass');

  const logicIsRequirementFirst =
    selectedLogicPath.includes('protect the player');
  const logicIsConsultationFirst = selectedLogicPath.includes(
    'keep multiple paths open'
  );
  const logicIsStudioFirst = selectedLogicPath.includes('studio-first');
  const logicIsSizeLed = selectedLogicPath.includes('size-led');

  const recommendationSets = {
    decisionPathLogic: [
      {
        value: 'Protect the player’s stated requirement first',
        confidence: includesFastLowVolume ? 94 : 86,
        why: [
          'The intake already names a clear response target.',
          'That gives the tool a stable anchor before it starts making shell and material choices.',
          'This is the safest default path when one real performance need is already visible.',
        ],
        evidence: [
          includesFastLowVolume
            ? 'responsePriorities: Fast response at low volume'
            : 'A concrete response priority is starting to emerge',
          `primaryGoal: ${safeText(primaryGoal)}`,
          `playerProfile / useCase: ${safeText(playerProfile)} / ${safeText(primaryUseCase)}`,
        ],
        uncertainty: [
          'A later consultation could still elevate a different priority above the current one.',
        ],
      },
      {
        value:
          'Keep multiple paths open until consultation pressure-tests them',
        confidence: 78,
        why: [
          'This is useful when the intake is real but still incomplete.',
          'It prevents the tool from pretending the direction is more settled than it is.',
        ],
        evidence: [
          tonalGoals.length
            ? `Tonal goals remain broad: ${tonalGoals.join(', ')}`
            : 'No fully locked tonal language yet',
          `buildClarity: ${safeText(snapshot.buildClarity, 'Not stated')}`,
        ],
        uncertainty: [
          'Too much openness can make the next decisions feel vague if a strong requirement already exists.',
        ],
      },
      {
        value: 'Use a studio-first logic path',
        confidence: includesRecording ? 81 : 63,
        why: [
          'Recording context can legitimately shape the build logic early.',
          'This path works best when articulation, controllability, and mic behavior matter most.',
        ],
        evidence: [
          includesRecording
            ? 'playerProfile / primaryUseCase points toward recording or studio use'
            : 'Studio signal exists but is not dominant yet',
          `playSettings: ${safeText(snapshot.playSettings.join(', '))}`,
        ],
        uncertainty: [
          'This can over-bias the tool if the drum is really meant to be broader than studio-first.',
        ],
      },
      {
        value: 'Use a size-led logic path',
        confidence: sizeIs12 ? 72 : 56,
        why: [
          'This path treats shell size as the strongest early organizing rule.',
          'It can be useful when size is already a true lock and many later choices need to follow it.',
        ],
        evidence: [
          `preferredSizeDirection: ${safeText(sizeDirection, 'Not stated')}`,
          sizeIs12
            ? 'A 12" direction is already on the board'
            : 'No hard size lock yet',
        ],
        uncertainty: [
          'This is weaker if the size direction is still only a lean rather than a commitment.',
        ],
      },
      {
        value: 'Use a custom / hybrid logic path',
        confidence: 51,
        why: [
          'This leaves room for the builder to use a more bespoke reasoning chain.',
          'It makes sense when the intake does not fit one clean decision lens.',
        ],
        evidence: [
          'Some projects need the builder to blend requirement, feel, and visual logic rather than follow one lane.',
        ],
        uncertainty: [
          'A custom path only helps if the builder explicitly explains why it is the right lens.',
        ],
      },
    ],
    protectFirst: [
      {
        value: 'Fast low-volume response',
        confidence: includesFastLowVolume && logicIsRequirementFirst ? 94 : 91,
        why: [
          'This is the clearest direct performance requirement stated so far.',
          'It should guide construction and size decisions before visual choices.',
          'It fits the studio + home-use signal especially well.',
        ],
        evidence: [
          'responsePriorities: Fast response at low volume',
          `playerProfile / primaryUseCase: ${safeText(playerProfile)} / ${safeText(primaryUseCase)}`,
          sizeIs12 ? 'preferredSizeDirection: 12"' : 'No strong size lock yet',
        ],
        uncertainty: [
          'No tonal adjectives are firm yet.',
          'Build clarity suggests guidance is still needed.',
        ],
      },
      {
        value: 'Studio-friendly articulation',
        confidence: includesRecording || logicIsStudioFirst ? 84 : 82,
        why: [
          'Recording use is a strong signal.',
          'A studio-first lens can help narrow size, construction, and wood logically.',
          'This remains very compatible with a main-snare goal.',
        ],
        evidence: [
          `playerProfile: ${safeText(playerProfile)}`,
          includesRecording
            ? 'Primary use points toward studio'
            : 'Studio signal is moderate',
          'A signature main snare still needs broad usefulness',
        ],
        uncertainty: [
          'This is slightly more inferred than the low-volume response goal.',
        ],
      },
      {
        value: 'Compact 12" versatility',
        confidence: logicIsSizeLed ? 79 : 74,
        why: [
          'A 12" direction is already present.',
          'If real, it meaningfully changes shell and tuning decisions.',
        ],
        evidence: [
          `preferredSizeDirection: ${safeText(sizeDirection, 'Not stated')}`,
          `primaryGoal: ${safeText(primaryGoal)}`,
        ],
        uncertainty: [
          'This should not lead unless the 12" direction is truly firm.',
        ],
      },
    ],
    sizeDirectionConfidence: [
      {
        value: '12" is a real lean, not a hard lock yet',
        confidence: logicIsConsultationFirst ? 92 : 89,
        why: [
          'The questionnaire gives a size direction, but build clarity still asks for guidance.',
          'That usually means respect the signal without overcommitting too early.',
        ],
        evidence: [
          `preferredSizeDirection: ${safeText(sizeDirection, 'Not stated')}`,
          'buildClarity: I have a rough idea, but want guidance',
        ],
        uncertainty: [
          'A consultation could still move this toward 13" or 14".',
        ],
      },
      {
        value: 'Treat 12" as the working direction',
        confidence: logicIsSizeLed ? 84 : 79,
        why: [
          'It is the only explicit size currently stated.',
          'The tool needs a working size assumption to score later decisions.',
        ],
        evidence: [
          'Only current size signal is 12"',
          'Fast-response goal fits smaller shells',
        ],
        uncertainty: [
          'This may be too aggressive without consultation follow-up.',
        ],
      },
      {
        value: 'Keep size open until consultation',
        confidence: logicIsConsultationFirst ? 74 : 68,
        why: [
          'The player asked for guidance.',
          'Main-snare usage can sometimes widen the ideal size range.',
        ],
        evidence: [
          'No tonal goal is firmly named yet',
          `Primary goal: ${safeText(primaryGoal)}`,
        ],
        uncertainty: [
          'This delays useful narrowing if the 12" signal is genuine.',
        ],
      },
    ],
    shellConstruction: [
      {
        value: 'Stave',
        confidence: includesFastLowVolume && sizeIs12 ? 88 : 81,
        why: [
          'It is the cleanest default direction when the player wants a personal main instrument with strong response.',
          'It keeps the build custom without forcing hybrid complexity too early.',
        ],
        evidence: [
          includesFastLowVolume
            ? 'Fast low-volume response is active'
            : 'Response priority remains moderately controlled',
          includesTrustRecommendation
            ? 'Shell direction is open to builder recommendation'
            : `Shell direction notes: ${safeText(
                snapshot.shellDirectionsOpenTo.join(', '),
                'Open'
              )}`,
        ],
        uncertainty: [
          'Still worth revisiting if the consultation points toward a more blended feel.',
        ],
      },
      {
        value: 'Keep construction open between stave and hybrid',
        confidence: logicIsConsultationFirst ? 82 : 77,
        why: [
          'That preserves flexibility while discovery is still light.',
          'Useful when no tonal goal is firmly locked yet.',
        ],
        evidence: [
          'Build clarity still requests guidance',
          tonalGoals.length
            ? `Tonal goals are still broad: ${tonalGoals.join(', ')}`
            : 'No firm tonal language yet',
        ],
        uncertainty: ['This is safe, but less decisive.'],
      },
      {
        value: 'Feuzon / hybrid direction',
        confidence: 63,
        why: [
          'Could become interesting if the player wants nuance across studio and live use.',
          'May support a more layered response profile.',
        ],
        evidence: [
          includesRecording
            ? 'Recording use could justify nuance'
            : 'Recording case is moderate',
          `Genres: ${safeText(snapshot.genres.join(', '), 'Not enough yet')}`,
        ],
        uncertainty: ['There is not enough evidence yet to lead with hybrid.'],
      },
    ],
    primaryWood: [
      {
        value: 'Maple',
        confidence: 87,
        why: [
          'It is the strongest general-purpose starting point for a responsive main snare.',
          'It gives the widest safe range while other decisions are still forming.',
        ],
        evidence: [
          'Main-snare role favors versatility',
          includesRecording
            ? 'Recording use rewards a balanced baseline'
            : 'Use case still broad',
          includesFastLowVolume
            ? 'Fast-response goal can still be built around maple'
            : 'Response target remains open enough',
        ],
        uncertainty: [
          'Consultation may reveal a stronger artistic reason for another species.',
        ],
      },
      {
        value: 'Birch',
        confidence: 73,
        why: [
          'Could support quick articulation and studio clarity.',
          'Works if the project truly leans compact and direct.',
        ],
        evidence: [
          includesRecording
            ? 'Studio / recording signal is strong'
            : 'Studio use is not fully locked',
          sizeIs12
            ? '12" lean can support a tighter voice'
            : 'Size direction is still somewhat open',
        ],
        uncertainty: [
          'May narrow the personality too early for a signature main snare.',
        ],
      },
      {
        value: 'Walnut',
        confidence: 64,
        why: [
          'Worth keeping in play if consultation reveals a fuller, weightier note is desired.',
          'Could become stronger if low-volume response needs more body than snap.',
        ],
        evidence: [
          `Primary goal: ${safeText(primaryGoal)}`,
          snapshot.currentPainPoints
            ? `Pain points noted: ${safeText(snapshot.currentPainPoints)}`
            : 'No pain-point detail yet',
        ],
        uncertainty: [
          'Current evidence is not strong enough for walnut to lead.',
        ],
      },
    ],
    hardwareFinishCommitment: [
      {
        value: 'Keep brass / gold as the current lead',
        confidence: brassPreferred ? 90 : 70,
        why: [
          'It is the only explicit hardware preference currently present.',
          'Until a visual direction says otherwise, it should lead the board.',
        ],
        evidence: [
          `hardwareFinishPreference: ${safeText(hardwareFinish, 'Not stated')}`,
        ],
        uncertainty: [
          'Visual direction is still open, so this should stay confirmable later.',
        ],
      },
      {
        value: 'Treat brass / gold as a lean, not a lock',
        confidence: 83,
        why: [
          'This is the safer path while finish and shell visuals remain undefined.',
          'It respects the preference without overfreezing the look.',
        ],
        evidence: [
          `hardwareFinishPreference: ${safeText(hardwareFinish, 'Not stated')}`,
          'visual direction remains unclear',
        ],
        uncertainty: [
          'This may feel too cautious if the player is already very sure visually.',
        ],
      },
      {
        value: 'Keep hardware fully open',
        confidence: 58,
        why: [
          'Only useful if the consultation materially changes the visual story.',
          'Prevents forcing hardware into an as-yet-undefined finish direction.',
        ],
        evidence: ['Build still lacks visual specifics'],
        uncertainty: [
          'Current questionnaire does provide a real hardware preference, so this is weaker.',
        ],
      },
    ],
    finishDirection: [
      {
        value: 'Keep finish direction open and understated',
        confidence: 88,
        why: [
          'The player explicitly said they are not sure visually.',
          'The best move is to avoid premature finish commitments.',
        ],
        evidence: [
          'visualDirection: I’m not sure',
          'Build clarity: wants guidance',
        ],
        uncertainty: [
          'Later consultation may quickly narrow this once images or references appear.',
        ],
      },
      {
        value: 'Natural / clear-led finish family',
        confidence: 72,
        why: [
          'This is the safest broad recommendation before strong visual references exist.',
          'It keeps wood and hardware decisions compatible.',
        ],
        evidence: [
          brassPreferred
            ? 'Brass / gold can pair well with restrained natural directions'
            : 'Hardware is still reasonably open',
          'No painted or resin-led request is present yet',
        ],
        uncertainty: ['Still speculative without visual preferences.'],
      },
      {
        value: 'Custom visual direction after consultation',
        confidence: 69,
        why: [
          'The player may simply need guided examples before choosing.',
          'This respects the lack of current visual certainty.',
        ],
        evidence: [
          'visualDirection currently open',
          'Questionnaire requests guidance',
        ],
        uncertainty: [
          'Useful as a process note, but not a concrete finish answer yet.',
        ],
      },
    ],
    hoopTypeDirection: [
      {
        value: 'Die-cast hoops',
        confidence: includesFastLowVolume ? 88 : 79,
        why: [
          'Die-cast hoops support a more controlled, focused, quick-response feel.',
          'That lines up well with the stated low-volume response target.',
          'It gives the build a more disciplined and articulate playing behavior.',
        ],
        evidence: [
          includesFastLowVolume
            ? 'responsePriorities: Fast response at low volume'
            : 'Response lane still leans controlled',
          `preferredSizeDirection: ${safeText(sizeDirection, 'Not stated')}`,
          `primaryGoal: ${safeText(primaryGoal)}`,
        ],
        uncertainty: [
          'Worth revisiting only if the player later wants a more open, relaxed feel.',
        ],
      },
      {
        value: 'Triple-flanged hoops',
        confidence: 67,
        why: [
          'Triple-flanged hoops keep the build more open and less controlled.',
          'They are still plausible if the player wants more give and openness.',
        ],
        evidence: [
          'Visual and feel preferences are still not fully locked',
          `finishDirection: ${safeText(
            decisions?.finishDirection?.value || ''
          )}`,
        ],
        uncertainty: [
          'This currently looks weaker than die-cast for the stated response target.',
        ],
      },
      {
        value: 'Keep hoop type open until final voice lock-in',
        confidence: 61,
        why: [
          'This is the cautious option if you do not want to overcommit too early.',
          'It keeps the final feel decision open a little longer.',
        ],
        evidence: ['Some surrounding build variables are still settling'],
        uncertainty: [
          'This is less helpful if the tool is supposed to drive the build direction forward now.',
        ],
      },
    ],
    bearingEdgeDirection: [
      {
        value: 'Sensitive / balanced edge direction',
        confidence: 84,
        why: [
          'That best matches quick response at lower volume without overcommitting to extreme dryness.',
          'It keeps the build versatile for a main snare role.',
        ],
        evidence: [
          includesFastLowVolume
            ? 'Fast response at low volume is active'
            : 'Response target still leans quick',
          `Primary goal: ${safeText(primaryGoal)}`,
        ],
        uncertainty: [
          'Final edge call should wait for shell and tuning decisions.',
        ],
      },
      {
        value: 'Slightly sharper articulation-led edge',
        confidence: 71,
        why: [
          'This becomes stronger if the studio articulation lane wins.',
          'Helps keep the note clear at lower playing levels.',
        ],
        evidence: [
          includesRecording
            ? 'Recording profile present'
            : 'Studio signal is moderate',
          'Compact size direction may favor crispness',
        ],
        uncertainty: [
          'Could push too far if the player ultimately wants more body.',
        ],
      },
      {
        value: 'Keep edge family open for now',
        confidence: 66,
        why: [
          'Reasonable if shell construction and wood are not resolved yet.',
          'Prevents fake precision too early.',
        ],
        evidence: ['Several build variables still open'],
        uncertainty: [
          'Less helpful if the tool is trying to narrow direction step by step.',
        ],
      },
    ],
    tuningApproach: [
      {
        value: 'Favor responsive medium-to-high behavior',
        confidence: 82,
        why: [
          'This best matches fast low-volume response and compact-size lean.',
          'It keeps articulation active without forcing a thin voice.',
        ],
        evidence: [
          includesFastLowVolume
            ? 'Fast response priority is explicit'
            : 'Response lane remains quick',
          sizeIs12
            ? '12" direction supports this tuning behavior'
            : 'Smaller / tighter direction still possible',
        ],
        uncertainty: [
          'Should still be validated against the player’s actual backbeat needs.',
        ],
      },
      {
        value: 'Favor broad studio-friendly flexibility',
        confidence: 77,
        why: [
          'Good if this really becomes a main studio snare rather than a niche voice.',
          'Leaves more room for consultation nuance.',
        ],
        evidence: [
          includesRecording
            ? 'Recording player profile present'
            : 'Studio signal moderate',
          `Primary goal: ${safeText(primaryGoal)}`,
        ],
        uncertainty: ['Less pointed than the fast-response path.'],
      },
      {
        value: 'Keep tuning approach open',
        confidence: 61,
        why: [
          'Useful if consultation must define the tonal center first.',
          'Prevents premature assumptions.',
        ],
        evidence: ['No direct tonal adjectives beyond response priority'],
        uncertainty: [
          'Too passive unless the next conversation is happening very soon.',
        ],
      },
    ],
    lugCountDirection: [
      {
        value: '8-lug direction',
        confidence: sizeIs12 ? 86 : 71,
        why: [
          'This is the strongest default for a 12" main-snare path.',
          'It supports a responsive, practical, non-overbuilt feel.',
        ],
        evidence: [
          sizeIs12
            ? '12" direction currently leads'
            : 'Compact direction still plausible',
          includesFastLowVolume
            ? 'Fast-response goal favors a responsive setup'
            : 'Response goal remains moderately quick',
        ],
        uncertainty: ['Should be revisited if the shell size changes.'],
      },
      {
        value: 'Keep lug count tied to final size',
        confidence: 78,
        why: [
          'This is the safest disciplined approach if size is not truly locked.',
          'Prevents pretending the answer is final too soon.',
        ],
        evidence: ['Size direction still may need confirmation'],
        uncertainty: ['Less decisive, but structurally honest.'],
      },
      {
        value: '6-lug direction',
        confidence: 55,
        why: [
          'Could become interesting if the build moves more character-driven and less utility-driven.',
          'May fit a lighter-feeling compact instrument.',
        ],
        evidence: ['Compact size signal exists'],
        uncertainty: [
          'Not enough evidence yet for this to lead a main-snare project.',
        ],
      },
    ],
  };

  return recommendationSets[stepId] || [];
};

const getDecisionStatus = (selectedValue, recommendedValue) => {
  if (!selectedValue) return 'open';
  if (!recommendedValue) return 'selected';
  return normalize(selectedValue) === normalize(recommendedValue)
    ? 'recommended'
    : 'overridden';
};

const getBuildSpecValue = (storyEngineData = {}, key) =>
  String(storyEngineData?.engineRecord?.buildSpec?.[key]?.value || '').trim();

const getCraftsmanValue = (decisions = {}, key) =>
  String(decisions?.[key]?.value || '').trim();

const getCraftsmanResumeState = ({ decisions = {}, storyEngineData = {} }) => {
  const decisionPathLogic = getCraftsmanValue(decisions, 'decisionPathLogic');

  const shellConstruction =
    getBuildSpecValue(storyEngineData, 'shellConstruction') ||
    getCraftsmanValue(decisions, 'shellConstruction');

  const primaryWood =
    getBuildSpecValue(storyEngineData, 'primaryWood') ||
    getCraftsmanValue(decisions, 'primaryWood');

  const bearingEdge =
    getBuildSpecValue(storyEngineData, 'bearingEdge') ||
    getCraftsmanValue(decisions, 'bearingEdgeDirection');

  const finishSystem =
    getBuildSpecValue(storyEngineData, 'finishSystem') ||
    getCraftsmanValue(decisions, 'finishDirection');

  const lugCount =
    getBuildSpecValue(storyEngineData, 'lugCount') ||
    getCraftsmanValue(decisions, 'lugCountDirection');

  const tuningApproach =
    getBuildSpecValue(storyEngineData, 'tuningApproach') ||
    getCraftsmanValue(decisions, 'tuningApproach');

  const hoopType = getBuildSpecValue(storyEngineData, 'hoopType');
  const snareBed = getBuildSpecValue(storyEngineData, 'snareBed');
  const transcriptAdded = !!String(
    storyEngineData?.consultationTranscript || ''
  ).trim();

const hoopTypeDirection =
  getBuildSpecValue(storyEngineData, 'hoopType') ||
  getCraftsmanValue(decisions, 'hoopTypeDirection');

const confirmedNow = [
  decisionPathLogic && `Decision Path Logic: ${decisionPathLogic}`,
  shellConstruction && `Shell Construction: ${shellConstruction}`,
  primaryWood && `Primary Wood: ${primaryWood}`,
  finishSystem && `Finish System: ${finishSystem}`,
  hoopTypeDirection && `Hoop Type: ${hoopTypeDirection}`,
  bearingEdge && `Bearing Edge: ${bearingEdge}`,
  lugCount && `Lug Count: ${lugCount}`,
  tuningApproach && `Tuning Approach: ${tuningApproach}`,
].filter(Boolean);

  const stillOpen = [
    !decisionPathLogic && 'Choose decision path logic',
    !transcriptAdded && 'Add consultation transcript',
    !shellConstruction && 'Confirm shell construction',
    !primaryWood && 'Confirm primary wood',
    !finishSystem && 'Confirm finish system',
    !hoopTypeDirection && 'Confirm hoop type',
    !bearingEdge && 'Confirm bearing edge',
    !lugCount && 'Confirm lug count',
  ].filter(Boolean);

  let nextAction = 'Craftsman direction is complete';
  let nextLocation = 'Build Workflow';

  if (!decisionPathLogic) {
    nextAction = 'Choose the decision path logic first';
    nextLocation = 'Craftsman Master Tool';
  } else if (!transcriptAdded) {
    nextAction = 'Add the consultation transcript';
    nextLocation = 'Intake & Direction';
  } else if (!hoopTypeDirection) {
    nextAction = 'Confirm hoop type';
    nextLocation = 'Craftsman Master Tool';
  } else if (stillOpen.length) {
    nextAction = stillOpen[0];
    nextLocation =
      stillOpen[0] === 'Add consultation transcript'
        ? 'Intake & Direction'
        : 'Craftsman Master Tool';
  } else {
    nextAction = 'Craftsman direction is complete';
    nextLocation = 'Build Workflow';
  }

  return {
    confirmedNow,
    stillOpen,
    nextAction,
    nextLocation,
    readyToUnlock: stillOpen.length === 0,
  };
};

const getDecisionHistoryReasonText = (entry = {}) => {
  if (entry?.changedBecause) return entry.changedBecause;
  if (entry?.overridden && entry?.overrideReason) return entry.overrideReason;

  if (Array.isArray(entry?.why) && entry.why.length) {
    return entry.why[0];
  }

  if (Array.isArray(entry?.evidence) && entry.evidence.length) {
    return entry.evidence[0];
  }

  return 'No reason captured.';
};

const CraftsmanMasterToolSection = ({
  projectData,
  editableData,
  storyEngineData,
  saveToFirestore,
}) => {
  const persistedToolData = useMemo(() => {
    return {
      ...DEFAULT_TOOL_DATA,
      ...(editableData?.craftsmanMasterTool ||
        projectData?.craftsmanMasterTool ||
        {}),
    };
  }, [editableData?.craftsmanMasterTool, projectData?.craftsmanMasterTool]);

  const [toolData, setToolData] = useState(persistedToolData);
  const [draftSelection, setDraftSelection] = useState('');
  const [manualStepId, setManualStepId] = useState('');
  const [showResumeSection, setShowResumeSection] = useState(true);
  const [showDecisionState, setShowDecisionState] = useState(false);
  const [showDecisionHistory, setShowDecisionHistory] = useState(false);

  useEffect(() => {
    setToolData(persistedToolData);
  }, [persistedToolData]);

  const snapshot = useMemo(() => {
    const questionnaireSnapshot = getQuestionnaireSnapshot(
      storyEngineData,
      projectData
    );

    return {
      artistName: getArtistName(projectData, storyEngineData),
      currentPhase: getCurrentPhaseLabel(editableData),
      status: getProjectStatus(editableData),
      playerProfile: questionnaireSnapshot.playerProfile,
      playSettings: questionnaireSnapshot.playSettings,
      genres: questionnaireSnapshot.genres,
      primaryGoal: questionnaireSnapshot.primaryGoal,
      responsePriorities: questionnaireSnapshot.responsePriorities,
      tonalGoals: questionnaireSnapshot.tonalGoals,
      preferredSizeDirection: questionnaireSnapshot.preferredSizeDirection,
      hardwareFinishPreference: questionnaireSnapshot.hardwareFinishPreference,
      shellDirectionsOpenTo: questionnaireSnapshot.shellDirectionsOpenTo,
      buildClarity: questionnaireSnapshot.buildClarity,
      consultationContactMethod:
        questionnaireSnapshot.consultationContactMethod,
      primaryUseCase: questionnaireSnapshot.primaryUseCase,
      currentPainPoints: questionnaireSnapshot.currentPainPoints,
    };
  }, [editableData, projectData, storyEngineData]);

  const decisions = useMemo(
    () => toolData?.decisions || {},
    [toolData?.decisions]
  );

  const trackedCount = useMemo(() => {
    return DECISION_FLOW.filter((step) => {
      const decision = decisions?.[step.id];
      return !!String(decision?.value || '').trim();
    }).length;
  }, [decisions]);

  const staleDecisionCount = useMemo(() => {
    return DECISION_FLOW.filter((step) => !!decisions?.[step.id]?.stale).length;
  }, [decisions]);

  const totalCount = DECISION_FLOW.length;

  const currentStep = useMemo(() => {
    if (trackedCount >= totalCount && staleDecisionCount === 0) {
      return null;
    }

    return (
      DECISION_FLOW.find((step) => {
        const decision = decisions?.[step.id];
        const hasDecisionValue = !!String(decision?.value || '').trim();
        return !hasDecisionValue || !!decision?.stale;
      }) || null
    );
  }, [decisions, trackedCount, totalCount, staleDecisionCount]);

  const isComplete = trackedCount >= totalCount && staleDecisionCount === 0;

  const manualStep =
    DECISION_FLOW.find((step) => step.id === manualStepId) || null;

  const activeStep =
    manualStep || currentStep || DECISION_FLOW[DECISION_FLOW.length - 1];

  const orderedDecisionFlow = useMemo(() => {
    const getPriority = (step) => {
      const decision = decisions?.[step.id];
      const buildSpecKey = CRAFTSMAN_TO_BUILD_SPEC_KEY[step.id];
      const buildSpecValue = buildSpecKey
        ? String(
            storyEngineData?.engineRecord?.buildSpec?.[buildSpecKey]?.value ||
              ''
          ).trim()
        : '';

      const decisionValue = String(decision?.value || '').trim();
      const hasValue = !!(decisionValue || buildSpecValue);
      const isActive = activeStep?.id === step.id;
      const isStale = !!decision?.stale;

      if (isActive) return 0;
      if (isStale) return 1;
      if (!hasValue) return 2;
      return 3;
    };

    return [...DECISION_FLOW].sort((a, b) => {
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      const originalA = DECISION_FLOW.findIndex((step) => step.id === a.id);
      const originalB = DECISION_FLOW.findIndex((step) => step.id === b.id);
      return originalA - originalB;
    });
  }, [decisions, storyEngineData, activeStep]);

  const recommendations = useMemo(() => {
    return buildRecommendationsForStep(activeStep.id, snapshot, decisions);
  }, [activeStep.id, snapshot, decisions]);

  useEffect(() => {
    if (isComplete) {
      setDraftSelection('');
      return;
    }

    const recommendedDefault = String(recommendations?.[0]?.value || '').trim();
    const savedValue = String(decisions?.[activeStep.id]?.value || '').trim();

    setDraftSelection(savedValue || recommendedDefault);
  }, [activeStep.id, decisions, isComplete, recommendations]);

  const currentOptions = useMemo(() => {
    const recommendationValues = recommendations.map((item) => item.value);
    const defaults = {
      decisionPathLogic: [
        'Protect the player’s stated requirement first',
        'Keep multiple paths open until consultation pressure-tests them',
        'Use a studio-first logic path',
        'Use a size-led logic path',
        'Use a custom / hybrid logic path',
        'Custom',
      ],
      protectFirst: ['Main-snare authority', 'Keep open', 'Custom'],
      sizeDirectionConfidence: [
        '12" is a real lean, not a hard lock yet',
        'Treat 12" as the working direction',
        'Keep size open until consultation',
        'Custom',
      ],
      shellConstruction: [
        'Stave',
        'Keep construction open between stave and hybrid',
        'Feuzon / hybrid direction',
        'Custom',
      ],
      primaryWood: [
        'Maple',
        'Birch',
        'Walnut',
        'Cherry',
        'Mahogany',
        'Bubinga',
        'Keep open',
        'Custom',
      ],
      hardwareFinishCommitment: [
        'Keep brass / gold as the current lead',
        'Treat brass / gold as a lean, not a lock',
        'Keep hardware fully open',
        'Custom',
      ],
      finishDirection: [
        'Keep finish direction open and understated',
        'Natural / clear-led finish family',
        'Custom visual direction after consultation',
        'Custom',
      ],
      hoopTypeDirection: [
        'Die-cast hoops',
        'Triple-flanged hoops',
        'Keep hoop type open until final voice lock-in',
        'Custom',
      ],
      bearingEdgeDirection: [
        'Sensitive / balanced edge direction',
        'Slightly sharper articulation-led edge',
        'Keep edge family open for now',
        'Custom',
      ],
      tuningApproach: [
        'Favor responsive medium-to-high behavior',
        'Favor broad studio-friendly flexibility',
        'Keep tuning approach open',
        'Custom',
      ],
      lugCountDirection: [
        '8-lug direction',
        'Keep lug count tied to final size',
        '6-lug direction',
        'Custom',
      ],
    };

    return [
      ...new Set([...(defaults[activeStep.id] || []), ...recommendationValues]),
    ];
  }, [activeStep.id, recommendations]);

  useEffect(() => {
    if (!manualStepId) return;

    const matchingDecision = decisions?.[manualStepId];
    const matchingStep = DECISION_FLOW.find((step) => step.id === manualStepId);

    if (!matchingStep) {
      setManualStepId('');
      return;
    }

    const hasValue = !!String(matchingDecision?.value || '').trim();
    const stillNeedsReview = !!matchingDecision?.stale;

    if (!stillNeedsReview && manualStepId !== activeStep?.id && hasValue) {
      setManualStepId('');
    }
  }, [manualStepId, decisions, activeStep]);

  const decisionHistory = useMemo(() => {
    return safeArray(toolData?.history)
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.changedAt || b?.savedAt || 0).getTime() -
          new Date(a?.changedAt || a?.savedAt || 0).getTime()
      );
  }, [toolData?.history]);

  const saveToolState = async (
    nextToolData,
    storyBuildSpecPatch = null,
    timestamp = new Date().toISOString()
  ) => {
    const payload = {
      craftsmanMasterTool: {
        ...nextToolData,
        lastUpdatedAt: timestamp,
      },
    };

    if (storyBuildSpecPatch) {
      payload.storyEngine = {
        ...(projectData?.storyEngine || {}),
        sources: {
          ...(projectData?.storyEngine?.sources || {}),
        },
        record: {
          ...(storyEngineData?.engineRecord || {}),
          buildSpec: {
            ...(storyEngineData?.engineRecord?.buildSpec || {}),
            ...storyBuildSpecPatch,
          },
        },
        draftPreview:
          projectData?.storyEngine?.draftPreview ||
          storyEngineData?.draftPreview ||
          null,
        lastUpdatedAt: timestamp,
      };
    }

    await saveToFirestore(payload);
  };

  const handleSaveDecision = async () => {
    if (isComplete) return;

    let cleanValue = String(draftSelection || '').trim();

    if (cleanValue === 'Custom') {
      cleanValue = String(toolData?.customDraft || '').trim();
    }

    if (!cleanValue) return;

    const timestamp = new Date().toISOString();
    const topRecommendation = recommendations?.[0] || null;
    const recommendationMatch = recommendations.find(
      (item) => normalize(item.value) === normalize(cleanValue)
    );

    const selectedRecommendation = recommendationMatch || {
      value: cleanValue,
      confidence: 0,
      why: [],
      evidence: [],
      uncertainty: ['No recommendation metadata captured for this selection.'],
    };

    const isOverride =
      normalize(cleanValue) !== normalize(topRecommendation?.value || '');

    const previousDecision = decisions?.[activeStep.id] || null;
    const previousValue = previousDecision?.value || '';

    const nextDecisions = {
      ...decisions,
      [activeStep.id]: {
        questionKey: activeStep.id,
        question: activeStep.question,
        value: cleanValue,
        recommendedValue: topRecommendation?.value || '',
        status: getDecisionStatus(cleanValue, topRecommendation?.value || ''),
        confidence: selectedRecommendation?.confidence || 0,
        evidence: safeArray(selectedRecommendation?.evidence),
        why: safeArray(selectedRecommendation?.why),
        uncertainty: safeArray(selectedRecommendation?.uncertainty),
        dependsOn: safeArray(DECISION_DEPENDENCIES[activeStep.id]),
        stale: false,
        staleReason: '',
        overridden: isOverride,
        selectedAt: timestamp,
        savedAt: timestamp,
        buildSpecKey: CRAFTSMAN_TO_BUILD_SPEC_KEY[activeStep.id] || '',
      },
    };

    const downstreamIds = getAllDependentDecisionIds(activeStep.id);

    downstreamIds.forEach((downstreamId) => {
      const existing = nextDecisions?.[downstreamId];
      if (!existing?.value) return;

      nextDecisions[downstreamId] = {
        ...existing,
        stale: true,
        staleReason: `Needs review because "${activeStep.question}" changed.`,
      };
    });

    const selectedWhy = safeArray(selectedRecommendation?.why);
    const selectedEvidence = safeArray(selectedRecommendation?.evidence);

    const storyReason =
      selectedWhy[0] ||
      selectedEvidence[0] ||
      (isOverride
        ? 'A different path was chosen for this project.'
        : 'Followed the strongest available recommendation.');

    const enrichedChangedBecause = storyReason;

    const nextHistory = [
      {
        id: `${activeStep.id}-${Date.now()}`,
        stepId: activeStep.id,
        questionKey: activeStep.id,
        question: activeStep.question,
        previousValue,
        newValue: cleanValue,
        answer: cleanValue,
        changedAt: timestamp,
        savedAt: timestamp,
        phaseLabel: snapshot.currentPhase || 'Unknown phase',
        recommendedValue: topRecommendation?.value || '',
        overridden: isOverride,
        confidence: selectedRecommendation?.confidence || 0,
        why: selectedWhy,
        evidence: selectedEvidence,
        uncertainty: safeArray(selectedRecommendation?.uncertainty),
        changedBecause: enrichedChangedBecause,
      },
      ...safeArray(toolData?.history),
    ];

    const nextToolData = {
      ...toolData,
      decisions: nextDecisions,
      history: nextHistory,
      currentSelection: cleanValue,
      customDraft: '',
      lastUpdatedAt: timestamp,
    };

    const mappedBuildSpecKey = CRAFTSMAN_TO_BUILD_SPEC_KEY[activeStep.id] || '';

    const storyBuildSpecPatch = mappedBuildSpecKey
      ? {
          [mappedBuildSpecKey]: {
            ...(storyEngineData?.engineRecord?.buildSpec?.[
              mappedBuildSpecKey
            ] || {}),
            value: cleanValue,
            status: 'confirmed',
            manualLock: true,
            lastUpdatedBy: 'craftsman_tool',
            confidence:
              typeof selectedRecommendation?.confidence === 'number'
                ? selectedRecommendation.confidence / 100
                : 1,
            rationale: [
              `Confirmed from Craftsman Master Tool: ${activeStep.question}`,
              ...safeArray(selectedRecommendation?.why || []),
            ],
            confirmedFrom: 'craftsmanMasterTool',
            confirmedAt: timestamp,
          },
        }
      : null;

    setToolData(nextToolData);
    setDraftSelection('');
    setManualStepId('');
    await saveToolState(nextToolData, storyBuildSpecPatch, timestamp);
  };

  const lastTrackedDecision =
    decisionHistory.length > 0 ? decisionHistory[0] : null;

  const resumeState = useMemo(() => {
    return getCraftsmanResumeState({
      decisions,
      storyEngineData,
    });
  }, [decisions, storyEngineData]);

const renderResumeContent = () => {
  if (!isComplete) {
    return (
      <>
        <div className="cmt-current-head">
          <div>
            <p className="cmt-question-subtitle">
              This is the next decision that still needs to be confirmed before
              the build direction is fully stable.
            </p>
          </div>

          <div className="cmt-progress-stack">
            <div className="cmt-progress-pill">
              {trackedCount}/{totalCount} decisions tracked
            </div>

            {staleDecisionCount > 0 ? (
              <div className="cmt-stale-pill">
                {staleDecisionCount} downstream review
                {staleDecisionCount === 1 ? '' : 's'} needed
              </div>
            ) : null}
          </div>
        </div>

        <div className="cmt-complete-state">
          <div className="cmt-complete-badge">In Progress</div>
          <div className="cmt-complete-copy">
            Last tracked decision:{' '}
            <strong>
              {safeText(
                lastTrackedDecision?.answer || lastTrackedDecision?.newValue,
                '—'
              )}
            </strong>
          </div>
        </div>

        <div className="cmt-resume-grid">
          <div className="cmt-resume-card cmt-resume-card-next">
            <div className="cmt-resume-title">Do this now</div>
            <div className="cmt-resume-next-action">
              {activeStep.question}
            </div>
            <div className="cmt-resume-next-location">
              After this: <strong>{activeStep.nextLabel}</strong>
            </div>
          </div>

          <div className="cmt-resume-card">
            <div className="cmt-resume-title">Why this is next</div>
            <div className="cmt-resume-empty">{activeStep.subtitle}</div>
          </div>

          <div className="cmt-resume-card">
            <div className="cmt-resume-title">Still blocking unlock</div>
            {resumeState.stillOpen.length ? (
              <ul className="cmt-resume-list">
                {resumeState.stillOpen.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="cmt-resume-empty">
                No blockers remain. Build workflow can be unlocked.
              </div>
            )}
          </div>
        </div>

        <div className="cmt-recommendation-layer">
          <div className="cmt-recommendation-title-row">
            <span className="cmt-section-kicker">Recommendation Layer</span>
            <div className="cmt-recommendation-title">
              Top recommendations and why
            </div>
          </div>

          <div className="cmt-recommendation-list">
            {recommendations.map((item, index) => (
              <div
                key={`${activeStep.id}-${item.value}`}
                className={`cmt-recommendation-card ${
                  index === 0 ? 'is-top' : ''
                } ${draftSelection === item.value ? 'is-selected' : ''}`}
                onClick={() => setDraftSelection(item.value)}
              >
                <div className="cmt-recommendation-top">
                  <span className="cmt-recommendation-rank">
                    {index === 0
                      ? 'Top recommendation'
                      : `Also plausible #${index + 1}`}
                  </span>
                  <span className="cmt-recommendation-confidence">
                    {item.confidence}%
                  </span>
                </div>

                <div className="cmt-recommendation-label">{item.value}</div>

                <div className="cmt-recommendation-block">
                  <div className="cmt-recommendation-block-label">Why</div>
                  <ul>
                    {item.why.map((line, idx) => (
                      <li key={`why-${idx}`}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="cmt-recommendation-block">
                  <div className="cmt-recommendation-block-label">
                    Evidence
                  </div>
                  <ul>
                    {item.evidence.map((line, idx) => (
                      <li key={`evidence-${idx}`}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="cmt-recommendation-block">
                  <div className="cmt-recommendation-block-label">
                    Uncertainty
                  </div>
                  <ul>
                    {item.uncertainty.map((line, idx) => (
                      <li key={`uncertainty-${idx}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cmt-selection-layer">
          <div className="cmt-recommendation-title-row">
            <span className="cmt-section-kicker">Your Selection</span>
          </div>

          <div className="cmt-option-grid">
            {currentOptions.map((option) => {
              const active = draftSelection === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={`cmt-option-btn ${active ? 'active' : ''}`}
                  onClick={() => setDraftSelection(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {draftSelection === 'Custom' ? (
            <div className="cmt-custom-wrap">
              <input
                type="text"
                className="cmt-custom-input"
                placeholder="Enter a custom decision..."
                value={toolData?.customDraft || ''}
                onChange={(e) =>
                  setToolData((prev) => ({
                    ...prev,
                    customDraft: e.target.value,
                  }))
                }
              />
            </div>
          ) : null}

          <div className="cmt-save-row">
            <button
              type="button"
              className="cmt-save-decision-btn"
              onClick={handleSaveDecision}
              disabled={
                !String(
                  draftSelection === 'Custom'
                    ? toolData?.customDraft || ''
                    : draftSelection || ''
                ).trim()
              }
            >
              Save this decision
            </button>

            <div className="cmt-next-text">
              After this, the next thing to figure out is{' '}
              <strong>{activeStep.nextLabel}</strong>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="cmt-current-head">
        <div>
          <p className="cmt-question-subtitle">
            All Craftsman Master Tool decisions are now tracked. This section
            reflects the confirmed build-direction choices from this tool only.
          </p>
        </div>

        <div className="cmt-progress-stack">
          <div className="cmt-progress-pill">
            {trackedCount}/{totalCount} decisions tracked
          </div>

          {staleDecisionCount > 0 ? (
            <div className="cmt-stale-pill">
              {staleDecisionCount} downstream review
              {staleDecisionCount === 1 ? '' : 's'} needed
            </div>
          ) : null}
        </div>
      </div>

      <div className="cmt-complete-state">
        <div className="cmt-complete-badge">Complete</div>
        <div className="cmt-complete-copy">
          Last tracked decision:{' '}
          <strong>
            {safeText(
              lastTrackedDecision?.answer || lastTrackedDecision?.newValue
            )}
          </strong>
        </div>
      </div>

      <div className="cmt-resume-grid">
        <div className="cmt-resume-card">
          <div className="cmt-resume-title">Confirmed now</div>
          {resumeState.confirmedNow.length ? (
            <ul className="cmt-resume-list">
              {resumeState.confirmedNow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="cmt-resume-empty">
              No confirmed build direction yet.
            </div>
          )}
        </div>

        <div className="cmt-resume-card">
          <div className="cmt-resume-title">Craftsman status</div>
          <div className="cmt-resume-empty">
            Craftsman decision flow is complete. No further decisions are needed
            in this tool.
          </div>
        </div>

        <div className="cmt-resume-card cmt-resume-card-next">
          <div className="cmt-resume-title">Next step</div>
          <div className="cmt-resume-next-action">
            Move into Build Workflow
          </div>
          <div className="cmt-resume-next-location">
            Go to: <strong>Build Workflow</strong>
          </div>
        </div>
      </div>
    </>
  );
};

  return (
    <div className="cmt-shell">
      <div className="cmt-header">
        <div className="cmt-header-copy">
          <div className="cmt-kicker">Craftsman Master Tool</div>
          <h3 className="cmt-title">This is where we are. This is next.</h3>
          <p className="cmt-subtitle">
            Use this as the step-by-step decision layer. One clear choice at a
            time, with recommendation logic, override tracking, and downstream
            review status carried with the build direction.
          </p>
          <div className="cmt-helper-banner">
            When the project feels unclear, come back here first. This tool
            should help you decide what is real, what is still open, and what
            needs review before the build can move forward.
          </div>
        </div>
      </div>

      <section className="cmt-current-card">
        <button
          type="button"
          className="cmt-section-toggle"
          onClick={() => setShowResumeSection((prev) => !prev)}
        >
          <div className="cmt-section-toggle-copy">
            <span className="cmt-section-kicker">Resume Here</span>
            <h4 className="cmt-history-title">
              {!isComplete
                ? activeStep.question
                : 'Craftsman decision flow is complete.'}
            </h4>
          </div>
          <span className="cmt-section-toggle-icon">
            {showResumeSection ? '−' : '+'}
          </span>
        </button>

        {showResumeSection ? (
          <div className="cmt-section-body">{renderResumeContent()}</div>
        ) : null}
      </section>

      <section className="cmt-history-card">
        <button
          type="button"
          className="cmt-section-toggle"
          onClick={() => setShowDecisionState((prev) => !prev)}
        >
          <div className="cmt-section-toggle-copy">
            <span className="cmt-section-kicker">Decision State</span>
            <h4 className="cmt-history-title">What is provisional right now</h4>
          </div>
          <span className="cmt-section-toggle-icon">
            {showDecisionState ? '−' : '+'}
          </span>
        </button>

        {showDecisionState ? (
          <div className="cmt-section-body">
            <div className="cmt-state-list">
              {orderedDecisionFlow.map((step) => {
                const decision = decisions?.[step.id];
                const buildSpecKey = CRAFTSMAN_TO_BUILD_SPEC_KEY[step.id];
                const buildSpecValue = buildSpecKey
                  ? String(
                      storyEngineData?.engineRecord?.buildSpec?.[buildSpecKey]
                        ?.value || ''
                    ).trim()
                  : '';

                const decisionValue = String(decision?.value || '').trim();
                const displayValue = decisionValue || buildSpecValue || 'Open';
                const hasValue = !!(decisionValue || buildSpecValue);

                return (
                  <div
                    key={step.id}
                    className={`cmt-state-item ${
                      activeStep.id === step.id ? 'is-active' : ''
                    }`}
                    onClick={() => setManualStepId(step.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setManualStepId(step.id);
                      }
                    }}
                  >
                    <div className="cmt-state-main">
                      <div className="cmt-state-question">{step.question}</div>
                      <div className="cmt-state-value">{displayValue}</div>
                    </div>

                    <div className="cmt-state-badges">
                      {!hasValue ? (
                        <span className="cmt-state-badge is-open">Open</span>
                      ) : null}

                      {!!decisionValue && decision?.status === 'recommended' ? (
                        <span className="cmt-state-badge is-recommended">
                          Recommended
                        </span>
                      ) : null}

                      {!!decisionValue && decision?.status === 'overridden' ? (
                        <span className="cmt-state-badge is-overridden">
                          Override
                        </span>
                      ) : null}

                      {!!decisionValue && decision?.stale ? (
                        <span className="cmt-state-badge is-stale">
                          Needs review
                        </span>
                      ) : null}

                      {!decisionValue && buildSpecValue ? (
                        <span className="cmt-state-badge is-stable">
                          Story Confirmed
                        </span>
                      ) : null}

                      {!!decisionValue &&
                      !decision?.stale &&
                      decision?.status !== 'overridden' ? (
                        <span className="cmt-state-badge is-stable">
                          Current
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cmt-history-collapsible">
              <button
                type="button"
                className="cmt-history-toggle"
                onClick={() => setShowDecisionHistory((prev) => !prev)}
              >
                <span>Tracked direction changes</span>
                <span>{showDecisionHistory ? '−' : '+'}</span>
              </button>

              {showDecisionHistory ? (
                !decisionHistory.length ? (
                  <div className="cmt-history-empty">
                    No decisions saved yet. Start with the current question
                    above.
                  </div>
                ) : (
                  <div className="cmt-history-list cmt-history-list-bottom">
                    {decisionHistory.map((entry) => (
                      <div
                        key={
                          entry.id || `${entry.questionKey}-${entry.savedAt}`
                        }
                        className="cmt-history-item"
                      >
                        <div className="cmt-history-main">
                          <div className="cmt-history-decision">
                            {entry.question}
                          </div>

                          <div className="cmt-history-answer">
                            {entry.previousValue ? (
                              <>
                                <span className="cmt-history-old">
                                  {entry.previousValue}
                                </span>
                                <span className="cmt-history-arrow">→</span>
                              </>
                            ) : null}

                            <span className="cmt-history-new">
                              {entry.newValue || entry.answer}
                            </span>

                            {entry.overridden ? (
                              <span className="cmt-history-override">
                                Override
                              </span>
                            ) : (
                              <span className="cmt-history-followed">
                                Followed top recommendation
                              </span>
                            )}

                            {typeof entry.confidence === 'number' &&
                            entry.confidence > 0 ? (
                              <span className="cmt-history-confidence">
                                {entry.confidence}% confidence
                              </span>
                            ) : null}
                          </div>

                          <div className="cmt-history-why">
                            <span className="cmt-history-why-label">
                              Why this changed
                            </span>
                            <div className="cmt-history-why-text">
                              {entry.changedBecause ||
                                getDecisionHistoryReasonText(entry)}
                            </div>

                            {Array.isArray(entry.evidence) &&
                            entry.evidence.length ? (
                              <div className="cmt-history-evidence">
                                <span className="cmt-history-why-label">
                                  Evidence used
                                </span>
                                <ul className="cmt-history-evidence-list">
                                  {entry.evidence
                                    .slice(0, 2)
                                    .map((item, idx) => (
                                      <li key={`${entry.id}-evidence-${idx}`}>
                                        {item}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="cmt-history-meta">
                          <span>
                            {safeText(entry.phaseLabel, 'Unknown phase')}
                          </span>
                          <span>
                            {entry.changedAt || entry.savedAt
                              ? new Date(
                                  entry.changedAt || entry.savedAt
                                ).toLocaleString()
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default CraftsmanMasterToolSection;
