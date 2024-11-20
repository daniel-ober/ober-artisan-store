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
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Optional: Initialize Analytics

// Initialize and export Firestore, Auth, and Storage instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const signOut = firebaseSignOut;

// Fetch user document data
export const getUserDoc = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.error('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

// Create a cart for a specific user
export const createCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, { items: [] });
    console.log(`Cart created for user: ${userId}`);
    return userId;
  } catch (error) {
    console.error('Error creating cart:', error);
  }
};

// Add an item to a cart
export const addItemToCart = async (userId, item) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await updateDoc(cartRef, { items: arrayUnion(item) });
    console.log(`Item added to cart for user: ${userId}`, item);
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
};

// Fetch cart items for a specific user
export const getCartItems = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      return cartSnap.data().items || [];
    } else {
      console.error('No cart found for user:', userId);
      return [];
    }
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};

// Delete an item from a cart
export const deleteCartItem = async (userId, itemId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      const updatedItems = cartSnap
        .data()
        .items.filter((item) => item.id !== itemId);
      await updateDoc(cartRef, { items: updatedItems });
      console.log(`Item deleted from cart for user: ${userId}`);
    }
  } catch (error) {
    console.error('Error deleting item from cart:', error);
  }
};

// Save an order to Firestore
export const saveOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const orderDoc = await addDoc(ordersRef, { ...orderData, createdAt: new Date() });
    console.log('Order saved with ID:', orderDoc.id);
    return orderDoc.id;
  } catch (error) {
    console.error('Error saving order:', error);
    return null;
  }
};

// Fetch order details by session ID
export const getOrderBySessionId = async (sessionId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('stripeSessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    console.error('No order found for session ID:', sessionId);
    return null;
  } catch (error) {
    console.error('Error fetching order by session ID:', error);
    return null;
  }
};

// Remove a cart after checkout
export const clearCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await deleteDoc(cartRef);
    console.log(`Cart cleared for user: ${userId}`);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};
