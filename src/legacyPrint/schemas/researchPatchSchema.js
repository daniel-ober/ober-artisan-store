export const researchPatchSchema = {

  id: 'string',

  targetDrumReferenceId: 'string',

  operationType: 'string',

  proposedFields: {

    type: 'map'

  },

  removedFields: ['string'],

  proposedSources: ['string'],

  evidenceAttachmentIds: ['string'],

  ingestionMetadata: {

    ingestionMethod: 'string',

    ingestionToolVersion: 'string',

    aiAssisted: 'boolean',

    extractionConfidence: 'string'

  },

  validatorStatus: 'string',

  approvalStatus: 'string',

  submittedBy: 'string',

  submittedAt: 'timestamp'

};