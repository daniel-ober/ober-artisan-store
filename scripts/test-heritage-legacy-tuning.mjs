// scripts/test-heritage-legacy-tuning.mjs

import fs from 'fs';

import path from 'path';

import { fileURLToPath } from 'url';

import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'tmp', 'heritage-legacy-tuning-tests');

const OUT_JSON = path.join(OUT_DIR, 'heritage-legacy-tuning-report.json');

const OUT_CSV = path.join(OUT_DIR, 'heritage-legacy-tuning-cases.csv');

const OUT_SUMMARY = path.join(OUT_DIR, 'heritage-legacy-tuning-summary.txt');

const LEGACY_TUNING_MODE = {

  BARE_SHELL: 'bare-shell',

  DRESSED: 'dressed',

};

const AXIS_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const staveOptions = {

  12: ['16 - 13mm', '12 - 8mm + $150 (Re-Rings Required)'],

  13: ['16 - 12mm'],

  14: ['20 - 15mm', '16 - 11mm', '10 - 7mm + $150 (Re-Rings Required)'],

};

const depthOptions = {

  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

};

const shellRecipeLugRules = {

  '12|16 - 13mm': ['8'],

  '12|12 - 8mm + $150 (Re-Rings Required)': ['6'],

  '13|16 - 12mm': ['8'],

  '14|20 - 15mm': ['10'],

  '14|16 - 11mm': ['8'],

  '14|10 - 7mm + $150 (Re-Rings Required)': ['10'],

};

const hoopOptions = ['Triple Flange', 'Die-Cast'];

const hardwareOptions = ['Chrome'];

const scorchOptions = ['Light Torch', 'Medium Torch', 'Blackened'];

const DEFAULT_BENCHMARK_FAMILY_ID = 'ober-custom';

const DEFAULT_BENCHMARK_TYPE_ID = 'heritage-oak-reference';

const DEFAULT_BENCHMARK_SIZE_ID = '14x5_5';

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

const parseStaveOptionMeta = (option = '') => {

  const staveMatch = String(option).match(/^(\d+)/);

  const thicknessMatch = String(option).match(/(\d+(?:\.\d+)?)mm/i);

  return {

    staveCount: staveMatch ? Number(staveMatch[1]) : null,

    thicknessMm: thicknessMatch ? Number(thicknessMatch[1]) : null,

    hasReRings: hasReRingFromStaveOption(option),

  };

};

const clampLegacyTuningHz = (value) => {

  const hz = Number(value);

  if (!Number.isFinite(hz)) return 180;

  return Math.max(70, Math.min(420, hz));

};

const getHeritageBareShellCenterHz = ({

  size,

  depth,

  staveOption,

  scorchDepth,

}) => {

  const diameter = Number(size) || 14;

  const shellDepth = Number(depth) || 5.5;

  const { staveCount, thicknessMm, hasReRings } =

    parseStaveOptionMeta(staveOption);

  let hz = 185;

  // Diameter: larger shells sit lower, smaller shells sit higher.

  hz += (14 - diameter) * 18;

  // Depth: deeper shells sit lower, shallower shells sit higher.

  hz += (6 - shellDepth) * 18;

  // Thickness is the strongest stiffness driver.

  // 11mm is now the Heritage reference center.

  hz += ((thicknessMm || 11) - 11) * 13;

  // Higher stave count generally reads stiffer/faster in this Heritage recipe.

  hz += ((staveCount || 16) - 16) * 4;

  // Thin shells with re-rings still read lower, but re-rings add support.

if (hasReRings) {

  hz -= 6;

}

  // Finish calibration: torch depth changes shell behavior, but keep this subtle.

  if (scorchDepth === 'Light Torch') {

    hz += 8;

  }

  if (scorchDepth === 'Medium Torch') {

    hz += 0;

  }

  if (scorchDepth === 'Blackened') {

    hz -= 10;

  }

const isThinReRingPath = hasReRings && Number(thicknessMm || 11) <= 8;

const isDeepThinFourteen = diameter >= 14 && shellDepth >= 6.5 && isThinReRingPath;

if (isDeepThinFourteen) {

  hz += 18;

}

if (isDeepThinFourteen && shellDepth >= 7.5) {

  hz += 6;

}

if (isDeepThinFourteen && scorchDepth === 'Blackened') {

  hz += 6;

}

return clampLegacyTuningHz(Math.round(hz));

};

