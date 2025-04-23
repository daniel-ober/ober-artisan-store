// src/components/ManageProducts.js
import React, { useState, useEffect } from 'react';
import {
  fetchProducts,
  deleteProduct,
  updateProductStatus,
  updateProductInventory,
} from '../services/productService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ManageProducts.css';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';

const FALLBACK_IMAGE_URL = 'https://i.imgur.com/eoKsILV.png';

const getPreviewImage = (product) => {
  const match =
    product.images?.find(
      (img) => img.is_default && img.position === 'front'
    ) || product.images?.[0];
  return match?.src || FALLBACK_IMAGE_URL;
};

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
        const collections = ['products', 'merchProducts'];
        const allDocs = [];

        for (const name of collections) {
          const snapshot = await getDocs(collection(db, name));
          snapshot.forEach((doc) => {
            allDocs.push({ id: doc.id, ...doc.data(), _source: name });
          });
        }

        setProducts(allDocs);
      } catch (err) {
        console.error(err);
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
    const id = typeof productId === 'string' ? productId : productId?.id || '';
    if (id) {
      window.open(`/products/${id}`, '_blank');
    } else {
      console.warn("Invalid productId passed to openProductDetail:", productId);
    }
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
            {products.map((product) => {
              const isMerch = product._source === 'merchProducts';
              const title = product.title || product.name || 'Unnamed';
              const imageUrl = getPreviewImage(product);

              return (
                <tr key={product.id}>
                  <td>
                    <button
                      className="thumbnail-btn"
                      onClick={() => openProductDetail(product.id)}
                      aria-label={`View details for ${title}`}
                    >
                      <img
                        src={imageUrl}
                        alt={title}
                        className="thumbnail"
                      />
                    </button>
                  </td>
                  <td>{title}</td>
                  <td>
                    <select
                      value={product.status || 'active'}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    {isMerch ? (
                      <span>Managed by Printify</span>
                    ) : (
                      <select
                        value={product.maxQuantity || 0}
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
                    )}
                  </td>
                  <td>
                    {isMerch ? (
                      <span>Auto Synced</span>
                    ) : (
                      <input
                        type="number"
                        value={product.currentQuantity || 0}
                        min="0"
                        max={product.maxQuantity || 0}
                        onChange={(e) =>
                          handleCurrentInventoryChange(
                            product.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setEditProductId(product.id)}
                      disabled={isMerch}
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
              );
            })}
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