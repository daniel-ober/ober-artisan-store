export const sampleResearchPatch = {

  id: 'patch_tama_starphonic_brass_shell_thickness_sample',

  targetDrumReferenceId: 'tama_starphonic_brass_14x6_metal-brass_sample',

  operationType: 'update',

  proposedFields: {

    'shell.shellThicknessMm': 1.2,

    'referenceLayer.sourceConfidence': 'high'

  },

  removedFields: [],

  proposedSources: [

    'src_tama_sample'

  ],

  evidenceAttachmentIds: [],

  ingestionMetadata: {

    ingestionMethod: 'manual',

    ingestionToolVersion: '0.1.0',

    aiAssisted: false,

    extractionConfidence: 'high'

  },

  validatorStatus: 'pending',

  approvalStatus: 'draft',

  submittedBy: 'admin',

  submittedAt: null

};