const getHeritageDressedCenterHz = ({

  size,

  depth,

  staveOption,

  scorchDepth,

  hoopType,

}) => {

  const bareCenter = getHeritageBareShellCenterHz({

    size,

    depth,

    staveOption,

    scorchDepth,

  });

  let dressedCenter = bareCenter * 1.15;

  if (hoopType === 'Die-Cast') {

    dressedCenter += 12;

  }

  if (hoopType === 'Triple Flange') {

    dressedCenter -= 4;

  }

  return clampLegacyTuningHz(Math.round(dressedCenter));

};

const getLegacyTuningHzRangeFromCenter = (

  centerHz,

  mode = LEGACY_TUNING_MODE.BARE_SHELL

) => {

  const center = clampLegacyTuningHz(centerHz);

  const spread = mode === LEGACY_TUNING_MODE.BARE_SHELL ? 18 : 28;

  const startHz = clampLegacyTuningHz(Math.round(center - spread));

  const endHz = clampLegacyTuningHz(Math.round(center + spread));

  return {

    startHz,

    endHz,

    centerHz: center,

    label: `${startHz}–${endHz} Hz`,

  };

};

const getLegacyTuningScalePositionFromHz = (hz) => {

  const value = clampLegacyTuningHz(hz);

  const minHz = 55;

  const maxHz = 430;

  const position = 1 + ((value - minHz) / (maxHz - minHz)) * 4;

  return Math.max(1, Math.min(5, position));

};

const getLegacyTuningRangeBoundsFromHz = ({ startHz, endHz, centerHz }) => {

  return {

    start: getLegacyTuningScalePositionFromHz(startHz),

    end: getLegacyTuningScalePositionFromHz(endHz),

    center: getLegacyTuningScalePositionFromHz(centerHz),

  };

};

const frequencyToNearestNote = (frequency) => {

  const NOTE_NAMES = [

    'C',

    'C#',

    'D',

    'D#',

    'E',

    'F',

    'F#',

    'G',

    'G#',

    'A',

    'A#',

    'B',

  ];

  const hz = Number(frequency);

  if (!Number.isFinite(hz) || hz <= 0) return null;

  const midi = Math.round(69 + 12 * Math.log2(hz / 440));

  const noteIndex = ((midi % 12) + 12) % 12;

  const octave = Math.floor(midi / 12) - 1;

  return `${NOTE_NAMES[noteIndex]}${octave}`;

};

const formatProfile = (profile = {}) => {

  return AXIS_KEYS.reduce((acc, key) => {

    acc[key] = Number(profile[key] ?? 5);

    return acc;

  }, {});

};

const getVoiceMovement = (profile = {}) => {

  const values = AXIS_KEYS.map((key) => Number(profile[key] ?? 5));

  const deltas = values.map((value) => Math.abs(value - 5));

  const movement = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;

  const spread = Math.max(...values) - Math.min(...values);

  return {

    movement: Number(movement.toFixed(3)),

    spread: Number(spread.toFixed(3)),

  };

};

const getTopNodes = (profile = {}, count = 3) => {

  return AXIS_KEYS.map((key) => {

    const value = Number(profile[key] ?? 5);

    return {

      key,

      value,

      delta: Number((value - 5).toFixed(3)),

      absDelta: Math.abs(value - 5),

    };

  })

    .sort((a, b) => {

      if (b.absDelta !== a.absDelta) return b.absDelta - a.absDelta;

      return b.value - a.value;

    })

    .slice(0, count)

    .map((item) => `${item.key}:${item.delta > 0 ? '+' : ''}${item.delta}`);

};

const getShellRecipeKey = (size, staveOption) => {

  return `${String(size)}|${String(staveOption)}`;

};

