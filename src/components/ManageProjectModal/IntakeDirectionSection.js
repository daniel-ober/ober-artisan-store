import React, { useEffect, useMemo, useState } from 'react';
import './IntakeDirectionSection.css';

const FIELD_KEYS = [
  'desiredOutcome',
  'primaryUseCase',
  'responsePriorities',
  'tonalGoals',
  'sizeDirection',
  'shellWoodDirection',
  'hardwareDirection',
  'visualDirection',
  'finishDirection',
  'painPoints',
];

const FIELD_META = {
  desiredOutcome: {
    label: 'Desired Outcome',
    questionnairePath: 'desiredOutcome',
    consultationPath: 'desiredOutcome',
    placeholder: 'What is this drum ultimately meant to become?',
  },
  primaryUseCase: {
    label: 'Primary Use Case',
    questionnairePath: 'primaryUseCase',
    consultationPath: 'primaryUseCase',
    placeholder: 'Live, studio, both, collecting, etc.',
  },
  responsePriorities: {
    label: 'Response Priorities',
    questionnairePath: 'responsePriorities',
    consultationPath: 'responsePriorities',
    placeholder: 'Fast response, low-volume sensitivity, articulation, etc.',
  },
  tonalGoals: {
    label: 'Tonal Goals',
    questionnairePath: 'tonalGoals',
    consultationPath: 'tonalGoals',
    placeholder: 'Warm, dry, fat, articulate, open, controlled, etc.',
  },
  sizeDirection: {
    label: 'Size Direction',
    questionnairePath: 'preferredSizeDirection',
    consultationPath: 'preferredSizeDirection',
    placeholder: '12", 13", 14", 14x6.5, still open, etc.',
  },
  shellWoodDirection: {
    label: 'Shell / Wood Direction',
    questionnairePath: 'woodPreference',
    consultationPath: 'woodPreference',
    placeholder: 'Maple, walnut, stave, builder-led, still open, etc.',
  },
  hardwareDirection: {
    label: 'Hardware Direction',
    questionnairePath: 'hardwareFinish',
    consultationPath: 'hardwareFinish',
    placeholder: 'Chrome, brass/gold, black nickel, still open, etc.',
  },
  visualDirection: {
    label: 'Visual Direction',
    questionnairePath: 'finishDirection',
    consultationPath: 'visualMood',
    placeholder: 'Natural, brushed metal, dark, resin, understated, etc.',
  },
  finishDirection: {
    label: 'Finish Direction',
    questionnairePath: 'finishDirection',
    consultationPath: 'finishDirection',
    placeholder: 'Gloss, satin, oil, natural, resin-accented, still open, etc.',
  },
  painPoints: {
    label: 'Pain Points / Current Frustrations',
    questionnairePath: null,
    consultationPath: 'currentPainPoints',
    placeholder:
      'What is not working in their current setup or current snares?',
  },
};

