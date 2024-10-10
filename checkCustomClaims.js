require('dotenv').config();
const admin = require('firebase-admin');

// Ensure necessary environment variables are available
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.error('Error: Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
  process.exit(1);
}

// Initialize Firebase Admin SDK with service account from environment variables
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error('Error parsing service account key:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const checkUserRole = async (uid) => {
  console.log('Starting checkUserRole function...');
  try {
    console.log('Fetching user data...');
    const user = await admin.auth().getUser(uid);
    console.log('User:', user.toJSON());
    if (user.customClaims) {
      console.log('Custom Claims:', user.customClaims);
    } else {
      console.log('No custom claims found for user.');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

const setCustomClaims = async (uid, claims) => {
  try {
    console.log(`Setting custom claims for user ${uid}...`);
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
};

// Get UID from command-line argument
const uid = process.argv[2];

if (!uid) {
  console.error('Please provide a UID as a command-line argument.');
  process.exit(1);
}

// Example usage to set custom claims
(async () => {
  await setCustomClaims(uid, { admin: true }); // Set custom claims
  await checkUserRole(uid); // Fetch user data and check claims
})();
