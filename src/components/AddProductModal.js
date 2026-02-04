import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createStripeProduct, createStripePrice } from '../services/stripeService'; // ✅ FIX
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
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successProductId, setSuccessProductId] = useState(null);
  const [error, setError] = useState('');
  let isSubmitting = false;

  const categories = ['artisan', 'merch', 'accessories', 'soundlegend'];
  const artisanLines = ['Feuzon', 'Heritage', 'ONE'];
  const soundlegendLines = ['SoundLegend'];

  const uploadImage = async (file, folder) => {
    const storage = getStorage();
    const storageRef = ref(storage, `${folder}/${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Error uploading image');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]:
        name === 'price' || name === 'maxQuantity' || name === 'currentQuantity'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const generateSku = (category, artisanLine) => {
    const categoryPrefixes = {
      artisan: 'ART',
      merch: 'MER',
      accessories: 'ACC',
      soundlegend: 'SLD',
    };

    const artisanLinePrefixes = {
      Feuzon: 'FZ',
      Heritage: 'H',
      ONE: '1',
      SoundLegend: 'SLD',
    };

    const timestamp = Date.now().toString().slice(-6);
    return `${categoryPrefixes[category] || 'GEN'}${
      artisanLine ? `-${artisanLinePrefixes[artisanLine] || ''}` : ''
    }-${timestamp}`;
  };

  const handleArtisanSubmit = async (artisanData) => {
    if (isSubmitting) return;
    isSubmitting = true;

    setIsUploading(true);
    setError('');

    try {
      if (
        !newProduct.name ||
        !newProduct.description ||
        newProduct.price <= 0 ||
        !newProduct.deliveryTime ||
        newProduct.maxQuantity <= 0 ||
        newProduct.currentQuantity < 0 ||
        newProduct.currentQuantity > newProduct.maxQuantity
      ) {
        throw new Error(
          'Name, description, price, delivery time, and valid inventory values are required fields.'
        );
      }

      const sku = generateSku(newProduct.category, newProduct.artisanLine);

      const uploadedImageUrls = [];
      for (const file of imageFiles) {
        uploadedImageUrls.push(await uploadImage(file, 'products'));
      }

      const stripeProduct = await createStripeProduct(
        newProduct.name,
        newProduct.description,
        uploadedImageUrls,
        { SKU: sku }
      );

      const stripePrice = await createStripePrice(
        stripeProduct.id,
        newProduct.price
      );

      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        ...artisanData,
        sku,
        images: uploadedImageUrls,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        createdAt: serverTimestamp(),
        isOutOfStock: newProduct.maxQuantity === 0,
      });

      setSuccessProductId(docRef.id);
      setStep(1);
      setImageFiles([]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add product.');
    } finally {
      isSubmitting = false;
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
                {/* form unchanged */}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddProductModal;