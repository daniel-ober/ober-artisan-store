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

// Use your hosted Functions base when available; fall back to the deployed URL you already use.
const API_BASE =
  import.meta.env?.VITE_FUNCTIONS_BASE_URL ||
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

// ───────────────────────────────────────────────────────────────────────────────
// Printify ⇄ Stripe admin helpers (used by AddMerchFromPrintifyModal)

export async function fetchPrintifyCatalog() {
  const res = await fetch(`${API_BASE}/printify/catalog`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to fetch Printify catalog');
  return res.json(); // { products: [...] }
}

export async function ingestPrintifyProduct({ printifyProductId, titleOverride, marginPercent = 0, active = true }) {
  const res = await fetch(`${API_BASE}/admin/merch/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printifyProductId, titleOverride, marginPercent, active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok: true, merchProduct }
}

// Manual stock refresh: prefer new /api route; fall back to your existing refreshPrintifyStockNow endpoint.
export async function triggerPrintifyStockRefresh() {
  // Try the new fast endpoint first
  try {
    const res = await fetch(`${API_BASE}/admin/merch/refresh-stock`, { method: 'POST' });
    if (res.ok) return res.json();
  } catch (_) {
    // ignore and try fallback
  }
  // Fallback to your existing function you already wired in the UI
  const fallback = 'https://us-central1-danoberartisandrums.cloudfunctions.net/refreshPrintifyStockNow';
  const r2 = await fetch(fallback, { method: 'POST' });
  if (!r2.ok) throw new Error('Failed to refresh Printify stock');
  // That endpoint returns text
  return { ok: true, message: await r2.text() };
}

// ───────────────────────────────────────────────────────────────────────────────
// Firestore product helpers

// Fetch all products from both collections
export const fetchProducts = async () => {
  const collectionsToFetch = ['products', 'merchProducts'];
  let allProducts = [];

  for (const collectionName of collectionsToFetch) {
    const col = collection(db, collectionName);
    const snapshot = await getDocs(col);
    const products = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      collection: collectionName, // helps the admin screen
    }));
    allProducts = allProducts.concat(products);
  }
  return allProducts;
};

// Fetch a single product by id (checks merchProducts, then products)
export const fetchProductById = async (productId) => {
  const tryFetch = async (collectionName) => {
    const ref = doc(db, collectionName, productId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  };
  const fromMerch = await tryFetch('merchProducts');
  if (fromMerch) return fromMerch;
  const fromProducts = await tryFetch('products');
  if (fromProducts) return fromProducts;
  throw new Error(`❌ Product with ID ${productId} not found in any collection.`);
};

// Add a new artisan product
export const addProduct = async (productData) => {
  const productsCollection = collection(db, 'products');
  const docRef = await addDoc(productsCollection, productData);
  return docRef.id;
};

// Update product (artisan collection)
export const updateProduct = async (productId, updatedData) => {
  if (!productId) throw new Error('❌ Product ID is required.');
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, updatedData);
};

// Update status across either collection
export const updateProductStatus = async (productId, newStatus) => {
  if (!productId) throw new Error('❌ Product ID is required.');

  const tryUpdate = async (collectionName) => {
    const ref = doc(db, collectionName, productId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { status: newStatus });
      return true;
    }
    return false;
  };

  if (await tryUpdate('products')) return;
  if (await tryUpdate('merchProducts')) return;

  throw new Error(`❌ Product with ID ${productId} not found in any collection.`);
};

// Delete (artisan). If you need to delete merch too, you can extend this to check merchProducts.
export const deleteProduct = async (productId) => {
  if (!productId) throw new Error('❌ Product ID is required.');
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

// ───────────────────────────────────────────────────────────────────────────────
// INVENTORY HELPERS — split into two clear use-cases

// (A) Single-doc patch (used by ManageProducts for manual edits)
export async function updateProductInventory(productId, patch) {
  // Only touches 'products' collection (artisan path); your merch is auto-synced
  if (!productId || typeof patch !== 'object' || !patch) {
    throw new Error('❌ Missing productId or patch.');
  }
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, patch);
}

// (B) Transactional decrement after checkout (your previous implementation)
export const decrementInventoryAfterCheckout = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    console.warn('⚠️ No cart items provided for inventory update. Skipping.');
    return { success: false, message: 'No valid cart items to update.' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      for (const item of cartItems) {
        if (!item.productId) {
          console.error('❌ Invalid product in cart: Missing productId.');
          continue;
        }
        // Only artisan inventory is managed here; merch is Printify-managed.
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
          continue;
        }

        const productData = productDoc.data();
        if (productData.currentQuantity < item.quantity) {
          console.warn(
            `⚠️ Not enough stock for ${productData.name}. Requested: ${item.quantity}, Available: ${productData.currentQuantity}`
          );
          continue;
        }

        const newQuantity = Math.max(0, productData.currentQuantity - item.quantity);
        const isAvailable = newQuantity > 0;
        const availabilityMessage = isAvailable ? 'In Stock' : 'Out of Stock';

        transaction.update(productRef, {
          currentQuantity: newQuantity,
          isAvailable,
          availabilityMessage,
        });
      }
    });

    return { success: true, message: 'Inventory updated successfully.' };
  } catch (error) {
    console.error('❌ Error updating inventory:', error.message);
    return { success: false, message: error.message };
  }
};