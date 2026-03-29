export const BUILD_CLARITY_OPTIONS = [
  'I have a good idea what I want',
  'I have somewhat of an idea what I want',
  "I'm not too sure what I want",
];

export const PRIMARY_GOAL_OPTIONS = [
  'A signature main snare',
  'A versatile all-around snare',
  'A studio / recording snare',
  'A live-performance snare',
  'A statement / legacy piece',
  'Something unique I cannot get off the shelf',
];

export const GENRE_OPTIONS = [
  'Rock',
  'Pop',
  'Country',
  'Gospel / Worship',
  'Jazz',
  'Funk / R&B',
  'Metal',
  'Studio / Session',
  'Multi-genre',
  'Other',
];

export const TONAL_GOAL_OPTIONS = [
  'Warm',
  'Crisp',
  'Fat / full',
  'Dry / controlled',
  'Open / resonant',
  'Dark',
  'Bright / cutting',
  'Sensitive / ghost-note friendly',
  'Punchy',
  'Balanced / versatile',
  'Not sure — guide me',
];

export const RESPONSE_PRIORITY_OPTIONS = [
  'Ghost notes / sensitivity',
  'Rimshot crack',
  'Cross-stick',
  'Dynamic response',
  'Projection',
  'Body / fullness',
  'Controlled sustain',
  'Versatility',
  'Not sure — guide me',
];

export const VISUAL_DIRECTION_OPTIONS = [
  'Natural / organic',
  'Clean / understated',
  'Elegant / refined',
  'Bold / dramatic',
  'Vintage-inspired',
  'Modern',
  'One-of-a-kind / artistic',
  'Not sure — guide me',
];

export const DECISION_STAGE_OPTIONS = [
  'Ready to move soon',
  'Gathering ideas',
  'Still exploring',
];

export const CONSULTATION_INTAKE_SECTIONS = [
  {
    id: 'soundlegendVision',
    title: 'Your SoundLegend Vision',
    description:
      'A simple pre-consultation intake to help shape your sound, style, and direction before your one-on-one call.',
    fields: [
      {
        id: 'buildClarity',
        label: 'How clear is your vision right now?',
        type: 'select',
        options: BUILD_CLARITY_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'primaryGoal',
        label: 'What are you hoping this drum becomes for you?',
        type: 'select',
        options: PRIMARY_GOAL_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'primaryGenre',
        label: 'What kind of music will this drum mostly live in?',
        type: 'select',
        options: GENRE_OPTIONS,
        allowOther: true,
        defaultValue: '',
      },
      {
        id: 'tonalGoals',
        label: 'What kind of sound are you drawn to?',
        type: 'multiSelect',
        options: TONAL_GOAL_OPTIONS,
        allowOther: true,
        defaultValue: [],
      },
      {
        id: 'responsePriorities',
        label: 'What matters most in the way it feels and responds?',
        type: 'multiSelect',
        options: RESPONSE_PRIORITY_OPTIONS,
        allowOther: true,
        defaultValue: [],
      },
      {
        id: 'visualDirection',
        label: 'Which visual direction feels most like you?',
        type: 'multiSelect',
        options: VISUAL_DIRECTION_OPTIONS,
        allowOther: true,
        defaultValue: [],
      },
      {
        id: 'loves',
        label: 'Are there any woods, finishes, sounds, or visual styles you already know you love?',
        type: 'textarea',
        rows: 3,
        placeholder:
          'Examples: warm walnut, natural wood grain, dry and punchy, black nickel hardware, bold figure, etc.',
        defaultValue: '',
      },
      {
        id: 'avoid',
        label: 'Are there any sounds, looks, woods, or styles you know you want to avoid?',
        type: 'textarea',
        rows: 3,
        placeholder:
          'Examples: too bright, overly ringy, super flashy, gold hardware, painted finishes, etc.',
        defaultValue: '',
      },
      {
        id: 'references',
        label: 'Is there a drummer, record, current snare, or reference this should lean toward?',
        type: 'textarea',
        rows: 3,
        placeholder:
          'Examples: a drummer, album, song, current snare, or general vibe.',
        defaultValue: '',
      },
      {
        id: 'decisionStage',
        label: 'Where are you in the decision process?',
        type: 'select',
        options: DECISION_STAGE_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'anythingElse',
        label: 'Anything else you want Dan to understand before the consultation?',
        type: 'textarea',
        rows: 4,
        placeholder:
          'Anything about your playing, goals, personality, setup, or dream outcome.',
        defaultValue: '',
      },
    ],
  },
];

export function buildConsultationIntakeDefaults() {
  return CONSULTATION_INTAKE_SECTIONS.reduce((acc, section) => {
    acc[section.id] = section.fields.reduce((fieldAcc, field) => {
      fieldAcc[field.id] = field.defaultValue;
      return fieldAcc;
    }, {});
    return acc;
  }, {});
}

export function getConsultationIntakeSection(sectionId) {
  return CONSULTATION_INTAKE_SECTIONS.find(
    (section) => section.id === sectionId
  );
}

export function getConsultationIntakeField(sectionId, fieldId) {
  const section = getConsultationIntakeSection(sectionId);
  if (!section) return null;
  return section.fields.find((field) => field.id === fieldId) || null;
}