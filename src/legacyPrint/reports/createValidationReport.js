export function createValidationReport({

  drumReferenceId,

  validatorVersion,

  validationResult

}) {

  return {

    id: `validation_${Date.now()}`,

    drumReferenceId,

    validatorVersion,

    engineReady: validationResult.engineReady,

    missingRequiredFields:

      validationResult.missingRequiredFields || [],

    invalidEnums:

      validationResult.invalidEnums || [],

    conflicts:

      validationResult.conflicts || [],

    warnings:

      validationResult.warnings || [],

    confidenceDowngrades:

      validationResult.confidenceDowngrades || [],

    validatedAt: new Date().toISOString()

  };

}