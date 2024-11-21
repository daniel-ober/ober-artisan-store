const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Create a new order
router.post('/', async (req, res) => {
    try {
        const order = req.body;
        const ref = await db.collection('orders').add({
            ...order,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({ id: ref.id, ...order });
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({ error: 'Failed to create order.' });
    }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const snapshot = await db.collection('orders').where('userId', '==', req.params.userId).get();
        if (snapshot.empty) return res.status(404).json({ error: 'No orders found.' });

        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});
