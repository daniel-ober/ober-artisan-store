
// src/data/legacyPrint/snareReferenceDrums/normalization.js

import {

  BEARING_EDGE_OUTER_ROUNDOVER_VALUES,

  GRAIN_ORIENTATION_VALUES,

  SHELL_FINISH_TYPE_VALUES,

  SNARE_BED_DEPTH_VALUES,

  UNKNOWN_STRING,

  VENTING_TYPE_VALUES,

} from './schema';

export const normalizeString = (value, fallback = UNKNOWN_STRING) => {

  if (value === null || value === undefined) return fallback;

  const normalized = String(value).trim();

  if (!normalized.length) return fallback;

  return normalized;

};

export const normalizeLowerString = (value, fallback = UNKNOWN_STRING) => {

  return normalizeString(value, fallback).toLowerCase();

};

export const normalizeNumberOrNull = (value) => {

  if (value === null || value === undefined || value === '') return null;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return null;

  return numberValue;

};

export const normalizeBoolean = (value, fallback = false) => {

  if (typeof value === 'boolean') return value;

  if (value === null || value === undefined || value === '') return fallback;

  const normalized = String(value).trim().toLowerCase();

  if (['true', 'yes', 'y', '1', 'present', 'confirmed'].includes(normalized)) {

    return true;

  }

  if (['false', 'no', 'n', '0', 'none', 'absent', 'unknown'].includes(normalized)) {

    return false;

  }

  return fallback;

};

export const normalizeEnum = (value, allowedValues, fallback = UNKNOWN_STRING) => {

  const normalized = normalizeLowerString(value, fallback);

  if (allowedValues.includes(normalized)) return normalized;

  return fallback;

};

export const normalizeSnareBedDepth = (value) => {

  const normalized = normalizeLowerString(value);

  if (normalized.includes('none') || normalized === 'no') return 'none';

  if (normalized.includes('shallow')) return 'shallow';

  if (normalized.includes('medium')) return 'medium';

  if (normalized.includes('deep')) return 'deep';

  if (normalized.includes('snappy bed')) return 'medium';

  return normalizeEnum(normalized, SNARE_BED_DEPTH_VALUES);

};

export const normalizeShellFinishType = (value) => {

  const normalized = normalizeLowerString(value);

  if (normalized.includes('gloss')) return 'gloss';

  if (normalized.includes('satin')) return 'satin';

  if (normalized.includes('matte')) return 'matte';

  if (normalized.includes('natural')) return 'natural';

  if (normalized.includes('lacquer')) return 'lacquer';

  if (normalized.includes('wrap')) return 'wrap';

  if (normalized.includes('oil')) return 'oil';

  if (normalized.includes('wax')) return 'wax';

  return normalizeEnum(normalized, SHELL_FINISH_TYPE_VALUES);

};

export const normalizeBearingEdgeOuterRoundover = (value) => {

  const normalized = normalizeLowerString(value);

  if (normalized.includes('none') || normalized.includes('sharp')) return 'none';

  if (normalized.includes('slight')) return 'slight';

  if (normalized.includes('medium')) return 'medium';

  if (normalized.includes('full') || normalized.includes('roundover')) return 'full';

  return normalizeEnum(normalized, BEARING_EDGE_OUTER_ROUNDOVER_VALUES);

};

export const normalizeGrainOrientation = (value) => {

  const normalized = normalizeLowerString(value);

  if (normalized.includes('vertical')) return 'vertical';

  if (normalized.includes('horizontal')) return 'horizontal';

  if (normalized.includes('cross')) return 'cross-laminated';

  if (normalized.includes('hybrid')) return 'hybrid';

  return normalizeEnum(normalized, GRAIN_ORIENTATION_VALUES);

};

export const normalizeVentingType = (value, ventHoleCount = null) => {

  const normalized = normalizeLowerString(value);

  const count = normalizeNumberOrNull(ventHoleCount);

  if (normalized.includes('open')) return 'open-air';

  if (normalized.includes('multi')) return 'multi-vent';

  if (count && count > 1) return 'multi-vent';

  if (normalized.includes('standard')) return 'standard';

  if (count === 1) return 'standard';

  return normalizeEnum(normalized, VENTING_TYPE_VALUES);

};

export const normalizeReinforcementRings = (value) => {

  return normalizeBoolean(value, false);

};

export const normalizeSnareBeds = (value) => {

  return normalizeBoolean(value, false);

};

