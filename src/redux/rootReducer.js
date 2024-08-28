// src/redux/rootReducer.js

import { combineReducers } from 'redux';
import cartReducer from './cartSlice';
import userReducer from './userSlice';
import productsReducer from './productsSlice'; // Make sure this path is correct

const rootReducer = combineReducers({
  cart: cartReducer,
  user: userReducer,
  products: productsReducer,
  // Add other reducers here
});

export default rootReducer;
