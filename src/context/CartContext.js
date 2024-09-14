import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchProductById, addItemToCart, createCart } from '../services/firebaseService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const CartContext = createContext();

const fetchUserCart = async (userId) => {
  try {
    const cartRef = doc(firestore, 'carts', userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      return cartSnap.data();
    } else {
      return await createCart(userId);
    }
  } catch (error) {
    console.error('Error fetching user cart:', error);
    throw error;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const userCart = await fetchUserCart(user.uid);
          setCart(userCart.items || []);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      };
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const addToCart = async (item) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

      if (existingItemIndex > -1) {
        // Item already in cart; do not increase quantity
        return;
      }

      // Add new item
      const updatedCart = [...cart, { ...item, quantity: 1 }];
      await addItemToCart(user.uid, updatedCart);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setCart(prevCart => 
      prevCart.map(cartItem =>
        cartItem.id === id
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  const removeFromCart = (id) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setCart(prevCart => prevCart.filter(cartItem => cartItem.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
