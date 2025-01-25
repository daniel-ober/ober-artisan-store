import React from 'react';
import './ManageCartsModal.css';

const ManageCartsModal = ({ isOpen, onClose, cartDetails, userDetails }) => {
  if (!isOpen) return null;

  const items = cartDetails?.cart || {}; // Ensure items exist

  // Calculate cart subtotal
  const cartSubtotal = Object.values(items).reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          ✖
        </button>
        <h2>Cart Details</h2>

        <p><strong>Cart ID:</strong> {cartDetails.id}</p>
        <p><strong>User:</strong> {userDetails?.email || 'Guest'}</p>
        <p>
          <strong>Last Updated:</strong>{' '}
          {cartDetails.lastUpdated?.toDate().toLocaleString() || 'N/A'}
        </p>

        <h3>Products in Cart:</h3>
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
                {Object.entries(items).map(([productId, product]) => (
                  <tr key={productId}>
                    <td>
                      <img
                        src={
                          product.images?.[0] ||
                          '/fallback-images/image-not-available.png'
                        }
                        alt={product.name || 'Product Image'}
                        className="cart-item-image"
                      />
                    </td>
                    <td>{product.name || 'Unnamed Product'}</td>
                    <td>{product.sku || 'N/A'}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.quantity}</td>
                    <td>${(product.quantity * product.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-subtotal">
              <strong>Cart Subtotal: </strong>${cartSubtotal.toFixed(2)}
            </div>
          </>
        ) : (
          <p>No items in the cart.</p>
        )}
      </div>
    </div>
  );
};

export default ManageCartsModal;