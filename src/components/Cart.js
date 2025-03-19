import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Cart.css';

// ✅ Debugging: Log Stripe Key to ensure it's being loaded
console.log("🔑 Stripe Publishable Key:", process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const stripePromise = loadStripe(`${process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}`);

const Cart = () => {
  const { cart, cartId, removeFromCart, setCart, updateFirestoreCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState(0);
  const [unavailableProducts, setUnavailableProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  console.log('🛒 Cart from Context:', cart);
  console.log('🆔 Cart ID:', cartId);
  console.log("🌍 API Base URL:", process.env.REACT_APP_API_URL); // ✅ Debugging Log

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
          const productRef = doc(db, 'products', item.productId);
          const productSnapshot = await getDoc(productRef);

          if (!productSnapshot.exists()) {
            console.warn(`⚠️ Product not found: ${item.name}`);
            unavailable.push({ id: item.id, name: item.name });
            updatedCart = updatedCart.filter((i) => i.id !== item.id);
            cartChanged = true;
            continue;
          }

          const productData = productSnapshot.data();
          const availableStock = productData.currentQuantity || 0;

          if (availableStock === 0) {
            console.warn(`🚨 ${productData.name} is out of stock. Removing from cart.`);
            unavailable.push({ id: item.id, name: item.name });
            updatedCart = updatedCart.filter((i) => i.id !== item.id);
            cartChanged = true;
          }
        } catch (error) {
          console.error(`❌ Error fetching product ${item.productId}:`, error);
        }
      }

      if (cartChanged) {
        setCart(updatedCart);
        await updateFirestoreCart(updatedCart); // ✅ Ensure `await` is used
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

  const getItemTotal = (item) => (Number(item.price) || 0) * (item.quantity || 1);
  const getTotalAmount = () => cart.reduce((total, item) => total + getItemTotal(item), 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const productsPayload = cart.map((product) => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        stripePriceId: product.stripePriceId,
      }));

      console.log("📡 Sending Checkout Request to:", process.env.REACT_APP_API_URL); // ✅ Debugging

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}createCheckoutSession`,
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
      if (!response.ok) throw new Error(session.error || 'Failed to create checkout session');

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
      <p className="cart-id">Cart ID: {(cartId || user?.uid || 'guest').slice(-5)}</p>

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
                    <img
                      src={item.image || '/fallback-images/image-not-available.png'}
                      alt={item.name}
                      className="cart-item-image"
                    />
                  </td>
                  <td>
                    <p>{item.name}</p>
                    <p className="cart-sub-description">
                      {item.size}" Diameter | {item.depth}" Depth | {item.lugQuantity}-lug |{' '}
                      {item.reRing ? 'With Re-Ring' : 'Re-Rings: None'}
                    </p>
                  </td>
                  <td>{item.price !== undefined ? `$${Number(item.price).toFixed(2)}` : <span style={{ color: "red" }}>⚠️ Missing Price</span>}</td>
                  <td>
                    {item.category === 'artisan' ? (
                      <span className="quantity-value">1</span>
                    ) : (
                      <div className="quantity-control">
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, Math.max(item.quantity - 1, 1))} disabled={item.quantity <= 1}>-</button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.currentQuantity))} disabled={item.quantity >= item.currentQuantity}>+</button>
                      </div>
                    )}
                  </td>
                  <td>${getItemTotal(item).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleCheckout} className="checkout-button" disabled={loading}>{loading ? 'Processing...' : 'Checkout'}</button>
        </>
      )}
    </div>
  );
};

export default Cart;
