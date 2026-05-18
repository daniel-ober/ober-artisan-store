
import fs from 'fs';

const audit = JSON.parse(

  fs.readFileSync(

    'data/snareAuditReports/snare-model-readiness-strict.json',

    'utf8'

  )

);

const targets = [];

for (const record of audit.failedCoreRecords || []) {

  const failed = record.failedCoreFields || [];

  const priorityScore =

    (failed.includes('shellThicknessMm') ? 5 : 0) +

    (failed.includes('bearingEdge') ? 5 : 0) +

    (failed.includes('snareBedType') ? 4 : 0) +

    (failed.includes('reRingMaterial') ? 2 : 0);

  targets.push({

    id: record.id,

    companyName: record.companyName,

    modelName: record.modelName,

    failedCoreFields: failed,

    priorityScore

  });

}

targets.sort((a, b) => b.priorityScore - a.priorityScore);

const grouped = {};

for (const t of targets) {

  if (!grouped[t.companyName]) {

    grouped[t.companyName] = [];

  }

  grouped[t.companyName].push(t);

}

const output = {

  generatedAt: new Date().toISOString(),

  totalTargets: targets.length,

  grouped

};

fs.writeFileSync(

  'data/snareAuditReports/core-shell-research-targets.json',

  JSON.stringify(output, null, 2)

);

console.log(`Built ${targets.length} core-shell research targets.`);

console.log(

  Object.entries(grouped)

    .map(([company, rows]) => ({

      company,

      targets: rows.length

    }))

    .sort((a, b) => b.targets - a.targets)

);

