// src/createOrder.js
import { db } from './firebaseConfig'; // Adjust the path if necessary
import { addDoc, collection } from 'firebase/firestore';

export const CreateOrder = async (orderData) => {
  try {
    console.log('Creating order with data:', orderData); // Debugging line
    // Create a new document in the 'orders' collection
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    console.log('Order created with ID:', docRef.id); // Debugging line
    return docRef.id; // Return the ID of the created order
  } catch (error) {
    console.error('Error adding order:', error);
    throw new Error('Could not create order'); // Handle errors appropriately
  }
};
