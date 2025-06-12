const admin = require('firebase-admin');
const serviceAccount = require('./rick_ressner.json'); // ← this is the key you saved to Desktop

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const email = 'eressner@gmail.com';

async function setSoundlegendClaim() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { isSoundlegend: true });
    console.log(`✅ Custom claim 'isSoundlegend: true' set for ${email}`);
  } catch (err) {
    console.error('❌ Failed to set claim:', err.message);
  }
}

setSoundlegendClaim();