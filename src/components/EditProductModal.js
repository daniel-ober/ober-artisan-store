import React, { useEffect, useState } from 'react';
import { fetchProductById, updateProductInFirestore } from '../services/productService'; // Use updateProductInFirestore
import './Modal.css';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState({ name: '', description: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const fetchedProduct = await fetchProductById(productId);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Error fetching product: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [productId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProductInFirestore(productId, product); // Update this line
      onProductUpdated(); // Call this to refresh the product list
      onClose(); // Close the modal after update
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error updating product: ' + error.message);
    }
  };

  if (loading) {
    return <div>Loading product...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Product</h3>
        <form onSubmit={handleUpdate}>
          <input 
            type="text" 
            value={product.name} 
            onChange={(e) => setProduct({ ...product, name: e.target.value })} 
            placeholder="Product Name" 
            required 
          />
          <input 
            type="text" 
            value={product.description} 
            onChange={(e) => setProduct({ ...product, description: e.target.value })} 
            placeholder="Product Description" 
            required 
          />
          <input 
            type="number" 
            value={product.price} 
            onChange={(e) => setProduct({ ...product, price: e.target.value })} 
            placeholder="Product Price" 
            required 
          />
          <button type="submit">Update Product</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
