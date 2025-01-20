// src/components/CartSync.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCartWithProductChanges } from '../redux/slices/cartSlice'; // Ensure this action handles cart synchronization
import { auth } from '../firebaseConfig';

const CartSync = () => {
  const dispatch = useDispatch();
  const userId = auth.currentUser?.uid; // Get the user ID from Firebase auth
  const cartItems = useSelector((state) => state.cart.items); // Select cart items from Redux store
  const products = useSelector((state) => state.products.items); // Select products from Redux store

  // Sync cart with product updates
  useEffect(() => {
    const syncCartWithProductUpdates = async () => {
      if (cartItems && Object.keys(products).length > 0) {
        try {
          // Adjust the cart based on the latest product `currentQuantity`
          await dispatch(updateCartWithProductChanges({ cartItems, products }));
        } catch (error) {
          console.error('Error syncing cart with product updates:', error);
        }
      }
    };

    syncCartWithProductUpdates();
  }, [dispatch, cartItems, products]);

  // Load cart from local storage for logged-in users
  useEffect(() => {
    if (userId) {
      const localCart = JSON.parse(localStorage.getItem('cart'));
      if (localCart) {
        dispatch(updateCartWithProductChanges({ cartItems: localCart, products }));
      }
    }
  }, [dispatch, userId, products]);

  return null; // No UI needed for CartSync
};

export default CartSync;