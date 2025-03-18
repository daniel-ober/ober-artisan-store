import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Fetches a user's document from Firestore by userId.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} - The user's document data, or null if not found.
 */
export const fetchUserDoc = async (userId) => {
    try {
        // console.log('🔍 Fetching Firestore User Data for UID:', userId);
        
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // console.log('✅ Firestore User Data:', userData);
            
            if (!Object.prototype.hasOwnProperty.call(userData, 'isAdmin')) {
                console.warn(`⚠️ User ${userId} does not have an 'isAdmin' field.`);
            }
            
            return userData;
        } else {
            // console.error('❌ No user document found for userId:', userId);
            return null;
        }
    } catch (error) {
        // console.error('❌ Error fetching user document:', error);
        return null;
    }
};

/**
 * Updates a user's document in Firestore.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updatedData - The updated user data.
 * @returns {Promise<void>}
 */
export const updateUserInFirestore = async (userId, updatedData) => {
    try {
        // console.log(`🔄 Updating Firestore User: ${userId} with Data:`, updatedData);

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedData);

        // console.log('✅ User successfully updated in Firestore.');
    } catch (error) {
        // console.error('❌ Error updating user in Firestore:', error);
        throw error;
    }
};

/**
 * Fetches all users from Firestore.
 * @returns {Promise<Array>} - Array of user objects.
 */
export const fetchUsers = async () => {
    try {
        // console.log('🔍 Fetching all users from Firestore...');
        
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // console.log(`✅ Fetched ${users.length} users.`);
        return users;
    } catch (error) {
        // console.error('❌ Error fetching users:', error);
        throw error;
    }
};

/**
 * Ensures a user has an `isAdmin` field in Firestore.
 * If the field is missing, it sets `isAdmin: false` by default.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<void>}
 */
export const ensureAdminField = async (userId) => {
    try {
        // console.log(`🔍 Checking if user ${userId} has 'isAdmin' field...`);
        
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            if (!Object.prototype.hasOwnProperty.call(userData, 'isAdmin')) {
                console.warn(`⚠️ User ${userId} missing 'isAdmin' field. Updating Firestore...`);
                await updateDoc(userDocRef, { isAdmin: false });
                // console.log(`✅ 'isAdmin' field set to false for user ${userId}`);
            } else {
                // console.log(`✅ User ${userId} already has 'isAdmin':`, userData.isAdmin);
            }
        } else {
            // console.error(`❌ User ${userId} does not exist in Firestore.`);
        }
    } catch (error) {
        // console.error('❌ Error checking/updating isAdmin field:', error);
    }
};

/**
 * Grants admin rights to a user by updating Firestore.
 * @param {string} userId - The ID of the user to make an admin.
 * @returns {Promise<void>}
 */
export const grantAdminAccess = async (userId) => {
    try {
        // console.log(`🚀 Granting admin access to user ${userId}...`);
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isAdmin: true });

        // console.log(`✅ User ${userId} is now an admin.`);
    } catch (error) {
        // console.error(`❌ Error granting admin access to ${userId}:`, error);
    }
};

/**
 * Revokes admin rights from a user by updating Firestore.
 * @param {string} userId - The ID of the user to remove admin rights from.
 * @returns {Promise<void>}
 */
export const revokeAdminAccess = async (userId) => {
    try {
        // console.log(`🚫 Revoking admin access for user ${userId}...`);
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isAdmin: false });

        // console.log(`✅ User ${userId} is no longer an admin.`);
    } catch (error) {
        // console.error(`❌ Error revoking admin access for ${userId}:`, error);
    }
};