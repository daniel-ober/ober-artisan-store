import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use environment variables to configure Firebase
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
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app); // Initialize Firestore
export const storage = getStorage(app);
export const signOut = firebaseSignOut; // Export signOut

// Export Firestore database instance for use in other files
export const db = firestore;

// Add getUserDoc function
export const getUserDoc = async (userId) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      console.log('User Data:', userDocSnap.data());
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

// Function to create a cart for a specific user
export const createCart = async (userId) => {
  try {
    const cartRef = doc(firestore, 'carts', userId);
    await setDoc(cartRef, {
      items: []
    });
    return userId;
  } catch (error) {
    console.error('Error creating cart:', error);
  }
};

// Function to add an item to a cart
export const addItemToCart = async (userId, item) => {
  try {
    const cartRef = doc(firestore, 'carts', userId);
    await updateDoc(cartRef, {
      items: arrayUnion(item)
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
};

// Function to test Firestore connection
export const testFirestoreConnection = async () => {
  try {
    const docRef = await addDoc(collection(firestore, 'test'), {
      message: 'This is a test message',
      timestamp: new Date(),
    });
    console.log('Test document written with ID:', docRef.id);
  } catch (e) {
    console.error('Error adding test document:', e);
  }
};

// Call the test function to confirm Firestore connection
testFirestoreConnection();