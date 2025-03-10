// src/services/cartService.js

import { firestore } from '../firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import axios from 'axios'; // Added for making API requests

// Ensure Axios is configured with the correct base URL
axios.defaults.baseURL = 'http://localhost:4949'; // Update this if your backend URL is different

const cartCollection = (userId) => collection(firestore, 'carts', userId, 'items');
const productCollection = collection(firestore, 'products'); // Assumes products are stored in a Firestore collection

/**
 * Add an item to the cart after validating stock levels
 */
export const addItemToCart = async (userId, productId, quantity) => {
  try {
    // Fetch product details
    const productRef = doc(productCollection, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error('Product does not exist');
    }

    const productData = productSnap.data();
    const availableStock = productData.currentQuantity || 0;

    // Check if enough stock is available
    if (quantity > availableStock) {
      throw new Error('Not enough stock available');
    }

    // Add item to cart
    const itemRef = doc(cartCollection(userId), productId);
    await setDoc(itemRef, { quantity }, { merge: true });

    console.log(`✅ Item ${productId} added to cart for user: ${userId}`);

    return { success: true, message: 'Item added to cart successfully' };
  } catch (error) {
    console.error('❌ Error adding item to cart:', error.message);
    throw error;
  }
};

/**
 * Fetch all items in the cart
 */
export const getCartItems = async (userId) => {
  try {
    const itemsRef = cartCollection(userId);
    const q = query(itemsRef);
    const querySnapshot = await getDocs(q);

    console.log(`📦 Retrieved ${querySnapshot.size} items from cart for user: ${userId}`);

    return querySnapshot.docs.map((doc) => ({ productId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error fetching cart items:', error.message);
    throw error;
  }
};

/**
 * Remove an item from the cart
 */
export const removeItemFromCart = async (userId, productId) => {
  try {
    const itemRef = doc(cartCollection(userId), productId);
    await deleteDoc(itemRef);

    console.log(`🗑️ Removed item ${productId} from cart for user: ${userId}`);

    return { success: true, message: 'Item removed from cart' };
  } catch (error) {
    console.error('❌ Error removing item from cart:', error.message);
    throw error;
  }
};

/**
 * Clear all items in the cart
 */
export const clearCart = async (userId) => {
  try {
    console.log(`🗑️ Clearing cart for user: ${userId}...`);

    const itemsRef = cartCollection(userId);
    const q = query(itemsRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`🛒 No items found in cart for user: ${userId}, nothing to clear.`);
      return { success: true, message: 'Cart was already empty.' };
    }

    const batch = writeBatch(firestore);
    querySnapshot.docs.forEach((doc) => {
      console.log(`❌ Deleting cart item: ${doc.id}`);
      batch.delete(doc.ref);
    });

    // Commit batch
    try {
      await batch.commit();
      console.log(`✅ Cart successfully cleared for user: ${userId}`);
    } catch (err) {
      console.error("❌ Firestore Batch Commit Failed when clearing cart:", err.message);
    }

    return { success: true, message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('❌ Error clearing cart:', error.message);
    throw error;
  }
};

/**
 * Fetch carts not updated in the past 5 days and their total count
 */
export const getCartsWithNotificationCount = async () => {
  try {
    console.log('Fetching carts with notification count...');
    const response = await axios.get('/api/carts'); // Ensure baseURL is configured
    console.log('📊 Carts API Response:', response.data);
    return response.data; // Returns an object with totalCount and carts
  } catch (error) {
    console.error('❌ Error in getCartsWithNotificationCount:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch carts with notification count'
    );
  }
};