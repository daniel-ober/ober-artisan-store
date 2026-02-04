import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import {
  createStripeProduct,
  createStripePrice,
  updateStripeProductWithPrices,
  fetchStripePrices,
} from '../services/stripeService'; // ✅ FIX
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

        let firestorePricingOptions = fetchedProduct.pricingOptions || [];
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

  const handlePriceOptionChange = (index, field, value) => {
    const updated = [...pricingOptions];
    updated[index][field] = value;
    setPricingOptions(updated);
  };

  const addPriceOption = () => {
    setPricingOptions([
      ...pricingOptions,
      { size: '', depth: '', reRing: false, price: 0, stripePriceId: '' },
    ]);
  };

  const removePriceOption = (index) => {
    setPricingOptions(pricingOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let stripeProductId = product.stripeProductId;

      // 1️⃣ Ensure Stripe Product exists
      if (!stripeProductId) {
        const newStripeProduct = await createStripeProduct(
          product.name,
          product.description,
          product.images
        );

        stripeProductId = newStripeProduct.id;
        await updateProduct(productId, { ...product, stripeProductId });
      }

      // 2️⃣ Create / update prices
      const updatedPricingOptions = await Promise.all(
        pricingOptions.map(async (option) => {
          if (option.stripePriceId) {
            const updatedPrice = await updateStripeProductWithPrices(
              stripeProductId,
              option.stripePriceId,
              option.price * 100
            );
            return { ...option, stripePriceId: updatedPrice.id };
          } else {
            const newPrice = await createStripePrice(
              stripeProductId,
              option.price * 100
            );
            return { ...option, stripePriceId: newPrice.id };
          }
        })
      );

      // 3️⃣ Save to Firestore
      const updatedProduct = {
        ...product,
        pricingOptions: updatedPricingOptions,
        stripeProductId,
      };

      await updateProduct(productId, updatedProduct);
      onProductUpdated(updatedProduct);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input name="name" value={product.name} onChange={handleInputChange} required />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update Product'}
          </button>
          <button type="button" onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;