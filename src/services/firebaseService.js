import { db, storage } from '../firebaseConfig';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    addDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches all products from the 'products' collection.
 * @returns {Promise<Array>} - Array of product objects.
 */
export const fetchProducts = async () => {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    return productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
};

/**
 * Fetches a user's profile by userId from the 'users' collection.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} - User profile data.
 */
export const fetchUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }
    throw new Error('User profile not found');
};

/**
 * Adds an inquiry to the 'inquiries' collection.
 * @param {Object} inquiryData - The data of the inquiry.
 * @returns {Promise<string>} - The ID of the newly created inquiry document.
 */
export const addInquiry = async (inquiryData) => {
    const inquiriesCollection = collection(db, 'inquiries');
    const docRef = await addDoc(inquiriesCollection, inquiryData);
    return docRef.id;
};

/**
 * Uploads an image to Firebase Storage and returns its download URL.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - The download URL of the uploaded image.
 */
export const uploadImage = async (file) => {
    const storageRef = ref(storage, `images/${uuidv4()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

/**
 * Adds a new document to the specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {Object} data - The data to add to the collection.
 * @returns {Promise<string>} - The ID of the newly created document.
 */
export const addDocument = async (collectionName, data) => {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
};

/**
 * Fetches all documents from a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @returns {Promise<Array>} - Array of documents from the collection.
 */
export const fetchCollection = async (collectionName) => {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches a single document by its ID from a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} id - The ID of the document.
 * @returns {Promise<Object>} - The document data.
 */
export const fetchDocumentById = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Document not found');
};

/**
 * Updates an existing document in the specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} id - The ID of the document to update.
 * @param {Object} data - The data to update in the document.
 */
export const updateDocument = async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
};

/**
 * Sets a new document or updates an existing document in the specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} id - The ID of the document.
 * @param {Object} data - The data to set in the document.
 */
export const setDocument = async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
};