export const normalizeShellCoreRecord = (record = {}) => {

  const snareBedDepth = normalizeSnareBedDepth(record.snareBedDepth);

  const ventHoleCount = normalizeNumberOrNull(record.ventHoleCount);

  return {

    company: normalizeString(record.company),

    lineSeries: normalizeString(record.lineSeries),

    modelName: normalizeString(record.modelName),

    diameter: normalizeNumberOrNull(record.diameter),

    depth: normalizeNumberOrNull(record.depth),

    shellConstruction: normalizeString(record.shellConstruction),

    shellMaterialPrimary: normalizeString(record.shellMaterialPrimary),

    shellMaterialSecondary: normalizeString(record.shellMaterialSecondary),

    shellMaterialTertiary: normalizeString(record.shellMaterialTertiary),

    plyCountLayup: normalizeString(record.plyCountLayup),

    shellThicknessMm: normalizeNumberOrNull(record.shellThicknessMm),

    bearingEdgeType: normalizeString(record.bearingEdgeType),

    bearingEdgeInnerAngle: normalizeNumberOrNull(record.bearingEdgeInnerAngle),

    bearingEdgeOuterRoundover: normalizeBearingEdgeOuterRoundover(

      record.bearingEdgeOuterRoundover

    ),

    snareBeds: snareBedDepth !== 'none' && snareBedDepth !== 'unknown'

      ? true

      : normalizeSnareBeds(record.snareBeds),

    snareBedDepth,

    reinforcementRings: normalizeReinforcementRings(record.reinforcementRings),

    reinforcementRingMaterial: normalizeString(record.reinforcementRingMaterial),

    reinforcementRingThicknessMm: normalizeNumberOrNull(

      record.reinforcementRingThicknessMm

    ),

    shellFinishType: normalizeShellFinishType(record.shellFinishType),

    shellFinishInterior: normalizeString(record.shellFinishInterior),

    shellFinishExterior: normalizeString(record.shellFinishExterior),

    grainOrientation: normalizeGrainOrientation(record.grainOrientation),

    shellOrientationNotes: normalizeString(record.shellOrientationNotes),

    ventingType: normalizeVentingType(record.ventingType, ventHoleCount),

    ventHoleCount,

    shellHardwareMountType: normalizeString(record.shellHardwareMountType),

    lugMountStyle: normalizeString(record.lugMountStyle),

    roundedShellOvertones: normalizeString(record.roundedShellOvertones),

    knownConstructionNotes: normalizeString(record.knownConstructionNotes),

    allStockCaptured: normalizeBoolean(record.allStockCaptured, false),

  };

};

export const mapLegacySnareReferenceToShellCore = (legacyRecord = {}) => {

  const shell = legacyRecord.shell || {};

  return normalizeShellCoreRecord({

    company: legacyRecord.company || legacyRecord.companyName,

    lineSeries: legacyRecord.lineSeries,

    modelName: legacyRecord.modelName,

    diameter: legacyRecord.diameter,

    depth: legacyRecord.depth,

    shellConstruction: shell.construction || legacyRecord.shellConstruction,

    shellMaterialPrimary: shell.materialPrimary || legacyRecord.shellMaterialPrimary,

    shellMaterialSecondary: shell.materialSecondary || legacyRecord.shellMaterialSecondary,

    shellMaterialTertiary: shell.materialTertiary || legacyRecord.shellMaterialTertiary,

    plyCountLayup: shell.plyCountLayup,

    shellThicknessMm: shell.thicknessMm,

    bearingEdgeType: shell.bearingEdge,

    bearingEdgeInnerAngle: shell.bearingEdgeInnerAngle,

    bearingEdgeOuterRoundover: shell.bearingEdgeOuterRoundover,

    snareBeds: shell.snareBeds,

    snareBedDepth: shell.snareBedDepth || shell.snareBedType,

    reinforcementRings: shell.reinforcementRings,

    reinforcementRingMaterial: shell.reinforcementRingMaterial,

    reinforcementRingThicknessMm: shell.reinforcementRingThicknessMm,

    shellFinishType: shell.finishType || legacyRecord.finishType,

    shellFinishInterior: shell.finishInterior,

    shellFinishExterior: shell.finishExterior || legacyRecord.finish,

    grainOrientation: shell.grainOrientation,

    shellOrientationNotes: shell.shellOrientationNotes,

    ventingType: shell.ventingType,

    ventHoleCount: shell.ventHoleCount,

    shellHardwareMountType: shell.shellHardwareMountType,

    lugMountStyle: shell.lugMountStyle,

    roundedShellOvertones: shell.roundedShellOvertones,

    knownConstructionNotes: shell.knownConstructionNotes,

    allStockCaptured: Boolean(legacyRecord.allStockCaptured),

  });

};

