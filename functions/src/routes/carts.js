const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// GET /api/carts - Fetch all carts for the badge notification value
router.get("/", async (req, res) => {
    try {
        // Fetch all carts from the Firestore collection
        const cartsSnapshot = await db.collection("carts").get();

        if (cartsSnapshot.empty) {
            // console.log("No carts found in Firestore.");
            return res.status(200).json({ totalCount: 0, carts: [] });
        }

        // Process and map the fetched carts
        const allCarts = cartsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const lastUpdated = data.lastUpdated ? data.lastUpdated.toDate() : null;

            // Safeguard against missing or malformed `cart` data
            const cartItems = data.cart && typeof data.cart === "object" ? Object.entries(data.cart) : [];

            return {
                id: doc.id,
                userId: data.userId,
                userEmail: data.userEmail || "No Email",
                lastUpdated,
                cart: cartItems.map(([itemId, item]) => ({
                    id: itemId,
                    name: item.name || "Unnamed Item",
                    price: item.price || 0,
                    quantity: item.quantity || 0,
                    images: item.images || [],
                    category: item.category || "unknown",
                    status: item.status || "inactive",
                })),
            };
        });

        // console.log("All Carts Count:", allCarts.length); // Debugging
        // console.log("All Carts Details:", allCarts); // Debugging

        // Return the count of all carts, along with the cart details
        res.status(200).json({
            totalCount: allCarts.length,
            carts: allCarts,
        });
    } catch (error) {
        console.error("Error fetching carts:", error.message, error.stack);
        res.status(500).json({
            error: "Failed to fetch carts",
            details: error.message,
        });
    }
});

module.exports = router;