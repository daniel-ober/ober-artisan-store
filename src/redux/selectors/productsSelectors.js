// src/redux/selectors/productsSelectors.js
import { createSelector } from '@reduxjs/toolkit';

export const selectProductsState = (state) => state.products;

export const selectProductItems = createSelector(
  [selectProductsState],
  (products) => products.items || []  // Ensure default value
);

export const selectProductStatus = createSelector(
  [selectProductsState],
  (products) => products.status
);

export const selectProductError = createSelector(
  [selectProductsState],
  (products) => products.error
);
