import buildHeritageVoiceRead from './src/utils/legacyPrint/buildHeritageVoiceRead.js';

const mode = (process.argv[2] || 'lugs').toLowerCase();

const CHART_CENTER = 5;

const CHART_MIN = 0;

const CHART_MAX = 10;

const getDisplayMetricValue = (rawValue) => {

  const distanceFromCenter = rawValue - CHART_CENTER;

  const absDistance = Math.abs(distanceFromCenter);

  if (absDistance === 0) return rawValue;

  const amplifiedDistance =

    absDistance < 0.75

      ? absDistance * 1.32

      : absDistance < 1.5

        ? 0.75 * 1.32 + (absDistance - 0.75) * 1.18

        : 0.75 * 1.32 + 0.75 * 1.18 + (absDistance - 1.5) * 1.05;

  const nextValue =

    CHART_CENTER + Math.sign(distanceFromCenter) * amplifiedDistance;

  return Math.max(CHART_MIN, Math.min(CHART_MAX, nextValue));

};

const baseInput = {

  size: 14,

  depth: 5.5,

  lugs: 8,

  staveOption: '16 - 10mm',

  hoopType: 'Triple Flange',

  hardwareColor: 'Chrome',

  scorchDepth: 'Medium Torch',

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',

};

function clone(obj) {

  return JSON.parse(JSON.stringify(obj));

}

function formatSigned(value, digits = 2) {

  const n = Number(value);

  const fixed = n.toFixed(digits);

  return n >= 0 ? `+${fixed}` : fixed;

}

function getFillPercentFromCenter(value) {

  const distance = Math.abs(Number(value) - CHART_CENTER);

  const maxDistance = CHART_MAX - CHART_CENTER;

  return ((distance / maxDistance) * 100).toFixed(1);

}

function printProfileBlock(label, read) {

  console.log(`\n==================================================`);

  console.log(`${label}`);

  console.log(`==================================================`);

  const rows = Object.entries(read.profile).map(([axis, raw]) => {

    const rawNumber = Number(raw);

    const displayNumber = getDisplayMetricValue(rawNumber);

    const rawDelta = rawNumber - CHART_CENTER;

    const displayDelta = displayNumber - CHART_CENTER;

    return {

      axis,

      raw: rawNumber.toFixed(2),

      rawDelta: formatSigned(rawDelta),

      display: displayNumber.toFixed(2),

      displayDelta: formatSigned(displayDelta),

      rawFill: `${getFillPercentFromCenter(rawNumber)}%`,

      displayFill: `${getFillPercentFromCenter(displayNumber)}%`,

    };

  });

  console.table(rows);

  console.log('\n=== SOURCE BUILD READ ===');

  console.log(read.sourceBuildRead);

}

const baseRead = buildHeritageVoiceRead(baseInput);

printProfileBlock('BASE PROFILE', baseRead);

const variantInput = clone(baseInput);

switch (mode) {

  case 'lugs':

    variantInput.lugs = 10;

    printProfileBlock('LUG-ONLY PROFILE', buildHeritageVoiceRead(variantInput));

    break;

  case 'staves':

  case 'stave':

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    printProfileBlock(

      'STAVE-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'thickness':

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    printProfileBlock(

      'THICKNESS-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'depth':

    variantInput.depth = 8;

    printProfileBlock(

      'DEPTH-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'hoops':

  case 'hoop':

    variantInput.hoopType = 'Die-Cast';

    printProfileBlock(

      'HOOP-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'rerings':

  case 're-rings':

  case 'rering':

    variantInput.lugs = 10;

    variantInput.staveOption = '10 - 7mm + $150 (Re-Rings Required)';

    printProfileBlock(

      'RE-RINGS-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'diameter13':

    variantInput.size = 13;

    variantInput.lugs = 8;

    variantInput.staveOption = '16 - 10mm';

    printProfileBlock(

      'DIAMETER-ONLY PROFILE (14 → 13)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'diameter12':

    variantInput.size = 12;

    variantInput.lugs = 8;

    variantInput.staveOption = '16 - 10mm';

    printProfileBlock(

      'DIAMETER-ONLY PROFILE (14 → 12)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound65':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound65-light':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    variantInput.scorchDepth = 'Light Torch';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm / LIGHT TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound7':

    variantInput.depth = 7;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    printProfileBlock(

      'COMPOUND PROFILE (14x7 / 10 lug / 20 stave / 12mm)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound65-blackened':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    variantInput.scorchDepth = 'Blackened';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm / BLACKENED)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8-light':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    variantInput.scorchDepth = 'Light Torch';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm / LIGHT TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8-blackened':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 - 12mm';

    variantInput.scorchDepth = 'Blackened';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm / BLACKENED)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'finish-light':

  case 'light':

    variantInput.scorchDepth = 'Light Torch';

    printProfileBlock(

      'FINISH-ONLY PROFILE (LIGHT TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'finish-medium':

  case 'medium':

    variantInput.scorchDepth = 'Medium Torch';

    printProfileBlock(

      'FINISH-ONLY PROFILE (MEDIUM TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'finish-blackened':

  case 'blackened':

  case 'black':

    variantInput.scorchDepth = 'Blackened';

    printProfileBlock(

      'FINISH-ONLY PROFILE (BLACKENED)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  default:

    console.log(`\nUnknown mode: ${mode}`);

    console.log(

      '\nUse one of: lugs, staves, thickness, depth, hoops, rerings, diameter13, diameter12, compound65, compound7, compound8, compound65-light, compound65-blackened, compound8-light, compound8-blackened, finish-light, finish-medium, finish-blackened'

    );

}