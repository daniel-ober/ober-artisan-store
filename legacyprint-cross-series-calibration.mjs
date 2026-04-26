
// legacyprint-cross-series-calibration.mjs

// Cross-series calibration runner for Ober LegacyPrint™ Voice Comparison.

// Run from project root:

//   node legacyprint-cross-series-calibration.mjs all

//   node legacyprint-cross-series-calibration.mjs feuzon

//   node legacyprint-cross-series-calibration.mjs heritage

//   node legacyprint-cross-series-calibration.mjs references

//   node legacyprint-cross-series-calibration.mjs cross

import buildFeuzonVoiceRead from './src/data/legacyPrint/buildFeuzonVoiceRead.js';

import buildHeritageVoiceRead from './src/utils/legacyPrint/buildHeritageVoiceRead.js';

const mode = (process.argv[2] || 'all').toLowerCase();

const AXES = [

  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',

];

const CHART_CENTER = 5;

const FEUZON_STANDARD_INPUT = {

  series: 'FEUZØN',

  size: 14,

  depth: 6.0,

  lugs: 8,

  staveOption: '16 - 13mm',

  outerShell: 'Maple',

  innerStave: 'Walnut + Birch',

  hardwareColor: 'Chrome',

  hoopType: 'Die-Cast',

  snareBed: 'Standard',

  bearingEdge: 'Balanced Hybrid Edge',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'scorched',

  stainStyle: 'natural',

  stainColor: 'none',

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'feuzon-hybrid-reference',

  benchmarkSizeId: '14x6_0',

};

const FEUZON_LOWEST_INPUT = {

  ...FEUZON_STANDARD_INPUT,

  size: 12,

  depth: 5.0,

  lugs: 6,

  staveOption: '12 - 10mm',

  hoopType: 'Triple Flange',

  finishSystem: 'Natural Satin',

};

const HERITAGE_STANDARD_INPUT = {

  series: 'HERITAGE',

  size: 14,

  depth: 6.5,

  lugs: 8,

  woodSpecies: 'Oak',

  shellConstruction: 'Stave',

  staveOption: '16 - 13mm',

  hardwareColor: 'Chrome',

  hoopType: 'Die-Cast',

  snareBed: 'Standard',

  bearingEdge: 'Classic Roundover',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'non-scorched',

  stainStyle: 'natural',

  stainColor: 'none',

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x6_5',

};

const HERITAGE_WARM_INPUT = {

  ...HERITAGE_STANDARD_INPUT,

  depth: 7.0,

  bearingEdge: 'Warm Roundover',

  finishSystem: 'Natural Satin',

};

const HERITAGE_BRIGHT_INPUT = {

  ...HERITAGE_STANDARD_INPUT,

  depth: 5.5,

  bearingEdge: 'Modern 45',

  hoopType: 'Die-Cast',

};

const BENCHMARK_AXIS_PROFILE_FALLBACKS = {

  'heritage-oak-reference': {

    attack: 6.75,

    sustain: 6.05,

    warmth: 6.85,

    projection: 6.75,

    brightness: 5.7,

    sensitivity: 6.2,

    control: 6.35,

  },

  'feuzon-hybrid-reference': {

    attack: 7.1,

    sustain: 6.32,

    warmth: 6.34,

    projection: 6.92,

    brightness: 6.19,

    sensitivity: 6.42,

    control: 6.48,

  },

  'maple-ply-reference': {

    attack: 7.05,

    sustain: 5.75,

    warmth: 5.75,

    projection: 6.65,

    brightness: 6.95,

    sensitivity: 6.25,

    control: 6.25,

  },

  'birch-ply-reference': {

    attack: 7.35,

    sustain: 5.55,

    warmth: 5.35,

    projection: 7.25,

    brightness: 7.3,

    sensitivity: 6.1,

    control: 6.45,

  },

  'walnut-ply-reference': {

    attack: 6.35,

    sustain: 6.15,

    warmth: 7.15,

    projection: 6.15,

    brightness: 5.45,

    sensitivity: 6.25,

    control: 6.25,

  },

  'brass-reference': {

    attack: 7.45,

    sustain: 6.65,

    warmth: 6.05,

    projection: 7.55,

    brightness: 7.25,

    sensitivity: 6.5,

    control: 6.35,

  },

  'steel-reference': {

    attack: 7.85,

    sustain: 6.25,

    warmth: 5.25,

    projection: 7.75,

    brightness: 8.15,

    sensitivity: 6.45,

    control: 6.5,

  },

  'thin-acrylic-reference': {

    attack: 7.75,

    sustain: 6.05,

    warmth: 5.15,

    projection: 7.45,

    brightness: 8.25,

    sensitivity: 6.65,

    control: 6.2,

  },

};

const OUTSIDE_REFERENCES = [

  {

    label: 'Maple Ply',

    selectedBenchmarkType: {

      typeId: 'maple-ply-reference',

      typeLabel: 'Maple Ply Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

  {

    label: 'Birch Ply',

    selectedBenchmarkType: {

      typeId: 'birch-ply-reference',

      typeLabel: 'Birch Ply Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

  {

    label: 'Walnut Ply',

    selectedBenchmarkType: {

      typeId: 'walnut-ply-reference',

      typeLabel: 'Walnut Ply Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

  {

    label: 'Brass',

    selectedBenchmarkType: {

      typeId: 'brass-reference',

      typeLabel: 'Brass Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

  {

    label: 'Steel',

    selectedBenchmarkType: {

      typeId: 'steel-reference',

      typeLabel: 'Steel Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

  {

    label: 'Thin Acrylic',

    selectedBenchmarkType: {

      typeId: 'thin-acrylic-reference',

      typeLabel: 'Thin Acrylic Reference',

    },

    selectedBenchmarkSize: {

      sizeId: '14x6_5',

      label: '14" x 6.5"',

    },

  },

];

function clone(obj) {

  return JSON.parse(JSON.stringify(obj));

}

function formatSigned(value, digits = 2) {

  const n = Number(value || 0);

  const fixed = n.toFixed(digits);

  return n >= 0 ? `+${fixed}` : fixed;

}

function getAxisProfileFallback(typeId) {

  return BENCHMARK_AXIS_PROFILE_FALLBACKS[typeId] || null;

}

function getReadAbsoluteProfile(read = {}) {

  return (

    read.absoluteProfile ||

    read.currentAbsoluteProfile ||

    read.referenceRelativeSourceProfile ||

    read.profile ||

    {}

  );

}

function getReadReferenceProfile(read = {}) {

  return read.referenceAbsoluteProfile || {};

}

function getDeltaProfile(read = {}) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = Number((Number(read.profile?.[axis] ?? 5) - 5).toFixed(2));

    return acc;

  }, {});

}

function getMaxAbsDelta(read = {}) {

  const deltas = Object.values(getDeltaProfile(read));

  return Math.max(...deltas.map((value) => Math.abs(value)));

}

function getAbsoluteDifference(a = {}, b = {}) {

  return AXES.reduce((sum, axis) => {

    return sum + Math.abs(Number(a[axis] ?? 0) - Number(b[axis] ?? 0));

  }, 0);

}

function applyOutsideReference(read, selectedBenchmarkType, selectedBenchmarkSize) {

  const referenceProfile = getAxisProfileFallback(selectedBenchmarkType?.typeId);

  if (!referenceProfile) return read;

  const absoluteProfile = getReadAbsoluteProfile(read);

  const relativeProfile = AXES.reduce((acc, axis) => {

    const currentValue = Number(absoluteProfile[axis] ?? 5);

    const referenceValue = Number(referenceProfile[axis] ?? 5);

    acc[axis] = Math.max(

      1,

      Math.min(10, Number((5 + (currentValue - referenceValue)).toFixed(2)))

    );

    return acc;

  }, {});

  return {

    ...read,

    profile: relativeProfile,

    referenceAbsoluteProfile: referenceProfile,

    selectedBenchmarkProfile: referenceProfile,

    selectedBenchmarkType,

    selectedBenchmarkSize,

  };

}

function buildRead(series, input) {

  if (series === 'feuzon') {

    return buildFeuzonVoiceRead(input);

  }

  if (series === 'heritage') {

    return buildHeritageVoiceRead(input);

  }

  throw new Error(`Unknown series: ${series}`);

}

function getInputSummary(input) {

  const size = input.size ? `${input.size}"` : '—';

  const depth = input.depth ? `${input.depth}"` : '—';

  const lugs = input.lugs ? `${input.lugs} lugs` : '—';

  const shell =

    input.outerShell && input.innerStave

      ? `${input.outerShell} / ${input.innerStave}`

      : input.woodSpecies || input.shellConstruction || '—';

  return [

    `${size} x ${depth}`,

    lugs,

    input.staveOption,

    shell,

    input.hoopType,

    input.hardwareColor,

    input.bearingEdge,

    input.snareBed,

    input.finishSystem,

    input.scorchStyle,

  ]

    .filter(Boolean)

    .join(' • ');

}

function printReadBlock(label, series, input, read) {

  console.log('\n==================================================');

  console.log(label);

  console.log('==================================================');

  console.log('\n=== INPUT ===');

  console.log(`${series.toUpperCase()} • ${getInputSummary(input)}`);

  const absoluteProfile = getReadAbsoluteProfile(read);

  const referenceProfile = getReadReferenceProfile(read);

  const rows = AXES.map((axis) => {

    const chartValue = Number(read.profile?.[axis] ?? 5);

    const absoluteValue = Number(absoluteProfile?.[axis] ?? 0);

    const referenceValue = Number(referenceProfile?.[axis] ?? 0);

    return {

      axis,

      chart: chartValue.toFixed(2),

      chartDelta: formatSigned(chartValue - CHART_CENTER),

      absolute: absoluteValue.toFixed(2),

      reference: referenceValue.toFixed(2),

      absoluteDelta: formatSigned(absoluteValue - referenceValue),

    };

  });

  console.table(rows);

  console.log('Tone Summary:', read.toneSummary || '—');

  console.log('Feel Read:', read.feelRead || '—');

  console.log('Highlighted:', read.highlightedCharacteristics || '—');

  console.log('Voice Range:', read.projectedVoiceRangePosition ?? '—');

}

function printSummaryTable(results) {

  console.log('\n\n==================================================');

  console.log('SUMMARY COMPARISON TABLE');

  console.log('==================================================');

  const rows = results.map(({ label, series, read }) => {

    const deltas = getDeltaProfile(read);

    return {

      case: label,

      series: series.toUpperCase(),

      attack: formatSigned(deltas.attack, 1),

      sustain: formatSigned(deltas.sustain, 1),

      warmth: formatSigned(deltas.warmth, 1),

      projection: formatSigned(deltas.projection, 1),

      brightness: formatSigned(deltas.brightness, 1),

      sensitivity: formatSigned(deltas.sensitivity, 1),

      control: formatSigned(deltas.control, 1),

      maxMove: getMaxAbsDelta(read).toFixed(2),

      voiceRange: read.projectedVoiceRangePosition ?? '—',

    };

  });

  console.table(rows);

}

function runCase({ label, series, input, reference = null }) {

  let read = buildRead(series, input);

  if (reference) {

    read = applyOutsideReference(

      read,

      reference.selectedBenchmarkType,

      reference.selectedBenchmarkSize

    );

  }

  printReadBlock(label, series, input, read);

  return {

    label,

    series,

    input,

    read,

    reference,

  };

}

function assertCase(label, condition, details = '') {

  const status = condition ? '✅ PASS' : '❌ FAIL';

  console.log(`${status} — ${label}${details ? ` — ${details}` : ''}`);

  return condition;

}

function runAssertions(results) {

  console.log('\n\n==================================================');

  console.log('ASSERTIONS');

  console.log('==================================================');

  const find = (label) => results.find((item) => item.label === label);

  const feuzonStandard = find('FEUZØN STANDARD / CENTERED');

  const feuzonLowest = find('FEUZØN LOWEST / MOVES FROM STANDARD');

  const heritageStandard = find('HERITAGE STANDARD / CENTERED');

  const heritageWarm = find('HERITAGE WARM BUILD');

  const heritageBright = find('HERITAGE BRIGHT BUILD');

  if (feuzonStandard) {

    assertCase(

      'FEUZØN Standard should be centered',

      getMaxAbsDelta(feuzonStandard.read) === 0,

      `maxMove ${getMaxAbsDelta(feuzonStandard.read).toFixed(2)}`

    );

  }

  if (feuzonLowest) {

    assertCase(

      'FEUZØN Lowest should move away from standard',

      getMaxAbsDelta(feuzonLowest.read) > 0.5,

      `maxMove ${getMaxAbsDelta(feuzonLowest.read).toFixed(2)}`

    );

  }

  if (heritageStandard) {

    assertCase(

      'HERITAGE Standard should be centered',

      getMaxAbsDelta(heritageStandard.read) === 0,

      `maxMove ${getMaxAbsDelta(heritageStandard.read).toFixed(2)}`

    );

  }

  if (heritageWarm) {

    assertCase(

      'HERITAGE Warm build should move from standard',

      getMaxAbsDelta(heritageWarm.read) > 0.25,

      `maxMove ${getMaxAbsDelta(heritageWarm.read).toFixed(2)}`

    );

  }

  if (heritageBright) {

    assertCase(

      'HERITAGE Bright build should move from standard',

      getMaxAbsDelta(heritageBright.read) > 0.25,

      `maxMove ${getMaxAbsDelta(heritageBright.read).toFixed(2)}`

    );

  }

  const outsideReferenceCases = results.filter((item) =>

    item.label.includes('VS ')

  );

  outsideReferenceCases.forEach((item) => {

    assertCase(

      `${item.label} should not flatten to all 5s`,

      getMaxAbsDelta(item.read) > 0.2,

      `maxMove ${getMaxAbsDelta(item.read).toFixed(2)}`

    );

  });

  if (feuzonStandard && heritageStandard) {

    const feuzonAbsolute = getReadAbsoluteProfile(feuzonStandard.read);

    const heritageAbsolute = getReadAbsoluteProfile(heritageStandard.read);

    const difference = getAbsoluteDifference(feuzonAbsolute, heritageAbsolute);

    assertCase(

      'FEUZØN and HERITAGE standard absolute profiles should not be identical',

      difference > 0.2,

      `absoluteDifference ${difference.toFixed(2)}`

    );

  }

}

const TEST_GROUPS = {

  feuzon: [

    {

      label: 'FEUZØN STANDARD / CENTERED',

      series: 'feuzon',

      input: clone(FEUZON_STANDARD_INPUT),

    },

    {

      label: 'FEUZØN LOWEST / MOVES FROM STANDARD',

      series: 'feuzon',

      input: clone(FEUZON_LOWEST_INPUT),

    },

    {

      label: 'FEUZØN WARM / DEEP / TRIPLE FLANGE',

      series: 'feuzon',

      input: {

        ...clone(FEUZON_STANDARD_INPUT),

        depth: 7.0,

        hoopType: 'Triple Flange',

        bearingEdge: 'Warm Hybrid Edge',

      },

    },

    {

      label: 'FEUZØN MODERN / SHALLOW / DIE-CAST',

      series: 'feuzon',

      input: {

        ...clone(FEUZON_STANDARD_INPUT),

        depth: 5.0,

        bearingEdge: 'Modern Precision Edge',

      },

    },

  ],

  heritage: [

    {

      label: 'HERITAGE STANDARD / CENTERED',

      series: 'heritage',

      input: clone(HERITAGE_STANDARD_INPUT),

    },

    {

      label: 'HERITAGE WARM BUILD',

      series: 'heritage',

      input: clone(HERITAGE_WARM_INPUT),

    },

    {

      label: 'HERITAGE BRIGHT BUILD',

      series: 'heritage',

      input: clone(HERITAGE_BRIGHT_INPUT),

    },

  ],

  references: [

    ...OUTSIDE_REFERENCES.map((reference) => ({

      label: `FEUZØN STANDARD VS ${reference.label.toUpperCase()}`,

      series: 'feuzon',

      input: clone(FEUZON_STANDARD_INPUT),

      reference,

    })),

    ...OUTSIDE_REFERENCES.map((reference) => ({

      label: `HERITAGE STANDARD VS ${reference.label.toUpperCase()}`,

      series: 'heritage',

      input: clone(HERITAGE_STANDARD_INPUT),

      reference,

    })),

  ],

  cross: [

    {

      label: 'CROSS — FEUZØN STANDARD',

      series: 'feuzon',

      input: clone(FEUZON_STANDARD_INPUT),

    },

    {

      label: 'CROSS — HERITAGE STANDARD',

      series: 'heritage',

      input: clone(HERITAGE_STANDARD_INPUT),

    },

    {

      label: 'CROSS — FEUZØN LOWEST',

      series: 'feuzon',

      input: clone(FEUZON_LOWEST_INPUT),

    },

    {

      label: 'CROSS — HERITAGE WARM',

      series: 'heritage',

      input: clone(HERITAGE_WARM_INPUT),

    },

    {

      label: 'CROSS — FEUZØN MODERN',

      series: 'feuzon',

      input: {

        ...clone(FEUZON_STANDARD_INPUT),

        depth: 5.0,

        bearingEdge: 'Modern Precision Edge',

      },

    },

    {

      label: 'CROSS — HERITAGE BRIGHT',

      series: 'heritage',

      input: clone(HERITAGE_BRIGHT_INPUT),

    },

  ],

};

function runCases(caseList) {

  const results = caseList.map(runCase);

  printSummaryTable(results);

  runAssertions(results);

  return results;

}

if (mode === 'all') {

  runCases(Object.values(TEST_GROUPS).flat());

} else if (TEST_GROUPS[mode]) {

  runCases(TEST_GROUPS[mode]);

} else {

  console.log(`\nUnknown mode: ${mode}`);

  console.log('\nUse one of:');

  console.log(['all', ...Object.keys(TEST_GROUPS)].join(', '));

}

