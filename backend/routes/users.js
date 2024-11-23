const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Middleware for role-based access
const isAdmin = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
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

// Update user role
router.post('/:id/role', isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { isAdmin } = req.body;

    try {
        await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });
        res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Error updating user role:", error.message);
        res.status(500).json({ error: "Failed to update user role" });
    }
});
