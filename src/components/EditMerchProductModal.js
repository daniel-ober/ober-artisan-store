import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EditMerchProductModal.css';

const EditMerchProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'merchProducts', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching merch product:', err);
        setError('Failed to load product');
      }
    };
    fetchProduct();
  }, [productId]);

  const handleToggleImage = (index) => {
    if (!product) return;
    const updatedImages = product.images.map((img, i) =>
      i === index ? { ...img, displayInGallery: !img.displayInGallery } : img
    );
    setProduct({ ...product, images: updatedImages });
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'merchProducts', product.id);
      await updateDoc(docRef, {
        images: product.images,
        updatedAt: new Date(),
      });
      onProductUpdated(product);
      onClose();
    } catch (err) {
      console.error('Failed to update product:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="edit-merch-modal">
        <p>{error}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="edit-merch-modal">
      <h3>Edit Merch Product: {product.title}</h3>
      <div className="image-toggle-grid">
        {product.images?.map((img, index) => (
          <div key={index} className="image-toggle-item">
            <img src={img.src} alt={`Image ${index}`} />
            <label>
              <input
                type="checkbox"
                checked={img.displayInGallery}
                onChange={() => handleToggleImage(index)}
              />
              Display in Gallery
            </label>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditMerchProductModal;