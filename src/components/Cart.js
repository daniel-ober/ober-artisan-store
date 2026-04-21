import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { useCart } from '../context/CartContext';

import { useAuth } from '../context/AuthContext';

import { loadStripe } from '@stripe/stripe-js';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

import CheckoutModal from './CheckoutModal';

import './Cart.css';

import '@fortawesome/fontawesome-free/css/all.min.css';

import { Trash2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Known-good backend URL

const API_BASE_URL =
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

/* Shipping rules */

const FREE_THRESHOLD = 50;

const SHIPPING_COST = 9.99;

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const normalizeDepthValue = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return String(value || '').trim();

  return num.toFixed(1);
};

const toNumberSafe = (value, fallback = 0) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
};

const calculateHeritageCartPrice = (item = {}) => {
  const config = item?.config || {};

  const merged = {
    ...config,

    ...item,
  };

  const size = String(merged?.size || '').trim();

  const depth = normalizeDepthValue(merged?.depth);

  const lugQuantity = toNumberSafe(merged?.lugQuantity, 0);

  const staveQuantity = toNumberSafe(merged?.staveQuantity, 0);

  const reRing = !!merged?.reRing;

  const hardwareColor = String(merged?.hardwareColor || 'Chrome').trim();

  const hoopType = String(merged?.hoopType || 'Triple Flange').trim();

  const basePrices = {
    12: 850,

    13: 950,

    14: 1050,
  };

  const depthPrices = {
    12: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },

    13: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },

    14: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },
  };

  const hardwareUpchargeMap = {
    Chrome: 0,

    'Black Nickel': 50,

    'Brass/Gold': 150,
  };

  const hoopUpchargeMap = {
    'Triple Flange': 0,

    'Die-Cast': 100,
  };

  if (!basePrices[size]) {
    return Number(item?.price || 0);
  }

  if (depthPrices[size]?.[depth] == null) {
    return Number(item?.price || 0);
  }

  const validBaseConfigs = new Set([
    '12|6|12|false',

    '12|8|16|false',

    '13|8|16|false',

    '14|8|16|false',

    '14|10|20|false',

    '14|10|10|true',
  ]);

  const configKey = `${size}|${lugQuantity}|${staveQuantity}|${reRing}`;

  if (!validBaseConfigs.has(configKey)) {
    return Number(item?.price || 0);
  }

  if (!(hardwareColor in hardwareUpchargeMap)) {
    return Number(item?.price || 0);
  }

  if (!(hoopType in hoopUpchargeMap)) {
    return Number(item?.price || 0);
  }

  let total =
    basePrices[size] +
    depthPrices[size][depth] +
    hardwareUpchargeMap[hardwareColor] +
    hoopUpchargeMap[hoopType];

  if (reRing) {
    total += 150;
  }

  return total;
};

const getEffectiveItemUnitPrice = (item = {}) => {
  if (item?.productId === 'heritage') {
    return calculateHeritageCartPrice(item);
  }

  return Number(item?.price || 0);
};

const formatDisplayValue = (value) => String(value || '').trim();

