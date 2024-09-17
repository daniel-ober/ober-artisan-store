// src/services/userService.js
import { firestore } from '../firebaseConfig'; // Single import statement
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// Add user to Firestore
export const addUserToFirestore = async (userId, userData) => {
  try {
    await setDoc(doc(firestore, 'users', userId), userData);
    console.log('User added to Firestore');
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
  }
};

// Fetch all users from Firestore
export const fetchUsers = async () => {
  try {
    const usersCollectionRef = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Fetch user document from Firestore
export const fetchUserDoc = async (userId) => {
  try {
    const docRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null;
  }
};
