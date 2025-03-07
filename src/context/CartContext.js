import React, { createContext, useState, useContext, useEffect } from "react";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartId, setCartId] = useState("");
    const [cart, setCart] = useState([]); // ✅ Ensure cart is always an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /** ✅ Generate Unique Cart ID (Fully Alphanumeric, No `cart-` Prefix) */
    const generateCartId = () => {
        const timestamp = Date.now().toString(36); // Base36 timestamp
        const randomChars = Math.random().toString(36).substring(2, 10); // 8 random chars
        return `${timestamp}${randomChars}`; // Example: "2wvmy8k3z9"
    };

    /** ✅ Initialize Cart from Firestore or LocalStorage */
    useEffect(() => {
        const initializeCart = async () => {
            setLoading(true);
            try {
                let cartUserId = user?.uid || localStorage.getItem("cartId");

                // ✅ If no cart ID exists, generate a new one
                if (!cartUserId) {
                    cartUserId = generateCartId();
                    localStorage.setItem("cartId", cartUserId);
                }

                setCartId(cartUserId);

                const cartRef = doc(db, "carts", cartUserId);
                const cartDoc = await getDoc(cartRef);

                if (cartDoc.exists()) {
                    const firestoreCart = cartDoc.data().cart;
                    setCart(Array.isArray(firestoreCart) ? firestoreCart : []); // ✅ Ensure cart is always an array
                } else {
                    setCart([]); // ✅ Initialize as empty array
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

    /** ✅ Sync Cart to Firestore */
    const updateFirestoreCart = async (updatedCart) => {
        console.log("🔥 Saving Cart to Firestore:", updatedCart);
    
        if (!cartId) {
            console.warn("❌ Cannot update Firestore: No cartId found.");
            return;
        }
    
        // 🚨 Remove undefined or null values
        const sanitizedCart = updatedCart.map((item) => ({
            id: item.id || "N/A",
            name: item.name || "Unnamed Product",
            category: item.category || "unknown",
            quantity: item.quantity || 1,
            price: Number(item.price) || 0, 
            size: item.size || "N/A",
            depth: item.depth || "N/A",
            lugQuantity: item.lugQuantity || "N/A",
            staveQuantity: item.staveQuantity || "N/A",
            reRing: item.reRing ?? false,
            stripePriceId: item.stripePriceId || "",
            timestamp: new Date().toISOString()
        }));
    
        try {
            const cartRef = doc(db, "carts", cartId);
            await updateDoc(cartRef, { cart: sanitizedCart, lastUpdated: new Date() });
            console.log("✅ Cart successfully updated in Firestore!");
        } catch (error) {
            console.error("❌ Firestore Update Error:", error);
        }
    };

    /** ✅ Add Product to Cart */
    /** ✅ Add Product to Cart */
const addToCart = async (product, selectedOptions = {}) => {
    console.log("🛒 Adding Product to Cart", { product, selectedOptions });

    if (!product || typeof product !== "object") {
        console.error("❌ addToCart Error: product is not an object!", product);
        alert("An unexpected error occurred while adding the item to the cart.");
        return;
    }

    if (!cartId) {
        console.warn("❌ Cannot update Firestore: No cartId found.");
        alert("Cart ID is missing. Please reload the page.");
        return;
    }

    let updatedCart = [...cart];

    // 🔍 Check if the item already exists in the cart
    const existingItemIndex = updatedCart.findIndex((item) =>
        item.productId === product.productId &&
        item.size === selectedOptions.size &&
        item.depth === selectedOptions.depth &&
        item.lugQuantity === selectedOptions.lugQuantity &&
        item.staveQuantity === selectedOptions.staveQuantity &&
        item.reRing === selectedOptions.reRing
    );

    if (existingItemIndex > -1) {
        // ✅ If product exists, update quantity instead of duplicating
        updatedCart[existingItemIndex].quantity = Math.min(
            updatedCart[existingItemIndex].quantity + 1,
            product.maxQuantity || 1
        );
    } else {
        // ✅ Ensure price is a valid number
        const finalPrice = Number(selectedOptions.totalPrice) || Number(product.price) || 0;

        let newItem = {
            id: `${selectedOptions.stripePriceId}-${selectedOptions.size}-${selectedOptions.depth}-${selectedOptions.reRing}-${selectedOptions.lugQuantity}-${selectedOptions.staveQuantity}`,
            productId: product.productId,
            name: product.name || "Unnamed Product",
            category: product.category || "artisan",
            quantity: 1,
            price: finalPrice, // ✅ Fix: Ensure price is set
            size: selectedOptions.size || "N/A",
            depth: selectedOptions.depth || "N/A",
            lugQuantity: selectedOptions.lugQuantity || "N/A",
            staveQuantity: selectedOptions.staveQuantity || "N/A",
            reRing: selectedOptions.reRing ?? false,
            stripePriceId: selectedOptions.stripePriceId || "",
            currentQuantity: product.currentQuantity || 1,
            maxQuantity: product.maxQuantity || 1,
            timestamp: new Date().toISOString()
        };

        updatedCart.push(newItem);
    }

    console.log("✅ Final Cart State Before Saving to Firestore:", updatedCart);

    try {
        await updateFirestoreCart(updatedCart);
        setCart(updatedCart);
    } catch (error) {
        console.error("❌ Firestore Update Error:", error);
    }
};

    /** ✅ Increment or Decrement Quantity */
    const updateQuantity = async (productId, newQuantity) => {
        setCart((prevCart) => {
          const updatedCart = prevCart.map((item) =>
            item.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          );
          updateFirestoreCart(updatedCart); // Firestore update only happens after state update
          return updatedCart;
        });
      };

    /** ✅ Remove Product from Cart */
const removeFromCart = async (productId) => {
    console.log("🗑 Removing item from cart:", productId);

    let updatedCart = cart.filter((item) => item.id !== productId);

    setCart(updatedCart);
    await updateFirestoreCart(updatedCart);

    console.log("✅ Updated Cart State After Removal:", updatedCart);
};

    return (
        <CartContext.Provider
            value={{
                cart,
                cartId,
                loading,
                error,
                setCart, // ✅ Ensure setCart is provided!
                addToCart,
                updateQuantity,
                removeFromCart,
                updateFirestoreCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);