// src/utils/legacyPrint/scoring/physicalPropertyNodeMap.js

export const PHYSICAL_PROPERTY_NODE_MAP = {

  shellConstruction: {

    stave: { attack: 0.6, projection: 0.5, sustain: 0.35, sensitivity: 0.25 },

    ply: { warmth: 0.25, control: 0.2, sustain: 0.15 },

    solid: { warmth: 0.55, sustain: 0.45, sensitivity: 0.25 },

    metal: { attack: 0.55, brightness: 0.65, projection: 0.6, control: 0.25 },

    acrylic: { attack: 0.5, brightness: 0.45, projection: 0.55, warmth: -0.35 },

  },

  shellMaterial1: {

    maple: { warmth: 0.4, sustain: 0.25, sensitivity: 0.2 },

    birch: { attack: 0.35, brightness: 0.35, projection: 0.3, warmth: -0.15 },

    mahogany: { warmth: 0.65, brightness: -0.35, control: 0.25 },

    oak: { attack: 0.45, projection: 0.45, brightness: 0.2 },

    walnut: { warmth: 0.45, control: 0.3, brightness: -0.15 },

    cherry: { warmth: 0.3, sensitivity: 0.25, sustain: 0.2 },

    bubinga: { attack: 0.35, projection: 0.45, warmth: 0.25, control: 0.25 },

    brass: { brightness: 0.55, projection: 0.55, sustain: 0.35 },

    aluminum: { sensitivity: 0.55, brightness: 0.3, control: 0.25 },

    steel: { attack: 0.55, brightness: 0.65, projection: 0.55 },

    copper: { warmth: 0.45, sensitivity: 0.25, brightness: 0.15 },

    bronze: { warmth: 0.35, projection: 0.45, sustain: 0.35 },

  },

  bearingEdge: {

    sharp: { attack: 0.45, brightness: 0.35, sensitivity: 0.3, warmth: -0.2 },

    rounded: { warmth: 0.45, control: 0.25, brightness: -0.3 },

    double45: { attack: 0.35, brightness: 0.25, sensitivity: 0.25 },

    baseball: { warmth: 0.55, control: 0.35, sustain: -0.15 },

  },

  hoopType: {

    'die-cast': { attack: 0.35, control: 0.55, sustain: -0.3, brightness: 0.15 },

    'triple-flanged': { sustain: 0.3, sensitivity: 0.2, control: -0.2 },

    wood: { warmth: 0.45, control: 0.25, brightness: -0.2 },

  },

  stockBatterHead: {

    coated: { warmth: 0.25, control: 0.2, brightness: -0.15 },

    clear: { attack: 0.2, brightness: 0.25, sustain: 0.2 },

    controlled: { control: 0.45, sustain: -0.25 },

    reverseDot: { attack: 0.35, control: 0.25 },

  },

  stockSnareWires: {

    '20': { sensitivity: 0.2, control: 0.1 },

    '24': { sensitivity: 0.3, brightness: 0.15 },

    '30': { sensitivity: 0.4, control: -0.15 },

    '42': { sensitivity: 0.5, brightness: 0.25, control: -0.25 },

  },

};