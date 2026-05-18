import { sampleDrumReference } from '../src/legacyPrint/testFixtures/sampleDrumReference.js';

import { validateDrumReference } from '../src/legacyPrint/validators/validateDrumReference.js';

const result = validateDrumReference(sampleDrumReference);

console.log('\nLegacyPrint Validator Test Result:\n');

console.log(JSON.stringify(result, null, 2));

if (result.engineReady) {

  console.log('\n✅ Sample drum reference passed validator.\n');

} else {

  console.log('\n⚠️ Sample drum reference needs review.\n');

}