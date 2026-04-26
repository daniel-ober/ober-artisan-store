// src/data/legacyPrint/feuzonBaseline.js

export const FEUZON_BASELINE_SELECTIONS = {

  series: 'FEUZØN',

  shellFamily: 'wood',

  construction: 'Hybrid',

  width: 14,

  depth: 6.0,

  lugQuantity: 8,

  staveCount: 16,

  shellThicknessMm: 13,

  outerSpecies: 'Maple',

  innerSpecies: 'Walnut',

  secondarySpecies: 'Birch',

  hoopType: 'Die-Cast',

  hardwareType: 'Chrome',

  bearingEdge: 'Balanced Hybrid Edge',

  snareBedDepth: 'Standard',

  finish: 'Natural Gloss',

  scorchStyle: 'scorched',

  stainStyle: 'natural',

  stainColor: 'none',

  drumhead: 'Coated',

  tension: 'Medium',

  snareSideHead: 'Standard — 3mil',

  snareWireCount: 20,

  snareWireStyle: 'Standard',

  snareWireMaterial: 'Steel',

  throwOff: 'Trick GS007',

  snareWires: 'PureSound Custom Pro 20-Strand',

};

export const FEUZON_BASELINE_PROFILE = {

  attack: 7.4,

  sustain: 7.0,

  warmth: 6.9,

  projection: 7.5,

  brightness: 6.5,

  sensitivity: 6.8,

  control: 6.8,

};

export const FEUZON_BASELINE = {

  id: 'feuzon-standard-reference',

  familyId: 'ober-custom',

  typeId: 'feuzon-hybrid-reference',

  label: 'FEUZØN Standard Reference',

  shortLabel: 'FEUZØN Reference',

  description:

    'The FEUZØN baseline centers on a balanced hybrid shell direction: articulate, dimensional, modern, and controlled without losing body.',

  selections: FEUZON_BASELINE_SELECTIONS,

  profile: FEUZON_BASELINE_PROFILE,

  confidence01: 0.84,

  confidencePercent: 84,

  benchmarkNotes: [

    'This baseline is an Ober-centered FEUZØN reference, not a lab-measured acoustic standard.',

    'It is meant to anchor comparisons for a balanced FEUZØN build direction built around hybrid shell behavior.',

  ],

};

export default FEUZON_BASELINE;