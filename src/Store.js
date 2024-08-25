// src/Store.js
import { createStore } from 'redux';
import rootReducer from './reducers'; // Ensure this points to your reducers/index.js

const store = createStore(rootReducer);

export default store;