const getLugsForRecipe = (size, staveOption) => {

  return shellRecipeLugRules[getShellRecipeKey(size, staveOption)] || [];

};

const buildCases = () => {

  const cases = [];

  Object.keys(staveOptions).forEach((size) => {

    depthOptions[size].forEach((depth) => {

      staveOptions[size].forEach((staveOption) => {

        const lugsForRecipe = getLugsForRecipe(size, staveOption);

        lugsForRecipe.forEach((lugs) => {

          hoopOptions.forEach((hoopType) => {

            hardwareOptions.forEach((hardwareColor) => {

              scorchOptions.forEach((scorchDepth) => {

                cases.push({

                  size,

                  depth,

                  lugs,

                  staveOption,

                  hoopType,

                  hardwareColor,

                  scorchDepth,

                });

              });

            });

          });

        });

      });

    });

  });

  return cases;

};

const toCsvValue = (value) => {

  const stringValue = String(value ?? '');

  if (

    stringValue.includes(',') ||

    stringValue.includes('"') ||

    stringValue.includes('\n')

  ) {

    return `"${stringValue.replace(/"/g, '""')}"`;

  }

  return stringValue;

};

const makeCsv = (rows) => {

  const headers = [

    'size',

    'depth',

    'lugs',

    'staveOption',

    'hoopType',

    'hardwareColor',

    'scorchDepth',

    'bareRange',

    'bareCenter',

    'bareStart',

    'bareEnd',

    'bareScaleStart',

    'bareScaleEnd',

    'bareScaleCenter',

    'dressedRange',

    'dressedCenter',

    'dressedStart',

    'dressedEnd',

    'dressedScaleStart',

    'dressedScaleEnd',

    'dressedScaleCenter',

    'hoopDressedCenterDelta',

    'nearestNotesBare',

    'nearestNotesDressed',

    'movement',

    'spread',

    'topNodes',

    'sourceBuildRead',

    'warnings',

  ];

  const lines = [headers.join(',')];

  rows.forEach((row) => {

    lines.push(headers.map((header) => toCsvValue(row[header])).join(','));

  });

  return `${lines.join('\n')}\n`;

};

const summarize = (rows) => {

  const bareCenters = rows.map((row) => row.bareCenter);

  const dressedCenters = rows.map((row) => row.dressedCenter);

  const movements = rows.map((row) => row.movement);

  const spreads = rows.map((row) => row.spread);

  const min = (values) => Math.min(...values);

  const max = (values) => Math.max(...values);

  const avg = (values) =>

    Number(

      (

        values.reduce((sum, value) => sum + Number(value || 0), 0) /

        values.length

      ).toFixed(3)

    );

  const warningCounts = rows.reduce((acc, row) => {

    String(row.warnings || '')

      .split('|')

      .filter(Boolean)

      .forEach((warning) => {

        acc[warning] = (acc[warning] || 0) + 1;

      });

    return acc;

  }, {});

  const bySize = Object.keys(staveOptions).map((size) => {

    const scoped = rows.filter((row) => row.size === size);

    return {

      size,

      count: scoped.length,

      bareCenterMin: min(scoped.map((row) => row.bareCenter)),

      bareCenterMax: max(scoped.map((row) => row.bareCenter)),

      dressedCenterMin: min(scoped.map((row) => row.dressedCenter)),

      dressedCenterMax: max(scoped.map((row) => row.dressedCenter)),

      movementAvg: avg(scoped.map((row) => row.movement)),

      spreadAvg: avg(scoped.map((row) => row.spread)),

    };

  });

  const extremeLow = [...rows]

    .sort((a, b) => a.bareCenter - b.bareCenter)

    .slice(0, 12);

  const extremeHigh = [...rows]

    .sort((a, b) => b.bareCenter - a.bareCenter)

    .slice(0, 12);

  const weakestVoiceMovement = [...rows]

    .sort((a, b) => a.movement - b.movement)

    .slice(0, 12);

  const strongestVoiceMovement = [...rows]

    .sort((a, b) => b.movement - a.movement)

    .slice(0, 12);

  return {

    totalCases: rows.length,

    bareCenter: {

      min: min(bareCenters),

      max: max(bareCenters),

      avg: avg(bareCenters),

    },

    dressedCenter: {

      min: min(dressedCenters),

      max: max(dressedCenters),

      avg: avg(dressedCenters),

    },

    movement: {

      min: min(movements),

      max: max(movements),

      avg: avg(movements),

    },

    spread: {

      min: min(spreads),

      max: max(spreads),

      avg: avg(spreads),

    },

    warningCounts,

    bySize,

    extremeLow,

    extremeHigh,

    weakestVoiceMovement,

    strongestVoiceMovement,

  };

};

