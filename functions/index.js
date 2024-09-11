const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();

// Use CORS middleware to allow requests from any origin
app.use(cors({ origin: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Define the API endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // Add data to Firestore
    await admin.firestore().collection('contactForm').add({
      name,
      email,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send a success response
    res.status(200).send('Contact form submitted successfully');
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).send('Error submitting contact form');
  }
});

// Export the API as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
