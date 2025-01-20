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

// **New Route**: Fetch a single order by ID (e.g., Stripe session ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    console.log(`[GET /api/orders/:id] Received ID: ${id}`);

    try {
        const orderDoc = await db.collection('orders').doc(id).get();

        if (!orderDoc.exists) {
            console.error(`[GET /api/orders/:id] Order not found for ID: ${id}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        console.log(`[GET /api/orders/:id] Order found:`, orderData);

        res.status(200).json(orderData);
    } catch (error) {
        console.error(`[GET /api/orders/:id] Error fetching order: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

module.exports = router;