const buildWarnings = ({

  bareRange,

  dressedRange,

  bareBounds,

  dressedBounds,

  hoopDressedCenterDelta,

  voiceRead,

}) => {

  const warnings = [];

  if (bareRange.centerHz <= 72) warnings.push('BARE_CENTER_LOW_CLAMP');

  if (bareRange.endHz >= 420) warnings.push('BARE_HIGH_CLAMP');

  if (dressedRange.centerHz <= 72) warnings.push('DRESSED_CENTER_LOW_CLAMP');

  if (dressedRange.endHz >= 420) warnings.push('DRESSED_HIGH_CLAMP');

  if (bareBounds.start <= 1.03) warnings.push('BARE_VISUAL_LEFT_EDGE');

  if (bareBounds.end >= 4.97) warnings.push('BARE_VISUAL_RIGHT_EDGE');

  if (dressedBounds.start <= 1.03) warnings.push('DRESSED_VISUAL_LEFT_EDGE');

  if (dressedBounds.end >= 4.97) warnings.push('DRESSED_VISUAL_RIGHT_EDGE');

  if (Math.abs(hoopDressedCenterDelta) < 10) {

    warnings.push('HOOP_DRESSED_DELTA_TOO_SMALL');

  }

  if (!voiceRead?.profile) warnings.push('MISSING_PROFILE');

  return warnings;

};

