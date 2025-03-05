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
    const { first_name, last_name, email, phone, message, category } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !message || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Inquiry data to be saved
        const contactData = {
            first_name,
            last_name,
            email,
            phone: phone || '', // Default to empty if not provided
            message,
            category,
            status: 'New', // Default status
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add document to Firestore
        const docRef = await db.collection('inquiries').add(contactData);
        console.log('Document written with ID:', docRef.id);

        res.status(201).json({ message: 'Contact message saved successfully', data: contactData });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to fetch all inquiries
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('inquiries').get();
        const inquiries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ inquiries });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

module.exports = router;