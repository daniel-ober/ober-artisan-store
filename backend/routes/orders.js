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

// Update an order status
router.patch('/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // Get status from request body
    try {
        await db.collection('orders').doc(orderId).update({ status });
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
