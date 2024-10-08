// src/services/orderService.js
import { db } from '../firebaseConfig'; // Ensure you have the correct path
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore'; // Import necessary functions from Firestore

// Function to fetch orders
export const fetchOrders = async () => {
  const ordersCollection = collection(db, 'orders'); // Get the orders collection reference
  const orderSnapshot = await getDocs(ordersCollection); // Fetch documents from the collection
  const orders = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map through the documents
  return orders; // Return the orders
};

// Function to fetch a specific order by ID
export const fetchOrderById = async (orderId) => {
  const orderRef = doc(db, 'orders', orderId); // Get the document reference
  const orderDoc = await getDoc(orderRef); // Fetch the document
  if (orderDoc.exists()) {
    return { id: orderDoc.id, ...orderDoc.data() }; // Return the order data
  } else {
    throw new Error('Order not found');
  }
};

// Function to update an order in Firestore
export const updateOrderInFirestore = async (orderId, orderData) => {
  const orderRef = doc(db, 'orders', orderId); // Get the document reference
  await updateDoc(orderRef, orderData); // Update the document with new data
};

// Function to delete an order from Firestore
export const deleteOrderFromFirestore = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId); // Get the document reference
    await deleteDoc(orderRef); // Delete the document
  } catch (error) {
    throw new Error('Error deleting order: ' + error.message);
  }
};
