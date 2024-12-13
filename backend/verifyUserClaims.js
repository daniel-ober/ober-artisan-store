const admin = require('firebase-admin');

// Load Firebase Service Account Key
const serviceAccount = require('./serviceAccountKey-dev.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const userId = process.argv[2];

if (!userId) {
    console.error('Please provide a user ID as an argument.');
    process.exit(1);
}

(async () => {
    try {
        const user = await admin.auth().getUser(userId);
        console.log('User Claims:', user.customClaims || 'No custom claims set.');
    } catch (error) {
        console.error('Error fetching user:', error.message);
    }
})();
