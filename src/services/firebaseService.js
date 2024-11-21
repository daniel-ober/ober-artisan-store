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

export const fetchProducts = async () => {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    return productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const fetchUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }
    throw new Error('User profile not found');
};

export const addInquiry = async (inquiryData) => {
    const inquiriesCollection = collection(db, 'inquiries');
    const docRef = await addDoc(inquiriesCollection, inquiryData);
    return docRef.id;
};

export const uploadImage = async (file) => {
    const storageRef = ref(storage, `images/${uuidv4()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

export const addDocument = async (collectionName, data) => {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
};

export const fetchCollection = async (collectionName) => {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchDocumentById = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Document not found');
};

export const updateDocument = async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
};
