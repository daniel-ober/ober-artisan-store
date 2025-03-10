// functions/src/routes/orders.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Route to fetch all orders with total count
router.get('/', async (req, res) => {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const totalCount = orders.length; // Get total count

        res.status(200).json({ totalCount, orders }); // Return total count and the orders
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Route to fetch order by Stripe Session ID
router.get('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const ordersSnapshot = await db
            .collection('orders')
            .where('stripeSessionId', '==', sessionId)
            .limit(1)
            .get();

        if (ordersSnapshot.empty) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderDoc = ordersSnapshot.docs[0];
        return res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
    } catch (err) {
        console.error('Error fetching order:', err.message);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

module.exports = router;