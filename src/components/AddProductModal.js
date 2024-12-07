import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/firebaseService';
import { createStripeProduct } from '../services/stripeService';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Upload images and get high-res and optimized URLs
      const uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadImage(file, 'products'))
      );
      const highResUrls = uploadedImages.map((img) => img.highResUrl);
      const optimizedUrls = uploadedImages.map((img) => img.optimizedUrl);

      // Prepare product data
      const productData = { ...newProduct, images: highResUrls };

      // Create Stripe Product
      const stripeProduct = await createStripeProduct(
        productData.name,
        productData.description,
        productData.price,
        optimizedUrls // Pass optimized image URLs to Stripe
      );

      if (!stripeProduct || !stripeProduct.product.id) {
        throw new Error('Failed to create Stripe product.');
      }

      // Save product to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        stripeProductId: stripeProduct.product.id,
        stripePriceId: stripeProduct.price.id,
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
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              required
              disabled={isUploading}
              autoComplete="off"
            ></textarea>
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
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="image-upload-input">Upload Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              id="image-upload-input"
              onChange={handleFileChange}
              disabled={isUploading}
            />
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
