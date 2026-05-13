// scripts/test-heritage-first-listen-matrix.mjs

import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const AXIS_META = [

  { key: 'attack', label: 'Attack' },

  { key: 'brightness', label: 'Brightness' },

  { key: 'projection', label: 'Projection' },

  { key: 'sustain', label: 'Sustain' },

  { key: 'warmth', label: 'Warmth' },

  { key: 'sensitivity', label: 'Sensitivity' },

  { key: 'control', label: 'Control' },

];

const DEFAULT_BENCHMARK_FAMILY_ID = 'ober-custom';

const DEFAULT_BENCHMARK_TYPE_ID = 'heritage-oak-reference';

const DEFAULT_BENCHMARK_SIZE_ID = '14x5_5';

const HERITAGE_VOICE_READ_HARDWARE_COLOR = 'Chrome';

const sizes = ['12', '13', '14'];

const depthsBySize = {

  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

};

const staveOptionsBySize = {

  12: ['16 - 13mm', '12 - 8mm + $150 (Re-Rings Required)'],

  13: ['16 - 12mm'],

  14: ['20 - 15mm', '16 - 11mm', '10 - 7mm + $150 (Re-Rings Required)'],

};

const lugOptionsByShellRecipe = {

  '12|16 - 13mm': ['8'],

  '12|12 - 8mm + $150 (Re-Rings Required)': ['6'],

  '13|16 - 12mm': ['8'],

  '14|20 - 15mm': ['10'],

  '14|16 - 11mm': ['8'],

  '14|10 - 7mm + $150 (Re-Rings Required)': ['10'],

};

const hoopTypes = ['Triple Flange', 'Die-Cast'];

const scorchDepths = ['Light Torch', 'Medium Torch', 'Blackened'];

const hasReRingFromStaveOption = (option = '') => {

  const text = String(option);

  return (

    text.includes('Re-Rings') ||

    text.includes('Re-rings') ||

    text.includes('Re Rings') ||

    text.includes('+$150') ||

    text.includes('+ $150')

  );

};

const getStaveCountLabel = (option = '') => {

  const match = String(option).match(/^(\d+)/);

  return match ? `${match[1]} stave` : option;

};

const getStaveThicknessLabel = (option = '') => {

  const cleaned = String(option).replace(' + $150 (Re-Rings Required)', '');

  const parts = cleaned.split(' - ');

  return parts[1] || '';

};

const getNormalizedFirstTellDepthKey = (value) => {

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {

    return String(value || '');

  }

  return numberValue.toFixed(1);

};

const getFirstTellSpecMeta = ({

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,

}) => {

  const sizeNumber = Number(size);

  const depthNumber = Number(depth);

  const lugNumber = Number(lugs);

  const thicknessLabel = getStaveThicknessLabel(staveOption);

  const thicknessNumber = Number(String(thicknessLabel).replace('mm', ''));

  const hasReRings = hasReRingFromStaveOption(staveOption);

  return {

    sizeNumber: Number.isFinite(sizeNumber) ? sizeNumber : 14,

    depthNumber: Number.isFinite(depthNumber) ? depthNumber : 5.5,

    lugNumber: Number.isFinite(lugNumber) ? lugNumber : 8,

    thicknessNumber: Number.isFinite(thicknessNumber) ? thicknessNumber : 10,

    thicknessLabel,

    hasReRings,

    isDeep: Number(depthNumber) >= 7,

    isVeryDeep: Number(depthNumber) >= 7.5,

    isShallow: Number(depthNumber) <= 5.5,

    isCompact: Number(sizeNumber) <= 12,

    isMiddle: Number(sizeNumber) === 13,

    isFullSize: Number(sizeNumber) >= 14,

    isDieCast: hoopType === 'Die-Cast',

    isTripleFlange: hoopType === 'Triple Flange',

    isBlackened: scorchDepth === 'Blackened',

    isLightTorch: scorchDepth === 'Light Torch',

    isMediumTorch: scorchDepth === 'Medium Torch',

    isThinShell: Number(thicknessNumber) <= 8,

    isVeryThinShell: Number(thicknessNumber) <= 7,

    isBalancedShell: Number(thicknessNumber) > 8 && Number(thicknessNumber) < 13,

    isThickShell: Number(thicknessNumber) >= 13,

    isTenLug: Number(lugNumber) >= 10,

    isEightLug: Number(lugNumber) === 8,

    isSixLug: Number(lugNumber) <= 6,

  };

};

