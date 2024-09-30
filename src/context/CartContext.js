import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Correct path to Firestore instance
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext for user authentication
import { fetchUserCart } from '../services/firebaseService'; // Import the fetchUserCart function

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCart = async () => {
            if (user) {
                try {
                    const userCart = await fetchUserCart(user.uid);
                    setCart(userCart);
                } catch (error) {
                    console.error('Failed to load cart:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setCart({});
                setLoading(false);
            }
        };

        loadCart();
    }, [user]);

    const addToCart = async (product) => {
        const isOneOfAKind = product.category === "one of a kind" || product.category === "custom shop";
        const existingItem = cart[product._id];

        // If item is one of a kind, set quantity to 1
        if (isOneOfAKind && existingItem) {
            console.log(`Cannot add more than one ${product.name} to the cart.`);
            return; // Prevent adding more than one
        }

        const updatedCart = {
            ...cart,
            [product._id]: {
                ...product,
                quantity: isOneOfAKind ? 1 : (existingItem?.quantity || 0) + 1, // Set quantity to 1 if it's a one-of-a-kind item
            },
        };

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                
                // Check if the cart document exists
                const cartDoc = await getDoc(cartRef);
                if (cartDoc.exists()) {
                    // Update the existing document
                    await updateDoc(cartRef, updatedCart);
                } else {
                    // Create a new document if it does not exist
                    await setDoc(cartRef, updatedCart);
                }
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity: Math.max(quantity, 1) }, // Ensure quantity does not drop below 1
        };

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                await updateDoc(cartRef, updatedCart);
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const removeFromCart = async (productId) => {
        const updatedCart = { ...cart };
        delete updatedCart[productId];

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                await updateDoc(cartRef, updatedCart);
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, loading }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
