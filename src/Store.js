// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './redux/cartSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

export default store;
