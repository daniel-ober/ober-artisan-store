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

const cartCollection = (userId) => collection(firestore, `carts/${userId}/items`);
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

    // Optionally decrement stock in Firestore
    await setDoc(productRef, { currentQuantity: availableStock - quantity }, { merge: true });

    return { success: true, message: 'Item added to cart successfully' };
  } catch (error) {
    console.error('Error adding item to cart:', error.message);
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
    return querySnapshot.docs.map((doc) => ({ productId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching cart items:', error.message);
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
    return { success: true, message: 'Item removed from cart' };
  } catch (error) {
    console.error('Error removing item from cart:', error.message);
    throw error;
  }
};

/**
 * Clear all items in the cart
 */
export const clearCart = async (userId) => {
  try {
    const itemsRef = cartCollection(userId);
    const q = query(itemsRef);
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(firestore);
    querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return { success: true, message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    throw error;
  }
};