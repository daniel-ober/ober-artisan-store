// // src/services/orderService.js
// import { db } from './firebaseConfig'; // Adjust based on your setup
// import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// const ordersCollection = collection(db, 'orders');

// export const createOrder = async (orderData) => {
//     // Check if user is authenticated (implement your authentication logic)
//     const userId = /* retrieve user ID logic */;

//     if (!userId) {
//         throw new Error('User must be authenticated to create an order.');
//     }

//     // Check for existing orders with the same order data (assuming orderData has a unique identifier)
//     const q = query(ordersCollection, where("userId", "==", userId), where("orderId", "==", orderData.orderId)); // Use an identifier to check for duplicates
//     const existingOrders = await getDocs(q);

//     if (!existingOrders.empty) {
//         throw new Error('This order has already been created for this user.');
//     }

//     // Create a new order
//     const orderToCreate = {
//         userId,
//         createdAt: new Date(),
//         ...orderData,
//     };

//     try {
//         const docRef = await addDoc(ordersCollection, orderToCreate);
//         console.log('Order created with ID:', docRef.id);
//         return docRef.id;
//     } catch (error) {
//         console.error('Error creating order:', error);
//         throw error;
//     }
// };
