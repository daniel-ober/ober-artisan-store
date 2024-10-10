const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firestore is initialized
const db = admin.firestore();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = [];
        const listUsersResult = await admin.auth().listUsers();
        
        listUsersResult.users.forEach(user => {
            users.push({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                // Add more fields as necessary
            });
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const userRecord = await admin.auth().getUser(userId);
        res.status(200).json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            // Add more fields as necessary
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(404).json({ error: 'User not found.' });
    }
});

// Function to set custom claims
const setUserRole = async (userId, isAdmin) => {
    await admin.auth().setCustomUserClaims(userId, { isAdmin });
};

// Update user role (e.g., set custom claims)
router.post('/:id/role', async (req, res) => {
    const userId = req.params.id;
    const { isAdmin } = req.body; // Expecting { isAdmin: true/false }

    try {
        // Set the user's custom claims
        await setUserRole(userId, isAdmin);
        res.status(200).json({ message: 'User role updated successfully.' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role.' });
    }
});

module.exports = router;
