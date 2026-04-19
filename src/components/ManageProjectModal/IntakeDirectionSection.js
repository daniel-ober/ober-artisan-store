import React, { useEffect, useMemo, useState } from 'react';
import { CONSULTATION_INTAKE_SECTIONS } from '../../utils/consultationIntakeSchema';
import IntakeInterpretationSection from './sections/discovery/IntakeInterpretationSection';
import PreConsultPrepSection from './sections/discovery/PreConsultPrepSection';
import ConsultationWorkspaceSection from './sections/discovery/ConsultationWorkspaceSection';
import './IntakeDirectionSection.css';

const REVIEW_STATE_OPTIONS = [
  { value: 'clarify', label: 'Open Question' },
  { value: 'verify', label: 'Needs Confirming' },
  { value: 'confirmed', label: 'Locked In' },
];

const TRUTH_GROUPS = [
  {
    key: 'purpose',
    title: 'Purpose',
    badge: 'P',
    summary:
      'Why the drum exists — role, context, where it needs to succeed, and how much direction is wanted.',
    consultFields: [
      'playerProfile',
      'primaryGoal',
      'environments',
      'guidancePreference',
    ],
  },
  {
    key: 'feel',
    title: 'Feel',
    badge: 'F',
    summary:
      'How the drum meets the player — rebound, comfort, sensitivity, and touch.',
    consultFields: [
      'feelPriorities',
      'snareLoveMost',
      'snareFrustrations',
      'dynamicFeel',
    ],
  },
  {
    key: 'voice',
    title: 'Voice',
    badge: 'V',
    summary:
      'What the drum says — its sonic identity, tonal character, and musical language.',
    consultFields: [
      'genres',
      'tonalGoals',
      'responsePriorities',
      'sizeDirection',
    ],
  },
  {
    key: 'legacy',
    title: 'Legacy',
    badge: 'L',
    summary:
      'Why it matters — visual character, personal meaning, influences, and emotional permanence.',
    consultFields: [
      'visualDirection',
      'hardwareFinishPreference',
      'storyImportance',
      'favoritePartOfPlaying',
      'influenceReferences',
      'finalNotes',
    ],
  },
];

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
      "i'm not sure",
      "i'm",
      'im',
    ].includes(text)
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

  if (typeof value === 'object' && value !== null) {
    const joined = Object.values(value)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }

  const text = cleanText(value);
  return text || fallback;
};

const getReviewStatePillClass = (reviewState) => {
  if (reviewState === 'confirmed') return 'is-good';
  if (reviewState === 'verify') return 'is-medium';
  return 'is-soft';
};

const safeDateLabel = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const flattenSectionFields = (sections) =>
  sections.flatMap((section) =>
    (section.questions || []).flatMap((question) => question.fields || [])
  );

const QUESTIONNAIRE_FIELD_INDEX = flattenSectionFields(
  CONSULTATION_INTAKE_SECTIONS
).reduce((acc, field) => {
  acc[field.id] = field;
  return acc;
}, {});

const emptyTruthRow = () => ({
  notes: '',
  reviewState: '',
  checked: false,
});

const prettifyOpenItem = (value = '') =>
  String(value || '')
    .replace(/\bstill needs clearer definition\.?$/i, '')
    .replace(/\bstill needs consult validation\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeBridgeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === 'string' && cleanText(value)) {
    return [cleanText(value)];
  }

  return [];
};

const getBridgeTruth = (summaryStructured = {}, truthKey) => {
  return summaryStructured?.truths?.[truthKey] || null;
};

const getTruthQuestionsFromBridge = (summaryStructured = {}, truthKey) => {
  const truth = getBridgeTruth(summaryStructured, truthKey);
  if (!truth) return [];

  const directQuestions = normalizeBridgeList(truth.followupQuestions);
  if (directQuestions.length) return directQuestions;

  const criticalUnknowns = normalizeBridgeList(truth.criticalUnknowns);
  return criticalUnknowns
    .map((item) => {
      const cleaned = prettifyOpenItem(item);
      return cleaned ? `Clarify: ${cleaned}` : '';
    })
    .filter(Boolean);
};

