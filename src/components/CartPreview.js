import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPreview.css';

const CartPreview = ({ onClose, closeMenu }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleQuantityChange = (itemId, change) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const minQuantity = 1;
    const maxQuantity = item.currentQuantity || 1;
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
                options = {},
              } = item;

              const size = item.size || options.size || options.Sizes;
              const depth = item.depth || options.depth;
              const lugQuantity = item.lugQuantity || options.lugQuantity;
              const staveQuantity = item.staveQuantity || options.staveQuantity;
              const reRingRaw = item.reRing ?? options.reRing;
              const isReRing = String(reRingRaw) === 'true' || reRingRaw === true;
              const outerShell = options.outerShell;
              const innerStave = options.innerStave;

              const configLines = [];

              if (options.Colors) configLines.push(`Colors: ${options.Colors}`);
              if (options.Sizes) configLines.push(`Sizes: ${options.Sizes}`);
              if (size && depth) configLines.push(`${size}" x ${depth}"`);

              const line2 = [];
              if (lugQuantity) line2.push(`${lugQuantity} Lugs`);
              if (staveQuantity) line2.push(`${staveQuantity} Staves`);
              if (typeof reRingRaw !== 'undefined')
                line2.push(isReRing ? 'Re-Rings' : 'No Re-Rings');
              if (line2.length > 0) configLines.push(line2.join(' • '));

              if (outerShell || innerStave) {
                configLines.push(`${outerShell || '?'} / ${innerStave || '?'}`);
              }

              // Determine preview image
              const fallback = '/fallback-images/fallback_image1.png';
              let previewImage = fallback;

              if (Array.isArray(images)) {
                const variantImage = images.find((img) => {
                  if (!img?.src?.startsWith('http')) return false;
                  if (!img?.variant_ids?.length) return false;
                  return img.variant_ids.includes(String(options.variantId));
                });

                const generalImage = images.find(
                  (img) => typeof img?.src === 'string' && img.src.startsWith('http')
                );

                previewImage = variantImage?.src || generalImage?.src || fallback;
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
                    {configLines.map((line, idx) => (
                      <p key={idx} className="item-config">{line}</p>
                    ))}
                    <p className="item-price">
                      ${Number(price || 0).toFixed(2)}
                    </p>

                    {category !== 'artisan' ? (
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
                          disabled={quantity >= (item.currentQuantity || 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="quantity-value">Qty: {quantity}</span>
                    )}
                  </div>

                  <button
                    className="remove-item"
                    onClick={() => handleRemoveItem(id)}
                  >
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
    </div>
  );
};

export default CartPreview;