// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchCart } from '../redux/slices/cartSlice';

// const AppInitializer = () => {
//   const dispatch = useDispatch();
//   const userId = 'user123'; // Replace with actual user ID or obtain it dynamically
//   const cartStatus = useSelector((state) => state.cart.status);

//   useEffect(() => {
//     if (userId) {
//       dispatch(fetchCart(userId));
//     }
//   }, [dispatch, userId]);

//   if (cartStatus === 'loading') {
//     return <div>Loading cart...</div>;
//   }

//   return null; // Or some initialization logic
// };

// export default AppInitializer;
