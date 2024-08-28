// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer'; // Adjust this path based on your actual file structure

const store = configureStore({
  reducer: rootReducer
});

export default store;
