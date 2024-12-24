// backend/routes/products.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin'); // Use the already initialized Firebase Admin SDK

const db = admin.firestore(); // Access Firestore instance

router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) {
            return res.status(404).json({ error: 'No products found' });
        }

        const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

module.exports = router;
