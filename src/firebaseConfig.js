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

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const signOut = firebaseSignOut;

export const fetchGalleryImages = async () => {
  try {
    const galleryRef = ref(storage, 'Gallery/');
    const galleryList = await listAll(galleryRef);
    return await Promise.all(galleryList.items.map((item) => getDownloadURL(item)));
  } catch (error) {
    console.error('❌ Error fetching gallery images:', error);
    throw error;
  }
};

export const getUserDoc = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
  } catch (error) {
    console.error('❌ Error getting user document:', error);
    throw error;
  }
};

export const createCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, { items: [], createdAt: Timestamp.now() });
    return userId;
  } catch (error) {
    console.error('❌ Error creating cart:', error);
    throw error;
  }
};

export const addItemToCart = async (userId, item) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await updateDoc(cartRef, { items: arrayUnion(item) });
  } catch (error) {
    console.error('❌ Error adding item to cart:', error);
    throw error;
  }
};

export const getCartItems = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    return cartSnap.exists() ? cartSnap.data().items || [] : [];
  } catch (error) {
    console.error('❌ Error fetching cart items:', error);
    throw error;
  }
};

export const saveOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const orderDoc = await addDoc(ordersRef, { ...orderData, createdAt: Timestamp.now() });
    return orderDoc.id;
  } catch (error) {
    console.error('❌ Error saving order:', error);
    throw error;
  }
};

export const clearCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    await deleteDoc(cartRef);
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    throw error;
  }
};

export { app };