const HERITAGE_FIRST_TELL_DEPTH_MAP = {

  12: {

    '5.0': ['attack', 'brightness', 'sensitivity'],

    '5.5': ['attack', 'sensitivity', 'brightness'],

    '6.0': ['attack', 'sensitivity', 'control'],

    '6.5': ['attack', 'control', 'sensitivity'],

    '7.0': ['control', 'attack', 'projection'],

    '7.5': ['projection', 'control', 'attack'],

    '8.0': ['projection', 'sustain', 'warmth'],

  },

  13: {

    '5.0': ['attack', 'brightness', 'control'],

    '5.5': ['attack', 'control', 'brightness'],

    '6.0': ['control', 'attack', 'warmth'],

    '6.5': ['warmth', 'control', 'attack'],

    '7.0': ['warmth', 'projection', 'control'],

    '7.5': ['warmth', 'sustain', 'projection'],

    '8.0': ['sustain', 'warmth', 'projection'],

  },

  14: {

    '5.0': ['attack', 'warmth', 'control'],

    '5.5': ['warmth', 'attack', 'control'],

    '6.0': ['warmth', 'attack', 'projection'],

    '6.5': ['warmth', 'projection', 'attack'],

    '7.0': ['warmth', 'projection', 'control'],

    '7.5': ['warmth', 'sustain', 'projection'],

    '8.0': ['sustain', 'warmth', 'projection'],

  },

};

const getBaseFirstTellDepthNodes = ({ size, depth }) => {

  const sizeKey = String(size);

  const depthKey = getNormalizedFirstTellDepthKey(depth);

  return (

    HERITAGE_FIRST_TELL_DEPTH_MAP[sizeKey]?.[depthKey] || [

      'warmth',

      'attack',

      'control',

    ]

  );

};

const getFirstTellProfilePriority = (profile = {}) => {

  return AXIS_META.map(({ key }) => {

    const value = Number(profile?.[key] ?? 5);

    return {

      key,

      distance: Math.abs(value - 5),

      value,

    };

  })

    .sort((a, b) => {

      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;

    })

    .map((item) => item.key);

};

const mergeFirstTellNodes = (...nodeGroups) => {

  const merged = [];

  nodeGroups.flat().forEach((nodeKey) => {

    if (!nodeKey || merged.includes(nodeKey)) return;

    merged.push(nodeKey);

  });

  return merged.slice(0, 3);

};

