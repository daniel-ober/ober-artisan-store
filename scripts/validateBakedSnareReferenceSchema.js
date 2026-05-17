// scripts/validateBakedSnareReferenceSchema.js

const fs = require('fs');

const INPUT_PATH =

  process.argv[2] ||

  'data/firestoreExports/snareReferenceDrums-normalized-full-preview.json';

const rows = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

const issues = [];

const isUnknown = (value) =>

  value === null ||

  value === undefined ||

  value === '' ||

  value === 'unknown' ||

  value === 'researchRequired';

for (const row of rows) {

  const id = row.id || 'missing-id';

  if (!row.schemaVersion) issues.push({ id, issue: 'missing schemaVersion' });

  if (isUnknown(row.companyName)) issues.push({ id, issue: 'missing companyName' });

  if (isUnknown(row.lineSeries)) issues.push({ id, issue: 'missing lineSeries' });

  if (isUnknown(row.modelName)) issues.push({ id, issue: 'missing modelName' });

  if (isUnknown(row.patchName)) issues.push({ id, issue: 'missing patchName' });

  if (!row.shell?.dimensions?.diameterInches) {

    issues.push({ id, issue: 'missing diameterInches' });

  }

  if (!row.shell?.dimensions?.depthInches) {

    issues.push({ id, issue: 'missing depthInches' });

  }

if (

  row.shell?.construction?.shellMaterialPrimary === null ||

  row.shell?.construction?.shellMaterialPrimary === undefined ||

  row.shell?.construction?.shellMaterialPrimary === ''

) {

  issues.push({ id, issue: 'missing shellMaterialPrimary' });

}

  if (!Array.isArray(row.snareFacts) || row.snareFacts.length !== 3) {

    issues.push({ id, issue: 'snareFacts must contain exactly 3 entries' });

  }

  if (row.oberScores) issues.push({ id, issue: 'old oberScores field still present' });

  if (row.tuning) issues.push({ id, issue: 'old tuning field still present' });

  const imageUrls = row.sources?.imageUrls || [];

  for (const image of imageUrls) {

    if (!image.url || image.url === 'direct-working-image-url-only') {

      issues.push({ id, issue: 'invalid image url placeholder' });

    }

    if (

      image.url &&

      !/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(image.url) &&

      image.url !== 'directImageUrlResearchRequired'

    ) {

      issues.push({ id, issue: `image URL may not be direct asset: ${image.url}` });

    }

  }

}

const report = {

  input: INPUT_PATH,

  totalDocs: rows.length,

  issueCount: issues.length,

  issues,

};

fs.mkdirSync('data/snareResearchAudits', { recursive: true });

fs.writeFileSync(

  'data/snareResearchAudits/baked-schema-validation-report.json',

  JSON.stringify(report, null, 2)

);

console.log(JSON.stringify({

  input: report.input,

  totalDocs: report.totalDocs,

  issueCount: report.issueCount,

  reportPath: 'data/snareResearchAudits/baked-schema-validation-report.json',

}, null, 2));