import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Cart.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ✅ Use your known-good deployed backend URL directly
const API_BASE_URL =
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

const Cart = () => {
  const { cart, cartId, removeFromCart, setCart, updateFirestoreCart } =
    useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unavailableProducts, setUnavailableProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

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

          console.log('🧪 Inventory check:', {
            productId: item.productId,
            category: item.category,
            collection: collectionName,
          });
          console.log('📁 productSnapshot.exists:', productSnapshot.exists());
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
        setShowModal(true);
      }
    };

    checkInventory();
  }, [cart, cartId, setCart, updateFirestoreCart]);

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
    setShowModal(false);
    setUnavailableProducts([]);
  };

  const getItemTotal = (item) =>
    (Number(item.price) || 0) * (item.quantity || 1);
  const getTotalAmount = () =>
    cart.reduce((total, item) => total + getItemTotal(item), 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        setLoading(false);
        return;
      }

      const productsPayload = cart.map((product) => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        stripePriceId: product.stripePriceId,
      }));

      const response = await fetch(`${API_BASE_URL}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsPayload,
          userId: user?.uid || cartId,
        }),
      });

      const session = await response.json();
      if (!response.ok)
        throw new Error(session.error || 'Failed to create checkout session');

      window.location.href = session.url;
    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert(`Checkout error: ${error.message}`);
    } finally {
      setLoading(false);
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
                <th>Product</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                const fallback = '/fallback-images/image-not-available.png';
                const previewImage = Array.isArray(item.images)
                  ? item.images.find((img) =>
                      typeof img === 'string'
                        ? img.startsWith('http')
                        : img?.src?.startsWith('http')
                    )
                  : null;

                const config = item.config || {};

                return (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to={
                          item.category === 'artisan'
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
                          className="cart-item-image"
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
                        {item.category === 'artisan' ? (
                          <>
                            {config.size && config.depth && (
                              <>
                                {config.size}" x {config.depth}" |{' '}
                              </>
                            )}
                            {config.lugQuantity && (
                              <>{config.lugQuantity}-lug | </>
                            )}
                            {typeof config.reRing !== 'undefined' &&
                              (config.reRing
                                ? 'With Re-Ring'
                                : 'Re-Rings: None')}
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
  {item.category === 'artisan' ? (
    <span className="quantity-value">1</span>
  ) : (
    <div className="quantity-control">
      <button
        className="quantity-btn"
        onClick={() =>
          updateQuantity(item.id, Math.max(item.quantity - 1, 1))
        }
        disabled={item.quantity <= 1}
      >
        -
      </button>
      <span className="quantity-value">{item.quantity}</span>
      <button
        className="quantity-btn"
        onClick={() =>
          updateQuantity(
            item.id,
            Math.min(item.quantity + 1, item.currentQuantity)
          )
        }
        disabled={item.quantity >= item.currentQuantity}
      >
        +
      </button>
    </div>
  )}
</td>
                    <td>${getItemTotal(item).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={handleCheckout}
            className="checkout-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
          <p className="cart-id">
        Cart ID: {(cartId || user?.uid || 'guest').slice(-5)}
      </p>
        </>
      )}

      {showModal && (
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
    </div>
  );
};

export default Cart;
