import { auth, firestore } from '../firebaseConfig'; // Ensure correct path to your firebaseConfig
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import to create users

// Create a new user with email and password
export const registerUser = async (email, password, userData) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid; // Get the user's unique ID

    // Add user data to Firestore
    await addUserToFirestore(userId, userData);
    console.log('User registered and added to Firestore');
  } catch (error) {
    console.error('Error registering user:', error);
    throw error; // Rethrow for handling in component
  }
};

// Update user data in Firestore
export const updateUserInFirestore = async (userId, userData) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, userData);
    console.log('User updated in Firestore:', userData); // Log the updated user data
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error; // Rethrow for handling in component
  }
};

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
    console.log('Fetched users:', users); // Log fetched users
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Rethrow the error for handling in the component
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

// Delete user from Firestore
export const deleteUserFromFirestore = async (userId) => {
  try {
    await deleteDoc(doc(firestore, 'users', userId));
    console.log('User deleted from Firestore');
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error; // Rethrow for handling in component
  }
};
