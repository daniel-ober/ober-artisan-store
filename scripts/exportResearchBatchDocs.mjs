
import admin from 'firebase-admin';

import fs from 'fs';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const packetPath = process.argv[2];

if (!packetPath) {

  console.error('Usage: node scripts/exportResearchBatchDocs.mjs data/snareResearchPackets/canopus-core-batch-1.json');

  process.exit(1);

}

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));

const docs = [];

for (const r of packet.records) {

  const ref = db.collection('snareReferenceDrums').doc(r.id);

  const snap = await ref.get();

  docs.push({

    id: r.id,

    exists: snap.exists,

    failedCoreFields: r.failedCoreFields,

    data: snap.exists ? snap.data() : null

  });

}

const outPath = packetPath.replace('.json', '-firestore-docs.json');

fs.writeFileSync(outPath, JSON.stringify({

  generatedAt: new Date().toISOString(),

  sourcePacket: packetPath,

  docs

}, null, 2));

console.log(`Created ${outPath}`);

console.log(`Docs exported: ${docs.length}`);

