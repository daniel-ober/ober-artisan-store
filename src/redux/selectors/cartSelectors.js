// src/redux/selectors/cartSelectors.js
import { createSelector } from '@reduxjs/toolkit';

export const selectCartState = (state) => state.cart;

export const selectCartItems = createSelector(
  [selectCartState],
  (cart) => cart.items || []  // Ensure default value is returned if cart is undefined
);

export const selectCartStatus = createSelector(
  [selectCartState],
  (cart) => cart.status
);

export const selectCartError = createSelector(
  [selectCartState],
  (cart) => cart.error
);
