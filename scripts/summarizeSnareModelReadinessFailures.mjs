
import fs from 'fs';

const report = JSON.parse(fs.readFileSync('data/snareAuditReports/snare-model-readiness-audit.json', 'utf8'));

const coreFieldCounts = {};

const stockFieldCounts = {};

const byCompanyCore = {};

const byCompanyStock = {};

for (const r of report.records) {

  if (!r.coreShellReady) {

    if (!byCompanyCore[r.companyName]) byCompanyCore[r.companyName] = {};

    for (const field of r.missingCoreFields) {

      coreFieldCounts[field] = (coreFieldCounts[field] || 0) + 1;

      byCompanyCore[r.companyName][field] = (byCompanyCore[r.companyName][field] || 0) + 1;

    }

  }

  if (!r.stockConfigReady) {

    if (!byCompanyStock[r.companyName]) byCompanyStock[r.companyName] = {};

    for (const field of r.missingStockFields) {

      stockFieldCounts[field] = (stockFieldCounts[field] || 0) + 1;

      byCompanyStock[r.companyName][field] = (byCompanyStock[r.companyName][field] || 0) + 1;

    }

  }

}

const output = {

  totalDocs: report.totalDocs,

  summary: report.summary,

  coreFieldCounts,

  stockFieldCounts,

  byCompanyCore,

  byCompanyStock,

  first50CoreFailures: report.records

    .filter((r) => !r.coreShellReady)

    .slice(0, 50)

    .map((r) => ({

      id: r.id,

      companyName: r.companyName,

      modelName: r.modelName,

      missingCoreFields: r.missingCoreFields

    })),

  first50StockFailures: report.records

    .filter((r) => !r.stockConfigReady)

    .slice(0, 50)

    .map((r) => ({

      id: r.id,

      companyName: r.companyName,

      modelName: r.modelName,

      missingStockFields: r.missingStockFields

    }))

};

fs.writeFileSync(

  'data/snareAuditReports/snare-model-readiness-failure-summary.json',

  JSON.stringify(output, null, 2)

);

console.log('CORE FIELD COUNTS');

console.table(Object.entries(coreFieldCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count));

console.log('STOCK FIELD COUNTS');

console.table(Object.entries(stockFieldCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count));

