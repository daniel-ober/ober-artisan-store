import React, { useState } from 'react';
import { uploadImageToFirebase } from '../services/firebaseService'; // A helper function for uploading images to Firebase
import { db } from '../firebaseConfig'; // Import Firestore
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions
import { createStripeProduct } from '../services/stripeService'; // Import the Stripe service
import './AddProductModal.css';

const AddProductModal = ({ onClose, onProductAdded }) => {
  const [newProduct, setNewProduct] = useState({
    category: 'dreamfeather',
    description: '',
    images: [],
    name: '',
    price: 0, // Price is now a number
    status: 'unavailable', // Set default status to "unavailable"
  });
  const [imageFiles, setImageFiles] = useState([]); // To handle multiple file uploads
  const [isUploading, setIsUploading] = useState(false); // Uploading state
  const [error, setError] = useState(''); // Error state for handling upload errors

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'price' ? parseFloat(value) : value;
    setNewProduct({ ...newProduct, [name]: updatedValue });
  };

  const handleFileChange = (e) => {
    setImageFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Prevent multiple submissions if already in progress
    if (isUploading) {
      console.warn('Submission is already in progress.');
      return; 
    }
  
    setIsUploading(true); // Indicate that the submission is in progress
  
    try {
      // Upload images and handle their responses
      const uploadedImages = imageFiles.length > 0 
          ? await Promise.all(imageFiles.map(file => uploadImageToFirebase(file))) 
          : [];
  
      // Prepare product data
      const productData = {
        ...newProduct,
        images: uploadedImages,
      };
  
      console.log('Product data before Stripe creation:', productData);
  
      // Create product in Stripe
      const stripeProduct = await createStripeProduct(productData);
      console.log('Stripe product created:', stripeProduct);
  
      // Check if Stripe product creation was successful
      if (stripeProduct && stripeProduct.id) {
        console.log('Adding product to Firestore...');
  
        // Create Firestore document only once
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          stripeProductId: stripeProduct.id, // Use the product ID returned from Stripe
          stripePriceId: stripeProduct.default_price, // Store the default price if applicable
        });
  
        console.log('New Firestore document created with ID:', docRef.id);
  
        // Trigger success handler
        onProductAdded({ id: docRef.id, ...productData });
      } else {
        console.error('Stripe product creation failed.');
        setError('Failed to create Stripe product. Please try again.');
      }
  
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
    } finally {
      setIsUploading(false); // Reset uploading state
      onClose(); // Close the modal after submission
    }
  };
  
  

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        <h2>Add New Product</h2>
        {error && <div className="error">{error}</div>} {/* Display error message */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={newProduct.category}
            onChange={handleInputChange}
            required
          >
            <option value="dreamfeather">Dreamfeather</option>
            <option value="true artisan">True Artisan</option>
            <option value="soundlegend">Soundlegend</option>
            <option value="accessories">Accessories</option>
            <option value="apparel">Apparel</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>

          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            name="description"
            value={newProduct.description}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="images">Images (Upload)</label>
          <input
            id="images"
            type="file"
            name="images"
            multiple
            onChange={handleFileChange}
            accept="image/*"
          />

          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={newProduct.name}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="price">Price</label>
          <input
            id="price"
            type="number"
            name="price"
            value={newProduct.price}
            onChange={handleInputChange}
            required
          />

          <button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Add Product'}
          </button>
        </form>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddProductModal;
