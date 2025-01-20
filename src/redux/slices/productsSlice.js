// src/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const fetchProductUpdates = createAsyncThunk(
  "products/fetchUpdates",
  async () => {
    const productCollection = collection(db, "products");
    const snapshot = await getDocs(productCollection);

    const products = {};
    snapshot.forEach((doc) => {
      products[doc.id] = { id: doc.id, ...doc.data() };
    });

    return products; // Returns an object where keys are product IDs
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: {}, // Stores products by ID
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductUpdates.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProductUpdates.fulfilled, (state, action) => {
        state.items = action.payload; // Update products in the Redux store
        state.status = "succeeded";
      })
      .addCase(fetchProductUpdates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default productSlice.reducer;