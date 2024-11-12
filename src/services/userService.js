// src/services/userService.js
import { auth, db } from '../firebaseConfig'; // Use the right import for the Firestore instance
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Update user status in Firestore
export const updateUserStatus = async (userId, newStatus) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { status: newStatus });
    console.log('User status updated to:', newStatus);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    // Set the user status to active by default
    await addUserToFirestore(userId, { ...userData, status: 'active' });
    console.log('User registered and added to Firestore');
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Add a user to Firestore
export const addUserToFirestore = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), userData);
    console.log('User added to Firestore');
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
  }
};

// Update user in Firestore
export const updateUserInFirestore = async (userId, userData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, userData);
    console.log('User updated in Firestore:', userData);
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error;
  }
};

// Fetch all users from Firestore
export const fetchUsers = async () => {
  try {
    const userCollectionRef = collection(db, 'users'); // Use db here
    const userSnapshot = await getDocs(userCollectionRef);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(userList); // Display the fetched users
    return userList;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Throw error to handle it where this function is called
  }
};

// Fetch a specific user document from Firestore
export const fetchUserDoc = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
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

// Delete a user from Firestore
export const deleteUserFromFirestore = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('User deleted from Firestore');
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error;
  }
};
