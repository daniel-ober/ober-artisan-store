// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers/rootReducer'; // Correct this path

const store = configureStore({
  reducer: rootReducer,
});

export default store;
