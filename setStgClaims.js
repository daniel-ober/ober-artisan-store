const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with staging service account
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

const uid = '7r6TtlaePfYcLeNKkLjajJK5ZDJ2';  // Staging admin UID

// Set custom admin claims
const setCustomClaims = async () => {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Admin claim set for user: ${uid}`);

    const updatedUser = await admin.auth().getUser(uid);
    console.log('Updated user claims:', updatedUser.customClaims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
};

setCustomClaims();
