import React, { useState, useEffect } from 'react';
import {
  deleteProduct,
  hardDeleteProduct, // ⬅️ NEW
  updateProductStatus,
  updateProductInventory,
  triggerPrintifyStockRefresh,
} from '../services/productService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ManageProducts.css';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import EditMerchProductModal from './EditMerchProductModal';
import AddMerchFromPrintifyModal from './AddMerchFromPrintifyModal';

const FALLBACK_IMAGE_URL = 'https://i.imgur.com/eoKsILV.png';

const getPreviewImage = (product) => {
  const match =
    product.images?.find((img) => img.is_default && img.position === 'front') ||
    product.images?.[0];
  // Printify images often use { src }; artisan images might be direct URLs
  return (match && (match.src || match.url)) || product.previewImage || FALLBACK_IMAGE_URL;
};

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMerchModalOpen, setIsAddMerchModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const [printifyLastUpdated, setPrintifyLastUpdated] = useState(null);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const collectionsToRead = ['products', 'merchProducts'];
      const allDocs = [];
      let latestSync = null;

      for (const name of collectionsToRead) {
        const snapshot = await getDocs(collection(db, name));
        snapshot.forEach((docRef) => {
          const data = docRef.data();
          allDocs.push({ id: docRef.id, ...data, _source: name });

          if (name === 'merchProducts' && data.updatedAt?.toDate) {
            const updatedTime = data.updatedAt.toDate();
            if (!latestSync || updatedTime > latestSync) latestSync = updatedTime;
          } else if (name === 'merchProducts' && data.syncedAt?.toDate) {
            const syn = data.syncedAt.toDate();
            if (!latestSync || syn > latestSync) latestSync = syn;
          }
        });
      }

      setProducts(allDocs);
      if (latestSync) setPrintifyLastUpdated(latestSync);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const source = target._source || 'merchProducts';
    const title = target.title || target.name || 'this product';

    // Ask whether to HARD delete (Stripe + Printify + Firestore) or soft delete (Firestore only)
    const doHard = window.confirm(
      `Hard Delete "${title}"?\n\nOK = hard delete (also cleans up Stripe and, for merch, tries to delete in Printify)\nCancel = regular delete (Firestore only)`
    );

    try {
      if (doHard) {
        await hardDeleteProduct(productId, source);
      } else {
        await deleteProduct(productId);
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error(err);
      setError('Error deleting product.');
    }
  };

  const handleAddProductClose = () => setIsAddModalOpen(false);

  // ✅ Preserve _source (and any untouched fields) when an item is updated
  const handleProductUpdate = (updated) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== updated.id) return p;
        return { ...p, ...updated, _source: p._source || updated._source };
      })
    );
    setEditProductId(null);
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch {
      setError('Failed to update product status.');
    }
  };

  const handleMaxInventoryChange = async (productId, newMaxInventory) => {
    try {
      await updateProductInventory(productId, { maxQuantity: newMaxInventory });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, maxQuantity: newMaxInventory } : p))
      );
    } catch {
      setError('Failed to update max inventory.');
    }
  };

  const handleCurrentInventoryChange = async (productId, newCurrentInventory) => {
    try {
      await updateProductInventory(productId, { currentQuantity: newCurrentInventory });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, currentQuantity: newCurrentInventory } : p
        )
      );
    } catch {
      setError('Failed to update current inventory.');
    }
  };

  const openProductDetail = (productOrId) => {
    const product =
      typeof productOrId === 'object' ? productOrId : products.find((p) => p.id === productOrId);
    if (!product) return;

    // Fallback inference if _source is ever missing
    const isMerch = product._source
      ? product._source === 'merchProducts'
      : Array.isArray(product?.variants);

    const url = isMerch ? `/merch/${product.id}` : `/products/${product.id}`;
    window.open(url, '_blank');
  };

  const productToEdit = editProductId ? products.find((p) => p.id === editProductId) : null;

  const handleRefreshPrintifyStock = async () => {
    setIsRefreshingStock(true);
    try {
      await triggerPrintifyStockRefresh();
      await fetchAllProducts();
      alert('✅ Printify stock refresh triggered successfully.');
    } catch (err) {
      console.error('❌ Failed to refresh stock:', err);
      alert('❌ Failed to trigger Printify stock refresh.');
    } finally {
      setIsRefreshingStock(false);
    }
  };

  return (
    <div className="manage-products-container">
      <h2>Manage Products</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="add-product-btn"
          onClick={handleRefreshPrintifyStock}
          disabled={isRefreshingStock}
          style={{ backgroundColor: '#444' }}
        >
          {isRefreshingStock ? 'Refreshing...' : 'Refresh Printify Stock'}
        </button>

        <button className="add-product-btn" onClick={() => setIsAddMerchModalOpen(true)}>
          + Add Merch from Printify
        </button>

        <button
          className="add-product-btn"
          onClick={() => setIsAddModalOpen(true)}
          style={{ backgroundColor: '#1363df' }}
        >
          + Add Artisan Product
        </button>
      </div>

      {printifyLastUpdated && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
          Printify Stock Last Updated:{' '}
          {printifyLastUpdated.toLocaleString('en-US', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </p>
      )}

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
              const isMerch = product._source
                ? product._source === 'merchProducts'
                : Array.isArray(product?.variants);
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
                      <img src={imageUrl} alt={title} className="thumbnail" />
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
                      'Managed by Printify'
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
                      'Auto Synced'
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
                    <button className="edit-btn" onClick={() => setEditProductId(product.id)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
                      title="Delete (will ask Hard vs Soft delete)"
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
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={(newProduct) =>
            setProducts((prev) => [{ ...newProduct, _source: 'products' }, ...prev])
          }
        />
      )}

      {isAddMerchModalOpen && (
        <AddMerchFromPrintifyModal
          onClose={() => setIsAddMerchModalOpen(false)}
          onAdded={(merchProduct) =>
            setProducts((prev) => [{ ...merchProduct, _source: 'merchProducts' }, ...prev])
          }
        />
      )}

      {productToEdit && (() => {
        // Use key to force correct modal to mount fresh each time
        const isMerch = productToEdit._source
          ? productToEdit._source === 'merchProducts'
          : Array.isArray(productToEdit?.variants);
        return isMerch ? (
          <EditMerchProductModal
            key={`merch-${productToEdit.id}`}
            productId={productToEdit.id}
            onClose={() => setEditProductId(null)}
            onProductUpdated={handleProductUpdate}
          />
        ) : (
          <EditProductModal
            key={`artisan-${productToEdit.id}`}
            productId={productToEdit.id}
            onClose={() => setEditProductId(null)}
            onProductUpdated={handleProductUpdate}
          />
        );
      })()}
    </div>
  );
};

export default ManageProducts;