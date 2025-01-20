// src/redux/slices/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: {}, // Cart items stored by product ID
  },
  reducers: {
    updateCartWithProductChanges: (state, action) => {
      const { cartItems, products } = action.payload;

      // Adjust cart items based on product availability
      Object.keys(cartItems).forEach((productId) => {
        const cartItem = cartItems[productId];
        const product = products[productId];

        if (product) {
          // Update quantity if it's greater than current stock
          if (cartItem.quantity > product.currentQuantity) {
            cartItem.quantity = product.currentQuantity;
          }

          // Remove item if it's out of stock
          if (product.currentQuantity === 0) {
            delete state.items[productId];
          } else {
            state.items[productId] = cartItem; // Update cart item
          }
        } else {
          // Remove item if the product no longer exists
          delete state.items[productId];
        }
      });
    },
  },
});

export const { updateCartWithProductChanges } = cartSlice.actions;
export default cartSlice.reducer;