import { sampleDrumReference } from './sampleDrumReference.js';

import { validateDrumReference } from '../validators/validateDrumReference.js';

const validationResult =

  validateDrumReference(sampleDrumReference);

export const sampleValidationContext = {

  drumReferenceId: sampleDrumReference.id,

  validatorVersion: '1.0.0',

  validationResult

};