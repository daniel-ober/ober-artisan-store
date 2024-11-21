const express = require('express');
const router = express.Router();
const { db } = require('../firebaseConfig'); // Use the centralized configuration

// Fetch all products
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

module.exports = router;
