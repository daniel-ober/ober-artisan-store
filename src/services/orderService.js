// src/services/orderService.js
import { db, storage } from '../firebaseConfig'; // Adjust the import path as needed
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
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase authentication

// Fetch product by ID
export const fetchProductById = async (id) => {
    try {
        const docRef = doc(db, 'products', id); // Adjust 'products' to your collection name
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
        const productsCollection = collection(db, 'products');
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

// Function to create a product
export const createProduct = async (productData) => {
    try {
        const productsCollection = collection(db, 'products');
        const docRef = await addDoc(productsCollection, productData);
        console.log('Product created with ID:', docRef.id); // Debugging log
        return docRef.id;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

// Function to create a cart for a guest
export const createCart = async (cartId) => {
    try {
        const cartRef = doc(db, 'carts', cartId);
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
        const cartRef = doc(db, 'carts', cartId);
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

// Function to add an inquiry
export const addInquiry = async (inquiryData) => {
    try {
        const inquiriesCollection = collection(db, 'inquiries'); // Adjust collection name
        const docRef = await addDoc(inquiriesCollection, inquiryData);
        console.log('Inquiry added with ID:', docRef.id); // Debugging log
        return docRef.id;
    } catch (error) {
        console.error('Error adding inquiry:', error);
        throw error;
    }
};

// Function to fetch user profile
export const fetchUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId); // Adjust collection name as necessary
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            console.log(`User profile fetched with ID: ${userId}`, userSnap.data()); // Debugging log
            return userSnap.data();
        } else {
            console.error('No such user document!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

// Function to create an order
export const createOrder = async (orderData) => {
    try {
        const ordersCollection = collection(db, 'orders'); // Adjust collection name
        const docRef = await addDoc(ordersCollection, orderData);
        console.log('Order created with ID:', docRef.id); // Debugging log
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// Function to update the status of an order
export const updateOrderStatus = async (orderId, status) => {
    try {
        const orderRef = doc(db, 'orders', orderId); // Adjust 'orders' to your collection name
        await updateDoc(orderRef, { status }); // Update the order status
        console.log(`Order status updated for ID: ${orderId} to ${status}`); // Debugging log
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Function to upload images to Firebase Storage
export const uploadImageToFirebase = async (file) => {
    try {
        const storageRef = ref(storage, `images/${uuidv4()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        console.log('Image uploaded successfully:', downloadURL); // Debugging log
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Function to check if a user has an admin claim
export const checkAdminClaim = async (email) => {
    // Logic to check admin claims in your Firestore user collection or use Firebase Authentication Admin SDK
    return email === 'admin@example.com'; // Placeholder logic
};

// Function to sign in a user
export const signInUser = async (email, password) => {
    const auth = getAuth();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const isAdmin = await checkAdminClaim(user.email); // Check admin claims
        console.log('User signed in:', user.email, 'Admin:', isAdmin); // Debugging log
        return { user, isAdmin };
    } catch (error) {
        console.error('Error signing in user:', error);
        throw error;
    }
};
