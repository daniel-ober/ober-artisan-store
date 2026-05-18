
import fs from 'fs';

const packetPath = process.argv[2];

if (!packetPath) {

  console.error('Usage: node scripts/buildResearchSearchQueries.mjs data/snareResearchPackets/canopus-core-batch-1.json');

  process.exit(1);

}

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));

const queries = packet.records.map((r) => ({

  id: r.id,

  companyName: r.companyName,

  modelName: r.modelName,

  failedCoreFields: r.failedCoreFields,

  queries: [

    `"${r.companyName}" "${r.modelName}" snare shell thickness bearing edge snare beds`,

    `"${r.companyName}" "${r.modelName}" shell material thickness`,

    `"${r.companyName}" "${r.modelName}" snare drum specs`

  ]

}));

const outPath = packetPath.replace('.json', '-search-queries.json');

fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), queries }, null, 2));

console.log(`Created ${outPath}`);

console.log(JSON.stringify(queries.slice(0, 10), null, 2));

