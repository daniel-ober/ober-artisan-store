// src/components/EditProductModal.js
import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import { updateStripeProduct, fetchStripePrices } from '../services/stripeService';
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

  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stripePrices, setStripePrices] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);

        if (fetchedProduct.stripeProductId) {
          const prices = await fetchStripePrices(fetchedProduct.stripeProductId);
          setStripePrices(prices);
        }
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
      [name]: value,
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
      await updateProduct(productId, product);

      if (product.name || product.price) {
        await updateStripeProduct(
          product.stripeProductId,
          product.name,
          product.description,
          product.images,
          product.price,
          product.stripePriceId
        );
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
  const hardwareColors = ['Chrome', 'Black Nickel', 'Gold'];
  const finishes = ['Gloss', 'Matte', 'Satin', 'Natural'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={product.category}
              onChange={handleInputChange}
              required
            >
              <option value="artisan">Artisan</option>
              <option value="merch">Merch</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="isPreOrder">Set as Pre-Order</label>
            <input
              id="isPreOrder"
              type="checkbox"
              name="isPreOrder"
              checked={product.isPreOrder}
              onChange={(e) =>
                setProduct((prevProduct) => ({ ...prevProduct, isPreOrder: e.target.checked }))
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Product Name</label>
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

          <div className="form-group">
            <label htmlFor="depth">Depth (in)</label>
            <input
              id="depth"
              name="depth"
              type="text"
              value={product.depth}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="thickness">Thickness (mm)</label>
            <input
              id="thickness"
              name="thickness"
              type="text"
              value={product.thickness}
              onChange={handleInputChange}
            />
          </div>


          <div className="form-group">
            <label htmlFor="weight">Weight (lbs)</label>
            <input
              id="weight"
              name="weight"
              type="text"
              value={product.weight}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="constructionType">Construction Type</label>
            <select
              id="constructionType"
              name="constructionType"
              value={product.constructionType}
              onChange={handleInputChange}
            >
              {constructionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hardwareColor">Hardware Color</label>
            <select
              id="hardwareColor"
              name="hardwareColor"
              value={product.hardwareColor}
              onChange={handleInputChange}
            >
              {hardwareColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="finish">Finish</label>
            <select
              id="finish"
              name="finish"
              value={product.finish}
              onChange={handleInputChange}
            >
              {finishes.map((finish) => (
                <option key={finish} value={finish}>
                  {finish}
                </option>
              ))}
            </select>
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