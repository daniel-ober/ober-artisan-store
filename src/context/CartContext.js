import React, { createContext, useState, useContext, useEffect } from "react";
import { 
  doc, setDoc, updateDoc, deleteField, getDoc, serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartId, setCartId] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        let cartUserId = user?.uid || localStorage.getItem("cartId");

        if (!cartUserId) {
          cartUserId = `guest_${Math.random().toString(36).substring(2, 12)}`;
          localStorage.setItem("cartId", cartUserId);
        }

        setCartId(cartUserId);

        const cartRef = doc(db, "carts", cartUserId);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
          const firestoreCart = cartDoc.data().cart;
          setCart(firestoreCart ? Object.values(firestoreCart) : []);
        } else {
          setCart([]);
        }
      } catch (err) {
        console.error("❌ Error initializing cart:", err);
        setError("Error loading cart.");
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user]);

  const updateFirestoreCart = async (updatedCart) => {
    try {
      const cartUserId = user?.uid || cartId || localStorage.getItem("cartId");
      const cartRef = doc(db, "carts", cartUserId);
  
      const cartObject = updatedCart.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
  
      await setDoc(cartRef, {
        cart: cartObject,
        userId: cartUserId,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
  
      console.log("✅ Firestore Cart Updated:", cartObject);
    } catch (err) {
      console.error("❌ Error updating cart in Firestore:", err);
      setError("Error updating cart.");
    }
  };

  const addToCart = async (product) => {
    if (!product || !product.stripePriceId) {
        console.error("❌ Error: Product is missing a Stripe Price ID!", product);
        return;
    }

    console.log("🛒 Adding Product to Cart:", product);

    const lugQuantity = String(product.lugQuantity || "UnknownLugs");
    const staveQuantity = String(product.staveQuantity || "UnknownStaves");

    // ✅ Ensure every variant is uniquely identified
    const productId = `${product.stripePriceId}-${String(product.size).trim()}-${String(product.depth).trim()}-${product.reRing}-${lugQuantity}-${staveQuantity}`;

    let updatedCart = [...cart];

    const isArtisan = ["heritage", "feuzon", "soundlegend"].includes(product.productId);

    if (!isArtisan) {
        const existingItemIndex = updatedCart.findIndex((item) =>
            item.stripePriceId === product.stripePriceId &&
            String(item.size).trim() === String(product.size).trim() &&
            String(item.depth).trim() === String(product.depth).trim() &&
            item.reRing === product.reRing &&
            String(item.lugQuantity) === String(product.lugQuantity) &&
            String(item.staveQuantity) === String(product.staveQuantity)
        );

        if (existingItemIndex !== -1) {
            updatedCart[existingItemIndex].quantity += 1;
            console.log(`🔄 Incremented quantity for non-artisan item: ${productId}`);
            setCart(updatedCart);
            await updateFirestoreCart(updatedCart);
            return;
        }
    }

    // ✅ Add new item (always for artisan, only for new non-artisan items)
    updatedCart.push({ ...product, id: productId, lugQuantity, staveQuantity, quantity: 1 });
    console.log(`🆕 Added new item: ${productId}`);

    setCart(updatedCart);
    await updateFirestoreCart(updatedCart);
};

  const removeFromCart = async (productId) => {
    if (!cart || !Array.isArray(cart)) return;

    console.log(`🛑 Attempting to remove item: ${productId}`);

    let updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);

    try {
      const cartUserId = user?.uid || cartId || localStorage.getItem("cartId");
      const cartRef = doc(db, "carts", cartUserId);
      const cartSnapshot = await getDoc(cartRef);
      if (!cartSnapshot.exists()) return;
      const firestoreCart = cartSnapshot.data().cart || {};

      console.log("🛑 Firestore Cart Before Deletion:", firestoreCart);
      delete firestoreCart[productId];
      await updateDoc(cartRef, { cart: firestoreCart });

      console.log(`✅ Removed ${productId} from Firestore cart`);

      const updatedCartDoc = await getDoc(cartRef);
      if (updatedCartDoc.exists()) {
        const updatedFirestoreCart = updatedCartDoc.data().cart;
        setCart(updatedFirestoreCart ? Object.values(updatedFirestoreCart) : []);
        console.log("🔥 Firestore Cart After Deletion:", updatedFirestoreCart);
      }
    } catch (err) {
      console.error("❌ Error updating Firestore cart after removal:", err);
    }
  };

  const clearCartOnCheckout = async () => {
    setCart([]);
    try {
      const cartUserId = user?.uid || cartId;
      const cartRef = doc(db, "carts", cartUserId);
      await setDoc(cartRef, {
        cart: {},
        userId: user?.uid || "guest",
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      console.log("✅ Cart cleared after checkout");
    } catch (err) {
      console.error("❌ Error clearing cart on checkout:", err);
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
        setCart,
        updateFirestoreCart,
        addToCart,
        removeFromCart,
        clearCartOnCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);