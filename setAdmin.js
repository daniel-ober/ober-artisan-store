const admin = require("firebase-admin");
const serviceAccount = require("./admin-danober.json"); // ✅ freshly downloaded key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.auth().setCustomUserClaims("kUBVZnh1EDX1W6CS2c09Rfdshjw2", {
  isAdmin: true,
  soundlegend: true,
}).then(() => {
  console.log("✅ Admin + SoundLegend claims set for Dan Ober.");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error setting custom claims:", error);
  process.exit(1);
});