const main = () => {

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cases = buildCases();

  const rows = cases.map((item) => {

    const bareCenter = getHeritageBareShellCenterHz(item);

    const dressedCenter = getHeritageDressedCenterHz(item);

    const oppositeHoopDressedCenter = getHeritageDressedCenterHz({

      ...item,

      hoopType: item.hoopType === 'Die-Cast' ? 'Triple Flange' : 'Die-Cast',

    });

    const hoopDressedCenterDelta = Math.abs(

      dressedCenter - oppositeHoopDressedCenter

    );

    const bareRange = getLegacyTuningHzRangeFromCenter(

      bareCenter,

      LEGACY_TUNING_MODE.BARE_SHELL

    );

    const dressedRange = getLegacyTuningHzRangeFromCenter(

      dressedCenter,

      LEGACY_TUNING_MODE.DRESSED

    );

    const bareBounds = getLegacyTuningRangeBoundsFromHz(bareRange);

    const dressedBounds = getLegacyTuningRangeBoundsFromHz(dressedRange);

    const voiceRead = buildHeritageVoiceRead({

      ...item,

      benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

      benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

      benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,

    });

    const profile = formatProfile(voiceRead?.profile || {});

    const { movement, spread } = getVoiceMovement(profile);

    const warnings = buildWarnings({

      bareRange,

      dressedRange,

      bareBounds,

      dressedBounds,

      hoopDressedCenterDelta,

      voiceRead,

    });

    return {

      ...item,

      bareRange: bareRange.label,

      bareCenter: bareRange.centerHz,

      bareStart: bareRange.startHz,

      bareEnd: bareRange.endHz,

      bareScaleStart: Number(bareBounds.start.toFixed(3)),

      bareScaleEnd: Number(bareBounds.end.toFixed(3)),

      bareScaleCenter: Number(bareBounds.center.toFixed(3)),

      dressedRange: dressedRange.label,

      dressedCenter: dressedRange.centerHz,

      dressedStart: dressedRange.startHz,

      dressedEnd: dressedRange.endHz,

      dressedScaleStart: Number(dressedBounds.start.toFixed(3)),

      dressedScaleEnd: Number(dressedBounds.end.toFixed(3)),

      dressedScaleCenter: Number(dressedBounds.center.toFixed(3)),

      hoopDressedCenterDelta,

      nearestNotesBare: `${frequencyToNearestNote(

        bareRange.startHz

      )}–${frequencyToNearestNote(bareRange.endHz)}`,

      nearestNotesDressed: `${frequencyToNearestNote(

        dressedRange.startHz

      )}–${frequencyToNearestNote(dressedRange.endHz)}`,

      movement,

      spread,

      topNodes: getTopNodes(profile).join(' / '),

      sourceBuildRead: voiceRead?.sourceBuildRead || '',

      warnings: warnings.join('|'),

    };

  });

  const summary = summarize(rows);

  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, rows }, null, 2));

  fs.writeFileSync(OUT_CSV, makeCsv(rows));

  const summaryText = [

    `Heritage LegacyTuning Test Summary`,

    ``,

    `Total cases: ${summary.totalCases}`,

    ``,

    `Bare center Hz: min ${summary.bareCenter.min}, max ${summary.bareCenter.max}, avg ${summary.bareCenter.avg}`,

    `Dressed center Hz: min ${summary.dressedCenter.min}, max ${summary.dressedCenter.max}, avg ${summary.dressedCenter.avg}`,

    `Voice movement: min ${summary.movement.min}, max ${summary.movement.max}, avg ${summary.movement.avg}`,

    `Voice spread: min ${summary.spread.min}, max ${summary.spread.max}, avg ${summary.spread.avg}`,

    ``,

    `Warnings:`,

    JSON.stringify(summary.warningCounts, null, 2),

    ``,

    `By size:`,

    JSON.stringify(summary.bySize, null, 2),

    ``,

    `Lowest bare-center cases:`,

    JSON.stringify(

      summary.extremeLow.map((row) => ({

        size: row.size,

        depth: row.depth,

        lugs: row.lugs,

        staveOption: row.staveOption,

        hoopType: row.hoopType,

        scorchDepth: row.scorchDepth,

        bareRange: row.bareRange,

        dressedRange: row.dressedRange,

        bareScaleStart: row.bareScaleStart,

        bareScaleEnd: row.bareScaleEnd,

        warnings: row.warnings,

      })),

      null,

      2

    ),

    ``,

    `Highest bare-center cases:`,

    JSON.stringify(

      summary.extremeHigh.map((row) => ({

        size: row.size,

        depth: row.depth,

        lugs: row.lugs,

        staveOption: row.staveOption,

        hoopType: row.hoopType,

        scorchDepth: row.scorchDepth,

        bareRange: row.bareRange,

        dressedRange: row.dressedRange,

        bareScaleStart: row.bareScaleStart,

        bareScaleEnd: row.bareScaleEnd,

        warnings: row.warnings,

      })),

      null,

      2

    ),

    ``,

    `Weakest voice movement cases:`,

    JSON.stringify(

      summary.weakestVoiceMovement.map((row) => ({

        size: row.size,

        depth: row.depth,

        lugs: row.lugs,

        staveOption: row.staveOption,

        hoopType: row.hoopType,

        scorchDepth: row.scorchDepth,

        movement: row.movement,

        spread: row.spread,

        topNodes: row.topNodes,

      })),

      null,

      2

    ),

    ``,

    `Strongest voice movement cases:`,

    JSON.stringify(

      summary.strongestVoiceMovement.map((row) => ({

        size: row.size,

        depth: row.depth,

        lugs: row.lugs,

        staveOption: row.staveOption,

        hoopType: row.hoopType,

        scorchDepth: row.scorchDepth,

        movement: row.movement,

        spread: row.spread,

        topNodes: row.topNodes,

      })),

      null,

      2

    ),

    ``,

    `Wrote:`,

    path.relative(ROOT, OUT_JSON),

    path.relative(ROOT, OUT_CSV),

    path.relative(ROOT, OUT_SUMMARY),

  ].join('\n');

  fs.writeFileSync(OUT_SUMMARY, summaryText);

  console.log(summaryText);

};

main();