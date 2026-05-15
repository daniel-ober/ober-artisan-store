// src/data/legacyPrint/referenceDrums/referenceDrumSeed.js

import { createReferenceDrumRecord } from './referenceDrumSchema';

export const referenceDrumSeed = [

  createReferenceDrumRecord({

    id: 'baseline-ply-maple-snare',

    companyType: 'Generic / Baseline Reference',

    lineName: 'Ply Reference',

    modelName: 'Maple',

    drumType: 'Snare',

    sizes: ['14x5', '14x5.5', '14x6.5'],

    shellConstruction: 'Ply',

    shellMaterial: 'Maple',

    shellThickness: 'Medium / 6–8mm',

    hoopType: 'Triple Flange 2.3mm',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Side',

    snareWires: 'Generic 20-Strand Steel',

    confidence: 'Estimated / Modeled',

    notes: 'Baseline maple ply snare reference for neutral comparison.',

  }),

  createReferenceDrumRecord({

    id: 'baseline-ply-birch-snare',

    companyType: 'Generic / Baseline Reference',

    lineName: 'Ply Reference',

    modelName: 'Birch',

    drumType: 'Snare',

    sizes: ['14x5.5', '14x6.5'],

    shellConstruction: 'Ply',

    shellMaterial: 'Birch',

    shellThickness: 'Medium / 6–8mm',

    hoopType: 'Triple Flange 2.3mm',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Side',

    snareWires: 'Generic 20-Strand Steel',

    confidence: 'Estimated / Modeled',

    notes: 'Baseline birch ply snare reference for brighter attack and projection comparison.',

  }),

  createReferenceDrumRecord({

    id: 'baseline-metal-brass-snare',

    companyType: 'Generic / Baseline Reference',

    lineName: 'Metal Reference',

    modelName: 'Brass',

    drumType: 'Snare',

    sizes: ['14x5', '14x6.5'],

    shellConstruction: 'Metal',

    shellMaterial: 'Brass',

    shellThickness: 'Medium / 1.2–1.5mm',

    hoopType: 'Triple Flange 2.3mm',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Side',

    snareWires: 'Generic 20-Strand Steel',

    confidence: 'Estimated / Modeled',

    notes: 'Baseline brass snare reference for warmth, brightness, and projection comparison.',

  }),

  createReferenceDrumRecord({

    id: 'baseline-metal-steel-snare',

    companyType: 'Generic / Baseline Reference',

    lineName: 'Metal Reference',

    modelName: 'Steel',

    drumType: 'Snare',

    sizes: ['14x5.5', '14x6.5'],

    shellConstruction: 'Metal',

    shellMaterial: 'Steel',

    shellThickness: 'Medium / 1.2–1.5mm',

    hoopType: 'Triple Flange 2.3mm',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Side',

    snareWires: 'Generic 20-Strand Steel',

    confidence: 'Estimated / Modeled',

    notes: 'Baseline steel snare reference for bright, cutting, controlled comparison.',

  }),

  createReferenceDrumRecord({

    id: 'baseline-acrylic-snare',

    companyType: 'Generic / Baseline Reference',

    lineName: 'Acrylic Reference',

    modelName: 'Clear Acrylic',

    drumType: 'Snare',

    sizes: ['14x5.5', '14x6.5'],

    shellConstruction: 'Acrylic',

    shellMaterial: 'Clear Acrylic',

    shellThickness: 'Medium / 5–6mm',

    hoopType: 'Triple Flange 2.3mm',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Side',

    snareWires: 'Generic 20-Strand Steel',

    confidence: 'Estimated / Modeled',

    notes: 'Baseline acrylic snare reference for fast attack, brightness, and projection comparison.',

  }),

];