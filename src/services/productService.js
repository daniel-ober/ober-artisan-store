// src/services/productService.js
import { db } from '../firebaseConfig'; // Adjust the path as necessary
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Function to fetch products
export const fetchProducts = async () => {
  const productsCollection = collection(db, 'products'); // Adjust the collection name if necessary
  const productSnapshot = await getDocs(productsCollection);
  const products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return products;
};

// Function to delete a product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};
