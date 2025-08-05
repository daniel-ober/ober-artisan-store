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
      console.log('🔁 Back from Stripe: clearing checkout modal flag');
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
        if (!item || !item.stripePriceId || !item.productId) {
          console.warn(`⚠️ Skipping item with missing productId:`, item);
          continue;
        }

        try {
          const isMerch = item.category === 'merch';
          const collectionName = isMerch ? 'merchProducts' : 'products';

          const productId = String(item.productId); // 🔥 force string ID
          const productRef = doc(db, collectionName, productId);
          const productSnapshot = await getDoc(productRef);

          // console.log('🧪 Inventory check:', {
          //   productId: item.productId,
          //   category: item.category,
          //   collection: collectionName,
          // });
          // console.log('📁 productSnapshot.exists:', productSnapshot.exists());
          if (!productSnapshot.exists()) {
            console.warn(`⚠️ Product not found: ${item.name}`);
            unavailable.push({ id: item.id, name: item.name });
            updatedCart = updatedCart.filter((i) => i.id !== item.id);
            cartChanged = true;
            continue;
          }

          if (!isMerch) {
            const productData = productSnapshot.data();
            const availableStock = productData.currentQuantity ?? 0;

            if (availableStock <= 0) {
              console.warn(
                `🚨 ${productData.name} is out of stock. Removing from cart.`
              );
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

  const handleCheckout = async () => {
    setShowCheckoutModal(true);
    try {
      if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        setShowModal(false);
        return;
      }

      const normalize = (str) =>
        (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const productsPayload = cart.map((item) => {
        const config = item.config || {};
        const variantId = Number(item.variantId || config?.variantId);
        const selectedColorRaw = config.Colors || '';
        const selectedColor = normalize(selectedColorRaw);

        let previewImage = fallback;
        if (item.image?.startsWith('http')) {
          previewImage = item.image;
        } else if (item.category === 'artisan') {
          previewImage =
            (Array.isArray(item.images) &&
              item.images[0]?.src?.startsWith('http') &&
              item.images[0].src) ||
            (Array.isArray(item.images) &&
              typeof item.images[0] === 'string' &&
              item.images[0].startsWith('http') &&
              item.images[0]) ||
            fallback;
        } else if (item.category === 'merch') {
          const product = productDataMap[item.productId];
          if (product && Array.isArray(product.images)) {
            const matchedImage =
              product.images.find(
                (img) =>
                  Array.isArray(img.variant_ids) &&
                  img.variant_ids.map(String).includes(String(variantId)) &&
                  Array.isArray(img.colors) &&
                  img.colors.map((c) => normalize(c)).includes(selectedColor)
              ) ||
              product.images.find(
                (img) =>
                  Array.isArray(img.colors) &&
                  img.colors.map((c) => normalize(c)).includes(selectedColor)
              ) ||
              product.images.find(
                (img) =>
                  Array.isArray(img.variant_ids) &&
                  img.variant_ids.map(String).includes(String(variantId))
              ) ||
              product.images.find((img) => img.is_default) ||
              product.images[0];
            if (matchedImage?.src?.startsWith('http')) {
              previewImage = matchedImage.src;
            }
          }
        }

        // ✅ Build correct payload with lugQuantity explicitly included
        return {
          productId: item.productId,
          name: item.name || 'HERITAGE',
          stripePriceId: item.stripePriceId,
          price: item.price,
          quantity: item.quantity || 1,
          image: previewImage.startsWith('http') ? previewImage : undefined,
          config: {
            size: config.size || '',
            depth: config.depth || '',
            lugQuantity: config.lugQuantity || '', // ✅ FIXED
            staveQuantity: config.staveQuantity || '',
            reRing: typeof config.reRing !== 'undefined' ? config.reRing : '',
            hardwareColor: config.hardwareColor || '',
            outerShell: config.outerShell || '',
            innerStave: config.innerStave || '',
          },
        };
      });

      console.log('🧾 Payload being sent to Stripe API:', productsPayload);

      const response = await fetch(`${API_BASE_URL}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsPayload }),
      });

      const data = await response.json();

      if (data?.url) {
        sessionStorage.setItem('checkoutStarted', 'true');
        setShowCheckoutModal(false); // proactively turn off before navigation
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('There was a problem initiating checkout.');
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
                    {' '}
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
                      </p>{' '}
                <p className="cart-sub-description">
  {item.category === 'artisan' && item.productId !== 'founders-toast' ? (
    <>
      {config.size && config.depth && (
        <>
          {config.size}" x {config.depth}" |{' '}
        </>
      )}
      {config.lugQuantity && <>{config.lugQuantity}-Lug | </>}
      {config.staveQuantity && <>{config.staveQuantity}-Stave | </>}
      {typeof config.reRing !== 'undefined' &&
        (config.reRing ? 'With Re-Ring' : 'Re-Rings: None')}
      {item.productId !== 'founders-toast' && config.hardwareColor && (
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

              {/* ✅ Subtotal Row with Checkout Button */}
              {/* Subtotal Row */}
              <tr className="cart-subtotal-row">
                <td colSpan="5"></td>
                <td className="subtotal-cell">
                  <span className="subtotal-amount">
                    ${getTotalAmount().toFixed(2)}
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
