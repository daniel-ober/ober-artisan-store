/* eslint-disable no-console */

const admin = require("firebase-admin");

function initFirebase() {

  if (admin.apps.length) return;

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

    projectId: process.env.FIREBASE_PROJECT_ID || undefined,

  });

}

async function countCollection(db, collectionName) {

  const snapshot = await db.collection(collectionName).count().get();

  return snapshot.data().count;

}

async function sampleCollection(db, collectionName, limit = 5) {

  const snapshot = await db.collection(collectionName).limit(limit).get();

  return snapshot.docs.map((doc) => ({

    id: doc.id,

    companyName: doc.data().companyName,

    lineSeries: doc.data().lineSeries,

    modelName: doc.data().modelName,

    diameter: doc.data().diameter,

    depth: doc.data().depth,

    scores: doc.data().oberScores,

  }));

}

async function main() {

  initFirebase();

  const db = admin.firestore();

  const collections = ["snareReferenceDrums", "oberArtisanSnareVariants"];

  for (const collectionName of collections) {

    const count = await countCollection(db, collectionName);

    const samples = await sampleCollection(db, collectionName);

    console.log("");

    console.log(`Collection: ${collectionName}`);

    console.log(`Count: ${count}`);

    console.log("Samples:");

    console.dir(samples, { depth: null });

  }

}

main().catch((error) => {

  console.error("Verification failed:");

  console.error(error);

  process.exit(1);

});