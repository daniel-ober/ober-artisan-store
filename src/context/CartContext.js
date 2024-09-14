// /src/context/CartContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth hook
import { fetchProductById, addItemToCart, createCart } from '../services/firebaseService'; // Adjust import path as necessary
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import necessary Firestore methods
import { firestore } from '../firebaseConfig'; // Import firestore instance from your configuration

const CartContext = createContext();

// Fetch the cart for a specific user
const fetchUserCart = async (userId) => {
  try {
    const cartRef = doc(firestore, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      return cartSnap.data();
    } else {
      // If no cart exists, create one
      return await createCart(userId);
    }
  } catch (error) {
    console.error('Error fetching user cart:', error);
    throw error; // Ensure errors are thrown so they can be caught in calling functions
  }
};

// Update cart in Firestore
const updateUserCart = async (userId, updatedCart) => {
  try {
    const cartRef = doc(firestore, 'carts', userId);
    await updateDoc(cartRef, { items: updatedCart });
  } catch (error) {
    console.error('Error updating user cart:', error);
    throw error;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const userCart = await fetchUserCart(user.uid); // Fetch cart for current user
          setCart(userCart.items || []);
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCart();
    } else {
      setCart([]);
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (item) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      await addItemToCart(user.uid, item); // Add item to user's cart
      setCart(prevCart => {
        const updatedCart = [...prevCart, item];
        updateUserCart(user.uid, updatedCart); // Update Firestore
        return updatedCart;
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setCart(prevCart => {
      const updatedCart = prevCart.map(cartItem =>
        cartItem.id === id
          ? { ...cartItem, quantity }
          : cartItem
      );
      updateUserCart(user.uid, updatedCart); // Update Firestore
      return updatedCart;
    });
  };

  const removeFromCart = (id) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setCart(prevCart => {
      const updatedCart = prevCart.filter(cartItem => cartItem.id !== id);
      updateUserCart(user.uid, updatedCart); // Update Firestore
      return updatedCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
