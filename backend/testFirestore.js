require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });
const admin = require('firebase-admin');
const path = require('path');

// Load Firebase Service Account
const env = process.env.NODE_ENV || 'dev';
const serviceAccountPath = path.resolve(__dirname, `serviceAccountKey-${env}.json`);
console.log(`Loading Firebase Service Account Key from: ${serviceAccountPath}`);

// Validate environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('Error: FIREBASE_PROJECT_ID is missing in your environment variables.');
    process.exit(1);
}

console.log(`Environment: ${env}`);
console.log(`Firestore Project ID: ${process.env.FIREBASE_PROJECT_ID}`);

// Initialize Firebase
try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
}

const db = admin.firestore();

(async () => {
    try {
        console.log('Fetching root collections from Firestore...');
        const collections = await db.listCollections();
        if (collections.length === 0) {
            console.log('No root collections found.');
        } else {
            console.log('Root Collections:');
            collections.forEach((collection) => console.log(`- ${collection.id}`));
        }

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
        console.error('Error fetching data from Firestore:', error.message);
        console.error(error);
    }
})();
