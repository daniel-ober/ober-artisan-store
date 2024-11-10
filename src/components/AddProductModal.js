import React, { useState } from 'react';
import { uploadImageToFirebase } from '../services/firebaseService';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createStripeProduct } from '../services/stripeService';
import './AddProductModal.css';

const AddProductModal = ({ onClose, onProductAdded }) => {
  const [newProduct, setNewProduct] = useState({
    category: 'dreamfeather',
    description: '',
    images: [],
    name: 'Test Product Name', // Default value for testing
    price: 0,
    status: 'unavailable',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // New state for success message

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      const numericValue = parseFloat(value) || 0;
      setNewProduct({ ...newProduct, [name]: numericValue });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUploading) {
      console.warn('Submission is already in progress.');
      return; 
    }

    setIsUploading(true); 
    setSuccessMessage(''); // Reset success message on new submission

    try {
      const uploadedImages = imageFiles.length > 0 
          ? await Promise.all(imageFiles.map(file => uploadImageToFirebase(file))) 
          : [];

      const productData = {
        ...newProduct,
        images: uploadedImages,
      };

      console.log('Product data before Stripe creation:', productData);

      const stripeProduct = await createStripeProduct(productData);
      console.log('Stripe product created:', stripeProduct);

      if (stripeProduct && stripeProduct.id) {
        console.log('Adding product to Firestore...');

        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripeProduct.default_price,
          createdAt: serverTimestamp(),  // Add this line for timestamp
        });

        console.log('New Firestore document created with ID:', docRef.id);
        onProductAdded({ id: docRef.id, ...productData });
        setSuccessMessage('Product added successfully!'); // Set success message

        // Reset form after successful submission
        setNewProduct({
          category: 'dreamfeather',
          description: '',
          images: [],
          name: '',
          price: 0,
          status: 'unavailable',
        });
        setImageFiles([]);
      } else {
        console.error('Stripe product creation failed.');
        setError('Failed to create Stripe product. Please try again.');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
    } finally {
      setIsUploading(false); 
    }
  };

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        <h2 className="modal-title">Add New Product</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>} {/* New success message */}
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              className="modal-input"
              value={newProduct.name}
              onChange={handleInputChange}
              placeholder="e.g. Custom Drum"
              required
              disabled={isUploading} // Disable input while uploading
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              name="description"
              className="modal-input"
              value={newProduct.description}
              onChange={handleInputChange}
              placeholder="e.g. High-quality handcrafted drum"
              required
              disabled={isUploading} // Disable input while uploading
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              name="price"
              className="modal-input"
              value={newProduct.price}
              onChange={handleInputChange}
              placeholder="$0.00"
              required
              step="0.01"
              min="0"
              disabled={isUploading} // Disable input while uploading
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="modal-select"
              value={newProduct.category}
              onChange={handleInputChange}
              required
              disabled={isUploading} // Disable input while uploading
            >
              <option value="dreamfeather">Dreamfeather</option>
              <option value="true artisan">True Artisan</option>
              <option value="soundlegend">Soundlegend</option>
              <option value="accessories">Accessories</option>
              <option value="apparel">Apparel</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div
            className="image-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p>Drag and drop images here or click to select files</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }} // Hide default file input
              id="image-upload-input"
              disabled={isUploading} // Disable input while uploading
            />
            <label htmlFor="image-upload-input" style={{ cursor: 'pointer' }}>
              <span>Select Files</span>
            </label>
          </div>
          <div className="image-thumbnails">
            {imageFiles.map((file, index) => (
              <div className="thumbnail" key={index}>
                <img src={URL.createObjectURL(file)} alt="thumbnail" />
                <button
                  className="remove-image"
                  onClick={() => {
                    const newFiles = imageFiles.filter((_, i) => i !== index);
                    setImageFiles(newFiles);
                  }}
                  disabled={isUploading} // Disable button while uploading
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="modal-button"
            disabled={isUploading} // Disable submit button while uploading
          >
            {isUploading ? 'Adding...' : 'Add Product'}
          </button>
          <button type="button" className="close-btn" onClick={onClose} disabled={isUploading}> {/* Disable close button while uploading */}
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
