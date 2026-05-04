// src/utils/legacyPrint/core/testGenericLegacyPrintCore.js

import buildLegacyPrintRead from './buildLegacyPrintRead.js';

const TEST_CASES = [

  {

    label: 'Heritage-style stave oak reference',

    spec: {

      lineId: 'heritage',

      lineLabel: 'Heritage',

      width: 14,

      depth: 5.5,

      shellFamily: 'wood',

      construction: 'stave',

      primarySpecies: 'oak',

      woodSpeciesLabel: 'Northern Red Oak',

      lugQuantity: 8,

      staveCount: 16,

      shellThicknessMm: 10,

      hoopType: 'Triple Flange',

      finish: 'Medium Torch',

    },

  },

  {

    label: 'Deeper warm stave read',

    spec: {

      lineId: 'heritage',

      lineLabel: 'Heritage',

      width: 14,

      depth: 8,

      shellFamily: 'wood',

      construction: 'stave',

      primarySpecies: 'oak',

      woodSpeciesLabel: 'Northern Red Oak',

      lugQuantity: 8,

      staveCount: 16,

      shellThicknessMm: 10,

      hoopType: 'Triple Flange',

      finish: 'Medium Torch',

    },

  },

  {

    label: 'Focused die-cast thick shell',

    spec: {

      lineId: 'heritage',

      lineLabel: 'Heritage',

      width: 14,

      depth: 6.5,

      shellFamily: 'wood',

      construction: 'stave',

      primarySpecies: 'oak',

      woodSpeciesLabel: 'Northern Red Oak',

      lugQuantity: 10,

      staveCount: 20,

      shellThicknessMm: 12,

      hoopType: 'Die-Cast',

      finish: 'Blackened',

    },

  },

  {

    label: 'Feuzon hybrid reference',

    spec: {

      lineId: 'feuzon',

      lineLabel: 'FEUZØN',

      width: 14,

      depth: 6.5,

      shellFamily: 'wood',

      construction: 'hybrid',

      primarySpecies: 'maple',

      secondarySpecies: 'walnut',

      woodSpeciesLabel: 'Hybrid Hardwood Reference',

      lugQuantity: 10,

      shellThicknessMm: 10,

      hoopType: 'Die-Cast',

      finish: 'Neutral Satin',

    },

  },

  {

    label: 'Brass metal reference',

    spec: {

      lineId: 'metal-reference',

      lineLabel: 'Metal Reference',

      width: 14,

      depth: 6.5,

      shellFamily: 'metal',

      construction: 'rolled',

      metalMaterial: 'brass',

      lugQuantity: 10,

      shellThicknessMm: 1.2,

      hoopType: 'Die-Cast',

      finish: 'Polished Metal',

    },

  },

  {

    label: 'Thin acrylic reference',

    spec: {

      lineId: 'acrylic-reference',

      lineLabel: 'Acrylic Reference',

      width: 14,

      depth: 6.5,

      shellFamily: 'acrylic',

      construction: 'seamless',

      acrylicType: 'thin acrylic',

      lugQuantity: 10,

      shellThicknessMm: 5,

      hoopType: 'Triple Flange',

      finish: 'Clear Acrylic',

    },

  },

];

function summarizeRead({ label, spec }) {

  const read = buildLegacyPrintRead(spec);

  return {

    label,

    profile: read.profile,

    sourceBuildRead: read.sourceBuildRead,

    primaryGenre: read.primaryGenre,

    playingSituation: read.playingSituation,

    highlightedCharacteristics: read.highlightedCharacteristics,

    simpleThreadNodes: read.simpleThreadNodes,

    shapedThreadNodes: read.shapedThreadNodes,

    complexThreadNodes: read.complexThreadNodes,

    movement: read.meta.profileMovement,

    spread: read.meta.profileSpread,

  };

}

export function runGenericLegacyPrintCoreTest() {

  const rows = TEST_CASES.map(summarizeRead);

  console.clear();

  console.log(

    '%cGeneric LegacyPrint Core Test',

    'font-size: 16px; font-weight: bold;'

  );

  console.table(

    rows.map((row) => ({

      label: row.label,

      attack: row.profile.attack,

      brightness: row.profile.brightness,

      projection: row.profile.projection,

      sustain: row.profile.sustain,

      warmth: row.profile.warmth,

      sensitivity: row.profile.sensitivity,

      control: row.profile.control,

      movement: row.movement,

      spread: row.spread,

      simpleNodes: row.simpleThreadNodes.join(' / '),

      complexNodes: row.complexThreadNodes.join(' / '),

    }))

  );

  rows.forEach((row) => {

    console.groupCollapsed(row.label);

    console.log('Profile:', row.profile);

    console.log('Source Build:', row.sourceBuildRead);

    console.log('Primary Genre:', row.primaryGenre);

    console.log('Playing Situation:', row.playingSituation);

    console.log('Highlighted:', row.highlightedCharacteristics);

    console.log('Simple Nodes:', row.simpleThreadNodes);

    console.log('Shaped Nodes:', row.shapedThreadNodes);

    console.log('Complex Nodes:', row.complexThreadNodes);

    console.groupEnd();

  });

  if (typeof window !== 'undefined') {

    window.genericLegacyPrintCoreRows = rows;

  }

  return rows;

}

export default runGenericLegacyPrintCoreTest;