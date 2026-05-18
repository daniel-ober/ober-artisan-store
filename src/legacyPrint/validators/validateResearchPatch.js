import { APPROVAL_STATUS } from '../enums/approvalEnums.js';

import { VALIDATION_STATUS } from '../enums/validationEnums.js';

import { validateEnum } from './validateEnum.js';

import { validateRequiredFields } from './validateRequiredFields.js';

export const RESEARCH_PATCH_REQUIRED_FIELDS = [

  'id',

  'targetDrumReferenceId',

  'operationType',

  'proposedFields',

  'validatorStatus',

  'approvalStatus',

  'submittedBy',

  'submittedAt'

];

export const RESEARCH_PATCH_OPERATION_TYPES = [

  'create',

  'update',

  'merge',

  'deprecate'

];

export const INGESTION_METHODS = [

  'manual',

  'bulkImport',

  'aiAssisted',

  'scraped',

  'migration'

];

export function validateResearchPatch(researchPatch = {}) {

  const missingRequiredFields = validateRequiredFields(

    researchPatch,

    RESEARCH_PATCH_REQUIRED_FIELDS

  );

  const enumChecks = [

    validateEnum({

      fieldPath: 'operationType',

      value: researchPatch.operationType,

      allowedValues: RESEARCH_PATCH_OPERATION_TYPES

    }),

    validateEnum({

      fieldPath: 'validatorStatus',

      value: researchPatch.validatorStatus,

      allowedValues: VALIDATION_STATUS

    }),

    validateEnum({

      fieldPath: 'approvalStatus',

      value: researchPatch.approvalStatus,

      allowedValues: APPROVAL_STATUS

    }),

    validateEnum({

      fieldPath: 'ingestionMetadata.ingestionMethod',

      value: researchPatch?.ingestionMetadata?.ingestionMethod,

      allowedValues: INGESTION_METHODS

    })

  ].filter(Boolean);

  const invalidEnums = enumChecks.map((check) => check.message);

  const warnings = [];

  if (

    researchPatch.operationType !== 'deprecate' &&

    Object.keys(researchPatch.proposedFields || {}).length === 0

  ) {

    warnings.push('EMPTY_PATCH: researchPatch has no proposedFields.');

  }

  if (

    researchPatch?.ingestionMetadata?.aiAssisted === true &&

    !researchPatch?.ingestionMetadata?.extractionConfidence

  ) {

    warnings.push('AI_CONFIDENCE_MISSING: aiAssisted patch should include extractionConfidence.');

  }

  const engineReady =

    missingRequiredFields.length === 0 &&

    invalidEnums.length === 0;

  return {

    engineReady,

    needsResearch: !engineReady,

    missingRequiredFields,

    invalidEnums,

    conflicts: [],

    warnings,

    confidenceDowngrades: []

  };

}