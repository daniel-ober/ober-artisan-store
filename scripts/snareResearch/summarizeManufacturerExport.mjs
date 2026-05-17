// scripts/snareResearch/summarizeManufacturerExport.mjs

import fs from 'fs';

import path from 'path';

const inputFile = process.argv[2];

if (!inputFile) {

  console.error(

    'Usage: node scripts/snareResearch/summarizeManufacturerExport.mjs data/snareResearchExports/tama-firestore-export.json'

  );

  process.exit(1);

}

const inputPath = path.resolve(process.cwd(), inputFile);

if (!fs.existsSync(inputPath)) {

  console.error(`File not found: ${inputPath}`);

  process.exit(1);

}

const records = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const get = (obj, pathValue, fallback = 'Unknown') => {

  const value = pathValue

    .split('.')

    .reduce((current, key) => current?.[key], obj);

  return value === undefined || value === null || value === ''

    ? fallback

    : value;

};

const summary = records.map((record) => ({

  id: record.id,

  companyName: get(record, 'companyName'),

  lineSeries: get(record, 'lineSeries'),

  modelName: get(record, 'modelName'),

  patchName: get(record, 'patchName'),

  modelNumber: get(record, 'identification.modelNumber'),

  productionStatus: get(record, 'identification.productionStatus'),

  currentlyInProduction: get(record, 'identification.currentlyInProduction'),

  artistSignature: get(record, 'identification.artistSignature'),

  diameter: get(record, 'shell.dimensions.diameterInches'),

  depth: get(record, 'shell.dimensions.depthInches'),

  shellConstruction: get(record, 'shell.construction.shellConstruction'),

  materialPrimary: get(record, 'shell.construction.shellMaterialPrimary'),

  materialSecondary: get(record, 'shell.construction.shellMaterialSecondary'),

  plyCount: get(record, 'shell.construction.plyCount'),

  thicknessMm: get(record, 'shell.construction.shellThicknessMm'),

  reinforcementRings: get(record, 'shell.construction.reinforcementRings'),

  batterEdge: get(record, 'shell.bearingEdges.batterSideProfile'),

  snareEdge: get(record, 'shell.bearingEdges.snareSideProfile'),

  snareBedsPresent: get(record, 'shell.snareBeds.present'),

  snareBedDepth: get(record, 'shell.snareBeds.depthBucket'),

  finishName: get(record, 'shell.finish.finishName'),

  finishType: get(record, 'shell.finish.finishType'),

  batterHoop: get(record, 'stockHardware.hoops.batterHoopType'),

  resonantHoop: get(record, 'stockHardware.hoops.resonantHoopType'),

  lugCount: get(record, 'stockHardware.lugs.lugCount'),

  lugType: get(record, 'stockHardware.lugs.lugType'),

  throwOff: [

    get(record, 'stockHardware.throwOff.make', ''),

    get(record, 'stockHardware.throwOff.model', '')

  ]

    .filter(Boolean)

    .join(' ')

    .trim() || 'Unknown',

  snareWires: [

    get(record, 'stockSnareSystem.snareWires.make', ''),

    get(record, 'stockSnareSystem.snareWires.model', ''),

    get(record, 'stockSnareSystem.snareWires.strandCount', '')

  ]

    .filter(Boolean)

    .join(' ')

    .trim() || 'Unknown',

  batterHead: get(record, 'stockSnareSystem.heads.batterHead'),

  resonantHead: get(record, 'stockSnareSystem.heads.resonantHead'),

  sourceConfidence: get(record, 'sources.sourceConfidence'),

  primarySourceUrl: get(record, 'sources.primarySourceUrl'),

  needsResearch:

    get(record, 'sources.sourceConfidence') !== 'High' ||

    get(record, 'shell.construction.shellMaterialPrimary') === 'Unknown' ||

    get(record, 'shell.construction.shellConstruction') === 'Unknown' ||

    get(record, 'shell.dimensions.diameterInches') === 'Unknown' ||

    get(record, 'shell.dimensions.depthInches') === 'Unknown'

}));

const outPath = inputPath.replace('.json', '-summary.json');

fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

const grouped = summary.reduce((acc, record) => {

  const key = record.lineSeries || 'Unknown';

  acc[key] ||= [];

  acc[key].push(record);

  return acc;

}, {});

const groupedOutPath = inputPath.replace('.json', '-grouped-summary.json');

fs.writeFileSync(groupedOutPath, JSON.stringify(grouped, null, 2));

console.log(`Input records: ${records.length}`);

console.log(`Summary written: ${outPath}`);

console.log(`Grouped summary written: ${groupedOutPath}`);

console.log('\nLine/series counts:');

Object.entries(grouped)

  .sort(([a], [b]) => a.localeCompare(b))

  .forEach(([lineSeries, items]) => {

    console.log(`${lineSeries}: ${items.length}`);

  });
