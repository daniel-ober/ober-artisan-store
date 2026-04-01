import React, { useEffect, useMemo, useState } from 'react';
import {
  deleteProduct,
  hardDeleteProduct,
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

  return (
    (match && (match.src || match.url)) ||
    product.previewImage ||
    FALLBACK_IMAGE_URL
  );
};

const normalizeStatus = (status) => {
  const value = String(status || '')
    .toLowerCase()
    .trim();
  return value === 'inactive' ? 'inactive' : 'active';
};

const formatDateTime = (value) => {
  try {
    if (!value) return '—';
    if (value?.toDate) {
      return value.toDate().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
};

const getSortValue = (product, key) => {
  const isMerch = product._source === 'merchProducts';

  switch (key) {
    case 'name':
      return String(product.title || product.name || '').toLowerCase();
    case 'type':
      return isMerch ? 'merch' : 'artisan';
    case 'status':
      return normalizeStatus(product.status);
    case 'maxQuantity':
      return Number(product.maxQuantity || 0);
    case 'currentQuantity':
      return Number(product.currentQuantity || 0);
    case 'updatedAt':
      if (product.updatedAt?.toDate)
        return product.updatedAt.toDate().getTime();
      if (product.syncedAt?.toDate) return product.syncedAt.toDate().getTime();
      return 0;
    default:
      return '';
  }
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

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'updatedAt', dir: 'desc' });

  const fetchAllProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const collectionsToRead = ['products', 'merchProducts'];
      const allDocs = [];
      let latestSync = null;

      for (const name of collectionsToRead) {
        const snapshot = await getDocs(collection(db, name));

        snapshot.forEach((docRef) => {
          const data = docRef.data();

          allDocs.push({
            id: docRef.id,
            ...data,
            _source: name,
          });

          if (name === 'merchProducts' && data.updatedAt?.toDate) {
            const updatedTime = data.updatedAt.toDate();
            if (!latestSync || updatedTime > latestSync)
              latestSync = updatedTime;
          } else if (name === 'merchProducts' && data.syncedAt?.toDate) {
            const syncedTime = data.syncedAt.toDate();
            if (!latestSync || syncedTime > latestSync) latestSync = syncedTime;
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

  const handleProductUpdate = (updated) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? { ...p, ...updated, _source: p._source || updated._source }
          : p
      )
    );
    setEditProductId(null);
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update product status.');
    }
  };

  const handleMaxInventoryChange = async (productId, newMaxInventory) => {
    try {
      await updateProductInventory(productId, {
        maxQuantity: newMaxInventory,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, maxQuantity: newMaxInventory } : p
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update max inventory.');
    }
  };

  const handleCurrentInventoryChange = async (
    productId,
    newCurrentInventory
  ) => {
    try {
      await updateProductInventory(productId, {
        currentQuantity: newCurrentInventory,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, currentQuantity: newCurrentInventory }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update current inventory.');
    }
  };

  const openProductDetail = (productOrId) => {
    const product =
      typeof productOrId === 'object'
        ? productOrId
        : products.find((p) => p.id === productOrId);

    if (!product) return;

    const isMerch = product._source
      ? product._source === 'merchProducts'
      : Array.isArray(product?.variants);

    const url = isMerch ? `/merch/${product.id}` : `/products/${product.id}`;
    window.open(url, '_blank');
  };

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

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          dir: prev.dir === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, dir: 'asc' };
    });
  };

  const renderSortIndicator = (key) => {
    if (sort.key !== key) return '↕';
    return sort.dir === 'asc' ? '▲' : '▼';
  };

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    let next = [...products];

    if (searchValue) {
      next = next.filter((product) => {
        const isMerch = product._source === 'merchProducts';
        const typeLabel = isMerch ? 'merch' : 'artisan';

        const haystack = [
          product.title,
          product.name,
          product.id,
          product._source,
          typeLabel,
          product.status,
          product.category,
          product.collection,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(searchValue);
      });
    }

    if (typeFilter !== 'all') {
      next = next.filter((product) => {
        const isMerch = product._source === 'merchProducts';
        return typeFilter === 'merch' ? isMerch : !isMerch;
      });
    }

    if (statusFilter !== 'all') {
      next = next.filter(
        (product) => normalizeStatus(product.status) === statusFilter
      );
    }

    next.sort((a, b) => {
      const aValue = getSortValue(a, sort.key);
      const bValue = getSortValue(b, sort.key);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.dir === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sort.dir === 'asc'
        ? String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        : String(bValue).localeCompare(String(aValue), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
    });

    return next;
  }, [products, search, typeFilter, statusFilter, sort]);

  const productStats = useMemo(() => {
    const artisanCount = products.filter(
      (p) => p._source === 'products'
    ).length;
    const merchCount = products.filter(
      (p) => p._source === 'merchProducts'
    ).length;
    const activeCount = products.filter(
      (p) => normalizeStatus(p.status) === 'active'
    ).length;
    const inactiveCount = products.length - activeCount;

    return {
      total: products.length,
      artisanCount,
      merchCount,
      activeCount,
      inactiveCount,
    };
  }, [products]);

  const productToEdit = editProductId
    ? products.find((p) => p.id === editProductId)
    : null;

  return (
    <div className="manage-products-page">
      <div className="manage-products-hero">
        <div className="manage-products-hero__copy">
          <div className="manage-products-eyebrow">Admin Workspace</div>
          <h2>Manage Products</h2>
          <p>
            Control artisan inventory, monitor synced merch, review status, and
            manage your storefront catalog from one polished workspace.
          </p>
        </div>

        <div className="manage-products-summary">
          <div className="manage-products-pill manage-products-pill--neutral">
            Total: {productStats.total}
          </div>
          <div className="manage-products-pill manage-products-pill--artisan">
            Artisan: {productStats.artisanCount}
          </div>
          <div className="manage-products-pill manage-products-pill--merch">
            Merch: {productStats.merchCount}
          </div>
          <div className="manage-products-pill manage-products-pill--active">
            Active: {productStats.activeCount}
          </div>
          <div className="manage-products-pill manage-products-pill--inactive">
            Inactive: {productStats.inactiveCount}
          </div>
        </div>
      </div>

      <div className="manage-products-toolbar">
        <div className="manage-products-toolbar__left">
          <button
            className="manage-products-btn manage-products-btn--secondary"
            onClick={handleRefreshPrintifyStock}
            disabled={isRefreshingStock}
          >
            {isRefreshingStock ? 'Refreshing…' : 'Refresh Printify Stock'}
          </button>

          <button
            className="manage-products-btn manage-products-btn--dark"
            onClick={() => setIsAddMerchModalOpen(true)}
          >
            + Add Merch from Printify
          </button>

          <button
            className="manage-products-btn manage-products-btn--primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Artisan Product
          </button>
        </div>

        <div className="manage-products-toolbar__meta">
          {printifyLastUpdated ? (
            <span>
              Printify last synced:{' '}
              <strong>{formatDateTime(printifyLastUpdated)}</strong>
            </span>
          ) : (
            <span>Printify sync timestamp unavailable</span>
          )}
        </div>
      </div>

      <div className="manage-products-filters">
        <div className="manage-products-filter-group manage-products-filter-group--search">
          <label htmlFor="products-search">Search</label>
          <input
            id="products-search"
            type="text"
            placeholder="Search name, ID, type, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="manage-products-filter-group">
          <label htmlFor="products-type-filter">Type</label>
          <select
            id="products-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="artisan">Artisan Only</option>
            <option value="merch">Merch Only</option>
          </select>
        </div>

        <div className="manage-products-filter-group">
          <label htmlFor="products-status-filter">Status</label>
          <select
            id="products-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="manage-products-state manage-products-state--loading">
          Loading products…
        </div>
      )}

      {error && (
        <div className="manage-products-state manage-products-state--error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="manage-products-table-shell">
          <div className="manage-products-table-scroll">
            <table className="manage-products-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th className="sortable" onClick={() => toggleSort('name')}>
                    Product{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('name')}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('type')}>
                    Type{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('type')}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    Status{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('status')}
                    </span>
                  </th>
                  <th
                    className="sortable"
                    onClick={() => toggleSort('maxQuantity')}
                  >
                    Max Inventory{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('maxQuantity')}
                    </span>
                  </th>
                  <th
                    className="sortable"
                    onClick={() => toggleSort('currentQuantity')}
                  >
                    Current Inventory{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('currentQuantity')}
                    </span>
                  </th>
                  <th
                    className="sortable"
                    onClick={() => toggleSort('updatedAt')}
                  >
                    Last Updated{' '}
                    <span className="sort-indicator">
                      {renderSortIndicator('updatedAt')}
                    </span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="manage-products-empty">
                      No products matched your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isMerch = product._source
                      ? product._source === 'merchProducts'
                      : Array.isArray(product?.variants);

                    const title = product.title || product.name || 'Unnamed';
                    const imageUrl = getPreviewImage(product);
                    const normalizedStatus = normalizeStatus(product.status);
                    const lastUpdated =
                      product.updatedAt || product.syncedAt || null;

                    return (
                      <tr
                        key={product.id}
                        className={`manage-products-row status-${normalizedStatus}`}
                      >
                        <td>
                          <button
                            className="thumbnail-btn"
                            onClick={() => openProductDetail(product.id)}
                            aria-label={`View details for ${title}`}
                            title="Open product page"
                          >
                            <img
                              src={imageUrl}
                              alt={title}
                              className="thumbnail"
                            />
                          </button>
                        </td>

                        <td>
                          <div className="manage-products-product">
                            <div className="manage-products-product__title">
                              {title}
                            </div>
                            <div className="manage-products-product__meta">
                              <span className="manage-products-id">
                                ID: <code>{product.id}</code>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`manage-products-type-pill ${
                              isMerch ? 'is-merch' : 'is-artisan'
                            }`}
                          >
                            {isMerch ? 'Merch' : 'Artisan'}
                          </span>
                        </td>

                        <td>
                          <div className="manage-products-status-stack">
                            <select
                              className="manage-products-status-select"
                              value={normalizedStatus}
                              onChange={(e) =>
                                handleStatusChange(product.id, e.target.value)
                              }
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </td>

                        <td>
                          {isMerch ? (
                            <span className="manage-products-muted">
                              Managed by Printify
                            </span>
                          ) : (
                            <select
                              value={product.maxQuantity || 0}
                              onChange={(e) =>
                                handleMaxInventoryChange(
                                  product.id,
                                  parseInt(e.target.value, 10)
                                )
                              }
                            >
                              {Array.from({ length: 51 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td>
                          {isMerch ? (
                            <span className="manage-products-muted">
                              Auto Synced
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={product.currentQuantity || 0}
                              min="0"
                              max={product.maxQuantity || 0}
                              onChange={(e) =>
                                handleCurrentInventoryChange(
                                  product.id,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                            />
                          )}
                        </td>

                        <td>
                          <span className="manage-products-updated">
                            {formatDateTime(lastUpdated)}
                          </span>
                        </td>

                        <td>
                          <div className="manage-products-actions">
                            <button
                              className="manage-products-action-btn manage-products-action-btn--edit"
                              onClick={() => setEditProductId(product.id)}
                            >
                              Edit
                            </button>

                            <button
                              className="manage-products-action-btn manage-products-action-btn--delete"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete (will ask Hard vs Soft delete)"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={(newProduct) =>
            setProducts((prev) => [
              { ...newProduct, _source: 'products' },
              ...prev,
            ])
          }
        />
      )}

      {isAddMerchModalOpen && (
        <AddMerchFromPrintifyModal
          onClose={() => setIsAddMerchModalOpen(false)}
          onAdded={(merchProduct) =>
            setProducts((prev) => [
              { ...merchProduct, _source: 'merchProducts' },
              ...prev,
            ])
          }
        />
      )}

      {productToEdit &&
        (() => {
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
