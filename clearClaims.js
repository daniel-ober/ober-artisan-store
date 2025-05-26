const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // update if your file has a different name

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.auth().setCustomUserClaims("kUBVZnh1EDX1W6CS2c09Rfdshjw2", {})
  .then(() => {
    console.log('✅ Cleared all custom claims for user');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error clearing claims:', err.message);
    process.exit(1);
  });