import React from 'react';
import './AdminModalTheme.css';     // import theme tokens first
import './ManageCartsModal.css';

const ManageCartsModal = ({ isOpen, onClose, cartDetails, userDetails, onDelete }) => {
  if (!isOpen) return null;

  const items = cartDetails?.cart || {};
  const cartSubtotal = Object.values(items).reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );

  // 👉 Add `adminmodal` to use tokens, add `light` to switch to light theme
  return (
    <div className="modal-overlay cartmodal adminmodal light" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="modal-title">Cart Details</h3>

        <div className="cart-meta">
          <div className="meta-row"><strong>Cart ID:</strong> <span>{cartDetails.id}</span></div>
          <div className="meta-row"><strong>User:</strong> <span>{userDetails?.email || 'Guest'}</span></div>
          <div className="meta-row">
            <strong>Last Updated:</strong>{' '}
            <span>{cartDetails.lastUpdated?.toDate?.().toLocaleString?.() || 'N/A'}</span>
          </div>
        </div>

        <div className="delete-cart-container">
          <button className="delete-cart-button" onClick={onDelete}>🗑 Delete Cart</button>
        </div>

        <h3 className="section-title">Products in Cart</h3>

        {Object.keys(items).length > 0 ? (
          <>
            <table className="cart-details-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(items).map(([productId, product]) => {
                  const price = Number(product.price ?? 0);
                  const qty = Number(product.quantity ?? 0);
                  return (
                    <tr key={productId}>
                      <td>
                        <img
                          src={product.images?.[0] || '/fallback-images/image-not-available.png'}
                          alt={product.name || 'Product Image'}
                          className="cart-item-image"
                        />
                      </td>
                      <td><strong>{product.name || 'Unnamed Product'}</strong></td>
                      <td>{product.sku || 'N/A'}</td>
                      <td>${price.toFixed(2)}</td>
                      <td>{qty}</td>
                      <td>${(qty * price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="cart-subtotal">
              <span>Cart Subtotal</span>
              <strong>${cartSubtotal.toFixed(2)}</strong>
            </div>
          </>
        ) : (
          <p className="muted">No items in the cart.</p>
        )}
      </div>
    </div>
  );
};

export default ManageCartsModal;