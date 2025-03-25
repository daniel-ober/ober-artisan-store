import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import { createStripeProduct, createStripePrice, updateStripeProductWithPrices, fetchStripePrices } from '../services/stripeService';
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
  const [stripePrices, setStripePrices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);

        let firestorePricingOptions = fetchedProduct.pricingOptions || [];
        let stripePricingOptions = [];

        if (["HERITAGE", "FEUZØN", "SOUNDLEGEND"].includes(fetchedProduct.name)) {
          if (fetchedProduct.stripeProductId) {
            const stripePrices = await fetchStripePrices(fetchedProduct.stripeProductId);

            if (stripePrices.length > 0) {
              stripePricingOptions = stripePrices.map((price) => ({
                size: "",
                depth: "",
                reRing: false,
                price: price.unit_amount / 100,
                stripePriceId: price.id,
              }));
            }
          }
        }

        const mergedPricingOptions = firestorePricingOptions.map((firestoreOption) => {
          const matchingStripePrice = stripePricingOptions.find(
            (stripeOption) => stripeOption.stripePriceId === firestoreOption.stripePriceId
          );
          return matchingStripePrice ? { ...firestoreOption, price: matchingStripePrice.price } : firestoreOption;
        });

        stripePricingOptions.forEach((stripeOption) => {
          if (!mergedPricingOptions.find((option) => option.stripePriceId === stripeOption.stripePriceId)) {
            mergedPricingOptions.push(stripeOption);
          }
        });

        setPricingOptions(mergedPricingOptions);
      } catch (err) {
        setError("Failed to load product details.");
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
      [name]: value,
    }));
  };

  const handlePriceOptionChange = (index, field, value) => {
    const updatedOptions = [...pricingOptions];
    updatedOptions[index][field] = value;
    setPricingOptions(updatedOptions);
  };

  const addPriceOption = () => {
    setPricingOptions([
      ...pricingOptions,
      { size: "", depth: "", reRing: false, price: 0, stripePriceId: "" },
    ]);
  };

  const removePriceOption = (index) => {
    setPricingOptions(pricingOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      // console.log("🔄 Updating product in Firestore...");
  
      let stripeProductId = product.stripeProductId;
  
      // ✅ Step 1: Ensure Stripe Product Exists
      if (!stripeProductId) {
        // console.log("⚠️ No Stripe Product ID found. Creating a new Stripe product...");
  
        const newStripeProduct = await createStripeProduct(
          product.name,
          product.description,
          product.images
        );
  
        if (!newStripeProduct || !newStripeProduct.id) {
          throw new Error("❌ Failed to create Stripe product.");
        }
  
        stripeProductId = newStripeProduct.id;
        // console.log(`✅ Created Stripe Product: ${stripeProductId}`);
  
        // ✅ Update Firestore with the new Stripe Product ID
        await updateProduct(productId, { ...product, stripeProductId });
      }
  
      // ✅ Step 2: Update or Create Stripe Prices
      const updatedPricingOptions = await Promise.all(
        pricingOptions.map(async (option) => {
          if (option.stripePriceId) {
            // console.log(`🔄 Updating existing Stripe price: ${option.stripePriceId}`);
            return option; // Keep existing price ID
          } else {
            // console.log(`➕ Creating new Stripe price for:`, option);
            // const newStripePrice = await createStripePrice(stripeProductId, option.price * 100);
            return { ...option, stripePriceId: newStripePrice.id };
          }
        })
      );
  
      // ✅ Step 3: Save Updated Product to Firestore
      const updatedProduct = { ...product, pricingOptions: updatedPricingOptions, stripeProductId };
      await updateProduct(productId, updatedProduct);
      // console.log("✅ Product updated in Firestore with Stripe Prices:", updatedProduct);
  
      onProductUpdated(updatedProduct);
      onClose();
    } catch (err) {
      console.error("❌ Failed to update product:", err);
      setError(err.message || "Failed to update product.");
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
            <label htmlFor="name">Product Name</label>
            <input id="name" name="name" type="text" value={product.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="price">Base Price (USD)</label>
            <input id="price" name="price" type="number" value={product.price} onChange={handleInputChange} min="0" required />
          </div>

          <div className="form-group">
  <label htmlFor="pricing-options">Pricing Options</label>
  <div id="pricing-options">
    {pricingOptions.map((option, index) => (
      <div key={index} className="price-option">
        <label htmlFor={`size-${index}`}>Size</label>
        <select
          id={`size-${index}`}
          value={option.size}
          onChange={(e) => handlePriceOptionChange(index, "size", e.target.value)}
        >
          <option value="">Select</option>
          <option value="12-inch">12-inch</option>
          <option value="13-inch">13-inch</option>
          <option value="14-inch">14-inch</option>
        </select>

        <label htmlFor={`depth-${index}`}>Depth</label>
        <select
          id={`depth-${index}`}
          value={option.depth}
          onChange={(e) => handlePriceOptionChange(index, "depth", e.target.value)}
        >
          <option value="">Select</option>
          <option value="5-inch">5-inch</option>
          <option value="5.5-inch">5.5-inch</option>
          <option value="6-inch">6-inch</option>
          <option value="6.5-inch">6.5-inch</option>
          <option value="7-inch">7-inch</option>
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={option.reRing}
            onChange={(e) => handlePriceOptionChange(index, "reRing", e.target.checked)}
          />
          Re-Ring
        </label>

        <label htmlFor={`price-${index}`}>Price (USD)</label>
        <input
          id={`price-${index}`}
          type="number"
          value={option.price}
          onChange={(e) => handlePriceOptionChange(index, "price", e.target.value)}
          min="0"
          required
        />

        <button type="button" onClick={() => removePriceOption(index)}>Remove</button>
      </div>
    ))}
  </div>
  <button type="button" onClick={addPriceOption}>+ Add Price Option</button>
</div>

          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Product"}</button>
          <button type="button" onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;