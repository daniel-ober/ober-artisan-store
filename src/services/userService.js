import { firestore } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Add user to Firestore
export const addUserToFirestore = async (userId, userData) => {
  try {
    await setDoc(doc(firestore, 'users', userId), userData);
    console.log('User added to Firestore');
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
  }
};
