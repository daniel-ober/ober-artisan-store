const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firestore is initialized
const db = admin.firestore();

// Get product by ID
router.get('/:id', async (req, res) => {
    console.log('Fetching product with ID:', req.params.id);
    try {
        const productRef = db.collection('products').doc(req.params.id);
        const doc = await productRef.get();

        if (!doc.exists) {
            console.log('Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(doc.data());
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
