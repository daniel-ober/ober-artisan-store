
import buildHeritageVoiceRead from './src/utils/legacyPrint/buildHeritageVoiceRead.js';

const AXIS_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const testBuilds = [

  {

    label: 'HERITAGE focused 14x6.5 thick die-cast snare',

    spec: {

      size: '14',

      depth: '6.5',

      lugs: '10',

      staveOption: '20 - 15mm',

      hardwareColor: 'Chrome',

      hoopType: 'Die-Cast',

      scorchDepth: 'Blackened',

      benchmarkFamilyId: 'ober-custom',

      benchmarkTypeId: 'heritage-oak-reference',

      benchmarkSizeId: '14x5_5',

    },

  },

  {

    label: 'HERITAGE standard 14x5.5 open snare',

    spec: {

      size: '14',

      depth: '5.5',

      lugs: '8',

      staveOption: '16 - 11mm',

      hardwareColor: 'Chrome',

      hoopType: 'Triple Flange',

      scorchDepth: 'Medium Torch',

      benchmarkFamilyId: 'ober-custom',

      benchmarkTypeId: 'heritage-oak-reference',

      benchmarkSizeId: '14x5_5',

    },

  },

  {

    label: 'HERITAGE deep 14x8 open snare',

    spec: {

      size: '14',

      depth: '8.0',

      lugs: '10',

      staveOption: '10 - 7mm + $150 (Re-Rings Required)',

      hardwareColor: 'Chrome',

      hoopType: 'Triple Flange',

      scorchDepth: 'Medium Torch',

      benchmarkFamilyId: 'ober-custom',

      benchmarkTypeId: 'heritage-oak-reference',

      benchmarkSizeId: '14x5_5',

    },

  },

];

const formatProfile = (profile = {}) =>

  AXIS_ORDER.map((key) => `${key}: ${Number(profile[key] ?? 0).toFixed(2)}`).join(' | ');

let hasFailure = false;

for (const item of testBuilds) {

  const read = buildHeritageVoiceRead(item.spec);

  const legacyProfile = read?.profile || {};

  const universalProfile = read?.universalProfile || read?.universalVoiceRead?.profile || {};

  const universalReads = read?.universalVoiceRead?.reads || {};

  const dominantNodes = read?.universalVoiceRead?.dominantNodes || read?.dominantNodes || [];

  console.log('\n============================================================');

  console.log(item.label);

  console.log('------------------------------------------------------------');

  console.log('\nLEGACY / OLD PRODUCT PROFILE');

  console.log(formatProfile(legacyProfile));

  console.log('\nUNIVERSAL PROFILE');

  console.log(formatProfile(universalProfile));

  console.log('\nDOMINANT NODES');

  console.log(dominantNodes.join(', '));

  console.log('\nUNIVERSAL READS');

  console.log('Construction:', universalReads.shellConstruction?.label || 'MISSING');

  console.log('Material:', universalReads.shellMaterial?.label || 'MISSING');

  console.log('Thickness:', universalReads.shellThickness?.label || 'MISSING');

  console.log('Bearing Edge:', universalReads.bearingEdge?.summary || 'MISSING');

  console.log('Hoop/Hardware:', universalReads.hoopHardware?.summary || 'MISSING');

  console.log('Heads:', universalReads.drumheads?.summary || 'MISSING');

  console.log('Tuning:', universalReads.tuning?.summary || 'MISSING');

  console.log('Finish:', universalReads.finishTreatment?.summary || 'MISSING');

  const missingUniversalProfile = AXIS_ORDER.some(

    (key) => typeof universalProfile[key] !== 'number'

  );

  const missingReads =

    !universalReads.shellConstruction ||

    !universalReads.shellMaterial ||

    !universalReads.shellThickness ||

    !universalReads.tuning;

  const hasOldExtremeControl =

    Number(legacyProfile.control || 0) >= 7 &&

    Number(universalProfile.control || 0) >= 7;

  const hasOldExtremeSensitivity =

    Number(legacyProfile.sensitivity || 0) <= 3.5 &&

    Number(universalProfile.sensitivity || 0) <= 3.5;

  if (missingUniversalProfile) {

    hasFailure = true;

    console.log('\n❌ FAIL: universalProfile is missing one or more nodes.');

  }

  if (missingReads) {

    hasFailure = true;

    console.log('\n❌ FAIL: universal read category data is missing.');

  }

  if (hasOldExtremeControl || hasOldExtremeSensitivity) {

    hasFailure = true;

    console.log('\n❌ FAIL: universalProfile still appears to be using old exaggerated values.');

  }

  if (!missingUniversalProfile && !missingReads && !hasOldExtremeControl && !hasOldExtremeSensitivity) {

    console.log('\n✅ PASS: universal profile/read data is available and not using old exaggerated values.');

  }

}

console.log('\n============================================================');

if (hasFailure) {

  console.log('❌ HERITAGE UNIVERSAL READ TEST FAILED');

  process.exit(1);

}

console.log('✅ HERITAGE UNIVERSAL READ TEST PASSED');

