// scripts/legacyPrintReferenceImport/normalizeReferenceDrums.mjs

import { buildReferenceId } from './referenceDrumSourceSchema.mjs';

const cleanString = (value = '') => {

  return String(value || '').trim();

};

const cleanStringArray = (items = []) => {

  if (!Array.isArray(items)) return [];

  return items.map(cleanString).filter(Boolean);

};

export const normalizeReferenceDrumRecord = (raw = {}) => {

  const normalized = {

    id:

      cleanString(raw.id) ||

      buildReferenceId({

        companyName: raw.companyName,

        lineName: raw.lineName,

        modelName: raw.modelName,

        drumType: raw.drumType,

        shellConstruction: raw.shellConstruction,

        shellMaterial: raw.shellMaterial,

      }),

    companyType: cleanString(raw.companyType),

    companyName: cleanString(raw.companyName),

    lineName: cleanString(raw.lineName),

    modelName: cleanString(raw.modelName),

    drumType: cleanString(raw.drumType || 'Snare'),

    sizes: cleanStringArray(raw.sizes),

    shellConstruction: cleanString(raw.shellConstruction),

    shellMaterial: cleanString(raw.shellMaterial),

    shellThickness: cleanString(raw.shellThickness),

    plyCount: cleanString(raw.plyCount),

    reinforcementRings: cleanString(raw.reinforcementRings),

    hoopType: cleanString(raw.hoopType),

    bearingEdge: cleanString(raw.bearingEdge),

    snareWires: cleanString(raw.snareWires),

    batterHead: cleanString(raw.batterHead),

    resoHead: cleanString(raw.resoHead),

    finishTreatment: cleanString(raw.finishTreatment),

    era: cleanString(raw.era),

    sourceUrls: cleanStringArray(raw.sourceUrls),

    confidence: cleanString(raw.confidence || 'Needs Verification'),

    notes: cleanString(raw.notes),

  };

  return normalized;

};

export const normalizeReferenceDrumRecords = (records = []) => {

  return records.map(normalizeReferenceDrumRecord);

};