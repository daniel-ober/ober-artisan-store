import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// Fetch all products
export const fetchProducts = async () => {
  const productsCollection = collection(db, 'products');
  const productsSnapshot = await getDocs(productsCollection);
  return productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Fetch a single product by ID
export const fetchProductById = async (productId) => {
  const productDoc = doc(db, 'products', productId);
  const productSnapshot = await getDoc(productDoc);
  if (!productSnapshot.exists()) {
    throw new Error('Product not found.');
  }
  return { id: productSnapshot.id, ...productSnapshot.data() };
};

// Add a new product
export const addProduct = async (productData) => {
  const productsCollection = collection(db, 'products');
  const docRef = await addDoc(productsCollection, productData);
  return docRef.id;
};

// Update product fields
export const updateProduct = async (productId, updatedData) => {
  const productDoc = doc(db, 'products', productId);
  await updateDoc(productDoc, updatedData);
};

// Update product status
export const updateProductStatus = async (productId, newStatus) => {
  const productDoc = doc(db, 'products', productId);
  await updateDoc(productDoc, { status: newStatus });
};

// Delete a product
export const deleteProduct = async (productId) => {
  const productDoc = doc(db, 'products', productId);
  await deleteDoc(productDoc);
};

// Update inventory levels for a product
export const updateProductInventory = async (productId, inventoryData) => {
  const { maxQuantity, currentQuantity } = inventoryData;

  if (
    typeof maxQuantity !== 'undefined' &&
    (typeof maxQuantity !== 'number' || maxQuantity < 0)
  ) {
    throw new Error('Invalid maxQuantity. It must be a non-negative number.');
  }

  if (
    typeof currentQuantity !== 'undefined' &&
    (typeof currentQuantity !== 'number' || currentQuantity < 0)
  ) {
    throw new Error('Invalid currentQuantity. It must be a non-negative number.');
  }

  if (
    typeof maxQuantity !== 'undefined' &&
    typeof currentQuantity !== 'undefined' &&
    currentQuantity > maxQuantity
  ) {
    throw new Error(
      'Invalid inventory update. currentQuantity cannot exceed maxQuantity.'
    );
  }

  const productDoc = doc(db, 'products', productId);
  await updateDoc(productDoc, inventoryData);
};