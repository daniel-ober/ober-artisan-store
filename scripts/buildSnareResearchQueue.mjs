
import fs from 'fs';

const report = JSON.parse(fs.readFileSync('data/snareAuditReports/snare-model-readiness-strict.json', 'utf8'));

const coreQueue = report.records

  .filter((r) => !r.coreShellMinimumPassed)

  .map((r) => ({

    priority: r.failedCoreFields.includes('shellMaterial1') || r.failedCoreFields.includes('reinforcementRings') || r.failedCoreFields.includes('snareBeds') ? 'high' : 'medium',

    companyName: r.companyName,

    lineSeries: r.lineSeries,

    modelName: r.modelName,

    id: r.id,

    failedCoreFields: r.failedCoreFields

  }))

  .sort((a, b) => {

    const p = { high: 0, medium: 1, low: 2 };

    return p[a.priority] - p[b.priority] || a.companyName.localeCompare(b.companyName) || a.modelName.localeCompare(b.modelName);

  });

const stockQueue = report.records

  .filter((r) => r.coreShellMinimumPassed && !r.stockMinimumPassed)

  .map((r) => ({

    priority: 'stock-detail',

    companyName: r.companyName,

    lineSeries: r.lineSeries,

    modelName: r.modelName,

    id: r.id,

    failedStockFields: r.failedStockFields

  }))

  .sort((a, b) => a.companyName.localeCompare(b.companyName) || a.modelName.localeCompare(b.modelName));

const output = {

  generatedAt: new Date().toISOString(),

  notes: {

    coreQueue: 'Fix these first. These records fail bare-shell minimum engine requirements.',

    stockQueue: 'Fix after core shell queue. These have enough shell data for modifier engine, but not enough verified stock config data.'

  },

  counts: {

    coreQueue: coreQueue.length,

    stockQueue: stockQueue.length

  },

  coreQueue,

  stockQueue

};

fs.writeFileSync('data/snareAuditReports/snare-research-queue.json', JSON.stringify(output, null, 2));

console.log('Core research queue:', coreQueue.length);

console.log('Stock research queue:', stockQueue.length);

console.log('\nFirst 25 core research items:');

console.table(coreQueue.slice(0, 25).map((r) => ({

  priority: r.priority,

  company: r.companyName,

  model: r.modelName,

  failed: r.failedCoreFields.join(', ')

})));

