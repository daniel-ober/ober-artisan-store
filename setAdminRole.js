const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ensure this path is correct

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to set custom claims
const setAdminRole = async (email) => {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`Custom claims set for ${email}`);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
};

// Set the role for the specified email
setAdminRole('chilldrummer@gmail.com');