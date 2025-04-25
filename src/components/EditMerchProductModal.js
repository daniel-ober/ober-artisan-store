import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EditMerchProductModal.css';

const EditMerchProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [variantOptions, setVariantOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || typeof productId !== 'string') {
        setError('Invalid product ID');
        return;
      }

      try {
        const docRef = doc(db, 'merchProducts', productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Product not found');
          return;
        }

        const data = docSnap.data();
        const safeImages = Array.isArray(data.images)
          ? data.images.map((img = {}, i) => ({
              ...img,
              _index: i,
              src: typeof img.src === 'string' ? img.src : '',
              variant_ids: Array.isArray(img.variant_ids) ? img.variant_ids.map(String) : [],
              displayInGallery: typeof img.displayInGallery === 'boolean' ? img.displayInGallery : true,
            }))
          : [];

        const safeVariants = Array.isArray(data.variants)
          ? data.variants.filter((v) => v?.is_enabled && v?.is_available)
          : [];

        const optionsList = data.options || [];
        const option = optionsList.find((opt) => opt.name === 'Colors') || optionsList[0];
        const map = new Map();

        safeVariants.forEach((variant) => {
          const id = variant.options?.[option ? optionsList.indexOf(option) : 0];
          const matched = option?.values?.find((v) => v.id === id);
          if (matched?.title) map.set(matched.title, variant.id);
        });

        const fallbackId = [...map.values()][0] || null;

        setProduct({ id: docSnap.id, ...data, images: safeImages, variants: safeVariants });
        setVariantOptions(Array.from(map.entries()));
        setSelectedVariantId(fallbackId);
      } catch (err) {
        console.error('❌ Error fetching merch product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleToggleImage = (index) => {
    if (!product?.images?.[index]) return;
    const newImages = product.images.map((img, i) =>
      i === index ? { ...img, displayInGallery: !img.displayInGallery } : img
    );
    setProduct({ ...product, images: newImages });
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'merchProducts', product.id);
      await updateDoc(docRef, {
        images: product.images,
        title: product.title,
        description: product.description,
        updatedAt: new Date(),
      });
      onProductUpdated(product);
      onClose();
    } catch (err) {
      console.error('❌ Failed to update product:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const filteredImages = product?.images?.filter((img) =>
    img.variant_ids.map(String).includes(String(selectedVariantId))
  );

  if (loading || !product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Merch Product</h2>
        {error && <p className="error-message">{error}</p>}

        <label>Title:</label>
        <input
          type="text"
          value={product.title || ''}
          onChange={(e) => setProduct({ ...product, title: e.target.value })}
        />

        <label>Description:</label>
        <textarea
          value={product.description || ''}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
        />

        {variantOptions.length > 0 && (
          <div className="variant-selector">
            <select
              value={selectedVariantId || ''}
              onChange={(e) => setSelectedVariantId(e.target.value)}
            >
              {variantOptions.map(([title, id]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="image-toggle-grid">
          {filteredImages?.length > 0 ? (
            filteredImages.map((img, index) => (
              <div key={img._index} className="image-toggle-item">
                {img?.src ? (
                  <img src={img.src} alt={`Image ${img._index}`} />
                ) : (
                  <div className="image-placeholder">No image</div>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={!!product.images[img._index]?.displayInGallery}
                    onChange={() => handleToggleImage(img._index)}
                  />
                  Display in Gallery
                </label>
              </div>
            ))
          ) : (
            <p>No images available for this variant.</p>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMerchProductModal;