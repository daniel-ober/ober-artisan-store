// feuzon-chart-calibration.mjs

import buildFeuzonVoiceRead from './src/data/legacyPrint/buildFeuzonVoiceRead.js';

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

const CHART_MAX = 10;

const basePrices = {

  12: 1050,

  13: 1150,

  14: 1250,

  15: 1350,

};

const depthPrices = {

  12: {

    '5.0': 0,

    '5.5': 50,

    '6.0': 100,

    '6.5': 150,

    '7.0': 200,

    '7.5': 250,

    '8.0': 300,

  },

  13: {

    '5.0': 0,

    '5.5': 50,

    '6.0': 100,

    '6.5': 150,

    '7.0': 200,

    '7.5': 250,

    '8.0': 300,

  },

  14: {

    '5.0': 0,

    '5.5': 50,

    '6.0': 100,

    '6.5': 150,

    '7.0': 200,

    '7.5': 250,

    '8.0': 300,

  },

  15: {

    '5.0': 0,

    '5.5': 50,

    '6.0': 100,

    '6.5': 150,

    '7.0': 200,

    '7.5': 250,

    '8.0': 300,

  },

};

const hardwareUpchargeMap = {

  Chrome: 0,

  'Black Nickel': 50,

  'Brass/Gold': 150,

};

const hoopUpchargeMap = {

  'Die-Cast': 0,

  'Triple Flange': -100,

};

const finishUpchargeMap = {

  'Natural Satin': 0,

  'Natural Gloss': 100,

  'Stained Satin': 100,

  'Stained Gloss': 200,

};

const finishTimelineWeeksMap = {

  'Natural Satin': 0,

  'Natural Gloss': 1,

  'Stained Satin': 1,

  'Stained Gloss': 2,

};

const FEUZON_STANDARD_INPUT = {

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

function clone(obj) {

  return JSON.parse(JSON.stringify(obj));

}

function normalizeDepthValue(value) {

  const num = Number(value);

  if (!Number.isFinite(num)) return String(value || '').trim();

  return num.toFixed(1);

}

function computeFeuzonPrice(input = {}) {

  const size = String(input.size || 14);

  const depth = normalizeDepthValue(input.depth || 6.0);

  const hardwareColor = input.hardwareColor || 'Chrome';

  const hoopType = input.hoopType || 'Die-Cast';

  const finishSystem = input.finishSystem || 'Natural Gloss';

  let price = basePrices[size] || 0;

  price += depthPrices[size]?.[depth] || 0;

  price += hardwareUpchargeMap[hardwareColor] || 0;

  price += hoopUpchargeMap[hoopType] || 0;

  price += finishUpchargeMap[finishSystem] || 0;

  return price;

}

function getEstimatedDeliveryLabel(input = {}) {

  const finishSystem = input.finishSystem || 'Natural Gloss';

  const addedWeeks = finishTimelineWeeksMap[finishSystem] || 0;

  const minWeeks = 7 + addedWeeks;

  const maxWeeks = 10 + addedWeeks;

  return `${minWeeks}–${maxWeeks} weeks`;

}

function formatCurrency(value) {

  return `$${Number(value || 0).toFixed(0)}`;

}

function formatSigned(value, digits = 2) {

  const n = Number(value);

  const fixed = n.toFixed(digits);

  return n >= 0 ? `+${fixed}` : fixed;

}

function getFillPercentFromCenter(value) {

  const distance = Math.abs(Number(value) - CHART_CENTER);

  const maxDistance = CHART_MAX - CHART_CENTER;

  return `${((distance / maxDistance) * 100).toFixed(1)}%`;

}

function getDeltaProfile(read) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = Number((Number(read.profile?.[axis] ?? 5) - 5).toFixed(2));

    return acc;

  }, {});

}

function getMaxAbsDelta(read) {

  const deltas = Object.values(getDeltaProfile(read));

  return Math.max(...deltas.map((value) => Math.abs(value)));

}

function getInputSummary(input) {

  return `${input.size}" x ${input.depth}" • ${input.lugs} lugs • ${input.staveOption} • ${input.outerShell} / ${input.innerStave} • ${input.hoopType} • ${input.hardwareColor} • ${input.bearingEdge} • ${input.snareBed} • ${input.finishSystem} • ${input.scorchStyle}`;

}

function printProfileBlock(label, read, input = null) {

  const price = computeFeuzonPrice(input);

  const delivery = getEstimatedDeliveryLabel(input);

  console.log('\n==================================================');

  console.log(label);

  console.log('==================================================');

  if (input) {

    console.log('\n=== INPUT ===');

    console.log(getInputSummary(input));

    console.log(`Price: ${formatCurrency(price)} • Estimated delivery: ${delivery}`);

  }

  const rows = AXES.map((axis) => {

    const chartValue = Number(read.profile?.[axis] ?? 5);

    const absoluteValue = Number(read.absoluteProfile?.[axis] ?? 0);

    const referenceValue = Number(read.referenceAbsoluteProfile?.[axis] ?? 0);

    const chartDelta = chartValue - CHART_CENTER;

    const absoluteDelta = absoluteValue - referenceValue;

    return {

      axis,

      chart: chartValue.toFixed(2),

      chartDelta: formatSigned(chartDelta),

      fill: getFillPercentFromCenter(chartValue),

      absolute: absoluteValue.toFixed(2),

      reference: referenceValue.toFixed(2),

      absoluteDelta: formatSigned(absoluteDelta),

    };

  });

  console.table(rows);

  console.log('Tone Summary:', read.toneSummary);

  console.log('Feel Read:', read.feelRead);

  console.log('Highlighted:', read.highlightedCharacteristics);

  console.log('Voice Range:', read.projectedVoiceRangePosition);

}

function printComparisonTable(cases) {

  console.log('\n\n==================================================');

  console.log('SUMMARY COMPARISON TABLE');

  console.log('==================================================');

  const rows = cases.map(({ label, input, read }) => {

    const deltas = getDeltaProfile(read);

    return {

      case: label,

      price: formatCurrency(computeFeuzonPrice(input)),

      delivery: getEstimatedDeliveryLabel(input),

      attack: formatSigned(deltas.attack, 1),

      sustain: formatSigned(deltas.sustain, 1),

      warmth: formatSigned(deltas.warmth, 1),

      projection: formatSigned(deltas.projection, 1),

      brightness: formatSigned(deltas.brightness, 1),

      sensitivity: formatSigned(deltas.sensitivity, 1),

      control: formatSigned(deltas.control, 1),

      maxMove: getMaxAbsDelta(read).toFixed(2),

      voiceRange: read.projectedVoiceRangePosition,

    };

  });

  console.table(rows);

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

  const standard = find('FEUZØN STANDARD / SHOULD BE CENTERED');

  const lowest = find('LOWEST PRICE PRESET');

  const blackNickel = find('HARDWARE FINISH ONLY — BLACK NICKEL / SHOULD BE CENTERED');

  const brassGold = find('HARDWARE FINISH ONLY — BRASS/GOLD / SHOULD BE CENTERED');

if (standard) {

  assertCase(

    'FEUZØN Standard price should be $1450',

    computeFeuzonPrice(standard.input) === 1450,

    formatCurrency(computeFeuzonPrice(standard.input))

  );

  assertCase(

    'FEUZØN Standard chart should be centered',

    getMaxAbsDelta(standard.read) === 0,

    `maxMove ${getMaxAbsDelta(standard.read).toFixed(2)}`

  );

}

if (lowest) {

  assertCase(

    'Lowest Price preset should be $950',

    computeFeuzonPrice(lowest.input) === 950,

    formatCurrency(computeFeuzonPrice(lowest.input))

  );

}

if (blackNickel) {

  assertCase(

    'Black Nickel should not move chart',

    getMaxAbsDelta(blackNickel.read) === 0,

    `maxMove ${getMaxAbsDelta(blackNickel.read).toFixed(2)}`

  );

  assertCase(

    'Black Nickel should add $50 over FEUZØN Standard',

    computeFeuzonPrice(blackNickel.input) === 1500,

    formatCurrency(computeFeuzonPrice(blackNickel.input))

  );

}

if (brassGold) {

  assertCase(

    'Brass/Gold should not move chart',

    getMaxAbsDelta(brassGold.read) === 0,

    `maxMove ${getMaxAbsDelta(brassGold.read).toFixed(2)}`

  );

  assertCase(

    'Brass/Gold should add $150 over FEUZØN Standard',

    computeFeuzonPrice(brassGold.input) === 1600,

    formatCurrency(computeFeuzonPrice(brassGold.input))

  );

}

}

function runCase(label, input) {

  const read = buildFeuzonVoiceRead(input);

  printProfileBlock(label, read, input);

  return {

    label,

    input,

    read,

  };

}

function runCases(caseList) {

  const results = caseList.map(({ label, input }) => runCase(label, input));

  printComparisonTable(results);

  runAssertions(results);

  return results;

}

function standardVariant(label, changes) {

  return {

    label,

    input: {

      ...clone(FEUZON_STANDARD_INPUT),

      ...changes,

    },

  };

}

function lowestVariant(label, changes) {

  return {

    label,

    input: {

      ...clone(FEUZON_LOWEST_INPUT),

      ...changes,

    },

  };

}

const TEST_GROUPS = {

  presets: [

    {

      label: 'FEUZØN STANDARD / SHOULD BE CENTERED',

      input: clone(FEUZON_STANDARD_INPUT),

    },

    {

      label: 'LOWEST PRICE PRESET',

      input: clone(FEUZON_LOWEST_INPUT),

    },

  ],

  pricing: [

    {

      label: 'PRICING — LOWEST PRICE / 12x5 / TRIPLE FLANGE / NATURAL SATIN',

      input: clone(FEUZON_LOWEST_INPUT),

    },

    standardVariant('PRICING — FEUZØN STANDARD / 14x6 / DIE-CAST / NATURAL GLOSS', {}),

    standardVariant('PRICING — STANDARD + BLACK NICKEL', {

      hardwareColor: 'Black Nickel',

    }),

    standardVariant('PRICING — STANDARD + BRASS/GOLD', {

      hardwareColor: 'Brass/Gold',

    }),

    standardVariant('PRICING — STANDARD + STAINED SATIN', {

      finishSystem: 'Stained Satin',

      stainStyle: 'full-stained',

      stainColor: 'Smoked Maple',

    }),

    standardVariant('PRICING — STANDARD + STAINED GLOSS', {

      finishSystem: 'Stained Gloss',

      stainStyle: 'full-stained',

      stainColor: 'Smoked Maple',

    }),

    standardVariant('PRICING — 15x8 / BRASS GOLD / STAINED GLOSS', {

      size: 15,

      depth: 8.0,

      lugs: 10,

      staveOption: '20 - 14mm',

      hardwareColor: 'Brass/Gold',

      hoopType: 'Die-Cast',

      finishSystem: 'Stained Gloss',

      stainStyle: 'full-stained',

      stainColor: 'Dark Walnut',

    }),

  ],

  diameter: [

    standardVariant('DIAMETER ONLY — 12"', {

      size: 12,

      depth: 6.0,

      lugs: 8,

      staveOption: '16 - 13mm',

    }),

    standardVariant('DIAMETER ONLY — 13"', {

      size: 13,

      depth: 6.0,

      lugs: 8,

      staveOption: '16 - 13mm',

    }),

    standardVariant('DIAMETER ONLY — 15"', {

      size: 15,

      depth: 6.0,

      lugs: 10,

      staveOption: '20 - 14mm',

    }),

  ],

  depth: [

    standardVariant('DEPTH ONLY — 5.0"', {

      depth: 5.0,

    }),

    standardVariant('DEPTH ONLY — 5.5"', {

      depth: 5.5,

    }),

    standardVariant('DEPTH ONLY — 6.5"', {

      depth: 6.5,

    }),

    standardVariant('DEPTH ONLY — 7.0"', {

      depth: 7.0,

    }),

    standardVariant('DEPTH ONLY — 8.0"', {

      depth: 8.0,

    }),

  ],

  lugs: [

    standardVariant('LUGS ONLY — 10 LUGS', {

      lugs: 10,

      staveOption: '20 - 14mm',

    }),

    standardVariant('LUGS / LIGHTER PATH — 6 LUGS', {

      size: 12,

      depth: 6.0,

      lugs: 6,

      staveOption: '12 - 10mm',

    }),

  ],

  staves: [

    standardVariant('STAVES ONLY — 12 STAVES / 10MM', {

      size: 12,

      depth: 6.0,

      lugs: 6,

      staveOption: '12 - 10mm',

    }),

    standardVariant('STAVES ONLY — 20 STAVES / 14MM', {

      size: 14,

      lugs: 10,

      staveOption: '20 - 14mm',

    }),

  ],

  hoops: [

    standardVariant('HOOPS ONLY — TRIPLE FLANGE', {

      hoopType: 'Triple Flange',

    }),

    lowestVariant('LOWEST PRICE WITH DIE-CAST HOOPS', {

      hoopType: 'Die-Cast',

    }),

  ],

  edges: [

    standardVariant('EDGE ONLY — WARM HYBRID EDGE', {

      bearingEdge: 'Warm Hybrid Edge',

    }),

    standardVariant('EDGE ONLY — MODERN PRECISION EDGE', {

      bearingEdge: 'Modern Precision Edge',

    }),

  ],

  snarebed: [

    standardVariant('SNARE BED ONLY — SHALLOW', {

      snareBed: 'Shallow',

    }),

    standardVariant('SNARE BED ONLY — DEEP', {

      snareBed: 'Deep',

    }),

  ],

  shells: [

    standardVariant('SHELL ONLY — MAPLE / OAK + CHERRY', {

      outerShell: 'Maple',

      innerStave: 'Oak + Cherry',

    }),

    standardVariant('SHELL ONLY — MAPLE / MAPLE + BUBINGA', {

      outerShell: 'Maple',

      innerStave: 'Maple + Bubinga',

    }),

    standardVariant('SHELL ONLY — WALNUT / MAHOGANY + CHERRY', {

      outerShell: 'Walnut',

      innerStave: 'Mahogany + Cherry',

    }),

    standardVariant('SHELL ONLY — WALNUT / OAK + WENGE', {

      outerShell: 'Walnut',

      innerStave: 'Oak + Wenge',

    }),

    standardVariant('SHELL ONLY — CHERRY / BIRCH + MAPLE', {

      outerShell: 'Cherry',

      innerStave: 'Birch + Maple',

    }),

    standardVariant('SHELL ONLY — CHERRY / PADAUK + ASH', {

      outerShell: 'Cherry',

      innerStave: 'Padauk + Ash',

    }),

  ],

  finish: [

    standardVariant('FINISH ONLY — NON-SCORCHED NATURAL GLOSS', {

      scorchStyle: 'non-scorched',

      finishSystem: 'Natural Gloss',

    }),

    standardVariant('FINISH ONLY — NATURAL SATIN', {

      scorchStyle: 'scorched',

      finishSystem: 'Natural Satin',

    }),

    standardVariant('FINISH ONLY — STAINED GLOSS', {

      finishSystem: 'Stained Gloss',

      stainStyle: 'full-stained',

      stainColor: 'Smoked Maple',

    }),

    standardVariant('FINISH ONLY — STAINED SATIN', {

      finishSystem: 'Stained Satin',

      stainStyle: 'full-stained',

      stainColor: 'Smoked Maple',

    }),

  ],

  hardware: [

    standardVariant('HARDWARE FINISH ONLY — BLACK NICKEL / SHOULD BE CENTERED', {

      hardwareColor: 'Black Nickel',

    }),

    standardVariant('HARDWARE FINISH ONLY — BRASS/GOLD / SHOULD BE CENTERED', {

      hardwareColor: 'Brass/Gold',

    }),

  ],

  compound: [

    standardVariant('COMPOUND — 12x5 LOWEST PRICE', {

      size: 12,

      depth: 5.0,

      lugs: 6,

      staveOption: '12 - 10mm',

      hoopType: 'Triple Flange',

      finishSystem: 'Natural Satin',

    }),

    standardVariant('COMPOUND — 12x5 MODERN / DIE-CAST', {

      size: 12,

      depth: 5.0,

      lugs: 6,

      staveOption: '12 - 10mm',

      hoopType: 'Die-Cast',

      bearingEdge: 'Modern Precision Edge',

      finishSystem: 'Natural Satin',

    }),

    standardVariant('COMPOUND — 14x7 WARM / TRIPLE FLANGE', {

      depth: 7.0,

      hoopType: 'Triple Flange',

      bearingEdge: 'Warm Hybrid Edge',

    }),

    standardVariant('COMPOUND — 14x7 MODERN / DIE-CAST / 10 LUG', {

      depth: 7.0,

      lugs: 10,

      staveOption: '20 - 14mm',

      hoopType: 'Die-Cast',

      bearingEdge: 'Modern Precision Edge',

    }),

    standardVariant('COMPOUND — 15x8 BIG BODY', {

      size: 15,

      depth: 8.0,

      lugs: 10,

      staveOption: '20 - 14mm',

      hoopType: 'Triple Flange',

      bearingEdge: 'Warm Hybrid Edge',

      outerShell: 'Walnut',

      innerStave: 'Mahogany + Cherry',

    }),

    standardVariant('COMPOUND — 15x8 MODERN CUT', {

      size: 15,

      depth: 8.0,

      lugs: 10,

      staveOption: '20 - 14mm',

      hoopType: 'Die-Cast',

      bearingEdge: 'Modern Precision Edge',

      outerShell: 'Maple',

      innerStave: 'Maple + Bubinga',

    }),

  ],

};

const ALL_CASES = Object.values(TEST_GROUPS).flat();

if (mode === 'all') {

  runCases(ALL_CASES);

} else if (TEST_GROUPS[mode]) {

  runCases(TEST_GROUPS[mode]);

} else {

  console.log(`\nUnknown mode: ${mode}`);

  console.log('\nUse one of:');

  console.log(['all', ...Object.keys(TEST_GROUPS)].join(', '));

}