// src/utils/legacyPrint/scoring/nodeKeys.js

export const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

export const createNeutralNodeProfile = (value = 5) =>

  NODE_KEYS.reduce((profile, key) => {

    profile[key] = value;

    return profile;

  }, {});