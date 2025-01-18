
// functions/src/updateInventory.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

const updateInventory = functions.https.onCall(async (data, context) => {
  const { cartItems } = data;
  const batch = db.batch();

  try {
    for (const item of cartItems) {
      const productRef = db.collection("products").doc(item.productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        throw new Error(`Product with ID ${item.productId} does not exist.`);
      }

      const productData = productDoc.data();

      if (productData.currentQuantity < item.quantity) {
        throw new Error(
          `Not enough stock for ${productData.name}. Available: ${productData.currentQuantity}, Requested: ${item.quantity}`
        );
      }

      const newQuantity = productData.currentQuantity - item.quantity;
      const isAvailable = newQuantity > 0;
      const availabilityMessage = isAvailable
        ? "In Stock"
        : "Out of Stock";

      batch.update(productRef, {
        currentQuantity: newQuantity,
        isAvailable,
        availabilityMessage,
      });
    }

    await batch.commit();
    return { success: true, message: "Inventory updated successfully." };
  } catch (error) {
    console.error("Error updating inventory:", error.message);
    throw new functions.https.HttpsError(
      "failed-precondition",
      error.message
    );
  }
});

module.exports = updateInventory;