const getTruthKnownSignalsFromBridge = (summaryStructured = {}, truthKey) => {
  const truth = getBridgeTruth(summaryStructured, truthKey);
  if (!truth) return [];
  return normalizeBridgeList(truth.signalsWeHave);
};

const getTruthAvoidListFromBridge = (summaryStructured = {}, truthKey) => {
  const truth = getBridgeTruth(summaryStructured, truthKey);
  if (!truth) return [];
  return normalizeBridgeList(truth.assumptionsToAvoid);
};

const buildFallbackCallQuestions = (truthKey, truth) => {
  const openItems = truth?.clarifyItems || [];
  const verifyItems = truth?.verifyItems || [];
  const sourceItems = [...openItems, ...verifyItems];

  const fieldQuestionMap = {
    purpose: {
      playerProfile:
        'How would you best describe yourself as a player right now?',
      primaryGoal:
        'What are you really hoping this drum becomes for you?',
      environments:
        'Where does this drum most need to succeed: live, studio, home, or a mix?',
      guidancePreference:
        'How much craftsman guidance do you want from me during the build?',
    },
    feel: {
      feelPriorities:
        'What matters most under the stick when this drum feels right?',
      snareLoveMost:
        'What do you love most when a snare feels right to you?',
      snareFrustrations:
        'What tends to frustrate you most in the drums you play now?',
      dynamicFeel:
        'How important are low-volume sensitivity and ghost notes to you?',
    },
    voice: {
      genres:
        'What musical settings should this drum feel most at home in?',
      tonalGoals:
        'Should this drum lean more dry, open, warm, crisp, fat, or articulate?',
      responsePriorities:
        'What response matters most: brush sensitivity, backbeat weight, ghost notes, or tuning range?',
      sizeDirection:
        'Are you leaning 13", 14", or still open on size?',
    },
    legacy: {
      visualDirection:
        'What should this drum feel like visually when you first see it?',
      hardwareFinishPreference:
        'Are you truly leaning chrome, black nickel, or brass / gold?',
      storyImportance:
        'How personal or legacy-driven do you want this build to feel?',
      favoritePartOfPlaying:
        'What part of playing drums feels most like you?',
      influenceReferences:
        'Are there artists, records, drums, or visual references that still feel important here?',
      finalNotes:
        'Is there anything you want me to understand before I start shaping the build?',
    },
  };

  const mappedQuestions = sourceItems
    .map((item) => fieldQuestionMap?.[truthKey]?.[item.fieldId] || '')
    .filter(Boolean);

  return [...new Set(mappedQuestions)];
};

const buildConsultationChecklist = ({ summaryStructured, truthBoards }) => {
  return TRUTH_GROUPS.map((truthGroup) => {
    const truthBoard = truthBoards.find((item) => item.key === truthGroup.key);

    const knownFromBridge = getTruthKnownSignalsFromBridge(
      summaryStructured,
      truthGroup.key
    );

    const questionsFromBridge = getTruthQuestionsFromBridge(
      summaryStructured,
      truthGroup.key
    );

    const avoidFromBridge = getTruthAvoidListFromBridge(
      summaryStructured,
      truthGroup.key
    );

    const fallbackKnown = (truthBoard?.items || [])
      .filter((item) => !isEmptyish(item.finalValue))
      .map((item) => `${item.label}: ${getDisplayValue(item.finalValue)}`);

    const knownItems = knownFromBridge.length
      ? knownFromBridge
      : fallbackKnown;

    const questionItems = questionsFromBridge.length
      ? questionsFromBridge
      : buildFallbackCallQuestions(truthGroup.key, truthBoard);

    const avoidItems = avoidFromBridge.length
      ? avoidFromBridge
      : (truthBoard?.clarifyItems || [])
          .map((item) => {
            const value = prettifyOpenItem(item.label || '');
            return value
              ? `Do not assume ${value.toLowerCase()} is settled yet.`
              : '';
          })
          .filter(Boolean);

    return {
      ...truthGroup,
      knownItems: knownItems.filter(Boolean),
      questionItems: questionItems.filter(Boolean),
      avoidItems: avoidItems.filter(Boolean),
    };
  });
};

