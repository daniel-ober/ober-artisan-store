const admin = require('firebase-admin');
const db = admin.firestore();

// Firestore collection reference for products
const productsCollection = db.collection('products');

// Function to add a new product
const addProduct = async (productData) => {
    try {
        const productRef = await productsCollection.add({
            ...productData,
            dateAdded: admin.firestore.FieldValue.serverTimestamp(),
            views: 0,
        });
        return productRef.id; // Return the product ID
    } catch (error) {
        throw new Error(`Error adding product: ${error.message}`);
    }
};

// Function to get a product by ID
const getProductById = async (id) => {
    try {
        const productDoc = await productsCollection.doc(id).get();
        if (!productDoc.exists) {
            throw new Error('Product not found');
        }
        return productDoc.data();
    } catch (error) {
        throw new Error(`Error fetching product: ${error.message}`);
    }
};

// Function to update a product by ID
const updateProduct = async (id, updatedData) => {
    try {
        await productsCollection.doc(id).update(updatedData);
        return true;
    } catch (error) {
        throw new Error(`Error updating product: ${error.message}`);
    }
};

// Function to delete a product by ID
const deleteProduct = async (id) => {
    try {
        await productsCollection.doc(id).delete();
        return true;
    } catch (error) {
        throw new Error(`Error deleting product: ${error.message}`);
    }
};

// Function to get all products
const getAllProducts = async () => {
    try {
        const productsSnapshot = await productsCollection.get();
        const products = productsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return products;
    } catch (error) {
        throw new Error(`Error fetching products: ${error.message}`);
    }
};

module.exports = {
    addProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllProducts,
};