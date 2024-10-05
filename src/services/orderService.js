// src/services/orderService.js
import { db } from '../firebaseConfig'; // Adjust the path as necessary
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Function to fetch orders
export const fetchOrders = async () => {
  const ordersCollection = collection(db, 'orders'); // Adjust the collection name if necessary
  const orderSnapshot = await getDocs(ordersCollection);
  const orders = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return orders;
};

// Function to delete an order
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
  }
};
