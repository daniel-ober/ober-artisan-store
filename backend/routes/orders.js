const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

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

module.exports = router;
