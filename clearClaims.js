// clearClaims.js
const admin = require("firebase-admin");
const serviceAccount = require("./admin-danober.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.auth().setCustomUserClaims("kUBVZnh1EDX1W6CS2c09Rfdshjw2", {})
  .then(() => {
    // console.log("✅ Cleared all custom claims");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed to clear claims", err);
    process.exit(1);
  });