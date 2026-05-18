import fs from 'fs';

const raw = JSON.parse(

  fs.readFileSync(

    'data/snareAuditReports/core-shell-research-targets.json',

    'utf8'

  )

);

const targets = Array.isArray(raw)

  ? raw

  : Array.isArray(raw.targets)

    ? raw.targets

    : [];

function normalizeFamilyName(model) {

  return model

    .replace(/\d+x\d+(\.\d+)?/gi, '')

    .replace(/14x5\.5|14x6\.5|13x7|12x5/gi, '')

    .replace(/\b\d+[- ]ply\b/gi, '')

    .replace(/\s+/g, ' ')

    .trim();

}

const families = {};

for (const row of targets) {

  const family = normalizeFamilyName(row.modelName);

  const key = `${row.companyName}__${family}`;

  if (!families[key]) {

    families[key] = {

      company: row.companyName,

      family,

      count: 0,

      failedFields: {},

      models: []

    };

  }

  families[key].count++;

  for (const field of row.failedCoreFields || []) {

    families[key].failedFields[field] =

      (families[key].failedFields[field] || 0) + 1;

  }

  families[key].models.push({

    model: row.modelName,

    failed: row.failedCoreFields

  });

}

const output = Object.values(families)

  .filter((f) => f.count >= 2)

  .sort((a, b) => b.count - a.count);

fs.writeFileSync(

  'data/snareAuditReports/family-inference-candidates.json',

  JSON.stringify(output, null, 2)

);

console.log(`Built ${output.length} family inference candidates.`);

console.table(

  output.slice(0, 40).map((f) => ({

    company: f.company,

    family: f.family,

    count: f.count,

    failedFields: Object.keys(f.failedFields).join(', ')

  }))

);