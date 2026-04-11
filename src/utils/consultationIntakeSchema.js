export const PLAYER_PROFILE_OPTIONS = [
  'Weekend / hobby drummer',
  'Recording drummer',
  'Church / worship drummer',
  'Working drummer',
  'Touring drummer',
  'Educator',
  'Producer / songwriter',
  'Collector',
  'Multi-instrumentalist',
  'Other',
];

export const PRIMARY_GOAL_OPTIONS = [
  'My main snare',
  'A versatile all-around snare',
  'A studio-focused snare',
  'A live-performance snare',
  'A worship-focused snare',
  'A specialty / flavor snare',
  'A legacy / statement piece',
  "I'm not sure",
];

export const ENVIRONMENT_OPTIONS = [
  'Stage',
  'Studio',
  'Church / worship',
  'Home / practice',
  'A little bit of everything',
  'Other',
];

export const GUIDANCE_PREFERENCE_OPTIONS = [
  'I want a collaborative middle ground',
  'I want strong craftsman guidance',
  'I want to lead most of it',
  'I want you to translate the vision for me',
];

export const SIZE_DIRECTION_OPTIONS = [
  '14"',
  '13"',
  '12"',
  '15"+',
  '10"',
  'Other',
  "I'm not sure",
];

export const FEEL_PRIORITY_OPTIONS = [
  'Soft-touch sensitivity',
  'Easy ghost-note feel',
  'Fast rebound',
  'Controlled rebound',
  'Power when leaned into',
  'Comfort across longer sessions',
  'Less hand / wrist fatigue',
  'A more forgiving overall feel',
  'Other',
  "I'm not sure",
];

export const SNARE_LOVE_MOST_OPTIONS = [
  'When it feels easy to play',
  'When ghost notes speak clearly',
  'When the backbeat feels great',
  'When it opens up without fighting me',
  'When it stays controlled when I need it to',
  'When it tunes up easily',
  'When it records well',
  'When it feels inspiring every time I sit down',
  'Other',
  "I'm not sure",
];

export const SNARE_FRUSTRATION_OPTIONS = [
  'I cannot get the right sound out of it',
  'I cannot get the right feel out of it',
  'I cannot get it tuned the way I need',
  'It feels too stiff',
  'Ghost notes do not speak easily',
  'The backbeat / rimshot does not feel satisfying',
  'It does not record the way I want',
  'It feels too generic or uninspiring',
  'It wears me out physically',
  'Other',
  "I'm not sure",
];

export const DYNAMIC_PRIORITY_OPTIONS = [
  'Yes — very important',
  'Somewhat important',
  'Not a major priority',
  "I'm not sure",
];

export const TONAL_GOAL_OPTIONS = [
  'Fat / full',
  'Balanced / versatile',
  'Warm',
  'Punchy',
  'Open / resonant',
  'Dry / controlled',
  'Crisp',
  'Bright / cutting',
  'Dark',
  'Other',
  "I'm not sure",
];

export const RESPONSE_PRIORITY_OPTIONS = [
  'Clear ghost notes',
  'Strong rimshots / backbeat',
  'Great cross-stick',
  'Smooth dynamic range',
  'Brush sensitivity',
  'Consistent feel across tunings',
  'Easy to record',
  'Easy to mix live',
  'Other',
  "I'm not sure",
];

export const GENRE_OPTIONS = [
  'Rock',
  'Worship',
  'Pop',
  'Country',
  'Indie',
  'Alternative',
  'R&B / Soul',
  'Funk',
  'Jazz',
  'Fusion',
  'Singer-songwriter',
  'Ambient / cinematic',
  'Hip-Hop',
  'Gospel',
  'CCM',
  'Americana',
  'Metal',
  'Punk',
  'Other',
];

export const VISUAL_DIRECTION_OPTIONS = [
  {
    value: 'Understated / elegant',
    label: 'Understated / elegant',
    description:
      'Refined, timeless, premium without drawing too much attention',
  },
  {
    value: 'Organic / natural',
    label: 'Organic / natural',
    description: 'Wood-forward, grounded, textured, warm, honest',
  },
  {
    value: 'Bold / artistic',
    label: 'Bold / artistic',
    description: 'More expressive, one-of-one, visually adventurous',
  },
  {
    value: 'Modern / elevated',
    label: 'Modern / elevated',
    description: 'Clean, sleek, premium, contemporary',
  },
  {
    value: 'Vintage / heirloom',
    label: 'Vintage / heirloom',
    description: 'Old-soul character, timeless presence, built to keep',
  },
  {
    value: 'Player’s tool first',
    label: 'Player’s tool first',
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
    description: 'I need help shaping this',
  },
];

export const HARDWARE_FINISH_OPTIONS = [
  'Chrome',
  'Black nickel',
  'Brass / gold',
  'Other',
  "I'm not sure",
];

