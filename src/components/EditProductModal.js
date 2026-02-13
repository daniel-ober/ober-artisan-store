import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import {
  createStripeProduct,
  createStripePrice,
  updateStripeProductWithPrices,
  fetchStripePrices,
} from '../services/stripeService';
import './EditProductModal.css';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState({
    category: '',
    name: '',
    price: 0,
    description: '',
    deliveryTime: '',
    sku: '',
    images: [],
    interactive360Url: '',
    status: 'inactive',
    depth: '',
    width: '',
    weight: '',
    thickness: '',
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
    isPreOrder: false,
  });

  const [pricingOptions, setPricingOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);

        const firestorePricingOptions = fetchedProduct.pricingOptions || [];
        let stripePricingOptions = [];

        if (fetchedProduct.stripeProductId) {
          const stripePrices = await fetchStripePrices(fetchedProduct.stripeProductId);

          stripePricingOptions = stripePrices.map((price) => ({
            size: '',
            depth: '',
            reRing: false,
            price: price.unit_amount / 100,
            stripePriceId: price.id,
          }));
        }

        const mergedPricingOptions = firestorePricingOptions.map((firestoreOption) => {
          const match = stripePricingOptions.find(
            (stripeOption) => stripeOption.stripePriceId === firestoreOption.stripePriceId
          );
          return match ? { ...firestoreOption, price: match.price } : firestoreOption;
        });

        stripePricingOptions.forEach((stripeOption) => {
          if (!mergedPricingOptions.find((o) => o.stripePriceId === stripeOption.stripePriceId)) {
            mergedPricingOptions.push(stripeOption);
          }
        });

        setPricingOptions(mergedPricingOptions);
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
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let stripeProductId = product.stripeProductId;

      // 1) Ensure Stripe Product exists
      if (!stripeProductId) {
        const newStripeProduct = await createStripeProduct(
          product.name,
          product.description,
          product.images
        );

        stripeProductId = newStripeProduct.id;
        await updateProduct(productId, { ...product, stripeProductId });
      }

      // 2) Create / update prices
      const updatedPricingOptions = await Promise.all(
        pricingOptions.map(async (option) => {
          const cents = Math.round(Number(option.price || 0) * 100);

          if (option.stripePriceId) {
            const updatedPrice = await updateStripeProductWithPrices(
              stripeProductId,
              option.stripePriceId,
              cents
            );
            return { ...option, stripePriceId: updatedPrice.id };
          } else {
            const newPrice = await createStripePrice(stripeProductId, cents);
            return { ...option, stripePriceId: newPrice.id };
          }
        })
      );

      // 3) Save to Firestore
      const updatedProduct = {
        ...product,
        pricingOptions: updatedPricingOptions,
        stripeProductId,
      };

      await updateProduct(productId, updatedProduct);
      onProductUpdated(updatedProduct);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="epm-modal-overlay">
        <div className="epm-modal-content">
          <div className="epm-loading">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="epm-modal-overlay" onMouseDown={onClose}>
      <div className="epm-modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="epm-modal-header">
          <h2 className="epm-title">Edit Product</h2>
          <button type="button" className="epm-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="epm-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="epm-form-group">
            <label className="epm-label">Product Name</label>
            <input
              className="epm-input"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="epm-actions">
            <button className="epm-btn epm-btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update Product'}
            </button>

            <button className="epm-btn epm-btn-ghost" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;