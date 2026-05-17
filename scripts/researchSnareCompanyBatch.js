// scripts/researchSnareCompanyBatch.js

const fs = require('fs');

const path = require('path');

const companyArg = process.argv.slice(2).join(' ').trim();

if (!companyArg) {

  console.error('\nUsage: node scripts/researchSnareCompanyBatch.js "Tama"\n');

  process.exit(1);

}

const safeCompany = companyArg

  .toLowerCase()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-+|-+$/g, '');

const batchPath = path.resolve(

  __dirname,

  `../snareAuditBatches/${safeCompany}-missing-fields-batch.json`

);

const outputDir = path.resolve(__dirname, '../snareCompanyResearchPlans');

if (!fs.existsSync(batchPath)) {

  console.error(`Missing company batch file: ${batchPath}`);

  console.error(`Run this first: node scripts/buildSnareAuditBatch.js "${companyArg}"`);

  process.exit(1);

}

const batch = require(batchPath);

const groupByLine = batch.drums.reduce((acc, drum) => {

  const line = drum.lineSeries || 'Unknown Line';

  if (!acc[line]) acc[line] = [];

  acc[line].push(drum);

  return acc;

}, {});

const linePlans = Object.entries(groupByLine)

  .sort((a, b) => b[1].length - a[1].length)

  .map(([lineSeries, drums]) => {

    const fieldFrequency = drums.reduce((acc, drum) => {

      (drum.missingFields || []).forEach((field) => {

        acc[field.key] = (acc[field.key] || 0) + 1;

      });

      return acc;

    }, {});

    return {

      companyName: batch.companyName,

      lineSeries,

      drumCount: drums.length,

      totalMissingFields: drums.reduce(

        (sum, drum) => sum + Number(drum.missingCount || 0),

        0

      ),

      fieldFrequency,

      suggestedResearchStrategy: [

        'Research this line/series as a group first.',

        'Fill shared values only when they are source-backed across the line.',

        'Do not assume specs across eras unless source confirms same construction/spec package.',

        'Use individual model updates only for exceptions after shared line-level facts are confirmed.',

      ],

      drums: drums

        .slice()

        .sort((a, b) => {

          const modelCompare = String(a.modelName || '').localeCompare(

            String(b.modelName || '')

          );

          if (modelCompare !== 0) return modelCompare;

          return Number(a.depth || 0) - Number(b.depth || 0);

        }),

    };

  });

const plan = {

  companyName: batch.companyName,

  generatedAt: new Date().toISOString(),

  sourceBatchPath: batchPath,

  totalDrums: batch.totalDrums,

  totalMissingFields: batch.totalMissingFields,

  companyFieldFrequency: batch.fieldFrequency,

  workflow: {

    step1: 'Group missing data by company and line/series.',

    step2: 'Research one line/series at a time using official/catalog/reputable sources.',

    step3: 'Create a reviewed update patch for shared specs first.',

    step4: 'Apply Firestore updates only after review.',

  },

  linePlans,

};

fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, `${safeCompany}-company-research-plan.json`);

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);

console.log('\nCompany research plan created');

console.log('Company:', plan.companyName);

console.log('Output:', outputPath);

console.log('Total drums:', plan.totalDrums);

console.log('Total missing fields:', plan.totalMissingFields);

console.log('\nLine / series groups:');

linePlans.forEach((line, index) => {

  console.log(

    `${index + 1}. ${line.lineSeries} — ${line.drumCount} drums, ${line.totalMissingFields} missing fields`

  );

  Object.entries(line.fieldFrequency)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 8)

    .forEach(([field, count]) => {

      console.log(`   - ${field}: ${count}`);

    });

});