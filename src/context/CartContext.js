// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Correct path to Firestore instance
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext for user authentication

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // State to manage error messages

    useEffect(() => {
        const loadCart = async () => {
            if (user) {
                const cartRef = doc(db, 'carts', user.uid);
                const cartDoc = await getDoc(cartRef);
                
                if (cartDoc.exists()) {
                    setCart(cartDoc.data().cart || {}); // Accessing the cart data correctly
                } else {
                    // Create a new cart document for the user if it doesn't exist
                    await setDoc(cartRef, { cart: {} });
                    setCart({});
                }
                setLoading(false);
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
        const isOneOfAKind = product.category === "artisan";
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
                const cartRef = doc(db, 'carts', user.uid);
                const cartDoc = await getDoc(cartRef);

                if (cartDoc.exists()) {
                    // Update the cart object directly
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

    // Update item quantity in cart
    const updateQuantity = async (productId, quantity) => {
        if (!cart[productId]) {
            console.warn(`Product ID ${productId} not found in cart.`);
            return;
        }

        const previousQuantity = cart[productId].quantity;
        const newQuantity = Math.max(quantity, 1); // Ensure quantity is at least 1
        const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity: newQuantity },
        };

        setCart(updatedCart);
        console.log(`Previous Quantity: ${previousQuantity} Change: ${quantity - previousQuantity} New Quantity: ${newQuantity}`);

        try {
            if (user) {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { [`cart.${productId}.quantity`]: newQuantity });
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            setError('Error updating quantity. Please try again later.');
        }
    };

    // Remove item from cart
    const removeFromCart = async (productId) => {
        const updatedCart = { ...cart };
        delete updatedCart[productId];
        setCart(updatedCart);

        try {
            if (user) {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { cart: updatedCart });
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
            setError('Error removing item from cart. Please try again later.');
        }
    };

    const clearCart = async () => {
        setCart({});

        try {
            if (user) {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { cart: {} });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            setError('Error clearing cart. Please try again later.');
        }
    };

    return (
        <CartContext.Provider value={{ cart, loading, error, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
