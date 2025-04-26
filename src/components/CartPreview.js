import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPreview.css';

const CartPreview = ({ onClose, closeMenu }) => {
  const { cart, cartId, removeFromCart, updateQuantity } = useCart();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleQuantityChange = (itemId, change) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const minQuantity = 1;
    const maxQuantity = item.currentQuantity || 10;
    const newQuantity = Math.min(
      Math.max(item.quantity + change, minQuantity),
      maxQuantity
    );

    if (newQuantity !== item.quantity) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <div>Your Cart</div>
        <button className="close-preview" onClick={onClose}>
          ✕
        </button>
      </div>

      {cart.length > 0 ? (
        <>
          <div className="cart-items">
            {cart.map((item) => {
              const {
                id,
                name,
                images,
                price,
                quantity,
                category,
                config = {},
              } = item;

              const configLines = [];

              if (category === 'artisan') {
                if (config.size && config.depth) {
                  configLines.push(`${config.size}" x ${config.depth}"`);
                }

                const line2 = [];
                if (config.lugQuantity) line2.push(`${config.lugQuantity} Lugs`);
                if (config.staveQuantity) line2.push(`${config.staveQuantity} Staves`);
                if (typeof config.reRing !== 'undefined') {
                  line2.push(config.reRing ? 'Re-Rings' : 'No Re-Rings');
                }
                if (line2.length > 0) configLines.push(line2.join(' • '));

                if (config.outerShell || config.innerStave) {
                  configLines.push(`${config.outerShell || '?'} / ${config.innerStave || '?'}`);
                }
              } else {
                if (config.Sizes) configLines.push(`Size: ${config.Sizes}`);
                if (config.Colors) configLines.push(`Color: ${config.Colors}`);
              }

              // Determine preview image
              const fallback = '/fallback-images/fallback_image1.png';
              let previewImage = fallback;

              if (Array.isArray(images)) {
                const firstValid = images.find((img) => {
                  if (typeof img === 'string') return img.startsWith('http');
                  if (typeof img === 'object') return img?.src?.startsWith('http');
                  return false;
                });

                if (firstValid) {
                  previewImage =
                    typeof firstValid === 'string'
                      ? firstValid
                      : firstValid.src || fallback;
                }
              }

              return (
                <div key={id} className="cart-preview-item">
                  <img
                    src={previewImage}
                    alt={name}
                    className="cart-item-image"
                    onError={(e) => (e.currentTarget.src = fallback)}
                  />

                  <div className="cart-item-details">
                    <p className="item-name">{name}</p>
                    <div className="item-config-block">
                      {configLines.map((line, idx) => (
                        <p key={idx} className="item-config">
                          {line}
                        </p>
                      ))}
                    </div>
                    <p className="item-price">${Number(price || 0).toFixed(2)}</p>

                    {category !== 'artisan' && (
                      <div className="quantity-buttons">
                        <button
                          onClick={() => handleQuantityChange(id, -1)}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(id, 1)}
                          disabled={quantity >= (item.currentQuantity || 10)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="remove-item" onClick={() => handleRemoveItem(id)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-total-container">
            <span className="cart-total-label">Total:</span>
            <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
          </div>

          <Link
            to="/cart"
            className="view-cart-button"
            onClick={() => {
              onClose();
              closeMenu();
            }}
          >
            View Full Cart
          </Link>
        </>
      ) : (
        <p className="empty-cart">Your cart is empty.</p>
      )}

      {cartId && (
        <p className="cart-id-preview">Cart ID: {cartId.slice(-5)}</p>
      )}
    </div>
  );
};

export default CartPreview;