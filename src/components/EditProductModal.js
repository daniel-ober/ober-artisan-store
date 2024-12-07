import React, { useState, useEffect } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';
import './EditProductModal.css';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProduct(productId, product);
      onProductUpdated(product);
      onClose();
    } catch (err) {
      setError('Failed to update product.');
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
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={product.name}
              onChange={handleInputChange}
              required
              autoComplete="off"
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
              autoComplete="off"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              value={product.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              autoComplete="off"
            />
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
