// src/components/CartSync.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncCart } from '../redux/slices/cartSlice'; // Ensure you have a syncCart action
import { auth } from '../firebaseConfig';

const CartSync = () => {
  const dispatch = useDispatch();
  const userId = auth.currentUser?.uid; // Obtain user ID from Firebase auth
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    if (userId) {
      // Load cart from local storage when the user logs in
      const localCart = JSON.parse(localStorage.getItem('cart'));
      if (localCart) {
        dispatch(syncCart({ userId, cartItems: localCart }));
      }
    }
  }, [dispatch, userId]);

  return null; // Or some UI elements if needed
};

export default CartSync;
