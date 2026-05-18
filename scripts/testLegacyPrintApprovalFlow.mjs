import { approveResearchPatch } from '../src/legacyPrint/workflows/approveResearchPatch.js';

import { sampleApprovalContext } from '../src/legacyPrint/testFixtures/sampleApprovalContext.js';

const result = approveResearchPatch(

  sampleApprovalContext

);

console.log('\nLegacyPrint Approval Flow Result:\n');

console.log(JSON.stringify(result, null, 2));

if (result.success) {

  console.log('\n✅ Approval workflow passed.\n');

} else {

  console.log('\n⚠️ Approval workflow failed.\n');

}