const MODE_CONFIG = {
  intakeDetails: {
    kicker: 'Intake & Direction',
    title: 'Intake Details & Interpretation',
    subtitle:
      'Review what the questionnaire is already telling us, what is still missing, and whether discovery is ready to move forward.',
  },
  preconsultPrep: {
    kicker: 'Intake & Direction',
    title: 'Pre-Consult Analysis',
    subtitle:
      'Carry forward the strongest truths, define the best call path, and avoid forcing assumptions before the consultation.',
  },
  consultationTool: {
    kicker: 'Intake & Direction',
    title: 'Consultation Workspace',
    subtitle:
      'Capture the real conversation, review truth-by-truth movement, and save the consultation record cleanly.',
  },
};

const IntakeDirectionSection = ({
  mode = 'intakeDetails',
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
  const discoveryBridge = projectData?.discoveryBridge || {};

  const intakeState = discoveryWorkspace?.intake || {};
  const consultState = discoveryWorkspace?.consult || {};
  const summaryState = discoveryWorkspace?.summary || {};

  const fallbackSummaryStructured =
    summaryState?.structured ||
    (Object.keys(discoveryBridge || {}).length ? discoveryBridge : null);

  const fallbackSummaryText =
    summaryState?.editableText ||
    discoveryBridge?.rawResponseText ||
    discoveryBridge?.overview ||
    '';

  const fallbackSummaryGenerated =
    !!summaryState?.generated ||
    !!fallbackSummaryText ||
    !!Object.keys(discoveryBridge || {}).length;

  const intakeLocked = !!intakeState?.completed;
  const consultLocked = !!consultState?.completed;
  const summaryGenerated = fallbackSummaryGenerated;

  const [intakeOpen, setIntakeOpen] = useState(true);
  const [consultOpen, setConsultOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    setIntakeOpen(!intakeLocked);
    setConsultOpen(!consultLocked);
    setSummaryOpen(summaryGenerated);
  }, [intakeLocked, consultLocked, summaryGenerated]);

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

  const updateTruthRow = (truthKey, fieldId, patch) => {
    if (consultLocked) return;

    updateDiscoveryWorkspace((current) => {
      const currentRows = current?.consult?.truthRows || {};
      const currentTruthRows = currentRows?.[truthKey] || {};
      const existing = currentTruthRows?.[fieldId] || emptyTruthRow();

      return {
        ...current,
        consult: {
          ...(current?.consult || {}),
          truthRows: {
            ...currentRows,
            [truthKey]: {
              ...currentTruthRows,
              [fieldId]: {
                ...existing,
                ...patch,
              },
            },
          },
        },
      };
    });
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
        truthRows:
          discoveryWorkspace?.consult?.truthRows ||
          discoveryWorkspace?.consult?.rows ||
          {},
        rows:
          discoveryWorkspace?.consult?.rows ||
          discoveryWorkspace?.consult?.truthRows ||
          {},
      },
      summary: {
        ...(discoveryWorkspace?.summary || {}),
        generated:
          !!discoveryWorkspace?.summary?.generated ||
          !!fallbackSummaryGenerated,
        generatedAt:
          discoveryWorkspace?.summary?.generatedAt ||
          discoveryBridge?.generatedAt ||
          new Date().toISOString(),
        editableText:
          discoveryWorkspace?.summary?.editableText || fallbackSummaryText || '',
        structured:
          discoveryWorkspace?.summary?.structured ||
          fallbackSummaryStructured ||
          generatedIntelliSummary ||
          null,
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

  const questionnaireReceived =
    !!cleanText(storyEngineData?.questionnaireRaw) ||
    Object.keys(questionnaireMapped || {}).length > 0;

  const questionnaireStatus = questionnaireReceived ? 'Received' : 'Incomplete';

  const projectConsultationIntake = projectData?.consultationIntake || {};

  const getQuestionnaireValueForField = (fieldId) => {
    for (const section of CONSULTATION_INTAKE_SECTIONS) {
      const sectionValues = projectConsultationIntake?.[section.id];
      if (
        sectionValues &&
        Object.prototype.hasOwnProperty.call(sectionValues, fieldId)
      ) {
        return sectionValues[fieldId];
      }
    }

    if (Object.prototype.hasOwnProperty.call(questionnaireMapped, fieldId)) {
      return questionnaireMapped[fieldId];
    }

    return '';
  };

  const truthBoards = useMemo(() => {
    const truthRows = consultState?.truthRows || {};

    return TRUTH_GROUPS.map((truth) => {
      const items = truth.consultFields.map((fieldId) => {
        const fieldMeta = QUESTIONNAIRE_FIELD_INDEX[fieldId];
        const questionnaireValue = getQuestionnaireValueForField(fieldId);
        const consultValue = consultationMapped?.[fieldId];
        const truthSavedRow =
          truthRows?.[truth.key]?.[fieldId] || emptyTruthRow();

        const finalValue =
          consultValue !== undefined &&
          consultValue !== null &&
          cleanText(consultValue)
            ? consultValue
            : questionnaireValue;

        let autoReviewState = 'verify';

        if (isEmptyish(finalValue)) {
          autoReviewState = 'clarify';
        } else if (truthSavedRow.checked) {
          autoReviewState = 'confirmed';
        }

        const reviewState =
          truthSavedRow.reviewState && cleanText(truthSavedRow.reviewState)
            ? truthSavedRow.reviewState
            : autoReviewState;

        return {
          fieldId,
          label: fieldMeta?.label || fieldId,
          questionnaireValue,
          consultValue,
          finalValue,
          reviewState,
          checked: !!truthSavedRow.checked,
          notes: truthSavedRow.notes || '',
        };
      });

      const confirmedItems = items.filter(
        (item) => item.reviewState === 'confirmed'
      );
      const verifyItems = items.filter((item) => item.reviewState === 'verify');
      const clarifyItems = items.filter(
        (item) => item.reviewState === 'clarify'
      );

      return {
        ...truth,
        items,
        confirmedItems,
        verifyItems,
        clarifyItems,
      };
    });
  }, [
    consultState?.truthRows,
    consultationMapped,
    questionnaireMapped,
    projectConsultationIntake,
  ]);

  const intakeInterpretationRows = useMemo(() => {
    return truthBoards.map((truth) => {
      const tellingItems = truth.items
        .filter((item) => !isEmptyish(item.finalValue))
        .map((item) => getDisplayValue(item.finalValue));

      const notTellingItems = [
        ...truth.clarifyItems.map(
          (item) => `${item.label} still needs clearer definition.`
        ),
        ...truth.verifyItems
          .filter((item) => isEmptyish(item.finalValue))
          .map((item) => `${item.label} still needs consult validation.`),
      ];

      return {
        key: truth.key,
        title: truth.title,
        badge: truth.badge,
        summary: truth.summary,
        tellingItems: tellingItems.length
          ? tellingItems
          : ['Nothing meaningful is clearly defined here yet.'],
        notTellingItems: notTellingItems.length
          ? notTellingItems
          : ['Nothing major missing here.'],
      };
    });
  }, [truthBoards]);

  const generatedIntelliSummary = useMemo(() => {
    const allItems = truthBoards.flatMap((truth) =>
      truth.items.map((item) => ({
        truth: truth.title,
        ...item,
      }))
    );

    const trustedSignals = allItems
      .filter(
        (item) =>
          item.reviewState === 'confirmed' && !isEmptyish(item.finalValue)
      )
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        value: getDisplayValue(item.finalValue),
        confidence: 'high',
        rationale:
          item.notes ||
          'This has been discussed clearly enough to treat as part of the working direction.',
      }));

    const stillOpen = allItems
      .filter((item) => item.reviewState !== 'confirmed')
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        note:
          item.notes ||
          'This area still needs either confirmation or clarification before it should be treated as locked.',
      }));

    const followUps = allItems
      .filter((item) => item.reviewState === 'clarify')
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        question: `Ask a clarifying follow-up around ${item.label.toLowerCase()}.`,
      }));

    const confidenceRows = allItems.map((item) => ({
      label: `${item.truth} · ${item.label}`,
      value: getDisplayValue(item.finalValue),
      confidence:
        item.reviewState === 'confirmed'
          ? 'high'
          : item.reviewState === 'verify'
            ? 'medium'
            : 'low',
      rationale:
        item.notes ||
        (item.reviewState === 'confirmed'
          ? 'This appears settled enough to treat as part of the working direction.'
          : item.reviewState === 'verify'
            ? 'This looks directionally useful, but still needs verbal confirmation.'
            : 'This still needs more clarity before it should influence downstream build decisions.'),
    }));

    const truthSummary = truthBoards
      .map((truth) => {
        const confirmedCount = truth.confirmedItems.length;
        const totalCount = truth.items.length;
        return `${truth.title}: ${confirmedCount}/${totalCount} areas currently feel locked in.`;
      })
      .join(' ');

    const overview =
      trustedSignals.length > 0
        ? `Discovery is beginning to form around the four truths. ${truthSummary}`
        : `Discovery has started, but there is not enough confirmed signal yet across Voice, Feel, Purpose, and Legacy to treat the build direction as truly locked.`;

    const nextSteps = [];

    if (trustedSignals.length) {
      nextSteps.push(
        'Promote the clearest confirmed signals into the next build-direction tool.'
      );
    }

    if (stillOpen.length) {
      nextSteps.push(
        'Use the consultation to resolve the most important open questions without forcing weak decisions.'
      );
    }

    if (followUps.length) {
      nextSteps.push(
        'Capture notes by truth so the emotional and practical logic behind the build stays visible.'
      );
    }

    return {
      overview,
      trustedSignals,
      changedSignals: [],
      conflictedSignals: [],
      stillOpen,
      followUps,
      builderResearch: [],
      confidenceRows,
      nextSteps,
    };
  }, [truthBoards]);

  useEffect(() => {
    if (summaryGenerated) return;
    if (!intakeLocked || !consultLocked) return;

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
    fallbackSummaryText || generatedIntelliSummary.overview || '';

  const summaryStructured =
    fallbackSummaryStructured || generatedIntelliSummary;

  const consultationChecklist = useMemo(() => {
    return buildConsultationChecklist({
      summaryStructured,
      truthBoards,
    });
  }, [summaryStructured, truthBoards]);

  const discoveryProgressPercent = (() => {
    let score = 0;
    if (questionnaireReceived) score += 25;
    if (intakeLocked) score += 25;
    if (consultLocked) score += 25;
    if (summaryGenerated) score += 25;
    return score;
  })();

  const discoveryConfidenceLabel =
    discoveryProgressPercent >= 85
      ? 'High'
      : discoveryProgressPercent >= 55
        ? 'Medium'
        : 'Early';

  const buildScopeMissingDetails = (() => {
    const fromBridge = TRUTH_GROUPS.flatMap((truth) => {
      const truthNode = summaryStructured?.truths?.[truth.key] || {};
      return normalizeBridgeList(truthNode.criticalUnknowns || []);
    });

    const normalized = fromBridge
      .map((item) => prettifyOpenItem(item))
      .filter(Boolean);

    const mapped = normalized.map((item) => {
      const lower = item.toLowerCase();

      if (
        lower.includes('shell construction') ||
        lower.includes('feuzon') ||
        lower.includes('hybrid') ||
        lower.includes('stave') ||
        lower.includes('ply')
      ) {
        return 'Shell construction';
      }

      if (
        lower.includes('wood') ||
        lower.includes('species') ||
        lower.includes('veneer')
      ) {
        return 'Wood species / veneer direction';
      }

      if (
        lower.includes('finish') ||
        lower.includes('natural') ||
        lower.includes('gloss') ||
        lower.includes('satin') ||
        lower.includes('stained')
      ) {
        return 'Finish system';
      }

      if (lower.includes('bearing edge') || lower.includes('snare bed')) {
        return 'Bearing edge / snare bed direction';
      }

      if (
        lower.includes('hoop') ||
        lower.includes('head pairing') ||
        lower.includes('head')
      ) {
        return 'Hoop and head pairing';
      }

      if (
        lower.includes('tuning') ||
        lower.includes('projection') ||
        lower.includes('voice') ||
        lower.includes('response')
      ) {
        return 'Voicing / tuning approach';
      }

      if (
        lower.includes('hardware') ||
        lower.includes('badge') ||
        lower.includes('markings')
      ) {
        return 'Hardware package / visual appointments';
      }

      if (
        lower.includes('size') ||
        lower.includes('diameter') ||
        lower.includes('depth') ||
        lower.includes('13') ||
        lower.includes('14')
      ) {
        return 'Shell size / geometry';
      }

      return item;
    });

    const unique = [...new Set(mapped)];

    if (unique.length) return unique;

    return [
      'Shell construction',
      'Wood species / veneer direction',
      'Finish system',
      'Voicing / tuning approach',
      'Bearing edge / snare bed direction',
      'Hoop and head pairing',
      'Hardware package / visual appointments',
    ];
  })();

  const discoveryKnownLines = truthBoards.flatMap((truth) =>
    truth.items
      .filter((item) => !isEmptyish(item.finalValue))
      .map(
        (item) =>
          `${truth.title}: ${item.label}: ${getDisplayValue(item.finalValue)}`
      )
  );

  const discoveryBlockers = (() => {
    const blockers = [];

    if (!questionnaireReceived) {
      blockers.push('Questionnaire intake has not been received yet.');
    }

    if (!intakeLocked) {
      blockers.push('Intake review has not been formally marked complete yet.');
    }

    if (!consultLocked) {
      blockers.push('Consultation still needs to happen or be completed.');
    }

    if (!cleanText(storyEngineData?.consultationTranscript)) {
      blockers.push('No consultation transcript has been added yet.');
    }

    if (!cleanText(storyEngineData?.adminNotes)) {
      blockers.push('No craftsman notes have been captured yet.');
    }

    return blockers;
  })();

  const builderPrepIntro = (() => {
    if (!questionnaireReceived) {
      return 'No intake has been received yet, so discovery still needs its starting point.';
    }

    if (!discoveryKnownLines.length) {
      return 'The intake is in, but it is still too soft to confidently guide the build without a stronger consultation.';
    }

    return `What feels usable now: ${discoveryKnownLines.slice(0, 3).join('; ')}`;
  })();

  const builderPrepBuildScope = (() => {
    if (!buildScopeMissingDetails.length) {
      return 'No major build-scope gaps are showing right now.';
    }

    return `Missing build details before build scope can be defined: ${buildScopeMissingDetails.join(
      '; '
    )}`;
  })();

  const consultFlowBullets = [
    'Start with what already feels true from the intake.',
    'Move one truth at a time: Purpose, Feel, Voice, then Legacy.',
    'Ask the clearest open questions first.',
    'Only confirm what actually sounds real in conversation.',
    'Leave weak decisions open instead of forcing them.',
  ];

  const consultPrepBoards = consultationChecklist.map((truth) => ({
    ...truth,
    whatNotToAssume: truth.avoidItems?.length
      ? truth.avoidItems
      : ['No major assumption warnings here.'],
  }));

  const topClarifyItems = truthBoards
    .flatMap((truth) =>
      truth.items
        .filter((item) => item.reviewState === 'clarify')
        .map((item) => `${truth.title} · ${item.label}`)
    )
    .slice(0, 3);

  const topVerifyItems = truthBoards
    .flatMap((truth) =>
      truth.items
        .filter((item) => item.reviewState === 'verify')
        .map((item) => `${truth.title} · ${item.label}`)
    )
    .slice(0, 4);

  const consultationLockedInCount = truthBoards.reduce(
    (total, truth) => total + truth.confirmedItems.length,
    0
  );

  const consultationOpenCount = truthBoards.reduce(
    (total, truth) => total + truth.clarifyItems.length,
    0
  );

  const consultationVerifyCount = truthBoards.reduce(
    (total, truth) => total + truth.verifyItems.length,
    0
  );

  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.intakeDetails;

  return (
    <div className="idv-shell">
      <div className="idv-header">
        <div>
          <div className="idv-kicker">{modeConfig.kicker}</div>
          <h3 className="idv-title">{modeConfig.title}</h3>
          <p className="idv-subtitle">{modeConfig.subtitle}</p>
        </div>
      </div>

      {mode === 'intakeDetails' ? (
        <IntakeInterpretationSection
          intakeOpen={intakeOpen}
          setIntakeOpen={setIntakeOpen}
          intakeLocked={intakeLocked}
          questionnaireStatus={questionnaireStatus}
          intakeInterpretationRows={intakeInterpretationRows}
          handleMarkIntakeComplete={handleMarkIntakeComplete}
          questionnaireReceived={questionnaireReceived}
          discoveryProgressPercent={discoveryProgressPercent}
          discoveryConfidenceLabel={discoveryConfidenceLabel}
          builderPrepIntro={builderPrepIntro}
          builderPrepBuildScope={builderPrepBuildScope}
          summaryText={summaryText}
          updateSummaryMeta={updateSummaryMeta}
          discoveryBlockers={discoveryBlockers}
          topClarifyItems={topClarifyItems}
          topVerifyItems={topVerifyItems}
        />
      ) : null}

      {mode === 'preconsultPrep' ? (
        <PreConsultPrepSection
          summaryOpen={summaryOpen}
          setSummaryOpen={setSummaryOpen}
          summaryGenerated={summaryGenerated}
          consultPrepBoards={consultPrepBoards}
          consultFlowBullets={consultFlowBullets}
          builderPrepBuildScope={builderPrepBuildScope}
          topClarifyItems={topClarifyItems}
          topVerifyItems={topVerifyItems}
        />
      ) : null}

      {mode === 'consultationTool' ? (
        <ConsultationWorkspaceSection
          consultOpen={consultOpen}
          setConsultOpen={setConsultOpen}
          consultLocked={consultLocked}
          truthBoards={truthBoards}
          updateTruthRow={updateTruthRow}
          getReviewStatePillClass={getReviewStatePillClass}
          REVIEW_STATE_OPTIONS={REVIEW_STATE_OPTIONS}
          getDisplayValue={getDisplayValue}
          handleGenerateConsultationSummary={handleGenerateConsultationSummary}
          storyEngineRunning={storyEngineRunning}
          isNormalizingTranscript={isNormalizingTranscript}
          handleMarkConsultComplete={handleMarkConsultComplete}
          storyEngineData={storyEngineData}
          setStoryEngineData={setStoryEngineData}
          safeDateLabel={safeDateLabel}
          consultState={consultState}
          cleanText={cleanText}
          smartTranscriptTurns={smartTranscriptTurns}
          consultationLockedInCount={consultationLockedInCount}
          consultationOpenCount={consultationOpenCount}
          consultationVerifyCount={consultationVerifyCount}
        />
      ) : null}
    </div>
  );
};

export default IntakeDirectionSection;