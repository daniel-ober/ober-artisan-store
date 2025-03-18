import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from '../redux/slices/cartSlice';

const AppInitializer = () => {
  const dispatch = useDispatch();
  const userId = 'user123'; // Replace with actual user ID or obtain it dynamically
  const cartStatus = useSelector((state) => state.cart.status);

  useEffect(() => {
    if (!cartId) return;
  
    const cartRef = doc(db, 'carts', cartId);
  
    // 🔄 Listen for real-time Firestore updates on the cart
    const unsubscribe = onSnapshot(cartRef, (cartSnapshot) => {
      if (cartSnapshot.exists()) {
        const cartData = cartSnapshot.data();
        // console.log('✅ Real-time cart update received:', cartData);
        setCart(Object.values(cartData.cart || {})); // Convert Firestore object to array
      } else {
        console.warn('⚠️ No cart found in Firestore');
        setCart([]);
      }
    });
  
    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, [cartId, setCart]);
};

export default AppInitializer;