const FIRST_TELL_RULES = [

  /*

    IMPORTANT:

    These are ordered from most-specific to most-general.

    Hardware color is intentionally absent from all rules.

    Hardware finish should affect price / visual summary only,

    not First Listen / Player Analysis / LegacyTuning logic.

  */

  {

    id: 'thin-rering-light-open-touch',

    test: (meta) => meta.isThinShell && meta.hasReRings && meta.isLightTorch,

    title: 'Open touch with woody bloom',

    nodes: ['sensitivity', 'sustain', 'warmth'],

    description:

      'Thin re-ring shells with a lighter torch should feel more breathing, responsive, and wood-forward before they feel locked or dry.',

  },

  {

    id: 'thin-rering-blackened-dry-touch',

    test: (meta) => meta.isThinShell && meta.hasReRings && meta.isBlackened,

    title: 'Dry open touch with dark control',

    nodes: ['sensitivity', 'control', 'warmth'],

    description:

      'The thin shell still breathes, but the deeper scorch pulls the first impression toward drier control and darker body.',

  },

  {

    id: 'thin-rering-medium-supported-bloom',

    test: (meta) => meta.isThinShell && meta.hasReRings,

    title: 'Responsive shell with supported bloom',

    nodes: ['sensitivity', 'warmth', 'sustain'],

    description:

      'The re-rings support the thin shell while still leaving the first impression responsive, woody, and open.',

  },

  {

    id: 'compact-5-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber <= 5 && meta.isTripleFlange,

    title: 'Quick snap with open touch',

    nodes: ['attack', 'brightness', 'sensitivity'],

    description:

      'The smallest shallow open-hoop Heritage path should read fast, bright, and touch-sensitive first.',

  },

  {

    id: 'compact-5-diecast',

    test: (meta) => meta.isCompact && meta.depthNumber <= 5 && meta.isDieCast,

    title: 'Tight snap with locked-in edge',

    nodes: ['attack', 'control', 'brightness'],

    description:

      'The shallow compact shell stays fast, but die-cast hoops pull the first read toward firmer control.',

  },

  {

    id: 'compact-5-5-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 5.5 && meta.isTripleFlange,

    title: 'Fast touch with clear edge',

    nodes: ['attack', 'sensitivity', 'brightness'],

    description:

      'The 5.5 depth keeps compact speed but adds slightly more body than the 5 inch path.',

  },

  {

    id: 'compact-5-5-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 5.5 && meta.isDieCast,

    title: 'Compact punch with clean control',

    nodes: ['attack', 'control', 'sensitivity'],

    description:

      'Still compact and quick, but the hoop choice gives the first impression a more organized front edge.',

  },

  {

    id: 'compact-6-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 6 && meta.isTripleFlange,

    title: 'Added compact body with open response',

    nodes: ['attack', 'sensitivity', 'control'],

    description:

      'The 6 inch compact shell keeps speed but starts adding enough body to feel less purely piccolo-like.',

  },

  {

    id: 'compact-6-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 6 && meta.isDieCast,

    title: 'Focused compact punch',

    nodes: ['control', 'attack', 'projection'],

    description:

      'At 6 inches, die-cast hoops should make the compact drum feel punchier, firmer, and more shaped.',

  },

  {

    id: 'compact-6-5-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 6.5 && meta.isTripleFlange,

    title: 'Compact body with lively response',

    nodes: ['attack', 'projection', 'sensitivity'],

    description:

      'The shell gains room push without losing the compact quickness of the smaller diameter.',

  },

  {

    id: 'compact-6-5-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 6.5 && meta.isDieCast,

    title: 'Controlled compact punch',

    nodes: ['control', 'attack', 'projection'],

    description:

      'The 6.5 compact build should read as punchy and controlled, not huge or overly blooming.',

  },

  {

    id: 'compact-7-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 7 && meta.isTripleFlange,

    title: 'Compact depth with lively room push',

    nodes: ['projection', 'attack', 'sensitivity'],

    description:

      'The added depth pushes more air, but the 12 inch diameter keeps the first read quick and compact.',

  },

  {

    id: 'compact-7-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 7 && meta.isDieCast,

    title: 'Controlled compact depth',

    nodes: ['control', 'projection', 'attack'],

    description:

      'Die-cast hoops turn the deeper compact shell into a tighter, more directed punch.',

  },

  {

    id: 'compact-7-5-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 7.5 && meta.isTripleFlange,

    title: 'Compact room push with open bloom',

    nodes: ['projection', 'sustain', 'warmth'],

    description:

      'At 7.5 inches, the compact shell starts showing real depth, but still as a smaller voice with room push.',

  },

  {

    id: 'compact-7-5-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber === 7.5 && meta.isDieCast,

    title: 'Compact body with focused throw',

    nodes: ['projection', 'control', 'warmth'],

    description:

      'The depth adds body and projection while die-cast hoops keep the note shaped.',

  },

  {

    id: 'compact-8-open',

    test: (meta) =>

      meta.isCompact && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Compact depth with open bloom',

    nodes: ['projection', 'sustain', 'warmth'],

    description:

      'Maximum compact depth should read larger and more blooming, but still not like a full 14 inch main snare.',

  },

  {

    id: 'compact-8-diecast',

    test: (meta) =>

      meta.isCompact && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Compact depth with locked-in punch',

    nodes: ['projection', 'control', 'warmth'],

    description:

      'Maximum compact depth with die-cast hoops should feel punchy, shaped, and physically present.',

  },

  {

    id: 'middle-5-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber <= 5 && meta.isTripleFlange,

    title: 'Quick alternate voice with clear edge',

    nodes: ['attack', 'brightness', 'control'],

    description:

      'A shallow 13 inch Heritage build should read quick and articulate with a little more body than the 12 inch path.',

  },

  {

    id: 'middle-5-diecast',

    test: (meta) => meta.isMiddle && meta.depthNumber <= 5 && meta.isDieCast,

    title: 'Tight alternate snap with clean control',

    nodes: ['attack', 'control', 'brightness'],

    description:

      'The 13 inch shallow path stays fast, while die-cast hoops organize the note sooner.',

  },

  {

    id: 'middle-5-5-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 5.5 && meta.isTripleFlange,

    title: 'Balanced alternate voice',

    nodes: ['attack', 'control', 'brightness'],

    description:

      'The 13 x 5.5 path should feel balanced, quick, and usable as an alternate main snare.',

  },

  {

    id: 'middle-5-5-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 5.5 && meta.isDieCast,

    title: 'Balanced snap with firmer control',

    nodes: ['control', 'attack', 'brightness'],

    description:

      'Die-cast hoops make the balanced 13 inch path feel more focused and slightly less open.',

  },

  {

    id: 'middle-6-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 6 && meta.isTripleFlange,

    title: 'Warm alternate body with a clear start',

    nodes: ['warmth', 'attack', 'control'],

    description:

      'At 6 inches, the 13 inch shell starts reading warmer without losing its alternate-snare clarity.',

  },

  {

    id: 'middle-6-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 6 && meta.isDieCast,

    title: 'Warm body with clean focus',

    nodes: ['warmth', 'control', 'attack'],

    description:

      'This should read as the focused version of the 13 x 6 path: warm, clean, and organized.',

  },

  {

    id: 'middle-6-5-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 6.5 && meta.isTripleFlange,

    title: 'Rounded alternate body with open carry',

    nodes: ['warmth', 'projection', 'attack'],

    description:

      'The 13 x 6.5 open-hoop path should add body and carry while staying quicker than deeper shells.',

  },

  {

    id: 'middle-6-5-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 6.5 && meta.isDieCast,

    title: 'Fuller alternate body with clean control',

    nodes: ['warmth', 'control', 'projection'],

    description:

      'Die-cast hoops shape the fuller 13 inch body into a more controlled and present voice.',

  },

  {

    id: 'middle-7-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 7 && meta.isTripleFlange,

    title: 'Warm alternate body with open carry',

    nodes: ['warmth', 'projection', 'sustain'],

    description:

      'The 13 x 7 path should clearly move past centered balance into body, carry, and bloom.',

  },

  {

    id: 'middle-7-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 7 && meta.isDieCast,

    title: 'Warm alternate body with focused push',

    nodes: ['warmth', 'projection', 'control'],

    description:

      'This is the controlled 13 x 7 read: warm and present, but less openly blooming than triple flange.',

  },

  {

    id: 'middle-7-5-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 7.5 && meta.isTripleFlange,

    title: 'Deep alternate bloom with room presence',

    nodes: ['warmth', 'sustain', 'projection'],

    description:

      'At 7.5 inches, the 13 inch shell should feel deep and blooming while still tighter than a 14 inch deep shell.',

  },

  {

    id: 'middle-7-5-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber === 7.5 && meta.isDieCast,

    title: 'Deep alternate body with controlled room push',

    nodes: ['warmth', 'projection', 'control'],

    description:

      'The 13 x 7.5 die-cast path should read big but controlled, with projection ahead of ring.',

  },

  {

    id: 'middle-8-open',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Full alternate voice with extended bloom',

    nodes: ['sustain', 'warmth', 'projection'],

    description:

      'Maximum 13 inch depth should read as the most blooming alternate voice in the Heritage range.',

  },

  {

    id: 'middle-8-diecast',

    test: (meta) =>

      meta.isMiddle && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Deep alternate voice with shaped control',

    nodes: ['warmth', 'control', 'projection'],

    description:

      'Maximum 13 inch depth with die-cast hoops should feel big, lower, and organized.',

  },

  {

    id: 'full-5-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber <= 5 && meta.isTripleFlange,

    title: 'Warm body with quick response',

    nodes: ['attack', 'warmth', 'control'],

    description:

      'A shallow 14 inch Heritage build should keep a familiar full-size center while staying quick.',

  },

  {

    id: 'full-5-diecast',

    test: (meta) => meta.isFullSize && meta.depthNumber <= 5 && meta.isDieCast,

    title: 'Warm snap with firm control',

    nodes: ['control', 'attack', 'warmth'],

    description:

      'Die-cast hoops bring the shallow 14 inch shell toward a tighter, cleaner response.',

  },

  {

    id: 'full-5-5-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 5.5 && meta.isTripleFlange,

    title: 'Classic warm Heritage center',

    nodes: ['warmth', 'attack', 'control'],

    description:

      'The standard 14 x 5.5 open-hoop Heritage path should read warm, familiar, and balanced.',

  },

  {

    id: 'full-5-5-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 5.5 && meta.isDieCast,

    title: 'Classic body with cleaner focus',

    nodes: ['warmth', 'control', 'attack'],

    description:

      'Die-cast hoops keep the classic Heritage center but make the note more focused.',

  },

  {

    id: 'full-6-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 6 && meta.isTripleFlange,

    title: 'Warm body with clear room push',

    nodes: ['warmth', 'attack', 'projection'],

    description:

      'The 14 x 6 path should add body and room push while keeping a clear enough front edge.',

  },

  {

    id: 'full-6-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 6 && meta.isDieCast,

    title: 'Warm body with clean focus',

    nodes: ['warmth', 'control', 'attack'],

    description:

      'This should be the focused 14 x 6 read: still warm, but more shaped under the stick.',

  },

  {

    id: 'full-6-5-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 6.5 && meta.isTripleFlange,

    title: 'Fuller body with open room push',

    nodes: ['warmth', 'projection', 'attack'],

    description:

      'The 14 x 6.5 open-hoop path should clearly feel fuller and more present than 6 inches.',

  },

  {

    id: 'full-6-5-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 6.5 && meta.isDieCast,

    title: 'Fuller body with focused room push',

    nodes: ['warmth', 'projection', 'control'],

    description:

      'Die-cast hoops should make the 14 x 6.5 path feel fuller but more controlled than open hoops.',

  },

  {

    id: 'full-7-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 7 && meta.isTripleFlange,

    title: 'Deep warmth with open carry',

    nodes: ['warmth', 'projection', 'sustain'],

    description:

      'The 14 x 7 open-hoop path should move into deeper body, more carry, and a more open note tail.',

  },

  {

    id: 'full-7-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 7 && meta.isDieCast,

    title: 'Deep warmth with clear presence',

    nodes: ['warmth', 'projection', 'control'],

    description:

      'The 14 x 7 die-cast path should feel deeper and more present, while keeping the note organized.',

  },

  {

    id: 'full-7-5-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 7.5 && meta.isTripleFlange,

    title: 'Big warmth with longer room bloom',

    nodes: ['warmth', 'sustain', 'projection'],

    description:

      'The 14 x 7.5 open-hoop path should read bigger, more blooming, and more physical than 7 inches.',

  },

  {

    id: 'full-7-5-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber === 7.5 && meta.isDieCast,

    title: 'Big body with focused room push',

    nodes: ['warmth', 'projection', 'control'],

    description:

      'This is the controlled big-body path: stronger room push with less loose bloom than open hoops.',

  },

  {

    id: 'full-8-open',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Maximum depth with extended bloom',

    nodes: ['sustain', 'warmth', 'projection'],

    description:

      'The deepest full-size open-hoop path should read as the broadest, longest-blooming Heritage option.',

  },

  {

    id: 'full-8-diecast',

    test: (meta) =>

      meta.isFullSize && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Maximum body with focused control',

    nodes: ['warmth', 'control', 'projection'],

    description:

      'The deepest full-size die-cast path should feel large and grounded, but controlled rather than loose.',

  },

  {

    id: 'blackened-shallow',

    test: (meta) => meta.isShallow && meta.isBlackened,

    title: 'Dry snap with dark control',

    nodes: ['attack', 'control', 'brightness'],

    description:

      'Blackened shallow builds should feel darker and drier while preserving the quick shallow response.',

  },

  {

    id: 'blackened-deep',

    test: (meta) => meta.isDeep && meta.isBlackened,

    title: 'Dark, deep controlled body',

    nodes: ['warmth', 'control', 'projection'],

    description:

      'Blackened deep builds should keep the deeper body but pull the first read toward dryness and control.',

  },

  {

    id: 'thick-shell-diecast',

    test: (meta) =>

      meta.isDieCast && meta.isThickShell && !meta.isMiddle && !meta.isShallow,

    title: 'Focused power with clean shape',

    nodes: ['projection', 'control', 'attack'],

    description:

      'Thick oak shells with die-cast hoops should read powerful, stiff, focused, and controlled.',

  },

  {

    id: 'thick-shell-open-hoop',

    test: (meta) =>

      meta.isTripleFlange &&

      meta.isThickShell &&

      !meta.isMiddle &&

      !meta.isShallow,

    title: 'Strong shell voice with open carry',

    nodes: ['projection', 'attack', 'warmth'],

    description:

      'Thick oak shells with open hoops should still carry strongly, but with more shell openness than die-cast.',

  },

  {

    id: 'ten-lug-diecast',

    test: (meta) => meta.isTenLug && meta.isDieCast,

    title: 'Precise throw with locked-in shape',

    nodes: ['control', 'projection', 'attack'],

    description:

      'Ten-lug die-cast builds should read as the most precise and organized hardware response.',

  },

  {

    id: 'ten-lug-open-hoop',

    test: (meta) => meta.isTenLug && meta.isTripleFlange,

    title: 'Clear throw with controlled openness',

    nodes: ['projection', 'control', 'brightness'],

    description:

      'Ten-lug open-hoop builds should carry clearly but remain more open than die-cast.',

  },

  {

    id: 'medium-center-diecast',

    test: (meta) =>

      !meta.isDeep && !meta.isShallow && meta.isDieCast && !meta.isThickShell,

    title: 'Settled center with clean control',

    nodes: ['warmth', 'control', 'attack'],

    description:

      'Mid-depth die-cast builds should read balanced, warm, and cleaner than their open-hoop equivalent.',

  },

];

