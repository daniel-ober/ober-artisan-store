export const PLAYER_PROFILE_OPTIONS = [
  'Hobbyist',
  'Gigging drummer',
  'Recording drummer',
  'Touring drummer',
  'Church / worship drummer',
  'Educator',
  'Collector',
  'Songwriter / producer',
  'Multi-instrumentalist',
  'Other',
];

export const PLAY_SETTINGS_OPTIONS = [
  'Live shows',
  'Studio sessions',
  'Church / worship',
  'Rehearsals',
  'Home playing',
  'Content creation',
  'Teaching',
  'Collecting',
  'Other',
  "I'm not sure",
];

export const GENRE_OPTIONS = [
  'Worship',
  'Rock',
  'Indie',
  'Pop',
  'Alternative',
  'Country',
  'CCM',
  'Gospel',
  'Funk',
  'R&B / Soul',
  'Jazz',
  'Fusion',
  'Hip-Hop',
  'Singer-songwriter',
  'Ambient / cinematic',
  'Metal',
  'Punk',
  'Americana',
  'Other',
  "I'm not sure",
];

export const PRIMARY_GOAL_OPTIONS = [
  'A signature main snare',
  'A versatile all-around snare',
  'A studio / recording snare',
  'A live-performance snare',
  'A statement / legacy piece',
  'Something unique I cannot get off the shelf',
  'Not sure — guide me',
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
  'Other',
  'Not sure — guide me',
];

export const RESPONSE_PRIORITY_OPTIONS = [
  'Fast response at low volume',
  'Big backbeat when played hard',
  'Smooth dynamic range',
  'Clear ghost notes',
  'Strong rimshots',
  'Great cross-stick',
  'Brush sensitivity',
  'Consistent feel across tunings',
  'Easy to record',
  'Easy to mix live',
  'Other',
  "I'm not sure",
];

export const BUILD_CLARITY_OPTIONS = [
  'I already have a strong vision',
  'I have a rough idea, but want guidance',
  'I want expert help shaping most of it',
  "I'm completely open and want to be led through it",
];

export const SIZE_DIRECTION_OPTIONS = [
  'Under 12"',
  '12"',
  '13"',
  '14"',
  'Over 14"',
  "I'm not sure",
];

export const SHELL_DIRECTION_OPTIONS = [
  'Stave',
  'Feuzon (Hybrid)',
  'Ply',
  'I trust your recommendation',
  "I'm not sure",
  'Other',
];

export const VISUAL_DIRECTION_OPTIONS = [
  {
    value: 'Understated / elegant',
    label: 'Understated / elegant',
    description: 'Refined, restrained, premium without being loud',
  },
  {
    value: 'Modern premium',
    label: 'Modern premium',
    description: 'Sleek, elevated, polished, contemporary',
  },
  {
    value: 'Vintage-inspired',
    label: 'Vintage-inspired',
    description: 'Classic character, old-soul feel, timeless influence',
  },
  {
    value: 'Organic / earthy',
    label: 'Organic / earthy',
    description: 'Natural grain, warmth, texture, grounded feel',
  },
  {
    value: 'Bold / artistic',
    label: 'Bold / artistic',
    description: 'More expressive, one-of-one, visually adventurous',
  },
  {
    value: 'Clean and minimal',
    label: 'Clean and minimal',
    description: 'Simple, focused, uncluttered',
  },
  {
    value: 'Statement piece',
    label: 'Statement piece',
    description: 'Designed to stand out visually',
  },
  {
    value: 'Heirloom feel',
    label: 'Heirloom feel',
    description: 'Timeless, meaningful, built to keep',
  },
  {
    value: "Player's tool first",
    label: "Player's tool first",
    description: 'Performance-led more than visually led',
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Something else entirely',
  },
  {
    value: "I'm not sure",
    label: "I'm not sure",
    description: 'Guide me here',
  },
];

export const HARDWARE_FINISH_OPTIONS = [
  'Chrome',
  'Black nickel',
  'Brass / gold',
  'Other',
  'Unsure',
];

export const CONTACT_METHOD_OPTIONS = [
  'Email',
  'Text message',
  'Either is fine',
];

export const CONSULT_DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const CONSULT_TIME_OPTIONS = [
  'Mornings',
  'Afternoons',
  'Evenings',
];

