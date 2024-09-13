import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncCart } from '../redux/slices/cartSlice';
import { auth } from '../firebaseConfig';

const CartSync = () => {
  const dispatch = useDispatch();
  const userId = auth.currentUser?.uid; // Obtain user ID from Firebase auth
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    if (userId) {
      dispatch(syncCart({ userId, cartItems }));
    }
  }, [dispatch, userId, cartItems]);

  return null; // Or some UI elements if needed
};

export default CartSync;
