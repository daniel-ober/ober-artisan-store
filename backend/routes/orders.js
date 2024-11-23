const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Middleware for admin authentication
const isAdmin = async (req, res, next) => {
    const userId = req.headers['x-user-id']; // Replace with your authentication header
    if (!userId) return res.status(401).json({ error: "Unauthorized access" });

    try {
        const user = await admin.auth().getUser(userId);
        if (user.customClaims?.admin) {
            next();
        } else {
            res.status(403).json({ error: "Forbidden: Admin access required" });
        }
    } catch (error) {
        res.status(403).json({ error: "Invalid user credentials" });
    }
};

// Create a new order
router.post('/', async (req, res) => {
    const { customerName, total, items, userId } = req.body;
    if (!customerName || !total || !items || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
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
        console.error("Error creating order:", error.message);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// Admin-only route: Get all orders
router.get('/all', isAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('orders').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const snapshot = await db.collection('orders').where('userId', '==', userId).get();
        if (snapshot.empty) return res.status(404).json({ error: "No orders found" });

        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

module.exports = router;
