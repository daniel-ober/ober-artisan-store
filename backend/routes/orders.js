const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Create a new order
router.post('/', async (req, res) => {
    const orderData = req.body;
    try {
        const orderRef = await db.collection('orders').add(orderData);
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
        const ordersRef = db.collection('orders');
        const q = query(ordersRef, where('stripeSessionId', '==', sessionId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        res.status(200).json(querySnapshot.docs[0].data());
    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({ error: 'Failed to retrieve order.' });
    }
});

module.exports = router;
