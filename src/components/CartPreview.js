// src/components/CartPreview.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './CartPreview.css';

const CartPreview = ({ onClose, closeMenu }) => {
  const { cart, cartId, removeFromCart, updateQuantity } = useCart();
  const [productDataMap, setProductDataMap] = useState({});

  useEffect(() => {
    const fetchAllProductData = async () => {
      const newMap = {};
      const merchItems = cart.filter((item) => item.category === 'merch');
      for (const item of merchItems) {
        if (!item.productId || newMap[item.productId]) continue;
        try {
          let ref = doc(db, 'merchProducts', String(item.productId));
          let snap = await getDoc(ref);
          if (!snap.exists()) {
            ref = doc(db, 'products', String(item.productId));
            snap = await getDoc(ref);
          }
          if (snap.exists()) {
            newMap[item.productId] = snap.data();
          }
        } catch (err) {
          console.warn(`❌ Error fetching product ${item.productId}:`, err);
        }
      }
      setProductDataMap(newMap);
    };

    fetchAllProductData();
  }, [cart]);

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

  const fallback = '/fallback-images/fallback_image1.png';

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
                price,
                quantity,
                category,
                config = {},
                productId,
              } = item;

              const configLines = [];

              if (category === 'artisan') {
                if (config.size && config.depth) {
                  configLines.push(`${config.size}" x ${config.depth}"`);
                }
                const line2 = [];
                if (config.lugQuantity)
                  line2.push(`${config.lugQuantity} Lugs`);
                if (config.staveQuantity)
                  line2.push(`${config.staveQuantity} Staves`);
                if (typeof config.reRing !== 'undefined') {
                  line2.push(config.reRing ? 'Re-Rings' : 'No Re-Rings');
                }
              if (productId !== 'founders-toast' && config.hardwareColor) {
  line2.push(`Hardware: ${config.hardwareColor}`);
}
                if (line2.length > 0) configLines.push(line2.join(' • '));
                if (config.outerShell || config.innerStave) {
                  configLines.push(
                    `${config.outerShell || '?'} / ${config.innerStave || '?'}`
                  );
                }
              } else {
                if (config.Sizes) configLines.push(`Size: ${config.Sizes}`);
                if (config.Colors) configLines.push(`Color: ${config.Colors}`);
              }

              let previewImage = fallback;

              if (category === 'artisan') {
                previewImage =
                  item.image ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  fallback;
              } else if (category === 'merch') {
                const product = productDataMap[productId];
                if (product && Array.isArray(product.images)) {
                  const first = product.images[0];

                  // Case: Founder's Toast or string-based images
                  if (typeof first === 'string' && first.startsWith('http')) {
                    previewImage = first;
                  }

                  // Case: merchProduct variant-based images
                  else if (typeof first === 'object') {
                    const variantId = String(
                      item.variantId || config?.variantId || ''
                    );
                    const selectedColor =
                      config.Colors?.toLowerCase()
                        .replace(/\s+/g, '')
                        .replace(/\//g, '') || '';

                    const matchedImage =
                      product.images.find((img) =>
                        Array.isArray(img.variant_ids)
                          ? img.variant_ids.map(String).includes(variantId)
                          : false
                      ) ||
                      product.images.find((img) =>
                        Array.isArray(img.colors)
                          ? img.colors
                              .map((c) =>
                                c
                                  .toLowerCase()
                                  .replace(/\s+/g, '')
                                  .replace(/\//g, '')
                              )
                              .includes(selectedColor)
                          : false
                      ) ||
                      product.images.find((img) => img.is_default) ||
                      product.images[0];

                    if (matchedImage?.src?.startsWith('http')) {
                      previewImage = matchedImage.src;
                    }
                  }
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
                    <p className="item-price">
                      ${Number(price || 0).toFixed(2)}
                    </p>

                    {productId === 'founders-toast' ||
                    category !== 'artisan' ? (
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
                    ) : null}
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

      {cartId && <p className="cart-id-preview">Cart ID: {cartId.slice(-5)}</p>}
    </div>
  );
};

export default CartPreview;
