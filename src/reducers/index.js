// src/reducers/index.js
import { combineReducers } from 'redux';
import cartReducer from './cartReducer'; // Ensure this path is correct

const rootReducer = combineReducers({
  cart: cartReducer,
  // Add other reducers here
});

export default rootReducer;
