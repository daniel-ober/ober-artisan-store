import React, { createContext, useState, useContext, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({});
  const [cartId, setCartId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // Registered user cart logic
          const cartRef = doc(db, "carts", user.uid);
          const cartDoc = await getDoc(cartRef);
          if (cartDoc.exists()) {
            setCart(cartDoc.data().cart || {});
            setCartId(user.uid);
          } else {
            setCart({});
            setCartId(user.uid);
            await setDoc(cartRef, { cart: {}, userId: user.uid, lastUpdated: serverTimestamp() });
          }
        } else {
          // Guest cart logic
          const localCart = JSON.parse(localStorage.getItem("cart")) || {};
          const localCartId = localStorage.getItem("cartId");

          if (!localCartId) {
            const generatedCartId = `cart-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("cartId", generatedCartId);
            setCartId(generatedCartId);

            const cartRef = doc(db, "carts", generatedCartId);
            await setDoc(cartRef, { cart: {}, userId: "guest", lastUpdated: serverTimestamp() });
          } else {
            setCartId(localCartId);
            const cartRef = doc(db, "carts", localCartId);
            const cartDoc = await getDoc(cartRef);
            if (cartDoc.exists()) {
              setCart(cartDoc.data().cart || {});
            } else {
              await setDoc(cartRef, { cart: {}, userId: "guest", lastUpdated: serverTimestamp() });
            }
          }
          setCart(localCart);
        }
      } catch (err) {
        console.error("Error initializing cart:", err);
        setError("Error loading cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, user]);

  const updateFirestoreCart = async (updatedCart) => {
    try {
      const cartRef = doc(db, "carts", user?.uid || cartId);
      await setDoc(
        cartRef,
        { cart: updatedCart, userId: user?.uid || "guest", lastUpdated: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error("Error updating cart in Firestore:", err);
      setError("Error updating cart.");
    }
  };

  const clearCartOnCheckout = async () => {
    setCart({});
    try {
      const cartRef = doc(db, "carts", user?.uid || cartId);
      await setDoc(cartRef, { cart: {}, userId: user?.uid || "guest", lastUpdated: serverTimestamp() });
    } catch (err) {
      console.error("Error clearing cart on checkout:", err);
      setError("Error clearing cart.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        loading,
        error,
        addToCart: async (product) => {
          const updatedCart = {
            ...cart,
            [product.id]: {
              ...product,
              quantity: (cart[product.id]?.quantity || 0) + 1,
            },
          };
          setCart(updatedCart);
          await updateFirestoreCart(updatedCart);
        },
        updateQuantity: async (productId, quantity) => {
          const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity },
          };
          setCart(updatedCart);
          await updateFirestoreCart(updatedCart);
        },
        removeFromCart: async (productId) => {
          const updatedCart = { ...cart };
          delete updatedCart[productId];
          setCart(updatedCart);
          await updateFirestoreCart(updatedCart);
        },
        clearCartOnCheckout,
        setCart, // Explicitly include setCart here
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);