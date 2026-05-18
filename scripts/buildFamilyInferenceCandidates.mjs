
import fs from 'fs';

const targetsPath =

  'data/snareAuditReports/core-shell-research-targets.json';

if (!fs.existsSync(targetsPath)) {

  console.error(`Missing file: ${targetsPath}`);

  process.exit(1);

}

const raw = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));

const targets =

  Array.isArray(raw)

    ? raw

    : Array.isArray(raw.targets)

      ? raw.targets

      : [];

function clean(value = '') {

  return value

    .toLowerCase()

    // dimensions

    .replace(/\d+x\d+(\.\d+)?/gi, '')

    // ply counts

    .replace(/\b\d+[- ]ply\b/gi, '')

    // materials

    .replace(/\b(maple|birch|mahogany|walnut|oak|beech|poplar|brass|bronze|copper|aluminum|aluminium|steel|bell brass|acrylic)\b/gi, '')

    // descriptors

    .replace(/\b(hand hammered|hammered|solid shell|solid|stave|steam bent|ply|single ply|shell bank|custom|vintage|reissue)\b/gi, '')

    // generic words

    .replace(/\b(snare drum|snare|drum|series|edition|model)\b/gi, '')

    // punctuation cleanup

    .replace(/[-_/]/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

}

const grouped = {};

for (const row of targets) {

  const familySource = [

    row.companyName,

    row.lineSeries,

    row.modelName

  ]

    .filter(Boolean)

    .join(' ');

  const family = clean(familySource);

  if (!family || family.length < 2) continue;

  const key = `${row.companyName}__${family}`;

  if (!grouped[key]) {

    grouped[key] = {

      company: row.companyName,

      family,

      count: 0,

      failedFields: {},

      records: []

    };

  }

  grouped[key].count += 1;

  for (const field of row.failedCoreFields || []) {

    grouped[key].failedFields[field] =

      (grouped[key].failedFields[field] || 0) + 1;

  }

  grouped[key].records.push({

    id: row.id,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    failedCoreFields: row.failedCoreFields || []

  });

}

const output = Object.values(grouped)

  .filter(group => group.count >= 2)

  .sort((a, b) => b.count - a.count);

fs.mkdirSync('data/snareAuditReports', { recursive: true });

fs.writeFileSync(

  'data/snareAuditReports/family-inference-candidates.json',

  JSON.stringify(output, null, 2)

);

console.log(`Built ${output.length} family inference candidates.`);

console.table(

  output.slice(0, 50).map(group => ({

    company: group.company,

    family: group.family,

    count: group.count,

    failedFields: Object.keys(group.failedFields).join(', ')

  }))

);

