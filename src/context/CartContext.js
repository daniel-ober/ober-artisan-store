import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCart = async () => {
            setLoading(true);
            try {
                if (user) {
                    const cartRef = doc(db, 'carts', user.uid);
                    const cartDoc = await getDoc(cartRef);
                    setCart(cartDoc.exists() ? cartDoc.data().cart : {});
                } else {
                    const savedCart = JSON.parse(localStorage.getItem('cart')) || {};
                    setCart(savedCart);
                }
            } catch (err) {
                setError('Error loading cart. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, [user]);

    useEffect(() => {
        if (!user) localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart, user]);

    const addToCart = async (product) => {
        const updatedCart = {
            ...cart,
            [product.id]: {
                ...product,
                quantity: (cart[product.id]?.quantity || 0) + 1,
            },
        };
        setCart(updatedCart);

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await setDoc(cartRef, { cart: updatedCart });
            } catch (err) {
                setError('Error updating cart.');
            }
        }
    };

    const updateQuantity = async (productId, quantity) => {
        const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity },
        };
        setCart(updatedCart);

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { [`cart.${productId}.quantity`]: quantity });
            } catch (err) {
                setError('Error updating quantity.');
            }
        }
    };

    const removeFromCart = async (productId) => {
        const updatedCart = { ...cart };
        delete updatedCart[productId];
        setCart(updatedCart);

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { cart: updatedCart });
            } catch (err) {
                setError('Error removing item from cart.');
            }
        }
    };

    const clearCart = async () => {
        setCart({});
        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await setDoc(cartRef, { cart: {} });
            } catch (err) {
                setError('Error clearing cart.');
            }
        }
    };

    return (
        <CartContext.Provider value={{ cart, loading, error, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
