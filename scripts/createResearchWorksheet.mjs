
import fs from 'fs';

const packetPath = process.argv[2];

if (!packetPath) {

  console.error('Usage: node scripts/createResearchWorksheet.mjs data/snareResearchPackets/canopus-core-batch-1.json');

  process.exit(1);

}

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));

const outPath = packetPath.replace('.json', '-worksheet.md');

const lines = [];

lines.push(`# ${packet.company} Core Shell Research Worksheet`);

lines.push('');

lines.push(`Batch: ${packet.batch || 'research-batch'}`);

lines.push('');

lines.push('Fill only source-backed values. Leave unknown if not verified.');

lines.push('');

for (const r of packet.records) {

  lines.push(`## ${r.modelName}`);

  lines.push('');

  lines.push(`Firestore ID: \`${r.id}\``);

  lines.push('');

  lines.push(`Failed fields: ${r.failedCoreFields.join(', ')}`);

  lines.push('');

  lines.push('Search queries:');

  lines.push(`- "${r.companyName}" "${r.modelName}" snare shell thickness bearing edge snare beds`);

  lines.push(`- "${r.companyName}" "${r.modelName}" shell material thickness`);

  lines.push(`- "${r.companyName}" "${r.modelName}" snare drum specs`);

  lines.push('');

  lines.push('Patch values to confirm:');

  lines.push('- shellMaterial1:');

  lines.push('- shellMaterial2:');

  lines.push('- shellThicknessMm:');

  lines.push('- bearingEdge:');

  lines.push('- reinforcementRings:');

  lines.push('- reRingMaterial:');

  lines.push('- snareBeds:');

  lines.push('- snareBedType:');

  lines.push('- primarySourceUrl:');

  lines.push('- secondarySourceUrl:');

  lines.push('- sourceConfidence:');

  lines.push('');

}

fs.writeFileSync(outPath, lines.join('\n'));

console.log(`Created ${outPath}`);

