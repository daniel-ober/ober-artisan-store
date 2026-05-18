import { applyResearchPatch } from '../patches/applyResearchPatch.js';

import { validateResearchPatch } from '../validators/validateResearchPatch.js';

import { validateDrumReference } from '../validators/validateDrumReference.js';

import { createAuditLogEntry } from '../audit/createAuditLogEntry.js';

export function approveResearchPatch({

  baseDocument,

  researchPatch,

  performedBy = 'system',

  reason = 'Approved research patch'

}) {

  const patchValidation = validateResearchPatch(researchPatch);

  if (!patchValidation.engineReady) {

    return {

      success: false,

      stage: 'patchValidation',

      validation: patchValidation

    };

  }

const patchedDocument = applyResearchPatch(

  baseDocument,

  researchPatch

);

const updatedValidation =

  validateDrumReference(patchedDocument);

const updatedDocument = {

  ...patchedDocument,

  engineReady: updatedValidation.engineReady,

  missingFields: updatedValidation.missingRequiredFields,

  updatedAt: new Date().toISOString()

};

  if (!updatedValidation.engineReady) {

    return {

      success: false,

      stage: 'updatedDocumentValidation',

      validation: updatedValidation,

      updatedDocument

    };

  }

  const auditLogEntry = createAuditLogEntry({

    actionType: 'approveResearchPatch',

    targetCollection: 'legacyPrintDrumReferences',

    targetDocumentId: baseDocument.id,

    previousDocument: baseDocument,

    updatedDocument,

    performedBy,

    reason

  });

  return {

    success: true,

    updatedDocument,

    validation: updatedValidation,

    auditLogEntry

  };

}