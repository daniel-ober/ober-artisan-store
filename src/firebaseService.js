// src/firebaseService.js

import { firestore } from './firebaseConfig'; // Correct import for firestore
import { doc, getDoc } from 'firebase/firestore';

export const fetchUserProfile = async (userId) => {
  try {
    const userDocRef = doc(firestore, `users/${userId}`); // Correct Firestore document path
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};
