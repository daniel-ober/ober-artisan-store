// computeVoiceProfile.js

import { computeBareShellProfile } from './computeBareShellProfile.js';

import { computeStockConfigProfile } from './computeStockConfigProfile.js';

import { computeModifiedConfigProfile } from './computeModifiedConfigProfile.js';

import { resolveVoiceConfidence } from './confidenceResolver.js';

export function computeVoiceProfile(snareRecord, options = {}) {

  const bareShell = computeBareShellProfile(snareRecord);

  const stockConfig = computeStockConfigProfile(snareRecord, bareShell);

  const modifiedConfig = computeModifiedConfigProfile(

    snareRecord,

    stockConfig,

    options.modifiedConfig

  );

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