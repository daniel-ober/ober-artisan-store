import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/firebaseService';
import { createStripeProduct } from '../services/stripeService';
import './AddProductModal.css';
import ArtisanSpecsForm from './ArtisanSpecsForm';
import LoadingSpinner from './LoadingSpinner';
import SuccessModal from './SuccessModal';

const AddProductModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [newProduct, setNewProduct] = useState({
    category: '',
    artisanLine: '',
    name: '',
    price: 0,
    description: '',
    deliveryTime: '',
    sku: '',
    images: [],
    interactive360Url: '',
    status: 'inactive',
    isPreOrder: false,
    maxQuantity: 0,
    currentQuantity: 0,
    isAvailable: false,
    availabilityMessage: '',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successProductId, setSuccessProductId] = useState(null);
  const [error, setError] = useState('');

  const categories = ['artisan', 'merch', 'accessories'];
  const artisanLines = [
    'HERiTAGE',
    'HybridX',
    'Limited Batch',
    'ONE',
    'Custom Shop',
    'Dreamfeather',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'maxQuantity' || name === 'currentQuantity'
        ? parseFloat(value) || 0
        : value,
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
    setSuccessProductId(null);

    try {
      if (
        !newProduct.name ||
        !newProduct.description ||
        newProduct.price <= 0 ||
        !newProduct.sku ||
        !newProduct.deliveryTime ||
        newProduct.maxQuantity <= 0 ||
        newProduct.currentQuantity < 0 ||
        newProduct.currentQuantity > newProduct.maxQuantity
      ) {
        throw new Error(
          'Name, description, price, SKU, delivery time, and valid inventory values are required fields.'
        );
      }

      const uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadImage(file, 'products'))
      );

      const finalProductData = {
        ...newProduct,
        ...artisanData,
        images: uploadedImages,
        createdAt: serverTimestamp(),
      };

      console.log('Final product data before Stripe:', finalProductData);

      const stripeProduct = await createStripeProduct(
        finalProductData.name,
        finalProductData.description,
        finalProductData.price,
        uploadedImages
      );

      if (!stripeProduct || !stripeProduct.product.id) {
        throw new Error('Failed to create Stripe product.');
      }

      const docRef = await addDoc(collection(db, 'products'), {
        ...finalProductData,
        stripeProductId: stripeProduct.product.id,
        stripePriceId: stripeProduct.price.id,
      });

      setSuccessProductId(docRef.id);

      setNewProduct({
        category: '',
        artisanLine: '',
        name: '',
        price: 0,
        description: '',
        deliveryTime: '',
        sku: '',
        images: [],
        interactive360Url: '',
        status: 'inactive',
        isPreOrder: false,
        maxQuantity: 0,
        currentQuantity: 0,
        isAvailable: false,
        availabilityMessage: '',
      });
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
          <SuccessModal productId={successProductId} />
        ) : (
          <>
            <h2>Add New Product</h2>

            {error && <div className="error-message">{error}</div>}

            {isUploading ? (
              <LoadingSpinner />
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

                    {newProduct.category === 'artisan' && (
                      <div className="form-group">
                        <label htmlFor="artisanLine">Artisan Line*</label>
                        <select
                          id="artisanLine"
                          name="artisanLine"
                          value={newProduct.artisanLine}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Artisan Line</option>
                          {artisanLines.map((line) => (
                            <option key={line} value={line}>
                              {line}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

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
                      <label htmlFor="maxQuantity">Max Quantity*</label>
                      <input
                        id="maxQuantity"
                        type="number"
                        name="maxQuantity"
                        value={newProduct.maxQuantity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="currentQuantity">Initial Quantity*</label>
                      <input
                        id="currentQuantity"
                        type="number"
                        name="currentQuantity"
                        value={newProduct.currentQuantity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="isAvailable">Set as Available</label>
                      <input
                        id="isAvailable"
                        type="checkbox"
                        name="isAvailable"
                        checked={newProduct.isAvailable}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            isAvailable: e.target.checked,
                          }))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="availabilityMessage">Availability Message</label>
                      <input
                        id="availabilityMessage"
                        type="text"
                        name="availabilityMessage"
                        value={newProduct.availabilityMessage}
                        onChange={handleInputChange}
                      />
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
                        <button type="button" onClick={handleNextStep}>
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArtisanSubmit({})}
                        >
                          Submit
                        </button>
                      )}
                      <button type="button" onClick={onClose}>
                        Close
                      </button>
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