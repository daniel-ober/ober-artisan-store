// src/services/orderService.js
import { db } from '../firebaseConfig'; // Adjust based on your setup
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import Firebase Authentication

const ordersCollection = collection(db, 'orders');

export const createOrder = async (orderData) => {
    // Retrieve user ID from Firebase Authentication
    const auth = getAuth();
    const user = auth.currentUser; // Get the current user

    const userId = user ? user.uid : null; // Get user ID or null if not authenticated

    if (!userId) {
        throw new Error('User must be authenticated to create an order.');
    }

    // Check for existing orders with the same orderId (assuming orderData includes orderId)
    const q = query(ordersCollection, where("userId", "==", userId), where("orderId", "==", orderData.orderId)); // Check for duplicate order based on orderId
    const existingOrders = await getDocs(q);

    if (!existingOrders.empty) {
        throw new Error('This order has already been created for this user.');
    }

    // Create a new order object
    const orderToCreate = {
        userId,
        createdAt: new Date(),
        ...orderData,
    };

    try {
        const docRef = await addDoc(ordersCollection, orderToCreate);
        console.log('Order created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};
