
const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const makeProfile = values =>

  Object.fromEntries(SNARE_NODE_KEYS.map(key => [key, Number(values[key] || 0)]));

const COMPONENT_WEIGHTS = {

  shellMaterial: 0.92,

  shellConstruction: 0.78,

  diameter: 0.62,

  depth: 0.66,

  shellThickness: 0.72,

  bearingEdge: 0.72,

  hoopType: 0.58,

  lugCount: 0.28,

  snareBed: 0.38,

  stockHeads: 0,

  stockSnareWires: 0,

  productionStatus: 0,

  brand: 0

};

const SHELL_MATERIAL_EFFECTS = {

  bellBrass: makeProfile({

    attack: 1.25,

    brightness: 1.05,

    projection: 1.35,

    sustain: 1.25,

    warmth: 0.65,

    sensitivity: -0.15,

    control: 0.45

  }),

  brass: makeProfile({

    attack: 0.95,

    brightness: 0.68,

    projection: 0.95,

    sustain: 0.82,

    warmth: 0.62,

    sensitivity: 0.02,

    control: 0.22

  }),

  bronze: makeProfile({

    attack: 0.82,

    brightness: 0.38,

    projection: 0.92,

    sustain: 0.95,

    warmth: 0.9,

    sensitivity: -0.03,

    control: 0.28

  }),

  copper: makeProfile({

    attack: 0.48,

    brightness: 0.05,

    projection: 0.55,

    sustain: 0.78,

    warmth: 1.18,

    sensitivity: 0.08,

    control: 0.2

  }),

  steel: makeProfile({

    attack: 1.05,

    brightness: 1.22,

    projection: 1.02,

    sustain: 0.45,

    warmth: -0.45,

    sensitivity: 0.12,

    control: 0.38

  }),

  stainlessSteel: makeProfile({

    attack: 1.08,

    brightness: 1.12,

    projection: 1.05,

    sustain: 0.58,

    warmth: -0.3,

    sensitivity: 0.08,

    control: 0.38

  }),

  aluminum: makeProfile({

    attack: 0.62,

    brightness: 0.22,

    projection: 0.25,

    sustain: -0.45,

    warmth: 0.08,

    sensitivity: 0.55,

    control: 1.02

  }),

  titanium: makeProfile({

    attack: 0.98,

    brightness: 0.78,

    projection: 1.02,

    sustain: 0.28,

    warmth: -0.15,

    sensitivity: 0.22,

    control: 0.62

  }),

  maple: makeProfile({

    attack: 0.48,

    brightness: 0.22,

    projection: 0.32,

    sustain: 0.38,

    warmth: 0.72,

    sensitivity: 0.48,

    control: 0.18

  }),

  maplePoplar: makeProfile({

    attack: 0.32,

    brightness: 0.05,

    projection: 0.2,

    sustain: 0.52,

    warmth: 0.88,

    sensitivity: 0.42,

    control: 0.15

  }),

  mapleWalnut: makeProfile({

    attack: 0.32,

    brightness: 0,

    projection: 0.28,

    sustain: 0.55,

    warmth: 1.02,

    sensitivity: 0.28,

    control: 0.28

  }),

  birch: makeProfile({

    attack: 0.75,

    brightness: 0.72,

    projection: 0.55,

    sustain: 0.08,

    warmth: 0.12,

    sensitivity: 0.36,

    control: 0.42

  }),

  beech: makeProfile({

    attack: 0.55,

    brightness: 0.35,

    projection: 0.55,

    sustain: 0.38,

    warmth: 0.52,

    sensitivity: 0.36,

    control: 0.3

  }),

  mahogany: makeProfile({

    attack: 0.12,

    brightness: -0.32,

    projection: 0.08,

    sustain: 0.55,

    warmth: 1.3,

    sensitivity: 0.38,

    control: 0.05

  }),

  mahoganyPoplar: makeProfile({

    attack: 0.08,

    brightness: -0.35,

    projection: 0.05,

    sustain: 0.62,

    warmth: 1.4,

    sensitivity: 0.38,

    control: 0

  }),

  walnut: makeProfile({

    attack: 0.3,

    brightness: -0.05,

    projection: 0.25,

    sustain: 0.58,

    warmth: 1.08,

    sensitivity: 0.28,

    control: 0.28

  }),

  oak: makeProfile({

    attack: 0.62,

    brightness: 0.32,

    projection: 0.72,

    sustain: 0.25,

    warmth: 0.48,

    sensitivity: 0.12,

    control: 0.38

  }),

  cherry: makeProfile({

    attack: 0.42,

    brightness: 0.15,

    projection: 0.32,

    sustain: 0.62,

    warmth: 0.82,

    sensitivity: 0.35,

    control: 0.18

  }),

  bubinga: makeProfile({

    attack: 0.62,

    brightness: 0.28,

    projection: 0.82,

    sustain: 0.58,

    warmth: 0.82,

    sensitivity: 0.12,

    control: 0.38

  }),

  poplar: makeProfile({

    attack: 0.12,

    brightness: -0.18,

    projection: 0.05,

    sustain: 0.48,

    warmth: 0.82,

    sensitivity: 0.38,

    control: 0.08

  }),

  acrylic: makeProfile({

    attack: 0.72,

    brightness: 0.55,

    projection: 0.72,

    sustain: 0.98,

    warmth: -0.45,

    sensitivity: 0.02,

    control: 0.08

  }),

  genericWood: makeProfile({

    attack: 0.28,

    brightness: 0.05,

    projection: 0.2,

    sustain: 0.4,

    warmth: 0.65,

    sensitivity: 0.35,

    control: 0.12

  }),

  otherMaterial: makeProfile({}),

  unknownMaterial: makeProfile({})

};

