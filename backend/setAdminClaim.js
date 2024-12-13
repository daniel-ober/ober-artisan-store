const admin = require('firebase-admin');

// Path to your Firebase Admin service account key
const serviceAccount = require('./serviceAccountKey-dev.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Function to set a custom claim for a user
const setAdminClaim = async (userId) => {
    try {
        // Add 'admin' custom claim to the user
        await admin.auth().setCustomUserClaims(userId, { admin: true });
        console.log(`Admin claim set for user: ${userId}`);
    } catch (error) {
        console.error('Error setting admin claim:', error.message);
    }
};

// Get the userId from the command line arguments
const userId = process.argv[2];

if (!userId) {
    console.error('Please provide a userId as a command-line argument.');
    process.exit(1);
}

// Call the function to set the admin claim
setAdminClaim(userId);
