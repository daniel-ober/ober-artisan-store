// scripts/clearSnareReferenceCollections.js

/* eslint-disable no-console */

const admin = require("firebase-admin");

const COLLECTIONS_TO_CLEAR = [

  "snareReferenceDrums",

  "oberArtisanSnareVariants",

];

function initFirebase() {

  if (admin.apps.length) return;

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

    projectId: process.env.FIREBASE_PROJECT_ID || undefined,

  });

}

async function deleteCollection(collectionName, batchSize = 400) {

  const db = admin.firestore();

  const collectionRef = db.collection(collectionName);

  let totalDeleted = 0;

  while (true) {

    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {

      break;

    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {

      batch.delete(doc.ref);

    });

    await batch.commit();

    totalDeleted += snapshot.size;

    console.log(`Deleted ${totalDeleted} from ${collectionName}`);

  }

  return totalDeleted;

}

async function main() {

  initFirebase();

  console.log("Clearing LegacyPrint snare reference collections...");

  console.log("");

  for (const collectionName of COLLECTIONS_TO_CLEAR) {

    const deleted = await deleteCollection(collectionName);

    console.log("");

    console.log(`Finished ${collectionName}: deleted ${deleted}`);

    console.log("");

  }

  console.log("Done. Collections are ready for a clean re-import.");

}

main().catch((error) => {

  console.error("Clear failed:");

  console.error(error);

  process.exit(1);

});