const fallbackTitleMap = {

  '12|5.0': 'Quick, tight first response',

  '12|5.5': 'Fast touch with clear edge',

  '12|6.0': 'Quick response with controlled shape',

  '12|6.5': 'Focused snap with clean control',

  '12|7.0': 'Controlled punch with tight focus',

  '12|7.5': 'Compact throw with shaped control',

  '12|8.0': 'Focused depth with firm projection',

  '13|5.0': 'Quick center with clean shape',

  '13|5.5': 'Balanced, clear first response',

  '13|6.0': 'Settled center with quick control',

  '13|6.5': 'Rounded body with a clear start',

  '13|7.0': 'Warm, deep settled center',

  '13|7.5': 'Deep body with room presence',

  '13|8.0': 'Full, warm extended bloom',

  '14|5.0': 'Warm body with a quick start',

  '14|5.5': 'Classic warm Heritage center',

  '14|6.0': 'Added body with quick response',

  '14|6.5': 'Warm body with room push',

  '14|7.0': 'Deep warmth with open bloom',

  '14|7.5': 'Big warm bloom with presence',

  '14|8.0': 'Maximum body and deep bloom',

};

const getCuratedFirstTell = ({

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,

}) => {

  const meta = getFirstTellSpecMeta({

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,

  });

  const matchedRule = FIRST_TELL_RULES.find((rule) => rule.test(meta));

  const baseNodes = getBaseFirstTellDepthNodes({ size, depth });

  const profilePriority = getFirstTellProfilePriority(profile);

  if (matchedRule) {

    return {

      title: matchedRule.title,

      description: matchedRule.description,

      nodes: mergeFirstTellNodes(matchedRule.nodes, baseNodes, profilePriority),

      ruleId: matchedRule.id,

    };

  }

  const depthKey = getNormalizedFirstTellDepthKey(depth);

  return {

    title:

      fallbackTitleMap[`${String(size)}|${depthKey}`] ||

      'Classic Heritage first tell',

    description:

      'Fallback depth-first read. This means no more specific rule matched, so review whether a dedicated rule should exist for this path.',

    nodes: mergeFirstTellNodes(baseNodes, profilePriority),

    ruleId: 'depth-fallback',

  };

};

