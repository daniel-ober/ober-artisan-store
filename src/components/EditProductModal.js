import React, { useEffect, useState } from 'react';
import { fetchProductById, updateProductInFirestore } from '../services/productService'; 
import './Modal.css'; // You can keep this line for future CSS if needed

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
  const [product, setProduct] = useState({ name: '', description: '', price: 0, priceId: '', productId: '' });
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
      await updateProductInFirestore(productId, product); 
      onProductUpdated(); 
      onClose(); 
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error updating product: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'price' ? parseFloat(value) : value; // Convert price to number
    setProduct({ ...product, [name]: updatedValue });
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
            onChange={handleInputChange} 
            name="name"
            placeholder="Product Name" 
            required 
          />
          <input 
            type="text" 
            value={product.description} 
            onChange={handleInputChange} 
            name="description"
            placeholder="Product Description" 
            required 
          />
          <input 
            type="number" 
            value={product.price} 
            onChange={handleInputChange} 
            name="price"
            placeholder="Product Price" 
            required 
          />
          <input 
            type="text" 
            value={product.priceId} 
            onChange={handleInputChange} 
            name="priceId"
            placeholder="Price ID" 
            required 
          />
          <input 
            type="text" 
            value={product.productId} 
            onChange={handleInputChange} 
            name="productId"
            placeholder="Product ID" 
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
