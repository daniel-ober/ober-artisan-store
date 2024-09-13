import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './reducers/cartReducer'; // Import your actual reducer

const store = configureStore({
  reducer: {
    cart: cartReducer, // Assuming your cart logic is in the cartReducer
  },
});

export default store;
