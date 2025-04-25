import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartId, setCartId] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generateCartId = () => {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2, 10);
    return `${timestamp}${randomChars}`;
  };

  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        let cartUserId = user?.uid || localStorage.getItem('cartId');

        if (!cartUserId) {
          cartUserId = generateCartId();
          localStorage.setItem('cartId', cartUserId);
        }

        setCartId(cartUserId);

        const cartRef = doc(db, 'carts', cartUserId);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
          setCart(cartDoc.data().cart || []);
        } else {
          await setDoc(cartRef, { cart: [] });
          setCart([]);
        }
      } catch (err) {
        console.error('Error initializing cart:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user]);

  const updateFirestoreCart = async (updatedCart) => {
    if (!cartId) {
      console.warn('Cannot update Firestore: No cartId found.');
      return;
    }

    const sanitizedCart = updatedCart.map((item) => ({
      id: item.id || 'N/A',
      productId: item.productId || item.id || 'unknown',
      name: item.name || 'Unnamed Product',
      category: item.category || 'unknown',
      quantity: item.quantity || 1,
      price: item.price !== undefined ? Number(item.price) : 0,
      size: item.size || 'N/A',
      depth: item.depth || 'N/A',
      lugQuantity: item.lugQuantity || 'N/A',
      staveQuantity: item.staveQuantity || 'N/A',
      reRing: item.reRing ?? false,
      stripePriceId: item.stripePriceId || '',
      currentQuantity: item.currentQuantity || 1,
      maxQuantity: item.maxQuantity || 1,
      variantId: item.variantId || '',
      options: item.options || {},
      deliveryTime: item.deliveryTime || '',
      description: item.description || '',
      images: item.images || [],
      timestamp: new Date().toISOString(),
    }));

    try {
      const cartRef = doc(db, 'carts', cartId);
      await updateDoc(cartRef, {
        cart: sanitizedCart,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Firestore Update Error:', error);
    }
  };

  const addToCart = async (product, selectedOptions) => {
    if (!product || typeof product !== 'object') return;
    if (!cartId) return;

    const cartItem = {
      id: product.id,
      productId: product.id,
      name: product.name || 'Unnamed Product',
      category: product.category || 'merch',
      quantity: 1,
      price: product.price,
      stripePriceId: selectedOptions.stripePriceId || '',
      currentQuantity: product.currentQuantity || 1,
      maxQuantity: product.maxQuantity || 1,
      deliveryTime: product.deliveryTime || '',
      description: product.description || '',
      images: product.images || [],
      variantId: selectedOptions.variantId,
      options: selectedOptions,
      timestamp: new Date().toISOString(),
    };

    let updatedCart = [...cart];

    const existingItemIndex = updatedCart.findIndex(
      (item) => item.id === cartItem.id
    );

    if (existingItemIndex > -1) {
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      updatedCart.push(cartItem);
    }

    try {
      await updateFirestoreCart(updatedCart);
      setCart(updatedCart);
    } catch (error) {
      console.error('Firestore Update Error:', error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      updateFirestoreCart(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = async (productId) => {
    let updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    await updateFirestoreCart(updatedCart);
  };

  const clearCartOnCheckout = async () => {
    if (!cartId) return;
    try {
      const cartRef = doc(db, 'carts', cartId);
      await updateDoc(cartRef, { cart: [] });
      setCart([]);
      localStorage.removeItem('cartId');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        loading,
        error,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        updateFirestoreCart,
        clearCartOnCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
