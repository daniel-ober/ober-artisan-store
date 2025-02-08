import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Cart.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
  const { cart, cartId, removeFromCart, setCart, updateFirestoreCart } =
    useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState(0);
  const [unavailableProducts, setUnavailableProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lastSyncedCart, setLastSyncedCart] = useState(null);

  useEffect(() => {
    const syncCartWithProductData = async () => {
      if (!cart || !Array.isArray(cart) || cart.length === 0) return;
      if (JSON.stringify(cart) === JSON.stringify(lastSyncedCart)) return;

      setLastSyncedCart(cart);

      let updatedCart = [...cart];
      let unavailable = [];

      for (const item of updatedCart) {
        if (!item || !item.stripePriceId) {
          unavailable.push({ id: 'unknown', name: 'Unknown Product' });
          updatedCart = updatedCart.filter((i) => i.id !== item.id);
          continue;
        }

        // ✅ Get Firestore Product ID from the Cart Item
        const productRef = doc(db, 'products', item.productId || ''); // 🔹 Use `productId`, not `id`
        const productSnapshot = await getDoc(productRef);

        if (!productSnapshot.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.name}`);
          unavailable.push({ id: item.id, name: item.name });
          updatedCart = updatedCart.filter((i) => i.id !== item.id);
        }
      }

      if (unavailable.length > 0) {
        setUnavailableProducts(unavailable);
        setShowModal(true);
      }

      setCart(updatedCart);
      await updateFirestoreCart(updatedCart);
    };

    syncCartWithProductData();
  }, [cart, setCart, updateFirestoreCart, lastSyncedCart]);

  const closeModal = () => {
    setShowModal(false);
    setUnavailableProducts([]);
    setCart([...cart]);
  };

  const getItemTotal = (item) =>
    (Number(item.price) || 0) * (item.quantity || 1);
  const getTotalAmount = () =>
    cart.reduce((total, item) => total + getItemTotal(item), 0);

  const calculateShipping = () => {
    const totalWeight = cart.reduce(
      (total, item) => total + (item.weight || 1) * item.quantity,
      0
    );
    setShippingEstimate(10 + totalWeight * 2);
  };

  useEffect(() => {
    if (cart.length > 0) {
      calculateShipping();
    }
  }, [cart]);

  const handleCheckout = async () => {
    setLoading(true);

    const unavailable = [];
    const finalCart = [...cart];

    for (const product of cart) {
      const productRef = doc(db, 'products', product.productId);
      const productSnapshot = await getDoc(productRef);
      const productData = productSnapshot.data();

      if (!productData || product.quantity > productData.currentQuantity) {
        unavailable.push({
          id: product.id,
          name: productData ? productData.name : product.name,
        });
        finalCart.splice(finalCart.indexOf(product), 1);
      }
    }

    if (unavailable.length > 0) {
      setUnavailableProducts(unavailable);
      setShowModal(true);
      setLoading(false);
      return;
    }

    try {
      const productsPayload = cart.map((product) => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
      }));

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/create-checkout-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: productsPayload,
            userId: user?.uid || cartId,
          }),
        }
      );

      const session = await response.json();
      if (!response.ok)
        throw new Error(session.error || 'Failed to create checkout session');

      window.location.href = session.url;
    } catch (error) {
      alert(`Checkout error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Shopping Cart</h1>
      <p className="cart-id">
        Cart ID: {(cartId || user?.uid || 'guest').slice(-5)}
      </p>

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
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/products/${item.id}`}>
                      <img
                        src={
                          item.images?.[0] ||
                          '/fallback-images/image-not-available.png'
                        }
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </Link>
                  </td>
                  <td>
                    <p>{item.name}</p>
                    <p className="cart-sub-description">
                      {item.size}&quot; Diameter | {item.depth}&quot; Depth | {item.lugQuantity}-lug | {item.reRing ? 'With Re-Ring' : ''}
                    </p>
                  </td>
                  <td>${(Number(item.price) || 0).toFixed(2)}</td>
                  <td>
                    {item.category === 'artisan' ? (
                      <span>1</span>
                    ) : (
                      <span>{item.quantity}</span>
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
              ))}
            </tbody>
          </table>
          <div className="cart-summary">
            <p>Estimated Shipping: ${shippingEstimate.toFixed(2)}</p>
            <p>Total: ${(getTotalAmount() + shippingEstimate).toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="checkout-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Unavailable Products</h2>
            <p>
              The following items are no longer available and have been removed
              from your cart:
            </p>
            <ul>
              {unavailableProducts.map((product) => (
                <li key={product.id}>{product.name}</li>
              ))}
            </ul>
            <button onClick={closeModal} className="modal-close-button">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
