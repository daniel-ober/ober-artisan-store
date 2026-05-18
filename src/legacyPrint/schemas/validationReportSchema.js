export const validationReportSchema = {

  id: 'string',

  drumReferenceId: 'string',

  validatorVersion: 'string',

  engineReady: 'boolean',

  missingRequiredFields: ['string'],

  invalidEnums: ['string'],

  conflicts: ['string'],

  warnings: ['string'],

  confidenceDowngrades: ['string'],

  validatedAt: 'timestamp'

};