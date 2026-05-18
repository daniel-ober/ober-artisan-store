
import fs from 'fs';

const company = process.argv.slice(2).join(' ');

if (!company) {

  console.error('Usage: node scripts/auditSnareCompany.mjs "Tama"');

  process.exit(1);

}

const reportPath = 'data/snareAuditReports/snare-readiness-audit.json';

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const companyReport = report.companies[company];

if (!companyReport) {

  console.error(`No company found for: ${company}`);

  console.log('Available companies:');

  console.log(Object.keys(report.companies).sort().join('\n'));

  process.exit(1);

}

const badRecords = report.badRecords.filter(

  (r) => r.companyName === company

);

const outPath = `data/snareAuditReports/${company

  .toLowerCase()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-|-$/g, '')}-audit.json`;

const output = {

  company,

  summary: companyReport,

  badRecords

};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`Company audit written to: ${outPath}`);

console.log(`Total: ${companyReport.total}`);

console.log(`Engine ready: ${companyReport.engineReady}`);

console.log(`Needing work: ${badRecords.length}`);

