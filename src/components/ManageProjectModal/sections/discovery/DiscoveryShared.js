import { CONSULTATION_INTAKE_SECTIONS } from '../../../../utils/consultationIntakeSchema';

export const REVIEW_STATE_OPTIONS = [
  { value: 'clarify', label: 'Open Question' },
  { value: 'verify', label: 'Needs Confirming' },
  { value: 'confirmed', label: 'Locked In' },
];

export const TRUTH_GROUPS = [
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

export const cleanText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeCompare = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isEmptyish = (value) => {
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

export const getDisplayValue = (value, fallback = '—') => {
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

export const getReviewStatePillClass = (reviewState) => {
  if (reviewState === 'confirmed') return 'is-good';
  if (reviewState === 'verify') return 'is-medium';
  return 'is-soft';
};

export const safeDateLabel = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const flattenSectionFields = (sections) =>
  sections.flatMap((section) =>
    (section.questions || []).flatMap((question) => question.fields || [])
  );

export const QUESTIONNAIRE_FIELD_INDEX = flattenSectionFields(
  CONSULTATION_INTAKE_SECTIONS
).reduce((acc, field) => {
  acc[field.id] = field;
  return acc;
}, {});

export const emptyTruthRow = () => ({
  notes: '',
  reviewState: '',
  checked: false,
});

export const prettifyOpenItem = (value = '') =>
  String(value || '')
    .replace(/\bstill needs clearer definition\.?$/i, '')
    .replace(/\bstill needs consult validation\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeBridgeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === 'string' && cleanText(value)) {
    return [cleanText(value)];
  }

  return [];
};

export const getBridgeTruth = (summaryStructured = {}, truthKey) => {
  return summaryStructured?.truths?.[truthKey] || null;
};

export const getTruthQuestionsFromBridge = (summaryStructured = {}, truthKey) => {
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

export const getTruthKnownSignalsFromBridge = (
  summaryStructured = {},
  truthKey
) => {
  const truth = getBridgeTruth(summaryStructured, truthKey);
  if (!truth) return [];
  return normalizeBridgeList(truth.signalsWeHave);
};

export const getTruthAvoidListFromBridge = (
  summaryStructured = {},
  truthKey
) => {
  const truth = getBridgeTruth(summaryStructured, truthKey);
  if (!truth) return [];
  return normalizeBridgeList(truth.assumptionsToAvoid);
};

export const buildFallbackCallQuestions = (truthKey, truth) => {
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

export const buildConsultationChecklist = ({
  summaryStructured,
  truthBoards,
}) => {
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
      .map((item) => ({
        label: item.label,
        value: getDisplayValue(item.finalValue),
      }));

    const knownItems = knownFromBridge.length
      ? knownFromBridge
      : fallbackKnown.map((item) => `${item.label}: ${item.value}`);

    const questionItems = questionsFromBridge.length
      ? questionsFromBridge
      : buildFallbackCallQuestions(truthGroup.key, truthBoard);

    const avoidItems = avoidFromBridge.length
      ? avoidFromBridge
      : (truthBoard?.clarifyItems || []).map((item) => {
          const value = prettifyOpenItem(item.label || '');
          return value
            ? `Do not assume ${value.toLowerCase()} is settled yet.`
            : '';
        });

    return {
      ...truthGroup,
      knownItems: knownItems.filter(Boolean),
      questionItems: questionItems.filter(Boolean),
      avoidItems: avoidItems.filter(Boolean),
    };
  });
};