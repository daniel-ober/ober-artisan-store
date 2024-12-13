const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// POST route for contact form
router.post('/', async (req, res) => {
    const { first_name, last_name, email, phone, message } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format (optional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const contactData = {
            first_name,
            last_name,
            email,
            message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(phone && { phone }), // Include phone only if provided
        };

        await db.collection('inquiries').add(contactData);
        res.status(201).json({ message: 'Contact message saved successfully', data: contactData });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
