const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to set custom claims
const setAdminRole = async (email) => {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email);

    // Check if the user already has admin claims
    if (user.customClaims?.admin === true) {
      // console.log(`${email} is already an admin.`);
      return;
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    // console.log(`Admin role set for ${email}`);
  } catch (error) {
    console.error('Error setting admin role:', error);
  }
};

// Set the role for the specified email
setAdminRole('chilldrummer@gmail.com');
