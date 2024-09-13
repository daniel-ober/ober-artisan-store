import { firestore } from '../firebaseConfig'; // Adjust the import path as needed
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Fetch product by ID
export const fetchProductById = async (id) => {
  try {
    const docRef = doc(firestore, 'products', id); // Adjust 'products' to your collection name
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.error('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error; // Ensure errors are thrown so they can be caught in calling functions
  }
};

// Function to create a cart for a guest
export const createCart = async (cartId) => {
  try {
    const cartRef = doc(firestore, 'carts', cartId);
    await setDoc(cartRef, {
      items: []
    });
    console.log(`Cart created with ID: ${cartId}`); // Add this line for debugging
    return cartId;
  } catch (error) {
    console.error('Error creating cart:', error);
  }
};

// Function to add an item to a cart
export const addItemToCart = async (cartId, item) => {
  try {
    const cartRef = doc(firestore, 'carts', cartId);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      // Cart does not exist, create it
      await createCart(cartId);
    }

    // Add item to the cart
    await updateDoc(cartRef, {
      items: arrayUnion(item)
    });
    console.log(`Item added to cart ID: ${cartId}`); // Add this line for debugging
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
};
