require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY))
  });
}

// Function to check user claims
const checkUserClaims = async (uid) => {
  try {
    const user = await admin.auth().getUser(uid);
    // console.log('User Claims:', user.customClaims);
  } catch (error) {
    // console.error('Error fetching user:', error);
  }
};

// Replace with your staging UID
const uid = '7r6TtlaePfYcLeNKkLjajJK5ZDJ2';
checkUserClaims(uid);
