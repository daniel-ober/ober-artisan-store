import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import { updateStripeProduct } from '../services/stripeService';
import './EditProductModal.css';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    sku: '',
    deliveryTime: '',
    images: [],
    interactive360Url: '',
    height: '',
    width: '',
    weight: '',
    shellThickness: '',
    bearingEdge: '',
    woodSpecies: [],
    customWoodSpecies: '',
    constructionType: '',
    drumType: '',
    finish: '',
    hardwareColor: '',
    lugCount: '',
    lugType: '',
    snareThrowOff: '',
    snareWires: '',
    quantityStaves: '',
    completionDate: '',
    stripeProductId: '',
    stripePriceId: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialProduct, setInitialProduct] = useState({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);
        setInitialProduct(fetchedProduct);  // Store initial product state
      } catch (err) {
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleWoodSpeciesChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setProduct((prevProduct) => ({
      ...prevProduct,
      woodSpecies: selectedOptions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update Firestore product data
      await updateProduct(productId, product);

      // Trigger Stripe update if price or name changes
      if (
        product.name !== initialProduct.name ||
        product.price !== initialProduct.price
      ) {
        const updatedStripe = await updateStripeProduct(
          product.stripeProductId,
          product.name,
          product.description,
          product.images,
          product.price,
          product.stripePriceId
        );

        // If a new price ID is created, update Firestore
        if (updatedStripe.newPriceId) {
          await updateProduct(productId, {
            stripePriceId: updatedStripe.newPriceId,
          });
        }
      }

      onProductUpdated(product);
      onClose();
    } catch (err) {
      setError('Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const drumTypes = ['Snare', 'Piccolo', 'Tom', 'Bass Drum', 'Floor Tom'];
  const constructionTypes = ['Stave', 'Ply', 'Steam Bent', 'Hybrid'];
  const woodSpeciesOptions = ['Maple', 'Mahogany', 'Birch', 'Walnut'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={product.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (USD)</label>
            <input
              id="price"
              name="price"
              type="number"
              value={product.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group non-editable">
            <label htmlFor="category">Category (Non-editable)</label>
            <input
              id="category"
              name="category"
              type="text"
              value={product.category}
              disabled
            />
          </div>

          {product.category === 'artisan' && (
            <>
              <div className="form-group">
                <label htmlFor="drumType">Drum Type</label>
                <select
                  id="drumType"
                  name="drumType"
                  value={product.drumType}
                  onChange={handleInputChange}
                >
                  {drumTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group non-editable">
            <label htmlFor="stripeProductId">Stripe Product ID</label>
            <input id="stripeProductId" type="text" value={product.stripeProductId} disabled />
          </div>

          <div className="form-group non-editable">
            <label htmlFor="stripePriceId">Stripe Price ID</label>
            <input id="stripePriceId" type="text" value={product.stripePriceId} disabled />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Product'}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
