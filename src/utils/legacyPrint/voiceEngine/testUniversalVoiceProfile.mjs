// src/utils/legacyPrint/voiceEngine/testUniversalVoiceProfile.mjs

import buildUniversalVoiceProfile from './buildUniversalVoiceProfile.js';

const TEST_CONFIGS = [

  {

    label: 'HERITAGE reference oak snare',

    config: {

      oberLine: 'heritage',

      isOberBuild: true,

      drumType: 'snare',

      width: 14,

      depth: 5.5,

      shellConstruction: 'stave',

      shellMaterial: 'northern red oak',

      shellThicknessMm: 10,

      reinforcement: 'none',

      bearingEdge: '45 Inner / Strong Outer Roundover',

      hoopType: 'Triple Flange',

      lugType: 'Tube Lugs',

      lugQuantity: 8,

      hardwareFinish: 'Chrome',

      finish: 'Medium Torch',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'medium',

    },

  },

  {

    label: 'HERITAGE deep 14x8 oak snare',

    config: {

      oberLine: 'heritage',

      isOberBuild: true,

      drumType: 'snare',

      width: 14,

      depth: 8,

      shellConstruction: 'stave',

      shellMaterial: 'northern red oak',

      shellThicknessMm: 10,

      reinforcement: 'none',

      bearingEdge: '45 Inner / Strong Outer Roundover',

      hoopType: 'Triple Flange',

      lugType: 'Tube Lugs',

      lugQuantity: 8,

      hardwareFinish: 'Chrome',

      finish: 'Medium Torch',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'medium',

    },

  },

  {

    label: 'HERITAGE focused 14x6.5 thick die-cast snare',

    config: {

      oberLine: 'heritage',

      isOberBuild: true,

      drumType: 'snare',

      width: 14,

      depth: 6.5,

      shellConstruction: 'stave',

      shellMaterial: 'northern red oak',

      shellThicknessMm: 15,

      reinforcement: 'none',

      bearingEdge: '45 Inner / Strong Outer Roundover',

      hoopType: 'Die-Cast',

      lugType: 'Tube Lugs',

      lugQuantity: 10,

      hardwareFinish: 'Black Nickel',

      finish: 'Blackened Torch',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'medium',

    },

  },

  {

    label: 'FEUZØN hybrid 14x6 snare',

    config: {

      oberLine: 'feuzon',

      isOberBuild: true,

      drumType: 'snare',

      width: 14,

      depth: 6,

      shellConstruction: 'FEUZON hybrid stave interior steam bent exterior',

      shellMaterial: 'maple',

      shellThicknessMm: 13,

      reinforcement: 'integrated hybrid support',

      bearingEdge: 'FEUZON Balanced Hybrid Edge',

      hoopType: 'Die-Cast',

      lugType: 'Tube Lugs',

      lugQuantity: 10,

      hardwareFinish: 'Chrome',

      finish: 'Oil / Wax',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'medium',

    },

  },

  {

    label: 'Classic maple ply snare',

    config: {

      drumType: 'snare',

      width: 14,

      depth: 5.5,

      shellConstruction: 'ply',

      shellMaterial: 'maple',

      shellThicknessMm: 7.5,

      reinforcement: 'none',

      bearingEdge: 'sharp 45',

      hoopType: 'Triple Flange',

      lugType: 'Modern Bridge Lugs',

      lugQuantity: 8,

      hardwareFinish: 'Chrome',

      finish: 'Gloss Lacquer',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'medium',

    },

  },

  {

    label: 'Brass snare tight tuning',

    config: {

      drumType: 'snare',

      width: 14,

      depth: 6.5,

      shellConstruction: 'metal',

      shellMaterial: 'brass',

      shellThicknessMm: '1.2mm',

      reinforcement: 'none',

      bearingEdge: 'sharp 45',

      hoopType: 'Triple Flange',

      lugType: 'Tube Lugs',

      lugQuantity: 10,

      hardwareFinish: 'Chrome',

      finish: 'Raw / Natural',

      batterHead: 'Coated Ambassador',

      snareSideHead: 'Ambassador Snare Side',

      tuningTarget: 'tight',

    },

  },

  {

    label: 'Warm floor tom',

    config: {

      drumType: 'floorTom',

      width: 16,

      depth: 16,

      shellConstruction: 'ply',

      shellMaterial: 'mahogany',

      shellThicknessMm: 7,

      reinforcement: 'none',

      bearingEdge: 'medium roundover',

      hoopType: 'Triple Flange',

      lugType: 'Modern Bridge Lugs',

      lugQuantity: 8,

      hardwareFinish: 'Chrome',

      finish: 'Oil / Wax',

      batterHead: 'Coated Emperor',

      resonantHead: 'Clear Ambassador',

      tuningTarget: 'loose',

    },

  },

  {

    label: 'Punchy acrylic rack tom',

    config: {

      drumType: 'rackTom',

      width: 10,

      depth: 7,

      shellConstruction: 'acrylic',

      shellMaterial: 'acrylic',

      shellThicknessMm: 6,

      reinforcement: 'none',

      bearingEdge: 'sharp 45',

      hoopType: 'Triple Flange',

      lugType: 'Modern Bridge Lugs',

      lugQuantity: 6,

      hardwareFinish: 'Chrome',

      finish: 'Raw / Natural',

      batterHead: 'Clear Emperor',

      resonantHead: 'Clear Ambassador',

      tuningTarget: 'medium',

    },

  },

];

function formatProfile(profile = {}) {

  return Object.entries(profile)

    .map(([key, value]) => `${key}: ${value}`)

    .join(' | ');

}

for (const test of TEST_CONFIGS) {

  const result = buildUniversalVoiceProfile(test.config);

  console.log('\n============================================================');

  console.log(test.label);

  console.log('------------------------------------------------------------');

  console.log(formatProfile(result.profile));

  console.log('Dominant Nodes:', result.dominantNodes.join(', '));

  console.log('Construction:', result.reads.shellConstruction.label);

  console.log('Material:', result.reads.shellMaterial.label);

  console.log('Thickness:', result.reads.shellThickness.label);

  console.log('Bearing Edge:', result.reads.bearingEdge.summary);

  console.log('Hoop/Hardware:', result.reads.hoopHardware.summary);

  console.log('Heads:', result.reads.drumheads.summary);

  console.log('Tuning:', result.reads.tuning.summary);

  console.log('Finish:', result.reads.finishTreatment.summary);

}