
const fs = require('fs');

const IN = 'src/legacyPrint/reviewPlans/missing-from-ui-firestore-report.json';

const OUT = 'src/legacyPrint/reviewPlans/missing-from-ui-firestore-report.csv';

const report = JSON.parse(fs.readFileSync(IN, 'utf8'));

const records = report.records || [];

const columns = [

  'company',

  'line',

  'model',

  'size',

  'family',

  'construction',

  'material1',

  'material2',

  'thickness',

  'bearingEdge',

  'hoop',

  'lugs',

  'confidence',

  'missing',

  'id',

];

const escapeCsv = value => {

  const text = String(value ?? '');

  if (/[",\n\r]/.test(text)) {

    return `"${text.replace(/"/g, '""')}"`;

  }

  return text;

};

const csv = [

  columns.join(','),

  ...records.map(row => columns.map(col => escapeCsv(row[col])).join(',')),

].join('\n');

fs.writeFileSync(OUT, csv);

console.log(`CSV exported: ${OUT}`);

console.log(`Rows: ${records.length}`);