const SHELL_CONSTRUCTION_EFFECTS = {

  metal: makeProfile({

    attack: 0.52,

    brightness: 0.48,

    projection: 0.48,

    sustain: 0.35,

    warmth: -0.18,

    sensitivity: -0.08,

    control: 0.2

  }),

  castMetal: makeProfile({

    attack: 0.82,

    brightness: 0.48,

    projection: 0.82,

    sustain: 0.68,

    warmth: -0.02,

    sensitivity: -0.18,

    control: 0.38

  }),

  seamlessMetal: makeProfile({

    attack: 0.52,

    brightness: 0.38,

    projection: 0.55,

    sustain: 0.55,

    warmth: 0.02,

    sensitivity: 0.04,

    control: 0.22

  }),

  beadedMetal: makeProfile({

    attack: 0.58,

    brightness: 0.48,

    projection: 0.5,

    sustain: 0.25,

    warmth: -0.08,

    sensitivity: 0,

    control: 0.42

  }),

  ply: makeProfile({

    attack: 0.25,

    brightness: 0.08,

    projection: 0.18,

    sustain: 0.32,

    warmth: 0.38,

    sensitivity: 0.38,

    control: 0.18

  }),

  plyWithReinforcementRings: makeProfile({

    attack: 0.22,

    brightness: -0.02,

    projection: 0.22,

    sustain: 0.52,

    warmth: 0.72,

    sensitivity: 0.15,

    control: 0.32

  }),

  solidShell: makeProfile({

    attack: 0.22,

    brightness: -0.08,

    projection: 0.25,

    sustain: 0.78,

    warmth: 1.08,

    sensitivity: 0.48,

    control: 0.02

  }),

  steamBent: makeProfile({

    attack: 0.18,

    brightness: -0.12,

    projection: 0.22,

    sustain: 0.88,

    warmth: 1.12,

    sensitivity: 0.48,

    control: 0

  }),

  stave: makeProfile({

    attack: 0.72,

    brightness: 0.25,

    projection: 0.75,

    sustain: 0.48,

    warmth: 0.72,

    sensitivity: 0.22,

    control: 0.42

  }),

  block: makeProfile({

    attack: 0.55,

    brightness: 0.15,

    projection: 0.62,

    sustain: 0.62,

    warmth: 0.82,

    sensitivity: 0.18,

    control: 0.35

  }),

  acrylic: makeProfile({

    attack: 0.55,

    brightness: 0.48,

    projection: 0.52,

    sustain: 0.72,

    warmth: -0.32,

    sensitivity: 0.02,

    control: 0.08

  }),

  hybrid: makeProfile({

    attack: 0.35,

    brightness: 0.18,

    projection: 0.35,

    sustain: 0.38,

    warmth: 0.42,

    sensitivity: 0.25,

    control: 0.25

  }),

  composite: makeProfile({

    attack: 0.35,

    brightness: 0.25,

    projection: 0.35,

    sustain: 0.28,

    warmth: 0.08,

    sensitivity: 0.18,

    control: 0.32

  }),

  otherConstruction: makeProfile({}),

  unknownConstruction: makeProfile({})

};

