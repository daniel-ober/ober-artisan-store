
import buildFeuzonVoiceRead from './src/data/legacyPrint/buildFeuzonVoiceRead.js';

import buildHeritageVoiceRead from './src/utils/legacyPrint/buildHeritageVoiceRead.js';

const AXES = [

  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',

];

const REFERENCE_PROFILES = {

  FEUZON_STANDARD: {

    attack: 7.1,

    sustain: 6.32,

    warmth: 6.34,

    projection: 6.92,

    brightness: 6.19,

    sensitivity: 6.42,

    control: 6.48,

  },

  HERITAGE_STANDARD: {

    attack: 5.64,

    sustain: 4.70,

    warmth: 5.07,

    projection: 5.78,

    brightness: 5.13,

    sensitivity: 4.51,

    control: 5.82,

  },

  MAPLE_PLY: {

    attack: 7.05,

    sustain: 5.75,

    warmth: 5.75,

    projection: 6.65,

    brightness: 6.95,

    sensitivity: 6.25,

    control: 6.25,

  },

  BIRCH_PLY: {

    attack: 7.35,

    sustain: 5.55,

    warmth: 5.35,

    projection: 7.25,

    brightness: 7.3,

    sensitivity: 6.1,

    control: 6.45,

  },

  WALNUT_PLY: {

    attack: 6.35,

    sustain: 6.15,

    warmth: 7.15,

    projection: 6.15,

    brightness: 5.45,

    sensitivity: 6.25,

    control: 6.25,

  },

  BRASS: {

    attack: 7.45,

    sustain: 6.65,

    warmth: 6.05,

    projection: 7.55,

    brightness: 7.25,

    sensitivity: 6.5,

    control: 6.35,

  },

  STEEL: {

    attack: 7.85,

    sustain: 6.25,

    warmth: 5.25,

    projection: 7.75,

    brightness: 8.15,

    sensitivity: 6.45,

    control: 6.5,

  },

  THIN_ACRYLIC: {

    attack: 7.75,

    sustain: 6.05,

    warmth: 5.15,

    projection: 7.45,

    brightness: 8.25,

    sensitivity: 6.65,

    control: 6.2,

  },

};

const clamp = (value) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 5;

  return Math.max(1, Math.min(10, Number(num.toFixed(2))));

};

const fmt = (value) => Number(value || 0).toFixed(2);

