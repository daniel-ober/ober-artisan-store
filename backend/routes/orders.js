const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Route to create a new order
router.post('/', async (req, res) => {
    const { customerName, total, items, userId } = req.body;

    if (!customerName || !total || !items || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const ref = await db.collection('orders').add({
            customerName,
            total,
            items,
            userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({ id: ref.id });
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Route to fetch all orders
router.get('/all', async (req, res) => {
    try {
        const snapshot = await db.collection('orders').get();
        const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Route to fetch a single order by ID (e.g., Stripe session ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    console.log(`[GET /api/orders/:id] Received ID: ${id}`);

    try {
        const ordersSnapshot = await db
            .collection('orders')
            .where('stripeSessionId', '==', id)
            .limit(1)
            .get();

        if (ordersSnapshot.empty) {
            console.error(`[GET /api/orders/:id] Order not found for session ID: ${id}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderDoc = ordersSnapshot.docs[0];
        console.log(`[GET /api/orders/:id] Order found:`, orderDoc.data());

        res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
    } catch (error) {
        console.error(`[GET /api/orders/:id] Error fetching order: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

module.exports = router;