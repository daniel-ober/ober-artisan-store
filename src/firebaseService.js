import { firestore } from './firebaseConfig'; // Firestore instance from your config
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'; // Firebase Firestore imports
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// Add a user to Firestore
const addUserToFirestore = async (userId, userData) => {
  try {
    await setDoc(doc(firestore, 'users', userId), userData); // Add user data to 'users' collection
    console.log('User successfully added to Firestore');
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
  }
};

// Fetch a user profile from Firestore
const fetchUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId)); // Fetch the user document
    if (userDoc.exists()) {
      return userDoc.data(); // Return user data if found
    } else {
      console.log('No user found with the given ID!');
      return null; // Return null if no document is found
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error; // Rethrow error to handle it in the calling component
  }
};

// Fetch all products from Firestore
const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'products')); // Get all product documents
    const productsList = querySnapshot.docs.map((doc) => ({
      _id: doc.id, // Include the document ID
      ...doc.data(), // Spread the rest of the document data
    }));
    return productsList; // Return the array of products
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error; // Rethrow error for further handling
  }
};

// Fetch a single product by its ID from Firestore
const fetchProductById = async (id) => {
  try {
    const productDoc = await getDoc(doc(firestore, 'products', id)); // Fetch product by document ID
    if (productDoc.exists()) {
      return { _id: productDoc.id, ...productDoc.data() }; // Return product data along with its ID
    } else {
      console.log('No product found with the given ID!');
      return null; // Return null if no document is found
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error; // Rethrow error for further handling
  }
};

// Add an inquiry to Firestore
const addInquiry = async (inquiryData) => {
  try {
    const uniqueId = uuidv4(); // Generate a unique ID for the inquiry
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }); // Timestamp for the inquiry

    // Create a new inquiry document with a unique ID
    const docRef = doc(firestore, 'inquiries', uniqueId);
    
    // Add inquiry data to Firestore with the timestamp
    await setDoc(docRef, {
      ...inquiryData,
      submittedAt: timestamp, // Add timestamp to inquiry
    });

    console.log('Inquiry successfully added with ID:', uniqueId);
  } catch (error) {
    console.error('Error adding inquiry:', error);
  }
};

// Fetch the user's cart from Firestore
const fetchUserCart = async (userId) => {
  try {
    const cartDoc = await getDoc(doc(firestore, 'carts', userId));
    if (cartDoc.exists()) {
      return cartDoc.data(); // Return cart data if found
    } else {
      console.log('No cart found for the given user ID!');
      return {}; // Return an empty cart if no document is found
    }
  } catch (error) {
    console.error('Error fetching user cart:', error);
    throw error; // Rethrow error for further handling
  }
};

export { addUserToFirestore, fetchUserProfile, fetchProducts, fetchProductById, addInquiry, fetchUserCart };
