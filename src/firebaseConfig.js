// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAnalytics, logEvent, isSupported, setUserProperties,
} from 'firebase/analytics';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  arrayUnion, collection, addDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
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

// ✅ Singleton app
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* ------------------------------- App Check -------------------------------- */
const siteKey = process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
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

/* -------------------------------- Analytics ------------------------------- */
let analytics = null;
if (typeof window !== 'undefined'
  && process.env.NODE_ENV === 'production'
  && firebaseConfig.measurementId) {
  isSupported().then((ok) => {
    if (ok) {
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

/* ------------------------------- Core SDKs -------------------------------- */
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Cloud Functions
 * ---------------
 * MUST match your deployed region or the callable won’t be found.
 * Set REACT_APP_FUNCTIONS_REGION in .env (defaults to 'us-central1').
 */
const FUNCTIONS_REGION = process.env.REACT_APP_FUNCTIONS_REGION || 'us-central1';
export const functions = getFunctions(app, FUNCTIONS_REGION);

/* ------------------------------- Debug logs ------------------------------- */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('[firebase] projectId(app):', app.options?.projectId);
  console.log('[firebase] projectId(auth):', auth.app?.options?.projectId);
  console.log('[firebase] projectId(db):', db.app?.options?.projectId);
  console.log('[firebase] Functions region:', FUNCTIONS_REGION);
}

export const signOut = firebaseSignOut;
export { analytics, logEvent };

/* ------------------------------- Utilities -------------------------------- */
export const fetchGalleryImages = async () => {
  const galleryRef = ref(storage, 'Gallery/');
  const galleryList = await listAll(galleryRef);
  return Promise.all(galleryList.items.map((item) => getDownloadURL(item)));
};

export const getUserDoc = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  return snap.exists() ? snap.data() : null;
};

export const createCart = async (userId) => {
  const cartRef = doc(db, 'carts', userId);
  await setDoc(cartRef, { items: [], createdAt: Timestamp.now() });
  return userId;
};

export const addItemToCart = async (userId, item) => {
  const cartRef = doc(db, 'carts', userId);
  await updateDoc(cartRef, { items: arrayUnion(item) });
};

export const getCartItems = async (userId) => {
  const cartRef = doc(db, 'carts', userId);
  const snap = await getDoc(cartRef);
  return snap.exists() ? snap.data().items || [] : [];
};

export const saveOrder = async (orderData) => {
  const ordersRef = collection(db, 'orders');
  const orderDoc = await addDoc(ordersRef, { ...orderData, createdAt: Timestamp.now() });
  return orderDoc.id;
};

export const clearCart = async (userId) => {
  const cartRef = doc(db, 'carts', userId);
  await deleteDoc(cartRef);
};