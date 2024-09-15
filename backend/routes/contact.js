const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();

// Route to handle contact form submission
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone, message } = req.body;

  try {
    // Save to Firestore
    await db.collection('contacts').add({
      first_name,
      last_name,
      email,
      phone,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;
