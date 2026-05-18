export function buildValidationReportWrite({ recordId, validation, nowIso }) {

  return {

    recordId,

    engineReady: Boolean(validation.engineReady),

    needsResearch: Boolean(validation.needsResearch),

    missingRequiredFields: validation.missingRequiredFields || [],

    invalidEnums: validation.invalidEnums || [],

    conflicts: validation.conflicts || [],

    warnings: validation.warnings || [],

    confidenceDowngrades: validation.confidenceDowngrades || [],

    validationVersion: validation.validationVersion || "legacyprint-snare-v1",

    createdAt: nowIso,

  };

}