const admin = require('firebase-admin');

// Update this path to where your service account key is located
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const checkUserRole = async (uid) => {
  console.log('Starting checkUserRole function...');
  try {
    console.log('Fetching user data...');
    const user = await admin.auth().getUser(uid);
    console.log('User:', user.toJSON());
    console.log('Custom Claims:', user.customClaims);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Replace with the actual UID you want to check
checkUserRole('JPaAEYseR080kMdCKZic');
