import { firestore } from './firebaseConfig'; // Firestore instance
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

// Add user to Firestore
const addUserToFirestore = async (userId, userData) => {
  try {
    await setDoc(doc(firestore, 'users', userId), userData);
    console.log('User added to Firestore');
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
  }
};

// Fetch user profile from Firestore
const fetchUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('No such user found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Fetch products from Firestore
const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'products'));
    const productsList = querySnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    return productsList;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Fetch a single product by Firestore document ID
const fetchProductById = async (id) => {
  try {
    const productDoc = await getDoc(doc(firestore, 'products', id));
    if (productDoc.exists()) {
      return { _id: productDoc.id, ...productDoc.data() };
    } else {
      console.log('No such product found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export { addUserToFirestore, fetchUserProfile, fetchProducts, fetchProductById };
