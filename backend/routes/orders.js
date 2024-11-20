// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { query, where, getDocs } = require('firebase/firestore');

const db = admin.firestore();

// Create a new order
router.post('/', async (req, res) => {
    const orderData = req.body;

    try {
        const orderRef = await db.collection('orders').add({
            ...orderData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(), // Timestamp for order creation
        });
        res.status(201).json({ id: orderRef.id, ...orderData });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order.' });
    }
});

// Retrieve order details by Stripe session ID
router.get('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Query the Firestore database for the order with the given Stripe session ID
        const ordersRef = db.collection('orders');
        const q = ordersRef.where('stripeSessionId', '==', sessionId);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Return the first matching document (there should only be one)
        const orderDoc = querySnapshot.docs[0];
        res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({ error: 'Failed to retrieve order.' });
    }
});

// Retrieve all orders for a specific user (optional, useful for authenticated users)
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const ordersRef = db.collection('orders');
        const q = ordersRef.where('userId', '==', userId);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return res.status(404).json({ error: 'No orders found for this user.' });
        }

        const orders = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving user orders:', error);
        res.status(500).json({ error: 'Failed to retrieve user orders.' });
    }
});

module.exports = router;
