import { createValidationReport } from '../src/legacyPrint/reports/createValidationReport.js';

import { sampleValidationContext } from '../src/legacyPrint/testFixtures/sampleValidationContext.js';

const report = createValidationReport(

  sampleValidationContext

);

console.log('\nLegacyPrint Validation Report:\n');

console.log(JSON.stringify(report, null, 2));

if (report.engineReady) {

  console.log('\n✅ Validation report generation passed.\n');

} else {

  console.log('\n⚠️ Validation report indicates review needed.\n');

}