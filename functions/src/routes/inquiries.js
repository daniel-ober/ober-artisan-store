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
        // Add "status: New" field to the inquiry data
        const contactData = {
            first_name,
            last_name,
            email,
            message,
            status: 'New', // Add the "status" field
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(phone && { phone }), // Include phone only if provided
        };

        // Log contactData to verify
        console.log('Contact Data:', contactData);

        // Add document to Firestore
        const docRef = await db.collection('inquiries').add(contactData);
        console.log('Document written with ID:', docRef.id);

        res.status(201).json({ message: 'Contact message saved successfully', data: contactData });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to fetch all inquiries with total count
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('inquiries').get();
        const inquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalCount = inquiries.length;

        res.status(200).json({ totalCount, inquiries });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

module.exports = router;