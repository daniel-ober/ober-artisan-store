// src/data/legacyPrint/snareReferenceDrums/schema.js

/**

 * Ober LegacyPrint™ Snare Reference Database

 * Phase 1: Core shell acoustics schema

 *

 * This schema is intentionally shell-first.

 * Hardware, hoops, heads, wires, and modified/user configs are later phases.

 *

 * Rules:

 * - Unknown string values use "unknown"

 * - Unknown numeric values use null

 * - Unknown boolean values use false unless the field means "confirmed present"

 * - Do not infer hype, price, rarity, artist association, or prestige into shell voice data

 */

export const UNKNOWN_STRING = 'unknown';

export const SNARE_BED_DEPTH_VALUES = [

  'none',

  'shallow',

  'medium',

  'deep',

  'unknown',

];

export const SHELL_FINISH_TYPE_VALUES = [

  'gloss',

  'satin',

  'matte',

  'natural',

  'lacquer',

  'wrap',

  'oil',

  'wax',

  'unknown',

];

export const BEARING_EDGE_OUTER_ROUNDOVER_VALUES = [

  'none',

  'slight',

  'medium',

  'full',

  'unknown',

];

export const GRAIN_ORIENTATION_VALUES = [

  'vertical',

  'horizontal',

  'cross-laminated',

  'hybrid',

  'unknown',

];

export const VENTING_TYPE_VALUES = [

  'standard',

  'multi-vent',

  'open-air',

  'unknown',

];

export const SHELL_CORE_REQUIRED_FIELDS = {

  company: 'string',

  lineSeries: 'string',

  modelName: 'string',

  diameter: 'number|null',

  depth: 'number|null',

  shellConstruction: 'string',

  shellMaterialPrimary: 'string',

  shellMaterialSecondary: 'string',

  shellMaterialTertiary: 'string',

  plyCountLayup: 'string',

  shellThicknessMm: 'number|null',

  bearingEdgeType: 'string',

  bearingEdgeInnerAngle: 'number|null',

  bearingEdgeOuterRoundover: 'enum',

  snareBeds: 'boolean',

  snareBedDepth: 'enum',

  reinforcementRings: 'boolean',

  reinforcementRingMaterial: 'string',

  reinforcementRingThicknessMm: 'number|null',

  shellFinishType: 'enum',

  shellFinishInterior: 'string',

  shellFinishExterior: 'string',

  grainOrientation: 'enum',

  shellOrientationNotes: 'string',

  ventingType: 'enum',

  ventHoleCount: 'number|null',

  shellHardwareMountType: 'string',

  lugMountStyle: 'string',

  roundedShellOvertones: 'string',

  knownConstructionNotes: 'string',

  allStockCaptured: 'boolean',

};

export const SHELL_CORE_ENUMS = {

  snareBedDepth: SNARE_BED_DEPTH_VALUES,

  shellFinishType: SHELL_FINISH_TYPE_VALUES,

  bearingEdgeOuterRoundover: BEARING_EDGE_OUTER_ROUNDOVER_VALUES,

  grainOrientation: GRAIN_ORIENTATION_VALUES,

  ventingType: VENTING_TYPE_VALUES,

};

export const createDefaultShellCoreRecord = (overrides = {}) => ({

  company: UNKNOWN_STRING,

  lineSeries: UNKNOWN_STRING,

  modelName: UNKNOWN_STRING,

  diameter: null,

  depth: null,

  shellConstruction: UNKNOWN_STRING,

  shellMaterialPrimary: UNKNOWN_STRING,

  shellMaterialSecondary: UNKNOWN_STRING,

  shellMaterialTertiary: UNKNOWN_STRING,

  plyCountLayup: UNKNOWN_STRING,

  shellThicknessMm: null,

  bearingEdgeType: UNKNOWN_STRING,

  bearingEdgeInnerAngle: null,

  bearingEdgeOuterRoundover: UNKNOWN_STRING,

  snareBeds: false,

  snareBedDepth: UNKNOWN_STRING,

  reinforcementRings: false,

  reinforcementRingMaterial: UNKNOWN_STRING,

  reinforcementRingThicknessMm: null,

  shellFinishType: UNKNOWN_STRING,

  shellFinishInterior: UNKNOWN_STRING,

  shellFinishExterior: UNKNOWN_STRING,

  grainOrientation: UNKNOWN_STRING,

  shellOrientationNotes: UNKNOWN_STRING,

  ventingType: UNKNOWN_STRING,

  ventHoleCount: null,

  shellHardwareMountType: UNKNOWN_STRING,

  lugMountStyle: UNKNOWN_STRING,

  roundedShellOvertones: UNKNOWN_STRING,

  knownConstructionNotes: UNKNOWN_STRING,

  allStockCaptured: false,

  ...overrides,

});

export const LEGACY_FIELD_MAP = {

  companyName: 'company',

  'shell.thicknessMm': 'shellThicknessMm',

  'shell.plyCountLayup': 'plyCountLayup',

  'shell.bearingEdge': 'bearingEdgeType',

  'shell.reinforcementRings': 'reinforcementRings',

  'shell.snareBedType': 'snareBedDepth',

};

export const PHASE_1_SHELL_PRIORITY_FIELDS = [

  'shellConstruction',

  'shellMaterialPrimary',

  'shellMaterialSecondary',

  'shellMaterialTertiary',

  'plyCountLayup',

  'shellThicknessMm',

  'diameter',

  'depth',

  'bearingEdgeType',

  'bearingEdgeInnerAngle',

  'bearingEdgeOuterRoundover',

  'reinforcementRings',

  'reinforcementRingMaterial',

  'reinforcementRingThicknessMm',

  'snareBeds',

  'snareBedDepth',

  'shellFinishType',

  'shellFinishInterior',

  'shellFinishExterior',

  'grainOrientation',

  'ventingType',

  'ventHoleCount',

  'shellHardwareMountType',

  'lugMountStyle',

];