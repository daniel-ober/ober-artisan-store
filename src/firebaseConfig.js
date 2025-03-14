// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

// Firebase configurations for each environment
const firebaseConfigs = {
  dev: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  },
  stg: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  },
  prod: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  },
};

// Determine the current environment
const environment = process.env.REACT_APP_ENV || 'dev';
const firebaseConfig = firebaseConfigs[environment];

// Debugging: Log Firebase configuration in development
if (process.env.NODE_ENV === 'development') {
  // console.log('Firebase Config for Environment:', environment, firebaseConfig);
}

// Validate Firebase configuration
if (!firebaseConfig.projectId) {
  throw new Error('Firebase configuration is missing the "projectId" value.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const signOut = firebaseSignOut;

// Utility Functions

/**
 * Fetch and display all gallery images from the Firebase Storage
 * @returns {Promise<string[]>} - List of gallery image URLs
 */
export const fetchGalleryImages = async () => {
  try {
    const galleryRef = ref(storage, 'Gallery/');
    const galleryList = await listAll(galleryRef);

    const imageUrls = await Promise.all(
      galleryList.items.map((item) => getDownloadURL(item))
    );

    console.log('Fetched Gallery Images:', imageUrls);
    return imageUrls;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

/**
 * Fetch user document data.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} - User data or null if not found.
 */
export const getUserDoc = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    console.error('No such document!');
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Create a cart for a specific user.
 * @param {string} userId - The user ID.
 * @returns {Promise<string>} - User ID if successful.
 */
export const createCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, { items: [], createdAt: Timestamp.now() });
    console.log(`Cart created for user: ${userId}`);
    return userId;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
};

/**
 * Add an item to a user's cart.
 * @param {string} userId - The user ID.
 * @param {Object} item - The item to add.
 */
export const addItemToCart = async (userId, item) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await updateDoc(cartRef, { items: arrayUnion(item) });
    console.log(`Item added to cart for user: ${userId}`, item);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

/**
 * Fetch cart items for a specific user.
 * @param {string} userId - The user ID.
 * @returns {Promise<Array>} - Array of cart items.
 */
export const getCartItems = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      return cartSnap.data().items || [];
    }
    console.error('No cart found for user:', userId);
    return [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }
};

/**
 * Save an order to Firestore.
 * @param {Object} orderData - The order data.
 * @returns {Promise<string|null>} - Order ID or null if failed.
 */
export const saveOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const orderDoc = await addDoc(ordersRef, { ...orderData, createdAt: Timestamp.now() });
    console.log('Order saved with ID:', orderDoc.id);
    return orderDoc.id;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

/**
 * Clear a user's cart after checkout.
 * @param {string} userId - The user ID.
 */
export const clearCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await deleteDoc(cartRef);
    console.log(`Cart cleared for user: ${userId}`);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};
export { app }; // ✅ Ensure this is exported

// console.log('Environment:', environment);
// console.log('Firebase Project:', firebaseConfig.projectId);
// console.log("REACT_APP_FIREBASE_PROJECT_ID:", process.env.REACT_APP_FIREBASE_PROJECT_ID);
// console.log("Firebase Config:", firebaseConfigs);
// console.log("Selected Environment:", environment);
// console.log("Firebase Config for Environment:", firebaseConfigs[environment]);