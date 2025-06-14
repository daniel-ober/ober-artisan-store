// setAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("./admin-danober.json"); // ✅ Ensure this is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .setCustomUserClaims("kUBVZnh1EDX1W6CS2c09Rfdshjw2", {
    admin: true,           // ✅ use 'admin' instead of 'isAdmin'
    soundlegend: true,
  })
  .then(() => {
    console.log("✅ Custom claims set: admin + soundlegend");
    process.exit(0);
  })
  .catch((error) => {
    // console.error("❌ Error setting custom claims:", error);
    process.exit(1);
  });