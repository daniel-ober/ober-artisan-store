import { firestore, storage } from '../firebaseConfig'; // Adjust the import path as needed
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    collection, 
    getDocs, 
    addDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

// Fetch product by ID
export const fetchProductById = async (id) => {
    try {
        const docRef = doc(firestore, 'products', id); // Adjust 'products' to your collection name
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`Product fetched with ID: ${id}`, docSnap.data()); // Debugging log
            return docSnap.data();
        } else {
            console.error('No such document exists!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

// Function to fetch all products
export const fetchProducts = async () => {
    try {
        const productsCollection = collection(firestore, 'products');
        const productSnapshot = await getDocs(productsCollection);
        const productsList = productSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        }));
        console.log('Fetched all products:', productsList); // Debugging log
        return productsList;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Function to create a cart for a guest
export const createCart = async (cartId) => {
    try {
        const cartRef = doc(firestore, 'carts', cartId);
        await setDoc(cartRef, {
            items: []
        });
        console.log(`Cart created with ID: ${cartId}`); // Debugging log
        return cartId;
    } catch (error) {
        console.error('Error creating cart:', error);
        throw error;
    }
};

// Function to add an item to a cart
export const addItemToCart = async (cartId, item) => {
    try {
        const cartRef = doc(firestore, 'carts', cartId);
        const cartSnap = await getDoc(cartRef);

        if (!cartSnap.exists()) {
            console.log(`Cart with ID: ${cartId} does not exist, creating a new cart...`); // Debugging log
            await createCart(cartId);
        }

        await updateDoc(cartRef, {
            items: arrayUnion(item)
        });
        console.log(`Item added to cart with ID: ${cartId}`, item); // Debugging log
    } catch (error) {
        console.error('Error adding item to cart:', error);
        throw error;
    }
};

// Function to add an inquiry (new function)
export const addInquiry = async (inquiryData) => {
    try {
        const inquiriesCollection = collection(firestore, 'inquiries'); // Adjust collection name
        const docRef = await addDoc(inquiriesCollection, inquiryData);
        console.log('Inquiry added with ID:', docRef.id); // Debugging log
        return docRef.id;
    } catch (error) {
        console.error('Error adding inquiry:', error);
        throw error;
    }
};

// Function to fetch user profile (new function)
export const fetchUserProfile = async (userId) => {
    try {
        const userRef = doc(firestore, 'users', userId); // Adjust collection name as necessary
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            console.log(`User profile fetched with ID: ${userId}`, userSnap.data()); // Debugging log
            return userSnap.data();
        } else {
            console.error('No such user exists!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

// Function to fetch user cart (new function)
export const fetchUserCart = async (cartId) => {
    try {
        const cartRef = doc(firestore, 'carts', cartId);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
            console.log(`Cart fetched with ID: ${cartId}`, cartSnap.data()); // Debugging log
            return cartSnap.data();
        } else {
            console.error('No such cart exists!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user cart:', error);
        throw error;
    }
};

// Function to create an order (added function)
export const createOrder = async (orderData) => {
    try {
        const ordersCollection = collection(firestore, 'orders'); // Adjust 'orders' to your collection name
        const docRef = await addDoc(ordersCollection, orderData);
        console.log('Order created with ID:', docRef.id); // Debugging log
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// Function to upload image to Firebase Storage
export const uploadImageToFirebase = async (file) => {
    try {
        const storageRef = ref(storage, `images/${uuidv4()}_${file.name}`); // Create a unique reference for the file
        await uploadBytes(storageRef, file); // Upload the file to Firebase Storage
        const url = await getDownloadURL(storageRef); // Get the file's URL
        return url; // Return the file's URL
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Function to check if an order exists by ID (added function)
export const checkExistingOrder = async (orderId) => {
    try {
        const orderRef = doc(firestore, 'orders', orderId); // Adjust 'orders' to your collection name
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            console.log(`Order exists with ID: ${orderId}`, orderSnap.data()); // Debugging log
            return true; // Order exists
        } else {
            console.log(`No order found with ID: ${orderId}`); // Debugging log
            return false; // Order does not exist
        }
    } catch (error) {
        console.error('Error checking existing order:', error);
        throw error;
    }
};

// Function to test Firestore connection
export const testFirestoreConnection = async () => {
    try {
        const docRef = await addDoc(collection(firestore, 'test'), {
            message: 'This is a test message',
            timestamp: new Date(),
        });
        console.log('Test document written with ID:', docRef.id); // Debugging log
    } catch (e) {
        console.error('Error adding test document:', e);
    }
};

// Call the test function to confirm Firestore connection
testFirestoreConnection();
