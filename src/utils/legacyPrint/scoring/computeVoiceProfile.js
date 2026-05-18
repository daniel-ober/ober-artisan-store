// computeVoiceProfile.js

import { computeBareShellProfile } from './computeBareShellProfile';

import { computeStockConfigProfile } from './computeStockConfigProfile';

import { computeModifiedConfigProfile } from './computeModifiedConfigProfile';

import { resolveVoiceConfidence } from './confidenceResolver';

export function computeVoiceProfile(snareRecord, options = {}) {

  const bareShell = computeBareShellProfile(snareRecord);

  const stockConfig = computeStockConfigProfile(snareRecord, bareShell);

  const modifiedConfig = computeModifiedConfigProfile(snareRecord, stockConfig, options.modifiedConfig);

  return {

    schemaVersion: 'legacyprint-voice-profile-v1',

    snareReferenceId: snareRecord.id,

    generatedAt: new Date().toISOString(),

    sourceSchemaVersion: snareRecord.schemaVersion || null,

    bareShell,

    stockConfig,

    modifiedConfig,

    confidence: resolveVoiceConfidence(snareRecord, {

      bareShell,

      stockConfig,

      modifiedConfig,

    }),

  };

}