const signed = (value) => {

  const num = Number(value || 0);

  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}`;

};

const getProfile = (read, fallback = {}) => {

  return read?.absoluteProfile || read?.currentAbsoluteProfile || read?.profile || fallback;

};

const buildRelativeRead = ({ read, referenceProfile }) => {

  const absoluteProfile = getProfile(read);

  const profile = AXES.reduce((acc, axis) => {

    const absolute = Number(absoluteProfile?.[axis] ?? 5);

    const reference = Number(referenceProfile?.[axis] ?? 5);

    acc[axis] = clamp(5 + (absolute - reference));

    return acc;

  }, {});

  return {

    ...read,

    profile,

    absoluteProfile,

    referenceAbsoluteProfile: referenceProfile,

  };

};

const maxMove = (read) => {

  return Math.max(

    ...AXES.map((axis) => Math.abs(Number(read?.profile?.[axis] ?? 5) - 5))

  );

};

const absoluteDifference = (a, b) => {

  const aProfile = getProfile(a);

  const bProfile = getProfile(b);

  return AXES.reduce((sum, axis) => {

    return sum + Math.abs(Number(aProfile?.[axis] ?? 5) - Number(bProfile?.[axis] ?? 5));

  }, 0);

};

const logCase = ({ name, input, read }) => {

  console.log('\n==================================================');

  console.log(name);

  console.log('==================================================');

  console.log('\n=== INPUT ===');

  console.log(input.label);

  const rows = AXES.map((axis) => {

    const chart = Number(read?.profile?.[axis] ?? 5);

    const absolute = Number(getProfile(read)?.[axis] ?? 5);

    const reference = Number(read?.referenceAbsoluteProfile?.[axis] ?? 5);

    return {

      axis,

      chart: fmt(chart),

      chartDelta: signed(chart - 5),

      absolute: fmt(absolute),

      reference: fmt(reference),

      absoluteDelta: signed(absolute - reference),

    };

  });

  console.table(rows);

  console.log('Tone Summary:', read?.toneSummary || read?.toneSummaryText || '—');

  console.log('Feel Read:', read?.feelRead || read?.feel || '—');

  console.log('Highlighted:', read?.highlighted || read?.highlightedRead || '—');

  console.log('Voice Range:', read?.projectedVoiceRangePosition || read?.voiceRange || '—');

};

const buildFeuzon = (input, referenceProfile = REFERENCE_PROFILES.FEUZON_STANDARD) => {

  const read = buildFeuzonVoiceRead(input);

  return buildRelativeRead({ read, referenceProfile });

};

const buildHeritage = (input, referenceProfile = REFERENCE_PROFILES.HERITAGE_STANDARD) => {

  const read = buildHeritageVoiceRead(input);

  return buildRelativeRead({ read, referenceProfile });

};

const FEUZON_STANDARD = {

  series: 'FEUZØN',

  size: '14',

  depth: '6.0',

  lugs: '8',

  staveOption: '16 - 13mm',

  outerShell: 'Maple',

  innerStave: 'Walnut + Birch',

  hoopType: 'Die-Cast',

  hardwareColor: 'Chrome',

  bearingEdge: 'Balanced Hybrid Edge',

  snareBed: 'Standard',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'scorched',

  stainStyle: 'full-stained',

  stainColor: 'smoked-maple',

  label:

    'FEUZØN • 14" x 6" • 8 lugs • 16 - 13mm • Maple / Walnut + Birch • Die-Cast • Chrome • Balanced Hybrid Edge • Standard • Natural Gloss • scorched',

};

const FEUZON_LOWEST = {

  ...FEUZON_STANDARD,

  size: '12',

  depth: '5.0',

  lugs: '6',

  staveOption: '12 - 10mm',

  hoopType: 'Triple Flange',

  finishSystem: 'Natural Satin',

  label:

    'FEUZØN • 12" x 5" • 6 lugs • 12 - 10mm • Maple / Walnut + Birch • Triple Flange • Chrome • Balanced Hybrid Edge • Standard • Natural Satin • scorched',

};

const FEUZON_WARM = {

  ...FEUZON_STANDARD,

  depth: '7.0',

  hoopType: 'Triple Flange',

  bearingEdge: 'Warm Hybrid Edge',

  label:

    'FEUZØN • 14" x 7" • 8 lugs • 16 - 13mm • Maple / Walnut + Birch • Triple Flange • Chrome • Warm Hybrid Edge • Standard • Natural Gloss • scorched',

};

const FEUZON_MODERN = {

  ...FEUZON_STANDARD,

  depth: '5.0',

  bearingEdge: 'Modern Precision Edge',

  label:

    'FEUZØN • 14" x 5" • 8 lugs • 16 - 13mm • Maple / Walnut + Birch • Die-Cast • Chrome • Modern Precision Edge • Standard • Natural Gloss • scorched',

};

const HERITAGE_STANDARD = {

  series: 'HERITAGE',

  size: '14',

  depth: '6.5',

  lugs: '8',

  staveOption: '16 - 13mm',

  woodSpecies: 'Oak',

  shellWood: 'Oak',

  hoopType: 'Die-Cast',

  hardwareColor: 'Chrome',

  bearingEdge: 'Classic Roundover',

  snareBed: 'Standard',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'non-scorched',

  torchLevel: 'Medium Torch',

  label:

    'HERITAGE • 14" x 6.5" • 8 lugs • 16 - 13mm • Oak • Die-Cast • Chrome • Classic Roundover • Standard • Natural Gloss • non-scorched',

};

const HERITAGE_WARM = {

  ...HERITAGE_STANDARD,

  depth: '7.0',

  bearingEdge: 'Warm Roundover',

  finishSystem: 'Natural Satin',

  label:

    'HERITAGE • 14" x 7" • 8 lugs • 16 - 13mm • Oak • Die-Cast • Chrome • Warm Roundover • Standard • Natural Satin • non-scorched',

};

const HERITAGE_BRIGHT = {

  ...HERITAGE_STANDARD,

  depth: '5.5',

  bearingEdge: 'Modern 45',

  label:

    'HERITAGE • 14" x 5.5" • 8 lugs • 16 - 13mm • Oak • Die-Cast • Chrome • Modern 45 • Standard • Natural Gloss • non-scorched',

};

const cases = [

  {

    name: 'FEUZØN STANDARD / CENTERED',

    series: 'FEUZON',

    input: FEUZON_STANDARD,

    read: buildFeuzon(FEUZON_STANDARD),

  },

  {

    name: 'FEUZØN LOWEST / MOVES FROM STANDARD',

    series: 'FEUZON',

    input: FEUZON_LOWEST,

    read: buildFeuzon(FEUZON_LOWEST),

  },

  {

    name: 'FEUZØN WARM / DEEP / TRIPLE FLANGE',

    series: 'FEUZON',

    input: FEUZON_WARM,

    read: buildFeuzon(FEUZON_WARM),

  },

  {

    name: 'FEUZØN MODERN / SHALLOW / DIE-CAST',

    series: 'FEUZON',

    input: FEUZON_MODERN,

    read: buildFeuzon(FEUZON_MODERN),

  },

  {

    name: 'HERITAGE STANDARD / CENTERED',

    series: 'HERITAGE',

    input: HERITAGE_STANDARD,

    read: buildHeritage(HERITAGE_STANDARD),

  },

  {

    name: 'HERITAGE WARM BUILD',

    series: 'HERITAGE',

    input: HERITAGE_WARM,

    read: buildHeritage(HERITAGE_WARM),

  },

  {

    name: 'HERITAGE BRIGHT BUILD',

    series: 'HERITAGE',

    input: HERITAGE_BRIGHT,

    read: buildHeritage(HERITAGE_BRIGHT),

  },

  ...[

    ['MAPLE PLY', REFERENCE_PROFILES.MAPLE_PLY],

    ['BIRCH PLY', REFERENCE_PROFILES.BIRCH_PLY],

    ['WALNUT PLY', REFERENCE_PROFILES.WALNUT_PLY],

    ['BRASS', REFERENCE_PROFILES.BRASS],

    ['STEEL', REFERENCE_PROFILES.STEEL],

    ['THIN ACRYLIC', REFERENCE_PROFILES.THIN_ACRYLIC],

  ].flatMap(([label, ref]) => [

    {

      name: `FEUZØN STANDARD VS ${label}`,

      series: 'FEUZON',

      input: FEUZON_STANDARD,

      read: buildFeuzon(FEUZON_STANDARD, ref),

    },

    {

      name: `HERITAGE STANDARD VS ${label}`,

      series: 'HERITAGE',

      input: HERITAGE_STANDARD,

      read: buildHeritage(HERITAGE_STANDARD, ref),

    },

  ]),

];

for (const item of cases) {

  logCase(item);

}

console.log('\n\n==================================================');

console.log('SUMMARY COMPARISON TABLE');

console.log('==================================================');

console.table(

  cases.map((item) => ({

    case: item.name,

    series: item.series,

    attack: signed(Number(item.read.profile.attack ?? 5) - 5).replace(/0$/, ''),

    sustain: signed(Number(item.read.profile.sustain ?? 5) - 5).replace(/0$/, ''),

    warmth: signed(Number(item.read.profile.warmth ?? 5) - 5).replace(/0$/, ''),

    projection: signed(Number(item.read.profile.projection ?? 5) - 5).replace(/0$/, ''),

    brightness: signed(Number(item.read.profile.brightness ?? 5) - 5).replace(/0$/, ''),

    sensitivity: signed(Number(item.read.profile.sensitivity ?? 5) - 5).replace(/0$/, ''),

    control: signed(Number(item.read.profile.control ?? 5) - 5).replace(/0$/, ''),

    maxMove: maxMove(item.read).toFixed(2),

    voiceRange: item.read.projectedVoiceRangePosition || item.read.voiceRange || '—',

  }))

);

const byName = Object.fromEntries(cases.map((item) => [item.name, item]));

const assertions = [

  {

    label: 'FEUZØN Standard should be centered',

    pass: maxMove(byName['FEUZØN STANDARD / CENTERED'].read) <= 0.05,

    detail: `maxMove ${maxMove(byName['FEUZØN STANDARD / CENTERED'].read).toFixed(2)}`,

  },

  {

    label: 'FEUZØN Lowest should move away from standard',

    pass: maxMove(byName['FEUZØN LOWEST / MOVES FROM STANDARD'].read) >= 0.8,

    detail: `maxMove ${maxMove(byName['FEUZØN LOWEST / MOVES FROM STANDARD'].read).toFixed(2)}`,

  },

  {

    label: 'FEUZØN warm/deep build should move meaningfully',

    pass: maxMove(byName['FEUZØN WARM / DEEP / TRIPLE FLANGE'].read) >= 0.8,

    detail: `maxMove ${maxMove(byName['FEUZØN WARM / DEEP / TRIPLE FLANGE'].read).toFixed(2)}`,

  },

  {

    label: 'FEUZØN modern/shallow build should move meaningfully',

    pass: maxMove(byName['FEUZØN MODERN / SHALLOW / DIE-CAST'].read) >= 0.8,

    detail: `maxMove ${maxMove(byName['FEUZØN MODERN / SHALLOW / DIE-CAST'].read).toFixed(2)}`,

  },

  {

    label: 'HERITAGE Standard should stay near center',

    pass: maxMove(byName['HERITAGE STANDARD / CENTERED'].read) <= 0.25,

    detail: `maxMove ${maxMove(byName['HERITAGE STANDARD / CENTERED'].read).toFixed(2)}`,

  },

  {

    label: 'HERITAGE Warm build should move from standard',

    pass: maxMove(byName['HERITAGE WARM BUILD'].read) >= 0.18,

    detail: `maxMove ${maxMove(byName['HERITAGE WARM BUILD'].read).toFixed(2)}`,

  },

  {

    label: 'HERITAGE Bright build should move from standard',

    pass: maxMove(byName['HERITAGE BRIGHT BUILD'].read) >= 0.35,

    detail: `maxMove ${maxMove(byName['HERITAGE BRIGHT BUILD'].read).toFixed(2)}`,

  },

  ...cases

    .filter((item) => item.name.includes(' VS '))

    .map((item) => ({

      label: `${item.name} should not flatten to all 5s`,

      pass: maxMove(item.read) >= 0.5,

      detail: `maxMove ${maxMove(item.read).toFixed(2)}`,

    })),

  {

    label: 'FEUZØN and HERITAGE standard absolute profiles should not be identical',

    pass:

      absoluteDifference(

        byName['FEUZØN STANDARD / CENTERED'].read,

        byName['HERITAGE STANDARD / CENTERED'].read

      ) >= 5,

    detail: `absoluteDifference ${absoluteDifference(

      byName['FEUZØN STANDARD / CENTERED'].read,

      byName['HERITAGE STANDARD / CENTERED'].read

    ).toFixed(2)}`,

  },

];

console.log('\n\n==================================================');

console.log('ASSERTIONS');

console.log('==================================================');

let hasFailure = false;

for (const assertion of assertions) {

  if (assertion.pass) {

    console.log(`✅ PASS — ${assertion.label} — ${assertion.detail}`);

  } else {

    hasFailure = true;

    console.log(`❌ FAIL — ${assertion.label} — ${assertion.detail}`);

  }

}

if (hasFailure) {

  process.exitCode = 1;

}

