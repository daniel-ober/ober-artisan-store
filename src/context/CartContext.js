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

    const validateCart = (product) => {
        if (product.category === "artisan") {
            const existingArtisan = Object.values(cart).find(
                (item) => item.category === "artisan"
            );

            if (existingArtisan) {
                setError(`You can only add one "${existingArtisan.name}" to the cart.`);
                return false;
            }
        }
        return true;
    };

    const addToCart = async (product) => {
        if (!validateCart(product)) return;

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
                await setDoc(cartRef, { cart: {} }); // Clear the cart in Firestore for the user
            } catch (err) {
                setError('Error clearing cart.');
            }
        } else {
            localStorage.removeItem('cart'); // Remove cart from local storage for guest users
        }
    };

    const clearCartOnCheckout = () => {
        clearCart(); // Clear cart immediately after a successful checkout
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                error,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                clearCartOnCheckout, // Expose the function to clear cart on checkout
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
