// src/redux/selectors.js
import { createSelector } from 'reselect';

const selectCartItems = (state) => state.cart.items;

export const memoizedSelectCartItems = createSelector(
  [selectCartItems],
  (items) => items
);
