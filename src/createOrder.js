// src/createOrder.js
import { db } from './firebaseConfig'; // Adjust the path if necessary
import { addDoc, collection } from 'firebase/firestore';

export const CreateOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id; // Return the ID of the created order
  } catch (error) {
    console.error('Error adding order:', error);
    throw new Error('Could not create order'); // Handle errors appropriately
  }
};
