// src/services/orderService.js
import { db } from '../firebaseConfig'; // Adjust the import path as needed
import firebase from 'firebase/app'; // Make sure firebase is imported

async function createOrder(orderData) {
  try {
    const user = firebase.auth().currentUser; // Check current user
    if (!user) {
      console.error("User not authenticated.");
      return;
    }
    
    const orderRef = db.collection('orders').doc(); // Use an auto-generated id
    await orderRef.set({
      ...orderData,
      userId: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log("Order created successfully");
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

export { createOrder };
