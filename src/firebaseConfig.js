// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import {
  getAnalytics, logEvent, isSupported, setUserProperties,
} from 'firebase/analytics';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  arrayUnion, collection, addDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// 👇 App Check (Enterprise)
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize core app
const app = initializeApp(firebaseConfig);

/**
 * APP CHECK (reCAPTCHA Enterprise)
 * --------------------------------
 * - Works in prod and localhost.
 * - In dev, we enable a debug token so Firestore/WebChannel calls don’t get blocked.
 * - Set REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY in your .env[.local]
 * - Optional: set REACT_APP_APPCHECK_DEBUG_TOKEN to a fixed token string, otherwise we auto-generate one.
 */
const siteKey = process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY;

// Enable a debug token in non-production so you can register it in Firebase Console → App Check → Debug tokens
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // If you already created a token in Console, put it in .env as REACT_APP_APPCHECK_DEBUG_TOKEN
  // Otherwise, 'true' makes the SDK print a new token once, which you then paste into Console.
  // eslint-disable-next-line no-undef
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    process.env.REACT_APP_APPCHECK_DEBUG_TOKEN || true;
}

if (typeof window !== 'undefined' && siteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Analytics (only in production, when supported)
let analytics = null;
if (typeof window !== 'undefined'
  && process.env.NODE_ENV === 'production'
  && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      logEvent(analytics, 'page_view');
    }
  });
}

export const setAnalyticsUserProperties = (userType) => {
  if (analytics && typeof userType === 'string') {
    setUserProperties(analytics, { user_type: userType });
  }
};

// 🔧 Core services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
export const signOut = firebaseSignOut;
export { app, analytics, logEvent };

// ========== UTILITY METHODS ==========
export const fetchGalleryImages = async () => {
  try {
    const galleryRef = ref(storage, 'Gallery/');
    const galleryList = await listAll(galleryRef);
    return Promise.all(galleryList.items.map((item) => getDownloadURL(item)));
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