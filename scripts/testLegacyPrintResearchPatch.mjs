import { sampleDrumReference } from '../src/legacyPrint/testFixtures/sampleDrumReference.js';

import { sampleResearchPatch } from '../src/legacyPrint/testFixtures/sampleResearchPatch.js';

import { validateResearchPatch } from '../src/legacyPrint/validators/validateResearchPatch.js';

import { validateDrumReference } from '../src/legacyPrint/validators/validateDrumReference.js';

import { applyResearchPatch } from '../src/legacyPrint/patches/applyResearchPatch.js';

const patchValidation = validateResearchPatch(sampleResearchPatch);

const patchedDocument = applyResearchPatch(sampleDrumReference, sampleResearchPatch);

const patchedDrumValidation = validateDrumReference(patchedDocument);

console.log('\nLegacyPrint Research Patch Validation:\n');

console.log(JSON.stringify(patchValidation, null, 2));

console.log('\nLegacyPrint Patched Drum Validation:\n');

console.log(JSON.stringify(patchedDrumValidation, null, 2));

if (patchValidation.engineReady && patchedDrumValidation.engineReady) {

  console.log('\n✅ Research patch and patched drum reference passed validation.\n');

} else {

  console.log('\n⚠️ Research patch or patched drum reference needs review.\n');

}