// src/context/CartContext.js
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
    const [error, setError] = useState(null); // State to manage error messages

    useEffect(() => {
        const loadCart = async () => {
            if (user) {
                try {
                    const userCart = await fetchUserCart(user.uid);
                    if (userCart && userCart.cart) {
                        setCart(userCart.cart);  // Accessing the cart data correctly
                    } else {
                        setCart({});  // Initialize with empty cart if no cart data
                    }
                } catch (error) {
                    console.error('Failed to load cart:', error);
                    setError('Failed to load cart. Please try again later.');
                } finally {
                    setLoading(false);
                }
            } else {
                const savedCart = JSON.parse(localStorage.getItem('cart')) || {};
                setCart(savedCart);
                setLoading(false);
            }
        };

        loadCart();
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.removeItem('cart'); // Clear local storage when user is logged in
        } else {
            localStorage.setItem('cart', JSON.stringify(cart)); // Save cart to local storage
        }
    }, [cart, user]);

    const addToCart = async (product) => {
        const isOneOfAKind = product.category === "one of a kind" || product.category === "custom shop";
        const existingItem = cart[product.id]; // Ensure to use product ID here correctly

        if (isOneOfAKind && existingItem) {
            setError(`Cannot add more than one ${product.name} to the cart.`);
            return;
        }

        const updatedCart = {
            ...cart,
            [product.id]: { // Use product ID correctly
                ...product,
                quantity: isOneOfAKind ? 1 : (existingItem?.quantity || 0) + 1,
            },
        };

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                const cartDoc = await getDoc(cartRef);

                if (cartDoc.exists()) {
                    // Update the cart object directly, not under another 'cart' field
                    await updateDoc(cartRef, { cart: updatedCart });
                } else {
                    // Create a new cart object for the user
                    await setDoc(cartRef, { cart: updatedCart });
                }
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            setError('Error updating cart. Please try again later.');
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (!cart[productId]) return;

        const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity: Math.max(quantity, 1) },
        };

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                await updateDoc(cartRef, { cart: updatedCart });
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            setError('Error updating cart. Please try again later.');
        }
    };

    const removeFromCart = async (productId) => {
        if (!cart[productId]) return;

        const updatedCart = { ...cart };
        delete updatedCart[productId];

        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                await updateDoc(cartRef, { cart: updatedCart });
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
            setError('Error removing item from cart. Please try again later.');
        }
    };

    // New function to clear the cart
    const clearCart = async () => {
        setCart({}); // Resets the cart to an empty object

        try {
            if (user) {
                const cartRef = doc(firestore, 'carts', user.uid);
                await updateDoc(cartRef, { cart: {} }); // Clear the cart in Firestore
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            setError('Error clearing cart. Please try again later.');
        }
    };

    useEffect(() => {
        console.log("Cart updated:", cart);
    }, [cart]);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, loading, error }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
