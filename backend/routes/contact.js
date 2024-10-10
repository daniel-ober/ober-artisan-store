// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firestore is initialized
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
