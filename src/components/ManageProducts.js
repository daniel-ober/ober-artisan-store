import React, { useState, useEffect } from 'react';
import {
  fetchProducts,
  deleteProduct,
  updateProductStatus,
  updateProductInventory,
} from '../services/productService'; // Assuming inventory update logic is in productService
import './ManageProducts.css';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';

const FALLBACK_IMAGE_URL = 'https://i.imgur.com/eoKsILV.png';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);

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

  const handleAddProductClose = () => setIsAddModalOpen(false);

  const handleProductUpdate = (updatedProduct) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
    setEditProductId(null);
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? { ...product, status: newStatus } : product
        )
      );
    } catch (err) {
      setError('Failed to update product status.');
    }
  };

  const handleMaxInventoryChange = async (productId, newMaxInventory) => {
    try {
      await updateProductInventory(productId, { maxQuantity: newMaxInventory });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, maxQuantity: newMaxInventory }
            : product
        )
      );
    } catch (err) {
      setError('Failed to update max inventory.');
    }
  };

  const handleCurrentInventoryChange = async (productId, newCurrentInventory) => {
    try {
      await updateProductInventory(productId, {
        currentQuantity: newCurrentInventory,
      });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, currentQuantity: newCurrentInventory }
            : product
        )
      );
    } catch (err) {
      setError('Failed to update current inventory.');
    }
  };

  const openProductDetail = (productId) => {
    window.open(`/products/${productId}`, '_blank');
  };

  return (
    <div className="manage-products-container">
      <h2>Manage Products</h2>
      <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>
        Add Product
      </button>
      {loading && <p>Loading products...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <table className="manage-products-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Name</th>
              <th>Status</th>
              <th>Max Inventory</th>
              <th>Current Inventory</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <button
                    className="thumbnail-btn"
                    onClick={() => openProductDetail(product.id)}
                    aria-label={`View details for ${product.name}`}
                  >
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : FALLBACK_IMAGE_URL
                      }
                      alt={product.name || 'No Image Available'}
                      className="thumbnail"
                    />
                  </button>
                </td>
                <td>{product.name}</td>
                <td>
                  <select
                    value={product.status}
                    onChange={(e) =>
                      handleStatusChange(product.id, e.target.value)
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <select
                    value={product.maxQuantity}
                    onChange={(e) =>
                      handleMaxInventoryChange(product.id, parseInt(e.target.value))
                    }
                  >
                    {Array.from({ length: 21 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={product.currentQuantity}
                    min="0"
                    max={product.maxQuantity}
                    onChange={(e) =>
                      handleCurrentInventoryChange(
                        product.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => setEditProductId(product.id)}
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
          onProductAdded={(newProduct) =>
            setProducts([newProduct, ...products])
          }
        />
      )}
      {editProductId && (
        <EditProductModal
          productId={editProductId}
          onClose={() => setEditProductId(null)}
          onProductUpdated={handleProductUpdate}
        />
      )}
    </div>
  );
};

export default ManageProducts;