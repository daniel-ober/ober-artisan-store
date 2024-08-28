// src/redux/productsSlice.js

import { createSlice } from '@reduxjs/toolkit';

const productsSlice = createSlice({
  name: 'products',
  initialState: { list: [] },
  reducers: {
    setProducts(state, action) {
      state.list = action.payload;
    },
    // Add other product-related reducers if needed
  }
});

export const { setProducts } = productsSlice.actions;
export default productsSlice.reducer;
