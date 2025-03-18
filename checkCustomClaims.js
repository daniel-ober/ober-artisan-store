require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
  process.exit(1);
}

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
  try {
    const user = await admin.auth().getUser(uid);
    // console.log('User data:', user.toJSON());
    if (user.customClaims) {
      // console.log('Custom claims:', user.customClaims);
    } else {
      // console.log('No custom claims found.');
    }
  } catch (error) {
    // console.error('Error fetching user data:', error);
  }
};

const setCustomClaims = async (uid, claims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    // console.log(`Claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
};

const uid = process.argv[2];
if (!uid) {
  console.error('Please provide a UID as an argument.');
  process.exit(1);
}

(async () => {
  await setCustomClaims(uid, { admin: true });
  await checkUserRole(uid);
})();