const getDominantVoiceNodes = ({

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,

}) => {

  const curated = getCuratedFirstTell({

    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,

  });

  return {

    title: curated.title,

    description: curated.description,

    nodes: curated.nodes,

    ruleId: curated.ruleId,

  };

};

const getValue = (profile, key) => {

  const value = Number(profile?.[key]);

  return Number.isFinite(value) ? value : 5;

};

const getTopProfileNodes = (profile = {}) => {

  return AXIS_META.map(({ key }) => ({

    key,

    value: getValue(profile, key),

    delta: Number((getValue(profile, key) - 5).toFixed(2)),

    distance: Math.abs(getValue(profile, key) - 5),

  }))

    .sort((a, b) => {

      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;

    })

    .slice(0, 3);

};

const getNodeLabels = (nodes = []) => {

  return nodes

    .map((nodeKey) => AXIS_META.find((axis) => axis.key === nodeKey)?.label)

    .filter(Boolean)

    .join(' / ');

};

const getProfileSnapshot = (profile = {}) => {

  return AXIS_META.map(({ key }) => {

    const label = key.padEnd(11, ' ');

    const value = getValue(profile, key).toFixed(2);

    return `${label}${value}`;

  }).join(' | ');

};

const getMonotonicDepthWarnings = (rows = []) => {

  const warnings = [];

  const byRecipe = new Map();

  rows.forEach((row) => {

    const key = [

      row.size,

      row.staveOption,

      row.lugs,

      row.hoopType,

      row.scorchDepth,

    ].join('|');

    if (!byRecipe.has(key)) byRecipe.set(key, []);

    byRecipe.get(key).push(row);

  });

  byRecipe.forEach((recipeRows, recipeKey) => {

    const sortedRows = [...recipeRows].sort(

      (a, b) => Number(a.depth) - Number(b.depth)

    );

    for (let i = 1; i < sortedRows.length; i += 1) {

      const previous = sortedRows[i - 1];

      const current = sortedRows[i];

      const previousWarmth = getValue(previous.profile, 'warmth');

      const currentWarmth = getValue(current.profile, 'warmth');

      const previousSustain = getValue(previous.profile, 'sustain');

      const currentSustain = getValue(current.profile, 'sustain');

      const previousAttack = getValue(previous.profile, 'attack');

      const currentAttack = getValue(current.profile, 'attack');

      const depthStep = `${previous.depth}" → ${current.depth}"`;

      if (currentWarmth + 0.05 < previousWarmth) {

        warnings.push(

          `[Warmth drops with depth] ${recipeKey} | ${depthStep} | ${previousWarmth.toFixed(

            2

          )} → ${currentWarmth.toFixed(2)}`

        );

      }

      if (Number(current.depth) >= 6.5 && currentSustain + 0.05 < previousSustain) {

        warnings.push(

          `[Sustain drops in deeper range] ${recipeKey} | ${depthStep} | ${previousSustain.toFixed(

            2

          )} → ${currentSustain.toFixed(2)}`

        );

      }

      if (Number(current.depth) >= 7 && currentAttack > previousAttack + 0.45) {

        warnings.push(

          `[Attack jumps in deeper range] ${recipeKey} | ${depthStep} | ${previousAttack.toFixed(

            2

          )} → ${currentAttack.toFixed(2)}`

        );

      }

    }

  });

  return warnings;

};

