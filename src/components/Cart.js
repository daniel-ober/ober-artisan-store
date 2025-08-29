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

// ✅ Use your known-good deployed backend URL directly
const API_BASE_URL =
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

// ── Shipping UI constants
const FREE_THRESHOLD = 75;          // $75 qualifies for free shipping
const SHIPPING_COST = 9.99;         // flat rate when under the threshold
const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

const Cart = () => {
  const fallback = '/fallback-images/fallback_image1.png';
  const { cart, cartId, removeFromCart, setCart, updateFirestoreCart } =
    useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unavailableProducts, setUnavailableProducts] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [productDataMap, setProductDataMap] = useState({});

  useEffect(() => {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload(); // Force full reload on back navigation
      }
    });
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

          const productId = String(item.productId);
          const productRef = doc(db, collectionName, productId);
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
        } catch (error) {
          console.error(`❌ Error fetching product ${item.productId}:`, error);
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
      const newMap = {};
      const merchItems = cart.filter((item) => item.category === 'merch');
      for (const item of merchItems) {
        if (!item.productId || newMap[item.productId]) continue;
        try {
          const ref = doc(db, 'merchProducts', String(item.productId));
          const snap = await getDoc(ref);
          if (snap.exists()) {
            newMap[item.productId] = snap.data();
          }
        } catch (err) {
          console.warn(
            `❌ Error fetching merch product ${item.productId}:`,
            err
          );
        }
      }
      setProductDataMap(newMap);
    };

    fetchAllMerchProducts();
  }, [cart]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === productId
        ? { ...item, quantity: Math.min(newQuantity, item.currentQuantity) }
        : item
    );

    setCart(updatedCart);
    updateFirestoreCart(updatedCart);
  };

  const closeModal = () => {
    setShowInventoryModal(false);
    setUnavailableProducts([]);
  };

  const getItemTotal = (item) =>
    (Number(item.price) || 0) * (item.quantity || 1);
  const getTotalAmount = () =>
    cart.reduce((total, item) => total + getItemTotal(item), 0);

  // ── Shipping math (derived from cart)
  const subtotal = getTotalAmount();
  const qualifiesForFree = subtotal >= FREE_THRESHOLD;
  const shippingDisplay = qualifiesForFree ? 'FREE' : formatMoney(SHIPPING_COST);
  const amountToFree = Math.max(0, FREE_THRESHOLD - subtotal);
  const freeMsg = qualifiesForFree
    ? 'Congrats! Your order qualifies for FREE shipping.'
    : `Add ${formatMoney(amountToFree)} more for FREE shipping.`;

  // ⬇️ Checkout
  const handleCheckout = async () => {
    setShowCheckoutModal(true);
    try {
      if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        setShowCheckoutModal(false);
        return;
      }

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
          const normalize = (s) =>
            (s || '')
              .toString()
              .toLowerCase()
              .replace(/\s+|\/|-/g, '');
          const variantId = String(
            item.variantId || config.variantId || ''
          ).trim();
          const selectedColor = normalize(
            config.Colors || config.colorName || config.color
          );

          if (
            productDoc &&
            Array.isArray(productDoc.images) &&
            productDoc.images.length
          ) {
            let matchedImage = productDoc.images.find((img) =>
              Array.isArray(img.variant_ids)
                ? img.variant_ids.map(String).includes(variantId)
                : false
            );

            if (!matchedImage) {
              matchedImage = productDoc.images.find((img) =>
                Array.isArray(img.colors)
                  ? img.colors.some((c) => normalize(c) === selectedColor)
                  : false
              );
            }

            if (!matchedImage) {
              matchedImage =
                productDoc.images.find((img) => img.is_default) ||
                productDoc.images[0];
            }

            if (matchedImage?.src?.startsWith('http')) {
              previewImage = matchedImage.src;
            }
          }
        }

        let configPayload = {};
        if (item.category === 'artisan' && !isFoundersToast) {
          configPayload = {
            size: (config.size || '').toString().trim(),
            depth: (config.depth || '').toString().trim(),
            lugQuantity: (config.lugQuantity || '').toString().trim(),
            staveQuantity: (config.staveQuantity || '').toString().trim(),
            reRing:
              typeof config.reRing !== 'undefined'
                ? !!config.reRing
                : undefined,
            hardwareColor: (config.hardwareColor || '').toString().trim(),
            outerShell: (config.outerShell || '').toString().trim(),
            innerStave: (config.innerStave || '').toString().trim(),
          };
        } else if (isMerch) {
          const sizeValue = config.Sizes || config.size || config.sizeName || '';
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
        if (isMerch) stripePriceId = ''; // use price_data for merch

        return {
          productId: String(item.productId),
          name: item.name || item.title || item.config?.title || 'Ober Product',
          category: item.category,
          stripePriceId,
          price: Number(item.price) || 0,
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
        console.error('❌ Checkout session create failed:', errorText);
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
      console.error('🔥 Checkout failed:', error);
      alert('There was a problem initiating checkout. Check console logs.');
      setShowCheckoutModal(false);
    }
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Shopping Cart</h1>

      {/* Shipping banner */}
      <div className={`ship-banner ${qualifiesForFree ? 'free' : 'not-free'}`}>
        <span className="ship-banner-line2">
          {qualifiesForFree ? 'FREE SHIPPING' : `Shipping: ${shippingDisplay}`}
        </span>
        {!qualifiesForFree && (
          <span className="ship-banner-nudge">{freeMsg}</span>
        )}
      </div>

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
                const selectedColorRaw = config.Colors || '';
                const normalize = (str) =>
                  (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const selectedColor = normalize(selectedColorRaw);

                let previewImage = item.image || fallback;
                if (item.category === 'artisan') {
                  previewImage =
                    item.image ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    fallback;
                } else if (item.category === 'merch') {
                  const product = productDataMap[item.productId];
                  if (product && Array.isArray(product.images)) {
                    const matchedImage =
                      product.images.find(
                        (img) =>
                          Array.isArray(img.variant_ids) &&
                          img.variant_ids.includes(Number(variantId)) &&
                          Array.isArray(img.colors) &&
                          img.colors.some(
                            (color) => normalize(color) === selectedColor
                          )
                      ) ||
                      product.images.find(
                        (img) =>
                          Array.isArray(img.variant_ids) &&
                          img.variant_ids
                            .map(String)
                            .includes(String(variantId))
                      ) ||
                      product.images.find(
                        (img) =>
                          Array.isArray(img.colors) &&
                          img.colors.some(
                            (color) => normalize(color) === selectedColor
                          )
                      ) ||
                      product.images.find((img) => img.is_default) ||
                      product.images[0];

                    if (matchedImage?.src?.startsWith('http')) {
                      previewImage = matchedImage.src;
                    }
                  }
                }

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
                      <p>
                        {item.name ||
                          item.title ||
                          item.config?.title ||
                          'Unnamed Product'}
                      </p>
                      <p className="cart-sub-description">
                        {item.category === 'artisan' &&
                        item.productId !== 'founders-toast' ? (
                          <>
                            {config.size && config.depth && (
                              <>
                                {config.size}" x {config.depth}" |{' '}
                              </>
                            )}
                            {config.lugQuantity && (
                              <>{config.lugQuantity}-Lug | </>
                            )}
                            {config.staveQuantity && (
                              <>{config.staveQuantity}-Stave | </>
                            )}
                            {typeof config.reRing !== 'undefined' &&
                              (config.reRing
                                ? 'With Re-Ring'
                                : 'Re-Rings: None')}
                            {item.productId !== 'founders-toast' &&
                              config.hardwareColor && (
                                <> | Hardware: {config.hardwareColor}</>
                              )}
                            {(config.outerShell || config.innerStave) && (
                              <>
                                <br />
                                {config.outerShell} / {config.innerStave}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {config.Sizes && <span>Size: {config.Sizes}</span>}
                            {config.Colors && (
                              <span>
                                {config.Sizes && ' | '}Color: {config.Colors}
                              </span>
                            )}
                            {(config.outerShell || config.innerStave) && (
                              <>
                                <br />
                                {config.outerShell} / {config.innerStave}
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </td>
                    <td>
                      {item.price !== undefined ? (
                        `$${Number(item.price).toFixed(2)}`
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

              {/* Shipping Row (informational) */}
              <tr className="cart-shipping-row">
                <td colSpan="5" className="shipping-label-td">
                  Shipping (Standard 7–10 business days)
                  {!qualifiesForFree && (
                    <div className="ship-nudge-inline">{freeMsg}</div>
                  )}
                </td>
                <td className="shipping-value-td">
                  <strong>{shippingDisplay}</strong>
                </td>
              </tr>

              {/* Subtotal Row */}
              <tr className="cart-subtotal-row">
                <td colSpan="5"></td>
                <td className="subtotal-cell">
                  <span className="subtotal-amount">
                    {formatMoney(subtotal)}
                  </span>
                </td>
              </tr>

              {/* Checkout Button Row aligned under subtotal */}
              <tr className="cart-checkout-row desktop-checkout-row">
                <td colSpan="6">
                  <div className="checkout-footer-row">
                    <button
                      onClick={handleCheckout}
                      className="checkout-button-inline"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : '🔒 Checkout'}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Mobile checkout button */}
          <div className="mobile-checkout-wrapper">
            <button
              onClick={handleCheckout}
              className="checkout-button-inline"
              disabled={loading}
            >
              {loading ? 'Processing...' : '🔒 Checkout'}
            </button>
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