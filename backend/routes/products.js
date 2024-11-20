// backend/routes/products.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.headers.authorization || req.headers.authorization.split(' ')[1] !== 'admin-token') {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
};

// GET /products: Retrieve all products
router.get('/', async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /products/:id: Retrieve a specific product
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const productDoc = await db.collection('products').doc(id).get();
        if (!productDoc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ id: productDoc.id, ...productDoc.data() });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /products: Create a new product (admin-only)
router.post('/', isAdmin, async (req, res) => {
    const productData = req.body;
    try {
        const newProduct = await db.collection('products').add(productData);
        res.status(201).json({ id: newProduct.id, ...productData });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /products/:id: Update a product (admin-only)
router.put('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const productRef = db.collection('products').doc(id);
        await productRef.update(updates);
        res.status(200).json({ id, ...updates });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /products/:id: Delete a product (admin-only)
router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('products').doc(id).delete();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
