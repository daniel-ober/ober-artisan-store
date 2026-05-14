
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

const configs = [

  {

    label: '12 x 5.0 / triple flange / medium torch',

    spec: {

      size: '12',

      depth: '5.0',

      lugs: '8',

      staveOption: '16 - 13mm',

      hardwareColor: 'Chrome',

      hoopType: 'Triple Flange',

      scorchDepth: 'Medium Torch',

    },

  },

  {

    label: '13 x 5.0 / triple flange / medium torch',

    spec: {

      size: '13',

      depth: '5.0',

      lugs: '8',

      staveOption: '16 - 12mm',

      hardwareColor: 'Chrome',

      hoopType: 'Triple Flange',

      scorchDepth: 'Medium Torch',

    },

  },

  {

    label: '14 x 5.0 / triple flange / medium torch',

    spec: {

      size: '14',

      depth: '5.0',

      lugs: '10',

      staveOption: '20 - 15mm',

      hardwareColor: 'Chrome',

      hoopType: 'Triple Flange',

      scorchDepth: 'Medium Torch',

    },

  },

];

const formatProfile = (profile = {}) => {

  return AXIS_ORDER.map((key) => {

    const value = Number(profile?.[key] ?? 0).toFixed(2);

    return `${key}: ${value}`;

  }).join(' | ');

};

const rankTopNodes = (profile = {}) => {

  return AXIS_ORDER.map((key) => {

    const value = Number(profile?.[key] ?? 5);

    return {

      key,

      value,

      distanceFromCenter: Math.abs(value - 5),

    };

  })

    .sort((a, b) => {

      if (b.distanceFromCenter !== a.distanceFromCenter) {

        return b.distanceFromCenter - a.distanceFromCenter;

      }

      return b.value - a.value;

    })

    .slice(0, 3)

    .map((item) => `${item.key} (${item.value.toFixed(2)})`);

};

configs.forEach(({ label, spec }) => {

  const read = buildHeritageVoiceRead(spec);

  const legacyProfile = read?.profile || {};

  const universalProfile =

    read?.universalVoiceRead?.profile ||

    read?.universalProfile ||

    {};

  console.log('\n============================================================');

  console.log(label);

  console.log('------------------------------------------------------------');

  console.log('\nLEGACY PRODUCT PROFILE');

  console.log(formatProfile(legacyProfile));

  console.log('\nUNIVERSAL PROFILE');

  console.log(formatProfile(universalProfile));

  console.log('\nLEGACY FIRST LISTEN');

  console.dir(read?.firstListen || null, { depth: 5 });

  console.log('\nUNIVERSAL FIRST LISTEN');

  console.dir(read?.universalVoiceRead?.firstListen || null, { depth: 5 });

  console.log('\nTOP 3 BY UNIVERSAL PROFILE DISTANCE');

  console.log(rankTopNodes(universalProfile).join(', '));

  console.log('\nUNIVERSAL READ CATEGORIES');

  console.dir(

    {

      construction: read?.universalVoiceRead?.reads?.shellConstruction?.label,

      material: read?.universalVoiceRead?.reads?.shellMaterial?.label,

      thickness: read?.universalVoiceRead?.reads?.shellThickness?.label,

      hoopHardware: read?.universalVoiceRead?.reads?.hoopHardware?.summary,

      tuning: read?.universalVoiceRead?.reads?.tuning?.summary,

      finish: read?.universalVoiceRead?.reads?.finishTreatment?.summary,

    },

    { depth: 5 }

  );

});

