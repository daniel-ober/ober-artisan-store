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
    setNewProduct({ ...newProduct, [name]: name === 'price' ? parseFloat(value) || 0 : value });
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
    setSuccessMessage('');
    setError('');

    try {
      const uploadedImages = imageFiles.length > 0 
        ? await Promise.all(imageFiles.map(uploadImageToFirebase)) 
        : [];

      const productData = { ...newProduct, images: uploadedImages };

      const stripeProduct = await createStripeProduct(productData);
      if (!stripeProduct || !stripeProduct.id) throw new Error('Failed to create Stripe product.');

      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.default_price,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage('Product added successfully!');
      onProductAdded({ id: docRef.id, ...productData });
      setNewProduct({ category: 'dreamfeather', description: '', images: [], name: '', price: 0, status: 'unavailable' });
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
              className="modal-input"
              value={newProduct.name}
              onChange={handleInputChange}
              placeholder="e.g. Custom Drum"
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
              className="modal-input"
              value={newProduct.description}
              onChange={handleInputChange}
              placeholder="e.g. High-quality handcrafted drum"
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
              className="modal-input"
              value={newProduct.price}
              onChange={handleInputChange}
              placeholder="$0.00"
              required
              step="0.01"
              min="0"
              disabled={isUploading}
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
              disabled={isUploading}
            >
              <option value="presale-dreamfeather">Pre-sale: DREAMFEATHER</option>
              <option value="presale-artisan">Pre-sale: Artisan</option>
              <option value="dreamfeather">DREAMFEATHER</option>
              <option value="artisan">Artisan</option>
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
              style={{ display: 'none' }}
              id="image-upload-input"
              disabled={isUploading}
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
                  disabled={isUploading}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="modal-button"
            disabled={isUploading}
          >
            {isUploading ? 'Adding...' : 'Add Product'}
          </button>
          <button type="button" className="close-btn" onClick={onClose} disabled={isUploading}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
