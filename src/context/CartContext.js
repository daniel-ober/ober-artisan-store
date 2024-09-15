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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const userCart = await fetchUserCart(user.uid);
          setCart(userCart.cart || {});
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCart();
    } else {
      setCart({});
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (item) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      const cartRef = doc(firestore, 'users', user.uid);
      const userCart = cart || {};
      if (userCart[item.productId]) {
        // Item already in cart; do not increase quantity
        userCart[item.productId].quantity += 1;
      } else {
        // Add new item
        userCart[item.productId] = { ...item, quantity: 1 };
      }
      await updateDoc(cartRef, { cart: userCart });
      setCart(userCart);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      const cartRef = doc(firestore, 'users', user.uid);
      const updatedCart = { ...cart };
      if (updatedCart[id]) {
        updatedCart[id].quantity = quantity;
      }
      await updateDoc(cartRef, { cart: updatedCart });
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (id) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      const cartRef = doc(firestore, 'users', user.uid);
      const updatedCart = { ...cart };
      delete updatedCart[id];
      await updateDoc(cartRef, { cart: updatedCart });
      setCart(updatedCart);
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
