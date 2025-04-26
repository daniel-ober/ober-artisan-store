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
  runTransaction,
} from 'firebase/firestore';

// **Fetch all products**
export const fetchProducts = async () => {
  const collectionsToFetch = ['products', 'merchProducts'];
  let allProducts = [];

  for (const collectionName of collectionsToFetch) {
    const col = collection(db, collectionName);
    const snapshot = await getDocs(col);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      collection: collectionName, // 🔍 add context to help admin screen
    }));
    allProducts = allProducts.concat(products);
  }

  return allProducts;
};

// ✅ **Fetch a single product by ID (searches both collections)**
export const fetchProductById = async (productId) => {
  console.log('🔍 Fetching productId:', productId);

  const tryFetch = async (collectionName) => {
    const ref = doc(db, collectionName, productId);
    const snapshot = await getDoc(ref);
    console.log(`🔎 Checked ${collectionName} for ID ${productId} — Exists?`, snapshot.exists());
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  };

  const fromMerch = await tryFetch("merchProducts");
  if (fromMerch) return fromMerch;

  const fromProducts = await tryFetch("products");
  if (fromProducts) return fromProducts;

  throw new Error(`❌ Product with ID ${productId} not found in any collection.`);
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
  if (!productId) throw new Error("❌ Product ID is required.");

  const tryUpdate = async (collectionName) => {
    const ref = doc(db, collectionName, productId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { status: newStatus });
      return true;
    }
    return false;
  };

  const updatedInProducts = await tryUpdate("products");
  if (updatedInProducts) return;

  const updatedInMerch = await tryUpdate("merchProducts");
  if (updatedInMerch) return;

  throw new Error(`❌ Product with ID ${productId} not found in any collection.`);
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
    await runTransaction(db, async (transaction) => {
      for (const item of cartItems) {
        if (!item.productId) {
          console.error("❌ Invalid product in cart: Missing productId.");
          continue;
        }

        const productRef = doc(db, "products", item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
          continue;
        }

        const productData = productDoc.data();

        if (productData.currentQuantity < item.quantity) {
          console.warn(`⚠️ Not enough stock for ${productData.name}. Requested: ${item.quantity}, Available: ${productData.currentQuantity}`);
          continue;
        }

        const newQuantity = Math.max(0, productData.currentQuantity - item.quantity);
        const isAvailable = newQuantity > 0;
        const availabilityMessage = isAvailable ? "In Stock" : "Out of Stock";

        transaction.update(productRef, {
          currentQuantity: newQuantity,
          isAvailable,
          availabilityMessage,
        });
      }
    });

    return { success: true, message: "Inventory updated successfully." };
  } catch (error) {
    console.error("❌ Error updating inventory:", error.message);
    return { success: false, message: error.message };
  }
};