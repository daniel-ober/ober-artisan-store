// src/redux/store.js

import { createStore, combineReducers } from 'redux';
import cartReducer from './reducers/cartReducer'; // Ensure the path is correct

const rootReducer = combineReducers({
  cart: cartReducer,
  // Add other reducers here if needed
});

const store = createStore(rootReducer);

export default store;