export const CONSULTATION_INTAKE_SECTIONS = [
  {
    id: 'playingWorld',
    title: 'Your Playing World',
    shortTitle: 'Playing World',
    description:
      'A little context on how and where you play helps shape the conversation.',
    fields: [
      {
        id: 'playerProfile',
        label: 'Which best describes you as a player?',
        type: 'select',
        options: PLAYER_PROFILE_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'playSettings',
        label: 'What musical settings do you play in most?',
        type: 'multiSelect',
        options: PLAY_SETTINGS_OPTIONS,
        defaultValue: [],
      },
      {
        id: 'genres',
        label: 'What genres or styles do you play most?',
        type: 'multiSelect',
        options: GENRE_OPTIONS,
        defaultValue: [],
      },
    ],
  },
  {
    id: 'soundGoals',
    title: 'Your Sound',
    shortTitle: 'Your Sound',
    description:
      'These are mostly easy-select questions to help us understand the sound you are chasing.',
    fields: [
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
        id: 'responsePriorities',
        label: 'Which playing responses matter most to you?',
        type: 'multiSelect',
        options: RESPONSE_PRIORITY_OPTIONS,
        defaultValue: [],
      },
    ],
  },
  {
    id: 'buildDirection',
    title: 'Build Direction',
    shortTitle: 'Build Direction',
    description:
      'Nothing here is locked in. This just gives our craftsman a general sense of your direction before the call.',
    fields: [
      {
        id: 'buildClarity',
        label: 'How clear is your vision right now?',
        type: 'select',
        options: BUILD_CLARITY_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'preferredSizeDirection',
        label: 'What size are you currently leaning toward?',
        type: 'select',
        options: SIZE_DIRECTION_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'shellDirectionsOpenTo',
        label: 'Which shell directions are you most open to?',
        type: 'multiSelect',
        options: SHELL_DIRECTION_OPTIONS,
        defaultValue: [],
        helperText:
          'Stave = strong handcrafted identity. Feuzon = hybrid-forward Ober direction. Ply = familiar and versatile.',
      },
      {
        id: 'visualDirection',
        label: 'What visual direction are you most drawn to?',
        type: 'multiSelect',
        options: VISUAL_DIRECTION_OPTIONS,
        defaultValue: [],
        helperText:
          'Heritage often leans timeless / heirloom / understated. Feuzon can lean bold / artistic. SoundLegend can flex either way depending on your vision.',
      },
      {
        id: 'hardwareFinishPreference',
        label: 'Which hardware finish are you most drawn to?',
        type: 'select',
        options: HARDWARE_FINISH_OPTIONS,
        defaultValue: '',
      },
    ],
  },
  {
    id: 'consultPrep',
    title: 'Consultation Prep',
    shortTitle: 'Consultation Prep',
    description:
      'A few quick scheduling preferences, then one optional note at the end if you want to share more.',
    fields: [
      {
        id: 'consultationContactMethod',
        label: 'Best way to contact you to schedule your consultation',
        type: 'select',
        options: CONTACT_METHOD_OPTIONS,
        defaultValue: '',
      },
      {
        id: 'consultationDays',
        label: 'Which days usually work best for you?',
        type: 'multiSelect',
        options: CONSULT_DAY_OPTIONS,
        defaultValue: [],
      },
      {
        id: 'consultationTimes',
        label: 'What time of day usually works best?',
        type: 'multiSelect',
        options: CONSULT_TIME_OPTIONS,
        defaultValue: [],
      },
      {
        id: 'finalNotes',
        label: 'Anything else you would like the craftsman to know before your call?',
        type: 'textarea',
        rows: 5,
        placeholder:
          'Optional — this is the only write-in question. You can mention a drummer, record, current snare, season of life, or anything else helpful.',
        defaultValue: '',
        optional: true,
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

export function isConsultationIntakeComplete(intake = {}) {
  const normalized = intake || {};

  return CONSULTATION_INTAKE_SECTIONS.every((section) =>
    section.fields.every((field) => {
      if (field.optional) return true;

      const value = normalized?.[section.id]?.[field.id];

      if (field.type === 'multiSelect') {
        return Array.isArray(value) && value.length > 0;
      }

      return String(value || '').trim() !== '';
    })
  );
}