const BEARING_EDGE_EFFECTS = {

  sharper45Degree: makeProfile({

    attack: 0.85,

    brightness: 0.42,

    projection: 0.05,

    sustain: 0.42,

    warmth: -0.25,

    sensitivity: 0.95,

    control: 0.12

  }),

  rounded45Degree: makeProfile({

    attack: 0.55,

    brightness: 0.22,

    projection: 0,

    sustain: 0.52,

    warmth: 0.18,

    sensitivity: 0.72,

    control: 0.12

  }),

  rounder30Degree: makeProfile({

    attack: 0.12,

    brightness: -0.22,

    projection: -0.05,

    sustain: 0.7,

    warmth: 0.82,

    sensitivity: 0.52,

    control: 0.08

  }),

  roundedVintage: makeProfile({

    attack: -0.08,

    brightness: -0.32,

    projection: -0.08,

    sustain: 0.78,

    warmth: 0.95,

    sensitivity: 0.38,

    control: -0.02

  }),

  rolledOrFormedMetal: makeProfile({

    attack: 0.42,

    brightness: 0.3,

    projection: 0.12,

    sustain: 0.28,

    warmth: -0.08,

    sensitivity: 0.22,

    control: 0.3

  }),

  rolledCollar: makeProfile({

    attack: 0.5,

    brightness: 0.35,

    projection: 0.18,

    sustain: 0.25,

    warmth: -0.08,

    sensitivity: 0.2,

    control: 0.35

  }),

  machinedMetal: makeProfile({

    attack: 0.65,

    brightness: 0.38,

    projection: 0.22,

    sustain: 0.38,

    warmth: -0.08,

    sensitivity: 0.32,

    control: 0.38

  }),

  machinedCastMetal: makeProfile({

    attack: 0.75,

    brightness: 0.42,

    projection: 0.32,

    sustain: 0.52,

    warmth: -0.02,

    sensitivity: 0.22,

    control: 0.42

  }),

  tamaWoodEdge: makeProfile({

    attack: 0.55,

    brightness: 0.28,

    projection: 0.08,

    sustain: 0.32,

    warmth: 0.12,

    sensitivity: 0.58,

    control: 0.22

  }),

  tamaStarclassicEdge: makeProfile({

    attack: 0.7,

    brightness: 0.38,

    projection: 0.12,

    sustain: 0.22,

    warmth: 0.02,

    sensitivity: 0.58,

    control: 0.42

  }),

  mapexSonicClear: makeProfile({

    attack: 0.42,

    brightness: 0.18,

    projection: 0.02,

    sustain: 0.58,

    warmth: 0.28,

    sensitivity: 0.68,

    control: 0.2

  }),

  canopusPrecisionEdge: makeProfile({

    attack: 0.42,

    brightness: 0.18,

    projection: 0,

    sustain: 0.58,

    warmth: 0.28,

    sensitivity: 1.02,

    control: 0.1

  }),

  ludwigFamilyEdge: makeProfile({

    attack: 0.22,

    brightness: -0.02,

    projection: 0,

    sustain: 0.58,

    warmth: 0.62,

    sensitivity: 0.5,

    control: 0.08

  }),

  yamahaFamilyEdge: makeProfile({

    attack: 0.45,

    brightness: 0.22,

    projection: 0.04,

    sustain: 0.45,

    warmth: 0.2,

    sensitivity: 0.62,

    control: 0.18

  }),

  acrylicEdge: makeProfile({

    attack: 0.55,

    brightness: 0.38,

    projection: 0.08,

    sustain: 0.48,

    warmth: -0.22,

    sensitivity: 0.35,

    control: 0.12

  }),

  structuredBearingEdge: makeProfile({

    attack: 0.18,

    brightness: 0.05,

    projection: 0,

    sustain: 0.18,

    warmth: 0.08,

    sensitivity: 0.22,

    control: 0.08

  }),

  otherBearingEdge: makeProfile({}),

  unknownBearingEdge: makeProfile({})

};

