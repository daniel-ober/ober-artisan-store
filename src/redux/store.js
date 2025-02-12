// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './reducers/cartReducer'; // Ensure this exists

const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

export default store;