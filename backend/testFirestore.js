require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const admin = require('firebase-admin');
const path = require('path');

// Load Firebase Service Account
const env = process.env.NODE_ENV || 'dev';
const serviceAccountPath = path.resolve(__dirname, `serviceAccountKey-${env}.json`);
console.log(`Loading Firebase Service Account Key from: ${serviceAccountPath}`);

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    // The databaseURL should work automatically for `(default)` database
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

(async () => {
    try {
        console.log("Fetching root collections from Firestore...");
        console.log(`Environment: ${env}`);
        console.log(`Firestore Project ID (from environment): ${process.env.FIREBASE_PROJECT_ID}`);

        // Fetch root collections
        const collections = await db.listCollections();
        console.log("Root Collections:");
        collections.forEach((collection) => console.log(`- ${collection.id}`));

        // Fetch documents from 'products' collection
        console.log('Fetching documents from "products" collection...');
        const snapshot = await db.collection('products').get();

        if (snapshot.empty) {
            console.log('No documents found in the "products" collection.');
        } else {
            snapshot.forEach((doc) => {
                console.log(`Document ID: ${doc.id}`);
                console.log('Document Data:', doc.data());
            });
        }
    } catch (error) {
        console.error('Error fetching data:', error.message);
        console.error(error);
    }
})();
