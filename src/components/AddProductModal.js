import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/firebaseService'; // Ensure this function exists
import { createStripeProduct } from '../services/stripeService'; // Ensure this function is implemented
import './AddProductModal.css';

const AddProductModal = ({ onClose, onProductAdded }) => {
  const [newProduct, setNewProduct] = useState({
    category: 'dreamfeather',
    description: '',
    images: [],
    name: '',
    price: 0,
    status: 'unavailable',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Upload images to Firebase Storage
      const uploadedImages = await Promise.all(imageFiles.map((file) => uploadImage(file, 'products')));

      const productData = { ...newProduct, images: uploadedImages };

      // Create a product in Stripe
      const stripeProduct = await createStripeProduct(productData);
      if (!stripeProduct || !stripeProduct.id) {
        throw new Error('Failed to create Stripe product.');
      }

      // Add product to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.default_price,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage('Product added successfully!');
      onProductAdded({ id: docRef.id, ...productData });

      // Reset form
      setNewProduct({
        category: 'dreamfeather',
        description: '',
        images: [],
        name: '',
        price: 0,
        status: 'unavailable',
      });
      setImageFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to add product.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        <h2>Add New Product</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              required
              disabled={isUploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              required
              disabled={isUploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              disabled={isUploading}
            />
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
              style={{ display: 'none' }}
              id="image-upload-input"
              disabled={isUploading}
            />
            <label htmlFor="image-upload-input" style={{ cursor: 'pointer' }}>
              <span>Select Files</span>
            </label>
          </div>
          <div className="selected-images">
            {imageFiles.map((file, index) => (
              <div key={index} className="image-preview">
                {file.name}
              </div>
            ))}
          </div>
          <button type="submit" disabled={isUploading}>
            {isUploading ? 'Adding...' : 'Add Product'}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
