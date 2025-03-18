// functions/src/updateInventory.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// **Ensure Cloud Function is correctly structured**
exports.updateInventory = functions
    .region("us-central1")
    .https.onCall(async (data) => { // Removed 'context' parameter
        // console.log("🔥 updateInventory function triggered.");

        if (!data || !data.cartItems || !data.userId) {
            console.error("❌ Invalid data received.");
            throw new functions.https.HttpsError("invalid-argument", "No cart items or userId provided.");
        }

        const { cartItems, userId } = data;
        // console.log("📦 Received Cart Items:", cartItems);
        // console.log("👤 User ID:", userId);

        const batch = db.batch();

        try {
            for (const item of cartItems) {
                if (!item.productId || !item.quantity) {
                    console.warn(`⚠️ Invalid item found:`, item);
                    continue;
                }

                // 🔍 Look up product in Firestore using `productId` (NOT `stripeProductId`)
                const productRef = db.collection("products").doc(item.productId);
                const productDoc = await productRef.get();

                if (!productDoc.exists) {
                    console.warn(`⚠️ No Firestore product found for Product ID: ${item.productId}`);
                    continue;
                }

                const productData = productDoc.data();

                // Update Inventory
                const newStock = Math.max(0, productData.currentQuantity - item.quantity);
                // console.log(`🔄 Updating stock for ${productData.name} (${item.productId}): ${productData.currentQuantity} -> ${newStock}`);

                batch.update(productRef, { currentQuantity: newStock });
            }

            // 💨 **Clear User's Cart**
            const cartRef = db.collection("carts").doc(userId);
            // console.log(`🛒 Clearing cart for user: ${userId}`);
            batch.delete(cartRef);

            // ✅ Commit Firestore Batch
            await batch.commit();
            // console.log("✅ Firestore Batch Commit Successful! Cart cleared.");

            return { success: true, message: "Inventory updated and cart cleared." };
        } catch (error) {
            console.error("❌ Error updating inventory:", error.message);
            throw new functions.https.HttpsError("internal", error.message);
        }
    });