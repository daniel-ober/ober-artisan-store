// src/services/productService.js
import { db } from '../firebaseConfig'; // Adjust the path as necessary
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, getDoc } from "firebase/firestore";

const productsCollection = collection(db, "products");

// Fetch all products
export const fetchProducts = async () => {
  const productSnapshot = await getDocs(productsCollection);
  return productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Fetch product by ID
export const fetchProductById = async (productId) => {
  const productDocRef = doc(db, "products", productId); // Create a document reference
  const productSnapshot = await getDoc(productDocRef); // Fetch the document snapshot
  if (!productSnapshot.exists()) {
    throw new Error("Product not found"); // Handle case where product doesn't exist
  }
  return { id: productSnapshot.id, ...productSnapshot.data() }; // Return product data
};

// Delete a product
export const deleteProductFromFirestore = async (productId) => {
  const productDocRef = doc(db, "products", productId);
  await deleteDoc(productDocRef);
};

// Update a product
export const updateProductInFirestore = async (productId, updatedProduct) => {
  const productDocRef = doc(db, "products", productId);
  await updateDoc(productDocRef, updatedProduct);
};

// Add a new product
export const addProductToFirestore = async (newProduct) => {
  await addDoc(productsCollection, newProduct);
};
