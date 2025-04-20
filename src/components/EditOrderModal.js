import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
// import { updateStripeProduct } from '../services/stripeService';
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
    height: '',
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
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialProduct, setInitialProduct] = useState({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);
        setInitialProduct(fetchedProduct);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
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
      if (product.name !== initialProduct.name || product.price !== initialProduct.price) {
        const updatedStripe = await updateStripeProduct(
          product.stripeProductId,
          product.name,
          product.description,
          product.images,
          product.price,
          product.stripePriceId
        );

        if (updatedStripe.newPriceId) {
          await updateProduct(productId, { stripePriceId: updatedStripe.newPriceId });
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

  const categories = ['artisan', 'merch', 'accessories'];
  const drumTypes = ['Snare', 'Piccolo', 'Tom', 'Bass Drum', 'Floor Tom'];
  const constructionTypes = ['Stave', 'Ply', 'Steam Bent', 'Hybrid'];

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
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
            <label htmlFor="sku">SKU</label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={product.sku}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="deliveryTime">Delivery Time</label>
            <input
              id="deliveryTime"
              name="deliveryTime"
              type="text"
              value={product.deliveryTime}
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
            <label htmlFor="file-upload">Images</label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
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