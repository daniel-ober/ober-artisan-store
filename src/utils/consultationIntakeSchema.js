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

export const CONTACT_METHOD_OPTIONS = [
  'Email',
  'Text message',
  'Either is fine',
];

export const CONSULTATION_INTAKE_SECTIONS = [
  {
    id: 'soundlegendVision',
    title: 'Your SoundLegend Vision',
    description:
      'A short pre-consultation intake to help Dan understand what you are looking for before your one-on-one call.',
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
        id: 'tonalGoals',
        label: 'What kind of sound are you most drawn to?',
        type: 'multiSelect',
        options: TONAL_GOAL_OPTIONS,
        defaultValue: [],
      },
      {
        id: 'visualDirection',
        label: 'Which visual direction feels most like you?',
        type: 'select',
        options: VISUAL_DIRECTION_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'referenceNotes',
        label: 'Any drummer, record, current snare, or general vibe this should lean toward?',
        type: 'textarea',
        rows: 4,
        placeholder:
          'Examples: a drummer, album, song, current snare, or just a vibe you love.',
        defaultValue: '',
      },
      {
        id: 'consultationContactMethod',
        label: 'Best way to contact you to schedule your consultation',
        type: 'select',
        options: CONTACT_METHOD_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'consultationAvailability',
        label: 'Best day(s) / time(s) for a consultation',
        type: 'textarea',
        rows: 3,
        placeholder:
          'Examples: weekday evenings after 6pm, Tuesdays or Thursdays, weekends are best, etc.',
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