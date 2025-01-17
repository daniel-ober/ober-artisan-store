import React, { createContext, useState, useContext, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({});
  const [cartId, setCartId] = useState(""); // Track cartId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Cart
  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // Authenticated users
          const cartRef = doc(db, "carts", user.uid);
          const cartDoc = await getDoc(cartRef);
          if (cartDoc.exists()) {
            setCart(cartDoc.data().cart || {});
            setCartId(user.uid); // Use user ID as the cartId
          } else {
            setCart({});
            setCartId(user.uid);
            await setDoc(cartRef, { cart: {}, lastUpdated: serverTimestamp() }); // Initialize cart for new users
          }
        } else {
          // Guest users
          const localCart = JSON.parse(localStorage.getItem("cart")) || {};
          const localCartId = localStorage.getItem("cartId");
          if (!localCartId) {
            const generatedCartId = `cart-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("cartId", generatedCartId);
            setCartId(generatedCartId);
            // Create Firestore document for guest cart
            const cartRef = doc(db, "carts", generatedCartId);
            await setDoc(cartRef, { cart: {}, lastUpdated: serverTimestamp() });
          } else {
            setCartId(localCartId);
            const cartRef = doc(db, "carts", localCartId);
            const cartDoc = await getDoc(cartRef);
            if (cartDoc.exists()) {
              setCart(cartDoc.data().cart || {});
            } else {
              // If Firestore doc does not exist, create it
              await setDoc(cartRef, { cart: {}, lastUpdated: serverTimestamp() });
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

  // Save Cart to LocalStorage for Guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, user]);

  // Helper Function to Update Firestore
  const updateFirestoreCart = async (updatedCart) => {
    try {
      const cartRef = doc(db, "carts", user?.uid || cartId);
      await setDoc(
        cartRef,
        {
          cart: updatedCart,
          lastUpdated: serverTimestamp(), // Update the lastUpdated field
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error updating cart in Firestore:", err);
      setError("Error updating cart.");
    }
  };

  // Add Item to Cart
  const addToCart = async (product) => {
    const updatedCart = {
      ...cart,
      [product.id]: {
        ...product,
        quantity: (cart[product.id]?.quantity || 0) + 1,
      },
    };

    setCart(updatedCart);
    await updateFirestoreCart(updatedCart); // Update Firestore
  };

  // Update Quantity in Cart
  const updateQuantity = async (productId, quantity) => {
    const updatedCart = {
      ...cart,
      [productId]: { ...cart[productId], quantity },
    };

    setCart(updatedCart);
    await updateFirestoreCart(updatedCart); // Update Firestore
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    const updatedCart = { ...cart };
    delete updatedCart[productId];
    setCart(updatedCart);
    await updateFirestoreCart(updatedCart); // Update Firestore
  };

  // Clear Cart
  const clearCart = async () => {
    setCart({});
    try {
      const cartRef = doc(db, "carts", user?.uid || cartId);
      await setDoc(cartRef, { cart: {}, lastUpdated: serverTimestamp() }); // Clear the cart and update lastUpdated
    } catch (err) {
      console.error("Error clearing cart in Firestore:", err);
      setError("Error clearing cart.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId, // Expose cartId
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);