const getHardwareColorWarnings = (rows = []) => {

  const warnings = [];

  const hardwareColorsToCompare = ['Chrome', 'Black Nickel', 'Brass/Gold'];

  rows.forEach((baseRow) => {

    if (baseRow.hardwareColor !== 'Chrome') return;

    hardwareColorsToCompare.slice(1).forEach((hardwareColor) => {

      const summary = buildHeritageVoiceRead({

        size: baseRow.size,

        depth: baseRow.depth,

        lugs: baseRow.lugs,

        staveOption: baseRow.staveOption,

        hardwareColor,

        hoopType: baseRow.hoopType,

        scorchDepth: baseRow.scorchDepth,

        benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

        benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

        benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,

      });

      const profile = summary?.profile || {};

      const diffs = AXIS_META.map(({ key }) => {

        return Math.abs(getValue(baseRow.profile, key) - getValue(profile, key));

      });

      const maxDiff = Math.max(...diffs);

      if (maxDiff > 0.001) {

        warnings.push(

          `[Hardware color changes voice read] ${baseRow.size}x${baseRow.depth} | ${baseRow.staveOption} | ${baseRow.lugs} lugs | ${baseRow.hoopType} | ${baseRow.scorchDepth} | Chrome vs ${hardwareColor} max diff ${maxDiff.toFixed(

            4

          )}`

        );

      }

    });

  });

  return warnings;

};

