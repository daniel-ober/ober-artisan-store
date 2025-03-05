// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartId, setCartId] = useState("");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /** ✅ Initialize Cart from Firestore or LocalStorage */
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
                    const firestoreCart = Array.isArray(cartDoc.data()?.cart) ? cartDoc.data().cart : [];
                    console.log("🛒 Firestore Cart Loaded:", firestoreCart);
                    setCart(firestoreCart);
                } else {
                    console.warn("⚠️ No cart found in Firestore, initializing empty cart.");
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

    /**
     * ✅ Sync Cart to Firestore
     */
    const updateFirestoreCart = async (updatedCart) => {
        if (!cartId) {
            console.warn("❌ Cannot update Firestore: No cartId found.");
            return;
        }

        console.log("🔥 Attempting to save to Firestore:", updatedCart);

        const cartRef = doc(db, "carts", cartId);

        try {
            // Ensure Firestore document exists before updating
            const cartSnapshot = await getDoc(cartRef);
            if (!cartSnapshot.exists()) {
                console.warn("⚠️ Cart document does not exist. Creating new cart document.");
                await setDoc(cartRef, { cart: [], userId: cartId, lastUpdated: serverTimestamp() });
            }

            // 🔄 Remove `undefined` fields from cart items
            const sanitizedCart = updatedCart.map(item => 
                Object.fromEntries(Object.entries(item).filter(([_, value]) => value !== undefined))
            );

            console.log("🔥 Firestore Data After Cleaning:", sanitizedCart);

            // ✅ Save sanitized cart
            await setDoc(cartRef, { 
                cart: sanitizedCart, 
                userId: cartId, 
                lastUpdated: serverTimestamp() 
            }, { merge: true });

            console.log("✅ Firestore Cart Successfully Updated!");
            setCart(updatedCart); // ✅ Only update local state after Firestore success

        } catch (err) {
            console.error("❌ Firestore Update Error:", err);
        }
    };

    /**
     * ✅ Add Product to Cart
     */
    const addToCart = async (updatedCart) => {
        console.log("🛒 Attempting to add/update product in cart:", updatedCart);
    
        if (!Array.isArray(updatedCart)) {
            console.error("❌ addToCart Error: updatedCart is not an array!", updatedCart);
            alert("An unexpected error occurred while adding the item to the cart.");
            return;
        }
    
        // 🚨 Validate Stripe Price ID for all items before proceeding
        for (const item of updatedCart) {
            if (!item.stripePriceId) {
                console.error("❌ Missing Stripe Price ID for item:", item);
                alert("A product is missing required payment information. Please refresh the page and try again.");
                return;
            }
        }
    
        console.log("✅ All products have valid Stripe Price IDs!");
    
        if (!cartId) {
            console.warn("❌ Cannot update Firestore: No cartId found.");
            return;
        }
    
        console.log("🔥 Attempting to save to Firestore:", updatedCart);
    
        const cartRef = doc(db, "carts", cartId);
    
        try {
            // ✅ Ensure Firestore document exists before updating
            const cartSnapshot = await getDoc(cartRef);
            if (!cartSnapshot.exists()) {
                console.warn("⚠️ Cart document does not exist. Creating new cart document.");
                await setDoc(cartRef, { cart: [], userId: cartId, lastUpdated: serverTimestamp() });
            }
    
            // 🔄 **Remove `undefined` fields from cart items**
            const sanitizedCart = updatedCart.map(item => 
                Object.fromEntries(Object.entries(item).filter(([_, value]) => value !== undefined))
            );
    
            console.log("🔥 Firestore Data After Cleaning:", sanitizedCart);
    
            // ✅ Save the sanitized cart
            await setDoc(cartRef, { 
                cart: sanitizedCart, 
                userId: cartId, 
                lastUpdated: serverTimestamp() 
            }, { merge: true });
    
            console.log("✅ Firestore Cart Successfully Updated!");
            setCart(sanitizedCart); // ✅ Only update local state after Firestore success
    
        } catch (err) {
            console.error("❌ Firestore Update Error:", err);
        }
    };
  
    /**
     * ✅ Remove Product from Cart
     */
    const removeFromCart = async (productId) => {
        console.log(`🛑 Removing item: ${productId}`);

        const updatedCart = cart.filter((item) => item.id !== productId);

        console.log("🛒 Updated Cart after Removal:", updatedCart.map(item => item.id));

        await updateFirestoreCart(updatedCart); // ✅ Sync Firestore before updating local state
        setCart(updatedCart);
    };

    /**
     * ✅ Clear Cart on Checkout
     */
    const clearCartOnCheckout = async () => {
        setCart([]);
        try {
            const cartRef = doc(db, "carts", cartId);
            await setDoc(cartRef, { cart: [], userId: user?.uid || "guest", lastUpdated: serverTimestamp() }, { merge: true });

            console.log("✅ Cart cleared after checkout");
        } catch (err) {
            console.error("❌ Error clearing cart on checkout:", err);
            setError("Error clearing cart.");
        }
    };

    /** ✅ Track when Cart Updates in Firestore */
    useEffect(() => {
        console.log("🛒 Cart Updated in Context:", cart);
    }, [cart]);

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