
import fs from 'fs';

const company = process.argv.slice(2).join(' ');

if (!company) {

  console.error('Usage: node scripts/buildCompanyResearchPacket.mjs "Canopus"');

  process.exit(1);

}

const queue = JSON.parse(fs.readFileSync('data/snareAuditReports/snare-research-queue.json', 'utf8'));

const coreRecords = queue.coreQueue.filter((r) => r.companyName === company);

const stockRecords = queue.stockQueue.filter((r) => r.companyName === company);

const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const output = {

  company,

  generatedAt: new Date().toISOString(),

  counts: {

    coreRecords: coreRecords.length,

    stockRecords: stockRecords.length

  },

  instructions: {

    goal: 'Research and patch failed minimum engine fields with source-backed values only.',

    rules: [

      'Unknown may remain in Firestore, but it fails minimum engine readiness.',

      'Do not invent shell thickness, bearing edge, snare bed, or stock hardware details.',

      'Use sourceConfidence and notesOnMissingData honestly.',

      'Core shell fields come first; stock config fields come second.'

    ]

  },

  coreRecords,

  stockRecords

};

fs.mkdirSync('data/snareResearchPackets', { recursive: true });

fs.writeFileSync(`data/snareResearchPackets/${slug}-research-packet.json`, JSON.stringify(output, null, 2));

console.log(`Created data/snareResearchPackets/${slug}-research-packet.json`);

console.log(`Core records: ${coreRecords.length}`);

console.log(`Stock records: ${stockRecords.length}`);

