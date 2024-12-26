import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';

// Fetch all products
export const fetchProducts = async () => {
    const productsCollection = collection(db, 'products');
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Fetch a product by ID
export const fetchProductById = async (productId) => {
    const productRef = doc(db, 'products', productId);
    const snapshot = await getDoc(productRef);
    if (!snapshot.exists()) {
        throw new Error('Product not found');
    }
    return { id: snapshot.id, ...snapshot.data() };
};

// Add a new product
export const addProduct = async (productData) => {
    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, productData);
    return { id: docRef.id, ...productData };
};

// Update a product
export const updateProduct = async (productId, updatedData) => {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, updatedData);
};

// Update product status
export const updateProductStatus = async (productId, status) => {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
        status,
        updatedAt: new Date()  // Optional: Track the update time
    });
};

// Delete a product
export const deleteProduct = async (productId) => {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
};
