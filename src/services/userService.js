import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Fetches a user's document from Firestore by userId.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} - The user's document data.
 */
export const fetchUserDoc = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data();
        } else {
            console.error('No user document found for userId:', userId);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user document:', error);
        throw error;
    }
};

/**
 * Updates a user's document in Firestore.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updatedData - The updated user data.
 */
export const updateUserInFirestore = async (userId, updatedData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedData);
    } catch (error) {
        console.error('Error updating user in Firestore:', error);
        throw error;
    }
};

/**
 * Fetches all users from Firestore.
 * @returns {Promise<Array>} - Array of user objects.
 */
export const fetchUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};
