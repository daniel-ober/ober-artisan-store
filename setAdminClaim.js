// setAdminClaim.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // ✅ path to your private service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'PUT_ADMIN_UID_HERE'; // 👈 replace with actual UID

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim set for UID: ${uid}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error setting admin claim:', err);
    process.exit(1);
  });