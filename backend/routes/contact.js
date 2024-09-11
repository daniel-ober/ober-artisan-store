const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Reference to Firestore
const db = admin.firestore();

// POST /api/contact
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone, message } = req.body;

  try {
    // Add a new inquiry document to Firestore
    await db.collection('inquiries').add({
      first_name,
      last_name,
      email,
      phone,
      message,
      submittedAt: new Date()
    });

    res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
  } catch (error) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
