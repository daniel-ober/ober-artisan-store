// src/services/productService.js
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction, // ✅ Firestore transaction for safe inventory updates
} from 'firebase/firestore';

// **Fetch all products**
export const fetchProducts = async () => {
  const productsCollection = collection(db, 'products');
  const productsSnapshot = await getDocs(productsCollection);
  return productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// **Fetch a single product by ID**
export const fetchProductById = async (productId) => {
  if (!productId) {
    throw new Error("❌ Product ID is required.");
  }

  const productRef = doc(db, 'products', productId);
  const productSnapshot = await getDoc(productRef);

  if (!productSnapshot.exists()) {
    throw new Error(`❌ Product with ID ${productId} not found.`);
  }

  return { id: productSnapshot.id, ...productSnapshot.data() };
};

// **Add a new product**
export const addProduct = async (productData) => {
  const productsCollection = collection(db, 'products');
  const docRef = await addDoc(productsCollection, productData);
  return docRef.id;
};

// **Update product fields**
export const updateProduct = async (productId, updatedData) => {
  if (!productId) {
    throw new Error("❌ Product ID is required.");
  }

  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, updatedData);
};

// **Update product status (Active/Inactive)**
export const updateProductStatus = async (productId, newStatus) => {
  if (!productId) {
    throw new Error("❌ Product ID is required.");
  }

  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, { status: newStatus });
};

// **Delete a product**
export const deleteProduct = async (productId) => {
  if (!productId) {
    throw new Error("❌ Product ID is required.");
  }

  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

// ✅ **NEW: Update inventory for multiple products at checkout**
export const updateProductInventory = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    console.warn("⚠️ No cart items provided for inventory update. Skipping.");
    return { success: false, message: "No valid cart items to update." };
  }

  try {
    console.log("📦 Processing inventory update for cart items:", cartItems);

    await runTransaction(db, async (transaction) => {
      for (const item of cartItems) {
        if (!item.productId) {
          console.error("❌ Invalid product in cart: Missing productId.");
          continue;
        }

        // ✅ Get Firestore product reference
        const productRef = doc(db, "products", item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
          continue;
        }

        const productData = productDoc.data();
        console.log(`🔍 Checking inventory for ${productData.name}: ${productData.currentQuantity} in stock`);

        // **Prevent Overselling** (but don't stop the transaction)
        if (productData.currentQuantity < item.quantity) {
          console.warn(`⚠️ Not enough stock for ${productData.name}. Requested: ${item.quantity}, Available: ${productData.currentQuantity}`);
          continue; // Skip updating this product, but continue others
        }

        const newQuantity = Math.max(0, productData.currentQuantity - item.quantity);
        const isAvailable = newQuantity > 0;
        const availabilityMessage = isAvailable ? "In Stock" : "Out of Stock";

        // ✅ **Update the product's inventory**
        transaction.update(productRef, {
          currentQuantity: newQuantity,
          isAvailable,
          availabilityMessage,
        });

        console.log(`✅ Inventory updated for ${productData.name}: New Quantity = ${newQuantity}`);
      }
    });

    console.log("✅ Inventory successfully updated!");
    return { success: true, message: "Inventory updated successfully." };
  } catch (error) {
    console.error("❌ Error updating inventory:", error.message);
    return { success: false, message: error.message };
  }
};