import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, addDoc, collection } from 'firebase/firestore';
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
export const db = getFirestore(app); // Export the Firestore instance
export const auth = getAuth(app); // Initialize and export Firebase Auth
export const storage = getStorage(app); // Initialize and export Firebase Storage
export const signOut = firebaseSignOut; // Export signOut function

// Function to get user document data
export const getUserDoc = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId); // Use db instead of firestore
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
    const cartRef = doc(db, 'carts', userId); // Use db instead of firestore
    await setDoc(cartRef, {
      items: []
    });
    console.log(`Cart created with ID: ${userId}`); // Debugging log
    return userId;
  } catch (error) {
    console.error('Error creating cart:', error);
  }
};

// Function to add an item to a cart
export const addItemToCart = async (userId, item) => {
  try {
    const cartRef = doc(db, 'carts', userId); // Use db instead of firestore
    await updateDoc(cartRef, {
      items: arrayUnion(item)
    });
    console.log(`Item added to cart for user ID: ${userId}`, item); // Debugging log
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
};

// // Function to test Firestore connection
// export const testFirestoreConnection = async () => {
//   try {
//     const docRef = await addDoc(collection(db, 'test'), { // Use db instead of firestore
//       message: 'This is a test message',
//       timestamp: new Date(),
//     });
//     console.log('Test document written with ID:', docRef.id);
//   } catch (e) {
//     console.error('Error adding test document:', e);
//   }
// };

// // Call the test function to confirm Firestore connection
// testFirestoreConnection();