const HOOP_EFFECTS = {

  dieCast: makeProfile({

    attack: 0.72,

    brightness: 0.35,

    projection: 0.22,

    sustain: -0.42,

    warmth: -0.22,

    sensitivity: -0.22,

    control: 1.18

  }),

  tripleFlanged: makeProfile({

    attack: 0.22,

    brightness: 0.18,

    projection: 0.05,

    sustain: 0.42,

    warmth: 0.18,

    sensitivity: 0.28,

    control: 0.05

  }),

  inwardFlangedControlHoop: makeProfile({

    attack: 0.42,

    brightness: 0.18,

    projection: 0.12,

    sustain: -0.05,

    warmth: 0,

    sensitivity: 0.02,

    control: 0.92

  }),

  gretsch302: makeProfile({

    attack: 0.32,

    brightness: 0.1,

    projection: 0.05,

    sustain: 0.22,

    warmth: 0.22,

    sensitivity: 0.18,

    control: 0.5

  }),

  tamaGroovedHoop: makeProfile({

    attack: 0.42,

    brightness: 0.18,

    projection: 0.1,

    sustain: 0,

    warmth: 0,

    sensitivity: 0.02,

    control: 0.82

  }),

  woodHoop: makeProfile({

    attack: -0.18,

    brightness: -0.38,

    projection: -0.08,

    sustain: 0.58,

    warmth: 0.85,

    sensitivity: 0.18,

    control: 0.28

  }),

  brassHoop: makeProfile({

    attack: 0.32,

    brightness: 0.22,

    projection: 0.1,

    sustain: 0.32,

    warmth: 0.3,

    sensitivity: 0.08,

    control: 0.28

  }),

  vintageFlangedHoop: makeProfile({

    attack: 0.08,

    brightness: 0,

    projection: -0.02,

    sustain: 0.58,

    warmth: 0.28,

    sensitivity: 0.32,

    control: -0.02

  }),

  configurableHoop: makeProfile({}),

  otherHoop: makeProfile({}),

  unknownHoop: makeProfile({})

};

const SNARE_BED_EFFECTS = {

  minimalSnareBed: makeProfile({

    attack: 0.08,

    brightness: 0.04,

    sensitivity: -0.12,

    control: 0.1

  }),

  shallowSnareBed: makeProfile({

    attack: 0.04,

    sensitivity: 0.05,

    control: 0.04

  }),

  mediumSnareBed: makeProfile({

    sensitivity: 0.18,

    control: 0.1

  }),

  measuredMediumSnareBed: makeProfile({

    sensitivity: 0.22,

    control: 0.12

  }),

  deepSnareBed: makeProfile({

    sensitivity: 0.32,

    sustain: -0.08,

    control: 0.16

  }),

  otherSnareBed: makeProfile({}),

  unknownSnareBed: makeProfile({})

};

module.exports = {

  makeProfile,

  COMPONENT_WEIGHTS,

  SHELL_MATERIAL_EFFECTS,

  SHELL_CONSTRUCTION_EFFECTS,

  BEARING_EDGE_EFFECTS,

  HOOP_EFFECTS,

  SNARE_BED_EFFECTS

};