const getArtisanCartSections = (item = {}) => {

  const config = item?.config || {};

  const productId = String(item?.productId || '').toLowerCase();

  const normalizedScorch = formatDisplayValue(

    config.scorchDepth || config.finishTorchDepth

  );

  if (productId === 'heritage') {

    const sectionCore = [

      config.size && config.depth ? `${config.size}" x ${config.depth}"` : '',

      config.lugQuantity ? `${config.lugQuantity} lugs` : '',

      config.staveQuantity ? `${config.staveQuantity} staves` : '',

    ].filter(Boolean);

    return [

      {

        label: 'Core Build',

        value: sectionCore.join(' • '),

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

          config.size && config.depth ? `${config.size}" x ${config.depth}"` : '',

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

          config.size && config.depth ? `${config.size}" x ${config.depth}"` : '',

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

const Cart = () => {
  const { cart, cartId, removeFromCart, setCart, updateFirestoreCart } =
    useCart();

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [unavailableProducts, setUnavailableProducts] = useState([]);

  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [productDataMap, setProductDataMap] = useState({});

  useEffect(() => {
    const onShow = (event) => {
      if (event.persisted) window.location.reload();
    };

    window.addEventListener('pageshow', onShow);

    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  useEffect(() => {
    const wasRedirected = sessionStorage.getItem('checkoutStarted');

    if (wasRedirected) {
      sessionStorage.removeItem('checkoutStarted');

      setShowCheckoutModal(false);
    }
  }, []);

  useEffect(() => {
    const checkInventory = async () => {
      if (!cart || cart.length === 0 || !cartId) return;

      let updatedCart = [...cart];

      let unavailable = [];

      let cartChanged = false;

      for (const item of updatedCart) {
        if (!item || !item.productId) continue;

        try {
          const isMerch = item.category === 'merch';

          const collectionName = isMerch ? 'merchProducts' : 'products';

          const productRef = doc(db, collectionName, String(item.productId));

          const productSnapshot = await getDoc(productRef);

          if (!productSnapshot.exists()) {
            unavailable.push({ id: item.id, name: item.name });

            updatedCart = updatedCart.filter((i) => i.id !== item.id);

            cartChanged = true;

            continue;
          }

          if (!isMerch) {
            const productData = productSnapshot.data();

            const availableStock = productData.currentQuantity ?? 0;

            if (availableStock <= 0) {
              unavailable.push({ id: item.id, name: item.name });

              updatedCart = updatedCart.filter((i) => i.id !== item.id);

              cartChanged = true;
            }
          }
        } catch (err) {
          console.error('Inventory check error:', err);
        }
      }

      if (cartChanged) {
        setCart(updatedCart);

        await updateFirestoreCart(updatedCart);

        setUnavailableProducts(unavailable);

        setShowInventoryModal(true);
      }
    };

    checkInventory();
  }, [cart, cartId, setCart, updateFirestoreCart]);

  useEffect(() => {
    const fetchAllMerchProducts = async () => {
      const map = {};

      const merchItems = cart.filter((i) => i.category === 'merch');

      for (const item of merchItems) {
        if (!item.productId || map[item.productId]) continue;

        try {
          const ref = doc(db, 'merchProducts', String(item.productId));

          const snap = await getDoc(ref);

          if (snap.exists()) map[item.productId] = snap.data();
        } catch (err) {
          console.warn('Fetch merch product error:', err);
        }
      }

      setProductDataMap(map);
    };

    fetchAllMerchProducts();
  }, [cart]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const next = cart.map((item) =>
      item.id === productId
        ? { ...item, quantity: Math.min(newQuantity, item.currentQuantity) }
        : item
    );

    setCart(next);

    updateFirestoreCart(next);
  };

  const closeModal = () => {
    setShowInventoryModal(false);

    setUnavailableProducts([]);
  };

  const getItemUnitPrice = (item) => getEffectiveItemUnitPrice(item);

  const getItemTotal = (item) => getItemUnitPrice(item) * (item.quantity || 1);

  const subtotal = cart.reduce((t, i) => t + getItemTotal(i), 0);

  const qualifiesForFree = subtotal >= FREE_THRESHOLD;

  const shippingAmount = qualifiesForFree ? 0 : SHIPPING_COST;

  const shippingDisplay = qualifiesForFree ? 'FREE' : money(SHIPPING_COST);

  const grandTotal = subtotal + shippingAmount;

  const handleCheckout = async () => {
    setShowCheckoutModal(true);

    try {
      if (!cart || cart.length === 0) {
        alert('Your cart is empty!');

        setShowCheckoutModal(false);

        return;
      }

      const normalize = (s) => (s || '').toString().trim();

      const productsPayload = cart.map((item) => {
        const config = item.config || {};

        const isMerch = item.category === 'merch';

        const isFoundersToast = item.productId === 'founders-toast';

        const fb = '/fallback-images/fallback_image1.png';

        let previewImage = item.image || fb;

        if (item.category === 'artisan') {
          previewImage =
            item.image || (Array.isArray(item.images) && item.images[0]) || fb;
        } else if (isMerch) {
          const productDoc = productDataMap[item.productId];

          const normalizeKey = (s) =>
            (s || '')

              .toString()

              .toLowerCase()

              .replace(/\s+|\/|-/g, '');

          const variantId = String(
            item.variantId || config.variantId || ''
          ).trim();

          const selectedColor = normalizeKey(
            config.Colors || config.colorName || config.color
          );

          if (productDoc?.images?.length) {
            let matched = productDoc.images.find((img) =>
              Array.isArray(img.variant_ids)
                ? img.variant_ids.map(String).includes(variantId)
                : false
            );

            if (!matched) {
              matched = productDoc.images.find((img) =>
                Array.isArray(img.colors)
                  ? img.colors.some((c) => normalizeKey(c) === selectedColor)
                  : false
              );
            }

            if (!matched)
              matched =
                productDoc.images.find((img) => img.is_default) ||
                productDoc.images[0];

            if (matched?.src?.startsWith('http')) previewImage = matched.src;
          }
        }

        let configPayload = {};

        if (item.category === 'artisan' && !isFoundersToast) {
          configPayload = {
            size: normalize(config.size),

            depth: normalize(config.depth),

            lugQuantity: normalize(config.lugQuantity),

            staveQuantity: normalize(config.staveQuantity),

            reRing:
              typeof config.reRing !== 'undefined'
                ? !!config.reRing
                : undefined,

            hardwareColor: normalize(config.hardwareColor),

            hoopType: normalize(config.hoopType),

            shellConstruction: normalize(
              config.shellConstruction || config.construction
            ),

            bearingEdge: normalize(config.bearingEdge),

            snareBedDepth: normalize(config.snareBedDepth || config.snareBeds),

            snareWireModel: normalize(
              config.snareWireModel || config.snareWires
            ),

            scorchDepth: normalize(
              config.scorchDepth || config.finishTorchDepth
            ),

            finishType: normalize(config.finishType || config.finish),

            finishSheen: normalize(config.finishSheen),

            headType: normalize(config.headType),

            batterHead: normalize(config.batterHead),

            resonantHead: normalize(config.resonantHead),

            outerShell: normalize(config.outerShell),

            innerStave: normalize(config.innerStave),

            primaryWood: normalize(config.primaryWood),

            secondaryWood: normalize(config.secondaryWood),

            innerSpecies: normalize(config.innerSpecies),

            outerSpecies: normalize(config.outerSpecies),

            veneer: normalize(config.veneer),

            finishColor: normalize(config.finishColor),
          };
        } else if (isMerch) {
          const sizeValue =
            config.Sizes || config.size || config.sizeName || '';

          const colorValue =
            config.Colors || config.color || config.colorName || '';

          const variantId = item.variantId || config.variantId || '';

          configPayload = {
            sizeName: String(sizeValue).trim(),

            colorName: String(colorValue).trim(),

            variantId: variantId ? String(variantId).trim() : '',
          };
        }

        let stripePriceId = item.stripePriceId || '';

        if (isMerch) stripePriceId = '';

        return {
          productId: String(item.productId),

          name: item.name || item.title || 'Ober Product',

          category: item.category,

          stripePriceId,

          price: getEffectiveItemUnitPrice(item),

          quantity: item.quantity || 1,

          image:
            typeof previewImage === 'string' ? previewImage : previewImage?.src,

          config: configPayload,
        };
      });

      const response = await fetch(`${API_BASE_URL}/createCheckoutSession`, {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ products: productsPayload }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Checkout session create failed:', errorText);

        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data?.url) {
        sessionStorage.setItem('checkoutStarted', 'true');

        setShowCheckoutModal(false);

        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned from API');
      }
    } catch (error) {
      console.error('Checkout failed:', error);

      alert('There was a problem initiating checkout. Check console logs.');

      setShowCheckoutModal(false);
    }
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="cart-empty">Your cart is empty.</div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Remove</th>

                <th>Product</th>

                <th>Description</th>

                <th>Price</th>

                <th>Quantity</th>

                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item) => {
                const fallback = '/fallback-images/fallback_image1.png';

                const config = item.config || {};

                const variantId = Number(item.variantId || config?.variantId);

                const normalize = (s) =>
                  (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                const selectedColor = normalize(config.Colors || '');

                let previewImage = item.image || fallback;

                if (item.category === 'artisan') {
                  previewImage =
                    item.image ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    fallback;
                } else if (item.category === 'merch') {
                  const product = productDataMap[item.productId];

                  if (product?.images) {
                    const matched =
                      product.images.find(
                        (img) =>
                          Array.isArray(img.variant_ids) &&
                          (img.variant_ids.includes(Number(variantId)) ||
                            img.variant_ids

                              .map(String)

                              .includes(String(variantId)))
                      ) ||
                      product.images.find(
                        (img) =>
                          Array.isArray(img.colors) &&
                          img.colors.some((c) => normalize(c) === selectedColor)
                      ) ||
                      product.images.find((img) => img.is_default) ||
                      product.images[0];

                    if (matched?.src?.startsWith('http'))
                      previewImage = matched.src;
                  }
                }

                const effectiveUnitPrice = getItemUnitPrice(item);

                return (
                  <tr key={item.id} className="cart-row">
                    <td className="remove-cell">
                      <button
                        className="remove-icon-button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove from cart"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </td>

                    <td>
                      <Link
                        to={
                          item.productId === 'founders-toast'
                            ? '/artisan-shop/founders-toast'
                            : item.category === 'artisan'
                              ? `/artisanseries/${item.productId}`
                              : `/merch/${item.productId}`
                        }
                      >
                        <img
                          src={
                            typeof previewImage === 'string'
                              ? previewImage
                              : previewImage?.src || fallback
                          }
                          alt={item.name}
                          className="cart-product-image"
                          onError={(e) => (e.currentTarget.src = fallback)}
                        />
                      </Link>
                    </td>

                    <td>
                      <p className="cart-item-name">
                        {item.name ||
                          item.title ||
                          item.config?.title ||
                          'Unnamed Product'}
                      </p>

                      {item.category === 'artisan' &&
                      item.productId !== 'founders-toast' ? (
                        <div className="cart-build-meta">
                          {getArtisanCartSections(item).map((section) => (
                            <div
                              key={`${item.id}-${section.label}`}
                              className="cart-build-meta-row"
                            >
                              <span className="cart-build-meta-label">
                                {section.label}
                              </span>

                              <span className="cart-build-meta-value">
                                {section.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="cart-sub-description">
                          {config.Sizes && <span>Size: {config.Sizes}</span>}

                          {config.Colors && (
                            <span>
                              {config.Sizes ? ' • ' : ''}Color: {config.Colors}
                            </span>
                          )}
                        </p>
                      )}
                    </td>

                    <td>
                      {effectiveUnitPrice !== undefined ? (
                        `$${Number(effectiveUnitPrice).toFixed(2)}`
                      ) : (
                        <span style={{ color: 'red' }}>⚠️ Missing Price</span>
                      )}
                    </td>

                    <td>
                      {item.productId === 'founders-toast' ||
                      item.category !== 'artisan' ? (
                        <div className="quantity-control">
                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(
                                item.id,

                                Math.max(item.quantity - 1, 1)
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>

                          <span className="quantity-value">
                            {item.quantity}
                          </span>

                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(
                                item.id,

                                Math.min(
                                  item.quantity + 1,

                                  item.currentQuantity
                                )
                              )
                            }
                            disabled={item.quantity >= item.currentQuantity}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="quantity-value">1</span>
                      )}
                    </td>

                    <td>${getItemTotal(item).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="cart-summary">
            <div className="summary-line">
              <span className="label">Subtotal</span>

              <span className="amount">{money(subtotal)}</span>
            </div>

            <div className="summary-line">
              <span className="label">
                Shipping{' '}
                <span className="muted">(Standard 7–10 business days)</span>
              </span>

              <span className="amount">{shippingDisplay}</span>
            </div>

            <div className="summary-note">
              * Free shipping on orders $50 or more (contiguous U.S. only)
            </div>

            <div className="summary-line total">
              <span className="label">Total</span>

              <span className="amount">{money(grandTotal)}</span>
            </div>

            <div className="summary-actions">
              <button
                onClick={handleCheckout}
                className="checkout-button-inline"
                disabled={loading}
              >
                {loading ? 'Processing...' : '🔒 Checkout'}
              </button>
            </div>
          </div>

          <p className="checkout-note-below">
            Taxes, shipping, and promo codes applied at checkout
          </p>

          <p className="cart-id">
            Cart ID: {(cartId || user?.uid || 'guest').slice(-5)}
          </p>
        </>
      )}

      {showInventoryModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Some items are unavailable and have been removed</h3>

            <ul>
              {unavailableProducts.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>

            <button onClick={closeModal}>OK</button>
          </div>
        </div>
      )}

      {showCheckoutModal && <CheckoutModal visible={true} />}
    </div>
  );
};

export default Cart;
