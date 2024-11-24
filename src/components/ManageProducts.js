import React, { useState, useEffect } from 'react';
import { fetchProducts, deleteProduct } from '../services/productService';
import './ManageProducts.css';
import AddProductModal from './AddProductModal'; // Import AddProductModal

const ManageProducts = ({ onEditProduct }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Add modal state

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter((product) => product.id !== productId));
    } catch (err) {
      setError('Error deleting product.');
    }
  };

  const handleAddProduct = () => {
    setIsAddModalOpen(true); // Open AddProductModal
  };

  const handleAddProductClose = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div className="manage-products-container">
      <h1>Manage Products</h1>
      <button className="add-btn" onClick={handleAddProduct}>
        Add Product
      </button>
      {loading && <p>Loading products...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <table className="manage-products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.status}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => onEditProduct(product.id)} // Trigger edit function
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isAddModalOpen && (
        <AddProductModal
          onClose={handleAddProductClose}
          onProductAdded={(newProduct) => {
            setProducts([newProduct, ...products]);
          }}
        />
      )}
    </div>
  );
};

export default ManageProducts;
