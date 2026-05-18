import { approveResearchPatch } from '../src/legacyPrint/workflows/approveResearchPatch.js';

import { createApprovalWritePackage } from '../src/legacyPrint/firestore/createApprovalWritePackage.js';

import { sampleApprovalContext } from '../src/legacyPrint/testFixtures/sampleApprovalContext.js';

const approvalResult = approveResearchPatch(

  sampleApprovalContext

);

const writePackage = createApprovalWritePackage(

  approvalResult

);

console.log('\nLegacyPrint Approval Write Package:\n');

console.log(JSON.stringify(writePackage, null, 2));

if (

  writePackage.success &&

  writePackage.writes.length === 3

) {

  console.log('\n✅ Approval write package generation passed.\n');

} else {

  console.log('\n⚠️ Approval write package generation failed.\n');

}