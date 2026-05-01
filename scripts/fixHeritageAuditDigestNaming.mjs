
import fs from 'fs';

const file = 'scripts/auditHeritageVoiceReads.mjs';

let text = fs.readFileSync(file, 'utf8');

text = text.replaceAll(

  `threeCardDigestId: relationships[0]?.id || '',`,

  `topRelationshipId: relationships[0]?.id || '',`

);

text = text.replaceAll(

  `threeCardDigestTitle: relationships[0]?.title || '',`,

  `topRelationshipTitle: relationships[0]?.title || '',`

);

text = text.replaceAll(

  `a.threeCardDigestId === b.threeCardDigestId`,

  `a.topRelationshipId === b.topRelationshipId`

);

text = text.replaceAll(

  `threeCardDigest: a.threeCardDigestTitle,`,

  `topRelationship: a.topRelationshipTitle,`

);

text = text.replaceAll(

  `from.threeCardDigestTitle`,

  `from.topRelationshipTitle`

);

text = text.replaceAll(

  `to.threeCardDigestTitle`,

  `to.topRelationshipTitle`

);

text = text.replaceAll(

  `from.threeCardDigestId !== to.threeCardDigestId`,

  `from.topRelationshipId !== to.topRelationshipId`

);

text = text.replaceAll(

  `const relationshipCounts = countBy(cases, (item) => item.threeCardDigestTitle);`,

  `const relationshipCounts = countBy(cases, (item) => item.topRelationshipTitle);`

);

text = text.replaceAll(

  `threeCardDigestCounts: relationshipCounts,`,

  `topRelationshipCounts: relationshipCounts,`

);

text = text.replaceAll(

  `threeCardDigestCounts: digestCounts,`,

  `threeCardDigestCounts: digestCounts,`

);

text = text.replaceAll(

  `threeCardDigest: item.threeCardDigest || '',`,

  `topRelationship: item.topRelationship || '',`

);

text = text.replaceAll(

  `'same-three-card-digest-despite-large-profile-movement'`,

  `'same-top-read-despite-large-profile-movement'`

);

fs.writeFileSync(file, text);

console.log('✅ Fixed audit naming: topRelationship is now separate from full three-card digest.');

