import { createRebuildQueueEntry } from '../src/legacyPrint/rebuild/createRebuildQueueEntry.js';

import { sampleRebuildContext } from '../src/legacyPrint/testFixtures/sampleRebuildContext.js';

const rebuildQueueEntry = createRebuildQueueEntry(

  sampleRebuildContext

);

console.log('\nLegacyPrint Rebuild Queue Entry:\n');

console.log(JSON.stringify(rebuildQueueEntry, null, 2));

if (

  rebuildQueueEntry.status === 'queued' &&

  rebuildQueueEntry.targetDrumReferenceId

) {

  console.log('\n✅ Rebuild queue entry generation passed.\n');

} else {

  console.log('\n⚠️ Rebuild queue entry generation failed.\n');

}