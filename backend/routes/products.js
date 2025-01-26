const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

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
        const totalCount = products.length; // Get total count

        res.status(200).json({ totalCount, products }); // Return total count and the products
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

module.exports = router;