export const STORY_IMPORTANCE_OPTIONS = [
  'This is mostly about sound and performance',
  'This is both a tool and a meaningful personal piece',
  'This is deeply personal and emotionally important to me',
  'This feels like a legacy piece',
];

export const FAVORITE_PART_OF_PLAYING_OPTIONS = [
  'Feel / touch',
  'Backbeat energy',
  'Ghost notes and nuance',
  'Dynamic control',
  'Serving the song',
  'Live performance',
  'Creative expression',
  'Tone chasing / recording',
  'Other',
];

export const CONTACT_METHOD_OPTIONS = ['Text message', 'Email', 'Either is fine'];

export const CONSULT_DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const CONSULT_TIME_OPTIONS = ['Evenings', 'Afternoons', 'Mornings'];

export const CONSULTATION_INTAKE_SECTIONS = [
  {
    id: 'purpose',
    title: 'Purpose',
    shortTitle: 'Purpose',
    truthLabel: 'The first truth',
    description:
      'Purpose is why the drum exists — the role it plays, where it needs to succeed, and how much direction you want.',
    storyIntro:
      'Every meaningful build starts by understanding why it should exist at all. Some drums are made to become a main voice. Some are built to solve a specific need. Some are meant to carry a season of life, a musical direction, or a story that deserves a deeper kind of permanence. Before we get into sound, materials, or finish, we begin by understanding the role this drum is meant to play in your world.',
    questions: [
      {
        id: 'playerProfileQuestion',
        label: 'Which best describes you right now as a drummer?',
        fields: [
          {
            id: 'playerProfile',
            label: 'Which best describes you right now as a drummer?',
            type: 'select',
            options: PLAYER_PROFILE_OPTIONS,
            defaultValue: '',
          },
        ],
      },
      {
        id: 'primaryGoalQuestion',
        label: 'What are you hoping this drum becomes for you?',
        fields: [
          {
            id: 'primaryGoal',
            label: 'What are you hoping this drum becomes for you?',
            type: 'select',
            options: PRIMARY_GOAL_OPTIONS,
            defaultValue: '',
          },
        ],
      },
      {
        id: 'environmentQuestion',
        label: 'Where does this drum most need to succeed?',
        fields: [
          {
            id: 'environments',
            label: 'Where does this drum most need to succeed?',
            type: 'multiSelect',
            options: ENVIRONMENT_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'guidanceQuestion',
        label: 'How much craftsman guidance do you want during the build process?',
        fields: [
          {
            id: 'guidancePreference',
            label:
              'How much craftsman guidance do you want during the build process?',
            type: 'select',
            options: GUIDANCE_PREFERENCE_OPTIONS,
            defaultValue: '',
          },
        ],
      },
    ],
  },
  {
    id: 'feel',
    title: 'Feel',
    shortTitle: 'Feel',
    truthLabel: 'The second truth',
    description:
      'Feel is how the drum meets you — rebound, comfort, sensitivity, control, and physical connection.',
    storyIntro:
      'Feel is personal in a way that is hard to fake. It is the handshake between the instrument and the player. It is what you notice in the first few strokes before you have even found words for it. A drum can have a beautiful voice and still miss the mark if it does not return something meaningful to your hands.',
    questions: [
      {
        id: 'feelPrioritiesQuestion',
        label: 'What kind of feel matters most to you under the stick?',
        fields: [
          {
            id: 'feelPriorities',
            label: 'What kind of feel matters most to you under the stick?',
            type: 'multiSelect',
            options: FEEL_PRIORITY_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'snareLoveMostQuestion',
        label: 'What do you love most when a snare feels right?',
        fields: [
          {
            id: 'snareLoveMost',
            label: 'What do you love most when a snare feels right?',
            type: 'multiSelect',
            options: SNARE_LOVE_MOST_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'snareFrustrationsQuestion',
        label:
          'What tends to frustrate you most about snares that miss the mark?',
        fields: [
          {
            id: 'snareFrustrations',
            label:
              'What tends to frustrate you most about snares that miss the mark?',
            type: 'multiSelect',
            options: SNARE_FRUSTRATION_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'dynamicFeelQuestion',
        label: 'Does low-volume sensitivity matter a lot to you?',
        fields: [
          {
            id: 'dynamicFeel',
            label: 'Does low-volume sensitivity matter a lot to you?',
            type: 'select',
            options: DYNAMIC_PRIORITY_OPTIONS,
            defaultValue: '',
          },
        ],
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice',
    shortTitle: 'Voice',
    truthLabel: 'The third truth',
    description:
      'Voice is what the drum says — its sonic identity, tonal character, and musical language.',
    storyIntro:
      'Voice is what the drum says. It is the sonic identity, tonal character, and musical language you are drawn to. Some players already hear it clearly. Others only know the feeling they are chasing. Both are valid starting points.',
    questions: [
      {
        id: 'genreQuestion',
        label: 'What genres or styles do you play most?',
        fields: [
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
        id: 'tonalGoalsQuestion',
        label: 'What kind of sound are you most drawn to?',
        fields: [
          {
            id: 'tonalGoals',
            label: 'What kind of sound are you most drawn to?',
            type: 'multiSelect',
            options: TONAL_GOAL_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'responsePrioritiesQuestion',
        label: 'Which sound behaviors matter most to you?',
        fields: [
          {
            id: 'responsePriorities',
            label: 'Which sound behaviors matter most to you?',
            type: 'multiSelect',
            options: RESPONSE_PRIORITY_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'sizeDirectionQuestion',
        label: 'What size are you leaning toward right now?',
        fields: [
          {
            id: 'sizeDirection',
            label: 'What size are you leaning toward right now?',
            type: 'select',
            options: SIZE_DIRECTION_OPTIONS,
            defaultValue: '',
            helperText:
              'This is not a final commitment. It simply helps us understand the voice and range you may already be gravitating toward.',
          },
        ],
      },
    ],
  },
  {
    id: 'legacy',
    title: 'Legacy',
    shortTitle: 'Legacy',
    truthLabel: 'The fourth truth',
    description:
      'Legacy is why it matters — your story, your influences, the visual character, and the meaning behind the build.',
    storyIntro:
      'Legacy is where the build becomes more than a product. Sometimes that meaning is loud and obvious. Sometimes it is quiet and deeply personal. It may live in a season of life, a visual instinct, a player’s story, a memory, a dream, a future project, or simply the desire to finally own something that feels fully yours.',
    questions: [
      {
        id: 'visualDirectionQuestion',
        label: 'What visual direction are you most drawn to?',
        fields: [
          {
            id: 'visualDirection',
            label: 'What visual direction are you most drawn to?',
            type: 'multiSelect',
            options: VISUAL_DIRECTION_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'hardwareFinishQuestion',
        label: 'Which hardware finish are you most drawn to?',
        fields: [
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
        id: 'storyImportanceQuestion',
        label: 'How meaningful or personal does this build feel to you?',
        fields: [
          {
            id: 'storyImportance',
            label: 'How meaningful or personal does this build feel to you?',
            type: 'select',
            options: STORY_IMPORTANCE_OPTIONS,
            defaultValue: '',
          },
        ],
      },
      {
        id: 'favoritePartQuestion',
        label: 'What is your favorite part about playing drums?',
        fields: [
          {
            id: 'favoritePartOfPlaying',
            label: 'What is your favorite part about playing drums?',
            type: 'multiSelect',
            options: FAVORITE_PART_OF_PLAYING_OPTIONS,
            defaultValue: [],
          },
        ],
      },
      {
        id: 'influenceAndStoryQuestion',
        label: 'What has been influencing you lately, or anything else you want the craftsman to know before the call?',
        optional: true,
        fields: [
          {
            id: 'influenceReferences',
            label: 'Who or what has been influencing you lately?',
            type: 'textarea',
            rows: 4,
            placeholder:
              'Artists, records, sounds, visual inspiration, seasons of life, or anything else that feels meaningful.',
            defaultValue: '',
            optional: true,
          },
          {
            id: 'finalNotes',
            label:
              'Anything else you would like the craftsman to know before your call?',
            type: 'textarea',
            rows: 5,
            placeholder:
              'You can mention your story, current season of life, upcoming shows, a dream snare, or why this build matters to you.',
            defaultValue: '',
            optional: true,
          },
        ],
      },
    ],
  },
  {
    id: 'consult',
    title: 'Consult',
    shortTitle: 'Consult',
    truthLabel: 'The final step',
    description:
      'A few quick scheduling preferences so we can make the consultation easy to coordinate.',
    storyIntro:
      'Once the first truths are in place, the consultation becomes much more useful. This last section is just a simple way to help us coordinate the call and keep the process moving smoothly.',
    questions: [
      {
        id: 'consultSchedulingQuestion',
        label: 'Let’s coordinate your consultation',
        helperText:
          'These three answers work together as one final scheduling step.',
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
        ],
      },
    ],
  },
];

export function buildConsultationIntakeDefaults() {
  return CONSULTATION_INTAKE_SECTIONS.reduce((acc, section) => {
    acc[section.id] = (section.questions || []).reduce((questionAcc, question) => {
      (question.fields || []).forEach((field) => {
        questionAcc[field.id] = field.defaultValue;
      });
      return questionAcc;
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

  for (const question of section.questions || []) {
    const found = (question.fields || []).find((field) => field.id === fieldId);
    if (found) return found;
  }

  return null;
}

export function isConsultationIntakeComplete(intake = {}) {
  const normalized = intake || {};

  return CONSULTATION_INTAKE_SECTIONS.every((section) =>
    (section.questions || []).every((question) =>
      (question.fields || []).every((field) => {
        if (field.optional) return true;

        const value = normalized?.[section.id]?.[field.id];

        if (field.type === 'multiSelect') {
          return Array.isArray(value) && value.length > 0;
        }

        return String(value || '').trim() !== '';
      })
    )
  );
}