import React, { useEffect, useState } from 'react';
import { fetchProducts, deleteProductFromFirestore } from '../services/productService';
import EditProductModal from './EditProductModal';
import './ManageProducts.css';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const productsData = await fetchProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Error fetching products: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  const handleDelete = async (productId) => {
    try {
      await deleteProductFromFirestore(productId);
      setProducts((prevProducts) => prevProducts.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error deleting product: ' + error.message);
    }
  };

  const openEditModal = (productId) => {
    setEditProductId(productId);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditProductId(null);
    setIsModalOpen(false);
  };

  const handleProductUpdated = () => {
    // Refresh the product list after an update
    const getProducts = async () => {
      try {
        const productsData = await fetchProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error refreshing product list:', error);
      }
    };
    getProducts();
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="manage-products-container">
      <h1>Manage Products</h1>
      <table className="manage-products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>{product.price}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(product.id)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isModalOpen && (
        <EditProductModal 
          productId={editProductId}
          onClose={closeEditModal}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
};

export default ManageProducts;
