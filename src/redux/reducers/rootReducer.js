// src/redux/reducers/rootReducer.js
import { combineReducers } from "@reduxjs/toolkit";
import cartReducer from "./cartReducer";
import productsReducer from "./productsReducer";
import userReducer from "./userReducer";

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productsReducer,
  user: userReducer,
});

export default rootReducer;