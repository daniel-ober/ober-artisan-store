
import fs from 'fs';

const file = 'scripts/auditHeritageVoiceReads.mjs';

let text = fs.readFileSync(file, 'utf8');

text = text.replace(

  /same-top-read-despite-large-profile-movement/g,

  'same-three-card-digest-despite-large-profile-movement'

);

text = text.replace(

  /topRelationship/g,

  'threeCardDigest'

);

text = text.replace(

  /caseA\.relationships\?\.\[0\]\?\.title\s*===\s*caseB\.relationships\?\.\[0\]\?\.title/g,

  'caseA.digest === caseB.digest'

);

text = text.replace(

  /caseA\.topRelationship\s*===\s*caseB\.topRelationship/g,

  'caseA.digest === caseB.digest'

);

fs.writeFileSync(file, text);

console.log('✅ Patched audit to judge repeated reads by full three-card digest instead of only First Hit/top relationship.');

