// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { fetchCartFromFirestore, updateCartInFirestore } from '../../firebaseService'; // Import Firestore functions

// const initialState = {
//   items: [],
//   status: 'idle',  // Can be 'idle', 'loading', 'succeeded', or 'failed'
//   error: null,
// };

// // Async Thunk for fetching cart items from Firestore
// export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId) => {
//   const cartItems = await fetchCartFromFirestore(userId);
//   return cartItems;
// });

// // Async Thunk for syncing cart items with Firestore
// export const syncCart = createAsyncThunk('cart/syncCart', async ({ userId, cartItems }) => {
//   await updateCartInFirestore(userId, cartItems);
// });

// // Create the slice
// const cartSlice = createSlice({
//   name: 'cart',
//   initialState,
//   reducers: {
//     addToCart: (state, action) => {
//       const { id, name, description, price, imageUrl } = action.payload;
//       const existingItem = state.items.find((item) => item.id === id);

//       if (!existingItem) {
//         state.items.push({ id, name, description, price, imageUrl });
//       }
//     },
//     removeFromCart: (state, action) => {
//       state.items = state.items.filter((item) => item.id !== action.payload);
//     },
//     clearCart: (state) => {
//       state.items = [];
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchCart.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(fetchCart.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.items = action.payload;
//       })
//       .addCase(fetchCart.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.error.message;
//       })
//       .addCase(syncCart.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(syncCart.fulfilled, (state) => {
//         state.status = 'succeeded';
//       })
//       .addCase(syncCart.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.error.message;
//       });
//   },
// });

// // Export the action creators and reducer
// export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
// export default cartSlice.reducer;
