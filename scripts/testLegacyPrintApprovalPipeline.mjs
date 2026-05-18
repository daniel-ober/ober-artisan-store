import { runResearchPatchApprovalPipeline } from '../src/legacyPrint/pipelines/runResearchPatchApprovalPipeline.js';

import { sampleApprovalContext } from '../src/legacyPrint/testFixtures/sampleApprovalContext.js';

const result = runResearchPatchApprovalPipeline({

  ...sampleApprovalContext,

  validatorVersion: '1.0.0',

  engineVersion: '0.1.0',

  calibrationProfileId: 'snare_default_v1'

});

console.log('\nLegacyPrint Full Approval Pipeline Result:\n');

console.log(JSON.stringify(result, null, 2));

if (

  result.success &&

  result.validationReport &&

  result.writePackage?.success

) {

  console.log('\n✅ Full approval pipeline passed.\n');

} else {

  console.log('\n⚠️ Full approval pipeline failed.\n');

}