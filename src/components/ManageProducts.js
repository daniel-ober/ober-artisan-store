import React, { useEffect, useState } from 'react';
import { fetchProducts, deleteProductFromFirestore, updateProductStatus } from '../services/productService';
import EditProductModal from './EditProductModal';
import AddProductModal from './AddProductModal'; 
import './ManageProducts.css';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 

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

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus);
      // Update product state locally
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId ? { ...product, status: newStatus } : product
        )
      );
    } catch (error) {
      console.error('Error updating product status:', error);
      setError('Error updating product status: ' + error.message);
    }
  };

  const openEditModal = (productId) => {
    setEditProductId(productId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditProductId(null);
    setIsEditModalOpen(false);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true); 
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false); 
  };

  const handleProductUpdated = () => {
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

  const handleProductAdded = (newProduct) => {
    setProducts((prevProducts) => [...prevProducts, newProduct]);
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
      <button className="add-new-btn" onClick={openAddModal}>Add New Product</button>
      <table className="manage-products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Status</th>
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
                  <select 
                    value={product.status} 
                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="pending payment">Pending Payment</option>
                  </select>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(product.id)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isEditModalOpen && (
        <EditProductModal 
          productId={editProductId}
          onClose={closeEditModal}
          onProductUpdated={handleProductUpdated}
        />
      )}
      {isAddModalOpen && (
        <AddProductModal
          onClose={closeAddModal}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
};

export default ManageProducts;
