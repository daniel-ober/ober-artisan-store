// src/components/CartPreview.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './CartPreview.css';

const FREE_THRESHOLD = 50; // $50+
const SHIPPING_COST = 9.99; // $9.99 flat under threshold
const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const formatDisplayValue = (value) => String(value || '').trim();

const getPreviewArtisanSections = (item = {}) => {
  const config = item?.config || {};

  const productId = String(item?.productId || '').toLowerCase();

  const normalizedSnareBed = formatDisplayValue(
    config.snareBedDepth || config.snareBeds
  );

  const normalizedScorch = formatDisplayValue(
    config.scorchDepth || config.finishTorchDepth
  );

  if (productId === 'heritage') {
    return [
      {
        label: 'Core Build',

        value: [
          config.size && config.depth
            ? `${config.size}" x ${config.depth}"`
            : '',

          config.lugQuantity ? `${config.lugQuantity} lugs` : '',

          config.staveQuantity ? `${config.staveQuantity} staves` : '',
        ]

          .filter(Boolean)

          .join(' • '),
      },

      {
        label: 'Shell Finish',

        value: normalizedScorch || 'Standard Heritage finish',
      },

      {
        label: 'Hardware',

        value: [
          formatDisplayValue(config.hardwareColor),

          formatDisplayValue(config.hoopType),
        ]

          .filter(Boolean)

          .join(' • '),
      },
    ];
  }

  if (productId === 'feuzon') {
    return [
      {
        label: 'Core Build',

        value: [
          config.size && config.depth
            ? `${config.size}" x ${config.depth}"`
            : '',

          config.outerShell && config.innerStave
            ? `${config.outerShell} / ${config.innerStave}`
            : '',

          config.staveQuantity ? `${config.staveQuantity} staves` : '',
        ]

          .filter(Boolean)

          .join(' • '),
      },

      {
        label: 'Shell Finish',

        value: [
          formatDisplayValue(config.finishSystem),

          formatDisplayValue(config.stainStyle)
            .replace('full-stained', 'Full Stain')

            .replace('faded-stained', 'Faded Stain')

            .replace('natural', 'Natural'),

          formatDisplayValue(config.stainColor)
            .replace(/-/g, ' ')

            .replace(/\b\w/g, (c) => c.toUpperCase()),

          formatDisplayValue(config.scorchStyle)
            .replace('scorched', 'Natural Scorched')

            .replace('non-scorched', 'Non-Scorched'),
        ]

          .filter(Boolean)

          .join(' • '),
      },

      {
        label: 'Hardware',

        value: [
          formatDisplayValue(config.hardwareColor),

          formatDisplayValue(config.hoopType),

          formatDisplayValue(config.bearingEdge),
        ]

          .filter(Boolean)

          .join(' • '),
      },
    ];
  }

  if (item?.category === 'artisan') {
    return [
      {
        label: 'Core Build',

        value: [
          config.size && config.depth
            ? `${config.size}" x ${config.depth}"`
            : '',

          config.lugQuantity ? `${config.lugQuantity} lugs` : '',

          config.staveQuantity ? `${config.staveQuantity} staves` : '',
        ]

          .filter(Boolean)

          .join(' • '),
      },

      {
        label: 'Shell Finish',

        value:
          normalizedScorch ||
          formatDisplayValue(config.finishType || config.finish) ||
          'Custom finish',
      },

      {
        label: 'Hardware',

        value: [
          formatDisplayValue(config.hardwareColor),

          formatDisplayValue(config.hoopType),
        ]

          .filter(Boolean)

          .join(' • '),
      },
    ];
  }

  return [];
};

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
          if (snap.exists()) newMap[item.productId] = snap.data();
        } catch (err) {
          console.warn(`❌ Error fetching product ${item.productId}:`, err);
        }
      }
      setProductDataMap(newMap);
    };
    fetchAllProductData();
  }, [cart]);

  const handleRemoveItem = (itemId) => removeFromCart(itemId);

  const handleQuantityChange = (itemId, change) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    const minQuantity = 1;
    const maxQuantity = item.currentQuantity || 10;
    const newQuantity = Math.min(
      Math.max((item.quantity || 1) + change, minQuantity),
      maxQuantity
    );
    if (newQuantity !== item.quantity) updateQuantity(itemId, newQuantity);
  };

  const cartTotal = cart.reduce(
    (t, i) => t + (Number(i.price) || 0) * (i.quantity || 1),
    0
  );

  // Shipping math
  const subtotal = cartTotal;
  const qualifiesForFree = subtotal >= FREE_THRESHOLD;
  const shippingAmount = qualifiesForFree ? 0 : SHIPPING_COST;
  const shippingDisplay = qualifiesForFree
    ? 'FREE'
    : formatMoney(SHIPPING_COST);
  const amountToFree = Math.max(0, FREE_THRESHOLD - subtotal);
  const freeMsg = qualifiesForFree
    ? 'Congrats! Your order qualifies for FREE shipping.'
    : `Add ${formatMoney(amountToFree)} more for FREE shipping.`;
  const grandTotal = subtotal + shippingAmount;

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

              const artisanSections =
                category === 'artisan' && productId !== 'founders-toast'
                  ? getPreviewArtisanSections(item)
                  : [];

              let previewImage = fallback;
              if (category === 'artisan') {
                previewImage =
                  item.image ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  fallback;
              } else if (category === 'merch') {
                const product = productDataMap[productId];
                if (
                  product &&
                  Array.isArray(product.images) &&
                  product.images.length
                ) {
                  const first = product.images[0];
                  if (typeof first === 'string' && first.startsWith('http')) {
                    previewImage = first;
                  } else if (typeof first === 'object') {
                    const variantId = String(
                      item.variantId || config?.variantId || ''
                    );
                    const selectedColor = (config.Colors || '')
                      .toLowerCase()
                      .replace(/\s+/g, '')
                      .replace(/\//g, '');
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
                    if (matchedImage?.src?.startsWith('http'))
                      previewImage = matchedImage.src;
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

                    {artisanSections.length > 0 ? (
                      <div className="preview-build-meta">
                        {artisanSections.map((section) => (
                          <div
                            key={`${id}-${section.label}`}
                            className="preview-build-meta-row"
                          >
                            <span className="preview-build-meta-label">
                              {section.label}
                            </span>

                            <span className="preview-build-meta-value">
                              {section.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="item-config-block">
                        {config.Sizes && (
                          <p className="item-config">Size: {config.Sizes}</p>
                        )}

                        {config.Colors && (
                          <p className="item-config">Color: {config.Colors}</p>
                        )}
                      </div>
                    )}

                    <p className="item-price">{formatMoney(price)}</p>

                    {productId === 'founders-toast' ||
                    category !== 'artisan' ? (
                      <div className="quantity-buttons">
                        <button
                          onClick={() => handleQuantityChange(id, -1)}
                          disabled={(quantity || 1) <= 1}
                        >
                          -
                        </button>

                        <span>{quantity}</span>

                        <button
                          onClick={() => handleQuantityChange(id, 1)}
                          disabled={
                            (quantity || 1) >= (item.currentQuantity || 10)
                          }
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

          {/* Subtotal */}
          <div className="cart-total-container">
            <span className="cart-total-label">Subtotal:</span>
            <span className="cart-total-amount">{formatMoney(subtotal)}</span>
          </div>

          {/* Shipping (bold label + right-aligned value) */}
          <div className="cart-shipping-row">
            <span className="label">Shipping:</span>
            <span className="value">{shippingDisplay}</span>
          </div>

          {/* Teaser + note */}
          {!qualifiesForFree && (
            <div className="cart-shipping-preview">
              <div className="ship-nudge-inline">{freeMsg}</div>
              <div className="ship-note-inline">
                * Free shipping on orders $50 or more (contiguous U.S. only)
              </div>
            </div>
          )}
          {qualifiesForFree && (
            <div className="cart-shipping-preview">
              <div className="ship-note-inline">
                * Free shipping on orders $50 or more (contiguous U.S. only)
              </div>
            </div>
          )}

          {/* Total */}
          <div className="cart-total-container grand-total">
            <span className="cart-total-label">Total:</span>
            <span className="cart-total-amount">{formatMoney(grandTotal)}</span>
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
