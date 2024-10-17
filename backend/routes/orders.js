// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firestore is initialized
const db = admin.firestore();

// Create a new order
router.post('/', async (req, res) => {
    const orderData = req.body; // Assuming you're sending order data in the request body
    try {
        const orderRef = await db.collection('orders').add(orderData);
        res.status(201).json({ id: orderRef.id, ...orderData });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all orders for a user
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const ordersSnapshot = await db.collection('orders').where('userId', '==', userId).get();
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
