
import fs from 'fs';

const data = JSON.parse(

  fs.readFileSync(

    'data/snareAuditReports/core-shell-research-targets.json',

    'utf8'

  )

);

const priorityFields = [

  'shellThicknessMm',

  'bearingEdge',

  'snareBedType',

  'reRingMaterial'

];

const exportsMap = {};

for (const [company, rows] of Object.entries(data.grouped || {})) {

  exportsMap[company] = {};

  for (const field of priorityFields) {

    exportsMap[company][field] = rows.filter((r) =>

      (r.failedCoreFields || []).includes(field)

    );

  }

}

fs.mkdirSync('data/snareResearchExports', { recursive: true });

for (const [company, fields] of Object.entries(exportsMap)) {

  const slug = company

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, '-');

  fs.writeFileSync(

    `data/snareResearchExports/${slug}-priority-research.json`,

    JSON.stringify(fields, null, 2)

  );

}

console.log('Built priority research exports.');

console.table(

  Object.entries(exportsMap).map(([company, fields]) => ({

    company,

    thickness: fields.shellThicknessMm.length,

    bearingEdge: fields.bearingEdge.length,

    snareBeds: fields.snareBedType.length,

    reRings: fields.reRingMaterial.length

  }))

);

