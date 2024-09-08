// routes/products.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get a reference to the Firestore database
const db = admin.firestore();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    if (productsSnapshot.empty) {
      res.status(404).json({ error: 'No products found' });
      return;
    }
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
