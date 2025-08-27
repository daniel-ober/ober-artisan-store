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

// Hosted Functions base (override in .env if needed)
const API_BASE =
  import.meta.env?.VITE_FUNCTIONS_BASE_URL ||
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

/* ──────────────────────────────────────────────────────────────────────────
   Printify ⇄ Stripe admin helpers (used by AddMerchFromPrintifyModal)
   ────────────────────────────────────────────────────────────────────────── */

export async function fetchPrintifyCatalog() {
  const res = await fetch(`${API_BASE}/printify/catalog`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to fetch Printify catalog');
  return res.json(); // { products: [...] }
}

export async function ingestPrintifyProduct({
  printifyProductId,
  titleOverride,
  marginPercent = 0,
  active = true,
}) {
  const res = await fetch(`${API_BASE}/admin/merch/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printifyProductId, titleOverride, marginPercent, active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok: true, merchProduct }
}

/** Trigger a Printify stock refresh in the backend. */
export async function triggerPrintifyStockRefresh() {
  // Preferred endpoint (new)
  try {
    const res = await fetch(`${API_BASE}/admin/merch/refresh-stock`, { method: 'POST' });
    if (res.ok) return res.json();
  } catch {
    /* fall through */
  }
  // Fallback to legacy callable HTTP function you already expose
  const fallback =
    'https://us-central1-danoberartisandrums.cloudfunctions.net/refreshPrintifyStockNow';
  const r2 = await fetch(fallback, { method: 'POST' });
  if (!r2.ok) throw new Error('Failed to refresh Printify stock');
  return { ok: true, message: await r2.text() };
}

/* ──────────────────────────────────────────────────────────────────────────
   Firestore product helpers
   ────────────────────────────────────────────────────────────────────────── */

/** Fetch all products from both collections for the Admin table. */
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

/** Fetch a single product by id (tries merchProducts then products). */
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

/** Add a new artisan product. */
export const addProduct = async (productData) => {
  const productsCollection = collection(db, 'products');
  const docRef = await addDoc(productsCollection, productData);
  return docRef.id;
};

/** Update artisan product (products collection). */
export const updateProduct = async (productId, updatedData) => {
  if (!productId) throw new Error('❌ Product ID is required.');
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, updatedData);
};

/** Update status for a product in either collection. */
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

/** Soft delete (artisan only). */
export const deleteProduct = async (productId) => {
  if (!productId) throw new Error('❌ Product ID is required.');
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

/* ──────────────────────────────────────────────────────────────────────────
   Inventory helpers
   ────────────────────────────────────────────────────────────────────────── */

/** Single-doc patch for artisan inventory (admin edits). */
export async function updateProductInventory(productId, patch) {
  if (!productId || typeof patch !== 'object' || !patch) {
    throw new Error('❌ Missing productId or patch.');
  }
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, patch);
}

/** Transactional decrement after checkout (artisan products only). */
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

/* ──────────────────────────────────────────────────────────────────────────
   HARD DELETE (admin only)
   Calls your Cloud Functions HTTP endpoint to:
   - remove Firestore doc (products or merchProducts),
   - clean up Stripe product/prices,
   - attempt Printify cleanup where applicable.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Hard delete a product by ID.
 * @param {string} productId - The Firestore doc ID.
 * @param {'products'|'merchProducts'} source - Which collection the item lives in.
 * @returns {Promise<object>} backend response
 */
export async function hardDeleteProduct(productId, source = 'merchProducts') {
  if (!productId) throw new Error('❌ productId required');

  // Canonical endpoint; second item is a fallback in case your backend uses the /admin/merch path.
  const endpoints = [
    `${API_BASE}/admin/hard-delete`,
    `${API_BASE}/admin/merch/hard-delete`,
  ];

  let lastErr;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, source }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      return await res.json().catch(() => ({}));
    } catch (e) {
      lastErr = e;
      // try next endpoint in the list
    }
  }
  throw lastErr || new Error('Hard delete failed');
}