// scripts/buildSnareAuditBatch.js

const fs = require('fs');

const path = require('path');

const REPORT_PATH = path.resolve(__dirname, '../missingSnareReferenceFieldsReport.json');

const OUTPUT_DIR = path.resolve(__dirname, '../snareAuditBatches');

const normalizeCompanyArg = (value = '') =>

  String(value)

    .trim()

    .toLowerCase()

    .replace(/\s+/g, ' ');

const companyArg = process.argv.slice(2).join(' ').trim();

if (!companyArg) {

  console.error('\nUsage: node scripts/buildSnareAuditBatch.js "Tama"\n');

  process.exit(1);

}

if (!fs.existsSync(REPORT_PATH)) {

  console.error(`Missing report file: ${REPORT_PATH}`);

  console.error('Run: node scripts/auditSnareReferenceMissingFields.js');

  process.exit(1);

}

const report = require(REPORT_PATH);

if (!Array.isArray(report)) {

  console.error('Expected missingSnareReferenceFieldsReport.json to be an array.');

  process.exit(1);

}

const wanted = normalizeCompanyArg(companyArg);

const matches = report.filter((item) => {

  return normalizeCompanyArg(item.companyName) === wanted;

});

if (!matches.length) {

  const companies = [...new Set(report.map((item) => item.companyName))]

    .filter(Boolean)

    .sort();

  console.error(`No drums found for company: ${companyArg}`);

  console.error('\nAvailable companies:\n');

  companies.forEach((company) => console.error(`- ${company}`));

  process.exit(1);

}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const safeCompany = companyArg

  .toLowerCase()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-+|-+$/g, '');

const outputPath = path.join(OUTPUT_DIR, `${safeCompany}-missing-fields-batch.json`);

const batch = {

  companyName: matches[0].companyName,

  generatedAt: new Date().toISOString(),

  totalDrums: matches.length,

  totalMissingFields: matches.reduce((sum, item) => sum + Number(item.missingCount || 0), 0),

  fieldFrequency: matches.reduce((acc, item) => {

    (item.missingFields || []).forEach((field) => {

      acc[field.key] = (acc[field.key] || 0) + 1;

    });

    return acc;

  }, {}),

  drums: matches

    .slice()

    .sort((a, b) => {

      const lineCompare = String(a.lineSeries || '').localeCompare(String(b.lineSeries || ''));

      if (lineCompare !== 0) return lineCompare;

      const modelCompare = String(a.modelName || '').localeCompare(String(b.modelName || ''));

      if (modelCompare !== 0) return modelCompare;

      return Number(b.missingCount || 0) - Number(a.missingCount || 0);

    }),

};

fs.writeFileSync(outputPath, `${JSON.stringify(batch, null, 2)}\n`);

console.log(`Created batch: ${outputPath}`);

console.log(`Company: ${batch.companyName}`);

console.log(`Drums: ${batch.totalDrums}`);

console.log(`Total missing fields: ${batch.totalMissingFields}`);

console.log('\nMost common missing fields:');

Object.entries(batch.fieldFrequency)

  .sort((a, b) => b[1] - a[1])

  .slice(0, 20)

  .forEach(([key, count]) => {

    console.log(`- ${key}: ${count}`);

  });