const rows = [];

for (const size of sizes) {

  for (const depth of depthsBySize[size]) {

    for (const staveOption of staveOptionsBySize[size]) {

      const lugs =

        lugOptionsByShellRecipe[`${size}|${staveOption}`]?.[0] ||

        (size === '14' ? '8' : '8');

      for (const hoopType of hoopTypes) {

        for (const scorchDepth of scorchDepths) {

          const summary = buildHeritageVoiceRead({

            size,

            depth,

            lugs,

            staveOption,

            hardwareColor: HERITAGE_VOICE_READ_HARDWARE_COLOR,

            hoopType,

            scorchDepth,

            benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

            benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

            benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,

          });

          const profile = summary?.profile || {};

          const firstTell = getDominantVoiceNodes({

            profile,

            size,

            depth,

            lugs,

            staveOption,

            hoopType,

            scorchDepth,

          });

          const topProfileNodes = getTopProfileNodes(profile);

          rows.push({

            size,

            depth,

            lugs,

            staveOption,

            hoopType,

            scorchDepth,

            profile,

            title: firstTell.title,

            description: firstTell.description,

            nodes: firstTell.nodes,

            ruleId: firstTell.ruleId,

            topProfileNodes,

            sourceBuildRead: summary?.sourceBuildRead || '',

          });

        }

      }

    }

  }

}

