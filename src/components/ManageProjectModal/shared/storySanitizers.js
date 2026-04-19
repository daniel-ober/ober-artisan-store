export const STORY_EMPTYISH_VALUES = [
  '',
  'n/a',
  'na',
  'none',
  'unknown',
  'not sure',
  'noot sure',
  'unsure',
  'tbd',
  'idk',
  'i don’t know',
  "i don't know",
  'not certain',
  'maybe',
];

export const cleanStoryText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

export const isEmptyishStoryValue = (value) => {
  const normalized = cleanStoryText(value).toLowerCase();
  return STORY_EMPTYISH_VALUES.includes(normalized);
};

export const sanitizeFreeformStoryValue = (value) => {
  let text = cleanStoryText(value);
  if (!text) return '';

  const lower = text.toLowerCase();
  if (STORY_EMPTYISH_VALUES.includes(lower)) return '';

  const wholePhraseEmptyPatterns = [
    /^i['’]m not sure$/i,
    /^im not sure$/i,
    /^not sure$/i,
    /^not sure\s*[—-]\s*guide me$/i,
    /^i trust your recommendation$/i,
    /^guide me$/i,
    /^[-—]+\s*guide me$/i,
    /^unsure$/i,
    /^i don['’]t know$/i,
    /^idk$/i,
  ];

  if (wholePhraseEmptyPatterns.some((pattern) => pattern.test(text))) {
    return '';
  }

  text = text
    .replace(/--+\s*already told you.*$/i, '')
    .replace(/\balready told you.*$/i, '')
    .replace(/\basked and answered.*$/i, '')
    .replace(/\s+,/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!text) return '';
  if (isEmptyishStoryValue(text)) return '';

  return text;
};

export const sanitizeCommaSeparatedStoryValue = (value) => {
  if (value === null || value === undefined) return '';

  const items = String(value)
    .split(',')
    .map((item) => sanitizeFreeformStoryValue(item))
    .filter(Boolean);

  return [...new Set(items)].join(', ');
};

export const sanitizeStoryFieldValue = (fieldKey, value) => {
  const multiValueFields = [
    'genreContext',
    'influenceReferences',
    'responsePriorities',
    'tonalGoals',
    'woodPreference',
  ];

  const strictSingleSelectFields = [
    'styleOfPlaying',
    'desiredOutcome',
    'hardwareFinish',
    'preferredSizeDirection',
    'consultationContactMethod',
    'primaryUseCase',
    'attack',
    'body',
    'sensitivity',
    'projection',
    'tuningRange',
    'articulation',
    'feel',
  ];

  if (multiValueFields.includes(fieldKey)) {
    return sanitizeCommaSeparatedStoryValue(value);
  }

  if (strictSingleSelectFields.includes(fieldKey)) {
    return sanitizeFreeformStoryValue(value);
  }

  return sanitizeFreeformStoryValue(value);
};

export const sanitizeStoryFieldGroup = (group = {}) => {
  const next = {};

  Object.entries(group || {}).forEach(([key, value]) => {
    next[key] = sanitizeStoryFieldValue(key, value);
  });

  return next;
};