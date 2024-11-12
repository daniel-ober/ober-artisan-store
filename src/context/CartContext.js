import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure correct path to Firestore instance
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext for user authentication

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
                console.error('Error loading cart:', err);
                setError('Error loading cart. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, [user]);

    useEffect(() => {
        if (!user) {
            localStorage.setItem('cart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('cart');
        }
    }, [cart, user]);

    const addToCart = async (product) => {
        const isOneOfAKind = product.category === 'artisan';
        const existingItem = cart[product.id];

        if (isOneOfAKind && existingItem) {
            setError(`Cannot add more than one ${product.name} to the cart.`);
            return;
        }

        const updatedCart = {
            ...cart,
            [product.id]: {
                ...product,
                quantity: isOneOfAKind ? 1 : (existingItem?.quantity || 0) + 1,
            },
        };
        setCart(updatedCart);

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { cart: updatedCart });
            } catch (err) {
                console.error('Error updating cart:', err);
                setError('Error updating cart. Please try again later.');
            }
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (!cart[productId]) {
            setError(`Product ID ${productId} not found in cart.`);
            return;
        }

        const newQuantity = Math.max(quantity, 1);
        const updatedCart = {
            ...cart,
            [productId]: { ...cart[productId], quantity: newQuantity },
        };
        setCart(updatedCart);

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { [`cart.${productId}.quantity`]: newQuantity });
            } catch (err) {
                console.error('Error updating quantity:', err);
                setError('Error updating quantity. Please try again later.');
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
                console.error('Error removing item from cart:', err);
                setError('Error removing item from cart. Please try again later.');
            }
        }
    };

    const clearCart = async () => {
        setCart({});

        if (user) {
            try {
                const cartRef = doc(db, 'carts', user.uid);
                await updateDoc(cartRef, { cart: {} });
            } catch (err) {
                console.error('Error clearing cart:', err);
                setError('Error clearing cart. Please try again later.');
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