console.log('\nHERITAGE FIRST LISTEN CONFIG MATRIX');

console.log('='.repeat(120));

console.log(`Total configs tested: ${rows.length}`);

console.log(

  'Hardware color used for all voice reads: Chrome only. Hardware finish should not affect voice output.'

);

console.log('='.repeat(120));

let currentGroup = '';

rows.forEach((row) => {

  const groupKey = [

    `${row.size}" diameter`,

    row.staveOption,

    `${row.lugs} lugs`,

  ].join(' | ');

  if (groupKey !== currentGroup) {

    currentGroup = groupKey;

    console.log('\n');

    console.log('#'.repeat(120));

    console.log(groupKey);

    console.log('#'.repeat(120));

  }

  console.log(

    `\n${row.size}x${row.depth} | ${getStaveThicknessLabel(

      row.staveOption

    )} / ${getStaveCountLabel(row.staveOption)} | ${row.lugs} lugs | ${

      row.hoopType

    } | ${row.scorchDepth}`

  );

  console.log(`Rule: ${row.ruleId}`);

  console.log(`Title: ${row.title}`);

  console.log(`Description: ${row.description}`);

  console.log(`First Listen Nodes: ${getNodeLabels(row.nodes)}`);

  console.log(

    `Top Profile Nodes: ${row.topProfileNodes

      .map((node) => `${node.key}:${node.value.toFixed(2)}`)

      .join(' / ')}`

  );

  console.log(`Profile: ${getProfileSnapshot(row.profile)}`);

});

const monotonicWarnings = getMonotonicDepthWarnings(rows);

const hardwareWarnings = getHardwareColorWarnings(rows);

const fallbackRows = rows.filter((row) => row.ruleId === 'depth-fallback');

console.log('\n');

console.log('='.repeat(120));

console.log('CHECKS');

console.log('='.repeat(120));

if (!monotonicWarnings.length) {

  console.log('✅ Depth progression check passed.');

} else {

  console.log(`⚠️ Depth progression warnings: ${monotonicWarnings.length}`);

  monotonicWarnings.forEach((warning) => console.log(` - ${warning}`));

}

if (!hardwareWarnings.length) {

  console.log('✅ Hardware color neutrality check passed.');

} else {

  console.log(`❌ Hardware color warnings: ${hardwareWarnings.length}`);

  hardwareWarnings.forEach((warning) => console.log(` - ${warning}`));

}

if (!fallbackRows.length) {

  console.log('✅ No fallback First Listen rules used.');

} else {

  console.log(`⚠️ Fallback First Listen rules used: ${fallbackRows.length}`);

  fallbackRows.forEach((row) => {

    console.log(

      ` - ${row.size}x${row.depth} | ${row.staveOption} | ${row.lugs} lugs | ${row.hoopType} | ${row.scorchDepth}`

    );

  });

}

console.log('\nDone.\n');