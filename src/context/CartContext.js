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

        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart));
            setLoading(false);
            return;
          } catch (err) {
            console.warn('Failed to parse localStorage cart:', err);
          }
        }

        const cartRef = doc(db, 'carts', cartUserId);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
          const firestoreCart = cartDoc.data().cart || [];
          setCart(firestoreCart);
          localStorage.setItem('cart', JSON.stringify(firestoreCart));
        } else {
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

  useEffect(() => {
    if (cart && Array.isArray(cart)) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  const updateFirestoreCart = async (updatedCart) => {
    if (!cartId) {
      console.warn('Cannot update Firestore: No cartId found.');
      return;
    }

    const cartRef = doc(db, 'carts', cartId);
    const cartDoc = await getDoc(cartRef);

    const deepSanitize = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
      }

      if (obj && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          const value = obj[key];
          if (value !== undefined) {
            result[key] = deepSanitize(value);
          }
        }
        return result;
      }

      return obj;
    };

    const sanitizedCart = updatedCart.map((item) =>
      deepSanitize({
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
        variantId: item.variantId !== undefined ? item.variantId : '',
        options: item.options || {},
        config: item.config || {},
        deliveryTime: item.deliveryTime || '',
        ...(item.description?.trim()
          ? { description: item.description.trim() }
          : {}),
        images: item.images || [],
        timestamp: item.timestamp || new Date().toISOString(),
      })
    );

    const cartTotal = sanitizedCart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const payload = {
      cart: sanitizedCart,
      cartTotal,
      lastUpdated: serverTimestamp(),
    };

    if (!cartDoc.exists()) {
      payload.createdAt = serverTimestamp();
      await setDoc(cartRef, payload);
      // console.log('🆕 Created new Firestore cart document:', cartId);
    } else {
      await updateDoc(cartRef, payload);
      // console.log('✅ Updated Firestore cart document:', cartId);
    }
  };

  const addToCart = async (product, selectedOptions = {}) => {
  if (!product || typeof product !== 'object') return;

  let currentCartId = cartId;
  if (!currentCartId) {
    currentCartId = generateCartId();
    localStorage.setItem('cartId', currentCartId);
    setCartId(currentCartId);
  }

  // ✅ Merge options and ensure lugQuantity is preserved
  const mergedOptions = {
    ...(product.options || {}),
    ...selectedOptions,
  };

  const lugQty = mergedOptions.lugQuantity || product.lugQuantity || '';

  const cartItem = {
    id: product.id,
    productId: String(product.productId ?? product.originalProductId ?? product.id),
    name: product.name || 'Unnamed Product',
    category: product.category || 'merch',
    quantity: 1,
    price: product.price,
    stripePriceId: product.stripePriceId || mergedOptions.stripePriceId || '',
    currentQuantity: product.currentQuantity || 1,
    maxQuantity: product.maxQuantity || 1,
    deliveryTime: product.deliveryTime || '',
    description: product.description || '',
    images: product.images || [],
    image: product.image || '',
    variantId: product.variantId || mergedOptions.variantId,
    lugQuantity: lugQty, // ✅ ensure saved at top-level
    config: {
      ...mergedOptions,
      size: product.size || mergedOptions.size,
      depth: product.depth || mergedOptions.depth,
      color: mergedOptions.color || product.color,
      reRing: product.reRing ?? mergedOptions.reRing,
      lugQuantity: lugQty, // ✅ ensure preserved in config
      staveQuantity: product.staveQuantity ?? mergedOptions.staveQuantity,
      outerShell: mergedOptions.outerShell,
      innerStave: mergedOptions.innerStave,
      hardwareColor: mergedOptions.hardwareColor || 'Chrome',
    },
    timestamp: new Date().toISOString(),
  };

  // console.log('🟢 Adding to Cart with lugQuantity:', lugQty);

  let updatedCart = [...cart];
  const existingItemIndex = updatedCart.findIndex(
    (item) => item.id === cartItem.id
  );

  if (existingItemIndex > -1) {
    updatedCart[existingItemIndex].quantity += 1;
  } else {
    updatedCart.push(cartItem);
  }

  setCart(updatedCart);

  try {
    const cartRef = doc(db, 'carts', currentCartId);
    const docSnap = await getDoc(cartRef);

    if (!docSnap.exists()) {
      await setDoc(cartRef, {
        cart: [],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    }

    await updateFirestoreCart(updatedCart);
  } catch (error) {
    console.error('Firestore Add Error:', error);
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
    const updatedCart = cart.filter((item) => item.id !== productId);
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
