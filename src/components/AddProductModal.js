import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/firebaseService';
import { createStripeProduct } from '../services/stripeService';
import './AddProductModal.css';
import ArtisanSpecsForm from './ArtisanSpecsForm';
import LoadingSpinner from './LoadingSpinner';
import SuccessModal from './SuccessModal';  // Import the SuccessModal component

const AddProductModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [newProduct, setNewProduct] = useState({
    category: '',
    name: '',
    price: 0,
    description: '',
    deliveryTime: '',
    sku: '',
    images: [],
    interactive360Url: '',
  });

  const [artisanSpecs, setArtisanSpecs] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successProductId, setSuccessProductId] = useState(null);  // Track product ID for success modal
  const [error, setError] = useState('');

  const categories = ['artisan', 'merch', 'accessories'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleArtisanSubmit = async (artisanData) => {
    setIsUploading(true);
    setError('');
    setSuccessProductId(null);  // Reset success state

    try {
      // Validate required fields
      if (!newProduct.name || !newProduct.description || newProduct.price <= 0 || !newProduct.sku || !newProduct.deliveryTime) {
        throw new Error('Name, description, price, SKU, and delivery time are required fields.');
      }

      // Upload images to Firebase Storage
      const uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadImage(file, 'products'))
      );

      // Prepare product data
      const finalProductData = {
        ...newProduct,
        ...artisanData,
        images: uploadedImages,
        createdAt: serverTimestamp(),
      };

      console.log('Final product data before Stripe:', finalProductData);

      // Create Stripe product
      const stripeProduct = await createStripeProduct(
        finalProductData.name,
        finalProductData.description,
        finalProductData.price,
        uploadedImages
      );

      if (!stripeProduct || !stripeProduct.product.id) {
        throw new Error('Failed to create Stripe product.');
      }

      // Add product to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...finalProductData,
        stripeProductId: stripeProduct.product.id,
        stripePriceId: stripeProduct.price.id,
      });

      // Show success modal by storing the new product ID
      setSuccessProductId(docRef.id);

      // Reset form state
      setNewProduct({
        category: '',
        name: '',
        price: 0,
        description: '',
        deliveryTime: '',
        sku: '',
        images: [],
        interactive360Url: '',
      });
      setArtisanSpecs({});
      setImageFiles([]);
      setStep(1);
    } catch (err) {
      console.error('Error adding product:', err.message);
      setError(err.message || 'Failed to add product.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        {successProductId ? (
          <SuccessModal productId={successProductId} />  // Show success message upon creation
        ) : (
          <>
            <h2>Add New Product</h2>

            {error && <div className="error-message">{error}</div>}

            {isUploading ? (
              <LoadingSpinner />  // Show spinner during upload
            ) : (
              <form>
                {step === 1 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="category">Category*</label>
                      <select
                        id="category"
                        name="category"
                        value={newProduct.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="name">Product Name*</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={newProduct.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="price">Price (USD)*</label>
                      <input
                        id="price"
                        type="number"
                        name="price"
                        value={newProduct.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sku">SKU*</label>
                      <input
                        id="sku"
                        type="text"
                        name="sku"
                        value={newProduct.sku}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="deliveryTime">Delivery Time*</label>
                      <input
                        id="deliveryTime"
                        type="text"
                        name="deliveryTime"
                        value={newProduct.deliveryTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description*</label>
                      <textarea
                        id="description"
                        name="description"
                        value={newProduct.description}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label htmlFor="file-upload">Images*</label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                      />
                    </div>

                    <div className="button-group">
                      {newProduct.category === 'artisan' ? (
                        <button type="button" onClick={handleNextStep}>Next</button>
                      ) : (
                        <button type="button" onClick={() => handleArtisanSubmit({})}>Submit</button>
                      )}
                      <button type="button" onClick={onClose}>Close</button>
                    </div>
                  </>
                )}

                {step === 2 && newProduct.category === 'artisan' && (
                  <ArtisanSpecsForm
                    onBack={handlePreviousStep}
                    onSubmit={handleArtisanSubmit}
                  />
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddProductModal;
