// src/redux/reducers/rootReducer.js
import { combineReducers } from 'redux';
import cartReducer from '../reducers/cartReducer'; // Correct this path
import productsReducer from '../slices/productsSlice'; // Correct this path
import userReducer from '../slices/userSlice'; // Correct this path

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productsReducer,
  user: userReducer,
});

export default rootReducer;