const VALIDATION_OPTIONS = [
  { value: 'unreviewed', label: 'Not Reviewed' },
  { value: 'valid', label: 'Valid' },
  { value: 'changed', label: 'Changed' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'open', label: 'Still Open' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const REVIEW_STATE_OPTIONS = [
  { value: 'clarify', label: 'Open Question' },
  { value: 'verify', label: 'Needs Confirming' },
  { value: 'confirmed', label: 'Locked In' },
];

const getReviewStatePillClass = (reviewState) => {
  if (reviewState === 'confirmed') return 'is-good';
  if (reviewState === 'verify') return 'is-medium';
  return 'is-soft';
};

const emptyRow = () => ({
  consultValue: '',
  status: 'unreviewed',
  confidence: 'unknown',
  rationale: '',
  followUpNeeded: false,
  followUpQuestion: '',
  reviewState: '',
});

const cleanText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCompare = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isEmptyish = (value) => {
  const text = normalizeCompare(value);
  return (
    !text ||
    [
      '—',
      '-',
      'n/a',
      'na',
      'none',
      'unknown',
      'not sure',
      'unsure',
      'tbd',
      'idk',
      "i don't know",
      'i dont know',
      'guide me',
      'still open',
      'open',
      "i'm",
      'im',
    ].includes(text)
  );
};

const isBuilderLed = (value) => {
  const text = normalizeCompare(value);
  return (
    text.includes('trust your recommendation') ||
    text.includes('builder recommendation') ||
    text.includes('guide me') ||
    text.includes('not sure') ||
    text.includes('still open')
  );
};

const getDisplayValue = (value, fallback = '—') => {
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }
  const text = cleanText(value);
  return text || fallback;
};

const safeDateLabel = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const IntakeDirectionSection = ({
  storyEngineData,
  setStoryEngineData,
  deriveCustomerName,
  projectData,
  handleGenerateConsultationSummary,
  storyEngineRunning,
  isNormalizingTranscript,
  normalizedTranscriptTurns,
  buildSmartTranscriptTurns,
  saveStoryEngineToProject,
}) => {
  const questionnaireMapped = storyEngineData?.questionnaireMapped || {};
  const consultationMapped = storyEngineData?.consultationMapped || {};

  const artistDisplayName =
    consultationMapped?.artistName ||
    questionnaireMapped?.artistName ||
    deriveCustomerName(projectData) ||
    'Artist';

  const discoveryWorkspace = storyEngineData?.discoveryWorkspace || {};
  const intakeState = discoveryWorkspace?.intake || {};
  const consultState = discoveryWorkspace?.consult || {};
  const summaryState = discoveryWorkspace?.summary || {};

  const intakeLocked = !!intakeState?.completed;
  const consultLocked = !!consultState?.completed;
  const summaryGenerated = !!summaryState?.generated;

  const [snapshotOpen, setSnapshotOpen] = useState(true);
  const [intakeOpen, setIntakeOpen] = useState(true);
  const [consultOpen, setConsultOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    setSnapshotOpen(!summaryGenerated);
    setIntakeOpen(!intakeLocked);
    setConsultOpen(!consultLocked);
    setSummaryOpen(summaryGenerated);
  }, [intakeLocked, consultLocked, summaryGenerated]);

  const questionnaireBoard = useMemo(() => {
    const cleanBullet = (value, fallback = '') => {
      const text = cleanText(value);
      if (!text || isEmptyish(text)) return fallback;
      return text;
    };

    const buildKnown = [];
    const buildUnknown = [];
    const playingKnown = [];
    const playingUnknown = [];
    const soundKnown = [];
    const soundUnknown = [];

    const desiredOutcome = cleanBullet(questionnaireMapped?.desiredOutcome);
    const playerProfile = cleanBullet(questionnaireMapped?.styleOfPlaying);
    const playSettings = cleanBullet(questionnaireMapped?.influenceReferences);
    const genreContext = cleanBullet(questionnaireMapped?.genreContext);
    const responsePriorities = cleanBullet(
      questionnaireMapped?.responsePriorities
    );
    const tonalGoals = cleanBullet(questionnaireMapped?.tonalGoals);
    const sizeDirection = cleanBullet(
      questionnaireMapped?.preferredSizeDirection
    );
    const shellWoodDirection = cleanBullet(questionnaireMapped?.woodPreference);
    const hardwareDirection = cleanBullet(questionnaireMapped?.hardwareFinish);
    const visualDirection = cleanBullet(questionnaireMapped?.finishDirection);
    const buildClarity = cleanBullet(questionnaireMapped?.buildClarity);

    if (playerProfile) playingKnown.push(playerProfile);
    if (playSettings) playingKnown.push(playSettings);
    if (genreContext) playingKnown.push(genreContext);

    if (!playerProfile) {
      playingUnknown.push('Player type is still unclear.');
    }

    if (desiredOutcome) soundKnown.push(desiredOutcome);
    if (responsePriorities) soundKnown.push(responsePriorities);
    if (tonalGoals) soundKnown.push(tonalGoals);

    if (!desiredOutcome) {
      soundUnknown.push('Core outcome is still unclear.');
    }

    soundUnknown.push(
      'Pain points or current snare frustrations are not yet clearly defined.'
    );

    if (sizeDirection) buildKnown.push(sizeDirection);
    if (visualDirection) buildKnown.push(visualDirection);
    if (buildClarity) buildKnown.push(buildClarity);

    if (
      !shellWoodDirection ||
      shellWoodDirection.toLowerCase().includes('still open') ||
      shellWoodDirection.toLowerCase().includes('not sure') ||
      shellWoodDirection.toLowerCase().includes('needs consult validation')
    ) {
      buildUnknown.push(
        'Shell / wood direction still needs consult validation.'
      );
    } else {
      buildKnown.push(shellWoodDirection);
    }

    if (
      !hardwareDirection ||
      hardwareDirection.toLowerCase().includes('still open') ||
      hardwareDirection.toLowerCase().includes('not sure') ||
      hardwareDirection.toLowerCase().includes('needs consult validation')
    ) {
      buildUnknown.push('Hardware finish is still not truly decided.');
    } else {
      buildKnown.push(hardwareDirection);
    }

    return [
      {
        key: 'playingWorld',
        icon: '◎',
        title: 'Playing World',
        known: playingKnown,
        unknown: playingUnknown,
      },
      {
        key: 'soundGoals',
        icon: '◉',
        title: 'Sound Goals',
        known: soundKnown,
        unknown: soundUnknown,
      },
      {
        key: 'buildDirection',
        icon: '⬡',
        title: 'Build Direction',
        known: buildKnown,
        unknown: buildUnknown,
      },
    ];
  }, [questionnaireMapped]);

  const effectiveConsultRows = useMemo(() => {
  const savedRows = consultState?.rows || {};

  return FIELD_KEYS.map((fieldKey) => {
    const meta = FIELD_META[fieldKey];
    const questionnaireValue = meta.questionnairePath
      ? questionnaireMapped?.[meta.questionnairePath] || ''
      : '';

    const consultMappedValue = meta.consultationPath
      ? consultationMapped?.[meta.consultationPath] || ''
      : '';

    const existing = savedRows?.[fieldKey] || emptyRow();

    return {
      key: fieldKey,
      label: meta.label,
      questionnaireValue,
      consultValue:
        existing.consultValue !== undefined && existing.consultValue !== null
          ? existing.consultValue
          : consultMappedValue,
      status: existing.status || 'unreviewed',
      confidence: existing.confidence || 'unknown',
      rationale: existing.rationale || '',
      followUpNeeded: !!existing.followUpNeeded,
      followUpQuestion: existing.followUpQuestion || '',
      reviewState: existing.reviewState || '',
      placeholder: meta.placeholder,
    };
  });
}, [consultState?.rows, consultationMapped, questionnaireMapped]);

  const smartTranscriptTurns =
    Array.isArray(normalizedTranscriptTurns) && normalizedTranscriptTurns.length
      ? normalizedTranscriptTurns
      : buildSmartTranscriptTurns?.(
          storyEngineData?.consultationTranscript || '',
          artistDisplayName
        ) || [];

  const updateDiscoveryWorkspace = (updater) => {
    setStoryEngineData((prev) => {
      const currentWorkspace = prev?.discoveryWorkspace || {};
      const nextWorkspace =
        typeof updater === 'function' ? updater(currentWorkspace) : updater;

      return {
        ...prev,
        discoveryWorkspace: nextWorkspace,
      };
    });
  };

  const updateConsultRow = (fieldKey, patch) => {
    if (consultLocked) return;

    updateDiscoveryWorkspace((current) => {
      const currentRows = current?.consult?.rows || {};
      const existing = currentRows?.[fieldKey] || emptyRow();

      return {
        ...current,
        consult: {
          ...(current?.consult || {}),
          rows: {
            ...currentRows,
            [fieldKey]: {
              ...existing,
              ...patch,
            },
          },
        },
      };
    });
  };

  const updateConsultMeta = (patch) => {
    if (consultLocked) return;

    updateDiscoveryWorkspace((current) => ({
      ...current,
      consult: {
        ...(current?.consult || {}),
        ...patch,
      },
    }));
  };

  const updateIntakeMeta = (patch) => {
    if (intakeLocked) return;

    updateDiscoveryWorkspace((current) => ({
      ...current,
      intake: {
        ...(current?.intake || {}),
        ...patch,
      },
    }));
  };

  const updateSummaryMeta = (patch) => {
    updateDiscoveryWorkspace((current) => ({
      ...current,
      summary: {
        ...(current?.summary || {}),
        ...patch,
      },
    }));
  };

  const handleMarkIntakeComplete = async () => {
    if (intakeLocked) return;

    const nextDiscoveryWorkspace = {
      ...discoveryWorkspace,
      intake: {
        ...(discoveryWorkspace?.intake || {}),
        completed: true,
        completedAt: new Date().toISOString(),
      },
    };

    setStoryEngineData((prev) => ({
      ...prev,
      discoveryWorkspace: nextDiscoveryWorkspace,
    }));

    if (typeof saveStoryEngineToProject === 'function') {
      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: storyEngineData.consultationTranscript || '',
          consultationTranscriptTurns: Array.isArray(normalizedTranscriptTurns)
            ? normalizedTranscriptTurns
            : [],
          consultationSummary: storyEngineData.consultationSummary || '',
          adminNotes: storyEngineData.adminNotes || '',
          questionnaireRaw: storyEngineData.questionnaireRaw || '',
          questionnaireMapped: storyEngineData.questionnaireMapped || {},
          consultationMapped: storyEngineData.consultationMapped || {},
          discoveryWorkspace: nextDiscoveryWorkspace,
        },
        record: storyEngineData.engineRecord || null,
        draftPreview: storyEngineData.draftPreview || null,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMarkConsultComplete = async () => {
    if (consultLocked) return;

    const nextDiscoveryWorkspace = {
      ...discoveryWorkspace,
      consult: {
        ...(discoveryWorkspace?.consult || {}),
        completed: true,
        completedAt: new Date().toISOString(),
        rows: discoveryWorkspace?.consult?.rows || {},
      },
    };

    setStoryEngineData((prev) => ({
      ...prev,
      discoveryWorkspace: nextDiscoveryWorkspace,
    }));

    if (typeof saveStoryEngineToProject === 'function') {
      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: storyEngineData.consultationTranscript || '',
          consultationTranscriptTurns: Array.isArray(normalizedTranscriptTurns)
            ? normalizedTranscriptTurns
            : [],
          consultationSummary: storyEngineData.consultationSummary || '',
          adminNotes: storyEngineData.adminNotes || '',
          questionnaireRaw: storyEngineData.questionnaireRaw || '',
          questionnaireMapped: storyEngineData.questionnaireMapped || {},
          consultationMapped: storyEngineData.consultationMapped || {},
          discoveryWorkspace: nextDiscoveryWorkspace,
        },
        record: storyEngineData.engineRecord || null,
        draftPreview: storyEngineData.draftPreview || null,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
  };

  const generatedIntelliSummary = useMemo(() => {
    const rows = effectiveConsultRows;

    const trustedSignals = [];
    const changedSignals = [];
    const conflictedSignals = [];
    const stillOpen = [];
    const followUps = [];
    const builderResearch = [];
    const confidenceRows = [];
    const nextSteps = [];

    rows.forEach((row) => {
      const qValue = cleanText(row.questionnaireValue);
      const cValue = cleanText(row.consultValue);
      const status = row.status;
      const confidence = row.confidence;
      const rationale = cleanText(row.rationale);
      const finalValue =
        status === 'changed' || status === 'valid'
          ? cValue || qValue
          : status === 'invalid'
            ? ''
            : status === 'open'
              ? cValue || qValue
              : cValue || qValue;

      if (
        (status === 'valid' || status === 'changed') &&
        !isEmptyish(finalValue)
      ) {
        const entry = {
          label: row.label,
          value: finalValue,
          confidence,
          rationale:
            rationale ||
            (status === 'changed'
              ? 'Consult call changed or clarified the original intake.'
              : 'Questionnaire and consult review support this direction.'),
        };

        if (status === 'changed') {
          changedSignals.push(entry);
        } else {
          trustedSignals.push(entry);
        }
      }

      if (
        status === 'changed' &&
        !isEmptyish(qValue) &&
        !isEmptyish(cValue) &&
        normalizeCompare(qValue) !== normalizeCompare(cValue)
      ) {
        conflictedSignals.push({
          label: row.label,
          from: qValue,
          to: cValue,
          rationale:
            rationale ||
            'The consultation updated or corrected the original questionnaire answer.',
        });
      }

      if (
        status === 'open' ||
        confidence === 'low' ||
        confidence === 'unknown' ||
        isEmptyish(finalValue) ||
        isBuilderLed(finalValue)
      ) {
        stillOpen.push({
          label: row.label,
          note:
            row.followUpQuestion ||
            rationale ||
            `This field is not strong enough yet to treat as locked.`,
        });
      }

      if (row.followUpNeeded) {
        followUps.push({
          label: row.label,
          question:
            row.followUpQuestion ||
            `Follow up with the artist to confirm ${row.label.toLowerCase()}.`,
        });
      }

      if (
        row.key === 'shellWoodDirection' &&
        (status === 'open' || confidence === 'low' || isBuilderLed(finalValue))
      ) {
        builderResearch.push(
          'Determine whether shell architecture should remain builder-led or be narrowed based on the target response and use case.'
        );
      }

      if (
        row.key === 'sizeDirection' &&
        (status === 'open' || confidence === 'low')
      ) {
        builderResearch.push(
          'Confirm whether size is truly settled before translating discovery into build specs.'
        );
      }

      if (
        row.key === 'painPoints' &&
        (status === 'open' || isEmptyish(finalValue))
      ) {
        builderResearch.push(
          'Clarify what is not working in the artist’s current drum or setup so this build solves a real problem.'
        );
      }

      confidenceRows.push({
        label: row.label,
        value: getDisplayValue(finalValue),
        confidence: confidence,
        rationale:
          rationale ||
          (confidence === 'high'
            ? 'Well supported by reviewed intake and consult direction.'
            : confidence === 'medium'
              ? 'Useful, but still needs some caution.'
              : confidence === 'low'
                ? 'Too soft to treat as settled.'
                : 'Not enough support yet.'),
      });
    });

    if (trustedSignals.length) {
      nextSteps.push(
        'Promote the strongest reviewed signals into the Craftsman Master Tool as the current working direction.'
      );
    }

    if (conflictedSignals.length) {
      nextSteps.push(
        'Resolve changed or conflicting fields before translating them into final build specs.'
      );
    }

    if (stillOpen.length) {
      nextSteps.push(
        'Treat still-open categories as intentionally unresolved rather than guessing downstream.'
      );
    }

    if (followUps.length) {
      nextSteps.push(
        'Make artist follow-up part of the handoff instead of leaving unknowns implicit.'
      );
    }

    const overviewSentenceParts = [];

    const strongestHighConfidence = confidenceRows.filter(
      (row) => row.confidence === 'high'
    );

    if (strongestHighConfidence.length) {
      const firstTwo = strongestHighConfidence.slice(0, 2);
      overviewSentenceParts.push(
        `The strongest current discovery signals are ${firstTwo
          .map((item) => `${item.label.toLowerCase()} (${item.value})`)
          .join(' and ')}.`
      );
    }

    if (changedSignals.length) {
      overviewSentenceParts.push(
        `${changedSignals.length} field${
          changedSignals.length === 1 ? '' : 's'
        } changed during consultation and should trust consult validation over the original questionnaire.`
      );
    }

    if (stillOpen.length) {
      overviewSentenceParts.push(
        `${stillOpen.length} field${
          stillOpen.length === 1 ? '' : 's'
        } still need clarification before deeper build-direction work.`
      );
    }

    if (!overviewSentenceParts.length) {
      overviewSentenceParts.push(
        'Discovery data has been reviewed, but not enough strong signal exists yet to promote a confident working build direction.'
      );
    }

    return {
      overview: overviewSentenceParts.join(' '),
      trustedSignals,
      changedSignals,
      conflictedSignals,
      stillOpen,
      followUps,
      builderResearch: [...new Set(builderResearch)],
      confidenceRows,
      nextSteps,
    };
  }, [effectiveConsultRows]);

  useEffect(() => {
    if (!intakeLocked || !consultLocked || summaryGenerated) return;

    updateDiscoveryWorkspace((current) => ({
      ...current,
      summary: {
        ...(current?.summary || {}),
        generated: true,
        generatedAt: new Date().toISOString(),
        editableText: generatedIntelliSummary.overview,
        structured: generatedIntelliSummary,
      },
    }));
  }, [consultLocked, generatedIntelliSummary, intakeLocked, summaryGenerated]);

  const summaryText =
    summaryState?.editableText || generatedIntelliSummary.overview || '';

  const intakeStatusLabel = intakeLocked ? 'Reviewed' : 'Active';
  const consultStatusLabel = consultLocked ? 'Completed' : 'Active';

  const questionnaireReceived =
    !!cleanText(storyEngineData?.questionnaireRaw) ||
    questionnaireBoard.some(
      (section) => section.known.length > 0 || section.unknown.length > 0
    );

  const questionnaireStatus = questionnaireReceived ? 'Received' : 'Incomplete';

const reviewedConsultRows = effectiveConsultRows.map((row) => {
  const questionnaireValue = cleanText(row.questionnaireValue);
  const consultValue = cleanText(row.consultValue);

  const finalValue =
    row.status === 'changed' || row.status === 'valid'
      ? consultValue || questionnaireValue
      : row.status === 'invalid'
        ? ''
        : consultValue || questionnaireValue;

  let autoSuggestedReviewState = 'verify';

  if (
    row.status === 'open' ||
    row.status === 'unreviewed' ||
    row.status === 'invalid' ||
    row.confidence === 'low' ||
    row.confidence === 'unknown' ||
    isEmptyish(finalValue) ||
    isBuilderLed(finalValue)
  ) {
    autoSuggestedReviewState = 'clarify';
  } else if (
    (row.status === 'valid' || row.status === 'changed') &&
    !isEmptyish(finalValue) &&
    row.confidence !== 'low' &&
    row.confidence !== 'unknown'
  ) {
    autoSuggestedReviewState = 'confirmed';
  }

  const finalReviewState =
    row.reviewState && row.reviewState.trim()
      ? row.reviewState
      : autoSuggestedReviewState;

  return {
    ...row,
    finalValue,
    autoSuggestedReviewState,
    reviewState: finalReviewState,
  };
});

const confirmedCallItems = reviewedConsultRows.filter(
  (row) => row.reviewState === 'confirmed'
);

const verifyCallItems = reviewedConsultRows.filter(
  (row) => row.reviewState === 'verify'
);

const clarificationItems = reviewedConsultRows.filter(
  (row) => row.reviewState === 'clarify'
);

  const getClarifierWhy = (row) => {
    if (row.key === 'painPoints') {
      return 'If we do not know what is failing in the current setup, we risk building toward a vague ideal instead of solving a real problem.';
    }

    if (row.key === 'shellWoodDirection') {
      return 'Shell direction affects feel, response, and how much of the build should stay builder-led versus artist-led.';
    }

    if (row.key === 'sizeDirection') {
      return 'Size strongly shapes feel, tuning behavior, and overall role of the drum.';
    }

    if (row.key === 'hardwareDirection') {
      return 'Hardware finish may seem visual, but it often signals how resolved the broader visual direction really is.';
    }

    if (row.key === 'desiredOutcome') {
      return 'If the true goal is soft or unclear, the rest of the build can drift into generic choices.';
    }

    if (row.key === 'responsePriorities') {
      return 'This helps translate broad tonal language into usable performance priorities.';
    }

    if (row.key === 'tonalGoals') {
      return 'Clear tonal language helps protect the build from vague or conflicting interpretation later.';
    }

    if (row.key === 'visualDirection' || row.key === 'finishDirection') {
      return 'Visual direction helps determine whether the build should feel restrained, bold, organic, heirloom, or more statement-driven.';
    }

    if (row.key === 'primaryUseCase') {
      return 'Knowing where the drum must live most often helps prioritize response, mix behavior, and feel.';
    }

    return 'This area is not strong enough yet to treat as truly confirmed.';
  };

  const getClarifierQuestions = (row) => {
    if (row.followUpQuestion) return [row.followUpQuestion];

    switch (row.key) {
      case 'painPoints':
        return [
          'What is your current snare not doing for you?',
          'Is the issue tone, feel, tuning range, sensitivity, or mixability?',
          'Have you owned something close before that still missed the mark?',
        ];

      case 'shellWoodDirection':
        return [
          'Do you want me to lead more here, or do you already have a material instinct?',
          'Would you rather optimize for warmth, articulation, dryness, complexity, or feel?',
          'Does shell choice matter more tonally to you, visually, or both?',
        ];

      case 'sizeDirection':
        return [
          'Does a certain diameter or depth already feel right in your hands?',
          'Are you after a more compact feel, a deeper feel, or are you still open?',
          'Is size already decided, or should we keep it open while we confirm sound goals?',
        ];

      case 'hardwareDirection':
        return [
          'Does the hardware finish feel truly decided, or just loosely preferred right now?',
          'Do you want the hardware to disappear into the build or help define the look?',
          'Should we keep hardware open until shell and finish direction are firmer?',
        ];

      case 'desiredOutcome':
        return [
          'What do you most want this drum to become for you?',
          'Is this meant to be a daily main snare, a studio piece, a collector piece, or something else?',
          'What would make this feel like the right build when it is done?',
        ];

      case 'responsePriorities':
        return [
          'What matters more here: sensitivity, control, body, openness, crack, or flexibility?',
          'What should this drum do easily that others have not done well for you?',
          'When you play softly, what do you want to feel back from the drum?',
        ];

      case 'tonalGoals':
        return [
          'When you hear the drum in your head, what words feel most true?',
          'Do you want it to stay controlled, open up more, or live somewhere in between?',
          'Are there recordings or existing drums that are close to what you mean?',
        ];

      case 'visualDirection':
      case 'finishDirection':
        return [
          'Do you want this build to feel understated, bold, organic, heirloom, modern, or something else?',
          'Should the look feel quieter and timeless, or more statement-driven?',
          'What visual choices already feel real, and what is still open?',
        ];

      case 'primaryUseCase':
        return [
          'Will this live mostly in the studio, on stage, at home, or across everything?',
          'What environments does it need to succeed in most often?',
          'Should we optimize this as a specialist or an all-arounder?',
        ];

      default:
        return [
          `What feels most true right now about ${row.label.toLowerCase()}?`,
          `What still feels open or undecided about ${row.label.toLowerCase()}?`,
        ];
    }
  };

  const callRhythmSections = [
    {
      key: 'agenda',
      title: 'Call agenda',
      bullets: [
        'Quick welcome + set the tone',
        'Explain how I approach the process',
        'Confirm what already feels true from intake',
        'Clarify missing or uncertain build direction',
        'Talk through sound, feel, use case, and pain points',
        'Talk through artist story, influences, and what is happening in life/music right now',
        'Wrap with what feels confirmed, what stays open, and next steps',
      ],
    },
    {
      key: 'opening',
      title: 'Introduction',
      script:
        'Thanks again for taking the time to do this. My goal today is just to understand what you are really after, what already feels true, and where I can help guide things without forcing decisions too fast.',
    },
    {
      key: 'mission',
      title: 'My mission and values',
      script:
        'My job here is not to push you into answers before they are ready. I want to listen well, protect what already feels real, and keep the wrong things open rather than locking them too early.',
    },
    {
      key: 'no-pressure',
      title: 'Reiterate no pressure',
      script:
        'We do not need to force every detail today. If some things are clear, great. If some things are still open, that is completely fine too. I would rather leave something open than lock in the wrong thing.',
    },
    {
      key: 'goals',
      title: 'What I want to get out of the call',
      bullets: [
        'Confirm what already seems real',
        'Catch what changed from intake',
        'Clarify pain points and sound priorities',
        'Understand build and visual direction',
        'Separate artist preference from builder-led areas',
        'Learn more about the artist behind the drum',
      ],
    },
    {
      key: 'relationship',
      title: 'Artist story & relationship',
      bullets: [
        'What first pulled you into drumming?',
        'What keeps you connected to it now?',
        'Who are your biggest influences right now?',
        'When you are not drumming, what are you usually doing?',
        'What is your favorite part about playing?',
        'Any upcoming shows, clinics, festivals, sessions, or projects?',
      ],
    },
    {
      key: 'stuck',
      title: 'If I get stuck',
      bullets: [
        'Tell me about where your current snare feels right — and where it does not.',
        'When you imagine this drum in the room, what do you want to feel immediately?',
        'What matters more here: sensitivity, body, control, openness, or flexibility?',
        'Which parts feel decided already, and which parts are still open?',
        'What should I understand about you as a player before I make assumptions about the drum?',
      ],
    },
  ];

  return (
    <div className="idv-shell">
      <div className="idv-header">
        <div>
          <div className="idv-kicker">Intake & Direction</div>
          <h3 className="idv-title">Discovery Workspace</h3>
          <p className="idv-subtitle">
            Keep discovery simple: receive the questionnaire, validate it during
            the consult, then create one intelligent handoff summary that is
            actually useful for the next step.
          </p>
        </div>
      </div>

      <div className="idv-timeline">
        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Questionnaire</span>
          <span
            className={`idv-status-pill ${questionnaireReceived ? 'is-good' : 'is-soft'}`}
          >
            {questionnaireStatus}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Intake Review</span>
          <span
            className={`idv-status-pill ${intakeLocked ? 'is-good' : 'is-soft'}`}
          >
            {intakeStatusLabel}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Consultation</span>
          <span
            className={`idv-status-pill ${consultLocked ? 'is-good' : 'is-soft'}`}
          >
            {consultStatusLabel}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">IntelliSummary</span>
          <span
            className={`idv-status-pill ${summaryGenerated ? 'is-good' : 'is-soft'}`}
          >
            {summaryGenerated ? 'Generated' : 'Waiting'}
          </span>
        </div>
      </div>

      {summaryGenerated && (
        <section className="idv-summary-hero">
          <button
            type="button"
            className="idv-section-toggle"
            onClick={() => setSummaryOpen((prev) => !prev)}
          >
            <div className="idv-section-toggle-copy">
              <span className="idv-section-kicker">
                Discovery IntelliSummary
              </span>
              <h4>Reviewed intake + consult handoff</h4>
              <p>
                This becomes the useful piece of discovery data to move forward
                into the Craftsman Master Tool.
              </p>
            </div>
            <div className="idv-section-toggle-right">
              <span className="idv-status-pill is-good">Generated</span>
              <span className="idv-toggle-icon">{summaryOpen ? '−' : '+'}</span>
            </div>
          </button>

          {summaryOpen && (
            <div className="idv-section-body">
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Editable Summary</span>
                  <h5>Builder-facing discovery handoff</h5>
                </div>

                <textarea
                  className="idv-textarea idv-summary-textarea"
                  rows={5}
                  value={summaryText}
                  onChange={(e) =>
                    updateSummaryMeta({
                      editableText: e.target.value,
                    })
                  }
                  placeholder="The discovery handoff summary will appear here once questionnaire review and consultation are both completed."
                />
              </div>

              <div className="idv-grid-2">
                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Trusted Signals</span>
                    <h5>Safe to promote forward</h5>
                  </div>

                  {generatedIntelliSummary.trustedSignals.length ? (
                    <div className="idv-list-stack">
                      {generatedIntelliSummary.trustedSignals.map((item) => (
                        <div key={item.label} className="idv-info-row">
                          <div className="idv-info-row-top">
                            <strong>{item.label}</strong>
                            <span
                              className={`idv-confidence-pill is-${item.confidence || 'unknown'}`}
                            >
                              {(item.confidence || 'unknown').toUpperCase()}
                            </span>
                          </div>
                          <div className="idv-info-row-value">{item.value}</div>
                          <p>{item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="idv-empty">
                      No strong reviewed signals yet.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Changed In Consult</span>
                    <h5>Trust consult over questionnaire here</h5>
                  </div>

                  {generatedIntelliSummary.changedSignals.length ? (
                    <div className="idv-list-stack">
                      {generatedIntelliSummary.changedSignals.map((item) => (
                        <div key={item.label} className="idv-info-row">
                          <div className="idv-info-row-top">
                            <strong>{item.label}</strong>
                            <span
                              className={`idv-confidence-pill is-${item.confidence || 'unknown'}`}
                            >
                              {(item.confidence || 'unknown').toUpperCase()}
                            </span>
                          </div>
                          <div className="idv-info-row-value">{item.value}</div>
                          <p>{item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="idv-empty">
                      No consult-validated changes recorded.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Still Open</span>
                    <h5>Not ready to treat as locked</h5>
                  </div>

                  {generatedIntelliSummary.stillOpen.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.stillOpen.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No major open items detected.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Artist Follow-Up</span>
                    <h5>Questions still worth asking</h5>
                  </div>

                  {generatedIntelliSummary.followUps.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.followUps.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.question}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No explicit artist follow-up items were flagged.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Builder Research</span>
                    <h5>Internal work needed before spec translation</h5>
                  </div>

                  {generatedIntelliSummary.builderResearch.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.builderResearch.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No major builder research items flagged.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">
                      Recommended Next Steps
                    </span>
                    <h5>What should happen next</h5>
                  </div>

                  {generatedIntelliSummary.nextSteps.length ? (
                    <ol className="idv-list idv-list-ordered">
                      {generatedIntelliSummary.nextSteps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="idv-empty">
                      No specific next steps detected.
                    </div>
                  )}
                </div>
              </div>

              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">
                    Confidence By Category
                  </span>
                  <h5>Why the summary trusts what it trusts</h5>
                </div>

                <div className="idv-confidence-table">
                  {generatedIntelliSummary.confidenceRows.map((row) => (
                    <div key={row.label} className="idv-confidence-row">
                      <div className="idv-confidence-main">
                        <strong>{row.label}</strong>
                        <div className="idv-confidence-value">
                          {getDisplayValue(row.value)}
                        </div>
                      </div>
                      <div className="idv-confidence-side">
                        <span
                          className={`idv-confidence-pill is-${row.confidence || 'unknown'}`}
                        >
                          {(row.confidence || 'unknown').toUpperCase()}
                        </span>
                        <p>{row.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="idv-section">
        <button
          type="button"
          className="idv-section-toggle"
          onClick={() => setIntakeOpen((prev) => !prev)}
        >
          <div className="idv-section-toggle-copy">
            <span className="idv-section-kicker">Section 1</span>
            <h4>Questionnaire Intake</h4>
            <p>
              Receive the questionnaire, review what the artist submitted, and
              lock this section once it has been fully reviewed.
            </p>
          </div>
          <div className="idv-section-toggle-right">
            <span
              className={`idv-status-pill ${intakeLocked ? 'is-good' : 'is-soft'}`}
            >
              {intakeLocked ? 'Reviewed' : questionnaireStatus}
            </span>
            <span className="idv-toggle-icon">{intakeOpen ? '−' : '+'}</span>
          </div>
        </button>
        {intakeOpen && (
          <div className="idv-section-body">
            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">
                  Questionnaire Interpretation
                </span>
                <h5>What the intake is telling us vs. not telling us</h5>
              </div>

              <div className="idv-intake-board">
                <div className="idv-intake-board-head idv-intake-board-head--spacer" />
                <div className="idv-intake-board-head idv-intake-board-head--known">
                  What the intake is telling us
                </div>
                <div className="idv-intake-board-head idv-intake-board-head--unknown">
                  What the intake is not telling us
                </div>

                {questionnaireBoard.map((section) => (
                  <React.Fragment key={section.key}>
                    <div className="idv-intake-board-rowhead">
                      <span className="idv-intake-board-rowicon">
                        {section.icon}
                      </span>
                      <span className="idv-intake-board-rowtitle">
                        {section.title}
                      </span>
                    </div>

                    <div className="idv-intake-board-cell idv-intake-board-cell--known">
                      {section.known.length ? (
                        <ul className="idv-list">
                          {section.known.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="idv-empty">No strong signal yet.</div>
                      )}
                    </div>

                    <div className="idv-intake-board-cell idv-intake-board-cell--unknown">
                      {section.unknown.length ? (
                        <ul className="idv-list">
                          {section.unknown.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="idv-empty">
                          Nothing major missing here.
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="idv-action-row idv-action-row--end">
                <button
                  type="button"
                  className="idv-btn idv-btn-primary"
                  onClick={handleMarkIntakeComplete}
                  disabled={intakeLocked || !questionnaireReceived}
                >
                  {intakeLocked
                    ? 'Questionnaire Intake Locked'
                    : 'Mark Intake Reviewed'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="idv-section">
        <button
          type="button"
          className="idv-section-toggle"
          onClick={() => setConsultOpen((prev) => !prev)}
        >
          <div className="idv-section-toggle-copy">
            <span className="idv-section-kicker">Section 2</span>
            <h4>Consultation Validation</h4>
            <p>
              Validate questionnaire answers during the consult, paste
              transcript + craftsman notes, and lock this section once discovery
              review is complete.
            </p>
          </div>
          <div className="idv-section-toggle-right">
            <span
              className={`idv-status-pill ${consultLocked ? 'is-good' : 'is-soft'}`}
            >
              {consultLocked ? 'Completed' : 'Active'}
            </span>
            <span className="idv-toggle-icon">{consultOpen ? '−' : '+'}</span>
          </div>
        </button>

        {consultOpen && (
          <div className="idv-section-body">
            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Call Rhythm</span>
                <h5>Cheat sheet for call flow</h5>
              </div>

              <div className="idv-call-rhythm-stack">
                {callRhythmSections.map((section) => (
                  <div key={section.key} className="idv-call-rhythm-card">
                    <div className="idv-call-rhythm-title">{section.title}</div>

                    {section.script ? (
                      <p className="idv-call-rhythm-script">{section.script}</p>
                    ) : null}

                    {section.bullets?.length ? (
                      <ul className="idv-list">
                        {section.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Discovery Clarifier</span>
                <h5>What looks confirmed vs. what still needs clarification</h5>
              </div>

              <div className="idv-clarifier-overview">
                <div className="idv-clarifier-overview-head">
                  Discovery areas to protect on the call
                </div>

                <div className="idv-clarifier-overview-grid">
                  <div className="idv-clarifier-overview-item">
                    <strong>Build Specs</strong>
                    <span>
                      Size, shell direction, hardware direction, finish
                      direction
                    </span>
                  </div>

                  <div className="idv-clarifier-overview-item">
                    <strong>Feel + Sound</strong>
                    <span>
                      Desired outcome, tonal goals, response priorities
                    </span>
                  </div>

                  <div className="idv-clarifier-overview-item">
                    <strong>Use + Environment</strong>
                    <span>
                      Primary use case, stage/studio/home context, role of the
                      drum
                    </span>
                  </div>

                  <div className="idv-clarifier-overview-item">
                    <strong>Pain Points</strong>
                    <span>
                      Accessibility needs, frustrations, what current drums are
                      missing
                    </span>
                  </div>
                </div>
              </div>

              <div className="idv-clarifier-columns idv-clarifier-columns-triple">
                <div className="idv-clarifier-column">
                  <div className="idv-clarifier-column-head idv-clarifier-column-head--good">
                    Confirmed / Stronger Signal
                  </div>

                  <div className="idv-clarifier-stack">
                    {confirmedCallItems.length ? (
                      confirmedCallItems.map((row) => (
                        <div
                          key={row.key}
                          className="idv-clarifier-card idv-clarifier-card--good"
                        >
                          <div className="idv-clarifier-top">
                            <strong>{row.label}</strong>
                            <span
                              className={`idv-status-pill ${getReviewStatePillClass(row.reviewState)}`}
                            >
                              Green
                            </span>
                          </div>

                          <div className="idv-clarifier-value">
                            {getDisplayValue(row.finalValue)}
                          </div>

                          <p className="idv-clarifier-copy">
                            {row.rationale ||
                              'This appears strong enough to confirm briefly on the call rather than rediscover from scratch.'}
                          </p>

                          <ul className="idv-list">
                            <li>
                              “Here’s what I think I’m hearing — does that still
                              feel right?”
                            </li>
                          </ul>

                          <div className="idv-field" style={{ marginTop: 12 }}>
                            <label className="idv-field-label">Move Item</label>
                            <select
                              value={row.reviewState}
                              onChange={(e) =>
                                updateConsultRow(row.key, {
                                  reviewState: e.target.value,
                                })
                              }
                              disabled={consultLocked}
                            >
                              {REVIEW_STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="idv-empty">
                        No strongly confirmed call items yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="idv-clarifier-column">
                  <div className="idv-clarifier-column-head idv-clarifier-column-head--verify">
                    Needs Verification
                  </div>

                  <div className="idv-clarifier-stack">
                    {verifyCallItems.length ? (
                      verifyCallItems.map((row) => (
                        <div
                          key={row.key}
                          className="idv-clarifier-card idv-clarifier-card--verify"
                        >
                          <div className="idv-clarifier-top">
                            <strong>{row.label}</strong>
                            <span
                              className={`idv-status-pill ${getReviewStatePillClass(row.reviewState)}`}
                            >
                              Yellow
                            </span>
                          </div>

                          <div className="idv-clarifier-value">
                            Current signal: {getDisplayValue(row.finalValue)}
                          </div>

                          <p className="idv-clarifier-copy">
                            This looks directionally useful, but should still be
                            confirmed out loud before treating it as locked.
                          </p>

                          <ul className="idv-list">
                            <li>
                              “This sounds directionally right to me — do you
                              want to keep this in play?”
                            </li>
                          </ul>

                          <div className="idv-field" style={{ marginTop: 12 }}>
                            <label className="idv-field-label">Move Item</label>
                            <select
                              value={row.reviewState}
                              onChange={(e) =>
                                updateConsultRow(row.key, {
                                  reviewState: e.target.value,
                                })
                              }
                              disabled={consultLocked}
                            >
                              {REVIEW_STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="idv-empty">
                        No items currently waiting on verbal verification.
                      </div>
                    )}
                  </div>
                </div>

                <div className="idv-clarifier-column">
                  <div className="idv-clarifier-column-head idv-clarifier-column-head--warn">
                    Needs Clarification
                  </div>

                  <div className="idv-clarifier-stack">
                    {clarificationItems.length ? (
                      clarificationItems.map((row) => (
                        <div
                          key={row.key}
                          className="idv-clarifier-card idv-clarifier-card--warn"
                        >
                          <div className="idv-clarifier-top">
                            <strong>{row.label}</strong>
                            <span
                              className={`idv-status-pill ${getReviewStatePillClass(row.reviewState)}`}
                            >
                              Red
                            </span>
                          </div>

                          <div className="idv-clarifier-value">
                            Current signal: {getDisplayValue(row.finalValue)}
                          </div>

                          <p className="idv-clarifier-copy">
                            {getClarifierWhy(row)}
                          </p>

                          <ul className="idv-list">
                            {getClarifierQuestions(row).map((question) => (
                              <li key={question}>{question}</li>
                            ))}
                          </ul>

                          <div className="idv-field" style={{ marginTop: 12 }}>
                            <label className="idv-field-label">Move Item</label>
                            <select
                              value={row.reviewState}
                              onChange={(e) =>
                                updateConsultRow(row.key, {
                                  reviewState: e.target.value,
                                })
                              }
                              disabled={consultLocked}
                            >
                              {REVIEW_STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="idv-empty">
                        No major clarification gaps detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Actions</span>
                <h5>Consult processing</h5>
              </div>

              <div className="idv-action-stack">
                <button
                  type="button"
                  className="idv-btn idv-btn-secondary"
                  onClick={handleGenerateConsultationSummary}
                  disabled={
                    consultLocked ||
                    storyEngineRunning ||
                    isNormalizingTranscript ||
                    !cleanText(storyEngineData?.consultationTranscript)
                  }
                >
                  {isNormalizingTranscript
                    ? 'Processing…'
                    : 'Format + Summarize Call'}
                </button>

                <button
                  type="button"
                  className="idv-btn idv-btn-primary"
                  onClick={handleMarkConsultComplete}
                  disabled={consultLocked}
                >
                  {consultLocked
                    ? 'Consultation Locked'
                    : 'Mark Consultation Complete'}
                </button>
              </div>

              <div className="idv-meta-row" style={{ marginTop: 14 }}>
                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Transcript</span>
                  <strong>
                    {cleanText(storyEngineData?.consultationTranscript)
                      ? 'Added'
                      : 'Missing'}
                  </strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Internal Notes</span>
                  <strong>
                    {cleanText(storyEngineData?.adminNotes)
                      ? 'Added'
                      : 'Missing'}
                  </strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Completed At</span>
                  <strong>{safeDateLabel(consultState?.completedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="idv-grid-2">
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Call Capture</span>
                  <h5>Paste consultation transcript</h5>
                </div>

                <textarea
                  className="idv-textarea idv-textarea-tall"
                  rows={14}
                  value={storyEngineData?.consultationTranscript || ''}
                  onChange={(e) => {
                    if (consultLocked) return;
                    setStoryEngineData((prev) => ({
                      ...prev,
                      consultationTranscript: e.target.value,
                    }));
                  }}
                  disabled={consultLocked}
                  placeholder="Paste the consultation transcript here..."
                />
              </div>

              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Craftsman Notes</span>
                  <h5>Internal-only observations</h5>
                </div>

                <textarea
                  className="idv-textarea idv-textarea-tall"
                  rows={14}
                  value={storyEngineData?.adminNotes || ''}
                  onChange={(e) => {
                    if (consultLocked) return;
                    setStoryEngineData((prev) => ({
                      ...prev,
                      adminNotes: e.target.value,
                    }));
                  }}
                  disabled={consultLocked}
                  placeholder="Internal notes, contradictions, builder observations, hard no’s, sizing corrections, things to follow up on..."
                />
              </div>
            </div>

            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Post-Call Consolidation</span>
                <h5>What the call actually gave us</h5>
              </div>

              <div className="idv-grid-2">
                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>What the call clarified</strong>
                  </div>
                  {generatedIntelliSummary.trustedSignals.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.trustedSignals.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No strong clarifications captured yet.
                    </div>
                  )}
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>What changed from intake</strong>
                  </div>
                  {generatedIntelliSummary.conflictedSignals.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.conflictedSignals.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.from} → {item.to}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No major intake-to-call changes recorded yet.
                    </div>
                  )}
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>What still remains open</strong>
                  </div>
                  {generatedIntelliSummary.stillOpen.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.stillOpen.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No major open items detected.
                    </div>
                  )}
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Builder-facing overview</strong>
                  </div>
                  <p>{generatedIntelliSummary.overview}</p>
                </div>
              </div>
            </div>

            {!!smartTranscriptTurns.length && (
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">
                    Formatted Conversation
                  </span>
                  <h5>Transcript preview</h5>
                </div>

                <div className="idv-thread">
                  {smartTranscriptTurns.map((turn, idx) => (
                    <div
                      key={turn?.id || `turn-${idx}`}
                      className={`idv-thread-row ${
                        turn?.speaker === 'Ober Artisan'
                          ? 'is-builder'
                          : 'is-artist'
                      }`}
                    >
                      <div className="idv-thread-speaker">
                        {turn?.speaker || 'Artist'}
                      </div>
                      <div className="idv-thread-bubble">
                        {turn?.text || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default IntakeDirectionSection;
