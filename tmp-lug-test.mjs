import { buildHeritageVoiceRead } from './src/utils/legacyPrint/buildHeritageVoiceRead.js';

const mode = (process.argv[2] || 'lugs').toLowerCase();

const baseInput = {

  size: 14,

  depth: 5.5,

  lugs: 8,

  staveOption: '16 Stave - 10mm',

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

function printProfileBlock(label, read) {

  console.log(`\n=== ${label} ===`);

  console.log(read.profile);

  console.log('\n=== DELTA FROM BENCHMARK CENTER (5.0) ===');

  Object.entries(read.profile).forEach(([axis, value]) => {

    const delta = (Number(value) - 5).toFixed(2);

    const sign = Number(delta) >= 0 ? '+' : '';

    console.log(`${axis}: ${sign}${delta}`);

  });

  console.log('\n=== SOURCE BUILD READ ===');

  console.log(read.sourceBuildRead);

}

const baseRead = buildHeritageVoiceRead(baseInput);

console.log('\n=== BASE PROFILE ===');

console.log(baseRead.profile);

console.log('\n=== DELTA FROM BENCHMARK CENTER (5.0) ===');

Object.entries(baseRead.profile).forEach(([axis, value]) => {

  const delta = (Number(value) - 5).toFixed(2);

  const sign = Number(delta) >= 0 ? '+' : '';

  console.log(`${axis}: ${sign}${delta}`);

});

console.log('\n=== SOURCE BUILD READ ===');

console.log(baseRead.sourceBuildRead);

const variantInput = clone(baseInput);

switch (mode) {

  case 'lugs':

    variantInput.lugs = 10;

    printProfileBlock('LUG-ONLY PROFILE', buildHeritageVoiceRead(variantInput));

    break;

  case 'staves':

  case 'stave':

    variantInput.staveOption = '20 Stave - 10mm';

    printProfileBlock('STAVE-ONLY PROFILE', buildHeritageVoiceRead(variantInput));

    break;

  case 'thickness':

    variantInput.staveOption = '16 Stave - 12mm';

    printProfileBlock(

      'THICKNESS-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'depth':

    variantInput.depth = 8;

    printProfileBlock('DEPTH-ONLY PROFILE', buildHeritageVoiceRead(variantInput));

    break;

  case 'hoops':

  case 'hoop':

    variantInput.hoopType = 'Die-Cast';

    printProfileBlock('HOOP-ONLY PROFILE', buildHeritageVoiceRead(variantInput));

    break;

  case 'rerings':

  case 're-rings':

  case 'rering':

    variantInput.staveOption = '16 Stave - 10mm + $150';

    printProfileBlock(

      'RE-RINGS-ONLY PROFILE',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'diameter13':

    variantInput.size = 13;

    variantInput.lugs = 8;

    printProfileBlock(

      'DIAMETER-ONLY PROFILE (14 → 13)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'diameter12':

    variantInput.size = 12;

    variantInput.lugs = 6;

    variantInput.staveOption = '12 Stave - 10mm';

    printProfileBlock(

      'DIAMETER-ONLY PROFILE (14 → 12)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound65':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

      case 'compound65-light':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    variantInput.scorchDepth = 'Light Torch';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm / LIGHT TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound65-blackened':

    variantInput.depth = 6.5;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    variantInput.scorchDepth = 'Blackened';

    printProfileBlock(

      'COMPOUND PROFILE (14x6.5 / 10 lug / 20 stave / 12mm / BLACKENED)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8-light':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    variantInput.scorchDepth = 'Light Torch';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm / LIGHT TORCH)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8-blackened':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    variantInput.scorchDepth = 'Blackened';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm / BLACKENED)',

      buildHeritageVoiceRead(variantInput)

    );

    break;

  case 'compound8':

    variantInput.depth = 8;

    variantInput.lugs = 10;

    variantInput.staveOption = '20 Stave - 12mm';

    printProfileBlock(

      'COMPOUND PROFILE (14x8 / 10 lug / 20 stave / 12mm)',

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

'\nUse one of: lugs, staves, thickness, depth, hoops, rerings, diameter13, diameter12, compound65, compound8, compound65-light, compound65-blackened, compound8-light, compound8-blackened, finish-light, finish-medium, finish-blackened'
    );

}